import { useEffect, useState, useMemo } from "react";
import { Search, Eye, RotateCcw, Download, CreditCard } from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Modal } from "../components/layout/Modal";
import { Loader } from "../components/layout/Loader";
import { paymentsService } from "../services/payments";
import { AdminPayment } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Payments() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentsService.getPayments();
      setPayments(data);
    } catch {
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm("Are you sure you want to issue a refund for this transaction?")) return;
    try {
      const updated = await paymentsService.refundPayment(id);
      setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (selectedPayment?.id === id) setSelectedPayment(updated);
      toast.success("Transaction refunded successfully.");
    } catch {
      toast.error("Failed to refund transaction.");
    }
  };

  const handleDownloadInvoice = (id: string) => {
    toast.info(`Generating receipt copy for Invoice ${id}...`);
    // Simulated receipt download
    const link = document.createElement("a");
    link.href = "#";
    link.download = `Payent_Invoice_${id}.pdf`;
    toast.success(`Invoice receipt Payent_Invoice_${id}.pdf downloaded!`);
  };

  const filteredPayments = useMemo(() => {
    let result = [...payments];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          p.method.toLowerCase().includes(q),
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const columns: Column<AdminPayment>[] = [
    {
      key: "id",
      label: "Payment ID",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.id}</span>,
    },
    {
      key: "customerName",
      label: "Customer / Renter",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.customerName}</span>,
    },
    {
      key: "amount",
      label: "Charged Amount",
      sortable: true,
      render: (row) => <span className="text-xs font-extrabold text-primary">${row.amount}</span>,
    },
    {
      key: "method",
      label: "Gateway Method",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-muted-foreground">{row.method}</span>
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
            row.status === "successful" && "bg-green-500/10 text-green-600 dark:text-green-400",
            row.status === "refunded" && "bg-red-500/10 text-red-600 dark:text-red-400",
            row.status === "failed" && "bg-muted text-muted-foreground",
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Processed Date",
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
              setSelectedPayment(row);
              setDetailsModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/65 transition-all"
            title="Inspect transaction"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleDownloadInvoice(row.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            title="Download Invoice"
          >
            <Download className="h-4 w-4" />
          </button>

          {row.status === "successful" && (
            <button
              onClick={() => handleRefund(row.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
              title="Issue Payout Refund"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
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
        <h1 className="text-xl font-bold text-foreground">Transactions Register</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audit customer payment events, issue payouts, track stripe/paypal statuses, and download
          invoice archives.
        </p>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Payment ID, customer name, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status select dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Statuses</option>
          <option value="successful">Successful Transactions</option>
          <option value="refunded">Refunded Transactions</option>
          <option value="failed">Failed/Declined</option>
        </select>
      </div>

      {/* Table grid */}
      {loading ? (
        <Loader message="Gathering ledger logs..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedPayments}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No transactions cataloged"
            emptyDescription="Try clearing filters or queries."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPayments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* DETAILED TRANSACTION MODAL */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Audit Transaction details"
      >
        {selectedPayment && (
          <div className="space-y-6">
            {/* Header description */}
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-primary font-bold">Transaction Record</span>
                <h4 className="text-sm font-bold text-foreground">
                  Charged to {selectedPayment.customerName}
                </h4>
              </div>
            </div>

            {/* Content specifications */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Payment ID</span>
                <p className="font-bold text-foreground mt-0.5">{selectedPayment.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Booking ID</span>
                <p className="font-bold text-foreground mt-0.5">{selectedPayment.bookingId}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Billing Method</span>
                <p className="font-bold text-foreground mt-0.5">{selectedPayment.method}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Processed Date</span>
                <p className="font-bold text-foreground mt-0.5">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="border-t border-border/40 pt-3 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground font-semibold">Gateway Status</span>
                  <p className="mt-0.5">
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                        selectedPayment.status === "successful" && "bg-green-500/10 text-green-600",
                        selectedPayment.status === "refunded" && "bg-red-500/10 text-red-600",
                        selectedPayment.status === "failed" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {selectedPayment.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground font-semibold">Billed Total</span>
                  <p className="text-sm font-extrabold text-primary mt-0.5">
                    ${selectedPayment.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer actions buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Close View
              </button>

              <button
                onClick={() => {
                  setDetailsModalOpen(false);
                  handleDownloadInvoice(selectedPayment.id);
                }}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Invoice receipt</span>
              </button>

              {selectedPayment.status === "successful" && (
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleRefund(selectedPayment.id);
                  }}
                  className="bg-destructive text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-destructive/80 transition-colors"
                >
                  Refund Transaction
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
