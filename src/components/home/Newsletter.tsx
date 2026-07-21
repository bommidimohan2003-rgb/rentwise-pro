import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Mail, ArrowRight, Sparkles } from "lucide-react";

export function Newsletter() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  return (
    <section
      id="newsletter"
      ref={ref}
      className="relative py-20 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0118 0%, #080114 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(139,92,246,0.06), transparent)",
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl p-10 md:p-14 text-center overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(30px)",
          }}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.1), transparent)",
            }}
          />

          {/* Badge */}
          <div
            className="relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 tracking-wider uppercase">
              Newsletter
            </span>
          </div>

          <h2
            className="relative z-10 text-3xl sm:text-4xl font-extrabold tracking-tight mb-3"
            style={{
              background: "linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Stay in the loop
          </h2>
          <p className="relative z-10 text-sm text-slate-400 mb-8 max-w-md mx-auto">
            Weekly picks of new arrivals, seasonal deals, and pro creator tips — delivered to your
            inbox.
          </p>

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#6ee7b7",
              }}
            >
              <span className="text-lg">🎉</span>
              You're subscribed! Welcome aboard.
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="relative z-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div
                className="flex-1 flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.35)",
                }}
              >
                Subscribe
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
