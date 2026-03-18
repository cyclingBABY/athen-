import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, Camera, CameraOff, Keyboard, CheckCircle2, XCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

const BorrowReturnScanner = () => {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [copyCode, setCopyCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; action: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const manualRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleScan = async (code: string) => {
    if (processing) return;
    setProcessing(true);
    setCopyCode(code);

    try {
      const { data: copy, error } = await supabase
        .from("book_copies")
        .select("*")
        .eq("copy_id", code)
        .maybeSingle();

      if (error || !copy) {
        setResult({ success: false, message: `Copy "${code}" not found`, action: "" });
        setProcessing(false);
        return;
      }

      const { data: book } = await supabase.from("books").select("title").eq("id", copy.book_id).single();
      const bookTitle = book?.title || "Unknown";

      if (copy.status === "available") {
        // Mark as borrowed
        await supabase.from("book_copies").update({ status: "borrowed" }).eq("id", copy.id);
        
        const { data: bookData } = await supabase.from("books").select("available_copies").eq("id", copy.book_id).single();
        if (bookData) {
          await supabase.from("books").update({
            available_copies: Math.max(0, bookData.available_copies - 1),
            status: bookData.available_copies - 1 <= 0 ? "checked-out" : "available",
          }).eq("id", copy.book_id);
        }

        setResult({ success: true, message: `"${bookTitle}" — Copy ${copy.copy_id}`, action: "ISSUED (available → borrowed)" });
      } else if (copy.status === "borrowed") {
        // Mark as returned
        await supabase.from("book_copies").update({ status: "available" }).eq("id", copy.id);

        // Update active borrow record
        const { data: record } = await supabase
          .from("borrow_records")
          .select("id")
          .eq("copy_id", copy.id)
          .eq("status", "borrowed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (record) {
          await supabase.from("borrow_records").update({ status: "returned", return_date: new Date().toISOString() }).eq("id", record.id);
        }

        const { data: bookData } = await supabase.from("books").select("available_copies").eq("id", copy.book_id).single();
        if (bookData) {
          await supabase.from("books").update({
            available_copies: bookData.available_copies + 1,
            status: "available",
          }).eq("id", copy.book_id);
        }

        setResult({ success: true, message: `"${bookTitle}" — Copy ${copy.copy_id}`, action: "RETURNED (borrowed → available)" });
      } else {
        setResult({ success: false, message: `Copy is "${copy.status}" — cannot toggle`, action: "" });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message, action: "" });
    }
    setProcessing(false);
  };

  const startCamera = async () => {
    try {
      const html5Qr = new Html5Qrcode("borrow-scanner-reader");
      scannerRef.current = html5Qr;
      setScanning(true);
      setMode("camera");
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          handleScan(text);
          stopCamera();
        },
        () => {}
      );
    } catch {
      toast({ title: "Camera error", variant: "destructive" });
      setScanning(false);
      setMode("manual");
    }
  };

  const stopCamera = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
    setMode("manual");
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  useEffect(() => {
    if (mode === "manual") manualRef.current?.focus();
  }, [mode, result]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => { stopCamera(); setMode("manual"); }} className="gap-2">
              <Keyboard className="w-4 h-4" />Manual / USB Scanner
            </Button>
            <Button variant={mode === "camera" ? "default" : "outline"} onClick={startCamera} className="gap-2">
              <Camera className="w-4 h-4" />Camera
            </Button>
          </div>

          <div id="borrow-scanner-reader" className={`w-full rounded-lg overflow-hidden ${scanning ? "" : "hidden"}`} style={{ minHeight: scanning ? 280 : 0 }} />

          {mode === "manual" && (
            <div className="space-y-2">
              <Label>Copy Code (scan or type)</Label>
              <div className="flex gap-2">
                <Input
                  ref={manualRef}
                  value={copyCode}
                  onChange={e => setCopyCode(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && copyCode) handleScan(copyCode); }}
                  placeholder="Scan QR code with USB scanner…"
                  autoFocus
                />
                <Button onClick={() => handleScan(copyCode)} disabled={!copyCode || processing}>
                  {processing ? "…" : "Go"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">USB barcode scanners auto-submit on Enter key.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Result</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScanLine className="w-12 h-12 mb-3 opacity-20" />
              <p>Scan a QR code to toggle borrow / return</p>
            </div>
          ) : result.success ? (
            <div className="flex flex-col items-center text-center py-8 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <Badge className="bg-green-500/10 text-green-700 border-green-500/30 text-sm">{result.action}</Badge>
              <p className="font-semibold">{result.message}</p>
              <Button variant="outline" onClick={() => { setResult(null); setCopyCode(""); }}>Scan Next</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-8 space-y-3">
              <XCircle className="w-16 h-16 text-destructive" />
              <p className="font-semibold text-destructive">{result.message}</p>
              <Button variant="outline" onClick={() => { setResult(null); setCopyCode(""); }}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BorrowReturnScanner;
