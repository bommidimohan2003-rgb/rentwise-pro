import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  EyeOff,
  ShieldCheck,
  Heart,
  LayoutGrid,
  List,
} from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Loader } from "../components/layout/Loader";
import { productsService } from "../services/products";
import { AdminProduct } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";

export default function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters from router search query if available
  const routerSearch = useSearch({ from: "/admin/products" }) as { search?: string };
  const [search, setSearch] = useState(routerSearch?.search || "");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // View state: grid vs list
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Sorting
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const updated = await productsService.approveProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success("Listing request approved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve listing.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const updated = await productsService.rejectProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.warning("Listing request rejected.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject listing.");
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      const updated = await productsService.toggleFeatureProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success(
        updated.featured ? "Product featured on homepage." : "Product removed from features.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update feature state.");
    }
  };

  const handleToggleHide = async (id: string) => {
    try {
      const updated = await productsService.toggleHideProduct(id);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.info(updated.hidden ? "Product hidden from catalog." : "Product visible in catalog.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update visibility state.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;
    try {
      await productsService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Listing deleted successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete listing.");
    }
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.owner.name.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
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
  }, [products, search, categoryFilter, statusFilter, sortKey, sortOrder]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  // Extract unique categories for dropdown filter
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set);
  }, [products]);

  const columns: Column<AdminProduct>[] = [
    {
      key: "title",
      label: "Product listing",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.image}
            alt={row.title}
            className="h-10 w-12 rounded-lg object-cover border border-border shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-foreground truncate">{row.title}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Lender / Agent",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <img
            src={row.owner.avatar}
            alt={row.owner.name}
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-xs font-bold text-foreground truncate">{row.owner.name}</span>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price (Day)",
      sortable: true,
      render: (row) => <span className="text-xs font-extrabold text-primary">₹{row.price}</span>,
    },
    {
      key: "status",
      label: "Approval Status",
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            "inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none",
            row.status === "approved" && "bg-green-500/10 text-green-600 dark:text-green-400",
            row.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            row.status === "rejected" && "bg-red-500/10 text-red-600 dark:text-red-400",
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Uploaded Date",
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
            onClick={() => navigate({ to: "/admin/products/$id", params: { id: row.id } })}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>

          {row.status === "pending" && (
            <>
              <button
                onClick={() => handleApprove(row.id)}
                className="p-1.5 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all"
                title="Approve listing"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleReject(row.id)}
                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                title="Reject listing"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}

          <button
            onClick={() => handleToggleFeature(row.id)}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              row.featured
                ? "text-amber-500 hover:bg-amber-500/10"
                : "text-muted-foreground hover:text-amber-500 hover:bg-secondary/40",
            )}
            title={row.featured ? "Remove from featured" : "Feature listing"}
          >
            <Heart className={cn("h-4 w-4", row.featured && "fill-amber-500")} />
          </button>

          <button
            onClick={() => handleToggleHide}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              row.hidden
                ? "text-red-500 hover:bg-red-500/10"
                : "text-muted-foreground hover:text-red-500 hover:bg-secondary/40",
            )}
            onClickCapture={() => handleToggleHide(row.id)}
            title={row.hidden ? "Unhide from catalog" : "Hide from catalog"}
          >
            <EyeOff className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title="Delete permanently"
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
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Product Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Approve lender listings, regulate feature highlights, and audit insurance validation
            papers.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground",
              viewMode === "list" && "bg-card text-foreground shadow-xs",
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground",
              viewMode === "grid" && "bg-card text-foreground shadow-xs",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Query Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, owner, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Category dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Review</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Products list body */}
      {loading ? (
        <Loader message="Fetching product listings..." />
      ) : viewMode === "list" ? (
        <>
          <Table
            columns={columns}
            data={paginatedProducts}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No listings found"
            emptyDescription="Try modifying filters or loading new requests."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      ) : (
        /* Grid layout */
        <div className="space-y-6">
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground bg-card/45 border rounded-2xl">
              No products found matching filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {paginatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="card-premium bg-card/60 flex flex-col h-[380px] overflow-hidden relative group/card"
                >
                  {/* Status absolute badge */}
                  <span
                    className={cn(
                      "absolute top-3 left-3 z-10 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none",
                      p.status === "approved" && "bg-green-500/90 text-white",
                      p.status === "pending" && "bg-amber-500/90 text-white",
                      p.status === "rejected" && "bg-red-500/90 text-white",
                    )}
                  >
                    {p.status}
                  </span>

                  {/* Image cover */}
                  <div className="h-44 w-full relative overflow-hidden bg-secondary">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover/card:scale-105 transition-all duration-300"
                    />
                  </div>

                  {/* Content body */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-h-0">
                    <div className="min-h-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-primary uppercase">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="font-bold">{p.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate mt-1">{p.title}</h4>
                      <p className="text-[11px] font-semibold text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between mt-3 shrink-0">
                      <span className="text-xs font-extrabold text-primary">₹{p.price}/day</span>
                      <button
                        onClick={() =>
                          navigate({ to: "/admin/products/$id", params: { id: p.id } })
                        }
                        className="btn-gradient text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
export function ProductsSearchRoute() {
  const search = useSearch({ from: "/admin/products" });
  return <Products />;
}
