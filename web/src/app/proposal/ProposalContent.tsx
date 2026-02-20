"use client";

import { motion } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  Cpu,
  Globe,
  Truck,
  FileText,
  Users,
  CreditCard,
  Headphones,
  Layers,
  Lock,
  Zap,
  Database,
  BarChart3,
  Server,
  Mail,
  Smartphone,
  PenTool,
  Clock,
  HardDrive,
} from "lucide-react";

/* ───── Data ───── */

const integrations = [
  {
    name: "Supabase",
    role: "Database, Auth, Storage, Edge Functions",
    detail:
      "Postgres with Row-Level Security for multi-tenant isolation. Supabase Auth for session management (email/password, magic link, SSO). Supabase Storage for document vault with signed URLs and CDN caching. Edge Functions for webhook processing and background jobs.",
    use: "Core infrastructure — every request flows through Supabase RLS policies scoped by org_id.",
  },
  {
    name: "Stripe",
    role: "SaaS Billing & Subscriptions",
    detail:
      "Stripe Billing for per-seat subscription plans, device add-ons, vault storage tiers, and domain bundles. Stripe Customer Portal for self-service plan management. Webhook handlers with idempotency keys for reliable event processing. Stripe Invoicing for automated invoice generation.",
    use: "All recurring billing, proration, dunning, coupon/promotion codes, and payment method management.",
  },
  {
    name: "ShipStation",
    role: "Shipping & Fulfillment",
    detail:
      "Batch-first API design — bulk label creation instead of per-item loops. Multi-carrier rate shopping (USPS, UPS, FedEx). Tracking number sync with webhook-driven status updates. Custom packing slip templates with QR codes linking to device records.",
    use: "Every device shipped to a client flows through ShipStation. Batch operations reduce API calls by 10-50x vs sequential processing.",
  },
  {
    name: "GoDaddy Developer API",
    role: "Domain Purchase & DNS Management",
    detail:
      "Domain availability search and purchase via reseller API. DNS template provisioning — pre-built A/CNAME/MX record sets for hosted sites. SSL certificate automation. WHOIS privacy included by default. Domain transfer support for existing domains.",
    use: "When a brokerage purchases a domain through our platform, we auto-provision DNS records pointing to their hosted site.",
  },
  {
    name: "Dropbox Sign (HelloSign)",
    role: "E-Signature Integration",
    detail:
      "Embedded signing experience (iFrame) for in-app document signing. Template management for recurring document types (listing agreements, disclosures). Audit trail with legally-binding signature certificates. Webhook callbacks for signature status updates stored in our audit log.",
    use: "Real estate agents send documents for signature directly from the vault. Signed copies auto-save back to the tenant's vault storage.",
  },
  {
    name: "Microsoft Graph API",
    role: "Device Compliance & Identity",
    detail:
      "Intune device compliance status sync — we surface whether managed devices meet security policies. Autopilot enrollment status for new device provisioning. Entra ID (Azure AD) audit log ingestion for security posture reporting. We do NOT rebuild MDM — we integrate and display.",
    use: "MSP technicians see device compliance state alongside our staging pipeline. Quarterly compliance reports pull from Graph.",
  },
  {
    name: "Brevo (Sendinblue)",
    role: "Transactional Email & Notifications",
    detail:
      "SMTP relay for all transactional emails: ticket updates, shipping confirmations, billing receipts, password resets. Template-based emails with dynamic variables. Delivery tracking and bounce handling. Future: SMS notifications for critical alerts.",
    use: "Every system notification (ticket created, device shipped, invoice generated) triggers a Brevo email to the relevant users.",
  },
  {
    name: "Vercel",
    role: "Hosting & Edge Network",
    detail:
      "Next.js optimized hosting with automatic ISR (Incremental Static Regeneration). Global edge network for fast page loads. Preview deployments for every PR. Environment variable management. Analytics and Web Vitals monitoring.",
    use: "Production hosting for the web platform. Preview URLs for staging/review before deploy.",
  },
];

