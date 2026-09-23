import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Package,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Bell,
  ArrowRight,
  UserCheck,
  CheckCircle,
  XCircle,
  CreditCard,
  Flag,
  Shield,
  LifeBuoy,
  RefreshCw,
  Radio,
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
} from "recharts";
import { StatsCard } from "../components/layout/StatsCard";
import { ChartCard } from "../components/layout/ChartCard";
import { Loader } from "../components/layout/Loader";
import {
  notificationsService,
  DashboardStats,
  DashboardCharts,
  DashboardActivity,
} from "../services/notifications";
import { productsService } from "../services/products";
import { AdminProduct } from "../services/api";
import { authService } from "../services/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminWS, ConnectionStatus } from "../services/websocket";
import { AdminProductImage } from "../components/common/AdminProductImage";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [pendingProductsList, setPendingProductsList] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const currentUser = authService.getCurrentUser();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, chartsData, activitiesData, productsData] = await Promise.allSettled([
        notificationsService.getDashboardStats(),
        notificationsService.getDashboardCharts("30"),
        notificationsService.getDashboardActivities(),
        productsService.getProducts("pending"),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      } else {
        console.error("Stats fetch error:", statsData.reason);
      }

      if (chartsData.status === "fulfilled") {
        setCharts(chartsData.value);
      }

      if (activitiesData.status === "fulfilled") {
        setActivities(activitiesData.value);
      }

      if (productsData.status === "fulfilled") {
        setPendingProductsList(productsData.value.slice(0, 5));
      }

      // If stats failed completely, report error
      if (statsData.status === "rejected") {
        setError("Failed to fetch live dashboard operational metrics.");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to backend control plane.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // WebSocket listeners
    const unsubStatus = adminWS.onStatusChange(setWsStatus);

    const unsubProductCreated = adminWS.subscribe("product.created", () => {
      fetchDashboardData();
    });

    const unsubBookingCreated = adminWS.subscribe("booking.created", () => {
      fetchDashboardData();
    });

    const unsubPayment = adminWS.subscribe("payment.created", () => {
      fetchDashboardData();
    });

    return () => {
      unsubStatus();
      unsubProductCreated();
      unsubBookingCreated();
      unsubPayment();
    };
  }, [fetchDashboardData]);

  const handleApproveProduct = async (id: string, title: string) => {
    try {
      setApprovingId(id);
      await productsService.approveProduct(id);
      setPendingProductsList((prev) => prev.filter((p) => p.id !== id));
      if (stats) {
        setStats({
          ...stats,
          pendingProducts: Math.max(0, stats.pendingProducts - 1),
          approvedProducts: stats.approvedProducts + 1,
        });
      }
      toast.success(`Listing "${title}" approved and published.`);
    } catch {
      toast.error("Failed to approve product.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectProduct = async (id: string, title: string) => {
    try {
      setRejectingId(id);
      await productsService.rejectProduct(id);
      setPendingProductsList((prev) => prev.filter((p) => p.id !== id));
      if (stats) {
        setStats({
          ...stats,
          pendingProducts: Math.max(0, stats.pendingProducts - 1),
          rejectedProducts: stats.rejectedProducts + 1,
        });
      }
      toast.info(`Listing "${title}" rejected.`);
    } catch {
      toast.error("Failed to reject product.");
    } finally {
      setRejectingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader message="Connecting to PAYENT Control Plane..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER: Identity & System Operational Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
              PAYENT ADMIN CONTROL CENTER
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-primary text-primary-foreground rounded uppercase">
              v2.0
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Live operational status • Authenticated as{" "}
            <span className="font-semibold text-foreground">{currentUser?.fullName || currentUser?.email || "Administrator"}</span>{" "}
            ({currentUser?.role || "superadmin"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime Stream Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-medium">
            <Radio
              className={cn(
                "h-3.5 w-3.5",
                wsStatus === "LIVE" ? "text-emerald-500 animate-pulse" : "text-muted-foreground"
              )}
            />
            <span className="text-[11px]">
              {wsStatus === "LIVE" ? "Realtime Active" : "Polling Mode"}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ERROR BANNER IF ANY API FAILED */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* REAL KPI SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Platform Key Performance Indicators
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            Source: MySQL Primary Cluster
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats ? stats.totalUsers.toLocaleString() : "—"}
            subtext={`${stats?.totalAgents || 0} verified agents`}
            icon={Users}
            loading={loading && !stats}
            error={!stats && !!error}
            onRetry={fetchDashboardData}
          />

          <StatsCard
            title="Active Listings"
            value={stats ? stats.approvedProducts.toLocaleString() : "—"}
            subtext={`${stats?.pendingProducts || 0} pending review`}
            icon={Package}
            loading={loading && !stats}
            error={!stats && !!error}
            onRetry={fetchDashboardData}
          />

          <StatsCard
            title="Monthly Bookings"
            value={stats ? stats.monthlyBookings.toLocaleString() : "—"}
            subtext={`${stats?.bookingsToday || 0} booked today`}
            icon={Calendar}
            loading={loading && !stats}
            error={!stats && !!error}
            onRetry={fetchDashboardData}
          />

          <StatsCard
            title="Total Revenue"
            value={stats ? `₹${stats.monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
            subtext={`₹${(stats?.revenueToday || 0).toLocaleString("en-IN")} today`}
            icon={IndianRupee}
            loading={loading && !stats}
            error={!stats && !!error}
            onRetry={fetchDashboardData}
          />
        </div>
      </section>

      {/* OPERATIONS & ACTION MATRIX */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* PENDING APPROVALS QUEUE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-card rounded-2xl border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Pending Product Approvals</h3>
                {pendingProductsList.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full">
                    {pendingProductsList.length} Action Needed
                  </span>
                )}
              </div>
              <Link
                to="/admin/products"
                search={{ status: "pending" }}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {pendingProductsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                All submitted gear listings have been reviewed. Queue is clear.
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {pendingProductsList.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AdminProductImage
                        src={prod.image}
                        alt={prod.title}
                        className="w-11 h-11 rounded-lg"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {prod.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {prod.category} • ₹{prod.price}/day • Owner: {prod.owner?.name || "Lender"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleApproveProduct(prod.id, prod.title)}
                        disabled={approvingId === prod.id || rejectingId === prod.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleRejectProduct(prod.id, prod.title)}
                        disabled={approvingId === prod.id || rejectingId === prod.id}
                        className="px-2.5 py-1 rounded-lg bg-destructive hover:bg-destructive/90 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REVENUE & BOOKINGS CHART */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartCard
              title="Revenue Trajectory (30 Days)"
              description="Gross volume generated across verified leases"
            >
              {charts && charts.revenueChart && charts.revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.revenueChart}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#161616" stopOpacity={0.2} />
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
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#161616" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No revenue data recorded for current 30-day window.
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Booking Volume (30 Days)"
              description="Daily completed and active gear rental orders"
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
                      formatter={(value: number) => [value, "Bookings"]}
                    />
                    <Bar dataKey="bookings" fill="#161616" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No rental bookings recorded for current 30-day window.
                </div>
              )}
            </ChartCard>
          </div>
        </div>

        {/* RECENT OPERATIONAL ACTIVITY & DIRECT ACTIONS */}
        <div className="space-y-6">
          {/* DIRECT ACTION SHORTCUTS */}
          <div className="p-5 bg-card rounded-2xl border border-border/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Operations Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/admin/users"
                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 text-xs font-bold transition-all flex flex-col items-start gap-1"
              >
                <UserCheck className="h-4 w-4 text-foreground" />
                <span>Manage Users</span>
              </Link>

              <Link
                to="/admin/bookings"
                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 text-xs font-bold transition-all flex flex-col items-start gap-1"
              >
                <Calendar className="h-4 w-4 text-foreground" />
                <span>Rental Orders</span>
              </Link>

              <Link
                to="/admin/payments"
                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 text-xs font-bold transition-all flex flex-col items-start gap-1"
              >
                <CreditCard className="h-4 w-4 text-foreground" />
                <span>Reconcile Tx</span>
              </Link>

              <Link
                to="/admin/reports"
                className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 text-xs font-bold transition-all flex flex-col items-start gap-1"
              >
                <Flag className="h-4 w-4 text-foreground" />
                <span>Dispute Center</span>
              </Link>
            </div>
          </div>

          {/* AUDIT LOG TIMELINE */}
          <div className="p-5 bg-card rounded-2xl border border-border/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recent Audit Activity
                </h3>
              </div>
              <Link
                to="/admin/activity-logs"
                className="text-[11px] font-bold text-primary hover:underline"
              >
                View full audit
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No recent security actions logged.
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-border/20">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground truncate">{act.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {act.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
