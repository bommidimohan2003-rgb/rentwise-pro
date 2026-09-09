import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  Edit2,
  ShieldAlert,
  CheckCircle,
  Trash2,
  ShieldCheck,
  Download,
  Plus,
  X,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Modal } from "../components/layout/Modal";
import { usersService } from "../services/users";
import { AdminUser } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LoadingState,
  ErrorState,
  SlowConnectionIndicator,
  NoSearchResults,
  useSlowConnection,
} from "@/components/states";
import { adminWS } from "../services/websocket";

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSlow = useSlowConnection(loading);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "agent" | "user">("user");
  const [editStatus, setEditStatus] = useState<"active" | "suspended">(
    "active",
  );
  const [editVerified, setEditVerified] = useState(false);

  const fetchUsers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to fetch users. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const unsubRegister = adminWS.subscribe("user.registered", (event) => {
      const newUser = event.data as AdminUser;
      if (newUser && newUser.email) {
        setUsers((prev) => {
          if (prev.some((u) => u.email === newUser.email)) return prev;
          return [newUser, ...prev];
        });
        toast.info(
          `Live: New user ${newUser.fullName || newUser.email} registered!`,
        );
      }
    });

    const unsubUpdate = adminWS.subscribe("user.updated", (event) => {
      const updatedUser = event.data as Partial<AdminUser>;
      if (updatedUser && (updatedUser.id || updatedUser.email)) {
        const key = updatedUser.id || updatedUser.email;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === key || u.email === key ? { ...u, ...updatedUser } : u,
          ),
        );
      }
    });

    const unsubDelete = adminWS.subscribe("user.deleted", (event) => {
      const deleted = event.data as { id: string; email?: string };
      if (deleted && (deleted.id || deleted.email)) {
        const key = deleted.id || deleted.email;
        setUsers((prev) => prev.filter((u) => u.id !== key && u.email !== key));
      }
    });

    return () => {
      unsubRegister();
      unsubUpdate();
      unsubDelete();
    };
  }, []);

  // Sort callback
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Actions
  const handleApprove = async (id: string) => {
    try {
      const updated = await usersService.approveUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id || u.email === id ? { ...u, ...updated, status: "approved", verified: true } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, status: "approved", verified: true } : null);
      }
      toast.success(`User ${id} approved successfully!`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to approve user.";
      toast.error(msg);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Optional: Enter rejection reason for user notification:") || undefined;
    try {
      const updated = await usersService.rejectUser(id, reason);
      setUsers((prev) => prev.map((u) => (u.id === id || u.email === id ? { ...u, ...updated, status: "rejected" } : u)));
      if (selectedUser && (selectedUser.id === id || selectedUser.email === id)) {
        setSelectedUser((prev) => prev ? { ...prev, status: "rejected" } : null);
      }
      toast.warning(`User ${id} has been rejected.`);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to reject user.";
      toast.error(msg);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      const updated = await usersService.suspendUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id || u.email === id ? { ...u, ...updated, status: "suspended" } : u)));
      toast.warning("User suspended successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to suspend user.");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const updated = await usersService.activateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id || u.email === id ? { ...u, ...updated, status: "active" } : u)));
      toast.success("User activated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to activate user.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await usersService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id && u.email !== id));
      toast.success("User deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user.");
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditName(user.fullName);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditRole(user.role);
    setEditStatus(user.status as any);
    setEditVerified(user.verified);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updated = await usersService.updateUser(selectedUser.id, {
        fullName: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        status: editStatus,
        verified: editVerified,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)),
      );
      setEditModalOpen(false);
      toast.success("User details updated successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user.");
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Verified",
      "Created At",
    ];
    const rows = users.map((u) => [
      u.id,
      u.fullName,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.verified ? "Yes" : "No",
      u.createdAt,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) => e.map((x) => `"${x}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payent_users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully!");
  };

  // Filtering & Sorting Math
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }

    // Role
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Status
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const fieldA = (a as unknown as Record<string, string | number>)[sortKey];
      const fieldB = (b as unknown as Record<string, string | number>)[sortKey];

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      return 0;
    });

    return result;
  }, [users, search, roleFilter, statusFilter, sortKey, sortOrder]);

  // Paginated slices
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  // Table Columns Definition
  const columns: Column<AdminUser>[] = [
    {
      key: "fullName",
      label: "User",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
            alt={row.fullName}
            className="h-9 w-9 rounded-full object-cover border border-border shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">
              {row.fullName}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
              {row.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold">{row.phone || "—"}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none border",
            row.role === "admin" &&
              "bg-primary text-primary-foreground border-primary",
            row.role === "agent" &&
              "bg-secondary text-foreground border-border",
            row.role === "user" &&
              "bg-secondary text-muted-foreground border-border/60",
          )}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: "verified",
      label: "Verified",
      sortable: true,
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.verified ? (
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ShieldAlert className="h-4.5 w-4.5 text-muted-foreground/60" />
          )}
        </div>
      ),
      align: "center",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const s = (row.status || "pending").toLowerCase();
        return (
          <span
            className={cn(
              "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none border",
              s === "approved" || s === "active"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : s === "pending"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 animate-pulse"
                : s === "rejected"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30",
            )}
          >
            {s === "pending" ? "Pending Approval" : s}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Registered",
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => {
        const isPending = (row.status || "pending").toLowerCase() === "pending";
        return (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => {
                setSelectedUser(row);
                setViewModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all cursor-pointer"
              title="View full account details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {isPending && (
              <>
                <button
                  onClick={() => handleApprove(row.id || row.email)}
                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-all cursor-pointer"
                  title="Approve user registration"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleReject(row.id || row.email)}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
                  title="Reject user registration"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
              title="Edit info"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            {(row.status === "active" || row.status === "approved") ? (
              <button
                onClick={() => handleSuspend(row.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all cursor-pointer"
                title="Suspend User"
              >
                <ShieldAlert className="h-4 w-4" />
              </button>
            ) : row.status === "suspended" ? (
              <button
                onClick={() => handleActivate(row.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer"
                title="Activate User"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            ) : null}
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management & Approvals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit user registrations, inspect credentials, and manually approve or reject accounts.
          </p>
        </div>

        {/* Buttons */}
        <button
          onClick={handleExportCSV}
          className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="agent">Lenders (Agents)</option>
          <option value="user">Renters (Users)</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Slow Connection Indicator */}
      {isSlow && (
        <SlowConnectionIndicator message="Fetching user records is taking a bit longer than usual..." />
      )}

      {/* Main Table & States */}
      {loading ? (
        <LoadingState type="table" count={5} />
      ) : error ? (
        <ErrorState
          title="Unable to load user list"
          error={error}
          onRetry={fetchUsers}
        />
      ) : filteredUsers.length === 0 ? (
        <NoSearchResults
          query={search}
          onClearFilters={() => {
            setSearch("");
            setRoleFilter("all");
            setStatusFilter("all");
          }}
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedUsers}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* VIEW MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Complete User Account Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-5">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar || selectedUser.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  alt={selectedUser.fullName}
                  className="h-16 w-16 rounded-2xl object-cover border border-primary/20 bg-secondary"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-foreground">
                    {selectedUser.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {selectedUser.email}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary border border-border">
                      {selectedUser.role}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                        (selectedUser.status === "approved" || selectedUser.status === "active")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : selectedUser.status === "pending"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                      )}
                    >
                      {selectedUser.status === "pending" ? "Pending Approval" : selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions in Header */}
              {selectedUser.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedUser.id || selectedUser.email)}
                    className="px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve User</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedUser.id || selectedUser.email)}
                    className="px-4 py-2 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject User</span>
                  </button>
                </div>
              )}
            </div>

            {/* Account Details Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Account ID / Email
                </span>
                <p className="font-bold text-foreground">
                  {selectedUser.id || selectedUser.email}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Phone Number
                </span>
                <p className="font-bold text-foreground">
                  {selectedUser.phone || "Not set"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Location / Address
                </span>
                <p className="font-bold text-foreground">
                  {[selectedUser.address, selectedUser.city, selectedUser.pincode].filter(Boolean).join(", ") || "India"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  KYC / Identity Verification
                </span>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  {selectedUser.verified ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Verified Identity
                    </span>
                  ) : (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4" /> Verification Pending
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/50 space-y-1 sm:col-span-2">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Registration Timestamp
                </span>
                <p className="font-bold text-foreground">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "Recently registered"}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">
                Payent Administrative Audit Trail Synced
              </span>
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Profile"
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Account Role
              </label>
              <select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as "admin" | "agent" | "user")
                }
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="user">Renter (User)</option>
                <option value="agent">Lender (Agent)</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as "active" | "suspended")
                }
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Verified status checkbox */}
            <div className="col-span-2 flex items-center mt-2">
              <input
                id="editVerified"
                type="checkbox"
                checked={editVerified}
                onChange={(e) => setEditVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
              />
              <label
                htmlFor="editVerified"
                className="ml-2 text-xs font-semibold text-muted-foreground select-none"
              >
                Identity Profile Verified (KYC)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gradient text-xs px-4 py-2 rounded-xl font-bold"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
