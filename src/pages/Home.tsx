import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyChoose } from "@/components/home/WhyChoose";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";
import { MainLayout } from "@/layouts/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <Hero />
      <Stats />
      <Categories />
      <FeaturedProducts />
      <WhyChoose />
      <Testimonials />
      <Newsletter />
    </MainLayout>
  );
}
