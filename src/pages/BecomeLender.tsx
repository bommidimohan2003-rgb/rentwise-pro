import { DollarSign, Shield, Sparkles, Upload } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

const perks = [
  { icon: DollarSign, title: "Earn passive income", body: "Turn idle gear into up to $3k/month." },
  { icon: Shield, title: "$50k protection", body: "Every rental fully insured against damage." },
  { icon: Sparkles, title: "Instant listing", body: "List in under 2 minutes with smart suggestions." },
];

export default function BecomeLender() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);

  return (
    <MainLayout>
      <section className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-wider text-primary font-semibold">For lenders</span>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">Make money from gear you already own.</h1>
          <p className="mt-4 text-muted-foreground text-lg">Join thousands of lenders earning on TechRent.</p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {perks.map((p) => (
            <div key={p.title} className="card-premium p-6">
              <div className="h-11 w-11 rounded-xl btn-gradient grid place-items-center mb-4">
                <p.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 card-premium p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold">List your first item</h2>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
              setTimeout(() => navigate({ to: "/dashboard" }), 1200);
            }}
          >
            <Input label="Item title" placeholder="e.g. Sony A7 IV Mirrorless Camera" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Category" placeholder="Cameras" required />
              <Input label="Price / day" type="number" placeholder="65" required />
            </div>
            <div>
              <label className="text-sm font-medium">Photos</label>
              <div className="mt-1.5 border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Drag files or click to upload</p>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full">{done ? "Listing submitted ✓" : "Submit listing"}</Button>
          </form>
        </div>
      </section>
    </MainLayout>
  );
}
