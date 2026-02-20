"use client";

import { motion } from "framer-motion";
import {
  Cpu,
  Globe,
  Shield,
  Truck,
  FileText,
  Users,
  BarChart3,
  Headphones,
  Layers,
  Lock,
  Zap,
  Database,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "Device Lifecycle Pipeline",
    desc: "Track every asset from receipt through staging, QA, shipping, deployment, and retirement. Full audit trail at every step.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Truck,
    title: "ShipStation Integration",
    desc: "Batch-first shipping operations. Bulk label creation, tracking sync, and efficient multi-carrier fulfillment workflows.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Globe,
    title: "Hosted Real Estate Sites",
    desc: "White-label websites for agents, teams, and brokerages with listing management, lead capture, and custom domains.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: FileText,
    title: "Document Vault",
    desc: "Encrypted storage with tenant quotas, signed URLs, role-based access, retention policies, and e-sign integration.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: Headphones,
    title: "Helpdesk & Ticketing",
    desc: "Streamlined ticket management with priority routing, SLA tracking, email notifications, and customer portal access.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    icon: Users,
    title: "Multi-Tenant RBAC",
    desc: "Platform admins, technicians, client admins, managers, agents — all with scoped permissions enforced at the database level.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: BarChart3,
    title: "Billing & Subscriptions",
    desc: "Stripe-powered SaaS billing with per-seat plans, device add-ons, vault storage tiers, and automated dunning.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Layers,
    title: "Domain Management",
    desc: "GoDaddy reseller integration for domain purchases, DNS template provisioning, and automated SSL configuration.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Shield,
    title: "Compliance & Audit",
    desc: "Append-only audit logs for every mutation. Actor tracking, before/after diffs, and exportable compliance reports.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "Row-Level Security on every table, signed URLs for documents, encrypted secrets, and principle of least privilege.",
    color: "text-red-400",
    bg: "bg-red-400/10",
  },
  {
    icon: Zap,
    title: "Automation Engine",
    desc: "Onboarding/offboarding workflows, device provisioning automation, and scheduled compliance checks.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Database,
    title: "Microsoft Graph Sync",
    desc: "Surface Intune compliance state, Entra audit logs, and Autopilot enrollment status — without rebuilding MDM.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Capabilities
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Everything you need to operate
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto"
          >
            A comprehensive suite of modules designed for MSP operations
            and real estate brokerage management — all multi-tenant, all audited.
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          {features.map((feat) => (
            <motion.div
              key={feat.title}
              variants={item}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-xl border border-border/60 bg-surface/40 p-6 sm:p-7 hover:border-accent/30 hover:bg-surface/60 transition-all duration-300 cursor-default"
            >
              <div
                className={`w-11 h-11 rounded-lg ${feat.bg} flex items-center justify-center mb-4`}
              >
                <feat.icon className={`w-5 h-5 ${feat.color}`} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold mb-2">{feat.title}</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">{feat.desc}</p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl bg-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
