import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star, Tag } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance Photographer",
    initials: "PS",
    quote:
      "Payent saved me thousands on camera gear. I rented a 4K cinema camera for a weekend wedding shoot at a fraction of buying cost. Smooth process and verified lender!",
    rating: 5,
    product: "Camera Kit",
  },
  {
    name: "Rohan Mehta",
    role: "Content Creator",
    initials: "RM",
    quote:
      "Rented a drone for my travel series. Booking was instant, security flow gave me peace of mind, and the drone arrived in perfect working condition.",
    rating: 5,
    product: "Aerial Cine Drone",
  },
  {
    name: "Anjali Nair",
    role: "Event Producer",
    initials: "AN",
    quote:
      "Used Payent to rent a 4K projector and audio setup for a client showcase. Everything worked flawlessly on site. Highly recommended for creative teams.",
    rating: 5,
    product: "4K Laser Projector",
  },
  {
    name: "Vikram Patel",
    role: "Game Developer",
    initials: "VP",
    quote:
      "Rented a high-end workstation laptop for two weeks while testing hardware builds. Extremely straightforward, transparent pricing, and zero hassle.",
    rating: 5,
    product: "Pro Workstation Laptop",
  },
  {
    name: "Sana Khan",
    role: "Architecture Designer",
    initials: "SK",
    quote:
      "Needed a specialized CAD machine for a project deadline. Way cheaper than buying, and the owner was super responsive with handover coordination.",
    rating: 5,
    product: "CAD Workstation",
  },
  {
    name: "Arjun Singh",
    role: "Studio Producer",
    initials: "AS",
    quote:
      "We rent secondary podcast mics and lighting rigs when scaling up production. Payent has made gear access predictable and efficient.",
    rating: 5,
    product: "Podcast Recording Kit",
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

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-20 px-4 sm:px-6 overflow-hidden bg-background text-foreground border-t border-border"
    >
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 space-y-3"
        >
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            COMMUNITY REVIEWS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-display">
            Trusted by creators &amp; production teams
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto font-normal">
            Real feedback from verified renters and lenders using Payent for
            their projects.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              className="group spatial-card rounded-2xl p-6 flex flex-col bg-card border border-border transition-all duration-300"
            >
              {/* Top Row: Quote & Rating */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <Quote className="h-5 w-5 text-muted-foreground opacity-60" />
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-foreground text-foreground"
                    />
                  ))}
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

              {/* User Avatar & Info */}
              <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-3">
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
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
