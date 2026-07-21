import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LayoutDashboard,
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
import { Button } from "@/components/common/Button";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/become-lender", label: "Become a Lender" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isHomePage = pathname === "/";

  const handleGetStarted = () => {
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

  const navBg = isHomePage
    ? scrolled
      ? "rgba(10,1,24,0.85)"
      : "transparent"
    : scrolled
      ? undefined
      : undefined;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "shadow-lg shadow-black/20" : "",
        !isHomePage && scrolled ? "glass" : "",
      )}
      style={{
        background: navBg,
        backdropFilter: isHomePage && scrolled ? "blur(20px) saturate(180%)" : undefined,
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg font-black text-white"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            }}
          >
            P
          </motion.div>
          <span
            className="text-xl font-extrabold tracking-tight"
            style={{
              background: isHomePage
                ? "linear-gradient(135deg, #ffffff, #c4b5fd)"
                : "inherit",
              WebkitBackgroundClip: isHomePage ? "text" : "unset",
              WebkitTextFillColor: isHomePage ? "transparent" : "unset",
            }}
          >
            PAYENT
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              id={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200",
                isHomePage
                  ? "text-slate-300 hover:text-white hover:bg-white/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
              activeProps={{
                className: isHomePage
                  ? "!text-white !bg-white/10"
                  : "!text-foreground !bg-secondary",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-payent-help-chat"))}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer",
              isHomePage
                ? "text-slate-300 hover:text-white hover:bg-white/8"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            Help
          </button>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Icon buttons */}
          {[
            {
              icon: Bell,
              label: "Notifications",
              action: () => {
                if (!user) {
                  toast.error("Please log in to view your notifications.");
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
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200",
                isHomePage
                  ? "text-slate-400 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            id="nav-theme-toggle"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200",
              isHomePage
                ? "text-slate-400 hover:text-white hover:bg-white/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Auth button */}
          {user ? (
            <div className="hidden md:flex items-center gap-2 ml-2">
              {(user.role === "superadmin" || user.role === "admin") && (
                <Link
                  to="/admin/dashboard"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                >
                  Admin Portal
                </Link>
              )}
              <Link
                to="/dashboard"
                id="nav-dashboard"
                className="flex items-center gap-2 rounded-full pl-2 pr-4 h-10 transition-all"
                style={{
                  background: isHomePage ? "rgba(255,255,255,0.08)" : undefined,
                  border: isHomePage ? "1px solid rgba(255,255,255,0.12)" : undefined,
                }}
              >
                <div
                  className="h-7 w-7 rounded-full grid place-items-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  {user.fullName.charAt(0)}
                </div>
                <span className={cn("text-sm font-medium", isHomePage ? "text-slate-200" : "text-foreground")}>
                  {user.fullName.split(" ")[0]}
                </span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <motion.button
                onClick={handleGetStarted}
                id="nav-get-started"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.35)",
                }}
              >
                <span className="flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </span>
              </motion.button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className={cn(
              "lg:hidden ml-1 h-9 w-9 flex items-center justify-center rounded-full transition-all",
              isHomePage
                ? "text-slate-300 hover:text-white hover:bg-white/10"
                : "text-muted-foreground hover:bg-secondary",
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            id="nav-mobile-menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
            style={{
              background: isHomePage ? "rgba(10,1,24,0.95)" : undefined,
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <nav className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isHomePage
                      ? "text-slate-300 hover:text-white hover:bg-white/8"
                      : "hover:bg-secondary text-muted-foreground",
                  )}
                  activeProps={{ className: isHomePage ? "!text-white !bg-white/10" : "bg-secondary" }}
                  activeOptions={{ exact: l.to === "/" }}
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("open-payent-help-chat"));
                }}
                className={cn(
                  "px-4 py-3 text-left rounded-xl text-sm font-medium cursor-pointer transition-all",
                  isHomePage
                    ? "text-slate-400 hover:text-white hover:bg-white/8"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                Help
              </button>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mt-2">
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate({ to: "/dashboard" })}
                      leftIcon={<LayoutDashboard className="h-4 w-4" />}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={logout}
                      leftIcon={<LogOut className="h-4 w-4" />}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <button
                    onClick={handleGetStarted}
                    className="col-span-2 rounded-xl py-3 text-sm font-semibold text-white text-center"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Get Started Free
                    </span>
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
