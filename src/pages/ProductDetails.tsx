import { useNavigate, useParams } from "@tanstack/react-router";
import { Calendar, Check, Heart, Shield, Truck, MessageSquare, MapPin, Star, Clock, ArrowRight, ShieldCheck, Info, Sparkles } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Rating } from "@/components/common/Rating";
import { products, reviews } from "@/utils/mockData";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/common/JsonLd";
import { PhotoDetailViewer } from "@/components/common/PhotoDetailViewer";
import { ProductRotationViewer } from "@/components/common/ProductRotationViewer";
import { ProductAngleViewer } from "@/components/common/ProductAngleViewer";

const mockDates = [
  { day: "Mon", date: "20 May" },
  { day: "Tue", date: "21 May" },
  { day: "Wed", date: "22 May" },
  { day: "Thu", date: "23 May" },
  { day: "Fri", date: "24 May" },
];

const mockTimes = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"];

export default function ProductDetails() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const product = products.find((p) => p.id === id);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("12:00 PM");

  const isOwner = Boolean(user && product && (user.fullName === product.owner.name || user.email === product.owner.name));

  if (!product) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button className="mt-6 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200" onClick={() => navigate({ to: "/categories" })}>
            Browse marketplace
          </Button>
        </div>
      </MainLayout>
    );
  }

  const productSchema = {
    "@type": "Product",
    name: product.title,
    image: product.image,
    description: product.description,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: "Payent",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: "2027-12-31",
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://payent.com/product/${product.id}`,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
  };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://payent.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: "https://payent.com/categories",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://payent.com/product/${product.id}`,
      },
    ],
  };

  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : product.rotationFrames && product.rotationFrames.length > 0
      ? product.rotationFrames
      : [product.image];

  return (
    <MainLayout>
      <JsonLd schema={productSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-5 space-y-6">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Image Viewer */}
          <div className="lg:col-span-7 space-y-3 sticky top-20">
            {product.angleImages && product.angleImages.length >= 2 ? (
              <ProductAngleViewer
                angles={product.angleImages}
                productTitle={product.title}
                onWishlistToggle={() => toggle(product.id)}
                isWishlisted={has(product.id)}
              />
            ) : product.rotationFrames && product.rotationFrames.length >= 2 ? (
              <ProductRotationViewer
                frames={product.rotationFrames}
                productTitle={product.title}
              />
            ) : (
              <PhotoDetailViewer
                primaryImage={product.image}
                productTitle={product.title}
                angles={gallery}
                onWishlistToggle={() => toggle(product.id)}
                isWishlisted={has(product.id)}
              />
            )}
          </div>

          {/* Right Column: Reference App Mockup Details & Booking Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Functional Reference Notice Banner */}
            {product.isReference && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-card border-2 border-primary/30 text-xs text-foreground shadow-sm">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span><span className="font-extrabold px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black text-[10px] tracking-wider uppercase mr-1">REFERENCE MODEL</span> This item serves as a reference model for demonstrating platform features.</span>
              </div>
            )}

            <div className="rounded-2xl bg-card border border-border/80 p-4 md:p-5 space-y-4 shadow-lg text-left">
              
              {/* Category & Availability Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-foreground px-3 py-1 rounded-md bg-secondary border border-border">
                  {product.category}
                </span>
                {product.available ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="h-3.5 w-3.5" /> Available Now
                  </span>
                ) : (
                  <span className="text-xs text-destructive font-extrabold px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                    Currently Booked
                  </span>
                )}
              </div>

              {/* Title & Rating */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-foreground font-display">
                  {product.title}
                </h1>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="flex items-center gap-1 text-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border">
                    <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">({product.reviews} verified reviews)</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Owner Info Tile */}
              {!product.isReference ? (
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-secondary/50 border border-border/80">
                  <img
                    src={product.owner.avatar}
                    alt={product.owner.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-foreground truncate">{product.owner.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                      <span>Verified Lender</span>
                      <span>·</span>
                      <Star className="h-3 w-3 fill-foreground text-foreground inline" />
                      <span>{product.owner.rating}</span>
                      <span>· Responds in 1h</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<MessageSquare className="h-3.5 w-3.5 text-foreground" />}
                    onClick={() => navigate({ to: "/messages" })}
                    className="font-bold text-xs border-border hover:border-primary"
                  >
                    Message
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-secondary/40 border border-border/70">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-foreground font-black shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-foreground uppercase tracking-wider">Payent Reference Model</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                      Standard specification item for lender guidance and reference booking.
                    </div>
                  </div>
                </div>
              )}

              {/* Date Selector Pills (Reference App Mockup Style) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Rental Start Date
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {mockDates.map((item, idx) => (
                    <button
                      key={item.date}
                      onClick={() => setSelectedDate(idx)}
                      className={cn(
                        "p-2.5 rounded-2xl text-center border transition-all cursor-pointer",
                        selectedDate === idx
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md"
                          : "bg-card border-border text-foreground hover:border-[#FF5A5F]/50"
                      )}
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.day}</p>
                      <p className="text-xs font-extrabold mt-0.5">{item.date}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selector Pills (Reference App Mockup Style) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Pickup / Delivery Time Slot
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {mockTimes.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        "py-2 px-1 text-center rounded-xl border text-xs font-extrabold transition-all cursor-pointer",
                        selectedTime === time
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md"
                          : "bg-card border-border text-foreground hover:border-black/50 dark:hover:border-white/50"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Primary Action Button */}
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rental Rate</span>
                  <div>
                    <span className="text-3xl font-black text-foreground tracking-tight">₹{product.price}</span>
                    <span className="text-xs text-slate-400 font-medium"> / day</span>
                  </div>
                </div>

                {product.isReference ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/become-lender", search: { title: product.title, category: product.category, price: product.price.toString() } as never })}
                      className="w-full bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-sm py-4 rounded-2xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>List Your Gear</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center font-medium">
                      Reference item. Listed gear from community lenders includes instant Rent Now booking.
                    </p>
                  </div>
                ) : isOwner ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className="w-full bg-secondary text-muted-foreground font-bold text-sm py-4 rounded-2xl border border-border/80 cursor-not-allowed flex items-center justify-center gap-2 opacity-70"
                    >
                      <span>Your Listed Item</span>
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center font-medium">
                      You are the owner of this listing and cannot book your own item.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!product.available}
                    onClick={() => {
                      if (!user) {
                        toast.error("Please log in to book this item.");
                        navigate({ to: "/login" });
                        return;
                      }
                      navigate({ to: "/checkout", search: { id: product.id } as never });
                    }}
                    className="w-full bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-black font-bold text-sm py-4 rounded-2xl shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Rent Now - Confirm Booking</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Insurance & Delivery Badges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                  <ShieldCheck className="h-4 w-4 text-[#FF5A5F] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-extrabold text-foreground">100% Insured</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Up to ₹5 Lakhs coverage</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/40 border border-border/60">
                  <Truck className="h-4 w-4 text-[#FF5A5F] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-extrabold text-foreground">Doorstep Delivery</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Same-day pickup option</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pt-10 border-t border-border/80">
          <h2 className="text-2xl font-black tracking-tight mb-6 font-display">Verified Customer Reviews</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-3xl bg-card border border-border p-6 space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <img src={r.avatar} alt={r.user} className="h-10 w-10 rounded-full object-cover border border-[#FF5A5F]" />
                  <div className="text-left">
                    <div className="text-sm font-extrabold text-foreground">{r.user}</div>
                    <Rating value={r.rating} />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">{r.comment}</p>
                <p className="text-[11px] font-bold text-slate-400">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
