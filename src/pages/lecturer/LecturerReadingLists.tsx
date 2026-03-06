import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import { ListChecks, Plus, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LecturerReadingLists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");

  const { data: lists, isLoading } = useQuery({
    queryKey: ["reading-lists", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_reading_lists")
        .select("*, reading_list_items(id, book_id, is_required, books(title, author))")
        .eq("lecturer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const createList = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("course_reading_lists").insert({
        lecturer_id: user!.id,
        course_name: courseName,
        course_code: courseCode || null,
        semester: semester || null,
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-lists"] });
      setShowForm(false);
      setCourseName(""); setCourseCode(""); setSemester(""); setDescription("");
      toast({ title: "Reading list created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteList = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_reading_lists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading-lists"] });
      toast({ title: "Reading list deleted" });
    },
  });

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <LecturerLayout title="Course Reading Lists" description="Create and manage reading lists for your courses">
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Reading List
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Course Name *</label>
              <input value={courseName} onChange={(e) => setCourseName(e.target.value)} className={inputClass} placeholder="e.g. Data Structures" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Course Code</label>
              <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} className={inputClass} placeholder="e.g. CS201" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Semester</label>
              <input value={semester} onChange={(e) => setSemester(e.target.value)} className={inputClass} placeholder="e.g. Fall 2026" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={2} placeholder="Optional description" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createList.mutate()} disabled={!courseName || createList.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createList.isPending ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-secondary">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !lists?.length ? (
        <div className="text-center py-20">
          <ListChecks className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No reading lists yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list: any) => (
            <div key={list.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{list.course_name}</h3>
                  <div className="flex gap-3 mt-1">
                    {list.course_code && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{list.course_code}</span>}
                    {list.semester && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{list.semester}</span>}
                  </div>
                  {list.description && <p className="text-sm text-muted-foreground mt-2">{list.description}</p>}
                </div>
                <button onClick={() => deleteList.mutate(list.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                {list.reading_list_items?.length || 0} books in list
              </div>
            </div>
          ))}
        </div>
      )}
    </LecturerLayout>
  );
};

export default LecturerReadingLists;
