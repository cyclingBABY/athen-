import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, QrCode } from "lucide-react";

const Barcoding = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ["admin-books-barcode"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("id, title, isbn, category").order("title");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AdminLayout title="Physical Barcoding & Labeling" description="Generate and print barcodes and spine labels for physical items">
      <div className="flex gap-3 mb-4">
        <Button variant="outline"><Printer className="w-4 h-4 mr-2" />Print Selected Labels</Button>
        <Button variant="outline"><QrCode className="w-4 h-4 mr-2" />Generate QR Codes</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><input type="checkbox" className="rounded border-input" /></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>ISBN / Barcode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Label Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : books?.map(book => (
              <TableRow key={book.id}>
                <TableCell><input type="checkbox" className="rounded border-input" /></TableCell>
                <TableCell className="font-medium">{book.title}</TableCell>
                <TableCell className="font-mono text-xs">{book.isbn || "No barcode"}</TableCell>
                <TableCell><Badge variant="secondary">{book.category}</Badge></TableCell>
                <TableCell><Badge variant={book.isbn ? "default" : "destructive"}>{book.isbn ? "Labeled" : "Pending"}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Barcoding;
