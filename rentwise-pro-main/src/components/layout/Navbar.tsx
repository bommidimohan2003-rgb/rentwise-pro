import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import { LogoIcon } from "@/components/common/LogoIcon";
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
  { to: "/become-lender", label: "Become Lender" },
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

  const handleGetStarted = () => {
    const users = storage.get<unknown[]>(STORAGE_KEYS.users, []);
    if (users.length > 0) {
      navigate({ to: "/login" });
    } else {
      navigate({ to: "/register" });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "glass shadow-sm" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.span
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="grid h-9 w-9 place-items-center rounded-xl btn-gradient"
          >
            <LogoIcon className="h-4 w-4 text-white" />
          </motion.span>
          <span className="text-lg font-bold tracking-tight">Payent</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-full hover:text-foreground hover:bg-secondary transition-colors"
              activeProps={{ className: "!text-foreground !bg-secondary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-payent-help-chat"))}
            className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-full hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Help
          </button>
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search"
            className="header-icon-btn"
            onClick={() => navigate({ to: "/categories" })}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Wishlist"
            className="header-icon-btn"
            onClick={() => {
              if (!user) {
                toast.error("Please log in to view your wishlist.");
                navigate({ to: "/login" });
              } else {
                navigate({ to: "/wishlist" });
              }
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="header-icon-btn"
            onClick={() => {
              if (!user) {
                toast.error("Please log in to view your notifications.");
                navigate({ to: "/login" });
              } else {
                navigate({ to: "/notifications" });
              }
            }}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="header-icon-btn"
            onClick={toggle}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full pl-2 pr-4 h-10 hover:bg-secondary"
              >
                <div className="h-8 w-8 rounded-full btn-gradient grid place-items-center text-white text-xs font-bold">
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-sm font-medium">{user.fullName.split(" ")[0]}</span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Logout" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Button size="sm" onClick={handleGetStarted} className="rounded-full px-5 shadow-[0_12px_30px_-14px_rgba(255,79,154,0.8)]">
                Sign Up
              </Button>
            </div>
          )}

          <button
            className="lg:hidden ml-1 grid h-10 w-10 place-items-center rounded-full hover:bg-secondary"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-border overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-secondary"
                  activeProps={{ className: "bg-secondary" }}
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
                className="px-4 py-3 text-left rounded-xl text-sm font-medium hover:bg-secondary cursor-pointer text-muted-foreground"
              >
                Help
              </button>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border mt-2">
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
                  <Button onClick={handleGetStarted} className="col-span-2">
                    Get Started
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
