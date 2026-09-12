import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crosshair,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "@tanstack/react-router";
import { useUserLocation } from "@/hooks/useUserLocation";

import cameraImg from "@/assets/images/camera.png";
import laptopImg from "@/assets/images/laptop.png";
import bikeImg from "@/assets/images/re_classic350.png";
import droneImg from "@/assets/images/drone.png";
import toolImg from "@/assets/images/tool.png";
import powerbankImg from "@/assets/images/powerbank.png";

const gearItems = [
  {
    id: "bike",
    title: "Classic 350",
    name: "Royal Enfield Classic 350",
    image: bikeImg,
  },
  {
    id: "camera",
    title: "Camera",
    name: "Sony Alpha Cinema Camera",
    image: cameraImg,
  },
  {
    id: "drone",
    title: "Drone",
    name: "DJI Mavic 3 Pro Drone",
    image: droneImg,
  },
  {
    id: "laptop",
    title: "Laptop",
    name: "Apple MacBook Pro M3 Max",
    image: laptopImg,
  },
  {
    id: "powerbank",
    title: "Powerbank",
    name: "Fast-Charging Power Station",
    image: powerbankImg,
  },
  {
    id: "tool",
    title: "Drilling Machine",
    name: "Heavy-Duty Cordless Drill",
    image: toolImg,
  },
];

const popularTags = [
  "Sony FX3",
  "Canon R5",
  "DJI Mavic 3",
  "MacBook Pro",
  "Lighting Kit",
  "Audio Gear",
];

const popularCities = [
  "All Cities",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Goa",
  "Kochi",
  "Chandigarh",
];

export function Hero() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGearIndex, setActiveGearIndex] = useState(0);

  // Auto-advance gear showcase every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveGearIndex((prev) => (prev + 1) % gearItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeGear = gearItems[activeGearIndex];

  const {
    city: selectedCity,
    setCity: setSelectedCity,
    isDetecting,
    isAutoDetected,
    detectLocation,
  } = useUserLocation();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate({
      to: "/categories",
      search: {
        q: searchTerm.trim() || undefined,
      },
    });
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    navigate({
      to: "/categories",
      search: { q: tag },
    });
  };

  return (
    <section className="relative overflow-hidden bg-neutral-50/60 dark:bg-[#05090D] text-neutral-900 dark:text-white pt-8 sm:pt-12 pb-12 lg:pb-16 border-b border-black/10 dark:border-white/10 transition-colors duration-300">
      {/* Ambient background glow matching dark cinematic reference */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-b from-neutral-200/40 via-neutral-100/10 to-transparent dark:from-[#0B1522] dark:via-[#071017] dark:to-transparent rounded-full blur-[160px] pointer-events-none opacity-60" />
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/5 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Full-Bleed Transparent Gear Image Cycling One After Another */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGear.id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            <img
              src={activeGear.image}
              alt={activeGear.name}
              className="w-full h-full object-cover sm:object-contain lg:object-cover opacity-85 sm:opacity-90 dark:opacity-60 filter contrast-125 saturate-135 brightness-[0.95] dark:brightness-95 drop-shadow-[0_15px_35px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all pointer-events-none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Soft center ambient backlight glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/5 dark:bg-white/10 rounded-full blur-[160px] pointer-events-none" />

        {/* Subtle radial and vertical scrims ensuring text readability */}
        <div className="absolute inset-0 bg-radial from-white/40 via-white/10 to-transparent dark:from-[#05090D]/75 dark:via-[#05090D]/40 dark:to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-neutral-50/90 dark:from-[#05090D] via-neutral-50/40 dark:via-[#05090D]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-50/40 dark:from-[#05090D]/70 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Main Text Section in Foreground */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[68px] font-black tracking-tight text-neutral-950 dark:text-white leading-[1.05]">
            Rent Professional Tech. <br />
            <span className="text-neutral-950 dark:text-white font-extrabold underline decoration-neutral-400 dark:decoration-neutral-600 underline-offset-8">Create Without Limits.</span>
          </h1>

          {/* Primary CTA: Explore Gear → */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2.5 h-[52px] sm:h-[56px] px-9 rounded-full bg-[#161616] hover:bg-[#262626] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white text-base font-bold transition-all duration-200 shadow-xl hover:scale-102 active:scale-98 cursor-pointer"
            >
              <span>Explore Gear</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Bottom Integrated Search Bar Module */}
        <div className="mt-8 sm:mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-white dark:bg-[#081018] border border-black/10 dark:border-white/15 shadow-xl flex items-center gap-1.5 sm:gap-2 backdrop-blur-md"
          >
            {/* Keyword Search Input */}
            <div className="flex-1 min-w-0 flex items-center gap-2 pl-2 sm:pl-3 py-1 bg-transparent">
              <Search className="h-4 w-4 text-neutral-400 dark:text-[#AAB3BC] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search gear (camera, drone, laptop...)"
                className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-[#697680] focus:outline-none truncate"
              />
            </div>

            {/* Informational Location Indicator (DISPLAY ONLY) */}
            {selectedCity && selectedCity !== "All Cities" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate text-[11px] font-medium max-w-[120px]">{selectedCity}</span>
              </div>
            )}

            {/* Search Submit Button */}
            <button
              type="submit"
              className="h-9 sm:h-10 px-5 sm:px-6 rounded-xl sm:rounded-full bg-[#161616] hover:bg-[#262626] text-[#F2F0EA] dark:bg-[#F2F0EA] dark:text-[#161616] dark:hover:bg-white text-xs sm:text-sm font-bold transition-colors shrink-0 shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Popular Searches Chips */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 mt-3 px-1">
            <span className="text-xs font-semibold text-neutral-500 dark:text-[#AAB3BC]">Popular:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="px-3 py-1 rounded-full text-xs font-medium text-neutral-700 dark:text-[#AAB3BC] bg-neutral-100 dark:bg-[#0D151D] hover:text-neutral-900 dark:hover:text-white hover:border-black/30 dark:hover:border-white/30 border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
