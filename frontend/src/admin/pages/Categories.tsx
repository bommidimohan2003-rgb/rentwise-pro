import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Grid,
  RefreshCw,
  X,
  Package,
  ShieldAlert,
} from "lucide-react";
import { productsService } from "../services/products";
import { AdminCategory } from "../services/api";
import { Table, Column } from "../components/layout/Table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Categories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<AdminCategory | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Camera");
  const [color, setColor] = useState("bg-secondary text-foreground border border-border");
  const [submitting, setSubmitting] = useState(false);

  const fetchCats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load gear categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const created = await productsService.createCategory({
        name: name.trim(),
        icon,
        color,
      });
      setCategories((prev) => [...prev, created]);
      setCreateModalOpen(false);
      setName("");
      toast.success("Category created successfully.");
    } catch {
      toast.error("Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setSelectedCat(cat);
    setName(cat.name);
    setIcon(cat.icon || "Camera");
    setColor(cat.color || "bg-secondary text-foreground border border-border");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !name.trim()) return;

    try {
      setSubmitting(true);
      const updated = await productsService.updateCategory(selectedCat.id, {
        name: name.trim(),
        icon,
        color,
      });
      setCategories((prev) => prev.map((c) => (c.id === selectedCat.id ? { ...c, ...updated } : c)));
      setEditModalOpen(false);
      setSelectedCat(null);
      setName("");
      toast.success("Category updated.");
    } catch {
      toast.error("Failed to update category.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (cat.count && cat.count > 0) {
      alert(`Cannot delete category '${cat.name}' because ${cat.count} active gear items depend on it. Reassign items first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete category '${cat.name}'?`)) return;

    try {
      await productsService.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success("Category removed.");
    } catch {
      toast.error("Failed to remove category.");
    }
  };

  const columns: Column<AdminCategory>[] = [
    {
      key: "name",
      label: "Category Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-foreground border border-border/60">
            <Grid className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-foreground text-xs">{row.name}</div>
            <div className="text-[10px] text-muted-foreground font-mono">ID: {row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "count",
      label: "Indexed Equipment",
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.count || 0} gear listings
        </span>
      ),
    },
    {
      key: "enabled",
      label: "Visibility",
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Enabled
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
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
            title="Edit category"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer"
            title="Delete category"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
            Categories & Taxonomy
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organize catalog taxonomy, inspect product counts, and manage marketplace gear hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setName("");
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Category</span>
          </button>

          <button
            onClick={fetchCats}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all cursor-pointer"
            title="Refresh categories"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
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
            onClick={fetchCats}
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
            data={categories}
            loading={loading}
            emptyMessage="No categories found."
          />
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-sm font-bold text-foreground">Create New Category</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cinema Lenses, Drone Fleets..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && selectedCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-sm font-bold text-foreground">Edit Category</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
