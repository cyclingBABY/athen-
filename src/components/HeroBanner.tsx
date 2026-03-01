import libraryHero from "@/assets/library-hero.jpg";
import { Bell, Plus } from "lucide-react";

const HeroBanner = () => (
  <div className="relative rounded-xl overflow-hidden h-44 mb-6">
    <img src={libraryHero} alt="Library interior" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
    <div className="relative z-10 h-full flex items-center justify-between px-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-1">
          Welcome back, Librarian
        </h1>
        <p className="text-primary-foreground/70 text-sm">
          3 items overdue · 12 new reservations today
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors text-primary-foreground backdrop-blur-sm">
          <Bell className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>
    </div>
  </div>
);

export default HeroBanner;
