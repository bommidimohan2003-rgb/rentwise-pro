import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Star,
  Eye,
  EyeOff,
  Package,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { productsService } from "../services/products";
import { bookingsService } from "../services/bookings";
import { AdminProduct, AdminBooking } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminProductImage } from "../components/common/AdminProductImage";

export default function ProductDetails() {
  const { id } = useParams({ from: "/admin/products/$id" }) as { id: string };
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const navigate = useNavigate();

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [prodData, bookData] = await Promise.all([
        productsService.getProductById(id),
        bookingsService.getBookings(),
      ]);

      setProduct(prodData);
      setActiveImage(prodData.image);

      // Filter bookings for this product
      const productBookings = bookData.filter((b) => b.productId === id);
      setBookings(productBookings);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load listing inspector.");
      navigate({ to: "/admin/products" });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleApprove = async () => {
    if (!product) return;
    try {
      const updated = await productsService.approveProduct(product.id);
      setProduct(updated);
      toast.success("Listing approved.");
    } catch {
      toast.error("Failed to approve listing.");
    }
  };

  const handleReject = async () => {
    if (!product) return;
    try {
      const updated = await productsService.rejectProduct(product.id);
      setProduct(updated);
      toast.warning("Listing rejected.");
    } catch {
      toast.error("Failed to reject listing.");
    }
  };

  const handleToggleHide = async () => {
    if (!product) return;
    try {
      const updated = await productsService.toggleHideProduct(product.id);
      setProduct(updated);
      toast.info(updated.hidden ? "Listing hidden." : "Listing visible.");
    } catch {
      toast.error("Failed to toggle visibility.");
    }
  };

  const handleToggleFeature = async () => {
    if (!product) return;
    try {
      const updated = await productsService.toggleFeatureProduct(product.id);
      setProduct(updated);
      toast.success(
        updated.featured
          ? "Listing featured."
          : "Listing removed from featured."
      );
    } catch {
      toast.error("Failed to toggle featured.");
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader message="Parsing catalog database..." size="lg" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-lg bg-card border border-border/70 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground font-display truncate max-w-sm sm:max-w-md">
                {product.title}
              </h1>
              <span
                className={cn(
                  "text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded select-none border",
                  product.status === "approved" &&
                    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                  product.status === "pending" &&
                    "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  product.status === "rejected" &&
                    "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20"
                )}
              >
                {product.status}
              </span>
              {product.featured && (
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Featured
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              Product ID: {product.id} • Category: {product.category}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {product.status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve Listing</span>
              </button>
              <button
                onClick={handleReject}
                className="bg-[#FF1744]/10 hover:bg-[#FF1744]/20 text-[#FF1744] border border-[#FF1744]/30 text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}

          <button
            onClick={handleToggleFeature}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer",
              product.featured
                ? "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                : "bg-card hover:bg-secondary text-foreground border-border/70"
            )}
          >
            {product.featured ? "Featured" : "Mark Featured"}
          </button>

          <button
            onClick={handleToggleHide}
            className={cn(
              "text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer",
              product.hidden
                ? "bg-secondary border-border/70 text-muted-foreground hover:text-foreground"
                : "bg-card hover:bg-secondary text-foreground border-border/70"
            )}
          >
            {product.hidden ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
                <span>Unhide</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Hide</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Details Body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Media, Specs, & Rental History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Frame */}
          <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-3">
            <div className="h-80 sm:h-96 w-full rounded-lg overflow-hidden bg-secondary flex items-center justify-center border border-border/50">
              <AdminProductImage
                src={activeImage}
                alt={product.title}
                className="h-full w-full object-contain bg-black/5 dark:bg-black/40"
                iconClassName="h-12 w-12"
              />
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "h-16 w-20 rounded-md overflow-hidden border transition-all shrink-0 cursor-pointer",
                      activeImage === img
                        ? "border-emerald-500 ring-1 ring-emerald-500/50"
                        : "border-border/70 opacity-70 hover:opacity-100"
                    )}
                  >
                    <AdminProductImage
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Description */}
          <div className="p-5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">Equipment Description</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description || "No specific operational description provided by the lender for this equipment."}
            </p>
          </div>

          {/* Rental history */}
          <div className="p-5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <h3 className="text-sm font-semibold text-foreground">Rental Lease History</h3>
              <span className="text-[11px] font-mono text-muted-foreground">{bookings.length} total orders</span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Renter</th>
                    <th className="py-2 px-3">Dates</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-foreground">
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground text-xs"
                      >
                        This gear has not been rented out yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-foreground">{b.id}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{b.customerName}</td>
                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                          {b.startDate} → {b.endDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                          ₹{b.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border",
                              b.status === "completed" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                              b.status === "active" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                              b.status === "pending" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                              b.status === "cancelled" && "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20"
                            )}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Specs & Lender info */}
        <div className="space-y-6">
          {/* Details specs */}
          <div className="p-5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2.5">
              Specifications & Terms
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily Rental Rate</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  ₹{product.price.toLocaleString()}/day
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold text-foreground">
                  {product.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Availability</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      product.available ? "bg-emerald-500" : "bg-[#FF1744]"
                    )}
                  />
                  <span className="font-semibold text-foreground">
                    {product.available ? "Live / Instant Rent" : "Reserved / Paused"}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date Listed</span>
                <span className="font-mono text-muted-foreground">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Owner details */}
          <div className="p-5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2.5">
              Lender Information
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-secondary border border-border/70 flex items-center justify-center font-bold text-foreground overflow-hidden shrink-0">
                {product.owner.avatar ? (
                  <img
                    src={product.owner.avatar}
                    alt={product.owner.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{product.owner.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {product.owner.name}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground truncate">
                  {product.owner.email}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-mono font-semibold text-foreground">
                    {product.owner.rating.toFixed(1)} Lender Score
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 flex justify-end">
              <Link
                to="/admin/agents"
                className="text-[11px] font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                <span>View Lender Fleet</span>
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
          </div>

          {/* Verification documents */}
          {product.documents && product.documents.length > 0 && (
            <div className="p-5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2.5">
                Compliance & Invoices
              </h3>
              <div className="space-y-2">
                {product.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border/50 text-xs"
                  >
                    <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-medium text-foreground truncate">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