const modules = [
  {
    icon: Shield,
    name: "Tenancy & RBAC",
    phase: "Phase 1",
    desc: "Multi-tenant organization model with hierarchical role-based access control. Every table scoped by org_id with Supabase RLS policies. Six role tiers: platform_admin, platform_tech, client_admin, client_manager, client_agent, client_viewer.",
    tables: ["organizations", "org_members", "roles", "permissions", "invitations"],
    endpoints: ["POST /api/orgs", "POST /api/orgs/:id/invite", "PATCH /api/orgs/:id/members/:uid/role"],
    complexity: "High",
  },
  {
    icon: Cpu,
    name: "Device Lifecycle Pipeline",
    phase: "Phase 1",
    desc: "End-to-end asset tracking from receipt through retirement. 6-stage pipeline: Received → Provisioned → QA → Shipped → Active → Retired. QR/barcode scanning for technicians. Bulk operations for staging workflows. Full audit trail at every state transition.",
    tables: ["devices", "device_events", "device_assignments", "accessories", "device_checklists"],
    endpoints: ["GET /api/devices", "POST /api/devices", "PATCH /api/devices/:id/transition", "POST /api/devices/bulk-transition"],
    complexity: "High",
  },
  {
    icon: Truck,
    name: "Shipping (ShipStation)",
    phase: "Phase 1",
    desc: "Batch-first shipping integration. Bulk label creation for multiple devices. Multi-carrier rate comparison. Tracking webhook sync. Custom packing slips with device QR codes. Shipping queue dashboard for technicians.",
    tables: ["shipments", "shipment_items", "shipping_labels", "tracking_events"],
    endpoints: ["POST /api/shipments/batch", "POST /api/shipments/:id/label", "POST /api/webhooks/shipstation"],
    complexity: "Medium",
  },
  {
    icon: Headphones,
    name: "Helpdesk & Ticketing",
    phase: "Phase 1",
    desc: "Streamlined ticket management for MSP operations. Priority-based routing. SLA tracking with breach alerts. Internal notes vs client-visible comments. Email notifications on status changes. Client portal ticket creation.",
    tables: ["tickets", "ticket_comments", "ticket_attachments", "sla_policies"],
    endpoints: ["GET /api/tickets", "POST /api/tickets", "PATCH /api/tickets/:id", "POST /api/tickets/:id/comments"],
    complexity: "Medium",
  },
  {
    icon: CreditCard,
    name: "Billing & Subscriptions",
    phase: "Phase 1",
    desc: "Stripe-powered SaaS billing engine. Per-seat plans with device and storage add-ons. Automated proration on plan changes. Dunning management for failed payments. Customer portal integration. Invoice history and PDF generation.",
    tables: ["billing_accounts", "subscriptions", "invoices", "payment_methods", "billing_events"],
    endpoints: ["POST /api/billing/checkout", "POST /api/billing/portal", "POST /api/webhooks/stripe"],
    complexity: "High",
  },
  {
    icon: FileText,
    name: "Document Vault",
    phase: "Phase 1",
    desc: "Encrypted document storage with per-tenant quotas. Role-based folder permissions. Signed URLs with 1-hour TTL. Thumbnail generation on upload. CDN-cached delivery. Version history. Retention policies with auto-archive/delete. Integration with e-sign module.",
    tables: ["vault_folders", "vault_files", "vault_versions", "vault_permissions", "storage_quotas"],
    endpoints: ["GET /api/vault/files", "POST /api/vault/upload", "GET /api/vault/files/:id/download", "DELETE /api/vault/files/:id"],
    complexity: "High",
  },
  {
    icon: Lock,
    name: "Audit & Compliance",
    phase: "Phase 1",
    desc: "Append-only audit event log for every sensitive mutation. Actor ID, org ID, action type, entity type/ID, before/after diff, timestamp, request ID, IP, user agent. Exportable reports. Compliance dashboard. Immutable — no UPDATE or DELETE on audit table.",
    tables: ["audit_events"],
    endpoints: ["GET /api/audit", "GET /api/audit/export"],
    complexity: "Medium",
  },
  {
    icon: Globe,
    name: "Hosted Real Estate Sites",
    phase: "Phase 2",
    desc: "White-label website builder for agents, teams, and brokerages. Template system with customizable themes. Page editor with sections (hero, about, listings, contact, testimonials). Lead capture forms with routing. SEO settings per page. Custom domain binding.",
    tables: ["websites", "web_pages", "web_sections", "web_themes", "lead_captures", "leads"],
    endpoints: ["GET /api/websites", "POST /api/websites", "PATCH /api/websites/:id/pages/:pageId", "GET /api/websites/:id/leads"],
    complexity: "Very High",
  },
  {
    icon: Layers,
    name: "Domain Management",
    phase: "Phase 2",
    desc: "GoDaddy reseller integration for domain purchase and DNS provisioning. Domain availability search. Auto-provisioned DNS templates (A records, CNAMEs, MX for email). SSL automation. Domain transfer support. Renewal management.",
    tables: ["domains", "dns_records", "domain_transactions"],
    endpoints: ["GET /api/domains/search", "POST /api/domains/purchase", "POST /api/domains/:id/dns", "GET /api/domains"],
    complexity: "High",
  },
  {
    icon: Users,
    name: "Teams & Employees",
    phase: "Phase 2",
    desc: "Hierarchical team management for brokerages. Office/team/group structure. Agent profiles with license info. Performance metrics dashboard. Onboarding checklists. Offboarding workflows with device return tracking.",
    tables: ["teams", "team_members", "agent_profiles", "onboarding_tasks"],
    endpoints: ["GET /api/teams", "POST /api/teams", "POST /api/teams/:id/members", "GET /api/teams/:id/performance"],
    complexity: "Medium",
  },
  {
    icon: PenTool,
    name: "E-Sign Integration",
    phase: "Phase 2",
    desc: "Dropbox Sign (HelloSign) integration for embedded document signing. Template management for recurring document types. In-app signing experience via iFrame. Audit trail with legally-binding certificates. Auto-save signed documents back to vault.",
    tables: ["esign_templates", "esign_envelopes", "esign_signers", "esign_events"],
    endpoints: ["POST /api/esign/send", "GET /api/esign/envelopes", "POST /api/webhooks/dropbox-sign"],
    complexity: "High",
  },
  {
    icon: Clock,
    name: "Time Clock",
    phase: "Phase 2",
    desc: "Employee time tracking with clock in/out. Geo-fencing for location verification. Break tracking. Overtime calculations. Manager approval workflows. Payroll-ready time exports (CSV/PDF). Mobile-first design for field agents.",
    tables: ["time_entries", "time_policies", "time_approvals"],
    endpoints: ["POST /api/time/clock-in", "POST /api/time/clock-out", "GET /api/time/entries", "POST /api/time/approve"],
    complexity: "Medium",
  },
  {
    icon: Database,
    name: "Microsoft Graph Sync",
    phase: "Phase 2",
    desc: "Intune device compliance status sync. Autopilot enrollment verification. Entra ID audit log ingestion. Conditional access policy status. We surface compliance state — we never rebuild MDM. Scheduled sync jobs every 15 minutes.",
    tables: ["intune_devices", "compliance_snapshots", "entra_audit_logs"],
    endpoints: ["POST /api/integrations/graph/sync", "GET /api/integrations/graph/compliance"],
    complexity: "High",
  },
  {
    icon: Zap,
    name: "Automation Engine",
    phase: "Phase 3",
    desc: "Workflow automation for onboarding/offboarding sequences. Device provisioning automation. Scheduled compliance checks. Custom trigger-action rules (e.g., 'when device ships, email client'). Webhook-driven event processing.",
    tables: ["workflows", "workflow_steps", "workflow_runs", "triggers"],
    endpoints: ["GET /api/workflows", "POST /api/workflows", "POST /api/workflows/:id/run"],
    complexity: "Very High",
  },
  {
    icon: BarChart3,
    name: "Executive Dashboards",
    phase: "Phase 3",
    desc: "C-suite reporting dashboards. Revenue metrics, device fleet health, support ticket trends, storage utilization, compliance scores. Exportable PDF reports. Scheduled email digests. Role-scoped — each role sees appropriate metrics.",
    tables: ["report_snapshots", "dashboard_configs"],
    endpoints: ["GET /api/reports/executive", "GET /api/reports/export"],
    complexity: "Medium",
  },
  {
    icon: HardDrive,
    name: "Hardware-as-a-Service",
    phase: "Phase 3",
    desc: "Device leasing program management. Lease terms, refresh cycles, and return logistics. Depreciation tracking. Automated refresh notifications. Integration with billing for lease line items. Insurance/warranty tracking.",
    tables: ["lease_agreements", "lease_devices", "refresh_schedules"],
    endpoints: ["GET /api/haas/agreements", "POST /api/haas/agreements", "POST /api/haas/return"],
    complexity: "High",
  },
];

