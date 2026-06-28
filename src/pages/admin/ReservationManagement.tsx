import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

const ReservationManagement = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data: reservationsData, error } = await supabase
        .from("reservations")
        .select("*, books(title, author, shelf_location, digital_file_url), profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const bookIds = (reservationsData || []).map((r: any) => r.book_id);
      let activeLoans: any[] = [];
      if (bookIds.length > 0) {
        const { data: loans } = await supabase
          .from("circulation_records")
          .select("*, profiles(full_name, email)")
          .in("book_id", bookIds)
          .eq("status", "checked-out");
        activeLoans = loans || [];
      }
      
      const loansMap = Object.fromEntries(
        activeLoans.map((l: any) => [l.book_id, l])
      );

      return (reservationsData || []).map((r: any) => ({
        ...r,
        active_loan: loansMap[r.book_id] || null
      }));
    },
  });

  const getProgress = (checkoutDate: string, dueDate: string) => {
    const start = new Date(checkoutDate);
    const end = new Date(dueDate);
    const now = new Date();
    const total = differenceInDays(end, start) || 14;
    const elapsed = differenceInDays(now, start);
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 5), 100);
  };

  const takenMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch reservation info
      const { data: res, error: fetchErr } = await supabase
        .from("reservations")
        .select("book_id, user_id")
        .eq("id", id)
        .single();
      
      if (fetchErr || !res) throw new Error(fetchErr?.message || "Reservation not found");

      // 2. Insert circulation record
      const checkoutDate = new Date().toISOString();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: circErr } = await supabase.from("circulation_records").insert({
        book_id: res.book_id,
        user_id: res.user_id,
        status: "checked-out",
        checkout_date: checkoutDate,
        due_date: dueDate
      });
      if (circErr) throw circErr;

      // 3. Update book availability
      const { data: book } = await supabase.from("books").select("available_copies").eq("id", res.book_id).single();
      if (book) {
        await supabase.from("books").update({
          available_copies: Math.max(0, book.available_copies - 1),
          status: book.available_copies - 1 <= 0 ? "checked-out" : "available"
        }).eq("id", res.book_id);
      }

      // 4. Update reservation status to fulfilled
      const { error: resErr } = await supabase.from("reservations").update({ status: "fulfilled" }).eq("id", id);
      if (resErr) throw resErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-holds-circulation"] });
      qc.invalidateQueries({ queryKey: ["admin-booktracking"] });
      toast({ title: "Book marked as Taken & checked out" });
    },
    onError: (err: any) => {
      toast({ title: "Error checking out book", description: err.message, variant: "destructive" });
    }
  });

  const notTakenMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast({ title: "Reservation marked as Not Taken (Cancelled)" });
    },
    onError: (err: any) => {
      toast({ title: "Error updating reservation", description: err.message, variant: "destructive" });
    }
  });

  return (
    <AdminLayout title="Reservation Management" description="Manage patron holds, queue positions, and reservation fulfillment">
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Shelf Location</TableHead>
              <TableHead>Reserved By</TableHead>
              <TableHead>Current Status / Borrower</TableHead>
              <TableHead>Reading Progress</TableHead>
              <TableHead>Reserved On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : reservations?.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No reservations</TableCell></TableRow>
            ) : reservations?.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{(r.books as any)?.title || "Unknown"}</TableCell>
                <TableCell>{(r.books as any)?.author || "—"}</TableCell>
                <TableCell>
                  {!(r.books as any)?.digital_file_url && (r.books as any)?.shelf_location ? (
                    <Badge variant="outline" className="font-mono text-xs">{(r.books as any).shelf_location}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{(r.profiles as any)?.full_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">{(r.profiles as any)?.email || ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {r.active_loan ? (
                    <div>
                      <span className="inline-flex text-[9px] font-semibold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-1.5 py-0.5 rounded mb-1">Checked Out</span>
                      <p className="font-medium text-sm">{(r.active_loan.profiles as any)?.full_name || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground">{(r.active_loan.profiles as any)?.email || ""}</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                      Available on Shelf
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.active_loan ? (
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span>Progress</span>
                        <span>{getProgress(r.active_loan.checkout_date, r.active_loan.due_date)}%</span>
                      </div>
                      <Progress value={getProgress(r.active_loan.checkout_date, r.active_loan.due_date)} className="h-1.5" />
                      <p className="text-[9px] text-muted-foreground">
                        Due: {format(new Date(r.active_loan.due_date), "MMM d")}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "active" ? "default" : r.status === "fulfilled" ? "secondary" : "destructive"} className="capitalize">
                    {r.status === "fulfilled" ? "taken" : r.status === "cancelled" ? "not taken" : r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.status === "active" && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                        onClick={() => takenMutation.mutate(r.id)}
                      >
                        Taken
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 hover:text-rose-700 border-rose-500/20 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
                        onClick={() => notTakenMutation.mutate(r.id)}
                      >
                        Not Taken
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default ReservationManagement;
