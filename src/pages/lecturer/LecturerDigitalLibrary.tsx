import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import DocumentViewer from "@/components/DocumentViewer";
import { Library, Eye, Download, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LecturerDigitalLibrary = () => {
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const { data: digitalBooks, isLoading } = useQuery({
    queryKey: ["digital-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("*")
        .not("digital_file_url", "is", null)
        .order("title");
      return data ?? [];
    },
  });

  const { data: commentCounts } = useQuery({
    queryKey: ["document-comment-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("document_comments")
        .select("book_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((c: any) => {
        counts[c.book_id] = (counts[c.book_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <LecturerLayout title="Digital Library" description="Browse, preview, and discuss digital resources">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !digitalBooks?.length ? (
        <div className="text-center py-20">
          <Library className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No digital resources available yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {digitalBooks.map((book: any) => (
            <div key={book.id} className="bg-card border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{book.title}</p>
                <p className="text-sm text-muted-foreground">{book.author}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {book.digital_file_type?.toUpperCase() || "FILE"}
                  </Badge>
                  {(commentCounts?.[book.id] || 0) > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {commentCounts[book.id]}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBook(book)}
                >
                  <Eye className="w-4 h-4 mr-1.5" /> View
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => window.open(book.digital_file_url, "_blank")}
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentViewer
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => { if (!open) setSelectedBook(null); }}
      />
    </LecturerLayout>
  );
};

export default LecturerDigitalLibrary;
