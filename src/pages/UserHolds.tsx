import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "@/components/UserSidebar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Calendar, AlertTriangle, Monitor } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import DocumentViewer from "@/components/DocumentViewer";

const UserHolds = () => {
    const [holds, setHolds] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const { user } = useAuth();

    const fetchHolds = async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from("circulation_records")
            .select("*, books(title, author, category, cover_color, shelf_location, digital_file_url, digital_file_type)")
            .eq("user_id", user.id)
            .neq("status", "returned")
            .order("checkout_date", { ascending: false });

        if (error) {
            console.error("Error fetching holds:", error);
        } else if (data) {
            setHolds(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchHolds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const getTimeLeftText = (dueDate: string) => {
        const end = new Date(dueDate);
        const now = new Date();
        const days = differenceInDays(end, now);
        if (days < 0) {
            return `${Math.abs(days)} days overdue`;
        }
        if (days === 0) {
            return "Due today";
        }
        return `${days} days left`;
    };

    const getTimeLeftColor = (dueDate: string) => {
        const end = new Date(dueDate);
        const now = new Date();
        const days = differenceInDays(end, now);
        if (days < 0) {
            return "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
        }
        if (days <= 3) {
            return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
        }
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    };

    return (
        <div className="flex min-h-screen bg-background">
            <UserSidebar />
            <main className="flex-1 p-6 overflow-auto">
                <h1 className="text-2xl font-display font-bold mb-2">My Holds</h1>
                <p className="text-sm text-muted-foreground mb-6">List of physical books checked out and time remaining for returns.</p>

                <div className="bg-card rounded-xl border overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                            <p>Loading active holds...</p>
                        </div>
                    ) : holds.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No active holds (taken books) yet</p>
                            <p className="text-xs mt-1">Visit the library front desk to checkout reserved books.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {holds.map((r) => {
                                const timeLeftText = getTimeLeftText(r.due_date);
                                const isOverdue = timeLeftText.includes("overdue");
                                return (
                                    <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-12 rounded shadow-sm shrink-0"
                                                style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }}
                                            />
                                            <div>
                                                <p className="font-semibold text-sm">{r.books?.title || "Unknown Book"}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                                                    <span>{r.books?.author}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> Due: {r.due_date ? format(new Date(r.due_date), "MMM d, yyyy") : "—"}
                                                    </span>
                                                    {r.books?.shelf_location && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-accent font-semibold bg-accent/10 px-1.5 py-0.5 rounded">
                                                                📍 {r.books.shelf_location}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getTimeLeftColor(r.due_date)}`}>
                                                {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                                                {timeLeftText}
                                            </span>
                                            <Badge variant="outline" className={`text-xs capitalize ${isOverdue ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                                                {isOverdue ? "overdue" : "taken"}
                                            </Badge>
                                            <button onClick={() => setSelectedBook(r.books)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline hover:opacity-80 transition-opacity">
                                                <Monitor className="w-3.5 h-3.5" /> Read
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <DocumentViewer
                    book={selectedBook}
                    open={!!selectedBook}
                    onOpenChange={setSelectedBook}
                />
            </main>
        </div>
    );
};

export default UserHolds;
