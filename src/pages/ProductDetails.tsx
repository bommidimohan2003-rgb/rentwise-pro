import { useNavigate, useParams } from "@tanstack/react-router";
import { Calendar, Check, Heart, Shield, Truck, MessageSquare, MapPin, Star, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Rating } from "@/components/common/Rating";
import { products, reviews } from "@/utils/mockData";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/common/JsonLd";
import { PhotoDetailViewer } from "@/components/common/PhotoDetailViewer";
import { ProductRotationViewer } from "@/components/common/ProductRotationViewer";

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
  const product = products.find((p) => p.id === id);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState("12:00 PM");

  if (!product) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button className="mt-6 bg-[#FF5A5F]" onClick={() => navigate({ to: "/categories" })}>
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

  const gallery = [product.image, product.image, product.image, product.image];

  return (
    <MainLayout>
      <JsonLd schema={productSchema} />
      <JsonLd schema={breadcrumbSchema} />
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 space-y-12">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Image Viewer & Thumbnail Gallery */}
          <div className="lg:col-span-7 space-y-4 sticky top-24">
            {product.rotationFrames && product.rotationFrames.length >= 2 ? (
              <ProductRotationViewer
                frames={product.rotationFrames}
                productTitle={product.title}
              />
            ) : (
              <PhotoDetailViewer
                primaryImage={gallery[activeImg]}
                productTitle={product.title}
                onWishlistToggle={() => toggle(product.id)}
                isWishlisted={has(product.id)}
              />
            )}

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
                    activeImg === i
                      ? "border-[#FF5A5F] ring-2 ring-[#FF5A5F]/30 scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Reference App Mockup Details & Booking Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-card border border-border/80 p-6 md:p-8 space-y-6 shadow-xl text-left">
              
              {/* Category & Availability Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#FF5A5F] px-3.5 py-1 rounded-full bg-[#FF5A5F]/10 border border-[#FF5A5F]/20">
                  {product.category}
                </span>
                {product.available ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="h-3.5 w-3.5" /> Available Now
                  </span>
                ) : (
                  <span className="text-xs text-rose-500 font-extrabold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
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
                  <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-400">({product.reviews} verified reviews)</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                {product.description}
              </p>

              {/* Owner Info Tile */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-secondary/50 border border-border/80">
                <img
                  src={product.owner.avatar}
                  alt={product.owner.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#FF5A5F]"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-foreground truncate">{product.owner.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">
                    Verified Lender · {product.owner.rating}★ · Responds in 1h
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MessageSquare className="h-3.5 w-3.5 text-[#FF5A5F]" />}
                  onClick={() => navigate({ to: "/messages" })}
                  className="font-bold text-xs border-border hover:border-[#FF5A5F]/50"
                >
                  Message
                </Button>
              </div>

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
                          ? "bg-[#0B2545] dark:bg-[#000000] text-white border-[#0B2545] dark:border-[#FF5A5F] shadow-md"
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
                          ? "bg-[#FF5A5F] text-white border-[#FF5A5F] shadow-md shadow-[#FF5A5F]/20"
                          : "bg-card border-border text-foreground hover:border-[#FF5A5F]/50"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Primary Action Button */}
              <div className="pt-4 border-t border-border/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">Total Rental Fee</span>
                  <div>
                    <span className="text-3xl font-black text-[#FF5A5F] tracking-tight">₹{product.price}</span>
                    <span className="text-xs text-slate-400 font-medium"> / day</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!product.available}
                  onClick={() => navigate({ to: "/checkout", search: { id: product.id } as never })}
                  className="w-full bg-[#FF5A5F] hover:bg-[#e0484d] disabled:opacity-50 text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-[#FF5A5F]/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirm Booking</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
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
