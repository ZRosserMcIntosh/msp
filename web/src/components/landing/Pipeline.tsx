"use client";

import { motion } from "framer-motion";
import {
  Monitor,
  ArrowRight,
  Package,
  CheckCircle2,
  Truck as TruckIcon,
  Wifi,
  XCircle,
} from "lucide-react";

const stages = [
  {
    icon: Package,
    label: "Received",
    desc: "Asset logged into inventory",
    color: "bg-blue-500",
  },
  {
    icon: Monitor,
    label: "Provisioned",
    desc: "Software & config applied",
    color: "bg-indigo-500",
  },
  {
    icon: CheckCircle2,
    label: "QA Passed",
    desc: "Quality assurance verified",
    color: "bg-violet-500",
  },
  {
    icon: TruckIcon,
    label: "Shipped",
    desc: "ShipStation label created",
    color: "bg-purple-500",
  },
  {
    icon: Wifi,
    label: "Active",
    desc: "In field, compliance monitored",
    color: "bg-emerald-500",
  },
  {
    icon: XCircle,
    label: "Retired",
    desc: "Decommissioned & wiped",
    color: "bg-gray-500",
  },
];

export default function Pipeline() {
  return (
    <section id="devices" className="relative py-28 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-surface/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Device Lifecycle
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
          >
            End-to-end asset pipeline
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto"
          >
            Every device tracked from dock to desk and back. Full audit trail,
            automated staging, and integration with ShipStation and Microsoft Intune.
          </motion.p>
        </div>

        {/* Pipeline visualization */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-border-light -translate-y-1/2 z-0" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative flex flex-col items-center"
              >
                {/* Node */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`relative z-10 w-14 h-14 rounded-2xl ${stage.color} flex items-center justify-center shadow-lg mb-4`}
                >
                  <stage.icon className="w-6 h-6 text-white" />
                </motion.div>

                {/* Arrow */}
                {i < stages.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </div>
                )}

                <h3 className="text-sm font-semibold mb-1">{stage.label}</h3>
                <p className="text-xs text-muted text-center">{stage.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { value: "10K+", label: "Devices Managed" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "<4hr", label: "Avg Staging Time" },
            { value: "50+", label: "Clients Served" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-6 text-center"
            >
              <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
