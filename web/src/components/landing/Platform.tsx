"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Globe,
  Shield,
  FileText,
  Users,
  CreditCard,
} from "lucide-react";

const tabs = [
  {
    id: "msp",
    icon: Cpu,
    label: "MSP Operations",
    title: "Managed services command center",
    desc: "Complete operational console for MSP teams — inventory management, device staging pipeline, shipping with ShipStation, ticketing, and real-time dashboards. Every action logged, every device tracked.",
    features: [
      "Inventory & asset tracking with QR/barcode",
      "6-stage device lifecycle pipeline",
      "Bulk ShipStation label creation",
      "Ticketing with SLA tracking",
      "Staff performance dashboards",
      "Brevo-powered notifications",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-accent">Operations Dashboard</div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success" />
            <div className="w-2 h-2 rounded-full bg-warning" />
            <div className="w-2 h-2 rounded-full bg-danger" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["142 Active", "28 Staging", "5 Shipping"].map((s) => (
            <div key={s} className="bg-surface-light rounded-lg p-3 text-center">
              <div className="text-xs font-bold text-foreground">{s.split(" ")[0]}</div>
              <div className="text-xs text-muted mt-0.5">{s.split(" ")[1]}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            { label: "MacBook Pro 14″ — #MSP-2847", status: "QA Passed", color: "text-success" },
            { label: "Dell Latitude 5540 — #MSP-2848", status: "Provisioning", color: "text-warning" },
            { label: "iPhone 15 Pro — #MSP-2849", status: "Received", color: "text-blue-400" },
          ].map((d) => (
            <div key={d.label} className="flex items-center justify-between bg-surface-light/50 rounded-lg px-3 py-2">
              <div className="text-xs text-foreground">{d.label}</div>
              <div className={`text-xs font-medium ${d.color}`}>{d.status}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "realestate",
    icon: Globe,
    label: "Real Estate Portal",
    title: "White-label brokerage platform",
    desc: "Hosted websites for agents and brokerages with listing management, lead capture, team management, and document vault. Custom domains with automated DNS provisioning via GoDaddy.",
    features: [
      "Agent & brokerage site builder",
      "MLS-synced listing management",
      "Lead capture forms & routing",
      "Custom domain provisioning",
      "Team/employee management",
      "Time clock & payroll tracking",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-purple-400">Brokerage Portal</div>
          <div className="text-xs text-muted">acme-realty.com</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-light rounded-lg p-3">
            <div className="text-xs text-muted">Active Listings</div>
            <div className="text-lg font-bold text-foreground">47</div>
          </div>
          <div className="bg-surface-light rounded-lg p-3">
            <div className="text-xs text-muted">New Leads</div>
            <div className="text-lg font-bold text-foreground">12</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { addr: "1234 Oak Drive", price: "$459,000", status: "Active" },
            { addr: "567 Maple Lane", price: "$725,000", status: "Pending" },
            { addr: "890 Pine Street", price: "$380,000", status: "Closed" },
          ].map((l) => (
            <div key={l.addr} className="flex items-center justify-between bg-surface-light/50 rounded-lg px-3 py-2">
              <div>
                <div className="text-xs text-foreground">{l.addr}</div>
                <div className="text-xs text-muted">{l.price}</div>
              </div>
              <div className="text-xs font-medium text-accent">{l.status}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "security",
    icon: Shield,
    label: "Security",
    title: "Enterprise security posture",
    desc: "Row-Level Security on every table, append-only audit logs, encrypted document storage, Microsoft Intune compliance integration, and automated security posture reporting.",
    features: [
      "Row-Level Security (RLS) isolation",
      "Append-only audit event log",
      "Signed URLs with short TTL",
      "Microsoft Intune compliance sync",
      "Quarterly security posture reports",
      "IP/user-agent tracking on mutations",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-emerald-400">Security Dashboard</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            <div className="text-xs text-success">All Clear</div>
          </div>
        </div>
        <div className="bg-surface-light rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted">Compliance Score</div>
            <div className="text-xs font-bold text-success">98%</div>
          </div>
          <div className="w-full bg-background rounded-full h-1.5">
            <div className="bg-success rounded-full h-1.5" style={{ width: "98%" }} />
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { event: "User login — admin@acme.com", time: "2 min ago" },
            { event: "Device staged — #MSP-2847", time: "14 min ago" },
            { event: "Document uploaded — closing.pdf", time: "1 hr ago" },
          ].map((e) => (
            <div key={e.event} className="flex items-center justify-between bg-surface-light/50 rounded-lg px-3 py-2">
              <div className="text-xs text-foreground">{e.event}</div>
              <div className="text-xs text-muted">{e.time}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "vault",
    icon: FileText,
    label: "Vault",
    title: "Secure document storage",
    desc: "Encrypted document vault with per-tenant quotas, role-based access control, retention policies, e-sign integration via Dropbox Sign, and CDN-optimized delivery to minimize egress costs.",
    features: [
      "Encrypted storage with tenant quotas",
      "Role-based folder permissions",
      "Dropbox Sign e-sign integration",
      "CDN-cached delivery + thumbnails",
      "Version history & retention policies",
      "Overage alerts & auto-upgrading",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-amber-400">Document Vault</div>
          <div className="text-xs text-muted">124 GB / 250 GB</div>
        </div>
        <div className="bg-surface-light rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-muted">Storage Usage</div>
            <div className="text-xs font-medium text-amber-400">49.6%</div>
          </div>
          <div className="w-full bg-background rounded-full h-1.5">
            <div className="bg-amber-400 rounded-full h-1.5" style={{ width: "49.6%" }} />
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "Purchase Agreement.pdf", size: "2.4 MB", signed: true },
            { name: "Inspection Report.pdf", size: "8.1 MB", signed: false },
            { name: "Closing Disclosure.pdf", size: "1.2 MB", signed: true },
          ].map((d) => (
            <div key={d.name} className="flex items-center justify-between bg-surface-light/50 rounded-lg px-3 py-2">
              <div className="text-xs text-foreground">{d.name}</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted">{d.size}</div>
                {d.signed && <div className="text-xs text-success">✓ Signed</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "teams",
    icon: Users,
    label: "Teams",
    title: "Workforce management",
    desc: "Organize brokerages into teams, offices, and groups. Manage roles, permissions, time tracking, and performance metrics across your entire organization.",
    features: [
      "Hierarchical team structures",
      "Role-based permission scoping",
      "Time clock with geo-fencing",
      "Performance dashboards",
      "Onboarding/offboarding workflows",
      "Payroll-ready time exports",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-cyan-400">Team Management</div>
          <div className="text-xs text-muted">3 teams · 24 agents</div>
        </div>
        <div className="space-y-1.5">
          {[
            { team: "Downtown Office", members: 12, online: 8 },
            { team: "Westside Team", members: 8, online: 5 },
            { team: "Commercial Division", members: 4, online: 3 },
          ].map((t) => (
            <div key={t.team} className="bg-surface-light/50 rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium text-foreground">{t.team}</div>
                <div className="text-xs text-muted">{t.members} members</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <div className="text-xs text-success">{t.online} online</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Billing",
    title: "Stripe-powered SaaS billing",
    desc: "Flexible subscription management with per-seat pricing, device add-ons, vault storage tiers, and automated dunning. Customer portal for self-service plan management.",
    features: [
      "Per-seat subscription plans",
      "Device & storage add-ons",
      "Automated proration & dunning",
      "Stripe hosted customer portal",
      "Invoice generation & history",
      "Usage metering for overages",
    ],
    mockup: (
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-green-400">Billing Overview</div>
          <div className="text-xs text-success">All current</div>
        </div>
        <div className="bg-surface-light rounded-lg p-3">
          <div className="text-xs text-muted">Monthly Recurring</div>
          <div className="text-xl font-bold text-foreground">$2,847<span className="text-xs text-muted font-normal">/mo</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Seats", value: "24" },
            { label: "Devices", value: "142" },
            { label: "Storage", value: "250 GB" },
            { label: "Domains", value: "3" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-light/50 rounded-lg px-3 py-2">
              <div className="text-xs text-muted">{s.label}</div>
              <div className="text-xs font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function Platform() {
  const [activeTab, setActiveTab] = useState("msp");
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="platform" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Two platforms. One codebase.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto"
          >
            MSP operations for your team. Real estate portal for your clients.
            Unified under a single multi-tenant architecture.
          </motion.p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "text-muted hover:text-foreground hover:bg-surface-light/50 border border-border/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center"
          >
            {/* Text */}
            <div className="text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">{active.title}</h3>
              <p className="text-muted mb-6 leading-relaxed text-sm sm:text-base">{active.desc}</p>
              <ul className="space-y-3 inline-block text-left">
                {active.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-sm text-muted">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mockup */}
            <div className="animate-float">{active.mockup}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
