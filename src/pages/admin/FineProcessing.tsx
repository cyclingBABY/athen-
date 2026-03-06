import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const FineProcessing = () => {
  const { data: fines, isLoading } = useQuery({
    queryKey: ["admin-fines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fines").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalUnpaid = fines?.filter(f => !f.paid).reduce((a, f) => a + Number(f.amount), 0) || 0;
  const totalPaid = fines?.filter(f => f.paid).reduce((a, f) => a + Number(f.amount), 0) || 0;

  return (
    <AdminLayout title="Fine & Fee Processing" description="View, issue, and process fine payments">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" />Outstanding</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">${totalUnpaid.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent" />Collected</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">${totalPaid.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Total Records</CardTitle></CardHeader><CardContent><p className="text-2xl font-display font-semibold">{fines?.length || 0}</p></CardContent></Card>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : fines?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No fines recorded</TableCell></TableRow>
            ) : fines?.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.reason || "Late return"}</TableCell>
                <TableCell className="font-mono">${Number(f.amount).toFixed(2)}</TableCell>
                <TableCell className="text-sm">{format(new Date(f.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell><Badge variant={f.paid ? "secondary" : "destructive"}>{f.paid ? "Paid" : "Unpaid"}</Badge></TableCell>
                <TableCell>{!f.paid && <Button variant="ghost" size="sm">Mark Paid</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default FineProcessing;
