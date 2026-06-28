import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Printer, AlertTriangle, Library, UserCheck } from "lucide-react";
import { format } from "date-fns";

const RegistrarDashboard = () => {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Fetch all students (patrons)
  const { data: students, isLoading } = useQuery({
    queryKey: ["registrar-students"],
    queryFn: async () => {
      // 1. Fetch user roles where role = 'patron'
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "patron");
      if (!roles?.length) return [];

      const patronIds = roles.map(r => r.user_id);

      // 2. Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", patronIds);

      if (!profiles) return [];

      // 3. Fetch active unreturned checkouts and unpaid fines in parallel
      const { data: activeLoans } = await supabase
        .from("circulation_records")
        .select("*, books(title)")
        .neq("status", "returned");

      const { data: unpaidFines } = await supabase
        .from("fines")
        .select("*")
        .eq("paid", false);

      const loansByUser = Object.groupBy(activeLoans || [], (l: any) => l.user_id);
      const finesByUser = Object.groupBy(unpaidFines || [], (f: any) => f.user_id);

      // 4. Map profiles with active holds count and fines count
      return profiles.map((p: any) => {
        const userLoans = loansByUser[p.user_id] || [];
        const userFines = finesByUser[p.user_id] || [];
        const totalFinesSum = userFines.reduce((sum, f) => sum + Number(f.amount), 0);
        return {
          ...p,
          unreturned_count: userLoans.length,
          unreturned_items: userLoans,
          unpaid_fines_sum: totalFinesSum,
          unpaid_fines_items: userFines,
          is_cleared: userLoans.length === 0 && totalFinesSum === 0,
        };
      });
    },
  });

  const filteredStudents = (students || []).filter((s: any) => {
    const term = search.toLowerCase();
    const name = (s.full_name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const card = (s.library_card_number || "").toLowerCase();
    return name.includes(term) || email.includes(term) || card.includes(term);
  });

  return (
    <AdminLayout title="Registrar Clearance Office" description="Review real-time library clearance requirements for final exams, graduation, and document issuance.">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Student List */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or library card..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Library Card</TableHead>
                  <TableHead>Unreturned Books</TableHead>
                  <TableHead>Unpaid Fines</TableHead>
                  <TableHead>Clearance Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading student records...</TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No students found.</TableCell></TableRow>
                ) : filteredStudents.map((s: any) => (
                  <TableRow key={s.id} className={selectedStudent?.id === s.id ? "bg-muted/40" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{s.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{s.email || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.library_card_number || "—"}</TableCell>
                    <TableCell>
                      {s.unreturned_count > 0 ? (
                        <span className="text-rose-600 font-semibold text-xs">{s.unreturned_count} books</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.unpaid_fines_sum > 0 ? (
                        <span className="text-rose-600 font-semibold text-xs">${s.unpaid_fines_sum.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_cleared ? "outline" : "destructive"} className={s.is_cleared ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                        {s.is_cleared ? "Cleared" : "Flagged"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(s)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right Side: Clearance detail card */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          {selectedStudent ? (
            <div className="bg-card border rounded-xl p-5 space-y-5">
              <div>
                <h3 className="font-bold text-base font-display">{selectedStudent.full_name || "Student Details"}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedStudent.email}</p>
                {selectedStudent.library_card_number && (
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">Card: {selectedStudent.library_card_number}</p>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Clearance Status</h4>
                <div className={`p-3 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
                  selectedStudent.is_cleared 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                }`}>
                  {selectedStudent.is_cleared ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {selectedStudent.is_cleared ? "Cleared for Exams & Graduation" : "Flagged - Academic Restrictions"}
                </div>
              </div>

              {!selectedStudent.is_cleared && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Enforcement Active
                  </div>
                  <p className="text-muted-foreground">
                    This user has outstanding library records. Standard academic clearances for exams, transcripts, recommendation letters, and graduation are **blocked** in accordance with library policies.
                  </p>
                </div>
              )}

              {/* Unreturned list */}
              {selectedStudent.unreturned_count > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Unreturned Items ({selectedStudent.unreturned_count})</h4>
                  <div className="text-xs space-y-1 bg-muted/30 p-2.5 rounded-lg border">
                    {selectedStudent.unreturned_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between py-1 border-b last:border-b-0">
                        <span className="font-medium truncate max-w-[150px]">{item.books?.title}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(item.due_date), "MMM d")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unpaid Fines list */}
              {selectedStudent.unpaid_fines_sum > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Unpaid Fines (${selectedStudent.unpaid_fines_sum.toFixed(2)})</h4>
                  <div className="text-xs space-y-1 bg-muted/30 p-2.5 rounded-lg border">
                    {selectedStudent.unpaid_fines_items.map((fine: any) => (
                      <div key={fine.id} className="flex justify-between py-1 border-b last:border-b-0">
                        <span className="truncate max-w-[150px]">{fine.reason || "Late return fine"}</span>
                        <span className="font-semibold text-rose-600">${Number(fine.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStudent.is_cleared ? (
                <Button 
                  className="w-full text-xs" 
                  onClick={() => window.print()}
                >
                  <Printer className="w-3.5 h-3.5 mr-2" /> Generate Clearance Certificate
                </Button>
              ) : (
                <div className="text-[11px] text-center text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-100 dark:border-rose-900/30">
                  Resolutions required for clearance.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground text-xs space-y-3">
              <Library className="w-12 h-12 text-primary/30 mx-auto" />
              <p>Select a student from the list to view active clearances, unreturned items, and outstanding fees.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default RegistrarDashboard;
