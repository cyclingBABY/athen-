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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, ImagePlus, BookOpen, Monitor, Upload, Barcode } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

const emptyForm = {
  title: "", author: "", isbn: "", category: "General", publish_year: "",
  total_copies: 1, available_copies: 1, description: "",
  cover_color: "hsl(210 60% 50%)", status: "available",
  shelf_location: "",
};

const categories = [
  "Business Administration",
  "Computing & Information Technology",
  "Development Studies",
  "Education",
  "Theology & Religious Studies",
  "Food Science & Nutrition",
  "Nursing & Health Sciences",
  "Agriculture & Agribusiness",
  "Environmental Science",
  "Science & Laboratory Technology",
  "General",
];

const generateBarcode = () => {
  const prefix = "LIB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const Cataloging = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [bookType, setBookType] = useState<"physical" | "digital">("physical");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState<"all" | "physical" | "digital">("all");
  const coverRef = useRef<HTMLInputElement>(null);
  const digitalRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadCover = async (bookId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${bookId}.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadDigitalFile = async (bookId: string, file: File): Promise<{ url: string; type: string }> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${bookId}.${ext}`;
    const { error } = await supabase.storage.from("digital-library").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("digital-library").getPublicUrl(path);
    const typeMap: Record<string, string> = { pdf: "PDF", epub: "EPUB", mp3: "Audio", wav: "Audio", m4a: "Audio" };
    return { url: data.publicUrl, type: typeMap[ext] || "PDF" };
  };

  const createCopiesWithQR = async (bookId: string, count: number) => {
    for (let i = 1; i <= count; i++) {
      const copyId = `${bookId.substring(0, 8)}-C${String(i).padStart(3, "0")}`;
      const qrDataUrl = await QRCode.toDataURL(copyId, { width: 200, margin: 1 });
      // Upload QR as image
      const blob = await (await fetch(qrDataUrl)).blob();
      const qrPath = `qr-${copyId}.png`;
      await supabase.storage.from("book-covers").upload(qrPath, blob, { upsert: true });
      const { data: qrPublic } = supabase.storage.from("book-covers").getPublicUrl(qrPath);

      await supabase.from("book_copies").insert({
        book_id: bookId,
        copy_id: copyId,
        copy_number: i,
        status: "available",
        qr_code_url: qrPublic.publicUrl,
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (book: any) => {
      const isDigital = bookType === "digital";
      const barcode = isDigital ? null : (editingBook?.barcode || generateBarcode());

      const payload: any = {
        title: book.title,
        author: book.author,
        isbn: book.isbn || null,
        category: book.category,
        publish_year: book.publish_year ? Number(book.publish_year) : null,
        total_copies: isDigital ? 1 : Number(book.total_copies),
        available_copies: isDigital ? 1 : Number(book.available_copies),
        description: book.description || null,
        cover_color: book.cover_color,
        status: book.status,
        barcode,
        shelf_location: isDigital ? null : (book.shelf_location || null),
      };

      let bookId: string;
      if (editingBook) {
        bookId = editingBook.id;
        const { error } = await supabase.from("books").update(payload).eq("id", bookId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("books").insert(payload).select("id").single();
        if (error) throw error;
        bookId = data.id;

        // For physical books, create individual copies with QR codes
        if (!isDigital && Number(book.total_copies) > 0) {
          await createCopiesWithQR(bookId, Number(book.total_copies));
        }
      }

      if (coverFile) {
        const url = await uploadCover(bookId, coverFile);
        await supabase.from("books").update({ cover_image_url: url } as any).eq("id", bookId);
      }

      if (isDigital && digitalFile) {
        const { url, type } = await uploadDigitalFile(bookId, digitalFile);
        await supabase.from("books").update({ digital_file_url: url, digital_file_type: type } as any).eq("id", bookId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: editingBook ? "Book updated" : `${bookType === "physical" ? "Physical" : "Digital"} book added with ${bookType === "physical" ? "barcode & QR copies" : "file"}` });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Delete copies first
      await supabase.from("book_copies").delete().eq("book_id", id);
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      toast({ title: "Book deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => {
    setEditingBook(null);
    setForm(emptyForm);
    setBookType("physical");
    setCoverFile(null);
    setCoverPreview(null);
    setDigitalFile(null);
    setDialogOpen(true);
  };

  const openEdit = (book: any) => {
    setEditingBook(book);
    setForm({ ...book, publish_year: book.publish_year || "" });
    setBookType(book.digital_file_url ? "digital" : "physical");
    setCoverFile(null);
    setCoverPreview(book.cover_image_url || null);
    setDigitalFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBook(null);
    setCoverFile(null);
    setCoverPreview(null);
    setDigitalFile(null);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }
  };

  const handleDigitalSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDigitalFile(file);
  };

  const filtered = books?.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.includes(search));
    if (filterType === "digital") return matchesSearch && b.digital_file_url;
    if (filterType === "physical") return matchesSearch && !b.digital_file_url;
    return matchesSearch;
  });

  return (
    <AdminLayout title="Cataloging / Metadata Entry" description="Manage physical and digital book records">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, author, ISBN…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Book</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Copies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No books found</TableCell></TableRow>
            ) : filtered?.map(book => (
              <TableRow key={book.id}>
                <TableCell>
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 rounded flex items-center justify-center text-xs" style={{ background: book.cover_color || "hsl(210 60% 50%)" }}>
                      {book.digital_file_url ? <Monitor className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-white" />}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell>
                  <Badge variant={book.digital_file_url ? "secondary" : "outline"}>
                    {book.digital_file_url ? "Digital" : "Physical"}
                  </Badge>
                </TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell className="font-mono text-xs">{book.isbn || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{book.barcode || "—"}</TableCell>
                <TableCell>{book.available_copies}/{book.total_copies}</TableCell>
                <TableCell><Badge variant={book.status === "available" ? "default" : "destructive"}>{book.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(book)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(book.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>

          {!editingBook && (
            <Tabs value={bookType} onValueChange={(v: any) => setBookType(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="physical" className="gap-2"><BookOpen className="w-4 h-4" />Physical Book</TabsTrigger>
                <TabsTrigger value="digital" className="gap-2"><Monitor className="w-4 h-4" />Digital Book</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="grid gap-4 py-2">
            {/* Cover Photo - both types */}
            <div>
              <Label>Book Cover Photo</Label>
              <div className="flex items-center gap-4 mt-2">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-20 h-28 object-cover rounded border" />
                ) : (
                  <div className="w-20 h-28 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted">
                    <ImagePlus className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => coverRef.current?.click()}>
                    <ImagePlus className="w-4 h-4 mr-2" />{coverPreview ? "Change Photo" : "Upload Photo"}
                  </Button>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                  <p className="text-xs text-muted-foreground">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Author *</Label><Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>ISBN</Label><Input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-..." /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Physical-only fields */}
            {bookType === "physical" && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Publish Year</Label><Input type="number" value={form.publish_year} onChange={e => setForm({ ...form, publish_year: e.target.value })} /></div>
                  <div><Label>Total Copies</Label><Input type="number" min={1} value={form.total_copies} onChange={e => setForm({ ...form, total_copies: e.target.value })} /></div>
                  <div><Label>Shelf Location</Label><Input value={form.shelf_location || ""} onChange={e => setForm({ ...form, shelf_location: e.target.value })} placeholder="e.g. A-3-12" /></div>
                </div>
                <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                  <Barcode className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Auto-generated Barcode</p>
                    <p className="text-xs text-muted-foreground">A unique barcode & QR code per copy will be generated automatically when you save. Scanning the barcode shows all book info.</p>
                  </div>
                </div>
              </>
            )}

            {/* Digital-only fields */}
            {bookType === "digital" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Publish Year</Label><Input type="number" value={form.publish_year} onChange={e => setForm({ ...form, publish_year: e.target.value })} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="checked-out">Checked Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Upload Digital File *</Label>
                  <div className="mt-2 border border-dashed rounded-lg p-4 flex flex-col items-center gap-2 bg-muted/50">
                    {digitalFile ? (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{digitalFile.name}</span>
                        <Badge variant="secondary">{(digitalFile.size / 1024 / 1024).toFixed(1)} MB</Badge>
                      </div>
                    ) : editingBook?.digital_file_url ? (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">File already uploaded ({editingBook.digital_file_type})</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">PDF, EPUB, or Audio file</p>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => digitalRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />{digitalFile || editingBook?.digital_file_url ? "Change File" : "Select File"}
                    </Button>
                    <input ref={digitalRef} type="file" accept=".pdf,.epub,.mp3,.wav,.m4a" className="hidden" onChange={handleDigitalSelect} />
                  </div>
                </div>
              </>
            )}

            {bookType === "physical" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="checked-out">Checked Out</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cover Color</Label><Input type="color" value={form.cover_color?.startsWith("hsl") ? "#4488cc" : (form.cover_color || "#4488cc")} onChange={e => setForm({ ...form, cover_color: e.target.value })} className="h-10" /></div>
              </div>
            )}

            <div><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.title || !form.author || saveMutation.isPending || (bookType === "digital" && !editingBook && !digitalFile)}
            >
              {saveMutation.isPending ? "Saving…" : editingBook ? "Update" : bookType === "physical" ? "Add Physical Book" : "Add Digital Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Cataloging;
