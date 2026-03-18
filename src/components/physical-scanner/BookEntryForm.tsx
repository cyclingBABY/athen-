import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookPlus, Upload, Loader2, Barcode, RefreshCw } from "lucide-react";

interface BookEntryFormProps {
  isbn: string;
  onIsbnChange: (v: string) => void;
  onBookSaved: (bookId: string, title: string) => void;
}

const CATEGORIES = ["General", "Fiction", "Non-Fiction", "Science", "Technology", "History", "Art", "Education", "Medical", "Law", "Reference"];

const generateBarcode = () => {
  const prefix = "LIB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const BookEntryForm = ({ isbn, onIsbnChange, onBookSaved }: BookEntryFormProps) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [shelfLocation, setShelfLocation] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<any>(null);
  const [barcodeMode, setBarcodeMode] = useState<"auto" | "manual">("auto");
  const [manualBarcode, setManualBarcode] = useState("");
  const [generatedBarcode, setGeneratedBarcode] = useState(generateBarcode());
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentBarcode = barcodeMode === "auto" ? generatedBarcode : manualBarcode;

  const checkDuplicate = async () => {
    if (isbn) {
      const { data } = await supabase.from("books").select("id, title, author, isbn, total_copies").eq("isbn", isbn).limit(1);
      if (data && data.length > 0) return data[0];
    }
    if (title) {
      const { data } = await supabase.from("books").select("id, title, author, isbn, total_copies").ilike("title", title).limit(1);
      if (data && data.length > 0) return data[0];
    }
    return null;
  };

  const uploadCover = async (bookId: string): Promise<string | null> => {
    if (!coverFile) return null;
    const ext = coverFile.name.split(".").pop();
    const path = `${bookId}.${ext}`;
    const { error } = await supabase.storage.from("book-covers").upload(path, coverFile, { upsert: true });
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (useExisting = false) => {
    if (!useExisting && (!title || !author)) {
      toast({ title: "Title and Author are required", variant: "destructive" });
      return;
    }
    if (!currentBarcode) {
      toast({ title: "Barcode is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (useExisting && duplicate) {
        onBookSaved(duplicate.id, duplicate.title);
        setDuplicate(null);
        setSaving(false);
        return;
      }

      const dup = await checkDuplicate();
      if (dup) {
        setDuplicate(dup);
        setSaving(false);
        return;
      }

      const { data: newBook, error } = await supabase.from("books").insert({
        title, author,
        isbn: isbn || null,
        barcode: currentBarcode,
        description: description || null,
        category, shelf_location: shelfLocation || null,
      }).select("id, title").single();

      if (error) throw error;

      if (coverFile && newBook) {
        const coverUrl = await uploadCover(newBook.id);
        if (coverUrl) {
          await supabase.from("books").update({ cover_image_url: coverUrl }).eq("id", newBook.id);
        }
      }

      toast({ title: "Book created!", description: newBook.title });
      onBookSaved(newBook.id, newBook.title);
      resetForm();
    } catch (err: any) {
      toast({ title: "Error saving book", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setTitle(""); setAuthor(""); setDescription(""); setCategory("General");
    setShelfLocation(""); setCoverFile(null); onIsbnChange(""); setDuplicate(null);
    setManualBarcode(""); setGeneratedBarcode(generateBarcode());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookPlus className="w-5 h-5 text-primary" />Book Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicate && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-4 space-y-2">
            <p className="font-medium text-sm">Duplicate found!</p>
            <p className="text-sm text-muted-foreground">
              "{duplicate.title}" by {duplicate.author} already exists ({duplicate.total_copies} copies).
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSubmit(true)}>Add copies to existing</Button>
              <Button size="sm" variant="outline" onClick={() => setDuplicate(null)}>Create new anyway</Button>
            </div>
          </div>
        )}

        {/* Barcode Section */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-primary" />
              <Label className="text-sm font-semibold">Book Barcode</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{barcodeMode === "auto" ? "Auto-generated" : "Manual / Scanner"}</span>
              <Switch
                checked={barcodeMode === "manual"}
                onCheckedChange={(checked) => setBarcodeMode(checked ? "manual" : "auto")}
              />
            </div>
          </div>

          {barcodeMode === "auto" ? (
            <div className="flex items-center gap-2">
              <Input value={generatedBarcode} readOnly className="font-mono text-sm bg-background" />
              <Button type="button" variant="outline" size="icon" onClick={() => setGeneratedBarcode(generateBarcode())} title="Regenerate">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Input
                ref={barcodeInputRef}
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="Scan barcode with USB reader or type manually…"
                className="font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">USB barcode scanners will auto-fill this field. You can also type it manually.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" />
          </div>
          <div className="space-y-1.5">
            <Label>Author *</Label>
            <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
          </div>
          <div className="space-y-1.5">
            <Label>ISBN</Label>
            <Input value={isbn} onChange={e => onIsbnChange(e.target.value)} placeholder="From barcode reader or enter manually" className="font-mono" />
            <p className="text-xs text-muted-foreground">Auto-filled when you scan an ISBN barcode, or enter manually</p>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Shelf Location</Label>
            <Input value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} placeholder="e.g. A1-Row3" />
          </div>
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
        </div>

        <Button onClick={() => handleSubmit(false)} disabled={saving || !currentBarcode} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Save Book
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookEntryForm;
