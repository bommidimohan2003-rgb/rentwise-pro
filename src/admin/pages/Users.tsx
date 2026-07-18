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
import { Loader } from "../components/layout/Loader";
import { usersService } from "../services/users";
import { AdminUser } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editVerified, setEditVerified] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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
  const handleSuspend = async (id: string) => {
    try {
      const updated = await usersService.suspendUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      toast.warning("User suspended successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to suspend user.");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const updated = await usersService.activateUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
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
      setUsers((prev) => prev.filter((u) => u.id !== id));
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
    setEditStatus(user.status);
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

      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
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
      [headers.join(","), ...rows.map((e) => e.map((x) => `"${x}"`).join(","))].join("\n");

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
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
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
            src={row.avatar}
            alt={row.fullName}
            className="h-9 w-9 rounded-full object-cover border border-border"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">{row.fullName}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (row) => <span className="text-xs font-semibold">{row.phone}</span>,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none",
            row.role === "admin" && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
            row.role === "agent" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            row.role === "user" && "bg-secondary text-muted-foreground",
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
            <ShieldCheck className="h-4.5 w-4.5 text-green-500" />
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
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none",
            row.status === "active"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400",
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Registered",
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {new Date(row.createdAt!).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedUser(row);
              setViewModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            title="Edit info"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {row.status === "active" ? (
            <button
              onClick={() => handleSuspend(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
              title="Suspend User"
            >
              <ShieldAlert className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleActivate(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-green-500 hover:bg-green-500/5 transition-all"
              title="Activate User"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit roles, status, verified credentials, and edit membership options.
          </p>
        </div>

        {/* Buttons */}
        <button
          onClick={handleExportCSV}
          className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 self-start sm:self-auto"
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
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
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
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Main Table */}
      {loading ? (
        <Loader message="Fetching users record..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedUsers}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No users match your criteria"
            emptyDescription="Try clearing your filters or testing another query."
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
        title="View User Details"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.fullName}
                className="h-16 w-16 rounded-full object-cover border border-primary/20"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-foreground">{selectedUser.fullName}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1.5">
                  {selectedUser.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">User ID</span>
                <p className="font-bold text-foreground mt-0.5">{selectedUser.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Phone Number</span>
                <p className="font-bold text-foreground mt-0.5">
                  {selectedUser.phone || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Status</span>
                <p className="mt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                      selectedUser.status === "active"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400",
                    )}
                  >
                    {selectedUser.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">KYC Verification</span>
                <p className="font-bold text-foreground mt-0.5">
                  {selectedUser.verified ? "Verified" : "Pending Verification"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Registration Date</span>
                <p className="font-bold text-foreground mt-0.5">
                  {new Date(selectedUser.createdAt!).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
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
              <label className="text-xs font-bold text-muted-foreground tracking-wide">Email</label>
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
                onChange={(e) => setEditRole(e.target.value as "admin" | "agent" | "user")}
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
                onChange={(e) => setEditStatus(e.target.value as "active" | "suspended")}
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
            <button type="submit" className="btn-gradient text-xs px-4 py-2 rounded-xl font-bold">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
