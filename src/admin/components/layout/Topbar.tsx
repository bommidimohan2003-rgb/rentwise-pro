import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { SearchBar } from "./SearchBar";
import { NotificationDropdown } from "./NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";

export function Topbar() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 h-16 border-b border-border/40 bg-card/65 glass backdrop-blur-md">
      {/* Left side: Space on desktop for spacing, padding on mobile */}
      <div className="flex items-center gap-4 pl-8 lg:pl-0">
        <SearchBar />
      </div>

      {/* Right side: Actions & Utilities */}
      <div className="flex items-center gap-3.5">
        {/* Theme Toggle Button */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification dropdown */}
        <NotificationDropdown />

        {/* Divider */}
        <div className="h-6 w-[1px] bg-border/60 shrink-0" />

        {/* Profile dropdown */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
