import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Calendar,
  Package,
  CreditCard,
  Star,
  RefreshCw,
  X,
  Lock,
  Mail,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { usersService } from "../services/users";
import { AdminUser } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminWS } from "../services/websocket";

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // User Detail Drawer
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"profile" | "verification" | "security">("profile");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to fetch user directory from database.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    const unsubRegister = adminWS.subscribe("user.registered", () => {
      fetchUsers(true);
    });
    const unsubUpdate = adminWS.subscribe("user.updated", () => {
      fetchUsers(true);
    });

    return () => {
      unsubRegister();
      unsubUpdate();
    };
  }, [fetchUsers]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleOpenUser = (u: AdminUser) => {
    setSelectedUser(u);
    setDrawerTab("profile");
    setDrawerOpen(true);
  };

  // User sensitive actions with backend enforcement
  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve and verify this user account?")) return;
    try {
      setActionLoading(true);
      const updated = await usersService.approveUser(id);
      setUsers((prev) => prev.map((u) => ((u.id === id || u.email === id) ? { ...u, ...updated, status: "approved", verified: true } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, ...updated, status: "approved", verified: true } : null);
      }
      toast.success("User account approved and verified.");
    } catch {
      toast.error("Failed to approve user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter reason for rejection (optional):") || undefined;
    try {
      setActionLoading(true);
      const updated = await usersService.rejectUser(id, reason);
      setUsers((prev) => prev.map((u) => ((u.id === id || u.email === id) ? { ...u, ...updated, status: "rejected" } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, ...updated, status: "rejected" } : null);
      }
      toast.info("User account registration rejected.");
    } catch {
      toast.error("Failed to reject user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this user? They will be barred from creating bookings or listings.")) return;
    try {
      setActionLoading(true);
      const updated = await usersService.suspendUser(id);
      setUsers((prev) => prev.map((u) => ((u.id === id || u.email === id) ? { ...u, ...updated, status: "suspended" } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, ...updated, status: "suspended" } : null);
      }
      toast.warning("User suspended.");
    } catch {
      toast.error("Failed to suspend user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      setActionLoading(true);
      const updated = await usersService.activateUser(id);
      setUsers((prev) => prev.map((u) => ((u.id === id || u.email === id) ? { ...u, ...updated, status: "active" } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, ...updated, status: "active" } : null);
      }
      toast.success("User account reactivated.");
    } catch {
      toast.error("Failed to reactivate user.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    result.sort((a, b) => {
      const fieldA = (a as unknown as Record<string, string | number>)[sortKey];
      const fieldB = (b as unknown as Record<string, string | number>)[sortKey];

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      return 0;
    });

    return result;
  }, [users, search, statusFilter, roleFilter, sortKey, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      label: "User Profile",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-secondary border border-border/80 flex items-center justify-center font-bold text-xs text-foreground overflow-hidden shrink-0">
            {row.avatar || row.profilePhotoUrl ? (
              <img src={row.avatar || row.profilePhotoUrl} alt={row.fullName} className="h-full w-full object-cover" />
            ) : (
              <span>{(row.fullName || row.email || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-foreground truncate">{row.fullName || "Unnamed User"}</div>
            <div className="text-[11px] text-muted-foreground font-mono truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
            row.role === "admin"
              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
              : row.role === "agent"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              : "bg-secondary text-muted-foreground border-border/60"
          )}
        >
          {row.role || "user"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const isApproved = row.status === "approved" || row.status === "active";
        const isPending = row.status === "pending";
        const isSuspended = row.status === "suspended";
        const isRejected = row.status === "rejected";

        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1",
              isApproved
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isPending
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : isSuspended || isRejected
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-muted-foreground border-border/60"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {row.status || "active"}
          </span>
        );
      },
    },
    {
      key: "verified",
      label: "Verification",
      render: (row) =>
        row.verified ? (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenUser(row)}
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
            title="View user details drawer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {row.status === "pending" && (
            <>
              <button
                onClick={() => handleApprove(row.id || row.email)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                title="Approve user"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleReject(row.id || row.email)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer"
                title="Reject user"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {row.status === "suspended" ? (
            <button
              onClick={() => handleActivate(row.id || row.email)}
              disabled={actionLoading}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
              title="Reactivate user"
            >
              <UserCheck className="h-3.5 w-3.5" />
            </button>
          ) : (
            row.status !== "pending" && (
              <button
                onClick={() => handleSuspend(row.id || row.email)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer"
                title="Suspend user"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            Users Management Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative database user records, identity verification, account status, and role gating.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-secondary border border-border/80 text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-card text-foreground text-xs rounded-xl pl-9 pr-4 py-2 border border-border/80 focus:outline-none focus:border-primary font-medium"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-secondary rounded-xl border border-border/60 text-xs font-semibold">
            {["all", "pending", "approved", "suspended"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-[11px]",
                  statusFilter === st
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Role Select */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-card text-foreground text-xs rounded-xl px-3 py-2 border border-border/80 focus:outline-none font-semibold cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="agent">Agent / Lender</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchUsers()} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* USERS TABLE */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={paginatedUsers}
          loading={loading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No matching user records found in the database."
        />

        {filteredUsers.length > itemsPerPage && (
          <div className="p-4 border-t border-border/40">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredUsers.length}
            />
          </div>
        )}
      </div>

      {/* USER DETAIL SLIDE-OUT DRAWER */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border-l border-border/80 shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-sm text-foreground overflow-hidden">
                  {selectedUser.avatar || selectedUser.profilePhotoUrl ? (
                    <img src={selectedUser.avatar || selectedUser.profilePhotoUrl} alt={selectedUser.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground truncate max-w-[200px]">
                    {selectedUser.fullName || "User Detail"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center border-b border-border/40 px-5 pt-2 gap-4 text-xs font-semibold">
              <button
                onClick={() => setDrawerTab("profile")}
                className={cn(
                  "pb-2 border-b-2 cursor-pointer transition-colors",
                  drawerTab === "profile" ? "border-primary text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Profile & Overview
              </button>
              <button
                onClick={() => setDrawerTab("verification")}
                className={cn(
                  "pb-2 border-b-2 cursor-pointer transition-colors",
                  drawerTab === "verification" ? "border-primary text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Verification & KYC
              </button>
              <button
                onClick={() => setDrawerTab("security")}
                className={cn(
                  "pb-2 border-b-2 cursor-pointer transition-colors",
                  drawerTab === "security" ? "border-primary text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Account Security
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {drawerTab === "profile" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">User ID</span>
                      <span className="font-mono font-bold">{selectedUser.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-secondary border border-border/60">
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Platform Role</span>
                      <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-secondary border border-border/60">
                        {selectedUser.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Registered Date</span>
                      <span className="font-mono">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Contact Information</h4>
                    <div className="p-3 rounded-xl bg-card border border-border/60 space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-foreground font-medium">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-foreground font-medium">{selectedUser.phone}</span>
                        </div>
                      )}
                      {(selectedUser.city || selectedUser.address) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-foreground font-medium">{selectedUser.city || selectedUser.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === "verification" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Identity Verification Status</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selectedUser.verified
                        ? "User has successfully fulfilled email, phone 2FA, and identity verification requirements."
                        : "Account registration is awaiting administrative identity confirmation."}
                    </p>
                    <div className="pt-2 border-t border-border/40 flex justify-between items-center font-mono">
                      <span>KYC Verified:</span>
                      <span className={cn("font-bold", selectedUser.verified ? "text-emerald-500" : "text-amber-500")}>
                        {selectedUser.verified ? "YES" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === "security" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Security & Access Control</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Administrative state changes are tracked in the security audit logs and enforced at backend gateway layer.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-border/60 bg-secondary/20 flex items-center justify-between gap-2">
              {selectedUser.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleApprove(selectedUser.id || selectedUser.email)}
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Approve Account
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id || selectedUser.email)}
                    disabled={actionLoading}
                    className="flex-1 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Reject Account
                  </button>
                </>
              ) : selectedUser.status === "suspended" ? (
                <button
                  onClick={() => handleActivate(selectedUser.id || selectedUser.email)}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Reactivate Account
                </button>
              ) : (
                <button
                  onClick={() => handleSuspend(selectedUser.id || selectedUser.email)}
                  disabled={actionLoading}
                  className="w-full py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Suspend User Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
