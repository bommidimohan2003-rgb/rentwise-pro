import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  Moon,
  Sun,
  User,
  ShoppingBag,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/common/LogoIcon";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Explore" },
  { to: "/become-lender", label: "Lender" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { ids: wishlistIds } = useWishlist();
  const { cartCount, toggleCart } = useCart();
  const { unreadCount } = useUnreadMessages();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isHome && "-mb-16",
          scrolled
            ? "bg-white/95 dark:bg-[#070B11]/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/[0.08] shadow-sm shadow-black/5 dark:shadow-2xl dark:shadow-black/70"
            : isHome
              ? "bg-transparent border-b border-transparent shadow-none"
              : "bg-white/85 dark:bg-[#070B11]/85 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/[0.06]",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-3 shrink-0 focus:outline-none group"
              id="nav-logo"
            >
              <LogoIcon showTagline={false} />
            </Link>
          </div>

          {/* Center: Expansive Minimalist Navigation */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
            {navLinks.map((l) => {
              const isActive =
                l.to === "/"
                  ? pathname === "/"
                  : l.to === "/browse"
                    ? pathname.startsWith("/browse") || pathname.startsWith("/categories")
                    : pathname.startsWith(l.to);

              return (
                <Link
                  key={l.to}
                  to={l.to}
                  id={`nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "relative py-1 text-[13px] lg:text-sm font-medium tracking-tight transition-colors duration-150",
                    isActive
                      ? "text-neutral-950 dark:text-white font-semibold"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white",
                  )}
                >
                  <span>{l.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-minimal-active"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-neutral-950 dark:bg-white rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Expansive Actions & Auth Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle dark/light mode"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              id="nav-theme-toggle"
              className="h-9 w-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-300 transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-neutral-700 transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {/* Wishlist Button */}
            <Link
              to="/wishlist"
              aria-label="Saved Gear"
              title="Saved Gear"
              id="nav-wishlist-top"
              className="relative h-9 w-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Heart className="h-4 w-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#070B11]" />
              )}
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Rental Cart (${cartCount} items)`}
              title="Rental Cart"
              id="nav-cart-top"
              className="relative h-9 w-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 min-w-[16px] h-[16px] rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-[10px] font-bold flex items-center justify-center leading-none shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-4 w-[1px] bg-neutral-200 dark:bg-white/15 mx-1" />

            {/* Auth / Account Area */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Messages */}
                <Link
                  to="/messages"
                  aria-label="Messages"
                  title="Messages & Inquiries"
                  id="nav-messages-btn"
                  className="relative h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070B11]" />
                  )}
                </Link>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/notifications" })}
                  aria-label="Notifications"
                  id="nav-notifications-btn"
                  className="relative h-9 w-9 flex items-center justify-center rounded-full text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                </button>

                {/* Profile Pill */}
                <Link
                  to="/profile"
                  id="nav-profile-avatar"
                  className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-full border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#0D151D] hover:border-neutral-300 dark:hover:border-white/30 shadow-xs hover:shadow-sm transition-all"
                >
                  <img
                    src={
                      user.profilePhotoUrl ||
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "User")}&background=161616&color=ffffff`
                    }
                    alt={user.fullName || "User"}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20"
                  />
                  <span className="hidden lg:inline text-xs font-semibold text-neutral-900 dark:text-white max-w-[90px] truncate">
                    {user.fullName?.split(" ")[0] || "Profile"}
                  </span>
                </Link>
              </div>
            ) : (
              /* Guest Actions */
              <div className="flex items-center gap-2">
                {/* Mobile User Profile Button */}
                <Link
                  to="/login"
                  aria-label="User Profile"
                  title="Sign In / Profile"
                  id="nav-user-profile-guest"
                  className="md:hidden h-9 w-9 rounded-full border border-neutral-200 dark:border-white/15 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4" />
                </Link>

                {/* Desktop Log In + Sign Up */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    id="nav-login-btn"
                    className="px-3.5 py-2 text-[13px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    id="nav-signup-btn"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-full shadow-sm hover:shadow active:scale-95 transition-all"
                  >
                    <span>Sign up</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
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
