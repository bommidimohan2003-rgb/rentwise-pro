import { useEffect, useState, useMemo } from "react";
import { Search, Trash2, Eye, EyeOff, Star, Trash } from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Loader } from "../components/layout/Loader";
import { notificationsService } from "../services/notifications";
import { AdminReview } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Reviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getReviews();
      setReviews(data);
    } catch {
      toast.error("Failed to load reviews catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

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
      toast.info(
        updated.hidden ? "Review comment hidden from public catalog." : "Review comment visible.",
      );
    } catch {
      toast.error("Failed to toggle visibility status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
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
          r.comment.toLowerCase().includes(q) ||
          r.productTitle.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      const isHidden = statusFilter === "hidden";
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const columns: Column<AdminReview>[] = [
    {
      key: "productTitle",
      label: "Listed Product",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-foreground">{row.productTitle}</span>
      ),
    },
    {
      key: "userName",
      label: "Customer Name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.userAvatar}
            alt=""
            className="h-6 w-6 rounded-full object-cover border shrink-0"
          />
          <span className="text-xs font-bold text-foreground truncate">{row.userName}</span>
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < row.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30",
              )}
            />
          ))}
        </div>
      ),
    },
    {
      key: "comment",
      label: "Comment Feed",
      render: (row) => (
        <p
          className="text-xs font-semibold text-muted-foreground max-w-sm truncate leading-normal"
          title={row.comment}
        >
          {row.comment}
        </p>
      ),
    },
    {
      key: "createdAt",
      label: "Posted Date",
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
            onClick={() => handleToggleHide(row.id)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              row.hidden
                ? "text-red-500 hover:bg-red-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
            title={row.hidden ? "Show Review" : "Hide Review"}
          >
            {row.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete Review"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Reviews Moderation</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audit customer rental feedbacks, filter star evaluations, and moderate listing visibility.
        </p>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews by comment keywords, listing, or user..."
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
          <option value="all">All Reviews</option>
          <option value="visible">Visible Reviews</option>
          <option value="hidden">Hidden Reviews</option>
        </select>
      </div>

      {/* Table grid */}
      {loading ? (
        <Loader message="Gathering client comments..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedReviews}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No reviews found"
            emptyDescription="Try revising search query or status criteria."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredReviews.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}
    </div>
  );
}
