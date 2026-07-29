import { motion } from "framer-motion";
import { ShieldCheck, UserCheck, Headphones } from "lucide-react";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    subtitle: "Safe & encrypted transactions",
  },
  {
    icon: UserCheck,
    title: "Verified Users",
    subtitle: "Trusted community of renters",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    subtitle: "We're here to help anytime",
  },
];

export function WhyChoose() {
  return (
    <section className="bg-background border-t border-b border-border py-8 text-foreground">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trustItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="h-10 w-10 rounded-xl bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center shrink-0">
                  <IconComp className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-sm text-foreground">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
