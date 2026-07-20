import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, IndianRupee, Calendar, Users, ShoppingBag, Eye } from "lucide-react";
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
import { notificationsService, DashboardStats, DashboardCharts } from "../services/notifications";
import { toast } from "sonner";

export default function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("30");

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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData] = await Promise.all([
        notificationsService.getDashboardStats(),
        notificationsService.getDashboardCharts(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
    } catch {
      toast.error("Failed to load analytics datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod]);

  if (loading) {
    return <Loader message="Compiling analytical records..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Analytics Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit conversion benchmarks, monthly transaction volumes, and lender acquisitions.
          </p>
        </div>

        {/* Time period select dropdown */}
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="bg-card text-foreground text-xs rounded-xl px-4 py-2.5 border border-border/80 focus:outline-none focus:border-primary transition-all self-start sm:self-auto"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last 12 Months</option>
        </select>
      </div>

      {/* Advanced sub statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Average Lease Value"
          value={stats?.monthlyBookings ? `₹${(stats.monthlyRevenue / stats.monthlyBookings).toFixed(2)}` : "₹0.00"}
          change="+4.2%"
          trend="up"
          icon={IndianRupee}
          subtext="per lease contract"
        />
        <StatsCard
          title="Listing Conversion Rate"
          value={stats?.totalProducts ? `${((stats.monthlyBookings / stats.totalProducts) * 100).toFixed(2)}%` : "0.00%"}
          change="+0.9%"
          trend="up"
          icon={TrendingUp}
          subtext="clicks to completed lease"
        />
        <StatsCard
          title="Customer Acq Cost (CAC)"
          value={stats?.totalUsers ? `₹${Math.max(10, 150 - stats.totalUsers * 2).toFixed(2)}` : "₹0.00"}
          change="-6.4%"
          trend="up" // Representing improvement (costs down)
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

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Area Chart with Grid */}
        <ChartCard
          title="Leasing Commissions Revenue"
          description="Trace gross transaction fees and payouts"
        >
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
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                opacity={0.4}
              />
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
              <Area
                type="monotone"
                name="Revenue"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={2.5}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Booking Vol Bar Chart */}
        <ChartCard
          title="Leasing Volume Orders"
          description="Quantity of leases processed by month"
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
                opacity={0.4}
              />
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
              <Bar name="Bookings" dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3: Line Chart: Users Growth vs Product Growth */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Lender Acquisition Rates"
            description="Compare verified agent registration and inventory count"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
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
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "600" }}
                />
                <Line
                  type="monotone"
                  name="Agents (Lenders)"
                  dataKey="users"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="Gear Listed"
                  dataKey="products"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
