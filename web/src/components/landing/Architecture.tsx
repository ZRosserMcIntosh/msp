"use client";

import { motion } from "framer-motion";
import {
  Code2,
  Database,
  Lock,
  Zap,
  Cloud,
  Smartphone,
} from "lucide-react";

const layers = [
  {
    icon: Smartphone,
    label: "Client Layer",
    items: ["Next.js App Router", "React Native (Expo)", "Tailwind CSS", "Framer Motion"],
    color: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    icon: Code2,
    label: "API Layer",
    items: ["Server Actions", "Typed RPC", "Webhook Handlers", "Edge Functions"],
    color: "border-indigo-500/30",
    iconColor: "text-indigo-400",
  },
  {
    icon: Lock,
    label: "Auth & RBAC",
    items: ["Supabase Auth", "Row-Level Security", "Role Policies", "JWT + Sessions"],
    color: "border-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    icon: Database,
    label: "Data Layer",
    items: ["Supabase Postgres", "Append-Only Audit", "Multi-Tenant RLS", "Full-Text Search"],
    color: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    icon: Cloud,
    label: "Storage",
    items: ["Supabase Storage", "CDN Caching", "Signed URLs", "Thumbnail Generation"],
    color: "border-fuchsia-500/30",
    iconColor: "text-fuchsia-400",
  },
  {
    icon: Zap,
    label: "Integrations",
    items: ["ShipStation API", "Stripe Billing", "GoDaddy DNS", "Microsoft Graph"],
    color: "border-pink-500/30",
    iconColor: "text-pink-400",
  },
];

export default function Architecture() {
  return (
    <section id="security" className="relative py-28">
      <div className="absolute inset-0 bg-surface/20" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Architecture
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Enterprise-grade from the ground up
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto"
          >
            Built on proven infrastructure with security, scalability, and
            auditability as core architecture constraints — not afterthoughts.
          </motion.p>
        </div>

        {/* Stack layers */}
        <div className="max-w-3xl mx-auto space-y-3">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              className={`flex items-center gap-5 rounded-xl border ${layer.color} bg-surface/40 p-5 backdrop-blur-sm transition-all hover:bg-surface/60`}
            >
              <div className="shrink-0">
                <layer.icon className={`w-6 h-6 ${layer.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-1.5">{layer.label}</div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <span
                      key={item}
                      className="text-[11px] text-muted bg-background/60 px-2 py-0.5 rounded-md border border-border/50"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
