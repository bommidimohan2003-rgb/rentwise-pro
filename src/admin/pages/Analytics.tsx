import { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Calendar,
  Users,
  ShoppingBag,
  Eye,
  Download,
  Filter,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Search,
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
  Legend,
  LineChart,
  Line,
  CartesianGrid,
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

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("30");
  const [searchCategory, setSearchCategory] = useState("");

  const combinedGrowthData = useMemo(() => {
    if (!charts?.userGrowth || !charts?.productGrowth) return [];
    return charts.userGrowth.map((item, idx) => {
      const prodItem = charts.productGrowth[idx];
      return {
        name: item.name,
        users: item.users,
        products: prodItem ? prodItem.products : 0,
      };
    });
  }, [charts]);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [statsData, chartsData] = await Promise.all([
          notificationsService.getDashboardStats(),
          notificationsService.getDashboardCharts(timePeriod),
        ]);
        if (isMounted) {
          setStats(statsData);
          setCharts(chartsData);
        }
      } catch {
        toast.error("Failed to load analytics datasets.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [timePeriod]);

  const handleExportCSV = () => {
    const csvRows = [
      ["Metric", "Value", "Period"],
      [
        "Average Lease Value",
        stats?.monthlyBookings
          ? (stats.monthlyRevenue / stats.monthlyBookings).toFixed(2)
          : "0",
        `${timePeriod} Days`,
      ],
      [
        "Listing Conversion Rate",
        stats?.totalProducts
          ? `${((stats.monthlyBookings / stats.totalProducts) * 100).toFixed(2)}%`
          : "0%",
        `${timePeriod} Days`,
      ],
      [
        "Customer Acq Cost (CAC)",
        stats?.totalUsers
          ? Math.max(10, 150 - stats.totalUsers * 2).toFixed(2)
          : "0",
        `${timePeriod} Days`,
      ],
      [
        "Website Visitors",
        stats?.websiteVisitors || 15420,
        `${timePeriod} Days`,
      ],
      ["Monthly Revenue", stats?.monthlyRevenue || 0, `${timePeriod} Days`],
      ["Approved Products", stats?.approvedProducts || 0, `${timePeriod} Days`],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payent_analytics_report_${timePeriod}d_${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${timePeriod}-day analytics report as CSV.`);
  };

  const filteredCategories = useMemo(() => {
    if (!charts?.categoryDistribution) return [];
    return (
      charts.categoryDistribution as { name: string; value: number }[]
    ).filter((c) =>
      c.name.toLowerCase().includes(searchCategory.toLowerCase()),
    );
  }, [charts, searchCategory]);

  if (loading) {
    return <Loader message="Compiling analytical records..." size="lg" />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Analytics SaaS Hero Header */}
      <div className="glass-hero relative overflow-hidden p-6 md:p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-xs font-bold text-primary">
              <Activity className="h-3.5 w-3.5" /> Platform Commercial
              Intelligence
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight font-display">
              Analytics &amp;{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-cyan-500">
                Unit Economics
              </span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium leading-relaxed">
              Analyze leasing volume, conversion funnels, lender acquisition
              costs, and revenue growth benchmarks.
            </p>
          </div>

          {/* Controls: Time Horizon Select & CSV Export */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* Time Period Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-secondary/80 border border-border/60">
              {[
                { label: "7D", val: "7" },
                { label: "30D", val: "30" },
                { label: "90D", val: "90" },
                { label: "12M", val: "365" },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setTimePeriod(t.val)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    timePeriod === t.val
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-bold font-display inline-flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Download className="h-4 w-4" />
              Export CSV Report
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Unit Economics Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Average Lease Value"
          value={
            stats?.monthlyBookings
              ? `₹${(stats.monthlyRevenue / stats.monthlyBookings).toFixed(2)}`
              : "₹0.00"
          }
          change="+4.2%"
          trend="up"
          icon={IndianRupee}
          subtext="per lease contract"
        />
        <StatsCard
          title="Listing Conversion Rate"
          value={
            stats?.totalProducts
              ? `${((stats.monthlyBookings / stats.totalProducts) * 100).toFixed(2)}%`
              : "0.00%"
          }
          change="+0.9%"
          trend="up"
          icon={TrendingUp}
          subtext="clicks to completed lease"
        />
        <StatsCard
          title="Customer Acq Cost (CAC)"
          value={
            stats?.totalUsers
              ? `₹${Math.max(10, 150 - stats.totalUsers * 2).toFixed(2)}`
              : "₹0.00"
          }
          change="-6.4%"
          trend="up"
          icon={Users}
          subtext="avg marketing spend"
        />
        <StatsCard
          title="Website Visitors"
          value={stats?.websiteVisitors?.toLocaleString() || "15,420"}
          change="+18.1%"
          trend="up"
          icon={Eye}
          subtext="pageview clicks count"
        />
      </div>

      {/* Analytics Real-Time Visualization Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Area Chart */}
        <ChartCard
          title="Leasing Commissions & Take Revenue"
          description="Trace gross platform transaction fees across time window"
          action={
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {timePeriod}D Window
            </span>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={charts?.revenueChart}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorRevAnalytics"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.5} />
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
                  fontSize: "11px",
                }}
              />
              <Area
                type="monotone"
                name="Revenue (₹)"
                dataKey="revenue"
                stroke="#ff5a5f"
                strokeWidth={2.5}
                fill="url(#colorRevAnalytics)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Booking Vol Bar Chart */}
        <ChartCard
          title="Leasing Volume Orders"
          description="Total completed equipment leases per period"
          action={
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Volume Stream
            </span>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={charts?.bookingChart}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
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
                  fontSize: "11px",
                }}
              />
              <Bar
                name="Bookings"
                dataKey="bookings"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Lender Acquisition Rates Dual Axis */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Lender Acquisition Rates & Inventory Expansion"
            description="Comparing growth rate of verified camera lenders vs listed equipment items"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
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
                    fontSize: "11px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "600" }}
                />
                <Line
                  type="monotone"
                  name="Verified Lenders"
                  dataKey="users"
                  stroke="#ff5a5f"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="Gear Inventory Listed"
                  dataKey="products"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Equipment Category Breakdown & Commercial Table */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-border/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-foreground font-display">
              Equipment Category Monetization Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed list of camera and tech gear category shares across
              Payent.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search category..."
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full bg-secondary/60 text-foreground text-xs rounded-xl pl-9 pr-4 py-2 border border-border/80 focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Category Name</th>
                <th className="p-3.5">Active Inventory</th>
                <th className="p-3.5">Category Share %</th>
                <th className="p-3.5">Est. Monthly Revenue</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat, idx) => {
                  const total = charts?.categoryDistribution
                    ? (
                        charts.categoryDistribution as { value: number }[]
                      ).reduce((a, b) => a + b.value, 0)
                    : 1;
                  const pct = ((cat.value / (total || 1)) * 100).toFixed(1);
                  const estRev = (
                    stats?.monthlyRevenue
                      ? stats.monthlyRevenue * (cat.value / (total || 1))
                      : 0
                  ).toFixed(0);

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-secondary/40 transition-colors"
                    >
                      <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                        {cat.name}
                      </td>
                      <td className="p-3.5">{cat.value} items</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Number(pct))}%`,
                              }}
                            />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-500">
                        ₹{Number(estRev).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-muted-foreground text-xs font-semibold"
                  >
                    No categories found matching "{searchCategory}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
