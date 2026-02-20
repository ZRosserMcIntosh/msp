# MSP — Enterprise Managed Services Platform

Multi-tenant MSP + Real Estate Operations Platform for US and Brazil operations.

## Architecture

- **Web:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database:** Supabase (Postgres + Auth + Storage + RLS)
- **Payments:** Stripe (SaaS billing)
- **Shipping:** ShipStation API
- **Domains:** GoDaddy Developer API
- **Email:** Brevo (SMTP)
- **E-Sign:** Dropbox Sign API
- **Mobile:** React Native (Expo) — future phase

## Getting Started

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Monorepo Structure

```
msp/
├── web/                    # Next.js web application
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities, Supabase client, etc.
│   │   └── types/          # TypeScript type definitions
│   └── public/             # Static assets
├── packages/
│   └── shared/             # Shared types, constants, utils
├── mobile/                 # React Native (Expo) — Phase 2
├── supabase/               # Supabase migrations, seeds, functions
│   ├── migrations/         # SQL migration files
│   ├── functions/          # Edge Functions
│   └── seed.sql            # Seed data
└── docs/                   # Architecture documentation
```

## Phases

1. **MVP:** Tenancy + RBAC + Inventory + Device Pipeline + Ticketing + Billing + Vault + Landing Page
2. **Moat:** Domains + Hosted Websites + Listings + Mobile Apps + Teams + Time Clock
3. **Scale:** Automation Engine + E-Sign + Compliance Reporting + Executive Dashboards
