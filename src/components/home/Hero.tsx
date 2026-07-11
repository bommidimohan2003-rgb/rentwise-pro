import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SearchBar } from "@/components/common/SearchBar";

const rotating = ["Cameras", "Drones", "Laptops", "Bikes", "Tools", "Power Banks"];

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
      <div className="absolute inset-0 hero-gradient" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          The largest peer-to-peer tech rental marketplace
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Rent premium{" "}
          <span className="relative inline-block min-w-[180px] sm:min-w-[320px] text-left h-[1.1em] align-bottom overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="absolute left-0 right-0 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              >
                {rotating[index]}
              </motion.span>
            </AnimatePresence>
          </span>
          <br />
          for a fraction of the cost.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground"
        >
          From flagship cameras to pro-grade drones — access the gear you need, whenever you need
          it. Insured, verified, and delivered to your door.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex justify-center"
        >
          <SearchBar />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/categories"
            className="btn-gradient rounded-full h-12 px-6 inline-flex items-center gap-2 font-medium"
          >
            Browse Marketplace <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/become-lender"
            className="rounded-full h-12 px-6 inline-flex items-center gap-2 font-medium border border-border hover:bg-secondary"
          >
            List your gear
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
