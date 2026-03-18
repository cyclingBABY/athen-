import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanLine, Camera, CameraOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";

interface IsbnScannerProps {
  onScanned: (code: string) => void;
}

const IsbnScanner = ({ onScanned }: IsbnScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const startScanner = async () => {
    try {
      const html5Qr = new Html5Qrcode("isbn-scanner-reader");
      scannerRef.current = html5Qr;
      setScanning(true);
      await html5Qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 150 } },
        (decodedText) => {
          onScanned(decodedText);
          toast({ title: "Barcode scanned!", description: decodedText });
          stopScanner();
        },
        () => {}
      );
    } catch {
      toast({ title: "Camera error", description: "Could not access camera. Enter ISBN manually.", variant: "destructive" });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          Barcode Scanner (ISBN)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          {!scanning ? (
            <Button onClick={startScanner} className="gap-2">
              <Camera className="w-4 h-4" />Start Camera Scan
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopScanner} className="gap-2">
              <CameraOff className="w-4 h-4" />Stop Scan
            </Button>
          )}
        </div>
        <div
          id="isbn-scanner-reader"
          className={`w-full max-w-sm rounded-lg overflow-hidden border border-border bg-muted ${scanning ? "" : "hidden"}`}
          style={{ minHeight: scanning ? 250 : 0 }}
        />
        {!scanning && (
          <p className="text-sm text-muted-foreground">
            Point camera at a book's barcode (EAN-13/ISBN) to auto-fill, or enter details manually below.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IsbnScanner;
