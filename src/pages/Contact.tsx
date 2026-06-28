import { useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast({
        title: "Message Sent Successfully!",
        description: "Our library administration team will respond to your email shortly.",
      });
      setFormData({ name: "", email: "", subject: "General Inquiry", message: "" });
    }, 1200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const contacts = [
    { icon: Mail, label: "Email Support", value: "info@athena-library.edu" },
    { icon: Phone, label: "Phone Desk", value: "+256 781 072 868" },
    { icon: MapPin, label: "Campus Location", value: "100 University Ave, Library Complex" },
    { icon: Clock, label: "Operating Hours", value: "Mon - Fri: 8:00 AM - 10:00 PM, Sat: 9:00 AM - 6:00 PM" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative py-20 bg-muted/20 border-b overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground leading-tight">
            Contact <span className="text-primary">Athena Library Desk</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Have questions about account registrations, fines, barcode scanning, or digital uploads? Drop us a message.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-20 flex-1">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-5 gap-12">
            
            {/* Contact Details */}
            <div className="md:col-span-2 space-y-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-display font-bold text-foreground">Get in Touch</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our front-desk librarians and system administrators are ready to assist.
                </p>
              </div>

              <div className="space-y-6">
                {contacts.map((c, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                      <c.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{c.label}</h4>
                      <p className="text-sm font-medium text-foreground mt-0.5">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-3 bg-card border rounded-2xl p-8 shadow-sm">
              {isSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground">Thank You!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Your message was submitted. We will email you back within 24 business hours.
                  </p>
                  <Button variant="outline" onClick={() => setIsSuccess(false)} className="mt-4">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@university.edu"
                      className="w-full px-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                    >
                      <option>General Inquiry</option>
                      <option>Account Registration Issue</option>
                      <option>Fine Dispute</option>
                      <option>Catalog Suggestion</option>
                      <option>Technical Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your query here…"
                      className="w-full px-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full font-semibold">
                    {isSubmitting ? (
                      "Sending…"
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Contact;
