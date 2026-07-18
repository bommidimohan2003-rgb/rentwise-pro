import { useEffect, useState, useMemo } from "react";
import { Search, ShieldAlert, CheckCircle, XCircle, UserX, AlertTriangle, Eye } from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Modal } from "../components/layout/Modal";
import { Loader } from "../components/layout/Loader";
import { notificationsService } from "../services/notifications";
import { AdminReport } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getReports();
      setReports(data);
    } catch {
      toast.error("Failed to load reports catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const updated = await notificationsService.resolveReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReport?.id === id) setSelectedReport(updated);
      toast.success("Dispute resolved successfully.");
    } catch {
      toast.error("Failed to resolve dispute.");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const updated = await notificationsService.dismissReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReport?.id === id) setSelectedReport(updated);
      toast.info("Report request dismissed.");
    } catch {
      toast.error("Failed to dismiss report.");
    }
  };

  const handleSuspendProduct = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to suspend this reported product? This will reject the listing.",
      )
    )
      return;
    try {
      const updated = await notificationsService.suspendProductReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReport?.id === id) setSelectedReport(updated);
      toast.success("Product listing suspended successfully.");
    } catch {
      toast.error("Failed to suspend product.");
    }
  };

  const handleBanUser = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to ban the owner of this product? This will suspend their user account.",
      )
    )
      return;
    try {
      const updated = await notificationsService.banUserReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReport?.id === id) setSelectedReport(updated);
      toast.success("Listing owner has been banned.");
    } catch {
      toast.error("Failed to ban owner.");
    }
  };

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.productTitle.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
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
  }, [reports, search, statusFilter, sortKey, sortOrder]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const columns: Column<AdminReport>[] = [
    {
      key: "productTitle",
      label: "Reported Item",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-foreground">{row.productTitle}</span>
      ),
    },
    {
      key: "reason",
      label: "Dispute Reason",
      render: (row) => (
        <p
          className="text-xs font-semibold text-muted-foreground truncate max-w-xs"
          title={row.reason}
        >
          {row.reason}
        </p>
      ),
    },
    {
      key: "reporterName",
      label: "Reporter",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.reporterName}</span>,
    },
    {
      key: "ownerName",
      label: "Listing Owner",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.ownerName}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none",
            row.status === "open" &&
              "bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse",
            row.status === "resolved" && "bg-green-500/10 text-green-600 dark:text-green-400",
            row.status === "dismissed" && "bg-muted text-muted-foreground",
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Filed Date",
      sortable: true,
      render: (row) => (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
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
              setSelectedReport(row);
              setViewModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/65 transition-all"
            title="Inspect claim"
          >
            <Eye className="h-4 w-4" />
          </button>

          {row.status === "open" && (
            <>
              <button
                onClick={() => handleDismiss(row.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/65 transition-all"
                title="Dismiss Report"
              >
                <XCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleResolve(row.id)}
                className="p-1.5 rounded-lg text-green-600 hover:bg-green-500/10 transition-all"
                title="Mark Resolved"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Flagged Listings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Moderate catalog disputes, inspect evidence claims, and override user/product statuses.
        </p>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports by reason, product title, reporter, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Claims</option>
          <option value="open">Open Disputes</option>
          <option value="resolved">Resolved Disputes</option>
          <option value="dismissed">Dismissed Disputes</option>
        </select>
      </div>

      {/* Table grid */}
      {loading ? (
        <Loader message="Gathering claims ledger..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedReports}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No claims reported"
            emptyDescription="Try clearing filters or checking other logs."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredReports.length}
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
        title="Audit Moderation Claim"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-destructive font-bold">Reported Listing:</span>
                <h4 className="text-sm font-bold text-foreground">{selectedReport.productTitle}</h4>
              </div>
            </div>

            {/* Claims details */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground font-semibold">Filed by (Reporter)</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold">Owner of Listing</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedReport.ownerName}</p>
                </div>
              </div>

              <div className="flex flex-col border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Dispute Reason</span>
                <p className="font-bold text-foreground/95 mt-1 leading-normal">
                  {selectedReport.reason}
                </p>
              </div>

              {selectedReport.evidence && (
                <div className="flex flex-col border-t border-border/40 pt-3">
                  <span className="text-muted-foreground font-semibold">
                    Reporter Evidence / Description
                  </span>
                  <p className="font-bold text-foreground/95 mt-1 leading-normal">
                    {selectedReport.evidence}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Status of Claim</span>
                <span
                  className={cn(
                    "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                    selectedReport.status === "open" && "bg-amber-500/10 text-amber-600",
                    selectedReport.status === "resolved" && "bg-green-500/10 text-green-600",
                    selectedReport.status === "dismissed" && "bg-muted text-muted-foreground",
                  )}
                >
                  {selectedReport.status}
                </span>
              </div>
            </div>

            {/* Actions list */}
            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-border/50">
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Close View
              </button>

              {selectedReport.status === "open" && (
                <>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleDismiss(selectedReport.id);
                    }}
                    className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    Dismiss Report
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleSuspendProduct(selectedReport.id);
                    }}
                    className="bg-destructive/10 text-destructive text-xs font-bold px-4 py-2 rounded-xl hover:bg-destructive/25 transition-colors border border-destructive/20"
                  >
                    Block listing
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleBanUser(selectedReport.id);
                    }}
                    className="bg-destructive text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-destructive/80 transition-colors"
                  >
                    Ban Owner
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleResolve(selectedReport.id);
                    }}
                    className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-500 transition-colors"
                  >
                    Resolve Dispute
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
