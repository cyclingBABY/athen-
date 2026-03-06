import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

const ShelfLocation = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books-shelf"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("id, title, author, category, status").order("category").order("title");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Shelf Location Assignment" description="Assign and manage physical shelf locations for catalog items">
      <div className="flex gap-3 mb-4">
        <Button variant="outline"><MapPin className="w-4 h-4 mr-2" />Auto-Assign by Category</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Shelf Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : books?.map(book => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">Not assigned</TableCell>
                <TableCell><Button variant="ghost" size="sm">Assign</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default ShelfLocation;
