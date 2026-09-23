import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Eye,
  RotateCcw,
  Download,
  CreditCard,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { paymentsService } from "../services/payments";
import { AdminPayment } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { adminWS } from "../services/websocket";

export default function Payments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const fetchPayments = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await paymentsService.getPayments();
      setPayments(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load payment transactions.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();

    const unsubCreated = adminWS.subscribe("payment.created", () => {
      fetchPayments(true);
    });
    const unsubRefunded = adminWS.subscribe("payment.refunded", () => {
      fetchPayments(true);
    });

    return () => {
      unsubCreated();
      unsubRefunded();
    };
  }, [fetchPayments]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm(`Are you sure you want to issue a refund for payment #${id}? This will reverse the transaction and cancel the order.`)) return;
    try {
      setRefunding(true);
      const updated = await paymentsService.refundPayment(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated, status: "refunded" } : p)));
      if (selectedPayment?.id === id) {
        setSelectedPayment((prev) => prev ? { ...prev, ...updated, status: "refunded" } : null);
      }
      toast.success(`Payment #${id} refunded.`);
    } catch {
      toast.error("Failed to refund payment.");
    } finally {
      setRefunding(false);
    }
  };

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.id && p.id.toLowerCase().includes(q)) ||
          (p.bookingId && p.bookingId.toLowerCase().includes(q)) ||
          (p.customerName && p.customerName.toLowerCase().includes(q)) ||
          (p.customerId && p.customerId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
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
  }, [payments, search, statusFilter, sortKey, sortOrder]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const columns: Column<AdminPayment>[] = [
    {
      key: "id",
      label: "Payment ID",
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          #{row.id}
        </span>
      ),
    },
    {
      key: "bookingId",
      label: "Order Ref",
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.bookingId}
        </span>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      render: (row) => (
        <div className="min-w-0">
          <div className="font-bold text-foreground truncate text-xs">{row.customerName}</div>
          <div className="text-[10px] text-muted-foreground font-mono truncate">{row.customerId}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          ₹{(row.amount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "method",
      label: "Gateway",
      render: (row) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.method || "Razorpay Verified"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const isSuccess = row.status === "successful" || row.status === "captured";
        const isPending = row.status === "pending";
        const isRefunded = row.status === "refunded";
        const isFailed = row.status === "failed";

        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1",
              isSuccess
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : isPending
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : isRefunded
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                : isFailed
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-secondary text-muted-foreground border-border/60"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {row.status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Timestamp",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
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
            onClick={() => {
              setSelectedPayment(row);
              setModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
            title="Inspect payment transaction"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          {row.status === "successful" && (
            <button
              onClick={() => handleRefund(row.id)}
              disabled={refunding}
              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer"
              title="Issue refund"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
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
            Payments & Reconciliation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative financial transactions, Razorpay escrow verification, and refund management.
          </p>
        </div>

        <button
          onClick={() => fetchPayments()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-secondary border border-border/80 text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payments by ID, order, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-card text-foreground text-xs rounded-xl pl-9 pr-4 py-2 border border-border/80 focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div className="flex items-center p-1 bg-secondary rounded-xl border border-border/60 text-xs font-semibold">
          {["all", "successful", "pending", "failed", "refunded"].map((st) => (
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
      </div>

      {/* ERROR STATE */}
      {error && !loading ? (
        <div className="bg-card rounded-2xl border border-destructive/30 p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground font-display">Database Sync Failed</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          <button
            onClick={() => fetchPayments()}
            className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : (
        /* TABLE */
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
          <Table
            columns={columns}
            data={paginatedPayments}
            loading={loading}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyMessage="No payment transactions found matching the filters."
          />

          {filteredPayments.length > itemsPerPage && (
            <div className="p-4 border-t border-border/40">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredPayments.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredPayments.length}
              />
            </div>
          )}
        </div>
      )}

      {/* PAYMENT DETAIL MODAL */}
      {modalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Payment #{selectedPayment.id}</h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : "—"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Verification Status</span>
                <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-secondary border border-border/60">
                  {selectedPayment.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Order Reference</span>
                <span className="font-mono font-bold">#{selectedPayment.bookingId}</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Customer / Payer</span>
                <span className="font-bold">{selectedPayment.customerName} ({selectedPayment.customerId})</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Gateway Provider</span>
                <span className="font-medium">{selectedPayment.method || "Razorpay Standard"}</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 flex justify-between items-center">
                <span className="text-muted-foreground">Total Transacted</span>
                <span className="font-mono font-black text-sm text-foreground">₹{(selectedPayment.amount || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {selectedPayment.status === "successful" && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  onClick={() => handleRefund(selectedPayment.id)}
                  disabled={refunding}
                  className="px-4 py-2 rounded-xl bg-destructive text-white font-bold text-xs hover:bg-destructive/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {refunding ? "Processing Refund..." : "Issue Verified Refund"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
