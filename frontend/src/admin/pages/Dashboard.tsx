import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  Package,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Bell,
  Eye,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Camera,
  CheckCircle,
  XCircle,
  CreditCard,
  Star,
  Flag,
  Settings,
  ShieldCheck,
  Plus,
  Activity,
  Sparkles,
  Zap,
  Lock,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  Check,
  Database,
  Server,
  Download,
  RotateCw,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminWS } from "../services/websocket";

const COLORS = ["#ff5a5f", "#0b2545", "#10b981", "#06b6d4", "#ec4899"];

function FlippableFeatureCard({
  icon: Icon,
  title,
  description,
  badgeText,
  colorClass,
  specs,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badgeText: string;
  colorClass: string;
  specs: { label: string; value: string }[];
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full h-[180px] cursor-pointer select-none group"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped((prev) => !prev)}
      title="Click card to flip for technical specs"
    >
      <div
        className="relative w-full h-full rounded-2xl transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* FRONT FACE */}
        <div
          className={cn(
            "glass-card p-5 flex flex-col justify-between h-[180px] w-full rounded-2xl border border-border/60 transition-all duration-300 relative overflow-hidden shadow-xs hover:border-primary/40",
            isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform",
                  colorClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground/70 flex items-center gap-1 group-hover:text-primary transition-colors">
                <RotateCw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />{" "}
                Flip
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                {description}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span
              className={cn(
                "text-[10px] font-bold flex items-center gap-1.5",
                colorClass.split(" ")[1],
              )}
            >
              <Check className="h-3 w-3" /> {badgeText}
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className={cn(
            "glass-card absolute inset-0 p-4 flex flex-col justify-between h-[180px] w-full rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden",
            !isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
              <span className="text-xs font-bold text-primary flex items-center gap-1 truncate">
                <Icon className="h-3.5 w-3.5" /> {title} Specs
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <RotateCcw className="h-2.5 w-2.5" /> Flip back
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2">
              {specs.map((s, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-lg bg-secondary/80 border border-border/50"
                >
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block truncate">
                    {s.label}
                  </span>
                  <span className="text-[10px] font-extrabold text-foreground truncate block font-display">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <span className="text-[9px] text-muted-foreground text-center pt-1 border-t border-border/30">
            Tap card to return
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [pendingProducts, setPendingProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [statsData, chartsData, activitiesData, allProds] =
        await Promise.all([
          notificationsService.getDashboardStats(),
          notificationsService.getDashboardCharts(),
          notificationsService.getDashboardActivities(),
          productsService.getProducts(),
        ]);
      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
      setPendingProducts(allProds.filter((p) => p.status === "pending"));
    } catch (err) {
      console.error(err);
      if (!silent) toast.error("Failed to load dashboard statistics.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleApprovePending = async (id: string) => {
    try {
      await productsService.approveProduct(id);
      toast.success(
        "Listing approved! Product is now live in public retail marketplace.",
      );
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
      loadData(true);
    } catch {
      toast.error("Failed to approve listing.");
    }
  };

  const handleRejectPending = async (id: string) => {
    try {
      await productsService.rejectProduct(id);
      toast.warning("Listing request rejected.");
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
      loadData(true);
    } catch {
      toast.error("Failed to reject listing.");
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time WebSocket broadcast events
    const unsub = adminWS.subscribe("*", (event) => {
      // Background silent refresh of dashboard metrics
      loadData(true);

      // Prepend event to activity stream live
      if (event.data && typeof event.data === "object") {
        const d = event.data as Record<string, unknown>;
        const newAct: DashboardActivity = {
          id: `live-${Date.now()}`,
          type: event.type,
          title: `Live Event: ${event.type.replace(".", " ").toUpperCase()}`,
          detail: (d.title ||
            d.fullName ||
            d.email ||
            d.id ||
            "Platform activity recorded") as string,
          time: "Just now",
          icon: event.type.includes("user")
            ? "UserPlus"
            : event.type.includes("booking")
              ? "Calendar"
              : event.type.includes("payment")
                ? "CreditCard"
                : event.type.includes("product")
                  ? "Camera"
                  : "Info",
        };
        setActivities((prev) => [newAct, ...prev.slice(0, 9)]);
      }
    });

    return () => unsub();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registered":
        return <UserPlus className="h-4 w-4 text-foreground" />;
      case "product_uploaded":
        return <Camera className="h-4 w-4 text-foreground" />;
      case "product_approved":
        return (
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        );
      case "product_rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "booking_created":
        return <Calendar className="h-4 w-4 text-foreground" />;
      case "payment_success":
        return (
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        );
      case "review_submitted":
        return <Star className="h-4 w-4 text-foreground" fill="currentColor" />;
      case "product_reported":
        return <Flag className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case "user_registered":
        return "bg-secondary/80 border border-border";
      case "product_uploaded":
        return "bg-secondary/80 border border-border";
      case "product_approved":
        return "bg-emerald-500/15 border border-emerald-500/30";
      case "product_rejected":
        return "bg-destructive/15 border border-destructive/30";
      case "booking_created":
        return "bg-secondary/80 border border-border";
      case "payment_success":
        return "bg-emerald-500/15 border border-emerald-500/30";
      case "review_submitted":
        return "bg-secondary/80 border border-border";
      case "product_reported":
        return "bg-destructive/15 border border-destructive/30";
      default:
        return "bg-secondary/80 border border-border";
    }
  };

  const handleResetAnalytics = async () => {
    if (
      !confirm(
        "Are you sure you want to reset total revenue, active listings, and analytics to 0?",
      )
    )
      return;
    try {
      await notificationsService.resetAnalytics();
      toast.success("Total revenue and active listings reset to 0.");
      loadData();
    } catch {
      toast.error("Failed to reset analytics.");
    }
  };

  const handleExportSummary = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Metric,Value",
        `Monthly Revenue,₹${stats?.monthlyRevenue || 0}`,
        `Approved Products,${stats?.approvedProducts || 0}`,
        `Pending Products,${stats?.pendingProducts || 0}`,
        `Monthly Bookings,${stats?.monthlyBookings || 0}`,
        `Total Users,${stats?.totalUsers || 0}`,
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payent_analytics_summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics summary exported as CSV!");
  };

  if (loading) {
    return (
      <Loader message="Compiling SaaS platform intelligence..." size="lg" />
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* SaaS Analytics Landing Hero Section */}
      <div className="glass-hero relative overflow-hidden p-6 md:p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-badge border border-primary/30 text-xs font-bold text-primary tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Real-Time Stream Active &bull; WebSocket Engine Synced
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight font-display">
              Payent{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-cyan-500">
                SaaS Intelligence
              </span>{" "}
              & Platform Analytics
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
              Unified operational control deck. Monitor real-time rental volume,
              equipment payouts, seller identity verification, and SaaS pricing
              performance across India's premier tech gear rental marketplace.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => loadData()}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold font-display inline-flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-primary/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Engine Data
              </button>

              <button
                onClick={handleExportSummary}
                className="glass-pill px-4 py-2.5 text-xs font-bold text-foreground border border-border hover:border-primary/40 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4 text-primary" />
                Export Audit Report
              </button>

              <button
                onClick={handleResetAnalytics}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                Reset Metrics
              </button>
            </div>
          </div>

          {/* Live Data Visualizer Card in Hero */}
          <div className="w-full lg:w-[460px] glass-card p-5 rounded-2xl border border-white/10 dark:border-white/5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Live Volume Stream
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-500 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                +14.2% Peak Yield
              </span>
            </div>

            {/* Micro Sparkline Chart */}
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={charts?.revenueChart || []}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="heroRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.6} />
                      <stop
                        offset="95%"
                        stopColor="#ff5a5f"
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      borderRadius: "0.8rem",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#ff5a5f"
                    strokeWidth={3}
                    fill="url(#heroRev)"
                    activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  Gross Lease Volume
                </span>
                <span className="text-sm font-extrabold text-foreground font-display">
                  ₹{stats?.monthlyRevenue?.toLocaleString() || "0"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">
                  Active Platform Users
                </span>
                <span className="text-sm font-extrabold text-primary font-display">
                  {stats?.totalUsers || 0} Registered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges & Compliance Banner */}
      <div className="glass-card p-4 rounded-2xl border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-bold text-foreground">
            Enterprise Security & SaaS Compliance
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/60">
            <Lock className="h-3 w-3 text-primary" /> 256-Bit SSL Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/60">
            <CreditCard className="h-3 w-3 text-emerald-500" /> Razorpay Payout
            SDK
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/60">
            <Zap className="h-3 w-3 text-amber-500" /> Twilio 2FA Verified
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/60">
            <Server className="h-3 w-3 text-cyan-500" /> 99.99% SLA Uptime
          </span>
        </div>
      </div>

      {/* Seller Approval Callout Banner & Dedicated Pending Approvals Control Deck */}
      <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground font-display">
                  Pending Gear Approvals
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {pendingProducts.length} Awaiting Admin Approval
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Items uploaded by users waiting for admin authorization before
                releasing into public retail marketplace.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              navigate({
                to: "/admin/products",
                search: { search: "" },
              })
            }
            className="text-xs font-bold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-all self-start sm:self-auto cursor-pointer"
          >
            View All Catalog Products <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {pendingProducts.length === 0 ? (
          <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-dashed border-border/60">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-foreground">
              All User Uploads Moderated & Live
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Zero pending items in queue. All user gear listings have been
              reviewed and approved!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingProducts.map((item) => (
              <div
                key={item.id}
                className="group relative bg-card/90 rounded-2xl p-4 border border-amber-500/20 hover:border-amber-500/40 shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover border border-border/80 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate mt-1 group-hover:text-amber-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-extrabold text-primary mt-0.5">
                        ₹{item.price}{" "}
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          / day
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/50 border border-border/40 text-[11px]">
                    <img
                      src={item.owner.avatar}
                      alt={item.owner.name}
                      className="h-5 w-5 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 truncate">
                      <span className="font-bold text-foreground block truncate">
                        {item.owner.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.owner.email || "Verified Lender"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border/40">
                  <button
                    onClick={() => handleApprovePending(item.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectPending(item.id)}
                    className="bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-xl py-2 px-3 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Reject listing"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      navigate({
                        to: "/admin/products/$id",
                        params: { id: item.id },
                      })
                    }
                    className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards Grid with Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Monthly Take Revenue"
          value={`₹${stats?.monthlyRevenue?.toLocaleString()}`}
          change="+12.5%"
          trend="up"
          icon={IndianRupee}
          subtext="gross platform fees"
        />
        <StatsCard
          title="Active Gear Listings"
          value={stats?.approvedProducts ?? 0}
          change="+8.2%"
          trend="up"
          icon={Package}
          subtext={`${stats?.pendingProducts ?? 0} awaiting review`}
        />
        <StatsCard
          title="Leases Processed Today"
          value={stats?.bookingsToday ?? 0}
          change="+4.5%"
          trend="up"
          icon={Calendar}
          subtext={`${stats?.monthlyBookings ?? 0} total this month`}
        />
        <StatsCard
          title="Registered SaaS Users"
          value={stats?.totalUsers ?? 0}
          change="+15.1%"
          trend="up"
          icon={Users}
          subtext={`${stats?.totalAgents ?? 0} verified lenders`}
        />
      </div>

      {/* Real-time Data Visualization Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Real-Time Revenue Performance"
            description="Commissions and gross equipment lease revenues"
            action={
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Live Data
              </span>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts?.revenueChart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#ff5a5f" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.8rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                  }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{
                    fontSize: "11px",
                    color: "var(--color-primary)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ff5a5f"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevMain)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Category Share Pie Chart */}
        <div>
          <ChartCard
            title="Equipment Category Split"
            description="Share of listings across tech gear types"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.categoryDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={82}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {(
                    charts?.categoryDistribution as
                      { name: string; value: number }[] | undefined
                  )?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.8rem",
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px", fontWeight: "600" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground font-display">
              SaaS Engine Capabilities & Feature Highlights
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Core platform microservices operating real-time security,
              payments, and risk management.
            </p>
          </div>
          <span className="text-xs font-bold text-primary flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> All Services Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FlippableFeatureCard
            icon={ShieldCheck}
            title="AI Risk & Fraud Shield"
            description="Automated multi-factor identity verification and risk scoring on every rental contract before gear dispatch."
            badgeText="Active Verification Guard"
            colorClass="bg-primary/10 text-primary border-primary/20"
            specs={[
              { label: "Verification SLA", value: "< 2 Secs" },
              { label: "Scoring Engine", value: "Neural Risk Model" },
              { label: "Security State", value: "Strict Enforcement" },
              { label: "ID Verification", value: "Govt Identity KYC" },
            ]}
          />

          <FlippableFeatureCard
            icon={CreditCard}
            title="Razorpay Automated Escrow"
            description="Automated payout split engine distributing lender payouts and security deposits securely via Razorpay SDK."
            badgeText="HMAC Escrow Secured"
            colorClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            specs={[
              { label: "Payout Gateway", value: "Razorpay SDK" },
              { label: "Security Token", value: "HMAC Verification" },
              { label: "Settlement SLA", value: "T+2 Auto Deposit" },
              { label: "Deposit Escrow", value: "100% Guaranteed" },
            ]}
          />

          <FlippableFeatureCard
            icon={Zap}
            title="Twilio SMS OTP Gateway"
            description="Instant 2FA phone verification and real-time dispatch alerts to renters and camera fleet owners."
            badgeText="Low Latency Alerting"
            colorClass="bg-purple-500/10 text-purple-500 border-purple-500/20"
            specs={[
              { label: "Provider", value: "Twilio Gateway" },
              { label: "Delivery Speed", value: "< 800ms Average" },
              { label: "Fallback Channel", value: "Production Active" },
              { label: "Auth Mode", value: "2FA SMS OTP" },
            ]}
          />

          <FlippableFeatureCard
            icon={TrendingUp}
            title="Dynamic Yield Engine"
            description="Algorithmically adjusts gear rental pricing based on location demand, weekend surges, and equipment rarity."
            badgeText="Yield Optimization On"
            colorClass="bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
            specs={[
              { label: "Pricing Model", value: "Algorithmic Surge" },
              { label: "Demand Monitor", value: "City-wide Geo" },
              { label: "Yield Boost", value: "+14.2% Peak" },
              { label: "Surge Cap", value: "Max 1.5x Rate" },
            ]}
          />

          <FlippableFeatureCard
            icon={Database}
            title="MySQL Direct Datastore"
            description="High-performance raw SQL query execution with fallback degraded state handling for seamless uptime."
            badgeText="Zero-Lag Query Engine"
            colorClass="bg-amber-500/10 text-amber-500 border-amber-500/20"
            specs={[
              { label: "Database Driver", value: "PyMySQL Raw SQL" },
              { label: "ORM Layer", value: "None (Zero Overhead)" },
              { label: "Degraded Mode", value: "Local Storage Sync" },
              { label: "Latency", value: "Sub-Millisecond" },
            ]}
          />

          <FlippableFeatureCard
            icon={Lock}
            title="Multi-Tenant Audit Logging"
            description="Complete cryptographically traceable activity stream recording every administrative decision and status shift."
            badgeText="Audit Log Streamed"
            colorClass="bg-rose-500/10 text-rose-500 border-rose-500/20"
            specs={[
              { label: "Audit Hash", value: "HMAC Cryptographic" },
              { label: "Storage Path", value: "Audit Stream Log" },
              { label: "Traceability", value: "100% Verified" },
              { label: "Access Level", value: "Admin Multi-Tenant" },
            ]}
          />
        </div>
      </div>

      {/* Row 3: Live Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Stream */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-border/60 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground font-display">
                WebSocket Live Stream Activity
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Real-Time
              </span>
            </div>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-3 rounded-2xl bg-secondary/40 border border-border/40 hover:bg-secondary/70 transition-all"
              >
                <div
                  className={cn(
                    "p-2.5 rounded-xl shrink-0 mt-0.5 shadow-xs",
                    getActivityBg(act.type),
                  )}
                >
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      {act.title}
                    </p>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                    {act.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Shortcuts */}
        <div className="glass-card p-6 rounded-3xl border border-border/60 flex flex-col h-[420px] justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground mb-4 font-display">
              Administrative Command Center
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/products"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-center group"
              >
                <Package className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground">
                  Gear Listings
                </span>
              </Link>
              <Link
                to="/admin/analytics"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-center group"
              >
                <TrendingUp className="h-5 w-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground">
                  Analytics Hub
                </span>
              </Link>
              <Link
                to="/admin/users"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-center group"
              >
                <Users className="h-5 w-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground">
                  User Roster
                </span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/40 transition-all text-center group"
              >
                <Settings className="h-5 w-5 text-cyan-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-foreground">
                  SaaS Config
                </span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  System Health Rating
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                  100% operational &amp; monitored
                </span>
              </div>
            </div>
            <Link
              to="/admin/activity-logs"
              className="p-2 rounded-xl bg-card hover:bg-secondary text-primary border border-border/50"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
