import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  ShoppingBag,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Star,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Modal } from "../components/layout/Modal";
import { Loader } from "../components/layout/Loader";
import { usersService } from "../services/users";
import { AdminAgent } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

export default function Agents() {
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedAgent, setSelectedAgent] = useState<AdminAgent | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load agents list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      const updated = await usersService.suspendAgent(id);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.warning("Agent suspended successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to suspend agent.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent profile?")) return;
    try {
      await usersService.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      toast.success("Agent profile deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete agent.");
    }
  };

  // Navigate to Products page, passing agent name as search filter
  const handleViewProducts = (agentName: string) => {
    navigate({ to: "/admin/products", search: { search: agentName } as { search?: string } });
  };

  const filteredAgents = useMemo(() => {
    let result = [...agents];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
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
  }, [agents, search, statusFilter, sortKey, sortOrder]);

  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(start, start + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const columns: Column<AdminAgent>[] = [
    {
      key: "fullName",
      label: "Agent / Lender",
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
      key: "productsCount",
      label: "Uploads",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.productsCount} gear items</span>,
      align: "center",
    },
    {
      key: "bookingsCount",
      label: "Rentals",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.bookingsCount} orders</span>,
      align: "center",
    },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-extrabold text-primary">${row.revenue.toLocaleString()}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold">{row.rating.toFixed(1)}</span>
        </div>
      ),
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
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedAgent(row);
              setProfileModalOpen(true);
            }}
            className="btn-gradient text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1"
            title="View full profiles"
          >
            <Eye className="h-3 w-3" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => handleViewProducts(row.fullName)}
            className="bg-secondary text-foreground text-[10px] px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 hover:bg-secondary/70 transition-colors"
            title="View inventory listings"
          >
            <ShoppingBag className="h-3 w-3 text-muted-foreground" />
            <span>Gear</span>
          </button>
          {row.status === "active" && (
            <button
              onClick={() => handleSuspend(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
              title="Suspend profile"
            >
              <ShieldAlert className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Delete lender account"
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
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Agent Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Moderate verified lender agents, track products cataloged, total rental count, and revenue
          commissions.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by agent name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status Select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Lenders</option>
          <option value="active">Active Lenders</option>
          <option value="suspended">Suspended Lenders</option>
        </select>
      </div>

      {/* Table grid */}
      {loading ? (
        <Loader message="Gathering agent records..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedAgents}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No agents found"
            emptyDescription="Try tweaking your queries or verification criteria."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredAgents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* AGENT PROFILE MODAL */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Agent Performance Report"
        size="md"
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <img
                src={selectedAgent.avatar}
                alt={selectedAgent.fullName}
                className="h-16 w-16 rounded-full object-cover border border-primary/20"
              />
              <div className="flex flex-col">
                <span className="text-base font-bold text-foreground">
                  {selectedAgent.fullName}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">{selectedAgent.email}</span>
                <div className="flex items-center gap-1.5 mt-2 bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full w-fit">
                  <Star className="h-3 w-3 fill-primary" />
                  <span>Agent Rating: {selectedAgent.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Sub statistics cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-secondary/45 border border-border/50 text-center">
                <Package className="h-4 w-4 text-primary mx-auto mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Uploaded Gear
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block">
                  {selectedAgent.productsCount} items
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/45 border border-border/50 text-center">
                <Calendar className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Total Rentals
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block">
                  {selectedAgent.bookingsCount} orders
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/45 border border-border/50 text-center">
                <DollarSign className="h-4 w-4 text-green-500 mx-auto mb-1" />
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Total Earnings
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 block">
                  ${selectedAgent.revenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-2.5 p-4 rounded-xl bg-secondary/20 border border-border/40">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Verification Date</span>
                <span className="font-bold text-foreground">
                  {new Date(selectedAgent.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Account Status</span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                    selectedAgent.status === "active"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {selectedAgent.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Close Profile
              </button>
              <button
                onClick={() => {
                  setProfileModalOpen(false);
                  handleViewProducts(selectedAgent.fullName);
                }}
                className="btn-gradient text-xs px-4 py-2 rounded-xl font-bold"
              >
                View Inventory
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
