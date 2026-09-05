import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { LogoIcon } from "@/components/common/LogoIcon";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const links = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Browse" },
  { to: "/become-lender", label: "Become Lender" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleGetStarted = () => {
    if (user) {
      navigate({ to: "/dashboard" });
      return;
    }
    const users = storage.get<unknown[]>(STORAGE_KEYS.users, []);
    if (users.length > 0) {
      navigate({ to: "/login" });
    } else {
      navigate({ to: "/register" });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b border-border bg-background/95 backdrop-blur-md",
          scrolled ? "shadow-xl shadow-black/10 dark:shadow-black/40" : "",
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" id="nav-logo">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center shrink-0"
            >
              <LogoIcon className="h-10 w-auto rounded-lg shadow-sm" />
            </motion.div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                id={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                className="px-4 py-2 text-sm font-extrabold rounded-full transition-all duration-200 text-black dark:text-white hover:text-[#FF5A5F] hover:bg-black/5 dark:hover:bg-white/10"
                activeProps={{
                  className: "!text-[#FF5A5F] !bg-[#FF5A5F]/15 font-black",
                }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-payent-help-chat"))
              }
              className="px-4 py-2 text-sm font-extrabold rounded-full transition-all duration-200 cursor-pointer text-black dark:text-white hover:text-[#FF5A5F] hover:bg-black/5 dark:hover:bg-white/10"
            >
              Help
            </button>
          </nav>

          {/* Right Side Icons & Actions */}
          <div className="flex items-center gap-1.5">
            {[
              {
                icon: Bell,
                label: "Notifications",
                action: () => {
                  if (!user) {
                    toast.error("Please log in to view notifications.");
                    navigate({ to: "/login" });
                  } else {
                    navigate({ to: "/notifications" });
                  }
                },
              },
              {
                icon: Heart,
                label: "Wishlist",
                action: () => {
                  if (!user) {
                    toast.error("Please log in to view your wishlist.");
                    navigate({ to: "/login" });
                  } else {
                    navigate({ to: "/wishlist" });
                  }
                },
              },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                aria-label={label}
                id={`nav-${label.toLowerCase()}`}
                className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer text-black dark:text-white hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-black/5 dark:hover:bg-white/10 font-extrabold"
              >
                <Icon className="h-4 w-4 stroke-[2.5]" />
              </button>
            ))}

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              id="nav-theme-toggle"
              className="h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer text-black dark:text-white hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-black/5 dark:hover:bg-white/10 font-extrabold"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 stroke-[2.5]" />
              ) : (
                <Moon className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>

            {/* Auth Button / Profile */}
            {user ? (
              <div className="flex items-center gap-2 ml-1">
                {user.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex px-3 py-1.5 text-xs font-black rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border transition-all"
                >
                  <img
                    src={
                      user.avatar ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    }
                    alt={user.fullName || user.email || "User Profile"}
                    className="h-6 w-6 rounded-full object-cover border border-border"
                  />
                  <span className="hidden sm:inline text-xs font-black text-black dark:text-white max-w-[100px] truncate">
                    {(user.fullName || user.email || "User").split(" ")[0]}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Log Out"
                  className="p-2 text-black dark:text-white hover:text-destructive hover:bg-destructive/10 rounded-full transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="ml-2 btn-gradient px-4 py-2 rounded-full text-xs font-black text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>

                {/* Mobile Menu Toggle (Only when NOT logged in) */}
                <button
                  type="button"
                  className="lg:hidden ml-1 h-9 w-9 flex items-center justify-center rounded-full transition-all cursor-pointer text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setOpen(!open)}
                  aria-label="Toggle menu"
                >
                  {open ? (
                    <X className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <Menu className="h-5 w-5 stroke-[2.5]" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu (Only when NOT logged in) */}
        {!user && (
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden overflow-hidden border-t border-border bg-background px-4 py-4 space-y-3"
              >
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="block px-4 py-2.5 text-sm font-semibold rounded-xl text-foreground hover:bg-secondary transition-colors"
                    activeProps={{
                      className: "!text-[#FF5A5F] !bg-[#FF5A5F]/15 font-bold",
                    }}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    window.dispatchEvent(
                      new CustomEvent("open-payent-help-chat"),
                    );
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm font-semibold rounded-xl text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Help
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleGetStarted();
                    }}
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login / Register</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </header>
      <MobileBottomNav />
    </>
  );
}
