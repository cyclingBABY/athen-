import { useState } from "react";
import { books, categories } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  available: "bg-success/10 text-success border-success/20",
  "checked-out": "bg-info/10 text-info border-info/20",
  reserved: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const BookCatalog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || b.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="bg-card rounded-xl border">
      <div className="p-5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-display font-semibold">Book Catalog</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search books or authors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 w-full sm:w-64"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Title</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Author</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3 hidden lg:table-cell">Category</th>
              <th className="text-left font-medium text-muted-foreground px-5 py-3">Status</th>
              <th className="text-right font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Copies</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((book) => (
              <tr key={book.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-11 rounded-sm flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: book.coverColor }}
                    />
                    <div>
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{book.author}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{book.author}</td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <span className="text-muted-foreground">{book.category}</span>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant="outline" className={`text-xs capitalize ${statusStyles[book.status]}`}>
                    {book.status.replace("-", " ")}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right text-muted-foreground hidden sm:table-cell">{book.copies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookCatalog;
