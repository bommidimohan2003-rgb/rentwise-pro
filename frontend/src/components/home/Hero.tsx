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
        city: selectedCity !== "All Cities" ? selectedCity : undefined,
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
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[#FF1744]/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Full-Bleed Transparent Gear Image Cycling One After Another (Top to Bottom & Left to Right) */}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#FF1744]/15 dark:bg-[#FF1744]/20 rounded-full blur-[160px] pointer-events-none" />

        {/* Subtle radial and vertical scrims ensuring text readability while keeping the image clearly visible in both light & dark */}
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
            <span className="text-[#FF1744]">Create Without Limits.</span>
          </h1>

          {/* Primary CTA: Explore Gear → */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2.5 h-[52px] sm:h-[56px] px-9 rounded-full bg-[#FF1744] hover:bg-[#E91E4D] text-white text-base font-bold transition-colors duration-200 cursor-pointer"
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
                placeholder="Search gear (camera, drone...)"
                className="w-full bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-[#697680] focus:outline-none truncate"
              />
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-black/10 dark:bg-white/15 shrink-0" />

            {/* Location Selector (Directly Inside Search Bar) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-left text-xs text-neutral-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl sm:rounded-full transition-colors cursor-pointer max-w-[125px] sm:max-w-[180px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isDetecting ? (
                    <Loader2 className="h-3.5 w-3.5 text-[#FF1744] animate-spin shrink-0" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5 text-[#FF1744] shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="hidden sm:flex items-center gap-1 leading-none">
                      <span className="text-[9px] text-neutral-400 dark:text-[#697680] uppercase">Location</span>
                      {isAutoDetected && !isDetecting && (
                        <span className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 px-1 py-0.2 rounded">
                          Auto
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-white truncate block text-[11px] sm:text-xs sm:mt-0.5">
                      {isDetecting ? "Detecting..." : selectedCity}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-3 w-3 text-neutral-400 dark:text-[#AAB3BC] shrink-0" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute top-full mt-2 sm:bottom-full sm:mb-2 sm:top-auto right-0 sm:left-0 z-30 rounded-xl bg-white dark:bg-[#111B24] border border-black/10 dark:border-white/15 p-1.5 shadow-2xl space-y-1 w-[220px] max-h-60 overflow-y-auto">
                  {/* Quick Action: Auto-Detect Location */}
                  <button
                    type="button"
                    onClick={async () => {
                      await detectLocation(true);
                      setCityDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[#FF1744] hover:bg-[#FF1744]/10 rounded-lg transition-colors cursor-pointer border border-[#FF1744]/20"
                  >
                    <Crosshair className="h-3.5 w-3.5 animate-pulse shrink-0" />
                    <span>Auto-Detect Current Location</span>
                  </button>

                  <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

                  {/* Show detected city at top if not in popular list */}
                  {selectedCity && !popularCities.includes(selectedCity) && (
                    <button
                      type="button"
                      onClick={() => setCityDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="truncate">📍 {selectedCity}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Current</span>
                    </button>
                  )}

                  {/* Popular Cities */}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#697680] px-2 py-0.5">
                    Select City
                  </div>
                  {popularCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedCity(c);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${selectedCity === c
                          ? "bg-[#FF1744]/10 text-[#FF1744] font-semibold"
                          : "text-neutral-700 dark:text-[#AAB3BC] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                        }`}
                    >
                      <span>{c}</span>
                      {selectedCity === c && <Check className="h-3.5 w-3.5 text-[#FF1744]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              aria-label="Search"
              className="h-8 sm:h-auto px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-full bg-[#FF1744] hover:bg-[#E91E4D] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF1744]/25 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
            >
              <Search className="h-3.5 w-3.5 sm:hidden" />
              <span className="hidden sm:inline">Search</span>
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
                className="px-3 py-1 rounded-full text-xs font-medium text-neutral-700 dark:text-[#AAB3BC] bg-neutral-100 dark:bg-[#0D151D] hover:text-neutral-900 dark:hover:text-white hover:border-[#FF1744]/50 border border-black/10 dark:border-white/10 transition-colors cursor-pointer"
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
