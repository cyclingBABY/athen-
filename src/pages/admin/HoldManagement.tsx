import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Calendar, User, BookOpen } from "lucide-react";

const HoldManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: ["admin-holds-circulation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("circulation_records")
        .select("*, books(title, author, shelf_location), profiles(full_name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
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

  const getDaysStatus = (dueDate: string, status: string) => {
    if (status === "returned") return "Returned";
    const end = new Date(dueDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    }
    return `${days} days left`;
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === "returned") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    const end = new Date(dueDate);
    const now = new Date();
    if (differenceInDays(end, now) < 0) {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  };

  const filteredRecords = (records || []).filter((r: any) => {
    const title = r.books?.title?.toLowerCase() || "";
    const author = r.books?.author?.toLowerCase() || "";
    const name = r.profiles?.full_name?.toLowerCase() || "";
    const email = r.profiles?.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return (
      title.includes(search) ||
      author.includes(search) ||
      name.includes(search) ||
      email.includes(search)
    );
  });

  const activeLoans = filteredRecords.filter((r: any) => r.status !== "returned");
  const returnedLoans = filteredRecords.filter((r: any) => r.status === "returned");

  return (
    <AdminLayout title="Hold Management" description="Track active physical book check-outs, overdue items, and returns history">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by book, author, patron name or email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-[400px] grid-cols-3">
          <TabsTrigger value="active">Active Loans ({activeLoans.length})</TabsTrigger>
          <TabsTrigger value="returned">Returned ({returnedLoans.length})</TabsTrigger>
          <TabsTrigger value="all">All Records ({filteredRecords.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Time Remaining</TableHead>
                <TableHead>Reading Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : activeLoans.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No active loans found</TableCell></TableRow>
              ) : activeLoans.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.books?.title || "Unknown Book"}</p>
                      <p className="text-xs text-muted-foreground">{r.books?.author || "—"}</p>
                      {r.books?.shelf_location && (
                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 mt-1">
                          📍 {r.books.shelf_location}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.profiles?.full_name || "Unknown Patron"}</p>
                      <p className="text-[10px] text-muted-foreground">{r.profiles?.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.checkout_date ? format(new Date(r.checkout_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {r.due_date ? format(new Date(r.due_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className={`font-semibold ${getDaysStatus(r.due_date, r.status).includes("overdue") ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {getDaysStatus(r.due_date, r.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span>Progress</span>
                        <span>{getProgress(r.checkout_date, r.due_date)}%</span>
                      </div>
                      <Progress value={getProgress(r.checkout_date, r.due_date)} className="h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(r.status, r.due_date)}`}>
                      {differenceInDays(new Date(r.due_date), new Date()) < 0 ? "overdue" : "checked-out"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="returned" className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : returnedLoans.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No returned books found</TableCell></TableRow>
              ) : returnedLoans.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.books?.title || "Unknown Book"}</p>
                      <p className="text-xs text-muted-foreground">{r.books?.author || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.profiles?.full_name || "Unknown Patron"}</p>
                      <p className="text-[10px] text-muted-foreground">{r.profiles?.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.checkout_date ? format(new Date(r.checkout_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.due_date ? format(new Date(r.due_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {r.return_date ? format(new Date(r.return_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(r.status, r.due_date)}`}>
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="all" className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
              ) : filteredRecords.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.books?.title || "Unknown Book"}</p>
                      <p className="text-xs text-muted-foreground">{r.books?.author || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.profiles?.full_name || "Unknown Patron"}</p>
                      <p className="text-[10px] text-muted-foreground">{r.profiles?.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.checkout_date ? format(new Date(r.checkout_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.due_date ? format(new Date(r.due_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {r.return_date ? format(new Date(r.return_date), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs capitalize ${getStatusColor(r.status, r.due_date)}`}>
                      {r.status === "checked-out" && differenceInDays(new Date(r.due_date), new Date()) < 0 ? "overdue" : r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default HoldManagement;