const mobileFeatures = [
  {
    app: "Realtor Mobile App",
    icon: Smartphone,
    features: [
      "View leads, listings, and tasks",
      "Upload photos and documents to vault",
      "Preview and share documents",
      "E-sign status tracking",
      "Quick admin actions (approve, assign, comment)",
      "Push notifications for leads and tickets",
      "Clock in/out with geo-verification",
      "View team roster and contacts",
    ],
  },
  {
    app: "MSP Technician App",
    icon: Server,
    features: [
      "QR/barcode device scanning",
      "Update device staging step",
      "Complete staging checklists",
      "Create and manage shipments",
      "View and update tickets",
      "Upload photo evidence",
      "Confirm device pack-out",
      "Push notifications for assignments",
    ],
  },
];

const storageTable = [
  { plan: "Vault Starter", storage: "50 GB", transfer: "25 GB/mo", price: "$5/mo" },
  { plan: "Vault Pro", storage: "250 GB", transfer: "50 GB/mo", price: "$10/mo" },
  { plan: "Vault 500", storage: "500 GB", transfer: "100 GB/mo", price: "$15/mo" },
  { plan: "Vault Enterprise", storage: "2 TB", transfer: "500 GB/mo", price: "$45/mo" },
];

/* ───── Animation variants ───── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ───── Component ───── */

