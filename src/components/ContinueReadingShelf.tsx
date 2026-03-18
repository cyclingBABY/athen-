import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import EnhancedBookCard from "./EnhancedBookCard";

interface ContinueReadingShelfProps {
  myBooksLink?: string;
}

const ContinueReadingShelf = ({ myBooksLink = "/my-books" }: ContinueReadingShelfProps) => {
  const { user } = useAuth();

  const { data: activeBooks = [], isLoading } = useQuery({
    queryKey: ["continue-reading", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("circulation_records")
        .select("id, checkout_date, due_date, book_id, books(*)")
        .eq("user_id", user!.id)
        .eq("status", "checked-out")
        .order("checkout_date", { ascending: false })
        .limit(6);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Simulate reading progress based on days elapsed vs total loan period
  const getProgress = (checkoutDate: string, dueDate: string) => {
    const start = new Date(checkoutDate);
    const end = new Date(dueDate);
    const now = new Date();
    const total = differenceInDays(end, start) || 14;
    const elapsed = differenceInDays(now, start);
    return Math.min(Math.max(Math.round((elapsed / total) * 100), 5), 100);
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Continue Reading
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (activeBooks.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Continue Reading
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Pick up where you left off</p>
        </div>
        <Link
          to={myBooksLink}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {activeBooks.map((record: any) => (
          <EnhancedBookCard
            key={record.id}
            book={record.books}
            variant="continue-reading"
            progress={getProgress(record.checkout_date, record.due_date)}
            dueDate={format(new Date(record.due_date), "MMM d")}
            showActions={false}
          />
        ))}
      </div>
    </div>
  );
};

export default ContinueReadingShelf;
