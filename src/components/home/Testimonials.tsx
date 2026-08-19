import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Quote,
  Star,
  Tag,
  RotateCw,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance Photographer",
    initials: "PS",
    quote:
      "Payent saved me thousands on camera gear. I rented a 4K cinema camera for a weekend wedding shoot at a fraction of buying cost. Smooth process and verified lender!",
    rating: 5,
    product: "Camera Kit",
    city: "Mumbai, MH",
    rentalsCompleted: 14,
    memberSince: "2024",
  },
  {
    name: "Rohan Mehta",
    role: "Content Creator",
    initials: "RM",
    quote:
      "Rented a drone for my travel series. Booking was instant, security flow gave me peace of mind, and the drone arrived in perfect working condition.",
    rating: 5,
    product: "Aerial Cine Drone",
    city: "Bengaluru, KA",
    rentalsCompleted: 22,
    memberSince: "2023",
  },
  {
    name: "Anjali Nair",
    role: "Event Producer",
    initials: "AN",
    quote:
      "Used Payent to rent a 4K projector and audio setup for a client showcase. Everything worked flawlessly on site. Highly recommended for creative teams.",
    rating: 5,
    product: "4K Laser Projector",
    city: "Hyderabad, TS",
    rentalsCompleted: 9,
    memberSince: "2024",
  },
  {
    name: "Vikram Patel",
    role: "Game Developer",
    initials: "VP",
    quote:
      "Rented a high-end workstation laptop for two weeks while testing hardware builds. Extremely straightforward, transparent pricing, and zero hassle.",
    rating: 5,
    product: "Pro Workstation Laptop",
    city: "Pune, MH",
    rentalsCompleted: 18,
    memberSince: "2023",
  },
  {
    name: "Sana Khan",
    role: "Architecture Designer",
    initials: "SK",
    quote:
      "Needed a specialized CAD machine for a project deadline. Way cheaper than buying, and the owner was super responsive with handover coordination.",
    rating: 5,
    product: "CAD Workstation",
    city: "Delhi NCR",
    rentalsCompleted: 11,
    memberSince: "2024",
  },
  {
    name: "Arjun Singh",
    role: "Studio Producer",
    initials: "AS",
    quote:
      "We rent secondary podcast mics and lighting rigs when scaling up production. Payent has made gear access predictable and efficient.",
    rating: 5,
    product: "Podcast Recording Kit",
    city: "Chennai, TN",
    rentalsCompleted: 31,
    memberSince: "2023",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

function FlippableTestimonialCard({ t }: { t: (typeof testimonials)[0] }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full min-h-[260px] cursor-pointer select-none group"
      style={{ perspective: "1000px" }}
      onClick={() => setIsFlipped((prev) => !prev)}
      title="Click card to flip for reviewer verification"
    >
      <div
        className="relative w-full h-full rounded-2xl transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* FRONT FACE */}
        <div
          className={cn(
            "spatial-card rounded-2xl p-6 flex flex-col justify-between bg-card border border-border transition-all duration-300 h-full w-full shadow-sm hover:border-primary/40 relative overflow-hidden",
            isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div>
            {/* Top Row: Quote & Rating */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <Quote className="h-5 w-5 text-muted-foreground opacity-60" />
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-foreground text-foreground"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/70 ml-2 flex items-center gap-1 group-hover:text-primary transition-colors">
                  <RotateCw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                </span>
              </div>
            </div>

            {/* Quote Text */}
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 font-normal">
              "{t.quote}"
            </p>

            {/* Product Badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1 text-xs font-medium bg-secondary text-foreground border border-border">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span>{t.product}</span>
            </div>
          </div>

          {/* User Avatar & Info */}
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {t.initials}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-foreground">
                  {t.name}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {t.role}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/60 font-semibold group-hover:text-primary transition-colors">
              Click to flip
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className={cn(
            "spatial-card absolute inset-0 rounded-2xl p-6 flex flex-col justify-between bg-card/95 backdrop-blur-xl border border-primary/40 shadow-2xl h-full w-full overflow-hidden",
            !isFlipped ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified
                Renter Profile
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <RotateCcw className="h-2.5 w-2.5" /> Flip back
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-extrabold text-primary">
                {t.initials}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{t.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {t.role} &bull; {t.city}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2 rounded-xl bg-secondary/80 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Identity KYC
                </span>
                <span className="text-xs font-extrabold text-emerald-500 font-display flex items-center gap-1">
                  <Check className="h-3 w-3" /> Govt Verified
                </span>
              </div>
              <div className="p-2 rounded-xl bg-secondary/80 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Leases Completed
                </span>
                <span className="text-xs font-extrabold text-foreground font-display">
                  {t.rentalsCompleted} Rentals
                </span>
              </div>
              <div className="p-2 rounded-xl bg-secondary/80 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Member Status
                </span>
                <span className="text-xs font-extrabold text-primary font-display">
                  Active Since {t.memberSince}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-secondary/80 border border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                  Escrow Rating
                </span>
                <span className="text-xs font-extrabold text-amber-500 font-display">
                  5.0 ★ Star Rating
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/40">
            Click anywhere to return to review
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 overflow-hidden bg-[#070A10] text-white border-t border-white/10"
    >
      {/* Background Liquid Ambient Lighting */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-bold text-amber-400 tracking-wider uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified Member Feedback</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
            Trusted by India's Top{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-cyan-400">
              Creators & Producers.
            </span>
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto font-medium">
            Real feedback from verified filmmakers, drone operators, and lenders. Click any card to inspect biometric verification.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -6 }}
            >
              <FlippableTestimonialCard t={t} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
