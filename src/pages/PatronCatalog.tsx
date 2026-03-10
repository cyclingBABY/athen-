import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, Eye, Download, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DocumentViewer from "@/components/DocumentViewer";
import { useToast } from "@/hooks/use-toast";
import PatronSidebar from "@/components/PatronSidebar";

const statusStyles: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  "checked-out": "bg-info/10 text-info border-info/20",
  reserved: "bg-warning/10 text-warning border-warning/20",
};

const PatronCatalog = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from("books").select("*").order("title");
      if (data) {
        setBooks(data);
        const cats = ["All", ...new Set(data.map((b: any) => b.category))];
        setCategories(cats);
      }
    };
    fetchBooks();
  }, []);

  const handleReserve = async (bookId: string) => {
    if (!user) return;
    const { error } = await supabase.from("reservations").insert({ book_id: bookId, user_id: user.id });
    if (error) {
      toast({ title: "Reservation failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Book reserved!", description: "You can pick it up at the front desk." });
    }
  };

  const filtered = books.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-6">Browse Catalog</h1>

        <div className="bg-card rounded-xl border">
          <div className="p-5 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search books…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {filtered.map((book) => (
              <div key={book.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  <div className="w-12 h-16 rounded-sm flex-shrink-0 shadow-sm flex items-center justify-center" style={{ backgroundColor: book.cover_color || "hsl(210 60% 50%)" }}>
                    <BookOpen className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <p className="text-xs text-muted-foreground">{book.category} · {book.publish_year > 0 ? book.publish_year : `${Math.abs(book.publish_year)} BC`}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className={`text-xs capitalize ${statusStyles[book.status] || ""}`}>
                    {book.status.replace("-", " ")}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {book.digital_file_url && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => setSelectedBook(book)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2"
                          onClick={() => window.open(book.digital_file_url, "_blank")}
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </>
                    )}
                    {book.available_copies > 0 ? (
                      <button onClick={() => handleReserve(book.id)} className="text-xs font-medium text-primary hover:underline">
                        Reserve
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{book.available_copies} copies left</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DocumentViewer
          book={selectedBook}
          open={!!selectedBook}
          onOpenChange={(open) => { if (!open) setSelectedBook(null); }}
        />
      </main>
    </div>
  );
};

export default PatronCatalog;
