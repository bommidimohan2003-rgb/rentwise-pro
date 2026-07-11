import { useNavigate, useParams } from "@tanstack/react-router";
import { Calendar, Check, Heart, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Rating } from "@/components/common/Rating";
import { products, reviews } from "@/utils/mockData";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/common/JsonLd";

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
      priceCurrency: "USD",
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
      <section className="mx-auto max-w-7xl px-4 md:px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary">
              <img
                src={gallery[activeImg]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                    activeImg === i ? "border-primary" : "border-transparent opacity-70",
                  )}
                >
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {product.category}
              </span>
              <button
                onClick={() => toggle(product.id)}
                className="rounded-full p-2 border border-border"
              >
                <Heart
                  className={cn("h-4 w-4", has(product.id) && "fill-rose-500 text-rose-500")}
                />
              </button>
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">{product.title}</h1>
            <div className="mt-4 flex items-center gap-4">
              <Rating value={product.rating} count={product.reviews} />
              {product.available ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Check className="h-3 w-3" /> Available now
                </span>
              ) : (
                <span className="text-xs text-destructive font-medium">Unavailable</span>
              )}
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl border border-border">
              <img
                src={product.owner.avatar}
                alt={product.owner.name}
                className="h-11 w-11 rounded-full"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{product.owner.name}</div>
                <div className="text-xs text-muted-foreground">
                  Owner · {product.owner.rating}★ · Responds in 1h
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/messages" })}>
                Message
              </Button>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-4xl font-bold">₹{product.price}</span>
              <span className="text-muted-foreground">/day</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1"
                leftIcon={<Calendar className="h-4 w-4" />}
                onClick={() => navigate({ to: "/checkout", search: { id: product.id } as never })}
                disabled={!product.available}
              >
                Rent now
              </Button>
              <Button size="lg" variant="outline" onClick={() => toggle(product.id)}>
                <Heart
                  className={cn("h-4 w-4", has(product.id) && "fill-rose-500 text-rose-500")}
                />
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/60">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">Insured rental</div>
                  <div className="text-xs text-muted-foreground">Damage covered</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/60">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">Free delivery</div>
                  <div className="text-xs text-muted-foreground">On orders 3+ days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="card-premium p-5">
                <div className="flex items-center gap-3">
                  <img src={r.avatar} alt={r.user} className="h-9 w-9 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{r.user}</div>
                    <Rating value={r.rating} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
