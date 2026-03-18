import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScanLine, BookOpen, ArrowRightLeft, Keyboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

const QRScanner = () => {
  const [mode, setMode] = useState<"scan" | "manual">("manual");
  const [copyIdInput, setCopyIdInput] = useState("");
  const [scannedCopy, setScannedCopy] = useState<any>(null);
  const [scannedBook, setScannedBook] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [action, setAction] = useState<"issue" | "return">("issue");
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const lookupCopy = async (copyId: string) => {
    const { data: copy, error } = await supabase
      .from("book_copies" as any)
      .select("*")
      .eq("copy_id", copyId)
      .maybeSingle();

    if (error || !copy) {
      toast({ title: "Copy not found", description: `No copy with ID: ${copyId}`, variant: "destructive" });
      setScannedCopy(null);
      setScannedBook(null);
      return;
    }

    setScannedCopy(copy);

    const { data: book } = await supabase
      .from("books")
      .select("*")
      .eq("id", (copy as any).book_id)
      .single();

    setScannedBook(book);
  };

  const startScanner = async () => {
    setMode("scan");
    try {
      const html5Qr = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          lookupCopy(decodedText);
          html5Qr.stop();
          setMode("manual");
          setCopyIdInput(decodedText);
        },
        () => {}
      );
    } catch (err) {
      toast({ title: "Camera error", description: "Could not access camera. Use manual entry instead.", variant: "destructive" });
      setMode("manual");
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    setMode("manual");
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const issueBook = async () => {
    if (!scannedCopy || !userEmail) return;
    setProcessing(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", userEmail).maybeSingle();
      if (!profile) throw new Error("User not found with that email");

      await supabase.from("borrow_records" as any).insert({
        copy_id: scannedCopy.id,
        book_id: scannedCopy.book_id,
        user_id: profile.user_id,
        status: "borrowed",
      });

      await supabase.from("book_copies" as any).update({ status: "borrowed" }).eq("id", scannedCopy.id);

      // Update book available count
      const { data: book } = await supabase.from("books").select("available_copies").eq("id", scannedCopy.book_id).single();
      if (book) {
        await supabase.from("books").update({
          available_copies: Math.max(0, book.available_copies - 1),
          status: book.available_copies - 1 <= 0 ? "checked-out" : "available",
        }).eq("id", scannedCopy.book_id);
      }

      toast({ title: "Book issued successfully" });
      setScannedCopy(null);
      setScannedBook(null);
      setCopyIdInput("");
      setUserEmail("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const returnBook = async () => {
    if (!scannedCopy) return;
    setProcessing(true);
    try {
      // Find active borrow record
      const { data: record } = await supabase
        .from("borrow_records" as any)
        .select("*")
        .eq("copy_id", scannedCopy.id)
        .eq("status", "borrowed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!record) throw new Error("No active borrow record for this copy");

      await supabase.from("borrow_records" as any)
        .update({ status: "returned", return_date: new Date().toISOString() })
        .eq("id", (record as any).id);

      await supabase.from("book_copies" as any).update({ status: "available" }).eq("id", scannedCopy.id);

      const { data: book } = await supabase.from("books").select("available_copies").eq("id", scannedCopy.book_id).single();
      if (book) {
        await supabase.from("books").update({
          available_copies: book.available_copies + 1,
          status: "available",
        }).eq("id", scannedCopy.book_id);
      }

      toast({ title: "Book returned successfully" });
      setScannedCopy(null);
      setScannedBook(null);
      setCopyIdInput("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
  };

  const statusColors: Record<string, string> = {
    available: "default",
    borrowed: "destructive",
    reserved: "secondary",
    lost: "destructive",
    damaged: "destructive",
  };

  return (
    <AdminLayout title="QR Scanner — Issue & Return" description="Scan a book copy's QR code to issue or return it">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner / Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ScanLine className="w-5 h-5" />Scan or Enter Copy ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={mode === "manual" ? "default" : "outline"} onClick={() => { stopScanner(); setMode("manual"); }}>
                <Keyboard className="w-4 h-4 mr-2" />Manual
              </Button>
              <Button variant={mode === "scan" ? "default" : "outline"} onClick={startScanner}>
                <ScanLine className="w-4 h-4 mr-2" />Camera Scan
              </Button>
            </div>

            {mode === "scan" && <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />}

            {mode === "manual" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Copy ID (e.g. abc12345-C001)"
                  value={copyIdInput}
                  onChange={e => setCopyIdInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && lookupCopy(copyIdInput)}
                />
                <Button onClick={() => lookupCopy(copyIdInput)} disabled={!copyIdInput}>Look Up</Button>
              </div>
            )}

            <div>
              <Label>Action</Label>
              <Select value={action} onValueChange={v => setAction(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">Issue Book</SelectItem>
                  <SelectItem value="return">Return Book</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "issue" && (
              <div>
                <Label>User Email</Label>
                <Input value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="user@example.com" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Copy Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!scannedCopy ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowRightLeft className="w-12 h-12 mb-3 opacity-30" />
                <p>Scan or enter a copy ID to see details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scannedCopy.qr_code_url && (
                  <div className="flex justify-center">
                    <img src={scannedCopy.qr_code_url} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Copy ID:</span><p className="font-mono font-semibold">{scannedCopy.copy_id}</p></div>
                  <div><span className="text-muted-foreground">Status:</span><p><Badge variant={statusColors[scannedCopy.status] as any}>{scannedCopy.status}</Badge></p></div>
                  {scannedBook && (
                    <>
                      <div><span className="text-muted-foreground">Title:</span><p className="font-semibold">{scannedBook.title}</p></div>
                      <div><span className="text-muted-foreground">Author:</span><p>{scannedBook.author}</p></div>
                      <div><span className="text-muted-foreground">Category:</span><p>{scannedBook.category}</p></div>
                      <div><span className="text-muted-foreground">ISBN:</span><p className="font-mono text-xs">{scannedBook.isbn || "—"}</p></div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex gap-2">
                  {action === "issue" ? (
                    <Button className="w-full" onClick={issueBook} disabled={processing || scannedCopy.status !== "available" || !patronEmail}>
                      {processing ? "Processing…" : scannedCopy.status !== "available" ? `Cannot issue (${scannedCopy.status})` : "Issue This Copy"}
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={returnBook} disabled={processing || scannedCopy.status !== "borrowed"}>
                      {processing ? "Processing…" : scannedCopy.status !== "borrowed" ? `Cannot return (${scannedCopy.status})` : "Return This Copy"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QRScanner;
