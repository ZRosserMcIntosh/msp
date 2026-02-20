"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Globe,
  Shield,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-pattern gradient-mesh noise">
      {/* Animated orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          Enterprise-Grade Managed Services Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6"
        >
          <span className="block">Operations infrastructure</span>
          <span className="block mt-2">
            for{" "}
            <span className="bg-gradient-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent glow-text">
              modern enterprises
            </span>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Multi-tenant device lifecycle management, real estate operations, and
          IT helpdesk — unified in a single platform with enterprise security,
          audit logging, and seamless integrations.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#"
            className="group relative inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-7 py-3.5 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5"
          >
            Start Building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#platform"
            className="inline-flex items-center gap-2 text-muted hover:text-foreground font-medium px-7 py-3.5 rounded-xl border border-border hover:border-border-light transition-all hover:bg-surface-light/30"
          >
            Explore Platform
          </a>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {[
            {
              icon: Cpu,
              label: "Device Lifecycle",
              desc: "End-to-end asset tracking & staging",
            },
            {
              icon: Globe,
              label: "Real Estate Platform",
              desc: "Hosted sites, listings & vault",
            },
            {
              icon: Shield,
              label: "Enterprise Security",
              desc: "RLS, audit logs & compliance",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="glass rounded-xl p-6 text-center sm:text-left cursor-default"
            >
              <div className="flex justify-center sm:justify-start">
                <card.icon className="w-6 h-6 text-accent mb-3" />
              </div>
              <div className="text-sm font-semibold mb-1.5">{card.label}</div>
              <div className="text-xs text-muted leading-relaxed">{card.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
