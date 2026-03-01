import { BookOpen, BookCopy, Users, AlertTriangle } from "lucide-react";
import { stats } from "@/lib/mock-data";

const cards = [
  { label: "Total Books", value: stats.totalBooks.toLocaleString(), icon: BookOpen, color: "text-primary" },
  { label: "Checked Out", value: stats.checkedOut.toLocaleString(), icon: BookCopy, color: "text-info" },
  { label: "Active Patrons", value: stats.activePatrons.toLocaleString(), icon: Users, color: "text-accent" },
  { label: "Overdue Items", value: stats.overdueItems.toString(), icon: AlertTriangle, color: "text-destructive" },
];

const StatsCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {cards.map(({ label, value, icon: Icon, color }, i) => (
      <div
        key={label}
        className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <p className="text-2xl font-display font-bold">{value}</p>
      </div>
    ))}
  </div>
);

export default StatsCards;
