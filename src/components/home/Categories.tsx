<<<<<<< HEAD
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { categories, products } from "@/utils/mockData";
import type { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  index: number;
}

function CategoryCard({ category: c, index: i }: CategoryCardProps) {
  const Icon = (Icons[c.icon as keyof typeof Icons] ?? Icons.Package) as Icons.LucideIcon;

  // Filter products belonging to this category
  const catProducts = products.filter((p) => p.category === c.id);

  // Determine default background image (use category image or fall back to the first product image)
  const defaultBg = c.image || catProducts[0]?.image || "";
  const [bgImage, setBgImage] = useState(defaultBg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
    >
      <Link
        to="/categories"
        search={{ cat: c.id } as never}
        onMouseLeave={() => setBgImage(defaultBg)}
        className="relative overflow-hidden h-[175px] rounded-2xl group flex flex-col justify-end p-5 border border-border/40 shadow-sm"
      >
        {/* Category background image */}
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        {/* Gradient dark overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:via-black/55" />

        {/* Floating icon badge */}
        <div className="absolute top-4 right-4 h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 grid place-items-center transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 z-10">
          <Icon className="h-4 w-4 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full">
          <h3 className="font-bold text-white text-lg tracking-wide">{c.name}</h3>

          <div className="flex items-end justify-between mt-1 gap-2">
            <p className="text-xs text-white/70 font-medium pb-1">{c.count} listings</p>

            {/* Overlapping product model thumbnails */}
            {catProducts.length > 0 && (
              <div
                className="flex -space-x-2 overflow-hidden items-center pb-0.5"
                onClick={(e) => {
                  // Prevent link navigation when clicking product icons specifically
                  e.stopPropagation();
                }}
              >
                {catProducts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBgImage(p.image);
                    }}
                    title={p.title}
                    className="relative h-6 w-6 rounded-full ring-2 ring-black/40 overflow-hidden cursor-pointer transition-transform hover:scale-125 hover:z-20"
                  >
                    <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                  </div>
                ))}
                {catProducts.length > 3 && (
                  <div
                    title={`${catProducts.length - 3} more models`}
                    className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-black/40 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/90 select-none"
                  >
                    +{catProducts.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function Categories() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Browse categories</h2>
          <p className="mt-2 text-muted-foreground">
            Explore trending gear across popular categories.
          </p>
        </div>
        <Link to="/categories" className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} category={c} index={i} />
        ))}
=======
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import laptopImg from "@/assets/images/laptop.png";
import cameraImg from "@/assets/images/camera.png";
import droneImg from "@/assets/images/drone.png";
import bikeImg from "@/assets/images/bike.png";
import toolImg from "@/assets/images/tool.png";

const categories = [
  {
    id: "laptops",
    name: "Laptops",
    image: laptopImg,
    desc: "MacBooks, ThinkPads & more",
    color: "from-violet-600/30 to-indigo-700/20",
    border: "rgba(139,92,246,0.25)",
  },
  {
    id: "cameras",
    name: "Cameras",
    image: cameraImg,
    desc: "DSLRs, Mirrorless, Cinema",
    color: "from-blue-600/30 to-cyan-700/20",
    border: "rgba(59,130,246,0.25)",
  },
  {
    id: "drones",
    name: "Drones",
    image: droneImg,
    desc: "DJI, Autel & Pro aerial kits",
    color: "from-sky-600/30 to-blue-700/20",
    border: "rgba(14,165,233,0.25)",
  },
  {
    id: "gaming",
    name: "Gaming Consoles",
    image:
      "https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?auto=format&fit=crop&w=200&h=200&q=80",
    desc: "PS5, Xbox, Nintendo Switch",
    color: "from-pink-600/30 to-rose-700/20",
    border: "rgba(236,72,153,0.25)",
  },
  {
    id: "tools",
    name: "Power Tools",
    image: toolImg,
    desc: "Drills, Saws, Heavy machinery",
    color: "from-amber-600/30 to-orange-700/20",
    border: "rgba(245,158,11,0.25)",
  },
  {
    id: "furniture",
    name: "Furniture",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&h=200&q=80",
    desc: "Event chairs, tables & décor",
    color: "from-emerald-600/30 to-teal-700/20",
    border: "rgba(16,185,129,0.25)",
  },
  {
    id: "bikes",
    name: "Bikes & Scooters",
    image: bikeImg,
    desc: "E-bikes, mountain bikes & more",
    color: "from-lime-600/30 to-green-700/20",
    border: "rgba(132,204,22,0.25)",
  },
  {
    id: "projectors",
    name: "Projectors",
    image:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=200&h=200&q=80",
    desc: "4K, laser, portable projectors",
    color: "from-purple-600/30 to-fuchsia-700/20",
    border: "rgba(168,85,247,0.25)",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function Categories() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="categories"
      ref={ref}
      className="relative py-28 px-4 sm:px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #080114 0%, #06010f 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.06), transparent)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-6"
        >
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
                Browse
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #ffffff 30%, #c4b5fd 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Explore categories
            </h2>
            <p className="mt-3 text-slate-400">
              Trending gear across every popular category, all in one place.
            </p>
          </div>
          <Link
            to="/categories"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
          >
            View all categories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={cardVariants}>
              <Link
                to="/categories"
                search={{ cat: cat.id } as never}
                className="group relative flex flex-col items-start p-6 rounded-2xl overflow-hidden h-[160px] transition-all duration-500"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.07)`,
                }}
              >
                {/* Gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Glow border on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ border: `1px solid ${cat.border}`, boxShadow: `0 0 20px ${cat.border} inset` }}
                />

                {/* Top: real image */}
                <motion.div
                  className="relative z-10 mb-auto h-12 w-12 rounded-xl overflow-hidden bg-white/5 border border-white/10"
                  whileHover={{ rotate: [0, -6, 6, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </motion.div>

                {/* Bottom: name & desc */}
                <div className="relative z-10 mt-4">
                  <h3 className="font-bold text-sm text-white group-hover:text-white transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">
                    {cat.desc}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight
                  className="absolute bottom-4 right-4 h-4 w-4 text-slate-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
>>>>>>> 0197521 (Redesign Payent frontend UI)
      </div>
    </section>
  );
}
