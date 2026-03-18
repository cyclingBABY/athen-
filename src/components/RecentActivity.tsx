import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const actionColors: Record<string, string> = {
  "Checked out": "text-info",
  Returned: "text-success",
  Reserved: "text-warning",
  Renewed: "text-primary",
};

interface ActivityItem {
  name: string;
  avatar: string;
  action: string;
  book: string;
  time: string;
}

const RecentActivity = () => {
  const { data: activities = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // Fetch recent circulation records
      const { data: circRecords } = await supabase
        .from("circulation_records")
        .select("id, status, checkout_date, return_date, user_id, book_id, books(title)")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent reservations
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, status, reservation_date, user_id, book_id, books(title)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Collect unique user IDs
      const userIds = new Set<string>();
      circRecords?.forEach((r) => userIds.add(r.user_id));
      reservations?.forEach((r) => userIds.add(r.user_id));

      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map<string, string>(profiles?.map((p) => [p.user_id, (p.full_name as string) || "Unknown"]) || []);

      const getInitials = (name: string) =>
        name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

      const items: (ActivityItem & { date: Date })[] = [];

      circRecords?.forEach((r) => {
        const name = profileMap.get(r.user_id) || "Unknown";
        const bookTitle = (r.books as any)?.title || "Unknown Book";
        let action = "Checked out";
        let date = new Date(r.checkout_date);

        if (r.status === "returned" && r.return_date) {
          action = "Returned";
          date = new Date(r.return_date);
        } else if ((r as any).renewed_count > 0) {
          action = "Renewed";
        }

        items.push({
          name,
          avatar: getInitials(name),
          action,
          book: bookTitle,
          time: formatDistanceToNow(date, { addSuffix: true }),
          date,
        });
      });

      reservations?.forEach((r) => {
        const name = profileMap.get(r.user_id) || "Unknown";
        const bookTitle = (r.books as any)?.title || "Unknown Book";
        items.push({
          name,
          avatar: getInitials(name),
          action: "Reserved",
          book: bookTitle,
          time: formatDistanceToNow(new Date(r.reservation_date), { addSuffix: true }),
          date: new Date(r.reservation_date),
        });
      });

      // Sort by most recent and take top 8
      items.sort((a, b) => b.date.getTime() - a.date.getTime());
      return items.slice(0, 8);
    },
  });

  return (
    <div className="bg-card rounded-xl border">
      <div className="p-5 border-b">
        <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
        ) : (
          activities.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
              <span className={actionColors[item.action as string] || ""}>{item.action as string}</span>
                  {" · "}
                  <span className="italic">{item.book}</span>
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
