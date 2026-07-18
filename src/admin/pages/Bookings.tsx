import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  XCircle,
  CheckCircle,
  RotateCcw,
  Calendar,
  User,
  Package,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Modal } from "../components/layout/Modal";
import { Loader } from "../components/layout/Loader";
import { bookingsService } from "../services/bookings";
import { AdminBooking } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsService.getBookings();
      setBookings(data);
    } catch {
      toast.error("Failed to load bookings list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const updated = await bookingsService.cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (selectedBooking?.id === id) setSelectedBooking(updated);
      toast.warning("Booking has been cancelled.");
    } catch {
      toast.error("Failed to cancel booking.");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const updated = await bookingsService.completeBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (selectedBooking?.id === id) setSelectedBooking(updated);
      toast.success("Booking marked as completed.");
    } catch {
      toast.error("Failed to complete booking.");
    }
  };

  const handleRefund = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to refund this booking? This will cancel the booking as well.",
      )
    )
      return;
    try {
      const updated = await bookingsService.refundBooking(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      if (selectedBooking?.id === id) setSelectedBooking(updated);
      toast.success("Refund processed successfully!");
    } catch {
      toast.error("Failed to process refund.");
    }
  };

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.productTitle.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
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
  }, [bookings, search, statusFilter, sortKey, sortOrder]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const columns: Column<AdminBooking>[] = [
    {
      key: "id",
      label: "Booking ID",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.id}</span>,
    },
    {
      key: "productTitle",
      label: "Product",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.productImage}
            alt={row.productTitle}
            className="h-8 w-10 rounded-md object-cover border"
          />
          <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
            {row.productTitle}
          </span>
        </div>
      ),
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.customerName}</span>,
    },
    {
      key: "ownerName",
      label: "Lender",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.ownerName}</span>,
    },
    {
      key: "startDate",
      label: "Rental Period",
      render: (row) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {row.startDate} to {row.endDate}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Total Amount",
      sortable: true,
      render: (row) => <span className="text-xs font-extrabold text-primary">₹{row.amount}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none",
            row.status === "completed" && "bg-green-500/10 text-green-600 dark:text-green-400",
            row.status === "active" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            row.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            row.status === "cancelled" && "bg-red-500/10 text-red-600 dark:text-red-400",
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedBooking(row);
              setViewModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/65 transition-all"
            title="Inspect booking"
          >
            <Eye className="h-4 w-4" />
          </button>

          {row.status === "pending" && (
            <button
              onClick={() => handleCancel(row.id)}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
              title="Cancel Booking"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}

          {row.status === "active" && (
            <>
              <button
                onClick={() => handleComplete(row.id)}
                className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all"
                title="Mark Completed"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRefund(row.id)}
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                title="Refund & Cancel"
              >
                <RotateCcw className="h-4 w-4" />
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
        <h1 className="text-xl font-bold text-foreground">Rental Bookings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Moderate active lease schedules, override booking statuses, and process refunds.
        </p>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, item name, client or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status selection */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active Rentals</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled/Refunded</option>
        </select>
      </div>

      {/* Grid table */}
      {loading ? (
        <Loader message="Loading rentals register..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedBookings}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No bookings found"
            emptyDescription="Try revising search criteria or filters."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBookings.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}

      {/* DETAILED BOOKING MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Rental Agreement Summary"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Header Product description */}
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <img
                src={selectedBooking.productImage}
                alt=""
                className="h-12 w-16 rounded-xl object-cover border"
              />
              <div>
                <span className="text-xs text-primary font-bold">Booking Details</span>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedBooking.productTitle}
                </h4>
              </div>
            </div>

            {/* Specific values grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground font-semibold">Booking ID</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-semibold">Product ID</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.productId}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Customer (Renter)</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.customerName}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Lender (Agent)</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.ownerName}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Rental Start Date</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.startDate}</p>
              </div>
              <div className="border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold">Rental End Date</span>
                <p className="font-bold text-foreground mt-0.5">{selectedBooking.endDate}</p>
              </div>
              <div className="border-t border-border/40 pt-3 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground font-semibold">Lease State</span>
                  <p className="mt-0.5">
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                        selectedBooking.status === "completed" && "bg-green-500/10 text-green-600",
                        selectedBooking.status === "active" && "bg-blue-500/10 text-blue-600",
                        selectedBooking.status === "pending" && "bg-amber-500/10 text-amber-600",
                        selectedBooking.status === "cancelled" && "bg-red-500/10 text-red-600",
                      )}
                    >
                      {selectedBooking.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground font-semibold">Total Lease Cost</span>
                  <p className="text-sm font-extrabold text-primary mt-0.5">
                    ₹{selectedBooking.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions area inside footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
              <button
                onClick={() => setViewModalOpen(false)}
                className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Close View
              </button>

              {selectedBooking.status === "pending" && (
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleCancel(selectedBooking.id);
                  }}
                  className="bg-destructive text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-destructive/80 transition-colors"
                >
                  Cancel Booking
                </button>
              )}

              {selectedBooking.status === "active" && (
                <>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleRefund(selectedBooking.id);
                    }}
                    className="bg-destructive text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-destructive/80 transition-colors"
                  >
                    Refund & Cancel
                  </button>
                  <button
                    onClick={() => {
                      setViewModalOpen(false);
                      handleComplete(selectedBooking.id);
                    }}
                    className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-500 transition-colors"
                  >
                    Complete Booking
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
