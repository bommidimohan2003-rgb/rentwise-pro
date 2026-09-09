import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LogOut,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/common/LogoIcon";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const links = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Browse" },
  { to: "/become-lender", label: "Become a Lender" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { ids: wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300 border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#05090D]/90 backdrop-blur-md",
          scrolled ? "shadow-md shadow-black/5 dark:shadow-2xl dark:shadow-black/80 bg-white dark:bg-[#05090D]/95" : "",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0" id="nav-logo">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center shrink-0">
              <LogoIcon />
            </motion.div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {links.map((l) => {
              const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  id={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "relative py-1 text-xs lg:text-sm font-medium transition-colors tracking-wide",
                    isActive
                      ? "text-neutral-950 dark:text-white font-semibold"
                      : "text-neutral-600 dark:text-[#AAB3BC] hover:text-black dark:hover:text-white",
                  )}
                >
                  {l.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Icons & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              id="nav-theme-toggle"
              className="h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400 stroke-[2]" />
              ) : (
                <Moon className="h-4 w-4 stroke-[2]" />
              )}
            </button>

            {/* Wishlist / Saved Button in Top Right */}
            <Link
              to="/wishlist"
              aria-label="Wishlist (Saved)"
              title="Saved Gear"
              id="nav-wishlist-top"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-[#A8B1BA] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Heart className="h-4 w-4 sm:h-[18px] sm:w-[18px] stroke-[2]" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[15px] h-[15px] rounded-full bg-[#161616] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] text-[9px] font-bold flex items-center justify-center leading-none shadow-sm">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            {/* If Logged In: Notifications, Profile, Logout */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/notifications" })}
                  aria-label="Notifications"
                  id="nav-notifications-btn"
                  className="relative h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px] stroke-[2]" />
                </button>

                {/* Profile Avatar Trigger */}
                <Link
                  to="/profile"
                  id="nav-profile-avatar"
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <img
                    src={
                      user.profilePhotoUrl ||
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "User")}&background=161616&color=ffffff`
                    }
                    alt={user.fullName || "User"}
                    className="h-7 w-7 rounded-full object-cover border border-black/10 dark:border-white/20"
                  />
                  <span className="hidden lg:inline text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate">
                    {user.fullName?.split(" ")[0] || "Profile"}
                  </span>
                </Link>
              </div>
            ) : (
              /* Guest Actions */
              <div className="flex items-center gap-2">
                {/* Mobile User Profile Button in Top Right */}
                <Link
                  to="/login"
                  aria-label="User Profile"
                  title="Sign In / Profile"
                  id="nav-user-profile-guest"
                  className="md:hidden h-8 w-8 rounded-full border border-black/15 dark:border-white/20 flex items-center justify-center text-neutral-700 dark:text-[#A8B1BA] hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 stroke-[2]" />
                </Link>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    id="nav-login-btn"
                    className="items-center justify-center px-5 py-2 text-xs font-medium text-neutral-900 dark:text-white rounded-full border border-black/20 dark:border-white/20 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/40 dark:hover:border-white/40 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    id="nav-signup-btn"
                    className="items-center justify-center px-5 py-2 text-xs font-bold rounded-full bg-[#161616] hover:bg-[#262626] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <MobileBottomNav />
    </>
  );
}
