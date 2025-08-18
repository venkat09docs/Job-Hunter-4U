import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Contact", href: "#testimonials" },
      { name: "Blog", href: "#blog" }
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
      { name: "Cookie Policy", href: "/cookie-policy" }      
    ]
  };

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Company info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/0bb06074-8159-44c9-96da-62aa6265a361.png" 
                alt="Job Hunter 4U Logo" 
                className="h-8 w-8"
              />
              <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Job Hunter 4U
              </h3>
            </div>
            <p className="text-muted-foreground">
              Smart Job Hunting, Just 4U — Powered by Rise n Shine Technologies
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>info@jobhunter4u.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+91 8686988042</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Hyderabad, India</span>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Job Hunter 4U. A product by Rise n Shine Technologies. All Rights Reserved.
          </p>
          
          {/* Social links */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Github className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;