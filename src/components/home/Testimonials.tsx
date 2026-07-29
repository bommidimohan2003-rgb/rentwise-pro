import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance Photographer",
    avatar: "👩‍🎨",
    quote:
      "Payent saved me thousands on camera gear. I rented a professional camera for a wedding shoot at a fraction of the cost. The lender was super reliable and delivery was on time!",
    rating: 5,
    product: "Camera",
  },
  {
    name: "Rohan Mehta",
    role: "Content Creator",
    avatar: "🧑‍💻",
    quote:
      "Rented a drone for my travel series. The booking process was instant, payments were secure, and the drone arrived perfectly packed. 10/10 experience!",
    rating: 5,
    product: "Drone",
  },
  {
    name: "Anjali Nair",
    role: "Event Planner",
    avatar: "👩‍💼",
    quote:
      "Used Payent to rent a 4K projector and portable speakers for a corporate event. Everything worked flawlessly. The 24/7 support was incredibly helpful!",
    rating: 5,
    product: "4K Laser Projector",
  },
  {
    name: "Vikram Patel",
    role: "Game Developer",
    avatar: "🧑‍🔬",
    quote:
      "Got a PS5 and gaming setup for two weeks while testing my game on real hardware. Payent made the whole process incredibly easy. Verified users, no sketchy dealings.",
    rating: 5,
    product: "PlayStation 5 + Controller",
  },
  {
    name: "Sana Khan",
    role: "Architecture Student",
    avatar: "👩‍🚀",
    quote:
      "Rented a professional laptop with AutoCAD for my final project. Way cheaper than buying, and the lender even helped with initial setup tips. Amazing platform!",
    rating: 5,
    product: "Dell XPS 15 + CAD Software",
  },
  {
    name: "Arjun Singh",
    role: "Startup Founder",
    avatar: "👨‍💼",
    quote:
      "We rent recording equipment for our podcast studio instead of buying. Payent has helped us scale content production without huge upfront costs. Game-changer!",
    rating: 5,
    product: "Podcast Recording Kit",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden bg-background text-foreground border-t border-border"
    >
      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#FF5A5F_1px,transparent_1px)] [background-size:32px_32px] opacity-5 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-3"
        >
          <p className="text-xs font-extrabold tracking-widest text-[#FF5A5F] uppercase">
            TESTIMONIALS
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-display">
            Loved by <span className="text-[#FF5A5F]">50,000+</span> creators
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto font-normal">
            Real stories from renters who discovered a smarter way to access premium gear.
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
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl p-7 flex flex-col bg-card border border-border hover:border-[#FF5A5F]/40 transition-all duration-300 shadow-xl"
            >
              {/* Quote Icon */}
              <Quote className="h-6 w-6 mb-4 text-[#FF5A5F] opacity-70 group-hover:opacity-100 transition-opacity" />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote Text */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic group-hover:text-foreground transition-colors">
                "{t.quote}"
              </p>

              {/* Product Badge */}
              <div className="mt-4 inline-flex items-center self-start rounded-full px-3 py-1 text-[11px] font-bold bg-[#FF5A5F]/10 text-[#FF5A5F] border border-[#FF5A5F]/20">
                🔖 {t.product}
              </div>

              {/* User Avatar & Info */}
              <div className="mt-5 pt-5 border-t border-border flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center text-xl shrink-0">
                  {t.avatar}
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground font-medium">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
