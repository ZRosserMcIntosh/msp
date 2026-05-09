# Top 50 Features to Port from `stella-real-estate` → MSP

> Ranked by **impact ÷ effort**. Each row notes target MSP location, pillar, and rough effort.
> Pillars: 🛡 IT/MSP · 🏠 RE · 💰 Finance · 🤖 Automation · 📊 Insights · 🎨 UX/UI · ⚖️ Legal · 🌐 Web

| # | Feature (Stella source) | What it gives us | Target in MSP | Pillar | Effort |
|---|--------------------------|------------------|---------------|--------|--------|
| 1 | **Multi-schema Prisma layout** (`prisma/schema.prisma` w/ `multiSchema`) | Domain isolation from day-1; typed client | `web/prisma/schema.prisma` | 🛡 | M |
| 2 | **`stella.team_members` RBAC + bootstrap trigger** (`20251019120000_*`) | Auto-create profile on `auth.users` insert | `core.profiles` trigger | 🛡 | S |
| 3 | **Roles / permissions / role_permissions / user_permissions / user_scopes** matrix | Proven full RBAC w/ scope (`own/team/city/global`) | `directory.roles*` | 🛡 | M |
| 4 | **`add_team_member()` SECURITY DEFINER helper** | Idempotent invite-by-email RPC | `directory.add_employee()` | 🛡 | S |
| 5 | **Subdomain router** (`SubdomainRouter`, `SubdomainAwareRoute`, `SubdomainRedirectHandler`) | Multi-tenant `*.brokerage.com` routing | `web/src/middleware.ts` | 🌐 | M |
| 6 | **Stripe checkout + webhooks + Founding subscriptions** (`api/stripe/`, `FoundingCheckout.tsx`) | Plug-and-play subscription billing | `app/api/stripe/*` | 💰 | M |
| 7 | **Resend transactional email** (`api/send-email.ts`) | Contact, reset, system mails | `app/api/email/route.ts` | 🌐 | S |
| 8 | **i18n setup (PT/EN/ES) + locale audit script** (`scripts/i18n-audit.ts`) | Day-1 Spanish for ATL market | `web/src/i18n/` | 🌐 | M |
| 9 | **Currency switcher + `useCurrency` context** | Multi-currency invoices | `web/src/contexts/CurrencyContext` | 💰 | S |
| 10 | **`AdminLayout.tsx` (sidebar shell)** | Skip 2 days of layout work | `app/(admin)/layout.tsx` | 🎨 | S |
| 11 | **`Ballet` project management module** (workspaces, projects, tasks, subtasks, OKRs, automation rules, activity feed) | Internal MSP project mgmt + customer-facing PM offering | `app/(admin)/projects/*` | 🤖 | L |
| 12 | **`CRM` module** + leads/pipeline | Customer CRM for brokerage clients | `app/(admin)/crm/*` | 🏠 | L |
| 13 | **`DealRoom`** transaction war-room | Per-transaction collaboration space | `app/(admin)/transactions/[id]/*` | 🏠 | M |
| 14 | **`DocumentVault.tsx`** | Secure doc store w/ ACL | `app/(admin)/vault/*` | 🛡 | M |
| 15 | **`SocialMedia` module + 11-platform OAuth + scheduler** (`api/social/`) | Marketing service offering | `app/(admin)/social/*` | 🏠 | L |
| 16 | **`SiteAdmin` + `StellaSiteBuilder` + `TemplatePicker`** | White-label agent sites | `app/(admin)/sites/*` | 🌐 | L |
| 17 | **`WebsiteBuilder.tsx`** drag-drop builder | No-code page builder for clients | `app/(admin)/sites/builder/*` | 🌐 | L |
| 18 | **Listings CRUD** (sale/rent/projects + filters) | MLS-adjacent listing mgmt | `app/(admin)/listings/*` | 🏠 | M |
| 19 | **`Equity.tsx`** agent equity/commissions | Commission engine UI | `app/(admin)/commissions/*` | 💰 | M |
| 20 | **`Calendar.tsx`** | Showings + tickets calendar | `app/(admin)/calendar` | 🏠 | M |
| 21 | **`Analytics.tsx`** dashboard shell | Exec dashboards | `app/(admin)/analytics` | 📊 | M |
| 22 | **`SEO.tsx` + `SEOQualityIndicator` + `SEOScoreCalculator`** | Per-page SEO QA | `app/components/seo/*` | 🌐 | S |
| 23 | **`WatermarkedImage`** component | Listing-photo IP protection | `app/components/media/*` | 🛡 | S |
| 24 | **`ErrorBoundary`** + Sentry hook points | Production resilience | global | 🛡 | S |
| 25 | **`ConditionalLayout` / `ConditionalLoginRedirect` / `ConditionalSignupRedirect`** | Layout composition primitives | `app/components/layout/*` | 🎨 | S |
| 26 | **`PasswordProtection.tsx`** gating | Per-page password walls (preview links) | `app/components/auth/*` | 🛡 | S |
| 27 | **`RouteGuard` + `AdminRoute`** | Role-aware Next.js middleware | `web/src/middleware.ts` | 🛡 | S |
| 28 | **18 legal pages** (Privacy/Terms/Cookies/AMLPolicy/AUP/BetaTerms/DPA/FounderTerms/MSA/ReferralTerms/SLA/SupportPolicy/APITerms/LegalServices/CreciDisclosure/TOS/Cookies) | Skip a month of legal | `app/(legal)/*` | ⚖️ | S |
| 29 | **`Constellation` dual-access portal** | Secondary/partner login surface | `app/(portal)/*` | 🛡 | M |
| 30 | **`Investors.tsx` + `investors/`** | Investor data room | `app/(investor)/*` | 💰 | M |
| 31 | **`Institutional.tsx` + `International.tsx`** | Enterprise & cross-border landings | `app/(public)/enterprise/*` | 🌐 | S |
| 32 | **`CreciCourse.tsx` (license-prep course)** | Adapt to **GREC course / GA agent CE** | `app/(public)/grec/*` | 🏠 | M |
| 33 | **`useAccountType` hook + account-tier docs** | Tiered feature flags | `web/src/hooks/useAccountType.ts` | 🛡 | S |
| 34 | **Storage bucket conventions** (`listings`, `user_assets`) | Pre-baked media buckets w/ RLS | `supabase/storage/*` | 🛡 | S |
| 35 | **`developer/` sub-portal + `DeveloperLayout`** | B2B2B developer-partner space | `app/(partner)/*` | 🌐 | M |
| 36 | **`RealtorSignupModal`** guided onboarding | Sales-led signups | `app/components/onboarding/*` | 🤖 | S |
| 37 | **`Cookies.tsx` + cookie banner pattern** | Consent management | `app/components/consent/*` | ⚖️ | S |
| 38 | **`AnimatedBackground` + `BackgroundVideo`** | Polished marketing hero | `app/components/landing/*` (already partial) | 🎨 | S |
| 39 | **Site-settings tables + history** (`site_settings`, `site_settings_history`) | Per-tenant CMS w/ rollback | `marketing.site_settings*` | 🌐 | M |
| 40 | **OAuth provider table pattern** (`social_connections`, `social_account_tokens`) | Re-use for **Microsoft/Google/Slack/QBO** OAuth | `directory.oauth_*` | 🛡 | M |
| 41 | **`bootstrap_team_members_trigger`** | Auto-row on signup pattern | `core.handle_new_user()` | 🛡 | S |
| 42 | **Postgres `RPC` SECURITY DEFINER pattern** | Server-side privileged ops w/ RLS bypass | global | 🛡 | S |
| 43 | **Prisma `@@map` snake_case + camelCase TS** | Idiomatic naming both sides | `prisma/schema.prisma` | 🛡 | S |
| 44 | **Founding-member invite codes** (`invitation_codes`, `founding_members_*`) | Closed-beta wedge | `marketing.invitations` | 🌐 | S |
| 45 | **Site-builder template CRUD + thumbnails** | "App Store" of templates | `marketing.site_templates` | 🌐 | M |
| 46 | **`PersonalFinance` (BRL/USD dual-currency expense tracker)** | Adapt for **brokerage P&L** lite-mode | `realestate.brokerage_finance_*` | 💰 | M |
| 47 | **`BalletGoal` OKR engine** | Cascading goals (broker → office → agent) | `analytics.goals*` | 📊 | M |
| 48 | **`BalletAutomationRule` engine (trigger+actions JSON)** | No-code automation primitives | `automation.rules` | 🤖 | M |
| 49 | **`BalletNotification` table + read state** | In-app inbox | `core.notifications` | 🛡 | S |
| 50 | **`docs/` SEO playbook (8 files) + sitemap generator** (`scripts/generate-sitemap.js`) | Prebaked SEO ops + cron | `web/scripts/seo/*` | 🌐 | S |

**Effort key:** S ≤ 1 day · M ≤ 1 wk · L > 1 wk
**Phase plan:** items #1–#10 = **Sprint 0 (foundation)** · #11–#28 = **Sprint 1 (parity)** · #29–#50 = **Sprint 2+ (moat)**

---

## Quick wins to ship Sprint 0 (parallelizable)

- ✅ Prisma + multiSchema (#1)
- ✅ Auth bootstrap trigger (#2, #41)
- ✅ RBAC tables + helper RPC (#3, #4, #42)
- ✅ Subdomain middleware (#5, #27)
- ✅ Stripe + Resend wiring (#6, #7)
- ✅ i18n + currency (#8, #9)
- ✅ Admin shell (#10, #25)
- ✅ Legal pack copy-paste (#28)
- ✅ SEO components (#22, #50)

The above stamp out ~3 weeks of foundational work in days.
