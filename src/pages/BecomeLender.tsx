import { IndianRupee, Shield, Sparkles, Upload } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { products } from "@/utils/mockData";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const perks = [
  {
    icon: IndianRupee,
    title: "Earn passive income",
    body: "Turn idle gear into up to ₹1 Lakh/month.",
    image: "1579621970563-ebec7560ff3e",
  },
  {
    icon: Shield,
    title: "",
    body: "Every rental fully insured against damage.",
    image: "1516321318423-f06f85e504b3",
  },
  {
    icon: Sparkles,
    title: "Instant listing",
    body: "List in under 2 minutes with smart suggestions.",
    image: "1498050108023-c5249f4df085",
  },
];

export default function BecomeLender() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/become-lender" }) as {
    title?: string;
    category?: string;
    price?: string;
    description?: string;
  };
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  // Form State
  const [title, setTitle] = useState(search.title || "");
  const [category, setCategory] = useState(search.category || "cameras");
  const [price, setPrice] = useState(search.price || "");
  const [description, setDescription] = useState(search.description || "");
  const [image, setImage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file is too large. Please select a file smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid rental price.");
      return;
    }

    // Default stock photos for categories in case user does not upload a custom image
    const stockCategoryImages: Record<string, string> = {
      cameras:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      laptops:
        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80",
      drones:
        "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1200&q=80",
      bikes:
        "https://images.unsplash.com/photo-1485965120138-e538ac21d810?auto=format&fit=crop&w=1200&q=80",
      tools:
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80",
      powerbanks:
        "https://images.unsplash.com/photo-1609081219091-a3f2b4c10eb3?auto=format&fit=crop&w=1200&q=80",
    };

    const newProduct = {
      id: `p-custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      image: image || stockCategoryImages[category] || stockCategoryImages.cameras,
      category: category,
      rating: 5.0,
      reviews: 0,
      available: true,
      owner: {
        name: user?.fullName || "Verified Lender",
        avatar:
          user?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
        rating: 5.0,
      },
    };

    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      toast.error("Please log in to submit a listing.");
      return;
    }

    api
      .createCustomProduct(token, newProduct)
      .then(() => {
        // Add to active products array so it appears instantly in the catalog
        products.unshift(newProduct);
        setDone(true);
        toast.success("Listing submitted successfully!");
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 1200);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to submit listing.");
      });
  };

  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">
            For lenders
          </span>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">
            Make money from gear you already own.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Join thousands of lenders earning on Payent.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {perks.map((p) => (
            <div key={p.title} className="card-premium overflow-hidden group flex flex-col h-full">
              <div className="relative h-32 w-full overflow-hidden bg-secondary">
                <img
                  src={`https://images.unsplash.com/photo-${p.image}?auto=format&fit=crop&w=600&q=80`}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                <div className="absolute bottom-3 left-3 h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 grid place-items-center">
                  <p.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 card-premium p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">List your first item</h2>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Input
              label="Item title"
              placeholder="e.g. Sony A7 IV Mirrorless Camera"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full flex items-center gap-2 rounded-xl border bg-card px-4 h-12 transition-colors border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 text-sm cursor-pointer"
                  required
                >
                  <option value="cameras">Cameras</option>
                  <option value="laptops">Laptops</option>
                  <option value="drones">Drones</option>
                  <option value="bikes">Bikes & Rides</option>
                  <option value="tools">Tools</option>
                  <option value="powerbanks">Power Banks</option>
                </select>
              </div>
              <Input
                label="Price / day (₹)"
                type="number"
                placeholder="650"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item, its condition, and what accessories are included..."
                className="w-full rounded-xl border bg-card p-4 min-h-[100px] transition-colors border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 text-sm placeholder:text-muted-foreground"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Photo</label>
              {image ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-secondary border border-border group">
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors text-xs"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center bg-card">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click to upload a gadget image
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full" loading={done}>
              {done ? "Listing submitted ✓" : "Submit listing"}
            </Button>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
