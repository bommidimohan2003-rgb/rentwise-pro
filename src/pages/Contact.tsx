import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <MainLayout>
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-16">
        <span className="text-xs uppercase tracking-wider text-primary font-semibold">Get in touch</span>
        <h1 className="mt-3 text-4xl md:text-6xl font-bold">We'd love to hear from you.</h1>
        <p className="mt-4 text-muted-foreground text-lg">Questions, feedback, partnerships — reach out anytime.</p>

        <div className="mt-12 grid lg:grid-cols-[1fr_360px] gap-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="card-premium p-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" required />
              <Input label="Last name" required />
            </div>
            <Input label="Email" type="email" required />
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea rows={5} required className="mt-1.5 w-full rounded-xl border border-border bg-card p-4 outline-none focus:border-primary" placeholder="How can we help?" />
            </div>
            <Button type="submit" size="lg">{sent ? "Message sent ✓" : "Send message"}</Button>
          </form>

          <aside className="space-y-4">
            <div className="card-premium p-6">
              <Mail className="h-5 w-5 text-primary" />
              <div className="mt-2 font-medium">Email</div>
              <a href="mailto:hi@techrent.io" className="text-sm text-muted-foreground hover:text-foreground">hi@techrent.io</a>
            </div>
            <div className="card-premium p-6">
              <Phone className="h-5 w-5 text-primary" />
              <div className="mt-2 font-medium">Phone</div>
              <a href="tel:+15551234567" className="text-sm text-muted-foreground hover:text-foreground">+1 (555) 123-4567</a>
            </div>
            <div className="card-premium p-6">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="mt-2 font-medium">Office</div>
              <p className="text-sm text-muted-foreground">548 Market St, San Francisco</p>
            </div>
          </aside>
        </div>
      </section>
    </MainLayout>
  );
}
