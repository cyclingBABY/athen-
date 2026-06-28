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
import { CheckCheck, Search } from "lucide-react";

import { useMemo, useState } from "react";

import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const BookTracking = () => {
    const { toast } = useToast();
    const qc = useQueryClient();

    const [search, setSearch] = useState("");
    const [issueOpen, setIssueOpen] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [userSearch, setUserSearch] = useState("");

    const [selectedBookId, setSelectedBookId] = useState("");



    const { data: availableBooks } = useQuery({
        queryKey: ["admin-available-books"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("books")
                .select("id, title, author")
                .order("title");
            if (error) throw error;
            return data || [];
        },
    });

    // Book tracking must reflect holds workflow, so we derive rows from:
    // - reservations (holds)
    // - circulation_records (borrow/return lifecycle)
    const { data: trackings, isLoading } = useQuery({
        queryKey: ["admin-booktracking"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("circulation_records")
                .select("*, books(title, author), profiles(full_name, email)")
                .order("created_at", { ascending: false });
            if (error) throw error;

            return (data || []).map((r: any) => ({
                id: r.id,
                status: r.status === "returned" ? "returned" : "borrowed",
                borrowed_at: r.checkout_date || r.created_at,
                returned_at: r.return_date || null,
                profiles: r.profiles,
                books: r.books,
                book_id: r.book_id,
                circulation_record_id: r.id,
            }));
        },
    });


    const filtered = useMemo(() => {
        const list = trackings || [];
        if (!search.trim()) return list;
        const s = search.toLowerCase();
        return list.filter((r: any) => {
            const userName = r.profiles?.full_name || "";
            const userEmail = r.profiles?.email || "";
            const title = r.books?.title || "";
            return [userName, userEmail, title].some(v => v.toLowerCase().includes(s));
        });
    }, [trackings, search]);

    const borrowMutation = useMutation({
        mutationFn: async () => {
            const emailToUse = selectedUserEmail || userSearch;
            // Find patron by email
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("email", emailToUse)
                .maybeSingle();

            if (profileError) throw profileError;
            if (!profile) throw new Error("User not found with that email");

            // Insert circulation record
            const checkoutDate = new Date().toISOString();
            const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
            const { error } = await supabase.from("circulation_records").insert({
                user_id: profile.user_id,
                book_id: selectedBookId,
                status: "checked-out",
                checkout_date: checkoutDate,
                due_date: dueDate
            });
            if (error) throw error;

            // Update book availability
            const { data: book } = await supabase.from("books").select("available_copies").eq("id", selectedBookId).single();
            if (book) {
                await supabase.from("books").update({
                    available_copies: Math.max(0, book.available_copies - 1),
                    status: book.available_copies - 1 <= 0 ? "checked-out" : "available"
                }).eq("id", selectedBookId);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-booktracking"] });
            qc.invalidateQueries({ queryKey: ["admin-holds-circulation"] });
            setIssueOpen(false);
            setSelectedUserEmail("");
            setSelectedBookId("");
            toast({ title: "Book issued successfully" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const returnMutation = useMutation({
        mutationFn: async (tracking: any) => {
            // Update circulation record
            const { error } = await supabase
                .from("circulation_records")
                .update({ status: "returned", return_date: new Date().toISOString() })
                .eq("id", tracking.id);
            if (error) throw error;

            // Update book availability
            const { data: book } = await supabase.from("books").select("available_copies").eq("id", tracking.book_id).single();
            if (book) {
                await supabase.from("books").update({
                    available_copies: book.available_copies + 1,
                    status: "available"
                }).eq("id", tracking.book_id);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin-booktracking"] });
            qc.invalidateQueries({ queryKey: ["admin-holds-circulation"] });
            toast({ title: "Book marked as returned" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const borrowedTick = (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <CheckCheck className="w-3.5 h-3.5" /> Checked Out
        </span>
    );

    return (
        <AdminLayout title="Book Tracking" description="Double-tick workflow: Borrowed → Returned (Completed)">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by user or book…"
                        className="pl-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIssueOpen(true)}>Issue Book</Button>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="p-5 border-b">
                    <h2 className="text-lg font-display font-semibold">Physical Book Borrow/Return</h2>
                    <p className="text-xs text-muted-foreground mt-1">First tick when issued, second tick when returned</p>
                </div>

                <div className="p-5">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Name</TableHead>
                                <TableHead>Book Title</TableHead>
                                <TableHead>Date Borrowed</TableHead>
                                <TableHead>Date Returned</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[220px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((r: any) => {
                                    const isBorrowed = r.status === "borrowed";
                                    const isReturned = r.status === "returned";

                                    const statusBadges = (
                                        <div className="flex flex-col gap-1">
                                            {/* Step 1 tick */}
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${isBorrowed || isReturned
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                                                        : "bg-muted border-border/50 text-muted-foreground opacity-70"
                                                        }`}
                                                >
                                                    {isBorrowed || isReturned ? "✓" : "—"}
                                                </span>
                                                <span
                                                    className={`text-[11px] font-semibold ${isBorrowed || isReturned ? "text-emerald-700" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    Checked Out
                                                </span>
                                            </div>

                                            {/* Step 2 tick */}
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${isReturned
                                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                                                        : "bg-muted border-border/50 text-muted-foreground opacity-70"
                                                        }`}
                                                >
                                                    {isReturned ? "✓" : "—"}
                                                </span>
                                                <span
                                                    className={`text-[11px] font-semibold ${isReturned ? "text-emerald-700" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    Completed
                                                </span>
                                            </div>
                                        </div>
                                    );


                                    return (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{r.profiles?.full_name || "Unknown"}</p>
                                                    <p className="text-[10px] text-muted-foreground">{r.profiles?.email || ""}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{r.books?.title || "Unknown"}</TableCell>
                                            <TableCell className="text-sm">
                                                {r.borrowed_at ? format(new Date(r.borrowed_at), "MMM d, yyyy") : "—"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {r.returned_at ? format(new Date(r.returned_at), "MMM d, yyyy") : "—"}
                                            </TableCell>
                                            <TableCell>{statusBadges}</TableCell>
                                            <TableCell>
                                                {isBorrowed ? (
                                                    <Button variant="ghost" size="sm" onClick={() => returnMutation.mutate(r)} disabled={returnMutation.isPending}>
                                                        Mark as Returned
                                                    </Button>
                                                ) : (
                                                    <Badge variant="secondary">Completed</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Issue Book</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div>
                            <Label>Search User (Name or Email)</Label>
                            <Input
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Type to search…"
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">Tip: select from the dropdown below.</p>
                        </div>


                        <div>
                            <Label>Select User</Label>
                            <Select
                                value={selectedUserEmail}
                                onValueChange={(v) => {
                                    setSelectedUserEmail(v);
                                    setUserSearch("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose user…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/**
                                     * Lightweight client-side list comes from trackings query.
                                     * For issuing, we only need the email->user_id mapping.
                                     */}
                                    {Array.from(
                                        new Map((trackings || []).map((t: any) => [t.profiles?.email, t.profiles])).values()
                                    )
                                        .filter((p: any) => p?.email)
                                        .slice(0, 200)
                                        .map((p: any) => (
                                            <SelectItem key={p.email} value={p.email}>
                                                {p.full_name ? `${p.full_name} — ${p.email}` : p.email}
                                            </SelectItem>
                                        ))}

                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Select Book</Label>
                            <Select value={selectedBookId} onValueChange={setSelectedBookId}>

                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a book…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(availableBooks || []).map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.title} — {b.author}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIssueOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => borrowMutation.mutate()} disabled={!selectedUserEmail || !selectedBookId || borrowMutation.isPending}>
                            {borrowMutation.isPending ? "Processing…" : "Issue Book"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default BookTracking;

