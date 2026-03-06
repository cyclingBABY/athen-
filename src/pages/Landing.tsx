import { Link } from "react-router-dom";
import { BookOpen, Search, BarChart3, Users, QrCode, ArrowRight, BookMarked, Library, Download, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-library.jpg";
import scanImg from "@/assets/scanning-books.jpg";
import shelvesImg from "@/assets/library-shelves.jpg";
import coverSolitude from "@/assets/cover-solitude.jpg";
import coverTime from "@/assets/cover-time.jpg";
import coverSapiens from "@/assets/cover-sapiens.jpg";
import coverDune from "@/assets/cover-dune.jpg";

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
        <div className="absolute inset-0">
          <img src={heroImg} alt="Modern university library with students" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-muted-foreground">
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
              <Button size="lg" variant="outline" className="bg-card/50 backdrop-blur-sm" asChild>
                <Link to="/auth">Create Account</Link>
              </Button>
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

      {/* How It Works — with photos */}
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

          {/* Step 1 — image left */}
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto mb-16">
            <img src={shelvesImg} alt="Library bookshelves" className="rounded-xl shadow-lg w-full h-64 object-cover" />
            <div className="space-y-3">
              <span className="text-4xl font-display font-bold text-primary/20">01</span>
              <h3 className="text-xl font-display font-semibold text-foreground">Register an Account</h3>
              <p className="text-muted-foreground leading-relaxed">Sign up as a student, staff member, or administrator in seconds. Your account will be reviewed and approved by the library admin.</p>
            </div>
          </div>

          {/* Step 2 — image right */}
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto mb-16">
            <div className="space-y-3 md:order-1">
              <span className="text-4xl font-display font-bold text-primary/20">02</span>
              <h3 className="text-xl font-display font-semibold text-foreground">Search the Catalog</h3>
              <p className="text-muted-foreground leading-relaxed">Browse thousands of titles with powerful filters and real-time availability. Find physical books by shelf or access digital resources instantly.</p>
            </div>
            <img src={scanImg} alt="Scanning book barcode" className="rounded-xl shadow-lg w-full h-64 object-cover md:order-2" />
          </div>

          {/* Step 3 — image left */}
          <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
            <img src={heroImg} alt="Students in library" className="rounded-xl shadow-lg w-full h-64 object-cover" />
            <div className="space-y-3">
              <span className="text-4xl font-display font-bold text-primary/20">03</span>
              <h3 className="text-xl font-display font-semibold text-foreground">Borrow or Access</h3>
              <p className="text-muted-foreground leading-relaxed">Check out physical books with QR code scanning or instantly access digital resources from anywhere on any device.</p>
            </div>
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
              { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", status: "available", cover_image_url: coverSolitude },
              { title: "A Brief History of Time", author: "Stephen Hawking", status: "checked-out", cover_image_url: coverTime },
              { title: "Sapiens", author: "Yuval Noah Harari", status: "available", cover_image_url: coverSapiens },
              { title: "Dune", author: "Frank Herbert", status: "reserved", cover_image_url: coverDune },
            ]).map((book: any, i) => (
              <Card key={i} className="overflow-hidden group hover:shadow-lg transition-shadow">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 flex items-center justify-center" style={{ backgroundColor: book.cover_color || "hsl(210,60%,50%)" }}>
                    <BookOpen className="w-12 h-12 text-white/40" />
                  </div>
                )}
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
