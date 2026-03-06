import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import { Library, Download } from "lucide-react";

const LecturerDigitalLibrary = () => {
  const { data: digitalBooks, isLoading } = useQuery({
    queryKey: ["digital-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("*")
        .not("digital_file_url", "is", null)
        .order("title");
      return data ?? [];
    },
  });

  return (
    <LecturerLayout title="Digital Library" description="Browse and access digital resources">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !digitalBooks?.length ? (
        <div className="text-center py-20">
          <Library className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No digital resources available yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {digitalBooks.map((book: any) => (
            <div key={book.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground mt-1 inline-block">{book.digital_file_type?.toUpperCase()}</span>
              </div>
              <a href={book.digital_file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                <Download className="w-4 h-4" /> Open
              </a>
            </div>
          ))}
        </div>
      )}
    </LecturerLayout>
  );
};

export default LecturerDigitalLibrary;
