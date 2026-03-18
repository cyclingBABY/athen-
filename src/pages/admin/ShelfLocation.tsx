import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const shelfMap: Record<string, string> = {
  Fiction: "A1-A5", Science: "B1-B3", History: "C1-C4", Philosophy: "D1-D2",
  Psychology: "E1-E2", "Sci-Fi": "F1-F3", Fantasy: "F4-F6", Biography: "G1-G2",
  Technology: "H1-H3", Art: "I1-I2", Reference: "R1-R5", General: "Z1-Z10", Digital: "DIG",
};

const ShelfLocation = () => {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [shelfValue, setShelfValue] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books-shelf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, category, status, shelf_location, digital_file_url")
        .is("digital_file_url", null)
        .order("category")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const updateShelf = useMutation({
    mutationFn: async ({ id, shelf_location }: { id: string; shelf_location: string }) => {
      const { error } = await supabase.from("books").update({ shelf_location }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books-shelf"] });
      toast({ title: "Shelf location updated" });
      setEditId(null);
    },
  });

  const autoAssign = useMutation({
    mutationFn: async () => {
      const booksToUpdate = books?.filter(b => !b.shelf_location) || [];
      for (const book of booksToUpdate) {
        const shelf = shelfMap[book.category] || "Z1-Z10";
        const row = Math.floor(Math.random() * 5) + 1;
        await supabase.from("books").update({ shelf_location: `${shelf.split("-")[0]}-Row${row}` }).eq("id", book.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books-shelf"] });
      toast({ title: "Shelf locations auto-assigned" });
    },
  });

  const filtered = books?.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Shelf Location Assignment" description="Assign and manage physical shelf locations for physical catalog items (digital-only books are excluded)">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search books…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => autoAssign.mutate()} disabled={autoAssign.isPending}>
          <MapPin className="w-4 h-4 mr-2" />{autoAssign.isPending ? "Assigning…" : "Auto-Assign Unassigned"}
        </Button>
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
            ) : filtered?.map(book => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                <TableCell>
                  {book.shelf_location ? (
                    <Badge variant="outline">{book.shelf_location}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { setEditId(book.id); setShelfValue(book.shelf_location || ""); }}>
                    {book.shelf_location ? "Edit" : "Assign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editId} onOpenChange={() => setEditId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Shelf Location</DialogTitle></DialogHeader>
          <div><Label>Shelf Location</Label><Input value={shelfValue} onChange={e => setShelfValue(e.target.value)} placeholder="e.g. A1-Row3" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
            <Button onClick={() => editId && updateShelf.mutate({ id: editId, shelf_location: shelfValue })}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ShelfLocation;
