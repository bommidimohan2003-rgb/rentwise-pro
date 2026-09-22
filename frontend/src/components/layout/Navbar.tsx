import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/common/LogoIcon";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
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
          "sticky top-0 z-40 w-full transition-all duration-300",
          isHome && "-mb-16",
          scrolled
            ? "bg-white/90 dark:bg-[#05090D]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/[0.08] shadow-xs"
            : isHome
              ? "bg-transparent border-b border-transparent shadow-none"
              : "bg-white/80 dark:bg-[#05090D]/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/[0.06]"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 focus:outline-none group select-none"
            id="nav-logo"
            aria-label="Payent Home"
          >
            <LogoIcon showTagline={false} />
          </Link>

          {/* Right: Auth Controls (Login & Sign Up) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                to="/profile"
                id="nav-profile-avatar"
                className="flex items-center gap-2 p-1 pl-1.5 pr-3.5 rounded-full border border-neutral-200 dark:border-white/15 bg-white/80 dark:bg-[#0D151D]/80 hover:border-neutral-300 dark:hover:border-white/30 shadow-xs hover:shadow-sm transition-all"
              >
                <img
                  src={
                    user.profilePhotoUrl ||
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || "User")}&background=161616&color=ffffff`
                  }
                  alt={user.fullName || "User"}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20"
                />
                <span className="text-xs font-bold text-neutral-900 dark:text-white max-w-[100px] truncate">
                  {user.fullName?.split(" ")[0] || "Profile"}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  id="nav-login-btn"
                  className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  id="nav-signup-btn"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 rounded-full shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
                >
                  <span>Sign up</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Dock Navigation */}
      <MobileBottomNav />
    </>
  );
}

export default Navbar;
