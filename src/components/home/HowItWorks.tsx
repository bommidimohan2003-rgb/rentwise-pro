import { motion } from "framer-motion";
import { Search, Eye, CreditCard, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse & Search",
    body: "Navigate to the categories page and search for tech gear or click on specific categories like Cameras, Laptops, or Drones.",
    linkText: "Explore Marketplace",
    linkTo: "/categories",
  },
  {
    number: "02",
    icon: Eye,
    title: "Select & Configure",
    body: "Click on any product to view details, review specifications, pricing, and availability. Then, click 'Rent now' to configure dates.",
    linkText: "View Featured",
    linkTo: "/categories",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Reserve & Pay",
    body: "On Checkout, select your start and end dates. Proceed to Payment, submit your payment securely, and check active rentals on your Dashboard.",
    linkText: "Go to Dashboard",
    linkTo: "/dashboard",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20 border-t border-border/50">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-wider font-semibold text-primary">
          Simple Process
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold mt-2 tracking-tight">
          How renting works on Payent
        </h2>
        <p className="mt-4 text-muted-foreground text-base">
          Rent premium tech gear from verified owners in three simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* Timeline connector lines (visible only on large screens) */}
        <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/35 via-primary/5 to-primary/35 -translate-y-12 -z-10" />

        {steps.map((st, i) => (
          <motion.div
            key={st.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, type: "spring", damping: 20 }}
            className="card-premium p-8 relative flex flex-col justify-between group h-full hover:border-primary/45 transition-all duration-300"
          >
            <div>
              {/* Step indicator */}
              <div className="flex justify-between items-start">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 grid place-items-center group-hover:scale-110 transition-transform duration-300">
                  <st.icon className="h-5 w-5" />
                </div>
                <span className="text-4xl font-extrabold text-muted-foreground/15 font-mono select-none">
                  {st.number}
                </span>
              </div>

              {/* Title & Body */}
              <h3 className="font-bold text-xl mt-6 group-hover:text-primary transition-colors">
                {st.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{st.body}</p>
            </div>

            {/* CTA Link */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <Link
                to={st.linkTo}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group/link hover:underline"
              >
                {st.linkText}
                <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
