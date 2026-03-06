import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const HoldManagement = () => {
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, books(title, author)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Hold & Reservation Management" description="Manage patron holds, queue positions, and reservation fulfillment">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Reserved On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : reservations?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No reservations</TableCell></TableRow>
            ) : reservations?.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{(r.books as any)?.title || "Unknown"}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.reservation_date), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "active" ? "default" : r.status === "fulfilled" ? "secondary" : "destructive"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {r.status === "active" && (
                      <>
                        <Button variant="ghost" size="sm">Fulfill</Button>
                        <Button variant="ghost" size="sm">Cancel</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default HoldManagement;
