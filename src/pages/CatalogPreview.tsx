import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import EnhancedBookCard from "@/components/EnhancedBookCard";

const CatalogPreview = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState<string[]>(["All"]);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleGuestAction = () => {
    toast({
      title: "Authentication Required",
      description: "You must be signed in to reserve books, download materials, or read digital resources.",
      variant: "default",
      action: (
        <button
          onClick={() => navigate("/auth")}
          className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
      ),
    });
  };

  const filtered = books.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      <main className="flex-grow container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Library Catalog
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Discover physical books on our shelves and explore digital files available to members.
            </p>
          </div>
          <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 flex items-center gap-2 max-w-sm">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Sign in as a student, lecturer, or staff member to borrow books and access files.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-card rounded-xl border p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    category === cat 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
                placeholder="Search by title or author…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 w-full sm:w-64 animate-fade-in"
              />
            </div>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map((book) => (
            <EnhancedBookCard
              key={book.id}
              book={book}
              onView={handleGuestAction}
              onDownload={handleGuestAction}
              onReserve={handleGuestAction}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-medium text-lg">No books found</p>
            <p className="text-sm text-muted-foreground/85 mt-1">Try resetting your filter or updating your search query.</p>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default CatalogPreview;
