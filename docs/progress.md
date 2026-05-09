# MSP Platform — Progress Log

> This document tracks every piece of progress on the MSP + Real Estate Operations Platform.
> Entries are in reverse chronological order (newest first).

---

## 2026-05-09 — Database Multi-Schema, Stella Analysis, Support Hotkey

### Completed

1. **Founding admin seed** (`supabase/seed.sql`)
   - Platform org + Joshua Poolos + Rosser Embrasil (`platform_admin`), bcrypt-hashed
     password `123456789`, `must_change_password=true`.

2. **Stella `stella-real-estate` deep dive**
   - `docs/stella-deep-dive.md` — full architectural inventory (50+ migrations,
     18 legal pages, 11-platform social scheduler, white-label site builder,
     full Asana-clone PM module, multi-currency CRM, etc.)
   - `docs/stella-port-top-50.md` — ranked Top 50 features to port (S/M/L effort).

3. **Multi-schema database architecture**
   - `docs/database-architecture.md` — bounded contexts as Postgres schemas
     (`core`, `directory`, `assets`, `intune`, `support`, `realestate`, `vault`,
     `billing`, `marketing`, `analytics`, `automation`, `audit`, `internal`).
   - Naming, RLS, audit, Prisma `prismaSchemaFolder` layout.
   - Migration path from current `public.*` to `core.*`/`assets.*` documented.

4. **New schemas + migrations**
   - `005_support_schema.sql` — `support.tickets`, `ticket_messages`, `ticket_attachments`,
     `screenshots`, `kb_articles` + pgvector embeddings, `sla_policies` (seeded P1-P5),
     `triage_rules`, `csat_surveys`, full RLS.
   - `006_intune_schema.sql` — `intune_devices`, `compliance_snapshots`,
     `configuration_profiles`, `autopilot_profiles`, `enrollment_status_pages`,
     `apps`, `app_deployments`, `app_deployment_runs`, `scripts`, `script_runs`,
     `update_rings`, RLS, seeded daily-reboot scripts (Win + macOS).
   - `007_directory_schema.sql` — `azure_tenants`, `oauth_apps`, `oauth_tokens`,
     `external_users`, `groups` (static + dynamic), `group_members` (nesting),
     `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions`,
     `user_scopes`, `role_entitlements`, `conditional_access_policies`. Seeded
     14 system roles + 27 platform permissions.

5. **Microsoft / Intune planning docs**
   - `docs/intune-deployment.md` — Autopilot, ESP, gold-image WIM, app deployment
     matrix, configuration profiles, Conditional Access, MSP Agent daemon spec.
   - `docs/intune-daily-reboot.md` — 03:00 nightly auto-save + reboot via
     scheduled task (Windows) and launchd (macOS), with full PowerShell + bash
     installer scripts, defer-during-meeting heuristics, max-2-delays UX.
   - `docs/azure-graph-integration.md` — App registration, scopes, sync workers
     (delta queries), write paths, dynamic-group rules, drift detection,
     token rotation, observability, kill switches.

6. **Support hotkey (⌘/Ctrl + /)**
   - `web/src/components/support/SupportHotkey.tsx` — global keyboard listener,
     `html2canvas` viewport screenshot, modal with preview + subject/body/priority,
     captures URL, route, UA, viewport, DPR, OS, referrer, last 50 console messages.
   - `web/src/app/api/support/tickets/route.ts` — auth-gated, inserts into
     `support.tickets`, uploads PNG to private `support-screenshots` bucket,
     creates `support.screenshots` row, returns `ticket_number`.
   - Mounted in `web/src/app/layout.tsx` so it's app-wide.
   - `docs/support-hotkey.md` — operator runbook + bucket policy SQL.

