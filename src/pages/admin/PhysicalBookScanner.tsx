import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookPlus, ScanLine, ArrowRightLeft } from "lucide-react";
import ScanAndAddBook from "@/components/physical-scanner/ScanAndAddBook";
import BorrowReturnScanner from "@/components/physical-scanner/BorrowReturnScanner";

const PhysicalBookScanner = () => {
  return (
    <AdminLayout title="Physical Book Scanner" description="Scan barcodes, add books, generate QR codes, and manage borrowing">
      <Tabs defaultValue="add" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="add" className="gap-2"><BookPlus className="w-4 h-4" />Add Books</TabsTrigger>
          <TabsTrigger value="borrow" className="gap-2"><ArrowRightLeft className="w-4 h-4" />Borrow / Return</TabsTrigger>
        </TabsList>
        <TabsContent value="add"><ScanAndAddBook /></TabsContent>
        <TabsContent value="borrow"><BorrowReturnScanner /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default PhysicalBookScanner;