export default function ProposalContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="text-lg font-semibold text-accent">MSP</span>
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="mb-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-accent text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Technical Proposal
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
          >
            MSP + Real Estate
            <br />
            <span className="bg-linear-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Operations Platform
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg text-muted max-w-2xl leading-relaxed"
          >
            A comprehensive multi-tenant SaaS platform combining managed IT
            services (device lifecycle, shipping, helpdesk, billing) with hosted
            real estate operations (websites, listings, vault, e-sign) under a
            single enterprise-grade architecture.
          </motion.p>
        </motion.div>

        {/* ─── Section: Architecture Overview ─── */}
        <Section title="Architecture Overview" id="architecture">
          <div className="prose-custom">
            <p>
              The platform is built on a <strong>multi-tenant architecture</strong> where
              every data record is scoped to an organization via <code>org_id</code>.
              Supabase Row-Level Security (RLS) policies enforce tenant isolation at the
              database level — no application-layer mistakes can leak data across tenants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {[
                { label: "Frontend", value: "Next.js 16 (App Router) + TypeScript + Tailwind CSS" },
                { label: "Backend", value: "Server Actions + Supabase Edge Functions + Typed RPC" },
                { label: "Database", value: "Supabase Postgres with RLS on every table" },
                { label: "Auth", value: "Supabase Auth (email, magic link, future SSO)" },
                { label: "Storage", value: "Supabase Storage with CDN, signed URLs, thumbnails" },
                { label: "Hosting", value: "Vercel (web) + Expo (mobile)" },
                { label: "Billing", value: "Stripe Billing (subscriptions, invoices, portal)" },
                { label: "Email", value: "Brevo SMTP (transactional + operational)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-surface/50 border border-border/60 rounded-lg p-4"
                >
                  <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">
                    {item.label}
                  </div>
                  <div className="text-sm text-muted">{item.value}</div>
                </div>
              ))}
            </div>
            <p>
              All sensitive mutations emit <strong>append-only audit events</strong> with
              actor_id, org_id, action_type, entity_type, entity_id, before/after diff,
              timestamp, request_id, IP address, and user agent. The audit table has no
              UPDATE or DELETE permissions — it is immutable by design.
            </p>
          </div>
        </Section>

        {/* ─── Section: Integrations ─── */}
        <Section title="Integration Deep-Dive" id="integrations">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {integrations.map((int) => (
              <motion.div
                key={int.name}
                variants={fadeUp}
                className="border border-border/60 rounded-xl p-6 bg-surface/30 hover:bg-surface/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                  <h3 className="text-base font-bold">{int.name}</h3>
                  <span className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full font-medium w-fit">
                    {int.role}
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-3">{int.detail}</p>
                <div className="text-xs text-foreground/70 bg-surface-light/50 rounded-lg p-3 border border-border/40">
                  <strong className="text-accent">Use case:</strong> {int.use}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ─── Section: Module Map ─── */}
        <Section title="Module-by-Module Implementation Map" id="modules">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-5"
          >
            {modules.map((mod) => (
              <motion.div
                key={mod.name}
                variants={fadeUp}
                className="border border-border/60 rounded-xl p-6 bg-surface/30"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <mod.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">{mod.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                      {mod.phase}
                    </span>
                    <span className="text-xs bg-surface-light text-muted px-2.5 py-1 rounded-full">
                      {mod.complexity} complexity
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed mb-4">{mod.desc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface-light/50 rounded-lg p-3 border border-border/40">
                    <div className="text-xs text-accent font-semibold mb-2">Database Tables</div>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.tables.map((t) => (
                        <code
                          key={t}
                          className="text-xs bg-background/60 text-muted px-2 py-0.5 rounded border border-border/50"
                        >
                          {t}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface-light/50 rounded-lg p-3 border border-border/40">
                    <div className="text-xs text-accent font-semibold mb-2">Key Endpoints</div>
                    <div className="flex flex-col gap-1">
                      {mod.endpoints.map((e) => (
                        <code
                          key={e}
                          className="text-xs bg-background/60 text-muted px-2 py-0.5 rounded border border-border/50"
                        >
                          {e}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ─── Section: Mobile Apps ─── */}
        <Section title="Mobile App Feature Split" id="mobile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mobileFeatures.map((app) => (
              <div
                key={app.app}
                className="border border-border/60 rounded-xl p-6 bg-surface/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <app.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-base font-bold">{app.app}</h3>
                </div>
                <ul className="space-y-2.5">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                      <span className="text-sm text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted mt-4">
            Both apps built with <strong>React Native (Expo)</strong> + TypeScript,
            sharing types via <code>packages/shared</code>. Authentication through
            the same Supabase auth model. API calls via typed RPC layer.
          </p>
        </Section>

        {/* ─── Section: Storage Economics ─── */}
        <Section title="Storage Economics & Egress Plan" id="storage">
          <div className="prose-custom mb-6">
            <p>
              Storage costs are dominated by <strong>egress</strong> (downloads), not
              ingress (uploads). Our architecture minimizes egress through CDN caching,
              thumbnail generation, in-app viewers, and signed URLs with short TTL.
            </p>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Storage</th>
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Monthly Transfer</th>
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody>
                {storageTable.map((row) => (
                  <tr key={row.plan} className="border-b border-border/40 hover:bg-surface/40">
                    <td className="py-3 px-4 font-medium">{row.plan}</td>
                    <td className="py-3 px-4 text-muted">{row.storage}</td>
                    <td className="py-3 px-4 text-muted">{row.transfer}</td>
                    <td className="py-3 px-4 text-accent font-medium">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "Egress Mitigation",
                items: [
                  "CDN-cached URLs by default (Supabase Storage CDN)",
                  "Thumbnails generated on upload for preview grids",
                  "In-app PDF viewer — no download needed for viewing",
                  "Signed URLs with 1-hour TTL prevent hotlinking",
                  "WebP conversion + responsive image sizes",
                ],
              },
              {
                title: "Quota Enforcement",
                items: [
                  "Pre-upload check against tenant quota",
                  "80% usage warning email via Brevo",
                  "95% usage — admin notification + upgrade prompt",
                  "100% — hard cap, uploads blocked until upgrade",
                  "Overage option: $0.10/GB cached, $0.15/GB uncached",
                ],
              },
            ].map((block) => (
              <div
                key={block.title}
                className="bg-surface/50 border border-border/60 rounded-xl p-5"
              >
                <h4 className="text-sm font-bold mb-3">{block.title}</h4>
                <ul className="space-y-2">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                      <span className="text-xs text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Section: Build Phases ─── */}
        <Section title="Build Phases & Milestones" id="phases">
          <div className="space-y-6">
            {[
              {
                phase: "Phase 1 — MVP (Sellable Core)",
                color: "border-emerald-500/30",
                items: [
                  "Monorepo setup + CI/CD + Vercel deployment",
                  "Multi-tenant orgs + Supabase Auth + RBAC",
                  "Audit log system (append-only events)",
                  "Inventory & asset tracking (devices, accessories)",
                  "Device lifecycle pipeline (6-stage)",
                  "Ticketing/helpdesk (simple ticket model)",
                  "Brevo transactional email notifications",
                  "Stripe subscriptions + billing",
                  "Vault storage with quotas + CDN delivery",
                  "Landing page + marketing site",
                ],
              },
              {
                phase: "Phase 2 — Moat-Building (Retention)",
                color: "border-blue-500/30",
                items: [
                  "GoDaddy reseller integration (domains + DNS)",
                  "Hosted websites + listings + lead capture",
                  "Microsoft Graph sync (device compliance)",
                  "Mobile apps (Realtor + Technician)",
                  "Teams/employees module",
                  "Time clock module",
                  "E-sign integration (Dropbox Sign)",
                ],
              },
              {
                phase: "Phase 3 — Automation & Scale",
                color: "border-purple-500/30",
                items: [
                  "Onboarding/offboarding automation engine",
                  "Quarterly security posture reporting",
                  "Executive dashboards + analytics",
                  "Hardware-as-a-Service program",
                  "Advanced API access for enterprise clients",
                ],
              },
            ].map((p) => (
              <div
                key={p.phase}
                className={`border ${p.color} rounded-xl p-6 bg-surface/30`}
              >
                <h3 className="text-base font-bold mb-4">{p.phase}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {p.items.map((item, i) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <span className="text-xs text-accent font-mono mt-0.5 shrink-0 w-5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── Section: Stripe vs Square ─── */}
        <Section title="Stripe vs Square: SaaS Billing Decision" id="billing">
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Feature</th>
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Stripe</th>
                  <th className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider">Square</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Subscriptions", stripe: "Full Billing engine with tiers, quantities, trials", square: "Basic Subscriptions API" },
                  { feature: "Proration", stripe: "Automatic mid-cycle proration", square: "Manual calculation needed" },
                  { feature: "Dunning", stripe: "Smart retries + configurable emails", square: "Basic retry logic" },
                  { feature: "Customer Portal", stripe: "Hosted billing portal (built-in)", square: "No equivalent" },
                  { feature: "Webhooks", stripe: "200+ event types, reliable delivery", square: "Fewer event types" },
                  { feature: "Metering", stripe: "Usage-based billing with meters", square: "Not supported" },
                  { feature: "Invoices", stripe: "Auto-generated, hosted pages, PDF", square: "Basic Invoice API" },
                  { feature: "Card-Present", stripe: "Terminal SDK (higher cost)", square: "Core strength: 2.6% + 15¢" },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-border/40 hover:bg-surface/40">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-muted">{row.stripe}</td>
                    <td className="py-3 px-4 text-muted">{row.square}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
            <h4 className="text-sm font-bold text-accent mb-2">Recommendation</h4>
            <p className="text-sm text-muted">
              <strong>Stripe as default</strong> for all SaaS subscription billing.
              Square only if card-present field work becomes a material use case.
              Stripe&apos;s Billing engine, Customer Portal, proration, dunning, and 200+
              webhook events make it purpose-built for our subscription model.
            </p>
          </div>
        </Section>

        {/* ─── Footer ─── */}
        <div className="mt-20 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted">
            MSP Platform Technical Proposal · Prepared February 2026
          </p>
          <p className="text-xs text-muted mt-2">
            This document is confidential and intended for internal review only.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ─── Reusable Section wrapper ─── */
function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="mb-20"
    >
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 pb-3 border-b border-border/60">
        {title}
      </h2>
      <div className="[&_.prose-custom_p]:text-sm [&_.prose-custom_p]:text-muted [&_.prose-custom_p]:leading-relaxed [&_.prose-custom_p]:mb-4 [&_.prose-custom_strong]:text-foreground [&_.prose-custom_code]:text-xs [&_.prose-custom_code]:bg-surface-light [&_.prose-custom_code]:px-1.5 [&_.prose-custom_code]:py-0.5 [&_.prose-custom_code]:rounded">
        {children}
      </div>
    </motion.section>
  );
}
