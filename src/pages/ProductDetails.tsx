import { useNavigate, useParams } from "@tanstack/react-router";
import { Calendar, Check, Heart, Shield, Truck, MessageSquare } from "lucide-react";
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

export default function ProductDetails() {
  const { id } = useParams({ from: "/product/$id" });
  const navigate = useNavigate();
  const { has, toggle } = useWishlist();
  const product = products.find((p) => p.id === id);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button className="mt-6" onClick={() => navigate({ to: "/categories" })}>
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
          {/* Left Column: Focal Photo Viewer / 360° Rotation Viewer & Gallery */}
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
                    "aspect-square rounded-2xl overflow-hidden border-2 transition-all spatial-surface",
                    activeImg === i
                      ? "border-primary ring-2 ring-primary/30 scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Floating Action Card & Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="spatial-float p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  {product.category}
                </span>
                {product.available ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <Check className="h-3.5 w-3.5" /> Available Now
                  </span>
                ) : (
                  <span className="text-xs text-destructive font-bold px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                    Currently Booked
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-foreground">
                {product.title}
              </h1>

              <div className="flex items-center gap-3">
                <Rating value={product.rating} count={product.reviews} />
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Owner Info Tile */}
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-secondary/50 border border-border/60">
                <img
                  src={product.owner.avatar}
                  alt={product.owner.name}
                  className="h-12 w-12 rounded-full object-cover border border-primary/30"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{product.owner.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Verified Lender · {product.owner.rating}★ · Responds in 1h
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
                  onClick={() => navigate({ to: "/messages" })}
                  className="font-bold text-xs"
                >
                  Message
                </Button>
              </div>

              {/* Pricing & Booking */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">₹{product.price}</span>
                  <span className="text-sm text-muted-foreground font-semibold"> / day</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 btn-gradient font-bold shadow-lg py-3.5"
                    leftIcon={<Calendar className="h-4 w-4" />}
                    onClick={() => navigate({ to: "/checkout", search: { id: product.id } as never })}
                    disabled={!product.available}
                  >
                    Proceed to Booking
                  </Button>
                </div>
              </div>

              {/* Insurance & Delivery Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-foreground">100% Insured</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Damage protection covered</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                  <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-foreground">Express Delivery</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Same-day pickup option</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="pt-10 border-t border-border/50">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-6">Verified Customer Reviews</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="spatial-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={r.avatar} alt={r.user} className="h-10 w-10 rounded-full object-cover border border-border" />
                  <div>
                    <div className="text-sm font-bold text-foreground">{r.user}</div>
                    <Rating value={r.rating} />
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                <p className="text-[11px] font-semibold text-muted-foreground/70">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
