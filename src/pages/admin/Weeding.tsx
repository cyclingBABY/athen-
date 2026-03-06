import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const Weeding = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-weeding"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("updated_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Weeding (Record Deletion)" description="Review and remove outdated, damaged, or irrelevant catalog items">
      <p className="text-sm text-muted-foreground mb-4">Items sorted by last updated — oldest first. Review candidates for removal from the collection.</p>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><input type="checkbox" className="rounded border-input" /></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Copies</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : books?.map(b => (
              <TableRow key={b.id}>
                <TableCell><input type="checkbox" className="rounded border-input" /></TableCell>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell>{b.author}</TableCell>
                <TableCell><Badge variant="secondary">{b.category}</Badge></TableCell>
                <TableCell>{b.publish_year || "—"}</TableCell>
                <TableCell>{b.total_copies}</TableCell>
                <TableCell><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Weeding;
