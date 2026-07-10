import { Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center border border-border hero-gradient">
        <h2 className="text-3xl md:text-4xl font-bold">Stay in the loop</h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Get weekly picks of new arrivals, seasonal deals, and pro creator tips.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setDone(true);
          }}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <Input
            type="email"
            placeholder="you@work.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" size="md">
            {done ? "Subscribed!" : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
}
