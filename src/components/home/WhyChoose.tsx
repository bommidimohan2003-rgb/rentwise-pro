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
    <section className="bg-[#F7F9FB] border-t border-b border-slate-200/80 py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trustItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-[#FF5A5F]/10 text-[#FF5A5F] flex items-center justify-center shrink-0">
                  <IconComp className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-base text-[#0B2545]">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
