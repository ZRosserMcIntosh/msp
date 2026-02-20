"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Shield,
  ArrowLeft,
  ArrowRight,
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
  Smartphone,
  PenTool,
  Clock,
  HardDrive,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronRight,
  Target,
  Lightbulb,
  Code2,
  Cloud,
  Mail,
  Box,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════ */
/*  ANIMATION HELPERS                                      */
/* ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

/* Animated counter that counts up when in view */
function AnimatedStat({ value, label, prefix = "", suffix = "" }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const duration = 1600;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-accent mb-1">
        {prefix}{display.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*  DATA                                                   */
/* ═══════════════════════════════════════════════════════ */

/* ── Table of Contents ── */
const tocItems = [
  { id: "problem", label: "The Problem" },
  { id: "solution", label: "The Solution" },
  { id: "why-now", label: "Why Now" },
  { id: "modules", label: "Platform Modules" },
  { id: "architecture", label: "Architecture" },
  { id: "integrations", label: "Integrations" },
  { id: "mobile", label: "Mobile Apps" },
  { id: "revenue", label: "Revenue Model" },
  { id: "phases", label: "Build Phases" },
  { id: "next-steps", label: "Next Steps" },
];

/* ── Problems ── */
const problems = [
  {
    pain: "Scattered tools, siloed data",
    detail: "MSP teams juggle 6–10 disconnected tools for inventory, shipping, ticketing, billing, and compliance. Each tool has its own login, its own data model, and none of them talk to each other. Reporting means exporting CSVs and stitching spreadsheets.",
    icon: Box,
  },
  {
    pain: "Zero tenant isolation",
    detail: "Most off-the-shelf solutions weren't built for multi-client operations. One misconfigured filter can expose Client A's data to Client B. There's no architecture-level guarantee of separation — it's all trust and manual discipline.",
    icon: Shield,
  },
  {
    pain: "Manual handoffs everywhere",
    detail: "Device staging, shipping, and client onboarding rely on spreadsheets, Slack messages, and tribal knowledge. Things fall through the cracks because there's no system of record enforcing the process.",
    icon: Workflow,
  },
  {
    pain: "Real estate is an afterthought",
    detail: "Brokerage tools don't integrate with IT operations. Agents and technicians live in completely separate worlds — even when they work for the same organization, billing the same client.",
    icon: Building2,
  },
];

/* ── Value Props ── */
const valueProps = [
  {
    icon: Shield,
    title: "Enterprise Security by Default",
    pitch: "Every data record is scoped to an organization. No configuration mistakes can leak data between clients.",
    tech: "Row-Level Security (RLS) policies on every Postgres table enforce tenant isolation at the database engine level. Even a bug in application code cannot bypass RLS. All queries are automatically filtered by org_id using Supabase's auth.uid() → org_member lookup.",
    metric: "Zero cross-tenant leaks — by architecture, not by policy",
  },
  {
    icon: Workflow,
    title: "One Platform, Two Verticals",
    pitch: "MSP operations and real estate operations under a single codebase. Your clients see one unified experience, you manage one system.",
    tech: "Shared multi-tenant data model with vertical-specific modules. Organization type flags (msp | realestate | hybrid) control which dashboard modules and API endpoints are accessible. Feature flags per org allow gradual rollout.",
    metric: "Replace 8+ point solutions with one platform",
  },
  {
    icon: Lock,
    title: "Complete Audit Trail",
    pitch: "Every sensitive action generates an immutable record: who did what, when, from where, and what changed. Your compliance reports write themselves.",
    tech: "Append-only audit_events table with no UPDATE or DELETE permissions. Columns: actor_id, org_id, action_type, entity_type, entity_id, before_state (JSONB), after_state (JSONB), ip_address, user_agent, request_id, created_at. Triggered via Postgres functions on every mutation.",
    metric: "100% mutation coverage — zero blind spots",
  },
  {
    icon: TrendingUp,
    title: "Built to Scale Your Revenue",
    pitch: "Per-seat pricing with add-ons for devices, storage, domains, and e-sign. As your clients grow, their bills grow with them.",
    tech: "Stripe Billing with metered usage for storage/e-sign overages. Subscription items for seats, device tiers, and storage tiers. Proration on mid-cycle upgrades handled automatically. Webhooks sync subscription state to our billing_accounts table.",
    metric: "Every new seat, device, and GB is recurring revenue",
  },
];

/* ── Platform Modules ── */
interface PlatformModule {
  icon: LucideIcon;
  name: string;
  phase: 1 | 2 | 3;
  pitch: string;
  clientBenefit: string;
  techDetails: {
    tables: string[];
    endpoints: string[];
    complexity: string;
    notes: string;
  };
}

const platformModules: PlatformModule[] = [
  {
    icon: Shield,
    name: "Tenancy & RBAC",
    phase: 1,
    pitch: "Multi-tenant organization model with hierarchical roles. Six role tiers from platform admin down to read-only viewer. Every user sees only what they should see.",
    clientBenefit: "Your clients can manage their own teams without seeing each other's data. You control everything from the top.",
    techDetails: {
      tables: ["organizations", "org_members", "roles", "permissions", "invitations"],
      endpoints: ["POST /api/orgs", "POST /api/orgs/:id/invite", "PATCH /api/orgs/:id/members/:uid/role"],
      complexity: "High",
      notes: "RLS policies reference auth.uid() → org_members → org_id chain. Six roles: platform_admin, platform_tech, client_admin, client_manager, client_agent, client_viewer. Role hierarchy enforced in middleware and database policies.",
    },
  },
  {
    icon: Cpu,
    name: "Device Lifecycle Pipeline",
    phase: 1,
    pitch: "Track every device from dock to desk through a 6-stage pipeline. QR scanning, bulk operations, and a full audit trail at every state transition.",
    clientBenefit: "Your clients see exactly where their devices are at all times. No more \"where's my laptop?\" calls.",
    techDetails: {
      tables: ["devices", "device_events", "device_assignments", "accessories", "device_checklists"],
      endpoints: ["GET /api/devices", "POST /api/devices", "PATCH /api/devices/:id/transition", "POST /api/devices/bulk-transition"],
      complexity: "High",
      notes: "State machine: Received → Provisioned → QA → Shipped → Active → Retired. Transitions emit audit events and can trigger automations (e.g., auto-create ShipStation shipment on 'Shipped' transition). Bulk transition endpoint handles up to 100 devices in one API call.",
    },
  },
  {
    icon: Truck,
    name: "Shipping & Fulfillment",
    phase: 1,
    pitch: "ShipStation integration with batch-first design. Create labels for 50 devices in one click. Multi-carrier rate shopping. Tracking updates flow back automatically.",
    clientBenefit: "Cut shipping admin time by 80%. Clients get tracking emails without manual follow-up.",
    techDetails: {
      tables: ["shipments", "shipment_items", "shipping_labels", "tracking_events"],
      endpoints: ["POST /api/shipments/batch", "POST /api/shipments/:id/label", "POST /api/webhooks/shipstation"],
      complexity: "Medium",
      notes: "Batch-first API design: one API call creates labels for multiple devices instead of per-item loops. ShipStation webhooks update tracking_events table. Status changes trigger Brevo notification emails to clients. Rate shopping across USPS, UPS, and FedEx.",
    },
  },
  {
    icon: Headphones,
    name: "Helpdesk & Ticketing",
    phase: 1,
    pitch: "Streamlined ticket management with priority routing, SLA tracking, and breach alerts. Internal notes stay internal. Clients can create tickets from their own portal.",
    clientBenefit: "SLA compliance tracking means you can prove your response times. Clients see transparency.",
    techDetails: {
      tables: ["tickets", "ticket_comments", "ticket_attachments", "sla_policies"],
      endpoints: ["GET /api/tickets", "POST /api/tickets", "PATCH /api/tickets/:id", "POST /api/tickets/:id/comments"],
      complexity: "Medium",
      notes: "SLA policies define response/resolution targets per priority level. Breach alerts trigger at 80% and 100% of SLA window. Comments have is_internal flag — internal notes never visible to client portal users. File attachments stored in Supabase Storage with signed URLs.",
    },
  },
  {
    icon: CreditCard,
    name: "Billing & Subscriptions",
    phase: 1,
    pitch: "Stripe-powered billing engine. Per-seat plans with device add-ons, vault storage tiers, and domain bundles. Customer portal for self-service.",
    clientBenefit: "Stop chasing payments. Stripe handles failed cards, retries, and receipt emails. You watch MRR grow.",
    techDetails: {
      tables: ["billing_accounts", "subscriptions", "invoices", "payment_methods", "billing_events"],
      endpoints: ["POST /api/billing/checkout", "POST /api/billing/portal", "POST /api/webhooks/stripe"],
      complexity: "High",
      notes: "Stripe Checkout for initial subscription creation. Stripe Customer Portal for self-service plan changes. Webhook handlers with idempotency keys process: invoice.paid, customer.subscription.updated, invoice.payment_failed. Dunning automation retries failed payments on configurable schedule.",
    },
  },
  {
    icon: FileText,
    name: "Document Vault",
    phase: 1,
    pitch: "Encrypted document storage with per-tenant quotas. Role-based folder permissions. Signed URLs with 1-hour expiry. CDN delivery. Version history.",
    clientBenefit: "Clients store contracts, disclosures, and reports in their own secure vault. No more emailing sensitive files.",
    techDetails: {
      tables: ["vault_folders", "vault_files", "vault_versions", "vault_permissions", "storage_quotas"],
      endpoints: ["GET /api/vault/files", "POST /api/vault/upload", "GET /api/vault/files/:id/download", "DELETE /api/vault/files/:id"],
      complexity: "High",
      notes: "Supabase Storage with RLS-protected buckets per org. Signed URLs with 1-hour TTL prevent hotlinking. Thumbnails generated on upload for preview grids. Pre-upload quota check prevents exceeding tenant limits. Quota warnings at 80%/95% via Brevo email. WebP conversion for images.",
    },
  },
  {
    icon: Lock,
    name: "Audit & Compliance",
    phase: 1,
    pitch: "Append-only audit event log for every sensitive mutation. Exportable reports. Compliance dashboard. Nobody can edit or delete the record.",
    clientBenefit: "When a client asks \"who changed this?\", you have the answer instantly with full context.",
    techDetails: {
      tables: ["audit_events"],
      endpoints: ["GET /api/audit", "GET /api/audit/export"],
      complexity: "Medium",
      notes: "Columns: actor_id, org_id, action_type, entity_type, entity_id, before_state (JSONB), after_state (JSONB), ip_address, user_agent, request_id, created_at. Table has REVOKE UPDATE, DELETE on audit_events. Triggered by Postgres functions on INSERT/UPDATE/DELETE of sensitive tables. Export as CSV or PDF.",
    },
  },
  {
    icon: Globe,
    name: "Hosted Real Estate Sites",
    phase: 2,
    pitch: "White-label website builder for agents, teams, and brokerages. Templates, listing management, lead capture, SEO. Custom domains auto-configure.",
    clientBenefit: "Agents get a professional website in minutes. Leads flow directly into your CRM. Domains auto-configure.",
    techDetails: {
      tables: ["websites", "web_pages", "web_sections", "web_themes", "lead_captures", "leads"],
      endpoints: ["GET /api/websites", "POST /api/websites", "PATCH /api/websites/:id/pages/:pageId", "GET /api/websites/:id/leads"],
      complexity: "Very High",
      notes: "Section-based page builder with pre-built components: hero, about, listings grid, contact form, testimonials. Themes control colors/fonts. Lead capture forms submit to leads table with assignment routing rules. SEO settings per page (title, description, OG image). Custom domain binding via GoDaddy DNS API.",
    },
  },
  {
    icon: Layers,
    name: "Domain Management",
    phase: 2,
    pitch: "GoDaddy reseller integration. Search, purchase, and provision domains without leaving the platform. DNS records auto-configured.",
    clientBenefit: "New revenue stream — resell domains to clients with markup. Zero manual DNS work.",
    techDetails: {
      tables: ["domains", "dns_records", "domain_transactions"],
      endpoints: ["GET /api/domains/search", "POST /api/domains/purchase", "POST /api/domains/:id/dns", "GET /api/domains"],
      complexity: "High",
      notes: "GoDaddy Reseller API for availability search and purchase. DNS template provisioning: pre-built A/CNAME/MX record sets for hosted sites. WHOIS privacy included by default. Domain transfer support for existing domains. Renewal tracking with 30/7/1-day reminder emails.",
    },
  },
  {
    icon: PenTool,
    name: "E-Signature Integration",
    phase: 2,
    pitch: "Dropbox Sign embedded signing. Send documents for signature from the vault. Templates for recurring types. Signed copies auto-save back.",
    clientBenefit: "Agents send and sign documents without leaving the platform. Legally binding with full audit trail.",
    techDetails: {
      tables: ["esign_templates", "esign_envelopes", "esign_signers", "esign_events"],
      endpoints: ["POST /api/esign/send", "GET /api/esign/envelopes", "POST /api/webhooks/dropbox-sign"],
      complexity: "High",
      notes: "Embedded signing via iFrame — signers never leave the platform. Template management for recurring document types (listing agreements, disclosures). Webhook callbacks update envelope status in real-time. Signed PDFs auto-uploaded to sender's vault folder with audit event.",
    },
  },
  {
    icon: Users,
    name: "Teams & Workforce",
    phase: 2,
    pitch: "Hierarchical team management. Office/team/group structure. Agent profiles. Onboarding/offboarding workflows with device return tracking.",
    clientBenefit: "When someone joins or leaves, the platform handles the workflow. No more missed device returns.",
    techDetails: {
      tables: ["teams", "team_members", "agent_profiles", "onboarding_tasks"],
      endpoints: ["GET /api/teams", "POST /api/teams", "POST /api/teams/:id/members", "GET /api/teams/:id/performance"],
      complexity: "Medium",
      notes: "Teams can be nested (office → team → group). Agent profiles store license info, certifications, and performance metrics. Onboarding checklists are template-based and auto-assigned on member creation. Offboarding triggers device return workflow and access revocation.",
    },
  },
  {
    icon: Clock,
    name: "Time Clock",
    phase: 2,
    pitch: "Employee time tracking with GPS-verified clock in/out. Overtime calculations. Manager approvals. Payroll-ready exports.",
    clientBenefit: "Replace standalone time tracking apps. Geo-verified clock-ins prevent buddy punching.",
    techDetails: {
      tables: ["time_entries", "time_policies", "time_approvals"],
      endpoints: ["POST /api/time/clock-in", "POST /api/time/clock-out", "GET /api/time/entries", "POST /api/time/approve"],
      complexity: "Medium",
      notes: "Clock-in records GPS coordinates and compares against geo-fence radius for the assigned office/site. Break tracking with auto-deduction rules. Overtime calculated per time_policies (weekly threshold, daily threshold). Manager approval workflow before payroll export. Export as CSV compatible with major payroll providers.",
    },
  },
  {
    icon: Database,
    name: "Microsoft Graph Sync",
    phase: 2,
    pitch: "Intune device compliance, Autopilot enrollment, Entra ID audit logs — surfaced in your dashboard. We integrate with MDM, we don't rebuild it.",
    clientBenefit: "See compliance status alongside your staging pipeline. Quarterly reports pull automatically.",
    techDetails: {
      tables: ["intune_devices", "compliance_snapshots", "entra_audit_logs"],
      endpoints: ["POST /api/integrations/graph/sync", "GET /api/integrations/graph/compliance"],
      complexity: "High",
      notes: "OAuth 2.0 with Microsoft identity platform. Scheduled sync every 15 minutes via Edge Function cron. We read compliance state, device info, and audit logs — we never write to Intune. Compliance snapshots enable trend reporting (compliance score over time). Quarterly PDF reports auto-generated.",
    },
  },
  {
    icon: Zap,
    name: "Automation Engine",
    phase: 3,
    pitch: "Workflow automation for onboarding/offboarding. Custom trigger-action rules. Scheduled compliance checks. The platform runs your playbooks.",
    clientBenefit: "Fewer humans in the loop = fewer mistakes. Your best processes run automatically.",
    techDetails: {
      tables: ["workflows", "workflow_steps", "workflow_runs", "triggers"],
      endpoints: ["GET /api/workflows", "POST /api/workflows", "POST /api/workflows/:id/run"],
      complexity: "Very High",
      notes: "Event-driven architecture: triggers listen to audit_events stream. Actions: send email, create ticket, transition device, assign team member, webhook callout. Conditional logic with AND/OR branching. Run history with per-step status for debugging. Templates for common workflows (new hire onboarding, device refresh, compliance alert).",
    },
  },
  {
    icon: BarChart3,
    name: "Executive Dashboards",
    phase: 3,
    pitch: "Revenue metrics, device fleet health, support ticket trends, compliance scores. Exportable PDF reports. Scheduled email digests.",
    clientBenefit: "Your leadership team gets a single pane of glass. No more stitching reports from 5 different tools.",
    techDetails: {
      tables: ["report_snapshots", "dashboard_configs"],
      endpoints: ["GET /api/reports/executive", "GET /api/reports/export"],
      complexity: "Medium",
      notes: "Role-scoped dashboards — platform admins see cross-org metrics, client admins see their org only. Materialized views for expensive aggregations (refreshed hourly). PDF export via server-side rendering. Scheduled email digests (daily/weekly/monthly) per user preference.",
    },
  },
  {
    icon: HardDrive,
    name: "Hardware-as-a-Service",
    phase: 3,
    pitch: "Device leasing program management. Lease terms, refresh cycles, return logistics. Depreciation tracking. Integration with billing.",
    clientBenefit: "Offer clients device leasing instead of capital purchases. Predictable recurring revenue for you.",
    techDetails: {
      tables: ["lease_agreements", "lease_devices", "refresh_schedules"],
      endpoints: ["GET /api/haas/agreements", "POST /api/haas/agreements", "POST /api/haas/return"],
      complexity: "High",
      notes: "Lease terms: 12/24/36/48 months with configurable refresh at 80% of term. Depreciation calculated using straight-line method. Return logistics integrated with ShipStation (pre-paid return labels). Lease line items auto-added to Stripe subscription as recurring charges.",
    },
  },
];

/* ── Integrations ── */
const integrations = [
  {
    name: "Supabase",
    role: "Database · Auth · Storage · Edge Functions",
    why: "Multi-tenant Postgres with row-level security. Auth, file storage, and serverless functions in one managed service.",
    techStack: "PostgreSQL 15, PostgREST, GoTrue, S3-compatible storage, Deno Edge Functions",
    decision: "Chosen over Firebase for SQL flexibility and RLS. Chosen over raw AWS for speed-to-market and built-in auth.",
  },
  {
    name: "Stripe",
    role: "Billing & Subscriptions",
    why: "Industry-leading subscription billing with customer portal, dunning, proration, and 200+ webhook events.",
    techStack: "Stripe Billing, Checkout, Customer Portal, Invoicing, Webhooks",
    decision: "Chosen over Square for SaaS subscription depth. Square only relevant if card-present POS becomes a use case.",
  },
  {
    name: "ShipStation",
    role: "Shipping & Fulfillment",
    why: "Batch label creation, multi-carrier rate shopping, and tracking webhooks. Used by 100K+ sellers.",
    techStack: "REST API v2, Webhook subscriptions, Multi-carrier (USPS, UPS, FedEx)",
    decision: "Batch-first API design reduces API calls by 10-50x vs sequential processing. Best carrier rate aggregation at our volume.",
  },
  {
    name: "GoDaddy",
    role: "Domains & DNS",
    why: "Reseller API for domain purchase and DNS automation. Largest domain registrar — clients trust the name.",
    techStack: "Reseller API, Domain Management API, DNS API",
    decision: "Reseller model means we can mark up domains. Auto-provisioning DNS templates eliminates manual configuration entirely.",
  },
  {
    name: "Dropbox Sign",
    role: "E-Signatures",
    why: "Embedded signing, templates, legally-binding audit trails. Lower per-envelope cost than DocuSign at our volume tier.",
    techStack: "Embedded signing (iFrame), Template API, Webhook callbacks",
    decision: "Chosen over DocuSign for better embedded experience and lower cost. Chosen over Adobe Sign for simpler API and faster integration.",
  },
  {
    name: "Microsoft Graph",
    role: "Device Compliance & Identity",
    why: "Surface Intune compliance and Entra audit logs without rebuilding MDM. Enterprise clients expect Microsoft integration.",
    techStack: "Graph API v1.0, Intune Device Management, Entra ID Audit Logs, OAuth 2.0",
    decision: "Read-only integration — we surface state, we never write to Intune. This keeps us out of MDM liability while providing compliance visibility.",
  },
  {
    name: "Brevo",
    role: "Email & Notifications",
    why: "Transactional SMTP for tickets, shipping, billing receipts. Template-based emails with delivery tracking.",
    techStack: "SMTP API, Template Engine, Webhook tracking (opens, bounces)",
    decision: "Chosen over SendGrid for better pricing at our volume. Chosen over raw SES for template management and delivery analytics out of the box.",
  },
  {
    name: "Vercel",
    role: "Hosting & Edge CDN",
    why: "Next.js-optimized hosting with global edge network. Preview deploys for every PR. Built-in analytics.",
    techStack: "Edge Network, Serverless Functions, ISR, Preview Deployments, Web Analytics",
    decision: "Purpose-built for Next.js. Zero-config deployments from GitHub. Preview URLs for every pull request enable QA before merge.",
  },
];

/* ── Revenue ── */
const pricingTiers = [
  { plan: "Starter", price: 29, seats: "Up to 10", devices: "50", storage: "50 GB", websites: "1", target: "Small brokerages, new MSP clients" },
  { plan: "Professional", price: 49, seats: "Up to 50", devices: "250", storage: "250 GB", websites: "5", target: "Growing operations, mid-market" },
  { plan: "Enterprise", price: 84, seats: "Unlimited", devices: "Unlimited", storage: "2 TB", websites: "Unlimited", target: "Large operations, enterprise" },
];

/* ── Build Phases ── */
const buildPhases = [
  {
    phase: "Phase 1 — MVP",
    timeline: "Weeks 1–8",
    goal: "Sellable product. Enough to onboard your first paying client.",
    color: "emerald",
    items: [
      "Multi-tenant org setup + Supabase Auth",
      "Role-based access control (6 role tiers)",
      "Device inventory & 6-stage lifecycle pipeline",
      "ShipStation shipping integration (batch-first)",
      "Helpdesk ticketing with SLA tracking",
      "Document vault with CDN + signed URLs",
      "Stripe billing + customer portal",
      "Audit logging (append-only, immutable)",
      "Brevo transactional email notifications",
      "Landing page + marketing site",
    ],
  },
  {
    phase: "Phase 2 — Moat",
    timeline: "Weeks 9–16",
    goal: "Retention features. The things that make clients impossible to leave.",
    color: "blue",
    items: [
      "Hosted real estate websites + listing pages",
      "GoDaddy domain purchase & DNS automation",
      "Lead capture forms + agent routing",
      "Dropbox Sign e-signature integration",
      "Microsoft Graph compliance sync",
      "Teams & workforce management",
      "Time clock with GPS geo-fencing",
      "Mobile apps — Realtor + Technician (Expo)",
    ],
  },
  {
    phase: "Phase 3 — Scale",
    timeline: "Weeks 17–24",
    goal: "Automation and analytics. 10x your operation without 10x-ing headcount.",
    color: "purple",
    items: [
      "Workflow automation engine (trigger → action)",
      "Executive dashboards + PDF reports",
      "Hardware-as-a-Service leasing program",
      "Advanced API access for enterprise clients",
      "Quarterly compliance report auto-generation",
    ],
  },
];

/* ── Mobile Apps ── */
const mobileApps = [
  {
    name: "Realtor App",
    icon: Smartphone,
    audience: "Real estate agents & brokers",
    features: [
      "View and respond to leads instantly",
      "Upload photos & documents to vault",
      "Track e-signature status in real-time",
      "Clock in/out with GPS verification",
      "Push notifications for new leads & tickets",
      "View team roster and contacts",
    ],
  },
  {
    name: "Technician App",
    icon: Server,
    audience: "MSP technicians & field staff",
    features: [
      "Scan devices via QR/barcode camera",
      "Update device staging step on the spot",
      "Complete staging checklists with photo evidence",
      "Create shipments and print packing slips",
      "View and update support tickets",
      "Push notifications for new assignments",
    ],
  },
];

/* ── Why Now ── */
const whyNow = [
  {
    icon: Target,
    title: "First-Mover Advantage",
    desc: "No one has combined MSP operations with real estate brokerage tools in a single multi-tenant SaaS. You'd be the only platform where an IT company can also power its clients' real estate websites, domains, and document workflows.",
  },
  {
    icon: TrendingUp,
    title: "Compounding Revenue Model",
    desc: "Every client added increases MRR across multiple dimensions: seats, devices, storage, domains, e-sign envelopes. There's no single revenue ceiling — it compounds as clients grow their own operations.",
  },
  {
    icon: Lock,
    title: "Deep Lock-In (The Good Kind)",
    desc: "Once clients have their domains, websites, documents, device history, and billing flowing through your platform, switching cost is enormous. Phase 2 features are specifically designed as retention moats.",
  },
  {
    icon: Lightbulb,
    title: "AI-Ready Architecture",
    desc: "The audit log captures every mutation with full context. The vault stores every document with metadata. This structured data is the perfect foundation for AI features: auto-ticket responses, listing description generation, and compliance summaries.",
  },
];

/* ═══════════════════════════════════════════════════════ */
/*  INTERACTIVE COMPONENTS                                 */
/* ═══════════════════════════════════════════════════════ */

/* ── Expandable Module Card ── */
function ModuleCard({ mod, index }: { mod: PlatformModule; index: number }) {
  const [open, setOpen] = useState(false);
  const phaseColors = {
    1: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
    2: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/20", border: "border-blue-500/20" },
    3: { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20", border: "border-purple-500/20" },
  };
  const colors = phaseColors[mod.phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`border border-border/60 rounded-xl bg-surface/30 hover:bg-surface/40 transition-all ${open ? "ring-1 ring-accent/20" : ""}`}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-6 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <mod.icon className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold">{mod.name}</h3>
            <p className="text-sm text-muted leading-relaxed mt-1 line-clamp-2">{mod.pitch}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${colors.badge}`}>
            Phase {mod.phase}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-5 h-5 text-muted" />
          </motion.div>
        </div>
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Client impact */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-300/90">
                  <strong className="text-emerald-300">Client impact:</strong> {mod.clientBenefit}
                </p>
              </div>

              {/* Technical details */}
              <div className="bg-background/40 rounded-lg border border-border/40 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Code2 className="w-4 h-4 text-accent" />
                  <span className="text-xs text-accent font-semibold uppercase tracking-wider">Technical Implementation</span>
                </div>

                <p className="text-sm text-muted leading-relaxed">{mod.techDetails.notes}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-accent font-semibold mb-2">Database Tables</div>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.techDetails.tables.map((t) => (
                        <code key={t} className="text-xs bg-surface-light/80 text-muted px-2 py-0.5 rounded border border-border/50">
                          {t}
                        </code>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-accent font-semibold mb-2">Key Endpoints</div>
                    <div className="flex flex-col gap-1">
                      {mod.techDetails.endpoints.map((e) => (
                        <code key={e} className="text-xs bg-surface-light/80 text-muted px-2 py-0.5 rounded border border-border/50">
                          {e}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted">Complexity:</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    mod.techDetails.complexity === "Very High"
                      ? "bg-red-500/10 text-red-400"
                      : mod.techDetails.complexity === "High"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {mod.techDetails.complexity}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Integration Tab Explorer ── */
function IntegrationExplorer() {
  const [active, setActive] = useState(0);
  const current = integrations[active];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tab list */}
      <div className="space-y-2">
        {integrations.map((int, i) => (
          <button
            key={int.name}
            onClick={() => setActive(i)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
              active === i
                ? "bg-accent/10 border border-accent/30 text-foreground"
                : "border border-border/40 bg-surface/20 text-muted hover:text-foreground hover:bg-surface/40"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              active === i ? "bg-accent/20" : "bg-surface-light"
            }`}>
              <span className="text-xs font-bold">{int.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{int.name}</div>
              <div className="text-xs text-muted truncate">{int.role}</div>
            </div>
            {active === i && <ChevronRight className="w-4 h-4 text-accent ml-auto shrink-0" />}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="border border-border/60 rounded-xl p-6 bg-surface/30 h-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-bold">{current.name}</h3>
              <span className="text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full font-medium">
                {current.role}
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">Why This Integration</h4>
                <p className="text-sm text-muted leading-relaxed">{current.why}</p>
              </div>

              <div>
                <h4 className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">Technical Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {current.techStack.split(", ").map((item) => (
                    <code key={item} className="text-xs bg-background/60 text-muted px-2.5 py-1 rounded-md border border-border/50">
                      {item}
                    </code>
                  ))}
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/15 rounded-lg p-4">
                <h4 className="text-xs text-accent font-semibold uppercase tracking-wider mb-2">Decision Rationale</h4>
                <p className="text-sm text-muted leading-relaxed">{current.decision}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Revenue Calculator ── */
function RevenueCalculator() {
  const [clients, setClients] = useState(25);
  const [avgSeats, setAvgSeats] = useState(15);
  const [planMix, setPlanMix] = useState<"starter" | "pro" | "enterprise">("pro");

  const priceMap = { starter: 29, pro: 49, enterprise: 84 };
  const price = priceMap[planMix];
  const mrr = clients * avgSeats * price;
  const arr = mrr * 12;
  const annualDiscount = 0.8; // 20% discount for annual
  const arrAnnual = mrr * annualDiscount * 12;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="p-6 bg-surface/40 border-b border-border/40 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Clients slider */}
          <div>
            <label className="text-xs text-accent font-semibold uppercase tracking-wider block mb-2">
              Number of Clients
            </label>
            <input
              type="range"
              min={5}
              max={200}
              step={5}
              value={clients}
              onChange={(e) => setClients(Number(e.target.value))}
              className="w-full accent-accent h-2 rounded-full cursor-pointer"
              title="Number of clients"
            />
            <div className="text-2xl font-bold mt-2">{clients}</div>
          </div>

          {/* Avg seats slider */}
          <div>
            <label className="text-xs text-accent font-semibold uppercase tracking-wider block mb-2">
              Avg Seats per Client
            </label>
            <input
              type="range"
              min={3}
              max={100}
              step={1}
              value={avgSeats}
              onChange={(e) => setAvgSeats(Number(e.target.value))}
              className="w-full accent-accent h-2 rounded-full cursor-pointer"
              title="Average seats per client"
            />
            <div className="text-2xl font-bold mt-2">{avgSeats}</div>
          </div>

          {/* Plan mix */}
          <div>
            <label className="text-xs text-accent font-semibold uppercase tracking-wider block mb-2">
              Dominant Plan
            </label>
            <div className="flex gap-2">
              {(["starter", "pro", "enterprise"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlanMix(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    planMix === p
                      ? "bg-accent text-white"
                      : "bg-surface-light text-muted hover:text-foreground border border-border/50"
                  }`}
                >
                  {p === "pro" ? "Pro" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="text-2xl font-bold mt-2">${price}<span className="text-sm text-muted font-normal">/seat/mo</span></div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xs text-muted mb-1">Total Seats</div>
          <div className="text-2xl font-bold text-foreground">{(clients * avgSeats).toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted mb-1">MRR</div>
          <div className="text-2xl font-bold text-emerald-400">${mrr.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted mb-1">ARR (Monthly)</div>
          <div className="text-2xl font-bold text-emerald-400">${arr.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted mb-1">ARR (Annual Plans)</div>
          <div className="text-2xl font-bold text-accent">${Math.round(arrAnnual).toLocaleString()}</div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <p className="text-xs text-muted text-center">
          This projection excludes add-on revenue from domain resale, storage overages, e-sign volume, and Hardware-as-a-Service margins.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                         */
/* ═══════════════════════════════════════════════════════ */

export default function ProposalContent() {
  const [tocOpen, setTocOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Sticky Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <Shield className="w-4 h-4 text-accent" />
            </div>
            <span className="text-lg font-semibold text-accent">MSP</span>
          </a>

          <div className="flex items-center gap-4">
            {/* Table of Contents toggle (mobile) */}
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="sm:hidden text-sm text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
            >
              Sections <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {/* Desktop TOC links */}
            <div className="hidden sm:flex items-center gap-1">
              {tocItems.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-xs text-muted hover:text-foreground px-2 py-1 rounded-md hover:bg-surface-light/50 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <span className="text-xs text-border mx-1">|</span>
              <a href="/" className="text-xs text-muted hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Home
              </a>
            </div>
          </div>
        </div>

        {/* Mobile TOC dropdown */}
        <AnimatePresence>
          {tocOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden bg-surface border-t border-border"
            >
              <div className="p-4 grid grid-cols-2 gap-2">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setTocOpen(false)}
                    className="text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-surface-light/50 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">

        {/* ══════════════════════════════════════════ */}
        {/*  HERO HEADER                               */}
        {/* ══════════════════════════════════════════ */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="mb-20">
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-6">
            <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest">
              Confidential
            </div>
            <div className="px-3 py-1 rounded-full bg-surface-light border border-border text-muted text-xs">
              February 2026
            </div>
            <div className="px-3 py-1 rounded-full bg-surface-light border border-border text-muted text-xs">
              v2.0 — Full Technical Scope
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Build Proposal
            <br />
            <span className="bg-linear-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
              MSP Operations Platform
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted max-w-3xl leading-relaxed mb-8"
          >
            A custom-built, multi-tenant SaaS platform that unifies managed IT services
            and real estate brokerage operations into a single product you own, operate, and sell.
          </motion.p>

          {/* Key stats bar */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl border border-border/60 bg-surface/30 mb-8"
          >
            <AnimatedStat value={16} label="Platform Modules" />
            <AnimatedStat value={8} label="Integrations" />
            <AnimatedStat value={3} label="Build Phases" />
            <AnimatedStat value={24} label="Weeks to Full Launch" suffix="w" />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
            <a
              href="#modules"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              Explore Modules <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#revenue"
              className="inline-flex items-center gap-2 border border-border hover:border-accent/40 text-foreground font-medium px-6 py-3 rounded-xl transition-all hover:bg-surface-light/30"
            >
              Revenue Calculator <DollarSign className="w-4 h-4" />
            </a>
          </motion.div>
        </motion.div>

        {/* ══════════════════════════════════════════ */}
        {/*  THE PROBLEM                               */}
        {/* ══════════════════════════════════════════ */}
        <Section title="The Problem" subtitle="Why existing tools don't work for what you're building" id="problem">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {problems.map((p, i) => (
              <motion.div
                key={p.pain}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border border-red-500/20 rounded-xl p-6 bg-red-500/2 hover:bg-red-500/4 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <p.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-red-300">{p.pain}</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">{p.detail}</p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-surface/50 border border-border rounded-xl p-6 text-center"
          >
            <p className="text-sm text-muted">
              <strong className="text-foreground">The result:</strong> MSP operators spend more time managing their tools
              than managing their clients. Margins shrink. Mistakes multiply. Growth stalls.
            </p>
          </motion.div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  THE SOLUTION                              */}
        {/* ══════════════════════════════════════════ */}
        <Section title="The Solution" subtitle="What we're building and why it wins" id="solution">
          <div className="space-y-6">
            {valueProps.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="border border-border/60 rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <v.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{v.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs text-accent font-medium">{v.metric}</span>
                      </div>
                    </div>
                  </div>

                  {/* Two-column: Business | Technical */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/3 border border-emerald-500/15 rounded-lg p-4">
                      <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Business Value
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{v.pitch}</p>
                    </div>
                    <div className="bg-accent/3 border border-accent/15 rounded-lg p-4">
                      <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> How We Build It
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{v.tech}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  WHY NOW                                   */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Why Now" subtitle="The strategic case for building this today" id="why-now">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyNow.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
                className="flex gap-4 p-5 rounded-xl border border-border/50 bg-surface/20 hover:bg-surface/40 transition-colors cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  PLATFORM MODULES (expandable)             */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Platform Modules" subtitle="16 modules — click any to see the technical implementation" id="modules">
          {/* Phase filters */}
          <PhaseFilteredModules modules={platformModules} />
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  ARCHITECTURE                              */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Architecture" subtitle="The technical foundation — what powers everything above" id="architecture">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Smartphone, label: "Frontend", value: "Next.js 16 + TypeScript", detail: "Server-rendered React with Tailwind CSS v4 and Framer Motion" },
              { icon: Database, label: "Database", value: "Supabase Postgres", detail: "Row-Level Security on every table. Multi-tenant by design." },
              { icon: Lock, label: "Auth", value: "Supabase Auth", detail: "Email/password, magic link, future SSO. JWT sessions." },
              { icon: Cloud, label: "Hosting", value: "Vercel + Expo", detail: "Global edge CDN for web. React Native for mobile." },
              { icon: CreditCard, label: "Billing", value: "Stripe Billing", detail: "Subscriptions, customer portal, dunning, invoices." },
              { icon: FileText, label: "Storage", value: "Supabase Storage", detail: "CDN-cached, signed URLs, thumbnails on upload." },
              { icon: Mail, label: "Email", value: "Brevo SMTP", detail: "Transactional emails for tickets, shipping, billing." },
              { icon: Shield, label: "Audit", value: "Append-only log", detail: "Immutable event table. No UPDATE. No DELETE." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={scaleIn}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="bg-surface/50 border border-border/60 rounded-xl p-4 cursor-default"
              >
                <item.icon className="w-5 h-5 text-accent mb-2" />
                <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-sm font-medium text-foreground mb-1">{item.value}</div>
                <div className="text-xs text-muted">{item.detail}</div>
              </motion.div>
            ))}
          </div>

          {/* Multi-tenant model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface/40 border border-border/50 rounded-xl p-6"
          >
            <h4 className="text-base font-bold mb-4">Multi-Tenant Isolation Model</h4>
            <p className="text-sm text-muted leading-relaxed mb-5">
              Every record has an <code className="text-xs bg-surface-light px-1.5 py-0.5 rounded">org_id</code>.
              Supabase RLS policies filter every query automatically. Even a bug in application code cannot expose one tenant&apos;s data to another.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { role: "Platform Admin", scope: "All orgs", color: "text-accent", desc: "Your internal team. Full cross-org access." },
                { role: "Client Admin", scope: "Their org only", color: "text-emerald-400", desc: "Your client's IT lead. Manages their own users and devices." },
                { role: "Client Viewer", scope: "Read-only", color: "text-muted", desc: "End-users and stakeholders. Can see but not change." },
              ].map((r) => (
                <div key={r.role} className="bg-background/50 rounded-lg p-4 border border-border/40">
                  <div className={`text-sm font-semibold mb-1 ${r.color}`}>{r.role}</div>
                  <div className="text-xs text-muted mb-2">Scope: {r.scope}</div>
                  <div className="text-xs text-muted">{r.desc}</div>
                </div>
              ))}
            </div>
            <div className="bg-accent/5 border border-accent/15 rounded-lg p-4">
              <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> Under the Hood
              </div>
              <p className="text-xs text-muted leading-relaxed">
                RLS policy chain: <code className="bg-surface-light px-1 py-0.5 rounded">auth.uid()</code> → lookup in <code className="bg-surface-light px-1 py-0.5 rounded">org_members</code> → extract <code className="bg-surface-light px-1 py-0.5 rounded">org_id</code> and <code className="bg-surface-light px-1 py-0.5 rounded">role</code> → filter every SELECT/INSERT/UPDATE/DELETE.
                Six roles form a hierarchy: platform_admin &gt; platform_tech &gt; client_admin &gt; client_manager &gt; client_agent &gt; client_viewer.
                Higher roles inherit all permissions of lower roles.
              </p>
            </div>
          </motion.div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  INTEGRATIONS (tabbed explorer)            */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Integration Stack" subtitle="8 integrations — click any to see why we chose it and how it works" id="integrations">
          <IntegrationExplorer />
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  MOBILE APPS                               */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Mobile Apps" subtitle="Two purpose-built apps for your two user types" id="mobile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {mobileApps.map((app, i) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -3 }}
                className="border border-border/60 rounded-xl p-6 bg-surface/30 cursor-default"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <app.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{app.name}</h3>
                    <p className="text-xs text-muted">{app.audience}</p>
                  </div>
                </div>
                <ul className="space-y-2.5 mt-4">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-4 h-4 text-accent" />
              <span className="text-xs text-accent font-semibold uppercase tracking-wider">Technical Details</span>
            </div>
            <p className="text-sm text-muted">
              Both apps built with <strong className="text-foreground">React Native (Expo)</strong> — one codebase for iOS and Android.
              Shared TypeScript types via <code className="text-xs bg-surface-light px-1.5 py-0.5 rounded">packages/shared</code>.
              Same Supabase Auth flow as web. Push notifications via Firebase Cloud Messaging.
              Offline-first device scanning with sync-on-reconnect.
            </p>
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  REVENUE MODEL (interactive calculator)    */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Revenue Model" subtitle="Interactive — adjust the sliders to model your growth" id="revenue">
          <RevenueCalculator />

          {/* Pricing tiers table */}
          <h3 className="text-lg font-bold mt-10 mb-4">Per-Seat Pricing Tiers</h3>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Plan", "Price", "Seats", "Devices", "Storage", "Websites", "Target"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-accent font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingTiers.map((row) => (
                  <tr key={row.plan} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                    <td className="py-3 px-4 font-bold">{row.plan}</td>
                    <td className="py-3 px-4 text-accent font-bold">${row.price}/seat/mo</td>
                    <td className="py-3 px-4 text-muted">{row.seats}</td>
                    <td className="py-3 px-4 text-muted">{row.devices}</td>
                    <td className="py-3 px-4 text-muted">{row.storage}</td>
                    <td className="py-3 px-4 text-muted">{row.websites}</td>
                    <td className="py-3 px-4 text-muted text-xs">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional revenue */}
          <div className="bg-surface/40 border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-5 h-5 text-accent" />
              <h4 className="text-base font-bold">Additional Revenue Streams</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { item: "Domain resale markup", range: "$5–15/year per domain" },
                { item: "Vault storage overage fees", range: "$0.10–0.15/GB" },
                { item: "E-sign volume beyond plan limits", range: "Per-envelope pricing" },
                { item: "Premium support tiers & SLAs", range: "Tiered pricing" },
                { item: "White-label setup fees", range: "One-time per site" },
                { item: "Hardware-as-a-Service margins", range: "Recurring lease revenue" },
              ].map((r) => (
                <div key={r.item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-foreground font-medium">{r.item}</span>
                    <span className="text-xs text-muted ml-2">{r.range}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  BUILD PHASES (timeline)                   */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Build Phases" subtitle="The roadmap from zero to scale — 24 weeks to full platform" id="phases">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="hidden sm:block absolute left-6 top-8 bottom-8 w-px bg-border" />

            <div className="space-y-8">
              {buildPhases.map((phase, pi) => {
                const colorMap: Record<string, string> = {
                  emerald: "bg-emerald-500 border-emerald-500/30 text-emerald-400",
                  blue: "bg-blue-500 border-blue-500/30 text-blue-400",
                  purple: "bg-purple-500 border-purple-500/30 text-purple-400",
                };
                const c = colorMap[phase.color];
                const [bg, border, text] = c.split(" ");

                return (
                  <motion.div
                    key={phase.phase}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: pi * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className="hidden sm:flex absolute left-3 top-6 w-7 h-7 rounded-full bg-background border-2 border-border items-center justify-center z-10">
                      <div className={`w-3 h-3 rounded-full ${bg}`} />
                    </div>

                    <div className={`sm:ml-16 border ${border} rounded-xl overflow-hidden`}>
                      <div className="px-6 py-4 border-b border-inherit bg-surface/40">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-lg font-bold">{phase.phase}</h3>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${bg}/10 ${text}`}>
                              {phase.timeline}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted mt-1">{phase.goal}</p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {phase.items.map((item, i) => (
                            <div key={item} className="flex items-start gap-2.5">
                              <span className={`text-xs font-mono mt-0.5 shrink-0 w-5 ${text}`}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="text-sm text-muted">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  NEXT STEPS                                */}
        {/* ══════════════════════════════════════════ */}
        <Section title="Next Steps" subtitle="What happens after you approve this proposal" id="next-steps">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { step: 1, title: "Approve & Kick Off", desc: "Review this proposal, confirm scope, and lock in the build. We create your Supabase project and connect it to the GitHub repo." },
              { step: 2, title: "Database & Auth", desc: "Run migration scripts to create the multi-tenant schema. Implement sign-up, sign-in, role assignment, and RLS policies." },
              { step: 3, title: "First Module Live", desc: "Device lifecycle pipeline + inventory management. The first feature your technicians can use in production." },
              { step: 4, title: "Billing & Ticketing", desc: "Stripe subscriptions + helpdesk. You can now charge clients and they can submit support requests." },
              { step: 5, title: "Ship MVP", desc: "Vault, ShipStation, notifications, and audit logs complete Phase 1. You onboard your first paying client." },
              { step: 6, title: "Phase 2 Moat", desc: "Hosted sites, domains, e-sign, and mobile apps. The features that make your platform irreplaceable." },
            ].map((s) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: s.step * 0.08 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className="border border-border/60 rounded-xl p-6 bg-surface/30 cursor-default"
              >
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <span className="text-sm text-accent font-bold">{s.step}</span>
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/*  FOOTER CTA                                */}
        {/* ══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-10 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to build?</h3>
              <p className="text-sm text-muted max-w-lg">
                This document outlines the complete scope — from database architecture to revenue projections.
                Let&apos;s lock it in and start Phase 1.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-medium px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-accent/25 shrink-0 text-lg"
            >
              Let&apos;s Go <ArrowRight className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-12 text-center">
            <p className="text-xs text-muted">
              MSP Platform — Build Proposal v2.0 · February 2026 · Confidential
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*  PHASE-FILTERED MODULE LIST                             */
/* ═══════════════════════════════════════════════════════ */

function PhaseFilteredModules({ modules }: { modules: PlatformModule[] }) {
  const [filter, setFilter] = useState<0 | 1 | 2 | 3>(0); // 0 = all
  const filtered = filter === 0 ? modules : modules.filter((m) => m.phase === filter);

  return (
    <>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 0 as const, label: "All Modules", count: modules.length },
          { value: 1 as const, label: "Phase 1 — MVP", count: modules.filter((m) => m.phase === 1).length },
          { value: 2 as const, label: "Phase 2 — Moat", count: modules.filter((m) => m.phase === 2).length },
          { value: 3 as const, label: "Phase 3 — Scale", count: modules.filter((m) => m.phase === 3).length },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filter === btn.value
                ? "bg-accent text-white shadow-lg shadow-accent/20"
                : "bg-surface-light/50 text-muted hover:text-foreground border border-border/50"
            }`}
          >
            {btn.label}
            <span className={`ml-2 text-xs ${filter === btn.value ? "text-white/70" : "text-muted"}`}>
              ({btn.count})
            </span>
          </button>
        ))}
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((mod, i) => (
            <ModuleCard key={mod.name} mod={mod} index={i} />
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-muted">
          Click any module to expand its technical implementation details including database tables, API endpoints, and complexity assessment.
        </p>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════ */
/*  SECTION WRAPPER                                        */
/* ═══════════════════════════════════════════════════════ */

function Section({
  title,
  subtitle,
  id,
  children,
}: {
  title: string;
  subtitle: string;
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
      className="mb-24 scroll-mt-24"
    >
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
        <div className="mt-4 h-px bg-linear-to-r from-accent/40 via-border to-transparent" />
      </div>
      {children}
    </motion.section>
  );
}
