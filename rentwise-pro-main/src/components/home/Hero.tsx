import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/common/SearchBar";

const rotating = ["Electronics", "Tools", "Gaming", "Furniture"];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotating.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1800&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(28,12,42,0.86),rgba(87,18,81,0.45),rgba(0,0,0,0.38))]" />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 md:px-6 md:pb-32 md:pt-14">
        <div className="relative min-h-[680px] overflow-hidden rounded-b-[40px] rounded-t-[32px] border border-white/15 bg-[#0f0a16]/70 px-4 py-12 shadow-[0_30px_100px_-40px_rgba(179,75,195,0.75)] md:px-8 md:py-16">
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md"
            >
              <Sparkles className="h-3 w-3 text-pink-200" />
              Premium electronics and tools rental marketplace
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl"
            >
              Browse Electronics,
              <br />
              Tools & More on Rent
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mt-5 max-w-2xl text-base text-white/85 md:text-lg"
            >
              Rent electronics, cameras, tools, gaming consoles, furniture, and more from trusted
              local lenders.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-10 flex justify-center"
            >
              <div className="w-full max-w-3xl rounded-[24px] bg-white p-2 shadow-[0_20px_60px_-18px_rgba(70,9,89,0.65)]">
                <SearchBar />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-3"
            >
              <Link
                to="/categories"
                className="btn-gradient inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold"
              >
                Search Rentals <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/become-lender"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20"
              >
                Become a Lender
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-white/80"
            >
              <span className="rounded-full bg-white/10 px-3 py-1">Verified users</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Same-day delivery</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Flexible pick-up</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-white/75"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-full bg-white/10 px-3 py-1"
                >
                  Trending in {rotating[index]}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
