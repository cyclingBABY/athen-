import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Search, QrCode, Users, BookMarked, Download, BarChart3, 
  Clock, ShieldCheck, CreditCard, RefreshCw, Layers, Sparkles 
} from "lucide-react";

const Features = () => {
  const featureList = [
    {
      icon: Search,
      title: "Smart Book Catalog",
      description: "Advanced index scanning supporting ISBN queries, search filters by author/genre, real-time physical availability, and digital-only material segregation.",
      color: "from-blue-500/10 to-indigo-500/10 text-indigo-500 border-indigo-500/20",
    },
    {
      icon: QrCode,
      title: "Barcode & QR Scanning",
      description: "Perform physical handovers in milliseconds. Our client-side scanner turns any device camera into a point-of-service barcoding station for quick checkout and return processing.",
      color: "from-purple-500/10 to-pink-500/10 text-pink-500 border-pink-500/20",
    },
    {
      icon: Users,
      title: "Granular Member Controls",
      description: "Role-based account states matching students, faculty, and administrators. Manage registration validations, library card assignments, and custom borrow restrictions.",
      color: "from-amber-500/10 to-orange-500/10 text-orange-500 border-orange-500/20",
    },
    {
      icon: BookMarked,
      title: "Borrow & Return Auditing",
      description: "Full circulation record histories mapping item locations, auto-computed due dates, renewals count tracking, and automatic over-due email alerts.",
      color: "from-emerald-500/10 to-teal-500/10 text-teal-500 border-teal-500/20",
    },
    {
      icon: Download,
      title: "Secure Digital Repository",
      description: "Upload and index digital media files (PDFs, EPUBs). Built-in file streaming capabilities allow patrons to read materials in-browser while preserving publisher copyright restrictions.",
      color: "from-sky-500/10 to-blue-500/10 text-sky-500 border-sky-500/20",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Understand library utilization trends. Export active circulation summaries, track peak reservation queues, monitor fine ledger collections, and export inventory data.",
      color: "from-violet-500/10 to-fuchsia-500/10 text-violet-500 border-violet-500/20",
    },
    {
      icon: Clock,
      title: "Holds & Reading Progress",
      description: "Real-time queues for high-demand physical resources. Staff can monitor who holds the book, queue positions, and visualize borrower reading progress from check-out to due-date.",
      color: "from-rose-500/10 to-red-500/10 text-rose-500 border-rose-500/20",
    },
    {
      icon: CreditCard,
      title: "Integrated Fine Management",
      description: "Automatic fine compilation for overdue materials. Track charges, receive partial credit offsets, process payment status records, and block borrowing permissions for high-debt accounts.",
      color: "from-yellow-500/10 to-amber-500/10 text-amber-500 border-yellow-500/20",
    },
    {
      icon: RefreshCw,
      title: "System Weeding Tools",
      description: "Easily mark books as worn out, damaged, or lost. Keep the database clean by identifying low-circulation inventory items matching removal eligibility policies.",
      color: "from-cyan-500/10 to-sky-500/10 text-cyan-500 border-cyan-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-muted/20 border-b">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),hsl(var(--background)))]" />
        <div className="container mx-auto px-4 text-center relative max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Library Administration
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight">
            Comprehensive Features for <span className="text-primary">Athena LMS</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A modular, full-stack library platform built using modern styling paradigms to serve readers, lecturers, and librarians in unified harmony.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button size="lg" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/catalog-preview">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-20 flex-1">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureList.map((f, i) => (
              <div 
                key={i} 
                className="group relative rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Background accent hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-lg font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="bg-primary text-primary-foreground py-16 text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <h2 className="text-3xl font-display font-bold">Experience Athena Management Firsthand</h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            Join thousands of administrators, students, and lecturers. Access a unified dashboard that makes indexing, scanning, holds, and fines tracking seamless.
          </p>
          <Button size="lg" variant="secondary" className="font-semibold shadow-lg" asChild>
            <Link to="/register">Create Your Account Now</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Features;
