import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Grid,
  Play,
  Square,
  CircleHelp,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { productsService } from "../services/products";
import { AdminCategory } from "../services/api";
import { Modal } from "../components/layout/Modal";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper to dynamic load lucide icons safely
function IconRenderer({ name, className }: { name: string; className?: string }) {
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  )[name];
  if (!IconComponent) {
    return <CircleHelp className={className} />;
  }
  return <IconComponent className={className} />;
}

export default function Categories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<AdminCategory | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Camera");
  const [color, setColor] = useState("bg-purple-500/10 text-purple-500");

  const fetchCats = async () => {
    try {
      setLoading(true);
      const data = await productsService.getCategories();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const created = await productsService.createCategory({ name, icon, color });
      setCategories((prev) => [...prev, created]);
      setCreateModalOpen(false);
      setName("");
      toast.success("Category created successfully!");
    } catch {
      toast.error("Failed to create category.");
    }
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setSelectedCat(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat) return;

    try {
      const updated = await productsService.updateCategory(selectedCat.id, {
        name,
        icon,
        color,
      });
      setCategories((prev) => prev.map((c) => (c.id === selectedCat.id ? updated : c)));
      setEditModalOpen(false);
      toast.success("Category details updated.");
    } catch {
      toast.error("Failed to save changes.");
    }
  };

  const handleToggleEnable = async (cat: AdminCategory) => {
    try {
      const updated = await productsService.updateCategory(cat.id, {
        enabled: !cat.enabled,
      });
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
      toast.info(updated.enabled ? "Category enabled." : "Category disabled.");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await productsService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted.");
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Category Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure listed tech categories, disable inactive paths, and assign lucide iconography
            styles.
          </p>
        </div>

        <button
          onClick={() => {
            setName("");
            setIcon("Camera");
            setColor("bg-purple-500/10 text-purple-500");
            setCreateModalOpen(true);
          }}
          className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <Loader message="Loading categories configuration..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                "card-premium bg-card/60 p-5 flex items-center justify-between border-l-4 relative overflow-hidden group",
                cat.enabled ? "border-l-primary" : "border-l-muted-foreground opacity-60",
              )}
            >
              {/* Category info */}
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-3 rounded-2xl shrink-0 group-hover:scale-105 transition-transform",
                    cat.color,
                  )}
                >
                  <IconRenderer name={cat.icon} className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {cat.count} listings
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 z-10">
                <button
                  onClick={() => handleToggleEnable(cat)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                  title={cat.enabled ? "Disable Category" : "Enable Category"}
                >
                  {cat.enabled ? (
                    <XCircle className="h-4.5 w-4.5 text-destructive/80" />
                  ) : (
                    <CheckCircle className="h-4.5 w-4.5 text-green-500" />
                  )}
                </button>
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all"
                  title="Edit details"
                >
                  <Edit2 className="h-4.5 w-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-all"
                  title="Delete category"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Category"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-4 text-xs font-semibold">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Category Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Video Consoles"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Icon Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Lucide Icon Class</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                {[
                  "Camera",
                  "Plane",
                  "Laptop",
                  "Mic",
                  "Glasses",
                  "Gamepad",
                  "Monitor",
                  "Headphones",
                  "Speaker",
                  "Tv",
                ].map((ico) => (
                  <option key={ico} value={ico}>
                    {ico}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Color Badge Styling</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="bg-purple-500/10 text-purple-500">Purple Accent</option>
                <option value="bg-blue-500/10 text-blue-500">Blue Accent</option>
                <option value="bg-green-500/10 text-green-500">Green Accent</option>
                <option value="bg-pink-500/10 text-pink-500">Pink Accent</option>
                <option value="bg-orange-500/10 text-orange-500">Orange Accent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="bg-secondary text-foreground text-xs font-semibold px-4 py-2 rounded-xl hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="btn-gradient text-xs px-4 py-2 rounded-xl font-bold">
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modify Category Specs"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="space-y-4 text-xs font-semibold">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Category Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Icon Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Lucide Icon Class</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                {[
                  "Camera",
                  "Plane",
                  "Laptop",
                  "Mic",
                  "Glasses",
                  "Gamepad",
                  "Monitor",
                  "Headphones",
                  "Speaker",
                  "Tv",
                ].map((ico) => (
                  <option key={ico} value={ico}>
                    {ico}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Class */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Color Badge Styling</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="bg-purple-500/10 text-purple-500">Purple Accent</option>
                <option value="bg-blue-500/10 text-blue-500">Blue Accent</option>
                <option value="bg-green-500/10 text-green-500">Green Accent</option>
                <option value="bg-pink-500/10 text-pink-500">Pink Accent</option>
                <option value="bg-orange-500/10 text-orange-500">Orange Accent</option>
              </select>
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
export { IconRenderer };
