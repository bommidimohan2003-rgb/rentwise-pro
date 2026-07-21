import { Link } from "@tanstack/react-router";
<<<<<<< HEAD
import { Github, Instagram, Twitter, Youtube } from "lucide-react";
import { LogoIcon } from "@/components/common/LogoIcon";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Browse", to: "/categories" },
      { label: "Become a Lender", to: "/become-lender" },
      { label: "Wishlist", to: "/wishlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Careers", to: "/about" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Sign up", to: "/register" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-16 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl btn-gradient">
              <LogoIcon className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold">Payent</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Rent premium tech gear from trusted lenders in your city. Delivered fast. Insured
            always.
          </p>
          <div className="flex gap-2">
            {[Twitter, Instagram, Youtube, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-secondary transition-colors"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
=======
import { Github, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from "lucide-react";

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
  { label: "Privacy Policy", href: "#" },
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
    <footer
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080114 0%, #050010 100%)" }}
    >
      {/* Top divider glow */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(139,92,246,0.4), rgba(236,72,153,0.3), transparent)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 mb-14">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                }}
              >
                P
              </div>
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #c4b5fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PAYENT
              </span>
            </Link>

            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              Rent premium electronics and professional tools from verified lenders anytime,
              anywhere. Insured, fast, and affordable.
            </p>

            {/* Contact info */}
            <div className="space-y-2">
              {[
                { icon: Mail, text: "support@payent.com" },
                { icon: Phone, text: "+91 98765 43210" },
                { icon: MapPin, text: "Mumbai, India" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-600">
                  <Icon className="h-3.5 w-3.5 text-violet-500/60" />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.15)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.4)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(139,92,246,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              Product
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-500 hover:text-violet-400 transition-colors duration-200"
                  >
>>>>>>> 0197521 (Redesign Payent frontend UI)
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
<<<<<<< HEAD
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Payent Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
=======

          {/* Account */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              Account
            </h4>
            <ul className="space-y-3">
              {accountLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-500 hover:text-violet-400 transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter mini */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">
              Stay Updated
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Get weekly rental deals and new arrivals directly in your inbox.
            </p>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-300 placeholder:text-slate-700 outline-none"
              />
              <button
                className="px-3 py-2.5 text-xs font-semibold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs text-slate-700">
            © {new Date().getFullYear()} Payent Inc. All rights reserved.
          </p>
          <div className="flex gap-5">
            {legalLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs text-slate-700 hover:text-slate-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
>>>>>>> 0197521 (Redesign Payent frontend UI)
          </div>
        </div>
      </div>
    </footer>
  );
}
