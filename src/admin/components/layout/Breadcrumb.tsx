import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // If we are on the dashboard or login, don't show complex breadcrumbs
  if (
    pathnames.length <= 2 &&
    (pathnames[1] === "dashboard" || pathnames[1] === "login" || !pathnames[1])
  ) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-4">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Dashboard</span>
      </Link>

      {pathnames.map((value, index) => {
        if (value === "admin") return null;

        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        // Capitalize and format value
        const formattedValue = value
          .replace("-", " ")
          .replace(/^[a-z]/, (char) => char.toUpperCase());

        return (
          <div key={to} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {last ? (
              <span className="text-foreground font-bold tracking-wide">{formattedValue}</span>
            ) : (
              <Link to={to as "/admin"} className="hover:text-foreground transition-colors">
                {formattedValue}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
