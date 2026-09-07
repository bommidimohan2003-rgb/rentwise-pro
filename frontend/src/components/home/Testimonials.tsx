import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  content: string;
}

const testimonialsList: TestimonialItem[] = [
  {
    id: "1",
    name: "Rahul Mehta",
    role: "Filmmaker",
    location: "Mumbai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5.0,
    content: "PAYENT made it so easy to get a Sony FX3 for my shoot. Smooth process, great support!",
  },
  {
    id: "2",
    name: "Sneha Iyer",
    role: "Content Creator",
    location: "Bengaluru",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 4.8,
    content: "Found the perfect lighting setup at a great price. Highly recommended for creators!",
  },
  {
    id: "3",
    name: "Aditya Varma",
    role: "Photographer",
    location: "Hyderabad",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 4.9,
    content: "Reliable, affordable and professional. PAYENT is a game-changer for indie creators.",
  },
];

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white dark:bg-[#05090D] py-14 sm:py-18 text-neutral-900 dark:text-white border-b border-black/10 dark:border-white/10 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
                What Creators Say
              </h2>
              <span className="inline-block w-8 h-[3px] bg-[#FF1744] rounded-full" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-[#A8B1BA]">
              Real experiences from our community.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/about"
              className="text-xs sm:text-sm font-semibold text-neutral-600 dark:text-[#A8B1BA] hover:text-black dark:hover:text-white flex items-center gap-1.5 transition-colors group"
            >
              <span>View All Reviews</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="h-8 w-8 rounded-full border border-black/10 dark:border-white/15 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#0D151D] dark:hover:bg-[#111B24] flex items-center justify-center text-neutral-800 dark:text-white transition-colors cursor-pointer"
                aria-label="Previous reviews"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="h-8 w-8 rounded-full border border-black/10 dark:border-white/15 bg-neutral-100 hover:bg-neutral-200 dark:bg-[#0D151D] dark:hover:bg-[#111B24] flex items-center justify-center text-neutral-800 dark:text-white transition-colors cursor-pointer"
                aria-label="Next reviews"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div
          ref={scrollRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {testimonialsList.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl bg-neutral-50 dark:bg-[#0D151D] border border-black/10 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-md hover:border-black/20 dark:hover:border-white/20 transition-all text-left"
            >
              {/* User Header with Rating */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-xl object-cover border border-black/10 dark:border-white/10"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
                      {t.name}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-[#A8B1BA] mt-0.5">
                      {t.role}, {t.location}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white ml-1">
                    {t.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Review Quote */}
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-[#A8B1BA] leading-relaxed font-normal">
                "{t.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
