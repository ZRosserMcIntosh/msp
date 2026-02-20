"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
            Ready to modernize your{" "}
            <span className="bg-linear-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
              operations?
            </span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto mb-10">
            Join forward-thinking MSPs and brokerages running their entire
            operation on a single, secure, auditable platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#"
              className="group inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground font-medium px-8 py-4 rounded-xl border border-border hover:border-border-light transition-all hover:bg-surface-light/30 text-lg"
            >
              Schedule Demo
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
