import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ShieldCheck, Heart, Award, ArrowRight } from "lucide-react";

const About = () => {
  const stats = [
    { number: "25,000+", label: "Physical Volumes Indexed" },
    { number: "12,000+", label: "Digital Resources Hosted" },
    { number: "5,000+", label: "Daily Active Readers" },
    { number: "99.99%", label: "System Uptime Guaranteed" },
  ];

  const pillars = [
    {
      icon: BookOpen,
      title: "Democratic Access",
      desc: "Athena believes reading materials should be instantly accessible. We unify physical shelf indexing and digital document streaming into a singular browser-accessible framework.",
    },
    {
      icon: ShieldCheck,
      title: "Institutional Integrity",
      desc: "Built with fine invoicing, role verification for students/faculty, and catalog weeding logs, ensuring the library remains audit-proof and highly organized.",
    },
    {
      icon: Heart,
      title: "User-Centric Design",
      desc: "Eliminating waiting times. With live hold queues, active borrower reading progress bars, and camera-based barcode stations, we design software that honors our patrons' time.",
    },
    {
      icon: Award,
      title: "Educational Excellence",
      desc: "Used by premier colleges to empower course reading lists and lecturer recomendations, keeping classrooms synced with current literature collections.",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative py-20 bg-muted/20 border-b overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6 relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-foreground leading-tight">
            About the <span className="text-primary">Athena LMS</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Athena is a next-generation library ecosystem designed to bridge the gap between traditional print catalogs and secure digital lending.
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-bold text-foreground">Our Story & Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                Athena was conceived as a research initiative aimed at resolving key friction points in academic libraries: long queue delays for reserves, outdated physical card indexes, and disjointed digital catalogs.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, our system coordinates full-service circulation pipelines. By mapping precise physical shelf coordinates, providing client-side barcode scanning, and displaying visual reading progress loops, Athena empowers institutions to run highly efficient library hubs.
              </p>
            </div>
            
            {/* Stats Graphic Box */}
            <div className="bg-card border rounded-2xl p-8 grid grid-cols-2 gap-6 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
              {stats.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-3xl font-display font-extrabold text-primary">{s.number}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars Grid */}
      <section className="py-20 bg-muted/30 border-t border-b">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-display font-bold text-foreground">Our Four Foundations</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              How we design and engineer library experiences for students, teachers, and catalogers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((p, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-card border rounded-xl shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                  <p.icon className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-bold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Want to join the movement?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Register for a patron account today. Search our catalog, borrow titles, view course reading lists, and read secure digital papers.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Create Account <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default About;
