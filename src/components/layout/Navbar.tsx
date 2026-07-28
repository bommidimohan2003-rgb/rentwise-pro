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
import { Button } from "@/components/common/Button";
import { toast } from "sonner";

const links = [
  { to: "/", label: "Home" },
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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b border-white/10 dark:border-[#222222]",
        isHomePage
          ? "bg-[#0B2545]/95 dark:bg-[#000000]/95 backdrop-blur-md"
          : "bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md",
        scrolled ? "shadow-xl shadow-black/20" : ""
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group" id="nav-logo">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.05 }}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-lg font-black text-white shrink-0 shadow-lg shadow-[#FF5A5F]/30"
            style={{
              background: "linear-gradient(135deg, #FF5A5F 0%, #e0484d 100%)",
            }}
          >
            P
          </motion.div>
          <span className={cn(
            "text-xl font-extrabold tracking-tight font-display",
            isHomePage ? "text-white" : "text-slate-900 dark:text-white"
          )}>
            PAYENT
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              id={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200",
                isHomePage
                  ? "text-slate-200 hover:text-white hover:bg-white/10"
                  : "text-slate-600 dark:text-slate-200 hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-slate-100 dark:hover:bg-white/10"
              )}
              activeProps={{
                className: isHomePage
                  ? "!text-white !bg-[#FF5A5F]/20 font-bold"
                  : "!text-[#FF5A5F] !bg-[#FF5A5F]/10 font-bold",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-payent-help-chat"))}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer",
              isHomePage
                ? "text-slate-200 hover:text-white hover:bg-white/10"
                : "text-slate-600 dark:text-slate-200 hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-slate-100 dark:hover:bg-white/10"
            )}
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
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
                isHomePage
                  ? "text-slate-200 hover:text-white hover:bg-white/10"
                  : "text-slate-600 dark:text-slate-200 hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-slate-100 dark:hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            id="nav-theme-toggle"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
              isHomePage
                ? "text-slate-200 hover:text-white hover:bg-white/10"
                : "text-slate-600 dark:text-slate-200 hover:text-[#FF5A5F] dark:hover:text-[#FF5A5F] hover:bg-slate-100 dark:hover:bg-white/10"
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="hidden md:flex items-center gap-2 ml-2">
              {user.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#FF5A5F] text-white hover:bg-[#e0484d] transition-all shadow-md"
                >
                  Admin Portal
                </Link>
              )}
              <Link
                to="/dashboard"
                id="nav-dashboard"
                className="flex items-center gap-2 rounded-full pl-2 pr-4 h-10 transition-all border border-white/15 bg-white/10 hover:bg-white/20"
              >
                <div
                  className="h-7 w-7 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
                  style={{ background: "linear-gradient(135deg, #FF5A5F, #e0484d)" }}
                >
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-sm font-bold text-white">
                  {user.fullName.split(" ")[0]}
                </span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout} className="text-slate-200 hover:text-white">
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
                className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg shadow-[#FF5A5F]/30 bg-[#FF5A5F] hover:bg-[#e0484d]"
              >
                <span className="flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </span>
              </motion.button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={cn(
              "lg:hidden ml-1 h-9 w-9 flex items-center justify-center rounded-full transition-all cursor-pointer",
              isHomePage
                ? "text-slate-200 hover:text-white hover:bg-white/10"
                : "text-slate-600 dark:text-slate-200 hover:text-[#FF5A5F] hover:bg-slate-100 dark:hover:bg-white/10"
            )}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-white/10 bg-[#0B2545] dark:bg-[#000000] px-4 py-4 space-y-3"
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                activeProps={{ className: "!text-[#FF5A5F] !bg-[#FF5A5F]/15 font-bold" }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-payent-help-chat"));
              }}
              className="block w-full text-left px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Help
            </button>

            {!user ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleGetStarted();
                  }}
                  className="w-full bg-[#FF5A5F] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login / Register</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-2 border-t border-white/10">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-bold text-white bg-white/10 rounded-xl"
                >
                  Dashboard ({user.fullName})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
