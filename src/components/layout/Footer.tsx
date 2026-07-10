import { Link } from "@tanstack/react-router";
import { Github, Instagram, Twitter, Youtube, Zap } from "lucide-react";

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
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold">TechRent</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Rent premium tech gear from trusted lenders in your city. Delivered fast. Insured always.
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
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} TechRent Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
