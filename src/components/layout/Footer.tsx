import { Link } from "@tanstack/react-router";
import { Github, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";
import { LogoIcon } from "@/components/common/LogoIcon";

const quickLinks = [
  { label: "Browse Rentals", to: "/categories" },
  { label: "Become a Lender", to: "/become-lender" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const accountLinks = [
  { label: "Login", to: "/login" },
  { label: "Sign Up", to: "/register" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Wishlist", to: "/wishlist" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Github, href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-background text-foreground border-t border-border">
      {/* Top divider glow */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(255,90,95,0.6), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-6">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 mb-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shrink-0 shadow-md">
                <LogoIcon className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-foreground font-display">
                PAYENT
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm font-normal">
              India's premier peer-to-peer tech gear rental platform. Access flagship cameras, drones, laptops, audio gear, and tools insured up to ₹5 Lakhs.
            </p>

            <div className="space-y-2 pt-2 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#FF5A5F]" />
                <span>Vizag, Andhra Pradesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#FF5A5F]" />
                <span>payent_support@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#FF5A5F]" />
                <span>+91 7989002612</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF5A5F]">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF5A5F]">
              Account
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FF5A5F]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} Payent Technologies Inc. All rights reserved.</p>

          <div className="flex items-center gap-4">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-8 w-8 rounded-full bg-secondary border border-border text-muted-foreground hover:text-[#FF5A5F] hover:border-[#FF5A5F]/40 flex items-center justify-center transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
