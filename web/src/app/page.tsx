import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoCarousel from "@/components/landing/LogoCarousel";
import Platform from "@/components/landing/Platform";
import Features from "@/components/landing/Features";
import Pipeline from "@/components/landing/Pipeline";
import Architecture from "@/components/landing/Architecture";
import Pricing from "@/components/landing/Pricing";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="relative w-full overflow-x-hidden">
      <Navbar />
      <Hero />
      <LogoCarousel />
      <Platform />
      <Features />
      <Pipeline />
      <Architecture />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
