import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  Package,
  Calendar,
  DollarSign,
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
} from "recharts";
import { StatsCard } from "../components/layout/StatsCard";
import { ChartCard } from "../components/layout/ChartCard";
import { Loader } from "../components/layout/Loader";
import { notificationsService, DashboardStats, DashboardCharts, DashboardActivity } from "../services/notifications";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#7c3aed", "#10b981", "#a855f7", "#f97316", "#ec4899"];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData, activitiesData] = await Promise.all([
        notificationsService.getDashboardStats(),
        notificationsService.getDashboardCharts(),
        notificationsService.getDashboardActivities(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setActivities(activitiesData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registered":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "product_uploaded":
        return <Camera className="h-4 w-4 text-blue-500" />;
      case "product_approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "product_rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "booking_created":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case "payment_success":
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "review_submitted":
        return <Star className="h-4 w-4 text-amber-500" fill="currentColor" />;
      case "product_reported":
        return <Flag className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case "user_registered":
        return "bg-primary/10";
      case "product_uploaded":
        return "bg-blue-500/10";
      case "product_approved":
        return "bg-green-500/10";
      case "product_rejected":
        return "bg-red-500/10";
      case "booking_created":
        return "bg-purple-500/10";
      case "payment_success":
        return "bg-emerald-500/10";
      case "review_submitted":
        return "bg-amber-500/10";
      case "product_reported":
        return "bg-destructive/10";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return <Loader message="Analyzing platform metrics..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Operational Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor listings, rentals, payouts, and user verification requests across Payent.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={loadData}
          className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Revenue (Month)"
          value={`$${stats?.monthlyRevenue?.toLocaleString()}`}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          subtext="from last month"
        />
        <StatsCard
          title="Active Listings"
          value={stats?.approvedProducts ?? 0}
          change="+8.2%"
          trend="up"
          icon={Package}
          subtext={`${stats?.pendingProducts ?? 0} pending approval`}
        />
        <StatsCard
          title="Rentals Today"
          value={stats?.bookingsToday ?? 0}
          change="+4.5%"
          trend="up"
          icon={Calendar}
          subtext={`${stats?.monthlyBookings ?? 0} this month`}
        />
        <StatsCard
          title="Active Users"
          value={stats?.totalUsers ?? 0}
          change="+15.1%"
          trend="up"
          icon={Users}
          subtext={`${stats?.totalAgents ?? 0} verified agents`}
        />
      </div>

      {/* Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Revenue Trend */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue Trend" description="Monthly transaction revenue performance">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts?.revenueChart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.8rem",
                  }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "11px", color: "var(--color-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Category distribution */}
        <div>
          <ChartCard title="Category Distribution" description="Items listed by category share">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.categoryDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(
                    charts?.categoryDistribution as { name: string; value: number }[] | undefined
                  )?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

      {/* Row 2 Charts & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings & Users growth */}
        <div className="lg:col-span-2">
          <ChartCard title="Growth Trend" description="Comparing User Growth and Product Listings">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={charts?.userGrowth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.8rem",
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="line"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "600" }}
                />
                <Line
                  type="monotone"
                  name="Users"
                  dataKey="users"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="Products"
                  dataKey="users"
                  stroke="#10b981"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top performing products list */}
        <div>
          <div className="card-premium bg-card/60 p-5 flex flex-col h-[350px]">
            <h3 className="text-sm font-bold text-foreground mb-3">Top Listings</h3>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {(
                charts?.topProducts as
                  { name: string; rentals: number; revenue: number }[] | undefined
              )?.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                      {p.rentals} rentals
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-primary shrink-0">${p.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Live Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 card-premium bg-card/60 p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Live Activity Feed</h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", getActivityBg(act.type))}>
                  {getActivityIcon(act.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">{act.title}</p>
                    <span className="text-[9px] font-semibold text-muted-foreground/60 shrink-0">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                    {act.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="card-premium bg-card/60 p-5 flex flex-col h-[400px] justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4">System Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/products"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-center group"
              >
                <Package className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-foreground">Review Products</span>
              </Link>
              <Link
                to="/admin/reports"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-center group"
              >
                <AlertTriangle className="h-5 w-5 text-destructive mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-foreground">Flagged Listings</span>
              </Link>
              <Link
                to="/admin/support"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-center group"
              >
                <Users className="h-5 w-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-foreground">Open Tickets</span>
              </Link>
              <Link
                to="/admin/settings"
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-center group"
              >
                <Settings className="h-5 w-5 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-foreground">Site Settings</span>
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">Platform Security</span>
                <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                  All services active & stable
                </span>
              </div>
            </div>
            <Link
              to="/admin/activity-logs"
              className="p-1 rounded-lg hover:bg-secondary text-primary"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
