import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import UserSidebar from "@/components/UserSidebar";
import { Badge } from "@/components/ui/badge";
import { BookCopy, RefreshCw, Monitor, Calendar, CheckCircle2, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentViewer from "@/components/DocumentViewer";

const UserMyBooks = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [onlineReads, setOnlineReads] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("circulation_records")
      .select("*, books(title, author, category, cover_color, shelf_location, digital_file_url, digital_file_type)")
      .eq("user_id", user.id)
      .order("checkout_date", { ascending: false });
    if (data) setRecords(data);
  };

  const fetchOnlineReads = () => {
    if (!user) return;
    const key = `online_reading_${user.id}`;
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    setOnlineReads(history);
  };

  useEffect(() => {
    fetchRecords();
    fetchOnlineReads();
  }, [user]);

  const handleRenew = async (id: string, currentCount: number) => {
    if (currentCount >= 2) {
      toast({ title: "Cannot renew", description: "Maximum renewals reached (2).", variant: "destructive" });
      return;
    }
    const newDue = new Date();
    newDue.setDate(newDue.getDate() + 14);
    const { error } = await supabase
      .from("circulation_records")
      .update({ due_date: newDue.toISOString(), renewed_count: currentCount + 1 })
      .eq("id", id);
    if (error) {
      toast({ title: "Renewal failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Book renewed!", description: `New due date: ${newDue.toLocaleDateString()}` });
      fetchRecords();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedBook(null);
      fetchOnlineReads();
    }
  };

  const active = records.filter((r) => r.status !== "returned");
  const history = records.filter((r) => r.status === "returned");

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-2">My Books</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your borrowed physical books and view your online reading history.</p>

        <Tabs defaultValue="borrowed" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="borrowed">Borrowed ({active.length})</TabsTrigger>
            <TabsTrigger value="returned">Returned ({history.length})</TabsTrigger>
            <TabsTrigger value="online">Read Online ({onlineReads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="borrowed" className="bg-card rounded-xl border overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-lg font-display font-semibold">Books Borrowed (Not Returned)</h2>
              <p className="text-xs text-muted-foreground mt-1">Physical books currently checked out under your account</p>
            </div>
            {active.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <BookCopy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No borrowed books</p>
                <p className="text-xs mt-1">Visit the catalog to request physical or digital books.</p>
              </div>
            ) : (
              <div className="divide-y">
                {active.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-12 rounded shadow-sm shrink-0" style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }} />
                      <div>
                        <p className="font-semibold text-sm">{r.books?.title || "Unknown Book"}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                          <span>{r.books?.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</span>
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
                    <div className="flex items-center gap-3.5">
                      <Badge variant="outline" className={`text-xs capitalize ${(r.status || "").replace("-", " ") === "overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-info/10 text-info border-info/20"}`}>
                        {(r.status || "").replace("-", " ")}
                      </Badge>
                      <button onClick={() => setSelectedBook(r.books)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline hover:opacity-80 transition-opacity">
                        <Monitor className="w-3.5 h-3.5" /> Read
                      </button>
                      <button onClick={() => handleRenew(r.id, r.renewed_count)} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline hover:opacity-80 transition-opacity">
                        <RefreshCw className="w-3.5 h-3.5" /> Renew
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="returned" className="bg-card rounded-xl border overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-lg font-display font-semibold">Books Read (Returned History)</h2>
              <p className="text-xs text-muted-foreground mt-1">Physical books you checked out and returned in the past</p>
            </div>
            {history.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No returned history found</p>
                <p className="text-xs mt-1">Returned physical books will be listed here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {history.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-12 rounded shadow-sm shrink-0" style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }} />
                      <div>
                        <p className="font-semibold text-sm">{r.books?.title || "Unknown Book"}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{r.books?.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Returned: {r.return_date ? new Date(r.return_date).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">Returned</Badge>
                      <button onClick={() => setSelectedBook(r.books)} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline hover:opacity-80 transition-opacity">
                        <Monitor className="w-3.5 h-3.5" /> Read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="online" className="bg-card rounded-xl border overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-lg font-display font-semibold">Read Online (Digital History)</h2>
              <p className="text-xs text-muted-foreground mt-1">Digital books you have opened or are trying to read online</p>
            </div>
            {onlineReads.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No digital books opened yet</p>
                <p className="text-xs mt-1">Browse the catalog and read digital books online to see them here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {onlineReads.map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <Monitor className="w-5 h-5 text-primary opacity-60" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{b.title || "Unknown Book"}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{b.author}</span>
                          <span>•</span>
                          <span>Last viewed: {b.last_opened ? new Date(b.last_opened).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBook(b)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Monitor className="w-3.5 h-3.5" /> Read Online
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DocumentViewer
          book={selectedBook}
          open={!!selectedBook}
          onOpenChange={handleOpenChange}
        />
      </main>
    </div>
  );
};

export default UserMyBooks;
