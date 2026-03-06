import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import { BookCopy, Clock } from "lucide-react";
import { format } from "date-fns";

const LecturerMyBooks = () => {
  const { user } = useAuth();

  const { data: loans, isLoading } = useQuery({
    queryKey: ["lecturer-all-loans", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("circulation_records")
        .select("*, books(title, author, cover_image_url, cover_color)")
        .eq("user_id", user!.id)
        .order("checkout_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <LecturerLayout title="My Borrowed Books" description="View your current and past book loans">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !loans?.length ? (
        <div className="text-center py-20">
          <BookCopy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No borrowed books yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {loans.map((loan: any) => {
            const dueDate = new Date(loan.due_date);
            const isOverdue = loan.status === "checked-out" && dueDate < new Date();
            return (
              <div key={loan.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div
                  className="w-12 h-16 rounded-lg flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0"
                  style={{ backgroundColor: loan.books?.cover_color || "hsl(var(--primary))" }}
                >
                  {loan.books?.cover_image_url ? (
                    <img src={loan.books.cover_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    loan.books?.title?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{loan.books?.title}</p>
                  <p className="text-sm text-muted-foreground">{loan.books?.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {loan.status === "returned" ? `Returned ${format(new Date(loan.return_date), "MMM d, yyyy")}` : `Due ${format(dueDate, "MMM d, yyyy")}`}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  loan.status === "returned" ? "bg-muted text-muted-foreground" :
                  isOverdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                }`}>
                  {loan.status === "returned" ? "Returned" : isOverdue ? "Overdue" : "Active"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </LecturerLayout>
  );
};

export default LecturerMyBooks;
