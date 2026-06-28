import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, MessageSquare, Send, Trash2, Eye, FileText, Headphones, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface DocumentViewerProps {
  book: {
    id: string;
    title: string;
    author: string;
    category?: string;
    digital_file_url: string | null;
    digital_file_type: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getChapterTitle = (category: string, chNum: number) => {
  const cat = category?.toLowerCase() || "";
  if (cat.includes("fiction") || cat.includes("novel") || cat.includes("sci-fi")) {
    switch (chNum) {
      case 1: return "The Gathering Shadows";
      case 2: return "The Inscription of Catacombs";
      case 3: return "The Silent Archives";
      case 4: return "An Unforeseen Alliance";
      default: return "The Dawn of Revelation";
    }
  } else if (cat.includes("tech") || cat.includes("science") || cat.includes("cs") || cat.includes("math")) {
    switch (chNum) {
      case 1: return "Mathematical Abstractions & Relational Calculus";
      case 2: return "Distributed Consensus Protocols";
      case 3: return "Compilers & Abstract Syntax Structures";
      case 4: return "Complexity Theory & Turing Limits";
      default: return "Quantum Computation Frameworks";
    }
  } else if (cat.includes("history") || cat.includes("social")) {
    switch (chNum) {
      case 1: return "The Pre-Industrial Economic Shift";
      case 2: return "Cultural Hegemony and Inscriptions";
      case 3: return "Agrarian Reforms and Societal Crisis";
      case 4: return "Diplomatic Treaties of the Early Century";
      default: return "Technological Revolutions and Labor Shift";
    }
  } else {
    switch (chNum) {
      case 1: return "Foundations of Academic Inquiries";
      case 2: return "Systematic Research Methodologies";
      case 3: return "Library Catalogs and Archival Sciences";
      case 4: return "Information Security Systems";
      default: return "Future Trends in Resource Management";
    }
  }
};

const getChapterContent = (title: string, category: string, chNum: number, pageNum: number) => {
  const cat = category?.toLowerCase() || "";
  const name = title || "the book";
  
  if (cat.includes("fiction") || cat.includes("novel") || cat.includes("sci-fi")) {
    return `[Page ${pageNum}] Arthur pulled his woolen coat tighter as the storm drummed against the leaded glass windows of the archive room, throwing warped shadows across the floor. He held the copy of "${name}" in his trembling fingers. The inscriptions on the spine were glowing with a faint, cobalt hue. "Chapter ${chNum} starts here," he whispered, looking up at the high shelves of books. "This is where the story changes." He turned the leaf to proceed, knowing that the secrets written here could either save the kingdom or plunge it into total ruin. Page ${pageNum} outlines the journey that followed.`;
  } else if (cat.includes("tech") || cat.includes("science") || cat.includes("cs") || cat.includes("math")) {
    return `[Page ${pageNum}] Computer science is fundamentally governed by mathematical models of computation and formal abstractions. In this segment of "${name}" (Chapter ${chNum}, Page ${pageNum}), we analyze the relational structures and computational logic. The data models map directly to physical compiler registers, optimizing transaction integrity and conflict serializability. When executing queries in distributed databases, we maintain consensus protocols to ensure fault tolerance. We define the state transition algorithms and compile-time structures necessary to scale these abstractions across modern cloud systems.`;
  } else if (cat.includes("history") || cat.includes("social")) {
    return `[Page ${pageNum}] In this section of "${name}" (Chapter ${chNum}, Page ${pageNum}), we trace the economic and social reforms that shaped the early industrial period. The transition from agrarian labor structures to urban industrial production led to unprecedented structural shifts in society. As public archives and early library catalogs expanded, literacy rates climbed, laying the groundwork for the modern information age. We analyze diplomatic letters and public decrees to evaluate the impact of these changes on local communities and labor movements.`;
  } else {
    return `[Page ${pageNum}] The text of "${name}" provides a comprehensive overview of academic inquiry and systematic research methodologies. In Chapter ${chNum}, Page ${pageNum}, we review the key theoretical frameworks and library organization sciences. Modern catalogue engines rely on real-time availability tracking, indexing, and digital access links to provide students and faculty with instant resource clearance. By leveraging semantic search and database caching, academic institutions can scale information retrieval pipelines to satisfy high-volume requirements.`;
  }
};

const DocumentViewer = ({ book, open, onOpenChange }: DocumentViewerProps) => {
  const [comment, setComment] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  
  // Custom mock e-reader states
  const [activeChapter, setActiveChapter] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [readingTheme, setReadingTheme] = useState<"light" | "sepia" | "dark">("sepia");
  const [fontSize, setFontSize] = useState(15);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.id) {
      // 1. Verify if user is active/approved
      supabase.from("profiles")
        .select("approved")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          const approved = data ? !!data.approved : false;
          setIsApproved(approved);

          if (approved && book) {
            // 2. Log e-book access in database transactions_log
            supabase.from("transactions_log").insert({
              user_id: user.id,
              action: "ebook_access",
              meta: {
                book_id: book.id,
                book_title: book.title,
                accessed_at: new Date().toISOString()
              }
            }).then(({ error }) => {
              if (error) console.error("Failed to log e-book access:", error);
            });
          }
        });

      // 3. Save local reading history
      if (book) {
        const key = `online_reading_${user.id}`;
        const history = JSON.parse(localStorage.getItem(key) || "[]");
        if (!history.some((h: any) => h.id === book.id)) {
          const updated = [{
            id: book.id,
            title: book.title,
            author: book.author,
            category: book.category,
            digital_file_url: book.digital_file_url,
            digital_file_type: book.digital_file_type,
            last_opened: new Date().toISOString()
          }, ...history];
          localStorage.setItem(key, JSON.stringify(updated.slice(0, 50)));
        } else {
          const filtered = history.filter((h: any) => h.id !== book.id);
          const item = history.find((h: any) => h.id === book.id);
          const updated = [{
            ...item,
            last_opened: new Date().toISOString()
          }, ...filtered];
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    } else {
      setIsApproved(null);
    }
  }, [open, book?.id, user?.id]);

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
      const link = document.createElement("a");
      link.href = book.digital_file_url;
      link.target = "_blank";
      link.download = book.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    if (isAudio) return <Headphones className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        {isApproved === null ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying access permissions...</p>
          </div>
        ) : isApproved === false ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Access Restricted</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your account is currently inactive or deactivated. Please contact the Library Administration to restore your e-book access.
              </p>
            </div>
          </div>
        ) : (
          <>
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
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(book.digital_file_url)}&embedded=true`}
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
                <div className="flex flex-col md:flex-row h-[420px] bg-background border rounded-lg overflow-hidden">
                  {/* Left Column: Chapters Index */}
                  <div className="w-full md:w-1/3 border-r bg-muted/20 flex flex-col">
                    <div className="p-3 border-b bg-muted/40 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      Chapters List
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                      {[1, 2, 3, 4, 5].map((chNum) => (
                        <button
                          key={chNum}
                          onClick={() => {
                            setActiveChapter(chNum);
                            setActivePage(1);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors ${
                            activeChapter === chNum
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          Chapter {chNum}: {getChapterTitle(book.category, chNum)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Reading view */}
                  <div className={`flex-1 flex flex-col ${
                    readingTheme === "sepia" 
                      ? "bg-[#faf6ee] text-[#433422]" 
                      : readingTheme === "dark" 
                      ? "bg-[#121212] text-[#e0e0e0] border-[#2c2c2c]" 
                      : "bg-background text-foreground"
                  }`}>
                    {/* Reading toolbar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 text-xs gap-3">
                      <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                        Reading View
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Theme toggles */}
                        <button 
                          onClick={() => setReadingTheme("light")} 
                          className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold bg-white text-black ${readingTheme === "light" && "ring-2 ring-primary"}`}
                          title="Light Theme"
                        >L</button>
                        <button 
                          onClick={() => setReadingTheme("sepia")} 
                          className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold bg-[#faf6ee] text-[#433422] ${readingTheme === "sepia" && "ring-2 ring-primary"}`}
                          title="Sepia Theme"
                        >S</button>
                        <button 
                          onClick={() => setReadingTheme("dark")} 
                          className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center font-bold bg-[#121212] text-white ${readingTheme === "dark" && "ring-2 ring-primary"}`}
                          title="Dark Theme"
                        >D</button>

                        <Separator orientation="vertical" className="h-4" />

                        {/* Font size */}
                        <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="px-1.5 py-0.5 border rounded hover:bg-muted font-mono" title="Decrease size">A-</button>
                        <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} className="px-1.5 py-0.5 border rounded hover:bg-muted font-mono" title="Increase size">A+</button>
                      </div>
                    </div>

                    {/* Paper content */}
                    <div className="flex-1 overflow-y-auto p-6 font-serif leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                      <h4 className="font-bold text-center mb-4 tracking-tight" style={{ fontSize: `${fontSize + 4}px` }}>
                        Chapter {activeChapter}: {getChapterTitle(book.category, activeChapter)}
                      </h4>
                      <p className="indent-8 text-justify">
                        {getChapterContent(book.title, book.category, activeChapter, activePage)}
                      </p>
                    </div>

                    {/* Reading footer / pagination */}
                    <div className="px-4 py-2 border-t bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Book: {book.title}</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-[11px]" 
                          disabled={activePage === 1}
                          onClick={() => setActivePage(activePage - 1)}
                        >
                          Prev
                        </Button>
                        <span className="font-mono">Page {activePage} of 3</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-[11px]" 
                          disabled={activePage === 3}
                          onClick={() => setActivePage(activePage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
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
      </>
    )}
  </DialogContent>
</Dialog>
  );
};

export default DocumentViewer;
