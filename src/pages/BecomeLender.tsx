import React, { useState } from "react";
import {
  IndianRupee,
  Shield,
  Zap,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Trash2,
  Plus,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Laptop,
  Bike,
  Wrench,
  BatteryCharging,
  Gamepad2,
  Headphones,
  Check,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { CameraCaptureModal } from "@/components/lender/CameraCaptureModal";

const CATEGORIES = [
  {
    id: "cameras",
    label: "Cameras",
    icon: Camera,
    avgPrice: 850,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "laptops",
    label: "Laptops",
    icon: Laptop,
    avgPrice: 1200,
    image:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "drones",
    label: "Drones",
    icon: Zap,
    avgPrice: 1500,
    image:
      "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "bikes",
    label: "Bikes & Rides",
    icon: Bike,
    avgPrice: 450,
    image:
      "https://images.unsplash.com/photo-1485965120138-e538ac21d810?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "tools",
    label: "Tools & Power",
    icon: Wrench,
    avgPrice: 500,
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "powerbanks",
    label: "Power Banks",
    icon: BatteryCharging,
    avgPrice: 250,
    image:
      "https://images.unsplash.com/photo-1609081219091-a3f2b4c10eb3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "gaming",
    label: "Gaming Consoles",
    icon: Gamepad2,
    avgPrice: 900,
    image:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "audio",
    label: "Audio & VR",
    icon: Headphones,
    avgPrice: 650,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80",
  },
];

const perks = [
  {
    icon: IndianRupee,
    title: "Passive Rental Earnings",
    body: "Turn idle tech gear into steady earnings up to ₹1.2 Lakh/month.",
    image: "1579621970563-ebec7560ff3e",
    tag: "High Yield",
  },
  {
    icon: Shield,
    title: "₹50,000 Damage Insurance",
    body: "Every single rental is covered against accidental damages & theft.",
    image: "1516321318423-f06f85e504b3",
    tag: "Zero Risk",
  },
  {
    icon: Zap,
    title: "2-Minute Direct Camera Listing",
    body: "Snap gear photos directly from your phone camera and launch instantly.",
    image: "1498050108023-c5249f4df085",
    tag: "Instant Snap",
  },
];

interface GearPhoto {
  id: string;
  url: string;
  tag: string;
  isPrimary: boolean;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stepper step state (1: Basics, 2: Pricing & Terms, 3: Photos & Submit)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState(search.title || "");
  const [category, setCategory] = useState(search.category || "cameras");
  const [condition, setCondition] = useState("Like New");
  const [price, setPrice] = useState(search.price || "");
  const [description, setDescription] = useState(search.description || "");

  // Photos State
  const [photos, setPhotos] = useState<GearPhoto[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeAngleTag, setActiveAngleTag] = useState("Front View");

  // File input ref for fallbacks
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handlers for Camera Capture
  const handleCameraCapture = (imageDataUrl: string, angleTag?: string) => {
    const newPhoto: GearPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: imageDataUrl,
      tag: angleTag || "Front View",
      isPrimary: photos.length === 0,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    toast.success(`Photo added (${newPhoto.tag})`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (> 5MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            url: reader.result as string,
            tag: prev.length === 0 ? "Front View" : "Gear Angle",
            isPrimary: prev.length === 0,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
  };

  // Primary image preview
  const primaryImage =
    photos.find((p) => p.isPrimary)?.url ||
    photos[0]?.url ||
    CATEGORIES.find((c) => c.id === category)?.image ||
    CATEGORIES[0].image;

  // Form Submit Handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter item title.");
      setCurrentStep(1);
      return;
    }

    if (!price || Number(price) <= 0) {
      toast.error("Please specify a valid daily rental price.");
      setCurrentStep(2);
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description of your gear.");
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    const priceNum = Number(price);

    const newProduct: Product = {
      id: `p-custom-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      image: primaryImage,
      category: category,
      rating: 5.0,
      reviews: 0,
      available: false,
      isReference: false,
      status: "pending",
      owner: {
        name: user?.fullName || user?.email || "Verified Lender",
        email: user?.email || "",
        avatar:
          user?.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
        rating: 5.0,
      },
    };

    let token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token && user?.email) {
      token = `google-firebase-jwt-${Date.now()}`;
      storage.set(STORAGE_KEYS.token, token);
    }

    if (token) {
      try {
        await api.createCustomProduct(token, newProduct);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("[BecomeLender] Backend submission notice:", msg);
      }
    }

    // Save to local custom products cache
    const cachedCustom = storage.get<unknown[]>("payent_custom_products", []);
    storage.set("payent_custom_products", [newProduct, ...cachedCustom]);

    setIsSubmitting(false);
    setDone(true);
    toast.success("Listing submitted successfully! Live under admin review.");
  };

  return (
    <MainLayout>
      {/* Hidden File Input for Gallery Selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Direct Camera Capture WebRTC Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onFallbackUpload={() => fileInputRef.current?.click()}
        angleTag={activeAngleTag}
      />

      <section className="relative overflow-hidden pt-12 pb-24">
        {/* Background Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-primary/10 blur-[120px] rounded-full -z-10" />

        {/* Hero Header */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Lender Marketplace Hub
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Monetize your tech gear. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Snap photos & earn.
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              List high-demand cameras, laptops, drones & gadgets in 2 minutes.
              Covered by ₹50,000 Payent Damage Protection.
            </p>

            {/* Quick Stat Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                <span>Verified Borrower Network</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>₹50K Damage Insurance</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Direct Camera Instant Listing</span>
              </div>
            </div>
          </div>

          {/* Perks Grid */}
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {perks.map((p) => (
              <div
                key={p.title}
                className="card-premium overflow-hidden group flex flex-col h-full border border-border/80 bg-card/60 backdrop-blur-md hover:border-primary/50 transition-all duration-300 shadow-sm"
              >
                <div className="relative h-36 w-full overflow-hidden bg-secondary">
                  <img
                    src={`https://images.unsplash.com/photo-${p.image}?auto=format&fit=crop&w=600&q=80`}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                    {p.tag}
                  </span>
                  <div className="absolute bottom-3 left-3 h-9 w-9 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 grid place-items-center text-primary shadow-lg">
                    <p.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MAIN LISTING WORKFLOW SECTION */}
          <div className="mt-16" id="listing-form">
            {done ? (
              /* Success Confirmation Card */
              <div className="card-premium p-8 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Listing Pending Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-foreground">
                    Your Gear Listing is Submitted!
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    "{title}" has been successfully queued for listing. Our team is running automated safety checks before pushing it live to retail borrowers.
                  </p>
                </div>

                {/* Submitted Product Card Preview */}
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 max-w-sm mx-auto text-left flex gap-4 items-center">
                  <img
                    src={primaryImage}
                    alt={title}
                    className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm truncate text-foreground">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {category} • ₹{price}/day
                    </p>
                    <span className="mt-1 inline-flex items-center text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Under Review
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => {
                      setDone(false);
                      setTitle("");
                      setPrice("");
                      setDescription("");
                      setPhotos([]);
                      setCurrentStep(1);
                    }}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" /> List Another Item
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="bg-primary text-primary-foreground"
                  >
                    Go to Lender Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Guided Form Container */
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Form Side (8 cols on desktop) */}
                <div className="lg:col-span-7 card-premium p-6 sm:p-8 space-y-6">
                  {/* Stepper Navigation */}
                  <div className="flex items-center justify-between border-b border-border/80 pb-5">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Step {currentStep} of 3
                      </span>
                      <h2 className="text-xl font-bold text-foreground">
                        {currentStep === 1 && "Gear Basics & Description"}
                        {currentStep === 2 && "Pricing & Deposit Terms"}
                        {currentStep === 3 && "Photos & Direct Camera Capture"}
                      </h2>
                    </div>

                    {/* Step Indicator Pills */}
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setCurrentStep(step as 1 | 2 | 3)}
                          className={`h-2.5 rounded-full transition-all ${
                            currentStep === step
                              ? "w-8 bg-primary"
                              : currentStep > step
                              ? "w-2.5 bg-emerald-500"
                              : "w-2.5 bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-6">
                    {/* STEP 1: GEAR BASICS */}
                    {currentStep === 1 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <Input
                          label="Gear Title"
                          placeholder="e.g. Sony Alpha A7 IV Camera + 24-70mm Lens"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />

                        {/* Visual Category Selector Pills */}
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-foreground">
                            Category Selection
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {CATEGORIES.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategory(c.id)}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                                  category === c.id
                                    ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/40 shadow-sm"
                                    : "border-border/80 bg-card hover:bg-accent text-muted-foreground"
                                }`}
                              >
                                <c.icon className="h-5 w-5" />
                                <span className="text-xs truncate">
                                  {c.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Condition Selector */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground">
                            Item Condition
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Like New", "Excellent", "Good"].map((cond) => (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => setCondition(cond)}
                                className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                                  condition === cond
                                    ? "border-primary bg-primary/10 text-primary font-bold"
                                    : "border-border bg-card text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {cond}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground">
                            Detailed Description & Included Accessories
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detail your item condition, included batteries, chargers, SD cards, carrying cases, and usage requirements..."
                            className="w-full rounded-xl border bg-card p-4 min-h-[120px] transition-colors border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 text-sm placeholder:text-muted-foreground"
                            required
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!title.trim() || !description.trim()) {
                                toast.error(
                                  "Please fill in title and description before proceeding."
                                );
                                return;
                              }
                              setCurrentStep(2);
                            }}
                            className="bg-primary text-primary-foreground px-6"
                          >
                            Continue to Pricing
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: PRICING & TERMS */}
                    {currentStep === 2 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        <div>
                          <Input
                            label="Daily Rental Rate (₹ / Day)"
                            type="number"
                            placeholder="e.g. 850"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                          />
                          <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 text-primary" />
                            Suggested daily rate for {category}: ₹
                            {CATEGORIES.find((c) => c.id === category)
                              ?.avgPrice || 750}
                            /day based on market demand.
                          </p>
                        </div>

                        {/* Security & Insurance Highlight */}
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Shield className="h-4 w-4" />
                            ₹50,000 Payent Lender Protection Included
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Your equipment is automatically protected against physical damage or non-return by verified borrowers.
                          </p>
                        </div>

                        <div className="pt-2 flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              if (!price || Number(price) <= 0) {
                                toast.error("Please specify a valid daily price.");
                                return;
                              }
                              setCurrentStep(3);
                            }}
                            className="bg-primary text-primary-foreground px-6"
                          >
                            Continue to Photo Capture
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: PHOTOS & DIRECT CAMERA CAPTURE */}
                    {currentStep === 3 && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Dual Action Buttons: Camera Snap & File Upload */}
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-2">
                            Add Gear Photos (Click Camera or Upload)
                          </label>

                          <div className="grid sm:grid-cols-2 gap-3">
                            {/* DIRECT CAMERA ACTION BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveAngleTag(
                                  photos.length === 0
                                    ? "Front View"
                                    : photos.length === 1
                                    ? "Side Angle"
                                    : "Accessories/Serial"
                                );
                                setIsCameraOpen(true);
                              }}
                              className="p-4 rounded-2xl border-2 border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary transition-all text-left flex items-center gap-3.5 group shadow-sm"
                            >
                              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center group-hover:scale-105 transition-transform shadow-md">
                                <Camera className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                  Take Photo with Camera
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Use live camera stream to snap gear directly
                                </p>
                              </div>
                            </button>

                            {/* GALLERY FILE UPLOAD ACTION BUTTON */}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-4 rounded-2xl border-2 border-dashed border-border bg-card hover:bg-accent hover:border-muted-foreground transition-all text-left flex items-center gap-3.5 group"
                            >
                              <div className="h-12 w-12 rounded-xl bg-secondary text-foreground grid place-items-center group-hover:scale-105 transition-transform">
                                <Upload className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-foreground">
                                  Upload Image File
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                  Select photos from your device library
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Photo Gallery Thumbnails */}
                        {photos.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                              <span>Captured Photos ({photos.length})</span>
                              <span className="text-[11px] text-muted-foreground">
                                Click photo to mark as main thumbnail
                              </span>
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {photos.map((photo) => (
                                <div
                                  key={photo.id}
                                  onClick={() => handleSetPrimaryPhoto(photo.id)}
                                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer group bg-black/40 ${
                                    photo.isPrimary
                                      ? "border-primary ring-2 ring-primary/40"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  <img
                                    src={photo.url}
                                    alt="Gear angle"
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                                    {photo.tag}
                                  </span>

                                  {photo.isPrimary && (
                                    <span className="absolute top-2 left-2 text-[9px] font-bold uppercase text-black bg-primary px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                      <Check className="h-2.5 w-2.5" /> Main
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePhoto(photo.id);
                                    }}
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center hover:bg-red-500 hover:text-white"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex justify-between items-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                          </Button>
                          <Button
                            type="submit"
                            size="lg"
                            className="bg-primary text-primary-foreground px-8 font-bold"
                            loading={isSubmitting}
                          >
                            Submit Gear Listing
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Live Marketplace Card Preview Side Panel (5 cols desktop) */}
                <div className="lg:col-span-5 sticky top-24 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" /> Live Listing Preview
                    </span>
                    <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Real-time Card
                    </span>
                  </div>

                  {/* Simulated Marketplace Product Card */}
                  <div className="card-premium overflow-hidden border border-border/80 bg-card shadow-lg">
                    <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                      <img
                        src={primaryImage}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                          {category}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
                          Available
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white font-extrabold text-sm px-3 py-1 rounded-xl border border-white/10">
                        ₹{price || "850"} <span className="text-[10px] font-normal text-zinc-400">/ day</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-1">
                          {title || "High-Resolution Tech Gear"}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {description ||
                            "Item description and accessories will appear here once entered..."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              user?.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                            }
                            alt="Owner avatar"
                            className="h-7 w-7 rounded-full object-cover border border-border"
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground leading-none">
                              {user?.fullName || "Verified Lender"}
                            </p>
                            <span className="text-[10px] text-emerald-500 font-medium">
                              ✓ Verified Lender
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          <Star className="h-3.5 w-3.5 fill-amber-500" /> 5.0 (New)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Protection Info Pill */}
                  <div className="p-4 rounded-xl border border-border bg-secondary/40 text-xs text-muted-foreground flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      Listings are published with automatic ₹50K damage insurance and identity verification for all rental requests.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
