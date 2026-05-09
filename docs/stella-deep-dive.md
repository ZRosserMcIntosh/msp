# Deep Dive — `stella-real-estate`

> Repo: `/Users/rossermcintosh/Desktop/stella-real-estate`
> Stack: **Vite + React 18 + TypeScript + Tailwind 3 + Supabase + Prisma + Stripe + Resend + react-i18next + Vercel serverless**.
> Verdict: **a goldmine of finished UI + product surface for the brokerage vertical** that we can selectively port into MSP (Next.js) instead of rebuilding from scratch.

---

## 1. Architecture at a glance

| Layer | Stella | MSP (target) | Action |
|-------|--------|--------------|--------|
| Framework | Vite SPA + react-router-dom v7 | Next.js 16 App Router | **Port screens, swap router** |
| Auth | Supabase + custom RBAC schema | Supabase + planned RBAC | **Reuse RBAC patterns** |
| DB client | `@supabase/supabase-js` directly + Prisma typed client | Supabase + (no Prisma yet) | **Adopt Prisma for typed multi-schema** |
| Schemas | Multi-schema (`stella`, `public`) — partial | Single `public` schema | **Refactor to multi-schema (this doc)** |
| Email | Resend (`api/send-email.ts`) | not built | **Port** |
| Payments | Stripe full integration (`api/stripe/`) | listed in roadmap | **Port** |
| i18n | `react-i18next` PT/EN/ES | none | **Port** |
| Serverless | Vercel `api/*` functions | Next.js route handlers | **Translate** |
| ORM strategy | Prisma `multiSchema` preview feature | none | **Adopt the same** |

## 2. Module inventory (what's actually built)

### 2.1 Public-facing real estate site
- **Homepage `App.tsx`** — 1,096 lines: hero video w/ scroll-driven blur, featured projects carousel, language switcher, currency switcher (BRL/USD), Helmet SEO, watermarked images.
- **Listings system** — `Listings.tsx`, `ListingsForSale`, `ListingsForRent`, `ListingsNewProjects` with filters (kind, city, bed/bath, price, area).
- **Projects (new developments)** — `Projects.tsx` + per-project pages with media gallery, units list, dev metadata.
- **Property submission** — `ListYourProperty.tsx` (lead form → CRM).
- **About / Contact / Institutional / International / Investors** — full marketing site.
- **Legal pack** — Privacy, Terms, Cookies, AMLPolicy, AUP, BetaTerms, DPA, FounderTerms, MSA, ReferralTerms, SLA, SupportPolicy, APITerms, LegalServices, CreciDisclosure, TOS — **18 legal pages already written**.
- **CRECI course** — `CreciCourse.tsx` (real estate license prep — Brazil-specific).

### 2.2 Auth & onboarding
- **Login / Signup / ForgotPassword / ResetPassword** with smart routing (`SmartLogin`, `SmartSignup`, `RootRedirect`).
- **Constellation portal** — alternate auth surface (`Constellation.tsx`, `ConstellationPortal.tsx`, `SmartConstellation.tsx`).
- **RealtorSignupModal** — guided realtor onboarding.
- **Subdomain routing** — `SubdomainRouter`, `SubdomainAwareRoute`, `SubdomainRedirectHandler`, `SubdomainToPathRedirect` — full multi-tenant subdomain plumbing (huge for our hosted-agent-sites idea).
- **Account types** — `STELLAREAL_ACCOUNT_TYPES.md` documents tiers; `useAccountType` hook drives route guards.

### 2.3 Admin / operator console (`/admin/*`)
**Already built screens:**
- `Admin.tsx` (entry), `AdminLayout.tsx` (sidebar shell)
- `Account.tsx` — profile/settings
- `Analytics.tsx` — KPI dashboard
- `Ballet.tsx` — full **Asana-clone project management** (workspaces → portfolios → projects → sections → tasks → subtasks → comments → attachments → goals/OKRs → automation rules → activity feed → notifications)
- `CRM.tsx` + `crm/` subfolder — leads/contacts/pipeline
- `Calendar.tsx`
- `CreateListing.tsx`, `ListingsForRent`, `ListingsForSale`, `ListingsNewProjects`
- `DealRoom.tsx` + `dealroom/` — transaction war-room
- `DocumentVault.tsx` — secure docs
- `Equity.tsx` — agent equity / commission shares
- `RosserStella.tsx` — personal finance dashboard
- `SiteAdmin.tsx` — full **white-label site builder** for agents (`StellaSiteBuilder.tsx`, `TemplatePicker`, `SiteSettingsModal`)
- `SocialMedia.tsx` + `social-media/` services — multi-platform scheduler (IG, FB, LI, X, TikTok, YT, Threads, Pinterest, Bluesky, Mastodon, GMB)
- `Team.tsx` + `team/` — employee directory + RBAC management
- `WebsiteBuilder.tsx` — drag-and-drop site builder
- `developer/` + `DeveloperLayout.tsx` — sub-portal for property developers (B2B2B)

