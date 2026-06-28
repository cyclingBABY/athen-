import AdminLayout from "@/components/AdminLayout";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  Globe, BookOpen, Search, Download, Trash2, Plus, RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import QRCode from "qrcode";

interface ParsedBook {
  title: string;
  author: string;
  isbn?: string;
  category?: string;
  publisher?: string;
  publish_year?: number;
  shelf_location?: string;
  description?: string;
  cover_image_url?: string;
  copies: number;
  source?: string;
}

// ── Open Library API ──────────────────────────────────────────────────────
const fetchFromOpenLibrary = async (query: string): Promise<ParsedBook[]> => {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=title,author_name,isbn,subject,publisher,first_publish_year,cover_i,description`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.docs || []).map((d: any) => ({
    title: d.title || "Unknown Title",
    author: (d.author_name || []).join(", ") || "Unknown Author",
    isbn: (d.isbn || [])[0] || undefined,
    category: (d.subject || [])[0] || "General",
    publisher: (d.publisher || [])[0] || undefined,
    publish_year: d.first_publish_year || undefined,
    cover_image_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
    description: undefined,
    copies: 1,
    source: "Open Library",
  }));
};

// ── Google Books API ──────────────────────────────────────────────────────
const fetchFromGoogleBooks = async (query: string): Promise<ParsedBook[]> => {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
  const res = await fetch(url);
  const json = await res.json();
  return (json.items || []).map((item: any) => {
    const v = item.volumeInfo || {};
    return {
      title: v.title || "Unknown Title",
      author: (v.authors || []).join(", ") || "Unknown Author",
      isbn: (v.industryIdentifiers || []).find((x: any) => x.type === "ISBN_13")?.identifier ||
            (v.industryIdentifiers || []).find((x: any) => x.type === "ISBN_10")?.identifier || undefined,
      category: (v.categories || [])[0] || "General",
      publisher: v.publisher || undefined,
      publish_year: v.publishedDate ? parseInt(v.publishedDate) : undefined,
      cover_image_url: v.imageLinks?.thumbnail?.replace("http:", "https:") || undefined,
      description: v.description ? v.description.slice(0, 300) : undefined,
      copies: 1,
      source: "Google Books",
    };
  });
};

// ── ISBN lookup (Open Library) ────────────────────────────────────────────
const fetchByISBN = async (isbn: string): Promise<ParsedBook | null> => {
  const clean = isbn.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
  const res = await fetch(url);
  const json = await res.json();
  const key = `ISBN:${clean}`;
  const d = json[key];
  if (!d) return null;
  return {
    title: d.title || "Unknown",
    author: (d.authors || []).map((a: any) => a.name).join(", ") || "Unknown",
    isbn: clean,
    category: (d.subjects || [])[0]?.name || "General",
    publisher: (d.publishers || [])[0]?.name || undefined,
    publish_year: d.publish_date ? parseInt(d.publish_date) : undefined,
    cover_image_url: d.cover?.medium || undefined,
    description: d.notes || undefined,
    copies: 1,
    source: "ISBN Lookup",
  };
};

// ── Parse Excel/CSV ───────────────────────────────────────────────────────
const parseSpreadsheet = (data: ArrayBuffer | string, isCsv: boolean): ParsedBook[] => {
  const workbook = XLSX.read(data, { type: isCsv ? "string" : "binary" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(sheet);
  return json.map(row => ({
    title: String(row.title || row.Title || row.TITLE || "").trim(),
    author: String(row.author || row.Author || row.AUTHOR || row.authors || "").trim(),
    isbn: String(row.isbn || row.ISBN || "").trim() || undefined,
    category: String(row.category || row.Category || row.subject || row.Subject || "General").trim(),
    publisher: String(row.publisher || row.Publisher || "").trim() || undefined,
    publish_year: Number(row.publish_year || row["Publish Year"] || row.year || row.Year || 0) || undefined,
    shelf_location: String(row.shelf_location || row["Shelf Location"] || row.location || "").trim() || undefined,
    description: String(row.description || row.Description || row.notes || "").trim() || undefined,
    copies: Number(row.copies || row.Copies || row.total_copies || row.quantity || 1) || 1,
    source: "File Upload",
  })).filter(b => b.title && b.author);
};

// ── Parse JSON ────────────────────────────────────────────────────────────
const parseJSON = (text: string): ParsedBook[] => {
  const arr = JSON.parse(text);
  const items = Array.isArray(arr) ? arr : arr.books || arr.items || arr.data || [];
  return items.map((item: any) => ({
    title: item.title || item.Title || item.name || "",
    author: item.author || item.Author || (Array.isArray(item.authors) ? item.authors.join(", ") : "") || "",
    isbn: item.isbn || item.ISBN || item.isbn13 || undefined,
    category: item.category || item.subject || item.genre || "General",
    publisher: item.publisher || undefined,
    publish_year: item.publish_year || item.year || item.publishedDate ? parseInt(item.publish_year || item.year || item.publishedDate) : undefined,
    description: item.description || item.summary || undefined,
    cover_image_url: item.cover_image_url || item.thumbnail || item.cover || undefined,
    copies: item.copies || item.total_copies || item.quantity || 1,
    source: "JSON Import",
  })).filter((b: any) => b.title);
};

const GENERATE_QR = async (id: string) => QRCode.toDataURL(id, { width: 200, margin: 1 });

const SOURCE_BADGE: Record<string, string> = {
  "Open Library": "bg-blue-100 text-blue-700",
  "Google Books": "bg-orange-100 text-orange-700",
  "ISBN Lookup":  "bg-purple-100 text-purple-700",
  "File Upload":  "bg-green-100 text-green-700",
  "JSON Import":  "bg-teal-100 text-teal-700",
};

const BulkImport = () => {
  const [books, setBooks] = useState<ParsedBook[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isbnQuery, setIsbnQuery] = useState("");
  const [apiSource, setApiSource] = useState<"openlibrary" | "google">("openlibrary");
  const [searching, setSearching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ── Helpers ───────────────────────────────────────────────────────────
  const addBooks = (newBooks: ParsedBook[]) => {
    setBooks(prev => {
      const combined = [...prev, ...newBooks];
      setSelected(new Set(combined.map((_, i) => i)));
      return combined;
    });
    toast({ title: `${newBooks.length} books ready for review` });
  };

  const removeBook = (idx: number) => {
    setBooks(prev => prev.filter((_, i) => i !== idx));
    setSelected(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i !== idx) next.add(i > idx ? i - 1 : i); });
      return next;
    });
  };

  const toggleSelect = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const toggleAll = () =>
    setSelected(selected.size === books.length ? new Set() : new Set(books.map((_, i) => i)));

  // ── File upload ───────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isJson = file.name.endsWith(".json");
    const isCsv  = file.name.endsWith(".csv");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result;
        if (!raw) return;
        const parsed = isJson
          ? parseJSON(raw as string)
          : parseSpreadsheet(raw as string, isCsv);
        addBooks(parsed);
      } catch (err: any) {
        toast({ title: "Parse error", description: err.message, variant: "destructive" });
      }
    };
    isJson || isCsv ? reader.readAsText(file) : reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // ── API search ────────────────────────────────────────────────────────
  const handleApiSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = apiSource === "google"
        ? await fetchFromGoogleBooks(searchQuery)
        : await fetchFromOpenLibrary(searchQuery);
      addBooks(results);
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally { setSearching(false); }
  };

  // ── ISBN lookup ───────────────────────────────────────────────────────
  const handleISBNLookup = async () => {
    if (!isbnQuery.trim()) return;
    setSearching(true);
    try {
      // support comma-separated ISBNs
      const isbns = isbnQuery.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      const results: ParsedBook[] = [];
      for (const isbn of isbns) {
        const book = await fetchByISBN(isbn);
        if (book) results.push(book);
        else toast({ title: `ISBN not found: ${isbn}`, variant: "destructive" });
      }
      if (results.length) addBooks(results);
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    } finally { setSearching(false); }
  };

  // ── Import selected ───────────────────────────────────────────────────
  const importBooks = async () => {
    const toImport = books.filter((_, i) => selected.has(i));
    if (!toImport.length) {
      toast({ title: "No books selected", variant: "destructive" }); return;
    }
    setImporting(true);
    setProgress(0);
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const book = toImport[i];
      try {
        const { data: bookData, error: bookErr } = await supabase.from("books").insert({
          title: book.title,
          author: book.author,
          isbn: book.isbn || null,
          category: book.category || "General",
          publish_year: book.publish_year || null,
          shelf_location: book.shelf_location || null,
          total_copies: book.copies,
          available_copies: book.copies,
          status: "available",
          description: book.description || (book.publisher ? `Publisher: ${book.publisher}` : null),
          cover_image_url: book.cover_image_url || null,
        } as any).select("id").single();

        if (bookErr) throw bookErr;

        for (let c = 1; c <= book.copies; c++) {
          const copyId  = `${bookData.id.slice(0, 8)}-C${String(c).padStart(3, "0")}`;
          const qrUrl   = await GENERATE_QR(copyId);
          await supabase.from("book_copies" as any).insert({
            book_id: bookData.id, copy_number: c, copy_id: copyId,
            qr_code_url: qrUrl, status: "available",
          });
        }
        success++;
      } catch (err: any) {
        console.error("Import failed:", book.title, err);
        errors.push(`"${book.title}": ${err.message}`);
        failed++;
      }
      setProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setResults({ success, failed, errors });
    setImporting(false);
    if (success) {
      setBooks(prev => prev.filter((_, i) => !selected.has(i)));
      setSelected(new Set());
    }
    toast({ title: `Done: ${success} imported${failed ? `, ${failed} failed` : ""}` });
  };

  // ── Download templates ────────────────────────────────────────────────
  const downloadTemplate = (fmt: "xlsx" | "csv" | "json") => {
    const sample = [
      { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "Fiction", publisher: "Scribner", publish_year: 1925, shelf_location: "A-01", copies: 3 },
      { title: "1984", author: "George Orwell", isbn: "9780451524935", category: "Sci-Fi", publisher: "Secker & Warburg", publish_year: 1949, shelf_location: "B-02", copies: 2 },
    ];
    if (fmt === "json") {
      const blob = new Blob([JSON.stringify({ books: sample }, null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "book_import_template.json"; a.click();
      return;
    }
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Books");
    XLSX.writeFile(wb, `book_import_template.${fmt}`);
  };

  const selectedBooks = books.filter((_, i) => selected.has(i));

  return (
    <AdminLayout title="Bulk Import" description="Import books from Excel, CSV, JSON files — or directly from Open Library, Google Books, and ISBN lookups">
      <div className="grid gap-6">

        {/* Results banner */}
        {results && (
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${results.failed ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20"}`}>
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{results.success} books imported successfully{results.failed > 0 && `, ${results.failed} failed`}</p>
              {results.errors.length > 0 && <p className="text-xs text-muted-foreground mt-1">{results.errors[0]}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResults(null)}>Dismiss</Button>
          </div>
        )}

        <Tabs defaultValue="file">
          <TabsList className="grid grid-cols-3 w-full max-w-lg">
            <TabsTrigger value="file"><FileSpreadsheet className="w-4 h-4 mr-2" />File Upload</TabsTrigger>
            <TabsTrigger value="api"><Globe className="w-4 h-4 mr-2" />Online Libraries</TabsTrigger>
            <TabsTrigger value="isbn"><BookOpen className="w-4 h-4 mr-2" />ISBN Lookup</TabsTrigger>
          </TabsList>

          {/* ── FILE UPLOAD TAB ──────────────────────────────────────── */}
          <TabsContent value="file">
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>Supports Excel (.xlsx, .xls), CSV, and JSON formats from any library system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex flex-col items-center gap-4 p-10 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/40 transition-colors cursor-pointer bg-muted/20"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="font-medium">Click to upload or drag & drop</p>
                    <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) · CSV · JSON</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json" className="hidden" onChange={handleFile} />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground self-center">Download templates:</p>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate("xlsx")}><Download className="w-3.5 h-3.5 mr-1" />Excel</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}><Download className="w-3.5 h-3.5 mr-1" />JSON</Button>
                </div>

                <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-1">
                  <p className="font-medium text-foreground">Supported column names (case-insensitive):</p>
                  <p className="text-muted-foreground font-mono text-xs">title, author, isbn, category, subject, publisher, publish_year, year, shelf_location, location, description, copies, quantity</p>
                  <p className="text-muted-foreground text-xs mt-2">✅ Compatible with Koha, Evergreen, LibreOffice exports, WorldCat, and most library management systems</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ONLINE LIBRARIES TAB ─────────────────────────────────── */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Search Online Library Databases</CardTitle>
                <CardDescription>Fetch book metadata directly from Open Library (openlibrary.org) or Google Books</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={apiSource === "openlibrary" ? "default" : "outline"} size="sm" onClick={() => setApiSource("openlibrary")}>
                    🌐 Open Library
                  </Button>
                  <Button variant={apiSource === "google" ? "default" : "outline"} size="sm" onClick={() => setApiSource("google")}>
                    📘 Google Books
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Search ${apiSource === "google" ? "Google Books" : "Open Library"}… e.g. "Harry Potter" or "Chinua Achebe"`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleApiSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleApiSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">Search</span>
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>🔍 Search by title, author, subject, or keyword. Results include cover images, descriptions, and ISBNs.</p>
                  <p>🔓 No API key required — completely free.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ISBN LOOKUP TAB ──────────────────────────────────────── */}
          <TabsContent value="isbn">
            <Card>
              <CardHeader>
                <CardTitle>ISBN Lookup</CardTitle>
                <CardDescription>Enter one or more ISBNs to fetch full book metadata automatically</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ISBN Numbers</Label>
                  <textarea
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 font-mono resize-y"
                    placeholder={"9780743273565\n9780451524935\n978-0-7432-7356-5"}
                    value={isbnQuery}
                    onChange={e => setIsbnQuery(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Enter one ISBN per line, or comma-separated. Supports ISBN-10 and ISBN-13.</p>
                </div>
                <Button onClick={handleISBNLookup} disabled={searching || !isbnQuery.trim()}>
                  {searching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BookOpen className="w-4 h-4 mr-2" />}
                  Lookup ISBNs
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── PREVIEW TABLE ────────────────────────────────────────────── */}
        {books.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Preview — {books.length} books loaded</CardTitle>
                <CardDescription>{selected.size} selected for import</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selected.size === books.length ? "Deselect All" : "Select All"}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => { setBooks([]); setSelected(new Set()); }}>
                  <Trash2 className="w-4 h-4 mr-1" />Clear
                </Button>
                <Button onClick={importBooks} disabled={importing || selected.size === 0}>
                  {importing
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Importing…</>
                    : <><Plus className="w-4 h-4 mr-2" />Import {selected.size} Books</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {importing && (
                <div className="mb-4 space-y-1">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progress}% — Inserting books and generating QR codes…</p>
                </div>
              )}
              <div className="rounded-lg border max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead className="w-10">
                        <input type="checkbox" checked={selected.size === books.length && books.length > 0} onChange={toggleAll} className="rounded" />
                      </TableHead>
                      <TableHead>Cover</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>ISBN</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Copies</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {books.map((b, i) => (
                      <TableRow key={i} className={selected.has(i) ? "" : "opacity-40"}>
                        <TableCell>
                          <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} className="rounded" />
                        </TableCell>
                        <TableCell>
                          {b.cover_image_url
                            ? <img src={b.cover_image_url} alt="" className="w-10 h-14 object-cover rounded shadow-sm" onError={e => (e.currentTarget.style.display = "none")} />
                            : <div className="w-10 h-14 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">—</div>}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px]">
                          <span className="line-clamp-2">{b.title}</span>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px]">
                          <span className="line-clamp-1">{b.author}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{b.isbn || "—"}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{b.category || "General"}</Badge></TableCell>
                        <TableCell className="text-sm">{b.publish_year || "—"}</TableCell>
                        <TableCell>
                          <Input type="number" min={1} max={99} value={b.copies}
                            onChange={e => setBooks(prev => prev.map((book, idx) => idx === i ? { ...book, copies: Math.max(1, parseInt(e.target.value) || 1) } : book))}
                            className="w-16 h-7 text-center text-sm" />
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_BADGE[b.source || ""] || "bg-gray-100 text-gray-600"}`}>
                            {b.source}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeBook(i)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default BulkImport;
