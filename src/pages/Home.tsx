import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
<<<<<<< HEAD
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Testimonials } from "@/components/home/Testimonials";
=======
import { Features } from "@/components/home/Features";
import { Categories } from "@/components/home/Categories";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Testimonials } from "@/components/home/Testimonials";
import { CallToAction } from "@/components/home/CallToAction";
>>>>>>> 0197521 (Redesign Payent frontend UI)
import { Newsletter } from "@/components/home/Newsletter";
import { MainLayout } from "@/layouts/MainLayout";
import { JsonLd } from "@/components/common/JsonLd";

const orgSchema = {
  "@type": "Organization",
  name: "Payent",
  url: "https://payent.com",
  logo: "https://payent.com/favicon-512.png",
  sameAs: [
    "https://twitter.com/payent",
    "https://instagram.com/payent",
    "https://github.com/payent",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@payent.com",
    contactType: "customer support",
  },
};

const websiteSchema = {
  "@type": "WebSite",
  name: "Payent",
  url: "https://payent.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://payent.com/categories?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <MainLayout>
      <JsonLd schema={orgSchema} />
      <JsonLd schema={websiteSchema} />
<<<<<<< HEAD
      <Hero />
      <Stats />
      <Categories />
      <FeaturedProducts />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
=======
      {/* Full-screen animated hero with floating gadgets */}
      <Hero />
      {/* Animated counter stats */}
      <Stats />
      {/* Glassmorphism feature cards */}
      <Features />
      {/* Category cards grid */}
      <Categories />
      {/* 3-step how it works */}
      <HowItWorks />
      {/* Why choose us tiles */}
      <WhyChoose />
      {/* Testimonial review cards */}
      <Testimonials />
      {/* Large gradient CTA */}
      <CallToAction />
      {/* Newsletter signup */}
>>>>>>> 0197521 (Redesign Payent frontend UI)
      <Newsletter />
    </MainLayout>
  );
}
