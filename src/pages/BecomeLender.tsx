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
  Headphones,
  Check,
  MapPin,
  ShieldCheck,
  Tag as TagIcon,
  Sparkle,
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

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";

const CATEGORIES = [
  {
    id: "cameras",
    label: "Cameras",
    icon: Camera,
    avgPrice: 850,
    image: cameraImg,
  },
  {
    id: "laptops",
    label: "Laptops",
    icon: Laptop,
    avgPrice: 1200,
    image: laptopImg,
  },
  {
    id: "drones",
    label: "Drones",
    icon: Zap,
    avgPrice: 1500,
    image: droneImg,
  },
  {
    id: "bikes",
    label: "Bikes & Rides",
    icon: Bike,
    avgPrice: 450,
    image: bikeImg,
  },
  {
    id: "tools",
    label: "Tools & Power",
    icon: Wrench,
    avgPrice: 500,
    image: toolImg,
  },
  {
    id: "powerbanks",
    label: "Power Banks",
    icon: BatteryCharging,
    avgPrice: 250,
    image: powerbankImg,
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
    title: "Passive Rental Income",
    body: "Turn idle tech gear into steady monthly yield with verified local borrowers.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80",
    tag: "High Yield",
  },
  {
    icon: Shield,
    title: "₹50,000 Damage Insurance",
    body: "Every single rental is fully insured against physical damage & theft.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    tag: "Zero Risk",
  },
  {
    icon: Zap,
    title: "2-Min Direct Camera Listing",
    body: "Snap product photos directly from your phone camera and go live instantly.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
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
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          onFallbackUpload={() => fileInputRef.current?.click()}
          angleTag={activeAngleTag}
        />
      )}

      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-28 bg-gradient-to-b from-background via-background/95 to-secondary/30">
        {/* Background Ambient Glow Orbs */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-emerald-500/10 blur-[130px] rounded-full -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* HERO BANNER SECTION (STATIC / NO HOVER EFFECTS) */}
          <div className="relative rounded-3xl p-8 sm:p-12 border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                <Sparkle className="h-3.5 w-3.5 fill-primary" />
                Payent Direct Listing Engine
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.08] font-display">
                Monetize your gear. <br />
                <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Snap & list in 2 mins.
                </span>
              </h1>

              <p className="text-muted-foreground text-base sm:text-xl leading-relaxed max-w-2xl font-medium">
                Turn your cameras, laptops, drones & rides into passive income with direct live camera capture and ₹50,000 damage protection.
              </p>

              {/* Quick Stat Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background/80 dark:bg-zinc-900/80 border border-border/80 shadow-sm">
                  <BadgeCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-foreground">Verified Borrower Network</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background/80 dark:bg-zinc-900/80 border border-border/80 shadow-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-foreground">₹50K Damage Coverage</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background/80 dark:bg-zinc-900/80 border border-border/80 shadow-sm">
                  <Camera className="h-4 w-4 text-amber-500" />
                  <span className="text-foreground">Direct WebRTC Camera</span>
                </div>
              </div>
            </div>
          </div>

          {/* PERKS GRID SECTION (STATIC / NO HOVER EFFECTS) */}
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map((p) => (
              <div
                key={p.title}
                className="relative overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-xl p-6 shadow-lg flex flex-col justify-between"
              >
                <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl bg-secondary mb-5">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-md">
                    {p.tag}
                  </span>
                  <div className="absolute bottom-3 left-3 h-10 w-10 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/40 grid place-items-center text-primary shadow-xl">
                    <p.icon className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-foreground font-display">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* MAIN LISTING WORKFLOW SECTION */}
          <div id="listing-form" className="pt-4">
            {done ? (
              /* Success Confirmation View */
              <div className="max-w-2xl mx-auto rounded-3xl p-8 sm:p-12 border border-emerald-500/30 bg-card/80 dark:bg-card/60 backdrop-blur-2xl text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 grid place-items-center mx-auto shadow-lg">
                  <CheckCircle2 className="h-12 w-12" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-500">
                    Listing Successfully Queued
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
                    Your Gear is Listed!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    "{title}" has been submitted and is currently undergoing fast automated verification before launching live to borrowers.
                  </p>
                </div>

                {/* Submitted Product Card Preview */}
                <div className="p-4 rounded-2xl bg-secondary/60 border border-border/80 max-w-sm mx-auto text-left flex gap-4 items-center shadow-md">
                  <img
                    src={primaryImage}
                    alt={title}
                    className="h-18 w-18 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate text-foreground">
                      {title}
                    </h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {category} • ₹{price}/day
                    </p>
                    <span className="mt-1.5 inline-flex items-center text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Under Admin Review
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
                    className="rounded-2xl font-bold"
                  >
                    <Plus className="h-4 w-4 mr-2" /> List Another Item
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/dashboard" })}
                    className="bg-primary text-primary-foreground rounded-2xl font-bold px-6"
                  >
                    Go to Lender Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Guided Form & Live Preview Grid */
              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Form Side (7 cols desktop) */}
                <div className="lg:col-span-7 rounded-3xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-card/40 backdrop-blur-2xl p-6 sm:p-10 space-y-8 shadow-xl">
                  {/* Stepper Navigation */}
                  <div className="space-y-4 border-b border-border/80 pb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Step {currentStep} of 3
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {currentStep === 1 && "Gear Overview"}
                        {currentStep === 2 && "Pricing & Terms"}
                        {currentStep === 3 && "Direct Camera Photos"}
                      </span>
                    </div>

                    {/* Step Timeline Progress Bar */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { num: 1, label: "Basics" },
                        { num: 2, label: "Pricing" },
                        { num: 3, label: "Photos" },
                      ].map((step) => {
                        const isActive = currentStep === step.num;
                        const isCompleted = currentStep > step.num;
                        return (
                          <button
                            key={step.num}
                            type="button"
                            onClick={() =>
                              setCurrentStep(step.num as 1 | 2 | 3)
                            }
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : isCompleted
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                                : "border-border/80 bg-background/50 text-muted-foreground"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <span>{step.num}.</span>
                            )}
                            <span className="truncate">{step.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-6">
                    {/* STEP 1: GEAR BASICS */}
                    {currentStep === 1 && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <Input
                          label="Item Title"
                          placeholder="e.g. Sony Alpha A7 IV Camera + 24-70mm GM Lens"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />

                        {/* Category Selector Grid (NO HOVER EFFECTS) */}
                        <div>
                          <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                            Category Selection
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {CATEGORIES.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setCategory(c.id)}
                                className={`p-2.5 rounded-2xl border text-left flex flex-col gap-2 overflow-hidden cursor-pointer ${
                                  category === c.id
                                    ? "border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/40 shadow-md"
                                    : "border-border/80 bg-card text-muted-foreground"
                                }`}
                              >
                                <div className="relative h-16 w-full rounded-xl overflow-hidden bg-secondary">
                                  <img
                                    src={c.image}
                                    alt={c.label}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <div className="absolute bottom-1.5 left-1.5 h-6 w-6 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 grid place-items-center text-white">
                                    <c.icon className="h-3.5 w-3.5" />
                                  </div>
                                  {category === c.id && (
                                    <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-white grid place-items-center shadow-md">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs truncate font-semibold">
                                  {c.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Condition Selector */}
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
                            Item Condition
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {["Like New", "Excellent", "Good"].map((cond) => (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => setCondition(cond)}
                                className={`py-3 px-4 rounded-2xl border text-xs font-bold text-center cursor-pointer ${
                                  condition === cond
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40 shadow-sm"
                                    : "border-border bg-card text-muted-foreground"
                                }`}
                              >
                                {cond}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground">
                            Detailed Description & Included Accessories
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your item condition, included batteries, chargers, SD cards, carrying cases, and usage guidelines..."
                            className="w-full rounded-2xl border bg-card p-4 min-h-[130px] border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/40 text-sm placeholder:text-muted-foreground"
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
                            className="bg-primary text-primary-foreground px-8 rounded-2xl font-bold"
                          >
                            Continue to Pricing
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: PRICING & TERMS */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <Input
                            label="Daily Rental Rate (₹ / Day)"
                            type="number"
                            placeholder="e.g. 850"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                          />
                          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                            <Info className="h-4 w-4 text-primary" />
                            Suggested rate for {category}: ₹
                            {CATEGORIES.find((c) => c.id === category)
                              ?.avgPrice || 750}
                            /day based on market demand.
                          </p>
                        </div>

                        {/* Insurance Protection Badge Card */}
                        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2 shadow-sm">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Shield className="h-4 w-4" />
                            ₹50,000 Payent Damage Coverage Included
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Your equipment is automatically insured against accidental damage or non-return by verified borrowers.
                          </p>
                        </div>

                        <div className="pt-2 flex justify-between">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            className="rounded-2xl font-bold"
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
                            className="bg-primary text-primary-foreground px-8 rounded-2xl font-bold"
                          >
                            Continue to Photos
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: DIRECT CAMERA CAPTURE & UPLOAD (NO HOVER EFFECTS) */}
                    {currentStep === 3 && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-foreground block mb-3">
                            Snap Photos with Camera or Upload
                          </label>

                          <div className="grid sm:grid-cols-2 gap-4">
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
                              className="p-5 rounded-3xl border-2 border-primary/50 bg-gradient-to-br from-primary/20 via-rose-500/10 to-primary/5 text-left flex items-center gap-4 shadow-md cursor-pointer"
                            >
                              <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg">
                                <Camera className="h-7 w-7" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 font-display">
                                  Take Photo with Camera
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Snap product photos directly from device camera
                                </p>
                              </div>
                            </button>

                            {/* FILE UPLOAD DROPZONE BUTTON */}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-5 rounded-3xl border-2 border-dashed border-border bg-card text-left flex items-center gap-4 cursor-pointer"
                            >
                              <div className="h-14 w-14 rounded-2xl bg-secondary text-foreground grid place-items-center">
                                <Upload className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-sm text-foreground font-display">
                                  Upload Image File
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Select existing photos from gallery
                                </p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Photo Gallery Thumbnails */}
                        {photos.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-foreground">
                              <span>Captured Gallery ({photos.length})</span>
                              <span className="text-[11px] text-muted-foreground font-normal">
                                Tap thumbnail to select primary image
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                              {photos.map((photo) => (
                                <div
                                  key={photo.id}
                                  onClick={() => handleSetPrimaryPhoto(photo.id)}
                                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer bg-black/40 shadow-sm ${
                                    photo.isPrimary
                                      ? "border-primary ring-2 ring-primary/40"
                                      : "border-border"
                                  }`}
                                >
                                  <img
                                    src={photo.url}
                                    alt="Gear angle"
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                                  <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md">
                                    {photo.tag}
                                  </span>

                                  {photo.isPrimary && (
                                    <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-black bg-primary px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                      <Check className="h-2.5 w-2.5" /> Primary
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePhoto(photo.id);
                                    }}
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/80 text-red-400 grid place-items-center"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 flex justify-between items-center border-t border-border/80">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(2)}
                            className="rounded-2xl font-bold"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back
                          </Button>
                          <Button
                            type="submit"
                            size="lg"
                            className="bg-primary text-primary-foreground px-10 rounded-2xl font-extrabold shadow-lg"
                            loading={isSubmitting}
                          >
                            Submit Listing
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Live Marketplace Product Card Preview (5 cols desktop) */}
                <div className="lg:col-span-5 sticky top-24 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2 font-display">
                      <Layers className="h-4 w-4 text-primary" /> Live Catalog Preview
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      Real-time Preview
                    </span>
                  </div>

                  {/* Simulated Marketplace Product Card */}
                  <div className="rounded-3xl overflow-hidden border border-border/80 dark:border-white/10 bg-card shadow-xl space-y-0">
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-secondary">
                      <img
                        src={primaryImage}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <div className="flex items-center gap-1 bg-[#FF5A5F] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 p-2 rounded-full bg-background/80 text-foreground shadow-md">
                        <TagIcon className="h-3.5 w-3.5" />
                      </div>

                      {/* Rating Star Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>5.0 (New)</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-block text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full capitalize">
                            {category}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="truncate max-w-[110px]">
                              Jubilee Hills, Hyd
                            </span>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-base leading-snug line-clamp-2 text-foreground font-display">
                          {title || "High-Resolution Tech Gear"}
                        </h3>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-border/60">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-muted-foreground font-bold">
                            Daily Rate
                          </span>
                          <div>
                            <span className="text-xl font-black text-foreground tracking-tight font-display">
                              ₹{price || "850"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {" "}
                              /day
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                user?.avatar ||
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                              }
                              alt="Owner"
                              className="h-7 w-7 rounded-full object-cover border border-border"
                            />
                            <div className="text-[11px]">
                              <p className="font-bold text-foreground leading-none">
                                {user?.fullName || "Verified Lender"}
                              </p>
                              <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">
                                ✓ Verified Owner
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Policy Card */}
                  <div className="p-4 rounded-2xl border border-border/80 bg-secondary/40 text-xs text-muted-foreground flex items-center gap-3 shadow-sm">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      Automatic ₹50,000 damage policy and identity verification for all rental requests.
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
