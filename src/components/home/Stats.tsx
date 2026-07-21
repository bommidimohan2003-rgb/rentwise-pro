import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface StatItem {
  value: string;
  numericValue: number;
  suffix: string;
  label: string;
  icon: string;
  gradient: string;
}

const stats: StatItem[] = [
  { value: "10,000+", numericValue: 10000, suffix: "+", label: "Total Rentals", icon: "📦", gradient: "from-violet-500 to-purple-600" },
  { value: "5,000+", numericValue: 5000, suffix: "+", label: "Happy Users", icon: "👥", gradient: "from-blue-500 to-cyan-500" },
  { value: "500+", numericValue: 500, suffix: "+", label: "Verified Lenders", icon: "✅", gradient: "from-emerald-500 to-teal-500" },
  { value: "99%", numericValue: 99, suffix: "%", label: "Satisfaction Rate", icon: "⭐", gradient: "from-amber-500 to-orange-500" },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (inView) {
      animate(motionVal, target, { duration: 2.5, ease: "easeOut" });
    }
  }, [inView, motionVal, target]);

  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      const rounded = Math.round(v);
      setDisplay(rounded >= 1000 ? `${(rounded / 1000).toFixed(1)}k` : String(rounded));
    });
    return unsub;
  }, [spring]);

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  );
}

export function Stats() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="stats"
      ref={ref}
      className="relative py-24 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #06010f 0%, #080114 100%)" }}
    >
      {/* Divider glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.4), transparent)" }}
      />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Numbers that speak for us
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            Trusted by thousands of renters and lenders across the country.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative rounded-2xl p-7 text-center overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.12), transparent 70%)",
                  border: "1px solid rgba(139,92,246,0.2)",
                }}
              />

              {/* Icon */}
              <div className="text-3xl mb-4">{s.icon}</div>

              {/* Number */}
              <div
                className={`text-4xl sm:text-5xl font-extrabold bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`}
              >
                <AnimatedCounter target={s.numericValue} suffix={s.suffix} />
              </div>

              {/* Label */}
              <div className="mt-2 text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
