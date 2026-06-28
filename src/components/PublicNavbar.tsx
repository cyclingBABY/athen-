import { Link, useLocation } from "react-router-dom";
import { Library, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PublicNavbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Catalog", path: "/catalog-preview" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Library className="w-7 h-7 text-primary" />
          <span className="text-xl font-display font-bold text-foreground">Athena</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.path) ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Register</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Links */}
      {isOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block text-base font-medium py-1 transition-colors ${
                isActive(link.path) ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t pt-3 flex flex-col gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/auth" onClick={() => setIsOpen(false)}>Login</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link to="/register" onClick={() => setIsOpen(false)}>Register</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
