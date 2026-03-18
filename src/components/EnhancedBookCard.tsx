import { BookOpen, Eye, Download, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface EnhancedBookCardProps {
  book: any;
  progress?: number; // 0-100
  dueDate?: string;
  onView?: () => void;
  onDownload?: () => void;
  onReserve?: () => void;
  showActions?: boolean;
  variant?: "default" | "continue-reading";
}

const genreColors: Record<string, string> = {
  Fiction: "bg-primary/10 text-primary border-primary/20",
  Science: "bg-info/10 text-info border-info/20",
  Technology: "bg-info/10 text-info border-info/20",
  History: "bg-warning/10 text-warning border-warning/20",
  Philosophy: "bg-accent/10 text-accent border-accent/20",
  Psychology: "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]/20",
  "Sci-Fi": "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20",
  Digital: "bg-primary/10 text-primary border-primary/20",
  General: "bg-muted text-muted-foreground border-border",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-accent/10 text-accent border-accent/20" },
  "checked-out": { label: "Checked Out", className: "bg-info/10 text-info border-info/20" },
  reserved: { label: "Reserved", className: "bg-warning/10 text-warning border-warning/20" },
  overdue: { label: "Overdue", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const EnhancedBookCard = ({
  book,
  progress,
  dueDate,
  onView,
  onDownload,
  onReserve,
  showActions = true,
  variant = "default",
}: EnhancedBookCardProps) => {
  const status = statusConfig[book.status] || statusConfig.available;
  const genreStyle = genreColors[book.category] || genreColors.General;
  const hasCover = !!book.cover_image_url;
  const isDigital = !!book.digital_file_url;
  const isContinueReading = variant === "continue-reading";

  return (
    <div className="group bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Cover Image Area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {hasCover ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: book.cover_color || "hsl(24 80% 30%)" }}
          >
            <BookOpen className="w-10 h-10 text-white/60" />
            <p className="text-white/80 text-xs font-medium text-center px-3 line-clamp-2">
              {book.title}
            </p>
          </div>
        )}

        {/* Genre tag overlay */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className={`text-[10px] backdrop-blur-md bg-background/80 ${genreStyle}`}>
            {book.category}
          </Badge>
        </div>

        {/* Digital badge */}
        {isDigital && (
          <div className="absolute top-2 right-2">
            <Badge className="text-[10px] bg-primary text-primary-foreground">
              {book.digital_file_type === "audio" ? "🎧 Audio" : "📄 PDF"}
            </Badge>
          </div>
        )}

        {/* Progress bar for continue reading */}
        {isContinueReading && typeof progress === "number" && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1.5 flex-1" />
              <span className="text-[10px] text-white font-medium">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 leading-tight">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{book.author}</p>

        {/* Synopsis */}
        {book.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${status.className}`}>
            {status.label}
          </Badge>
          {book.publish_year && (
            <span className="text-[10px] text-muted-foreground">
              {book.publish_year > 0 ? book.publish_year : `${Math.abs(book.publish_year)} BC`}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {book.available_copies}/{book.total_copies} copies
          </span>
        </div>

        {/* Due date for continue reading */}
        {isContinueReading && dueDate && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Due {dueDate}</span>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mt-auto pt-3">
            {isDigital && onView && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2 flex-1" onClick={onView}>
                <Eye className="w-3 h-3 mr-1" /> View
              </Button>
            )}
            {isDigital && onDownload && (
              <Button size="sm" variant="outline" className="h-7 text-xs px-2 flex-1" onClick={onDownload}>
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
            )}
            {!isDigital && onReserve && book.available_copies > 0 && (
              <Button size="sm" variant="default" className="h-7 text-xs px-3 w-full" onClick={onReserve}>
                Reserve
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedBookCard;
