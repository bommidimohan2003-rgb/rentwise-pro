import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does renting on Payent work?",
    answer:
      "Browse listings, choose your rental period, and complete checkout. Once confirmed, the lender ships or shares the item as per the listing details.",
  },
  {
    question: "Is insurance included?",
    answer:
      "Yes. Every verified rental is protected with built-in safeguards and transparent lender policies to help you rent with confidence.",
  },
  {
    question: "Can I list my own items?",
    answer:
      "Absolutely. The Become a Lender flow lets you publish your items and start earning from your unused gear or furniture.",
  },
  {
    question: "What if my order is delayed or damaged?",
    answer:
      "You can contact support and use the platform’s help flow to resolve booking issues quickly with the lender or support team.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 md:px-6 py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
        <p className="mt-3 text-muted-foreground">Everything you need to know before your next rental.</p>
      </div>

      <div className="rounded-[28px] border border-border bg-card/80 p-2 shadow-[0_18px_40px_-24px_rgba(255,79,154,0.35)] backdrop-blur-sm">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="rounded-2xl border border-border/70 bg-white/80 px-2 data-[state=open]:bg-white"
            >
              <AccordionTrigger className="px-4 py-4 text-left text-sm font-semibold text-foreground hover:text-pink-600">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
