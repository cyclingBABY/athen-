import { Link } from "react-router-dom";
import { Library, Mail, Phone, MapPin } from "lucide-react";

const PublicFooter = () => {
  return (
    <footer className="border-t bg-card py-14">
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
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link to="/catalog-preview" className="hover:text-foreground transition-colors">Catalog</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
              <li><Link to="/staff" className="hover:text-foreground transition-colors">Staff Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@athena-library.edu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>+256 781 072 868</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>100 University Ave</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-10 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Athena Library Management System. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