7. **Env-var compatibility**
   - `web/src/lib/supabase/{client,server}.ts` now accept either
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new) or
     `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy).

8. **Dependencies**
   - Installed `html2canvas` for browser screenshot capture.

### Files Created / Modified (this session)

```
supabase/
├── seed.sql                                       (founders + platform org)
├── migrations/
│   ├── 005_support_schema.sql                     (NEW)
│   ├── 006_intune_schema.sql                      (NEW)
│   └── 007_directory_schema.sql                   (NEW)
docs/
├── stella-deep-dive.md                            (NEW)
├── stella-port-top-50.md                          (NEW)
├── database-architecture.md                       (NEW)
├── intune-deployment.md                           (NEW)
├── intune-daily-reboot.md                         (NEW)
├── azure-graph-integration.md                     (NEW)
├── support-hotkey.md                              (NEW)
└── progress.md                                    (this file, updated)
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                             (mounted SupportHotkey)
│   │   └── api/support/tickets/route.ts           (NEW)
│   ├── components/support/SupportHotkey.tsx       (NEW)
│   └── lib/supabase/{client,server}.ts            (env var compat)
└── package.json                                   (+ html2canvas)
```

### Next Steps

1. **Apply migrations 005–007** + run `seed.sql` in Supabase.
2. **Create the `support-screenshots` storage bucket** + policies (see `docs/support-hotkey.md`).
3. **Schema refactor migration `010`**: move `public.*` tables into `core.*`/`assets.*`,
   recreate RLS under new schema, add `core.is_member_of_org()` helper.
4. **Adopt Prisma** with `prismaSchemaFolder` mirroring the new schemas.
5. **Sign-in page + must_change_password middleware** for the founders.
6. **Microsoft Graph App Registration** + token storage in `directory.oauth_tokens`.
7. **First sync worker**: `users-delta` populating `directory.external_users`.
8. **MSP Agent v0.1** (Windows tray daemon, heartbeat + reboot beacons).

---

## 2026-02-20 — Project Initialization & Landing Page

### Completed

1. **Repository Setup**
   - Initialized Git repository at `github.com/ZRosserMcIntosh/msp`
   - Created monorepo structure: `web/`, `packages/shared/`, `supabase/`
   - Root `package.json` with proxy scripts (`npm run dev` from root)

2. **Next.js App Created**
   - Next.js 16.1.6 with App Router, TypeScript, Tailwind CSS v4
   - PostCSS configured with `@tailwindcss/postcss`
   - Deployed to Vercel at `msp-two.vercel.app`
   - Root directory set to `web` in Vercel settings

3. **Landing Page — Full Implementation**
   - **Navbar**: Fixed header with dropdown navigation, mobile hamburger menu, scroll-aware background blur
   - **Hero Section**: Animated gradient orbs, pulsing badge, gradient text headline, three feature cards with hover animations
   - **Logo Carousel**: Infinite marquee of 12 integration partner logos (Supabase, Stripe, AWS, GitHub, OpenAI, Anthropic, xAI, Plaid, Replit, Apple Pay, App Store, Google Play) with fade edges
   - **Platform Section**: 6-tab interactive showcase (MSP Operations, Real Estate Portal, Security, Vault, Teams, Billing) with animated mockup UI panels and feature lists
   - **Features Grid**: 12 capability cards with staggered reveal animations (Device Lifecycle, ShipStation, Hosted Sites, Vault, Ticketing, RBAC, Billing, Domains, Compliance, Security, Automation, Graph Sync)
   - **Pipeline Visualization**: 6-stage device lifecycle (Received → Provisioned → QA → Shipped → Active → Retired) with colored nodes, connection line, and 4 stats counters
   - **Architecture Section**: 6-layer stack diagram (Client, API, Auth, Data, Storage, Integrations) with alternating slide-in animations
   - **Pricing Section**: 3-tier pricing (Starter $24, Professional $49, Enterprise $84) with monthly/annual toggle (20% discount), highlighted "Most Popular" card
   - **CTA Section**: Gradient mesh background, "Start Free Trial" + "Schedule Demo" buttons
   - **Footer**: 4-column link grid (Platform, Resources, Company, Legal) with brand section and social links

4. **Mobile Optimization Pass**
   - Bumped all `text-[10px]` to `text-xs` minimum across all components
   - Increased button sizes (CTA buttons: `py-3`+, toggle: `w-14 h-7`)
   - Responsive text scaling (`text-sm sm:text-base` pattern)
   - Centered text on mobile with `text-center sm:text-left`
   - Responsive grid gaps and padding
   - Accessible toggle with `aria-label`

5. **Technical Proposal Page (`/proposal`)**
   - Architecture overview with tech stack grid
   - Integration deep-dive: 8 integrations with role, detail, and use case
   - Module-by-module implementation map: 16 modules with phase, complexity, tables, endpoints
   - Mobile app feature split (Realtor + MSP Technician)
   - Storage economics table with egress mitigation and quota enforcement
   - Build phases (Phase 1 MVP, Phase 2 Moat, Phase 3 Scale)
   - Stripe vs Square comparison table with recommendation

6. **Packages & Dependencies Installed**
   - `framer-motion` — animations
   - `lucide-react` — icons
   - `clsx` — classname utility
   - `@supabase/supabase-js` — database client
   - `@supabase/ssr` — server-side Supabase auth

7. **Supabase Client Stubs Created**
   - `web/src/lib/supabase/client.ts` — browser client
   - `web/src/lib/supabase/server.ts` — server-side client
   - `web/src/lib/supabase/admin.ts` — service-role admin client
   - `web/.env.example` — environment variable template

8. **Shared Types Package**
   - `packages/shared/types.ts` — Organization, User, Device, Ticket, AuditEvent types
   - `packages/shared/index.ts` — barrel export

### Infrastructure

| Component | Status | URL |
|-----------|--------|-----|
| GitHub Repo | ✅ Live | github.com/ZRosserMcIntosh/msp |
| Vercel Deploy | ✅ Live | msp-two.vercel.app |
| Supabase Project | ⏳ Not created yet | — |
| Custom Domain | ⏳ Not configured | — |

### Files Created

```
/
├── package.json                           (root workspace scripts)
├── .gitignore
├── README.md
├── packages/
│   └── shared/
│       ├── package.json
│       ├── index.ts
│       └── types.ts
├── supabase/
│   ├── seed.sql
│   └── migrations/
│       ├── 001_core_tenancy_rbac_audit.sql
│       ├── 002_devices_inventory.sql
│       ├── 003_tickets.sql
│       └── 004_vault_billing.sql
└── web/
    ├── package.json
    ├── .env.example
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── tsconfig.json
    ├── eslint.config.mjs
    ├── public/
    │   └── logos/                          (12 integration logos)
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── page.tsx                    (landing page)
        │   └── proposal/
        │       ├── page.tsx
        │       └── ProposalContent.tsx
        ├── components/
        │   └── landing/
        │       ├── Navbar.tsx
        │       ├── Hero.tsx
        │       ├── LogoCarousel.tsx
        │       ├── Platform.tsx
        │       ├── Features.tsx
        │       ├── Pipeline.tsx
        │       ├── Architecture.tsx
        │       ├── Pricing.tsx
        │       ├── CTA.tsx
        │       └── Footer.tsx
        └── lib/
            └── supabase/
                ├── client.ts
                ├── server.ts
                └── admin.ts
```

---

## Next Steps

1. **Create Supabase project** and link to the repo
2. **Run database migrations** (001–004) to create schema
3. **Implement auth flow** (sign up, sign in, magic link)
4. **Build RBAC middleware** with role-based route protection
5. **Dashboard shell** with sidebar navigation per role
6. **Device management CRUD** — first operational module
