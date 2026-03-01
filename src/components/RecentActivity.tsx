import { recentActivity } from "@/lib/mock-data";

const actionColors: Record<string, string> = {
  "Checked out": "text-info",
  Returned: "text-success",
  Reserved: "text-warning",
  Renewed: "text-primary",
};

const RecentActivity = () => (
  <div className="bg-card rounded-xl border">
    <div className="p-5 border-b">
      <h2 className="text-lg font-display font-semibold">Recent Activity</h2>
    </div>
    <div className="divide-y">
      {recentActivity.map((item, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {item.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              <span className={actionColors[item.action] || ""}>{item.action}</span>
              {" · "}
              <span className="italic">{item.book}</span>
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
        </div>
      ))}
    </div>
  </div>
);

export default RecentActivity;