### 2.4 Server / API layer (`api/`)
- `send-email.ts` — Resend transactional email
- `stripe/` — checkout sessions, webhooks, founding-member subscriptions
- `social/` — OAuth callbacks for 11 social providers + post scheduler
- `personal/` — finance endpoints
- `lib/` — shared serverless utilities

### 2.5 Database (`supabase/migrations/` — 50+ migrations)
Notable patterns:
- **Schema isolation already attempted**: `stella` schema for the brokerage app, with later migration `20260318000000_schema_normalization.sql` and `simplified_core_schema.sql` simplifying the model.
- **RBAC**: `stella.roles`, `stella.permissions`, `stella.role_permissions`, `stella.user_roles`, `stella.user_permissions`, `stella.user_scopes` — proven RBAC matrix.
- **Storage buckets**: `listings`, `user_assets`.
- **Bootstrap triggers**: `bootstrap_team_members_trigger` auto-creates a team_members row on `auth.users` insert (we want this exact pattern for MSP onboarding).
- **Prisma `multiSchema`** schema in `prisma/schema.prisma` exposes `public` + `auth` and **prefixes models by domain** (`Social*`, `Ballet*`, `Personal*`) — proves the multi-domain pattern works with Prisma+Supabase.

### 2.6 Notable engineering quality wins
- `RouteGuard`, `AdminRoute`, `SubdomainAwareRoute` — clean auth/role/subdomain composition.
- `ErrorBoundary`, `SEO` (centralized Helmet wrapper), `SEOQualityIndicator`, `SEOScoreCalculator` — built-in SEO QA tooling.
- `ConditionalLayout`, `ConditionalLoginRedirect`, `ConditionalSignupRedirect`, `ConditionalResetRedirect` — conditional layout/redirect primitives we can reuse.
- `WatermarkedImage` — automatic watermarking pipeline (great for proprietary listing photos).
- `CurrencySwitcher` + `useCurrency` context — multi-currency aware (BRL/USD).
- `i18n.ts` with audit script `scripts/i18n-audit.ts` — keeps locales in sync (we need this for our ES-speaking ATL agents).
- 18 legal pages already drafted — saves weeks of legal review.
- `tailwind.config.ts` + `Inter` font + dark-mode-system — same design system tokens we want.

### 2.7 Documentation depth (`docs/` — 60+ markdown files)
- `STELLAREAL_ACCOUNT_TYPES.md` — multi-tier account model
- `URL_LOCALIZATION.md` — i18n routing strategy
- `CONSTELLATION_DUAL_ACCESS.md` — dual-auth pattern
- `SEO_*` (8 files) — full SEO playbook (audit, sitemap, listings, projects)
- `DNS_CONFIGURATION.md` — Cloudflare/Vercel DNS for subdomains
- `GOOGLE_ADS_CONVERSION_TRACKING.md` — paid acquisition wiring
- `phases/`, `setup/`, `deployment/`, `integrations/`, `social-media/`, `ballet/`, `admin/`, `ui-ux/`, `sql/` — categorized playbooks

---

## 3. Where Stella's model differs from MSP

| Concern | Stella | MSP needs |
|---------|--------|-----------|
| Tenancy | Single brokerage (Stella Imóveis) | Multi-tenant per-brokerage |
| Geography | Brazil (BRL, PT-BR primary) | US (Atlanta first; English primary, Spanish secondary) |
| RBAC scope | `own/team/city/global` | `org → team → user` with cross-tenant `platform_admin` |
| MDM / device mgmt | none | first-class (Intune) |
| Ticketing | basic via developer requests table | full ITSM with SLA |
| MLS feeds | none | FMLS/GAMLS first |
| Compliance | CRECI (BR) | GREC + NAR (US-GA) |

These differences are addressable by **renaming the bounded context** and **plugging US-specific integrations**, not rewriting the application.

---

## 4. Recommended porting strategy (TL;DR)

1. **Adopt Prisma** in the `web/` Next.js app with the same `multiSchema` preview flag.
2. **Carve domains into Postgres schemas from day one**: `core`, `directory`, `assets`, `intune`, `support`, `realestate`, `billing`, `vault`, `marketing`, `analytics`. (See `database-architecture.md`.)
3. **Port screens module-by-module**, each living under `web/src/app/(admin)/<module>/` — no big-bang rewrite.
4. **Keep Stella running** until each module is parity-tested in MSP.
5. **Translate all Vite SPA pages → Next.js Server/Client Components** where it pays off (mostly server-render listing pages for SEO).
6. **Reuse legal copy verbatim** — only swap entity names + jurisdictions.
