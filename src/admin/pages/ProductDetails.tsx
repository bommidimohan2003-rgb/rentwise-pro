import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Star,
  User,
  Shield,
  Eye,
  EyeOff,
  Calendar,
  Lock,
} from "lucide-react";
import { productsService } from "../services/products";
import { bookingsService } from "../services/bookings";
import { AdminProduct, AdminBooking, AdminReview } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      toast.success(updated.featured ? "Listing featured." : "Listing removed from featured.");
    } catch {
      toast.error("Failed to toggle featured.");
    }
  };

  if (loading) {
    return <Loader message="Parsing catalog database..." size="lg" />;
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-card border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-foreground truncate max-w-sm sm:max-w-md">
                {product.title}
              </h1>
              <span
                className={cn(
                  "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none",
                  product.status === "approved" &&
                    "bg-green-500/10 text-green-600 dark:text-green-400",
                  product.status === "pending" &&
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  product.status === "rejected" && "bg-red-500/10 text-red-600 dark:text-red-400",
                )}
              >
                {product.status}
              </span>
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Product ID: {product.id}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {product.status === "pending" && (
            <>
              <button
                onClick={handleApprove}
                className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-green-500 transition-colors shadow-xs"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={handleReject}
                className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-red-500 transition-colors shadow-xs"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </>
          )}

          <button
            onClick={handleToggleFeature}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-xl border transition-colors",
              product.featured
                ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                : "bg-card hover:bg-secondary text-foreground/80 border-border/80",
            )}
          >
            {product.featured ? "Featured" : "Feature"}
          </button>

          <button
            onClick={handleToggleHide}
            className={cn(
              "text-xs font-bold px-4 py-2 rounded-xl border flex items-center gap-1.5 transition-colors",
              product.hidden
                ? "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/25"
                : "bg-card hover:bg-secondary text-foreground/80 border-border/80",
            )}
          >
            {product.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{product.hidden ? "Hidden" : "Hide"}</span>
          </button>
        </div>
      </div>

      {/* Main Details Body split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Media & Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Frame */}
          <div className="card-premium bg-card/60 p-4 space-y-3">
            <div className="h-96 w-full rounded-xl overflow-hidden bg-secondary">
              <img src={activeImage} alt={product.title} className="h-full w-full object-cover" />
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "h-16 w-20 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                      activeImage === img
                        ? "border-primary"
                        : "border-transparent opacity-75 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Verification documents */}
          <div className="card-premium bg-card/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              Verification & Insurance Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info(`Downloading placeholder: ${doc}`);
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/35 border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group"
                >
                  <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">{doc}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Click to preview document
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Rental history */}
          <div className="card-premium bg-card/60 p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Rental History</h3>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full border-collapse text-left text-xs font-medium">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground font-bold">
                    <th className="py-2.5">Booking ID</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5">Rental Period</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-foreground/90">
                  {bookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground font-semibold"
                      >
                        This item hasn't been rented yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3 font-bold">{b.id}</td>
                        <td className="py-3 font-bold">{b.customerName}</td>
                        <td className="py-3 text-muted-foreground">
                          {b.startDate} to {b.endDate}
                        </td>
                        <td className="py-3 font-extrabold text-primary">₹{b.amount}</td>
                        <td className="py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                              b.status === "completed" &&
                                "bg-green-500/10 text-green-600 dark:text-green-400",
                              b.status === "active" &&
                                "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                              b.status === "pending" &&
                                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                              b.status === "cancelled" &&
                                "bg-red-500/10 text-red-600 dark:text-red-400",
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

        {/* Right 1 Col: Info Specs & Lender */}
        <div className="space-y-6">
          {/* Details specs */}
          <div className="card-premium bg-card/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Specifications</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Price per Day</span>
                <span className="font-extrabold text-primary text-sm">₹{product.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Category</span>
                <span className="font-bold text-foreground">{product.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Availability</span>
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      product.available ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span className="font-bold text-foreground">
                    {product.available ? "Instant Rent" : "Unavailable"}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">Listed Date</span>
                <span className="font-bold text-foreground">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col border-t border-border/40 pt-3">
                <span className="text-muted-foreground font-semibold mb-1">Item Description</span>
                <p className="text-[11px] font-semibold text-foreground/90 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Owner details */}
          <div className="card-premium bg-card/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Lender Information</h3>
            <div className="flex items-center gap-3">
              <img
                src={product.owner.avatar}
                alt={product.owner.name}
                className="h-12 w-12 rounded-full object-cover border border-primary/20"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {product.owner.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {product.owner.email}
                </span>
                <div className="flex items-center gap-1.5 mt-1 bg-secondary py-0.5 px-2 rounded-full w-fit">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-foreground">
                    {product.owner.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/40 flex justify-end">
              <Link
                to="/admin/agents"
                className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <span>View Lender Stats</span>
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
