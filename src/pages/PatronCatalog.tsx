import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DocumentViewer from "@/components/DocumentViewer";
import EnhancedBookCard from "@/components/EnhancedBookCard";
import PatronSidebar from "@/components/PatronSidebar";

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
        const cats: string[] = ["All", ...Array.from(new Set(data.map((b: any) => b.category as string)))];
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

        {/* Filters */}
        <div className="bg-card rounded-xl border p-5 mb-6">
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

        {/* Grid of enhanced book cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => (
            <EnhancedBookCard
              key={book.id}
              book={book}
              onView={() => setSelectedBook(book)}
              onDownload={() => window.open(book.digital_file_url, "_blank")}
              onReserve={() => handleReserve(book.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No books found matching your search.</p>
        )}

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
