import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Circulation = () => {
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["admin-circulation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circulation_records")
        .select("*, books(title, author)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: books } = useQuery({
    queryKey: ["available-books"],
    queryFn: async () => {
      const { data } = await supabase.from("books").select("id, title, author").eq("status", "available").order("title");
      return data || [];
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      // Find patron by email
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", userEmail).maybeSingle();
      if (!profile) throw new Error("User not found with that email");
      
      const { error } = await supabase.from("circulation_records").insert({
        book_id: selectedBook,
        user_id: profile.user_id,
      });
      if (error) throw error;

      // Update book status
      await supabase.from("books").update({ status: "checked-out", available_copies: supabase.rpc ? 0 : 0 }).eq("id", selectedBook);
      // Decrement available copies
      const { data: book } = await supabase.from("books").select("available_copies").eq("id", selectedBook).single();
      if (book) {
        await supabase.from("books").update({ 
          available_copies: Math.max(0, book.available_copies - 1),
          status: book.available_copies - 1 <= 0 ? "checked-out" : "available"
        }).eq("id", selectedBook);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-circulation"] });
      qc.invalidateQueries({ queryKey: ["available-books"] });
      toast({ title: "Book checked out successfully" });
      setCheckoutOpen(false);
      setSelectedBook("");
      setUserEmail("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const checkinMutation = useMutation({
    mutationFn: async (record: any) => {
      const { error } = await supabase.from("circulation_records")
        .update({ status: "returned", return_date: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      // Increment available copies
      const { data: book } = await supabase.from("books").select("available_copies").eq("id", record.book_id).single();
      if (book) {
        await supabase.from("books").update({ available_copies: book.available_copies + 1, status: "available" }).eq("id", record.book_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-circulation"] });
      qc.invalidateQueries({ queryKey: ["available-books"] });
      toast({ title: "Book checked in" });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (record: any) => {
      const newDue = new Date(record.due_date);
      newDue.setDate(newDue.getDate() + 14);
      const { error } = await supabase.from("circulation_records")
        .update({ due_date: newDue.toISOString(), renewed_count: record.renewed_count + 1 })
        .eq("id", record.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-circulation"] });
      toast({ title: "Book renewed for 14 days" });
    },
  });

  const filtered = records?.filter(r => {
    const title = (r.books as any)?.title || "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout title="Circulation (Check-in / Check-out)" description="Manage book check-ins, check-outs, and renewals">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by book title…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => setCheckoutOpen(true)}><ArrowRightLeft className="w-4 h-4 mr-2" />New Check-out</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Checkout Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Return Date</TableHead>
              <TableHead>Renewals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No circulation records</TableCell></TableRow>
            ) : filtered?.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{(r.books as any)?.title || "Unknown"}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.checkout_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.due_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm">{r.return_date ? format(new Date(r.return_date), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell>{r.renewed_count}/2</TableCell>
                <TableCell>
                  <Badge variant={r.status === "checked-out" ? "default" : r.status === "returned" ? "secondary" : "destructive"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === "checked-out" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => checkinMutation.mutate(r)}>Check In</Button>
                      <Button variant="ghost" size="sm" disabled={r.renewed_count >= 2} onClick={() => renewMutation.mutate(r)}>Renew</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Book Check-out</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Patron Email</Label>
              <Input value={patronEmail} onChange={e => setPatronEmail(e.target.value)} placeholder="patron@example.com" />
            </div>
            <div>
              <Label>Select Book</Label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger><SelectValue placeholder="Choose a book…" /></SelectTrigger>
                <SelectContent>
                  {books?.map(b => <SelectItem key={b.id} value={b.id}>{b.title} — {b.author}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={() => checkoutMutation.mutate()} disabled={!selectedBook || !patronEmail || checkoutMutation.isPending}>
              {checkoutMutation.isPending ? "Processing…" : "Check Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Circulation;
