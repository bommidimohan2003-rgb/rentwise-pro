import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Freelance Photographer",
    avatar: "👩‍🎨",
    quote:
      "Payent saved me thousands on camera gear. I rented a Sony A7 IV for a wedding shoot at a fraction of the cost. The lender was super reliable and delivery was on time!",
    rating: 5,
    product: "Sony A7 IV Camera",
    gradient: "from-violet-900/60 to-purple-900/40",
    accent: "rgba(139,92,246,0.4)",
  },
  {
    name: "Rohan Mehta",
    role: "Content Creator",
    avatar: "🧑‍💻",
    quote:
      "Rented a DJI Mavic 3 for my travel series. The booking process was instant, payments were secure, and the drone arrived perfectly packed. 10/10 experience!",
    rating: 5,
    product: "DJI Mavic 3 Drone",
    gradient: "from-blue-900/60 to-cyan-900/40",
    accent: "rgba(59,130,246,0.4)",
  },
  {
    name: "Anjali Nair",
    role: "Event Planner",
    avatar: "👩‍💼",
    quote:
      "Used Payent to rent a 4K projector and portable speakers for a corporate event. Everything worked flawlessly. The 24/7 support was incredibly helpful!",
    rating: 5,
    product: "4K Laser Projector",
    gradient: "from-pink-900/60 to-rose-900/40",
    accent: "rgba(236,72,153,0.4)",
  },
  {
    name: "Vikram Patel",
    role: "Game Developer",
    avatar: "🧑‍🔬",
    quote:
      "Got a PS5 and gaming setup for two weeks while testing my game on real hardware. Payent made the whole process incredibly easy. Verified users, no sketchy dealings.",
    rating: 5,
    product: "PlayStation 5 + Controller",
    gradient: "from-emerald-900/60 to-teal-900/40",
    accent: "rgba(16,185,129,0.4)",
  },
  {
    name: "Sana Khan",
    role: "Architecture Student",
    avatar: "👩‍🚀",
    quote:
      "Rented a professional laptop with AutoCAD for my final project. Way cheaper than buying, and the lender even helped with initial setup tips. Amazing platform!",
    rating: 5,
    product: "Dell XPS 15 + CAD Software",
    gradient: "from-amber-900/60 to-orange-900/40",
    accent: "rgba(245,158,11,0.4)",
  },
  {
    name: "Arjun Singh",
    role: "Startup Founder",
    avatar: "👨‍💼",
    quote:
      "We rent recording equipment for our podcast studio instead of buying. Payent has helped us scale content production without huge upfront costs. Game-changer!",
    rating: 5,
    product: "Podcast Recording Kit",
    gradient: "from-indigo-900/60 to-violet-900/40",
    accent: "rgba(99,102,241,0.4)",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

export function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0118 0%, #06010f 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(139,92,246,0.07), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{
              background: "rgba(236,72,153,0.1)",
              border: "1px solid rgba(236,72,153,0.3)",
            }}
          >
            <span className="text-xs font-semibold text-pink-400 tracking-wider uppercase">
              Testimonials
            </span>
          </div>
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #f9a8d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Loved by 50,000+ creators
          </h2>
          <p className="mt-4 text-slate-400 text-base max-w-lg mx-auto">
            Real stories from renters who discovered a smarter way to access premium gear.
          </p>
        </motion.div>

        {/* Cards */}
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
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="group relative rounded-2xl p-7 flex flex-col overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Hover gradient bg */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />
              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ border: `1px solid ${t.accent}` }}
              />

              {/* Quote icon */}
              <Quote
                className="relative z-10 h-6 w-6 mb-4 opacity-30 group-hover:opacity-60 transition-opacity"
                style={{ color: t.accent.replace("0.4", "1") }}
              />

              {/* Stars */}
              <div className="relative z-10 flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="relative z-10 text-sm text-slate-400 leading-relaxed flex-1 italic group-hover:text-slate-300 transition-colors">
                "{t.quote}"
              </p>

              {/* Product badge */}
              <div
                className="relative z-10 mt-4 inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: t.accent.replace("0.4", "0.12"),
                  color: t.accent.replace("0.4", "1"),
                  border: `1px solid ${t.accent.replace("0.4", "0.3")}`,
                }}
              >
                🔖 {t.product}
              </div>

              {/* User */}
              <div className="relative z-10 mt-5 pt-5 border-t border-white/5 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    background: t.accent.replace("0.4", "0.15"),
                    border: `1px solid ${t.accent.replace("0.4", "0.3")}`,
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
