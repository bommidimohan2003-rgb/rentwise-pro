import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Calendar,
  Users,
  Package,
  Download,
  Filter,
  RefreshCw,
  PieChart as PieChartIcon,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ChartCard } from "../components/layout/ChartCard";
import { StatsCard } from "../components/layout/StatsCard";
import { Loader } from "../components/layout/Loader";
import {
  notificationsService,
  DashboardStats,
  DashboardCharts,
} from "../services/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#161616", "#525252", "#a3a3a3", "#d4d4d4", "#737373"];

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<"1" | "7" | "30" | "90">("30");
  const [activeGroup, setActiveGroup] = useState<"marketplace" | "users" | "bookings" | "payments" | "revenue">("revenue");

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, chartsData] = await Promise.all([
        notificationsService.getDashboardStats(),
        notificationsService.getDashboardCharts(timePeriod),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load real-time analytics aggregation datasets.");
      toast.error("Failed to load analytics datasets.");
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = () => {
    if (!stats || !charts) return;

    const csvRows = [
      ["Metric", "Value", "Period"],
      ["Total Users", stats.totalUsers, `${timePeriod} Days`],
      ["Verified Agents", stats.totalAgents, `${timePeriod} Days`],
      ["Active Equipment Listings", stats.approvedProducts, `${timePeriod} Days`],
      ["Pending Review Listings", stats.pendingProducts, `${timePeriod} Days`],
      ["Total Bookings", stats.monthlyBookings, `${timePeriod} Days`],
      ["Gross Revenue (INR)", stats.monthlyRevenue, `${timePeriod} Days`],
      ["Average Order Value (INR)", stats.monthlyBookings > 0 ? (stats.monthlyRevenue / stats.monthlyBookings).toFixed(2) : 0, `${timePeriod} Days`],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payent_analytics_report_${timePeriod}d_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics CSV exported successfully.");
  };

  const avgBookingValue = useMemo(() => {
    if (!stats || !stats.monthlyBookings || stats.monthlyBookings === 0) return 0;
    return Math.round(stats.monthlyRevenue / stats.monthlyBookings);
  }, [stats]);

  return (
    <div className="space-y-8">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            Operational Analytics Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time MySQL backend aggregation across marketplace, users, bookings, payments & revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center p-1 bg-secondary rounded-xl border border-border/60 text-xs font-semibold">
            {(["1", "7", "30", "90"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={cn(
                  "px-3 py-1 rounded-lg transition-all cursor-pointer",
                  timePeriod === period
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {period === "1" ? "Today" : `${period} Days`}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-secondary border border-border/80 text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Export Report</span>
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-between text-xs font-semibold">
          <span>{error}</span>
          <button onClick={fetchAnalytics} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* ANALYTICS GROUPS TABS */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: "revenue", label: "Revenue Intelligence", icon: IndianRupee },
          { id: "marketplace", label: "Marketplace & Listings", icon: Package },
          { id: "bookings", label: "Bookings & Operations", icon: Calendar },
          { id: "users", label: "User Base & Agents", icon: Users },
          { id: "payments", label: "Payment Reconciliations", icon: CreditCard },
        ].map((group) => {
          const Icon = group.icon;
          const active = activeGroup === group.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id as typeof activeGroup)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{group.label}</span>
            </button>
          );
        })}
      </div>

      {/* TOP METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue Volume"
          value={stats ? `₹${stats.monthlyRevenue.toLocaleString("en-IN")}` : "—"}
          subtext={`For ${timePeriod === "1" ? "Today" : `${timePeriod} Day Window`}`}
          icon={IndianRupee}
          loading={loading && !stats}
        />
        <StatsCard
          title="Avg Transaction Value"
          value={avgBookingValue > 0 ? `₹${avgBookingValue.toLocaleString("en-IN")}` : "—"}
          subtext="Per completed rental lease"
          icon={TrendingUp}
          loading={loading && !stats}
        />
        <StatsCard
          title="Total Rental Leases"
          value={stats ? stats.monthlyBookings.toLocaleString() : "—"}
          subtext={`${stats?.bookingsToday || 0} initiated today`}
          icon={Calendar}
          loading={loading && !stats}
        />
        <StatsCard
          title="Live Equipment Fleet"
          value={stats ? stats.approvedProducts.toLocaleString() : "—"}
          subtext={`${stats?.totalCategories || 0} categories indexed`}
          icon={Package}
          loading={loading && !stats}
        />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REVENUE TIME-SERIES */}
        <ChartCard
          title="Revenue Volume Trajectory"
          description={`Aggregated daily rental transaction values over ${timePeriod} days`}
        >
          {charts && charts.revenueChart && charts.revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueChart}>
                <defs>
                  <linearGradient id="analyticsRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#161616" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#161616" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, "Gross Volume"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#161616" strokeWidth={2} fillOpacity={1} fill="url(#analyticsRev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No revenue transactions recorded for this period.
            </div>
          )}
        </ChartCard>

        {/* BOOKINGS VOLUME */}
        <ChartCard
          title="Rental Bookings Frequency"
          description={`Daily equipment lease orders over ${timePeriod} days`}
        >
          {charts && charts.bookingChart && charts.bookingChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.bookingChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: number) => [val, "Orders"]}
                />
                <Bar dataKey="bookings" fill="#161616" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No bookings logged for this period.
            </div>
          )}
        </ChartCard>

        {/* CATEGORY DISTRIBUTION */}
        <ChartCard
          title="Catalog Category Distribution"
          description="Breakdown of live gear items indexed by category"
        >
          {charts && charts.categoryDistribution && charts.categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {charts.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No category distribution data available.
            </div>
          )}
        </ChartCard>

        {/* TOP PERFORMING PRODUCTS */}
        <ChartCard
          title="Top Performing Fleet Items"
          description="Most rented gear items ranked by booking count & gross value"
        >
          {charts && charts.topProducts && charts.topProducts.length > 0 ? (
            <div className="space-y-3 pt-2">
              {charts.topProducts.map((prod, idx) => (
                <div
                  key={prod.name || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/40 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-muted-foreground">#{idx + 1}</span>
                    <span className="font-bold text-foreground truncate">{prod.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                    <span className="text-muted-foreground">{prod.rentals} rentals</span>
                    <span className="font-bold text-foreground">₹{prod.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No completed product leases recorded yet.
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
