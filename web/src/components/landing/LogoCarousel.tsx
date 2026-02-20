"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const logos = [
  { src: "/logos/supabase.png", alt: "Supabase", width: 140 },
  { src: "/logos/stripe.png", alt: "Stripe", width: 100 },
  { src: "/logos/aws.png", alt: "AWS", width: 80 },
  { src: "/logos/github.png", alt: "GitHub", width: 110 },
  { src: "/logos/openai.png", alt: "OpenAI", width: 120 },
  { src: "/logos/anthropic.svg", alt: "Anthropic", width: 130 },
  { src: "/logos/xai.png", alt: "xAI", width: 60 },
  { src: "/logos/plaid.png", alt: "Plaid", width: 100 },
  { src: "/logos/replit.png", alt: "Replit", width: 44 },
  { src: "/logos/apple-pay.png", alt: "Apple Pay", width: 80 },
  { src: "/logos/app-store.png", alt: "App Store", width: 44 },
  { src: "/logos/google-play.png", alt: "Google Play", width: 130 },
];

export default function LogoCarousel() {
  const doubled = [...logos, ...logos];

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden border-y border-border/50">
      <div className="max-w-7xl mx-auto px-6 mb-8 sm:mb-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs sm:text-sm text-muted uppercase tracking-widest font-medium"
        >
          Powered by industry-leading integrations
        </motion.p>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-background to-transparent z-10" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-background to-transparent z-10" />

        <div className="flex animate-marquee w-max gap-12 sm:gap-16 items-center">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.alt}-${i}`}
              className="flex items-center justify-center h-12 sm:h-14 opacity-40 hover:opacity-80 transition-opacity duration-300 shrink-0"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={48}
                className="object-contain h-7 sm:h-9 w-auto brightness-0 invert"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
