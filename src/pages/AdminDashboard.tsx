import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Package,
  ShoppingBag,
  DollarSign,
  Trash2,
  RefreshCw,
  Shield,
  Search,
  Check,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminUser {
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface AdminListing {
  id: string;
  userEmail: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  available: boolean;
  ownerName: string;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  productImage: string;
  startDate: string;
  endDate: string;
  total: number;
  status: "pending" | "active" | "completed" | "cancelled";
  createdAt: string;
}

type TabType = "users" | "listings" | "orders";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const token = storage.get<string | null>(STORAGE_KEYS.token, null) || "";

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, u, l, o] = await Promise.all([
        api.adminGetStats(token),
        api.adminGetUsers(token),
        api.adminGetListings(token),
        api.adminGetOrders(token),
      ]);
      setStats(s);
      setUsers(u);
      setListings(l);
      setOrders(o);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load administration data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleUpdateRole = async (email: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await api.adminUpdateUserRole(token, email, newRole);
      toast.success(`Updated role for ${email} to ${newRole}`);
      setUsers(users.map((u) => (u.email === email ? { ...u, role: newRole } : u)));
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to update role.");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${email}?`)) return;
    try {
      await api.adminDeleteUser(token, email);
      toast.success(`Successfully deleted user ${email}`);
      setUsers(users.filter((u) => u.email !== email));
      if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to delete user.");
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to moderate and delete this listing?")) return;
    try {
      await api.adminDeleteListing(token, id);
      toast.success("Listing deleted successfully.");
      setListings(listings.filter((l) => l.id !== id));
      if (stats) setStats({ ...stats, totalListings: stats.totalListings - 1 });
    } catch (err) {
      toast.error("Failed to delete listing.");
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      await api.adminUpdateOrderStatus(token, id, status);
      toast.success("Order status updated successfully.");
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: status as any } : o)));
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order record?")) return;
    try {
      await api.adminDeleteOrder(token, id);
      toast.success("Order record deleted successfully.");
      setOrders(orders.filter((o) => o.id !== id));
      if (stats) setStats({ ...stats, totalOrders: stats.totalOrders - 1 });
    } catch (err) {
      toast.error("Failed to delete order.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Moderator control center to manage platform listings, users, and orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-premium p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.totalUsers ?? 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UsersIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="card-premium p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Listings</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.totalListings ?? 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="card-premium p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
            <h3 className="text-2xl font-bold mt-1">{stats?.totalOrders ?? 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        <div className="card-premium p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Volume</p>
            <h3 className="text-2xl font-bold mt-1">${stats?.totalRevenue ?? 0}</h3>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs & Search */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <div className="card-premium p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchTerm("");
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                activeTab === "users"
                  ? "btn-gradient text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <UsersIcon className="h-4 w-4" />
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab("listings");
                setSearchTerm("");
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                activeTab === "listings"
                  ? "btn-gradient text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Package className="h-4 w-4" />
              Listings
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                setSearchTerm("");
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                activeTab === "orders"
                  ? "btn-gradient text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Orders
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="card-premium p-12 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="card-premium overflow-hidden">
              {activeTab === "users" && (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                    <div className="col-span-4">User Details</div>
                    <div className="col-span-3">Phone</div>
                    <div className="col-span-2 text-center">Role</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No users found.</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.email} className="grid grid-cols-12 p-4 items-center text-sm">
                        <div className="col-span-4 pr-2">
                          <p className="font-semibold text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                        </div>
                        <div className="col-span-3 text-muted-foreground">{u.phone || "—"}</div>
                        <div className="col-span-2 flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.role === "admin" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {u.role}
                          </span>
                        </div>
                        <div className="col-span-3 flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleUpdateRole(u.email, u.role)}>
                            Toggle Admin
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.email)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "listings" && (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                    <div className="col-span-5">Listing Details</div>
                    <div className="col-span-3">Category</div>
                    <div className="col-span-2 text-center">Price / Day</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  {filteredListings.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No listings found.</div>
                  ) : (
                    filteredListings.map((l) => (
                      <div key={l.id} className="grid grid-cols-12 p-4 items-center text-sm">
                        <div className="col-span-5 flex items-center gap-3 pr-2">
                          {l.image ? (
                            <img src={l.image} alt={l.title} className="h-10 w-10 object-cover rounded-lg shrink-0" />
                          ) : (
                            <div className="h-10 w-10 bg-secondary rounded-lg shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{l.title}</p>
                            <p className="text-xs text-muted-foreground truncate">Owner: {l.userEmail}</p>
                          </div>
                        </div>
                        <div className="col-span-3 text-muted-foreground capitalize">{l.category}</div>
                        <div className="col-span-2 text-center font-bold">${l.price}</div>
                        <div className="col-span-2 flex justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteListing(l.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "orders" && (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                    <div className="col-span-4">Rental Info</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Total</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No orders found.</div>
                  ) : (
                    filteredOrders.map((o) => (
                      <div key={o.id} className="grid grid-cols-12 p-4 items-center text-sm">
                        <div className="col-span-4 pr-2">
                          <p className="font-semibold text-foreground truncate">{o.productTitle}</p>
                          <p className="text-xs text-muted-foreground">Renter: {o.userEmail}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {o.startDate} to {o.endDate}
                          </p>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              o.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : o.status === "active"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : o.status === "cancelled"
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                        <div className="col-span-2 text-center font-bold">${o.total}</div>
                        <div className="col-span-4 flex justify-end gap-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="text-xs border border-input rounded-lg bg-background p-1 focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteOrder(o.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
