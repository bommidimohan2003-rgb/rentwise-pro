import { ArrowRight, Headset, Lock, Mail, Shield, Star, Tag, Truck, Zap } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import newsletterBg from "@/assets/newsletter-bg.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const trustBadges = [
  {
    icon: Shield,
    title: "Verified Products",
    description: "All items are quality checked",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "100% safe and trusted transactions",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick doorstep delivery",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    description: "We're here to help anytime",
  },
] as const;

const featureTags = [
  { icon: Tag, label: "Exclusive Deals" },
  { icon: Zap, label: "New Arrivals" },
  { icon: Star, label: "Creator Tips" },
] as const;

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const isValidEmail = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      setSubscribed(false);
      return;
    }

    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      setSubscribed(false);
      return;
    }

    setError("");
    setSubscribed(true);
    console.log("Newsletter signup submitted:", email.trim());
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${newsletterBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-purple-950/50 to-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_bottom,rgba(236,72,153,0.24),transparent_55%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[820px] max-w-7xl items-center justify-center px-4 py-16 md:min-h-[900px] md:px-6 md:py-20">
        <div className="w-full max-w-[700px] rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white shadow-[0_12px_30px_-10px_rgba(236,72,153,0.8)]">
            <Mail className="h-7 w-7" />
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Stay Updated with
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                the Latest Rentals
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-sm leading-6 text-white/70 md:text-base">
              Get notified about new electronics, tools, cameras, gaming consoles, exclusive rental
              offers, and special discounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-[600px]">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your email address"
                  className="h-14 rounded-full border-0 bg-white pl-11 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:ring-0"
                />
              </div>
              <Button
                type="submit"
                className="h-14 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-[0_18px_45px_-18px_rgba(236,72,153,0.85)] hover:from-pink-600 hover:to-fuchsia-700"
              >
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
            {subscribed ? (
              <p className="mt-3 text-sm text-emerald-200">Thanks for subscribing. We’ll keep you posted.</p>
            ) : null}
          </form>

          <div className="mt-7 flex flex-col items-center justify-center gap-2 border-t border-white/10 pt-5 md:flex-row md:gap-0">
            {featureTags.map((tag, index) => {
              const Icon = tag.icon;
              return (
                <div
                  key={tag.label}
                  className={cn(
                    "flex items-center gap-2 text-sm text-white/80",
                    index > 0 && "md:border-l md:border-white/10 md:pl-4",
                  )}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-pink-500/20 text-pink-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{tag.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60">
            <Shield className="h-3.5 w-3.5 text-pink-200" />
            <span>No spam. Unsubscribe anytime.</span>
          </div>
        </div>

        <div className="mt-8 w-full rounded-[24px] bg-white px-4 py-6 md:px-8 md:py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustBadges.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl px-2 py-2">
                  <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
