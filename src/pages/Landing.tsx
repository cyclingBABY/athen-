import { Link } from "react-router-dom";
import { BookOpen, Search, BarChart3, Users, QrCode, ArrowRight, BookMarked, Library, Download, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-library.jpg";
import scanImg from "@/assets/scanning-books.jpg";
import shelvesImg from "@/assets/library-shelves.jpg";

const features = [
  { icon: Search, title: "Smart Book Catalog", desc: "Advanced search with filters by genre, author, availability, and ISBN for instant discovery." },
  { icon: QrCode, title: "Barcode Scanning", desc: "Scan barcodes for lightning-fast borrowing and returns — no manual entry required." },
  { icon: Users, title: "Member Management", desc: "Register and manage students, staff, and faculty with role-based access controls." },
  { icon: BookMarked, title: "Borrow & Return Tracking", desc: "Real-time tracking of due dates, renewals, and overdue notifications." },
  { icon: Download, title: "Digital Library", desc: "Upload and manage ebooks, PDFs, and audiobooks with secure digital lending." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Comprehensive reports on circulation trends, popular titles, and patron activity." },
];

const steps = [
  { num: "01", title: "Register an Account", desc: "Sign up as a student, staff member, or administrator in seconds." },
  { num: "02", title: "Search the Catalog", desc: "Browse thousands of titles with powerful filters and real-time availability." },
  { num: "03", title: "Borrow or Access", desc: "Check out physical books or instantly access digital resources from anywhere." },
];

const Landing = () => {
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("books").select("*").limit(4).then(({ data }) => {
      if (data) setBooks(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Library className="w-7 h-7 text-primary" />
            <span className="text-xl font-display font-bold text-foreground">Athena</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#catalog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Catalog</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Trusted by 200+ institutions
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-foreground">
                Smart Library Management{" "}
                <span className="text-primary">Made Simple</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Athena helps libraries manage books, members, borrowing, digital resources, and analytics — all from one elegant platform built for modern institutions.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" asChild>
                  <Link to="/auth">
                    Explore Catalog <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">Create Account</Link>
                </Button>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative hidden md:block">
              <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">Athena Dashboard</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Books", value: "12,847", color: "bg-primary/10 text-primary" },
                      { label: "Active Members", value: "3,219", color: "bg-accent/10 text-accent" },
                      { label: "Checked Out", value: "1,432", color: "bg-info/10 text-info" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
                        <p className="text-[10px] uppercase tracking-wide opacity-70">{s.label}</p>
                        <p className="text-lg font-bold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {["One Hundred Years of Solitude", "A Brief History of Time", "Sapiens"].map((title, i) => (
                      <div key={title} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="w-6 h-8 rounded-sm flex-shrink-0" style={{ backgroundColor: ["hsl(24,80%,30%)", "hsl(210,60%,50%)", "hsl(36,70%,55%)"][i] }} />
                        <span className="text-xs font-medium flex-1">{title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${i === 1 ? "bg-info/10 text-info" : "bg-success/10 text-success"}`}>
                          {i === 1 ? "Checked out" : "Available"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 inset-0 translate-x-4 translate-y-4 rounded-xl bg-primary/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Everything Your Library Needs
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              A complete toolkit for modern library operations, from cataloging to analytics.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-shadow border bg-card">
                <CardContent className="p-6 space-y-3">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Get started in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.num} className="text-center space-y-4 relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                )}
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="text-xl font-display font-bold text-primary">{s.num}</span>
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Preview */}
      <section id="catalog" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Browse the Catalog
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Discover thousands of titles available for borrowing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {(books.length > 0 ? books : [
              { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", status: "available", cover_color: "hsl(24,80%,30%)" },
              { title: "A Brief History of Time", author: "Stephen Hawking", status: "checked-out", cover_color: "hsl(210,60%,50%)" },
              { title: "Sapiens", author: "Yuval Noah Harari", status: "available", cover_color: "hsl(36,70%,55%)" },
              { title: "Dune", author: "Frank Herbert", status: "reserved", cover_color: "hsl(36,90%,50%)" },
            ]).map((book: any, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="h-40 flex items-center justify-center" style={{ backgroundColor: book.cover_color || "hsl(210,60%,50%)" }}>
                  <BookOpen className="w-12 h-12 text-white/40" />
                </div>
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-display font-semibold text-sm text-foreground line-clamp-1">{book.title}</h4>
                  <p className="text-xs text-muted-foreground">{book.author}</p>
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full capitalize ${
                    book.status === "available" ? "bg-success/10 text-success" :
                    book.status === "checked-out" ? "bg-info/10 text-info" :
                    "bg-warning/10 text-warning"
                  }`}>
                    {book.status?.replace("-", " ")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-primary p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
              Ready to Transform Your Library?
            </h2>
            <p className="text-primary-foreground/80 mt-4 max-w-lg mx-auto">
              Join hundreds of institutions already using Athena to streamline their library operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">Register Now <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/auth">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-card py-14">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Library className="w-6 h-6 text-primary" />
                <span className="text-lg font-display font-bold text-foreground">Athena</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Smart library management for modern institutions. Built for universities, schools, and public libraries.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#hero" className="hover:text-foreground transition-colors">Home</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#catalog" className="hover:text-foreground transition-colors">Catalog</a></li>
                <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@athena-library.edu</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 (555) 234-5678</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 100 University Ave</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-10 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Athena Library Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
