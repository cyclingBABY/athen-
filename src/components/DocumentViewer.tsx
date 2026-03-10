import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, MessageSquare, Send, Trash2, Eye, FileText, Headphones } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface DocumentViewerProps {
  book: {
    id: string;
    title: string;
    author: string;
    digital_file_url: string | null;
    digital_file_type: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentViewer = ({ book, open, onOpenChange }: DocumentViewerProps) => {
  const [comment, setComment] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["document-comments", book?.id],
    queryFn: async () => {
      if (!book?.id) return [];
      const { data } = await supabase
        .from("document_comments")
        .select("*")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });
      
      // Fetch profile names for commenters
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.user_id, p.full_name])
      );

      return (data || []).map((c: any) => ({
        ...c,
        author_name: profileMap[c.user_id] || "Unknown User",
      }));
    },
    enabled: open && !!book?.id,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!book?.id || !user?.id || !comment.trim()) return;
      const { error } = await supabase.from("document_comments").insert({
        book_id: book.id,
        user_id: user.id,
        content: comment.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["document-comments", book?.id] });
      toast.success("Comment added");
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("document_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-comments", book?.id] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  if (!book) return null;

  const fileType = book.digital_file_type?.toLowerCase();
  const isPdf = fileType === "pdf";
  const isAudio = fileType === "audio" || fileType === "mp3" || fileType === "wav";
  const isEpub = fileType === "epub";

  const handleDownload = () => {
    if (book.digital_file_url) {
      window.open(book.digital_file_url, "_blank");
    }
  };

  const getFileIcon = () => {
    if (isAudio) return <Headphones className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            <span className="truncate">{book.title}</span>
            <span className="text-sm font-normal text-muted-foreground">by {book.author}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1.5" />
            Download
          </Button>
          <span className="ml-auto text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground uppercase font-medium">
            {book.digital_file_type || "unknown"}
          </span>
        </div>

        <Separator />

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
          {/* Preview Area */}
          {showPreview && (
            <div className="rounded-lg border bg-muted/30 overflow-hidden" style={{ minHeight: 300 }}>
              {isPdf && book.digital_file_url ? (
                <iframe
                  src={book.digital_file_url}
                  className="w-full h-[400px] border-0"
                  title={`Preview: ${book.title}`}
                />
              ) : isAudio && book.digital_file_url ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Headphones className="w-16 h-16 text-primary/40" />
                  <p className="text-sm text-muted-foreground font-medium">{book.title}</p>
                  <audio controls className="w-full max-w-md">
                    <source src={book.digital_file_url} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : isEpub ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileText className="w-16 h-16 text-primary/40" />
                  <p className="text-muted-foreground text-sm">EPUB preview is not available in browser.</p>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1.5" /> Download to read
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileText className="w-16 h-16 text-primary/40" />
                  <p className="text-muted-foreground text-sm">Preview not available for this file type.</p>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-1.5" /> Download instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Comments ({comments?.length || 0})
              </h3>
            </div>

            <ScrollArea className="flex-1 max-h-[200px] pr-2">
              {commentsLoading ? (
                <div className="py-4 text-center text-sm text-muted-foreground">Loading comments…</div>
              ) : !comments?.length ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c: any) => (
                    <div key={c.id} className="bg-card border rounded-lg p-3 group">
                      <div className="flex items-start gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {c.author_name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{c.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(c.created_at), "MMM d, yyyy · h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                        </div>
                        {user?.id === c.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 text-destructive"
                            onClick={() => deleteComment.mutate(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Add Comment */}
            <div className="flex gap-2 mt-3">
              <Textarea
                placeholder="Add a comment…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (comment.trim()) addComment.mutate();
                  }
                }}
              />
              <Button
                size="icon"
                className="shrink-0 self-end"
                disabled={!comment.trim() || addComment.isPending}
                onClick={() => addComment.mutate()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Press Ctrl+Enter to submit</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
