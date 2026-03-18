import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Download, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface CopyGeneratorProps {
  bookId: string;
  bookTitle: string;
  onDone: () => void;
}

interface GeneratedCopy {
  id: string;
  copy_id: string;
  qrDataUrl: string;
}

const CopyGenerator = ({ bookId, bookTitle, onDone }: CopyGeneratorProps) => {
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copies, setCopies] = useState<GeneratedCopy[]>([]);
  const { toast } = useToast();

  const generateCopies = async () => {
    setGenerating(true);
    try {
      // Get current max copy number
      const { data: existing } = await supabase
        .from("book_copies")
        .select("copy_number")
        .eq("book_id", bookId)
        .order("copy_number", { ascending: false })
        .limit(1);

      const startNum = (existing && existing.length > 0 ? existing[0].copy_number : 0) + 1;
      const generated: GeneratedCopy[] = [];

      for (let i = 0; i < count; i++) {
        const copyNum = startNum + i;
        const copyCode = `BOOK-${bookId.slice(0, 6).toUpperCase()}-C${String(copyNum).padStart(3, "0")}`;
        const qrDataUrl = await QRCode.toDataURL(copyCode, { width: 200, margin: 1 });

        const { data, error } = await supabase.from("book_copies").insert({
          book_id: bookId,
          copy_number: copyNum,
          copy_id: copyCode,
          status: "available",
        }).select("id, copy_id").single();

        if (error) throw error;
        generated.push({ id: data.id, copy_id: data.copy_id, qrDataUrl });
      }

      // Update book total/available copies
      const { data: book } = await supabase.from("books").select("total_copies, available_copies").eq("id", bookId).single();
      if (book) {
        await supabase.from("books").update({
          total_copies: book.total_copies + count,
          available_copies: book.available_copies + count,
        }).eq("id", bookId);
      }

      setCopies(generated);
      toast({ title: `${count} copies created!` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const downloadQR = (copy: GeneratedCopy) => {
    const link = document.createElement("a");
    link.download = `${copy.copy_id}.png`;
    link.href = copy.qrDataUrl;
    link.click();
  };

  const printAll = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>QR Codes - ${bookTitle}</title>
      <style>body{font-family:sans-serif;text-align:center;}.qr{display:inline-block;margin:16px;page-break-inside:avoid;}
      .qr img{width:160px;height:160px;}.qr p{font-size:12px;margin:4px 0;}</style></head><body>
      <h2>${bookTitle}</h2>`);
    copies.forEach(c => {
      w.document.write(`<div class="qr"><img src="${c.qrDataUrl}"/><p>${c.copy_id}</p></div>`);
    });
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Copy className="w-5 h-5 text-primary" />
          Add Copies — <span className="text-primary">{bookTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {copies.length === 0 ? (
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label>How many copies?</Label>
              <Input type="number" min={1} max={100} value={count} onChange={e => setCount(Math.max(1, +e.target.value))} className="w-32" />
            </div>
            <Button onClick={generateCopies} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generate Copies & QR Codes
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{copies.length} copies created</Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={printAll} className="gap-1">
                  <Printer className="w-4 h-4" />Print All
                </Button>
                <Button variant="outline" size="sm" onClick={onDone}>Done</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {copies.map(copy => (
                <div key={copy.id} className="flex flex-col items-center border rounded-lg p-3 bg-card">
                  <img src={copy.qrDataUrl} alt={copy.copy_id} className="w-28 h-28" />
                  <p className="text-xs font-mono mt-1 text-center break-all">{copy.copy_id}</p>
                  <Button variant="ghost" size="sm" onClick={() => downloadQR(copy)} className="mt-1 gap-1 text-xs">
                    <Download className="w-3 h-3" />Download
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CopyGenerator;
