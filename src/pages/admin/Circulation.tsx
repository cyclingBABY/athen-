import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const Circulation = () => {
  const [search, setSearch] = useState("");

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

  return (
    <AdminLayout title="Circulation (Check-in / Check-out)" description="Manage book check-ins, check-outs, and renewals">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by patron or book…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button><ArrowRightLeft className="w-4 h-4 mr-2" />New Check-out</Button>
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
            ) : records?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No circulation records</TableCell></TableRow>
            ) : records?.map(r => (
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
                      <Button variant="ghost" size="sm">Check In</Button>
                      <Button variant="ghost" size="sm" disabled={r.renewed_count >= 2}>Renew</Button>
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

export default Circulation;
