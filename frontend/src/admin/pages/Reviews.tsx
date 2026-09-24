import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Trash2,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { notificationsService } from "../services/notifications";
import { AdminReview } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Reviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
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

  const fetchReviews = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await notificationsService.getReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load customer feedback & reviews.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleToggleHide = async (id: string) => {
    try {
      const updated = await notificationsService.toggleHideReview(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.info(updated.hidden ? "Review comment hidden from public catalog." : "Review comment published.");
    } catch {
      toast.error("Failed to toggle visibility status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer review?")) return;
    try {
      await notificationsService.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted permanently.");
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.comment && r.comment.toLowerCase().includes(q)) ||
          (r.productTitle && r.productTitle.toLowerCase().includes(q)) ||
          (r.userName && r.userName.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      const isHidden = statusFilter === "hidden" || statusFilter === "flagged";
      result = result.filter((r) => r.hidden === isHidden);
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
  }, [reviews, search, statusFilter, sortKey, sortOrder]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReviews.slice(start, start + itemsPerPage);
  }, [filteredReviews, currentPage, itemsPerPage]);

  const columns: Column<AdminReview>[] = [
    {
      key: "userName",
      label: "Customer / Renter",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-secondary border border-border/80 flex items-center justify-center font-bold text-xs text-foreground overflow-hidden shrink-0">
            {row.userAvatar ? (
              <img src={row.userAvatar} alt={row.userName} className="h-full w-full object-cover" />
            ) : (
              <span>{(row.userName || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="font-bold text-foreground text-xs truncate">{row.userName || "Verified Renter"}</span>
        </div>
      ),
    },
    {
      key: "productTitle",
      label: "Gear Item",
      render: (row) => (
        <span className="font-semibold text-foreground text-xs truncate max-w-xs block">
          {row.productTitle}
        </span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 font-mono font-bold text-amber-500 text-xs">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span>{row.rating || 5}</span>
        </div>
      ),
    },
    {
      key: "comment",
      label: "Review Feedback",
      render: (row) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-md leading-relaxed">
          {row.comment}
        </p>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border",
            row.hidden
              ? "bg-secondary text-muted-foreground border-border/70"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          )}
        >
          {row.hidden ? "Hidden" : "Published"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
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
            onClick={() => handleToggleHide(row.id)}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={row.hidden ? "Publish review" : "Hide review"}
          >
            {row.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-[#FF1744] transition-colors cursor-pointer"
            title="Delete review"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Reviews
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Customer feedback moderation, verified ratings, and catalog reviews
          </p>
        </div>

        <button
          onClick={() => fetchReviews()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews by user, product, or comment..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-card text-foreground text-xs rounded-lg pl-9 pr-3 py-2 border border-border/70 focus:outline-none focus:border-foreground/40 font-medium placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center p-0.5 bg-secondary/60 rounded-lg border border-border/60 text-xs font-medium">
          {["all", "published", "hidden"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={cn(
                "px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer text-xs",
                statusFilter === st
                  ? "bg-background text-foreground shadow-2xs font-semibold"
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
        <div className="bg-card rounded-xl border border-red-500/20 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#FF1744] flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Database Sync Failed</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchReviews()}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors border border-border/80 cursor-pointer"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : (
        /* TABLE */
        <div className="space-y-4">
          <Table
            columns={columns}
            data={paginatedReviews}
            loading={loading}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyTitle="No reviews found"
            emptyDescription="No customer feedback entries match your current filter settings."
          />

          {filteredReviews.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReviews.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
