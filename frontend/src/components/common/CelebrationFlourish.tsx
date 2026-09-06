import React from "react";
import { motion } from "framer-motion";
import { Check, CheckCircle2 } from "lucide-react";

interface CelebrationFlourishProps {
  productImage: string;
  productTitle: string;
}

export function CelebrationFlourish({
  productImage,
  productTitle,
}: CelebrationFlourishProps) {
  return (
    <div className="relative py-4 flex flex-col items-center justify-center">
      {/* Background Pulse Glow */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: [0.8, 1.25, 1], opacity: [0.2, 0.8, 0.4] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute w-44 h-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none"
      />

      {/* Booked Product Photo Settle Animation */}
      <motion.div
        initial={{ scale: 0.7, y: -20, rotateX: 25, opacity: 0 }}
        animate={{ scale: 1, y: 0, rotateX: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 18,
          delay: 0.1,
        }}
        className="relative w-28 h-28 rounded-2xl overflow-hidden spatial-overlay border-2 border-emerald-500/40 shadow-2xl p-1 bg-card/80 z-10"
      >
        <img
          src={productImage}
          alt={productTitle}
          className="w-full h-full object-cover rounded-xl"
        />
        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
          <Check className="h-3.5 w-3.5" />
        </div>
      </motion.div>

      {/* Confetti Sparkle Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Rental Reserved Successfully</span>
      </motion.div>
    </div>
  );
}
