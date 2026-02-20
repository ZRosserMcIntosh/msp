"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    desc: "For small brokerages getting started with MSP",
    price: { monthly: 29, annual: 24 },
    unit: "user/mo",
    highlight: false,
    features: [
      "Up to 10 users",
      "50 devices tracked",
      "Vault Starter (50 GB)",
      "Email support",
      "Basic ticketing",
      "1 hosted website",
      "Standard audit logs",
    ],
  },
  {
    name: "Professional",
    desc: "For growing brokerages with operational needs",
    price: { monthly: 59, annual: 49 },
    unit: "user/mo",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Up to 50 users",
      "250 devices tracked",
      "Vault Pro (250 GB)",
      "Priority support + SLA",
      "Advanced ticketing",
      "5 hosted websites",
      "Custom domains",
      "E-sign (100 envelopes/mo)",
      "ShipStation integration",
      "Team management",
    ],
  },
  {
    name: "Enterprise",
    desc: "For large operations requiring full platform access",
    price: { monthly: 99, annual: 84 },
    unit: "user/mo",
    highlight: false,
    features: [
      "Unlimited users",
      "Unlimited devices",
      "Vault Enterprise (2 TB)",
      "Dedicated support + CSM",
      "Full helpdesk suite",
      "Unlimited websites",
      "Domain reseller access",
      "Unlimited e-sign",
      "Microsoft Intune sync",
      "Automation engine",
      "Compliance reporting",
      "API access",
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Pricing
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            Transparent, scalable pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-8"
          >
            Start small and scale as you grow. Every plan includes multi-tenant
            isolation, audit logging, and enterprise security.
          </motion.p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm ${!annual ? "text-foreground" : "text-muted"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle annual billing"
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annual ? "bg-accent" : "bg-surface-light"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  annual ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${annual ? "text-foreground" : "text-muted"}`}>
              Annual{" "}
              <span className="text-accent text-xs font-medium">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl p-7 sm:p-8 ${
                plan.highlight
                  ? "border-2 border-accent bg-surface/60 shadow-xl shadow-accent/5"
                  : "border border-border bg-surface/30"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-xs font-semibold rounded-full">
                  {(plan as typeof plans[1]).badge}
                </div>
              )}

              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted mb-5">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-bold">
                  ${annual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className="text-sm text-muted">/{plan.unit}</span>
              </div>

              <a
                href="#"
                className={`block text-center py-3 rounded-xl text-sm font-medium transition-all mb-6 ${
                  plan.highlight
                    ? "bg-accent hover:bg-accent-light text-white shadow-lg shadow-accent/20"
                    : "border border-border hover:border-accent/50 text-foreground hover:bg-surface-light"
                }`}
              >
                Get Started
              </a>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-muted">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
