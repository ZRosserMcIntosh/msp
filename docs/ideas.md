# MSP Platform — Product Ideas

> **Vertical:** Managed Service Provider for **small-to-mid-size real estate brokerages**
> **Initial market:** Atlanta, GA (with eye toward GA/SE expansion)
> **North Star:** "From offer-letter to closed-deal, every device, doc, and dollar handled by us."

This doc is a working brain-dump of front-end and back-end capabilities. Items are tagged
by **Phase** (P1 = MVP, P2 = Moat, P3 = Scale) and by **Pillar**:
🛡 IT/MSP · 🏠 RE-Specific · 💰 Finance · 🤖 Automation · 📊 Insights

---

## 0. Day-1 Onboarding Flow (the spine everything hangs off)

The platform's first job is to make a brokerage's "new hire Monday" boring.

### Back end

- **Identity provisioning pipeline** (P1 · 🛡🤖)
  - Trigger: HR creates a `profiles` row with `job_title` + `department` + `start_date`.
  - Edge function fires → provisions Microsoft 365 / Entra ID account via Graph API.
  - User is dropped into a **dynamic security group** based on `job_title` + `department`
    (e.g. `Atlanta-Listing-Agents`, `Buckhead-Office-Managers`).
  - Dynamic groups are **nested** into Enterprise App assignments, SharePoint sites,
    Teams channels, and license groups → no manual app-by-app assignment.
  - Webhook back to Supabase logs every Graph mutation into `audit_events`.
- **Role → entitlement map** (P1 · 🛡)
  - `role_entitlements` table: `role`, `app_key`, `license_sku`, `group_object_id`.
  - Single source of truth used by both provisioner and the auditor (drift detector).
- **Hardware bundle templates** (P1 · 🛡)
  - `bundle_templates`: e.g. `Agent-Standard` = Surface Laptop 7 + iPhone 15 + AirPods + Yubikey.
  - On hire: auto-create `device_assignments` in "ordered" state, push to ShipStation.
- **Drift detector** (P2 · 🛡🤖)
  - Nightly job compares Entra group membership vs `role_entitlements` and opens a
    ticket for any out-of-policy access (privilege creep alarm).
- **Offboarding state-machine** (P1 · 🛡)
  - One click → disable Entra, revoke MFA tokens, wipe Intune device, transfer OneDrive
    to manager, forward email 90 days, freeze CRM access, generate hardware-return label.

### Front end

- **"New Hire Wizard"** (P1) — single multi-step form: personal info → role → office
  → manager → bundle template → start date. Live preview on the right showing the
  exact apps, groups, and devices they'll receive.
- **Onboarding board** (P1) — Kanban: `Pending Start` → `Provisioning` → `Hardware Shipped`
  → `Day-1 Ready` → `Active`. Each card shows progress dots for Entra, M365, hardware,
  CRM, e-sign, MLS, etc.
- **Offboarding "red button"** (P1) — one-screen wizard with checklist preview and
  irreversible-action confirmation modal.
- **Org chart view** (P2) — drag to reorganize; changing a manager re-evaluates dynamic
  groups in real time.

---

## 1. Asset & Device Management 🛡

### Back end

- `devices` already exists (mig 002). Extend with:
  - `lifecycle_state` machine: `ordered → received → imaged → staged → shipped → active → in_repair → retired → disposed`.
  - `chain_of_custody` log: every hand-off signed (Supabase Storage signed-PDF).
  - `warranty_expires_at`, `lease_ends_at`, `refresh_eligible_at` for refresh planning.
- **MDM bridge**: scheduled sync of Intune compliance, encryption, OS patch level into
  `device_compliance_snapshots` (used for dashboards + ticket auto-create on non-compliance).
- **ShipStation hooks**: outbound shipment + RMA return labels generated from a device row.
- **Per-device cost ledger**: purchase, repairs, accessories rolled into TCO/agent metric.
- **Loaner pool**: `is_loaner` flag + `loan_returns_due_at`; auto-ticket if overdue.

### Front end

- **Device 360 page** — photo, specs, owner, location (office vs. WFH), MDM compliance
  badges, ticket history, warranty timeline, cost ledger, signed custody PDFs.
- **Fleet heatmap** — by office, by brokerage, by model; click to drill in.
- **Mobile tech app** — barcode/serial scan → "stage device" → checklist → photo →
  signature capture → done. Works offline, syncs later.
- **Bulk import** — CSV/scan for inventory intake; preview + validation before commit.

---

## 2. Real-Estate-Specific Workflows 🏠

This is where we beat generic MSPs.

### Back end

- **MLS / FMLS integration** (P2 · 🏠)
  - Pull listings, status changes, and roster info into `listings` table.
  - Trigger automations on status: `Active → Pending` fires "open transaction file" workflow.
- **Brokerage CRM connectors** (P1/P2 · 🏠)
  - kvCORE, BoomTown, Sierra Interactive, Follow Up Boss — bidirectional sync of leads,
    contacts, and agent assignments. License changes in our portal flow through.
- **Transaction Management bridge** (P2 · 🏠)
  - Skyslope / Dotloop / dotloop-style: surface in-flight transactions per agent so an
    offboarding can't accidentally orphan a $400k contract.
- **Commission engine** (P2/P3 · 💰🏠)
  - `commission_plans` (tiers, caps, splits, mentor splits, brokerage cap).
  - `transactions` ingest from MLS + transaction-mgmt → calculates net to agent +
    brokerage + referral. Drives Stripe Connect payouts.
- **Compliance vault** (P1 · 🏠)
  - GA-specific: GREC license expirations, E&O insurance, ICA agreements.
  - Auto-reminders 60/30/7 days; auto-ticket on lapse; audit-ready packet export.
- **Listing-website auto-provisioner** (P2 · 🏠)
  - Each agent gets `firstname.brokerage.com` subdomain on hire (Vercel + Cloudflare API).
  - Prebuilt template seeded with their headshot, bio, MLS feed.
- **Referral / lead routing** (P2 · 🏠)
  - Round-robin or weighted (by ZIP, language, price-band) routing of inbound leads.

### Front end

- **Agent profile page** — license #, brokerages, transactions YTD, GCI, devices
  assigned, compliance status, websites, social links — single pane of glass.
- **Listings dashboard** — map + table; status filters; per-agent throughput.
- **Commission statement viewer** — agent-facing; shows pending, processing, paid, with
  drill-down to each transaction's math.
- **Compliance calendar** — wall-of-yellow-and-red view for the broker-in-charge.
- **Open House kit launcher** (P2) — one click prints sign-in QR, sends follow-up
  drip, prepares iPad app.
- **Showing analytics** (P3) — heat-maps from MLS showing data, vehicle telemetry, etc.

---

## 3. Tickets, Help Desk & Field Service 🛡🤖

### Back end

- Extend `tickets` (mig 003) with:
  - `sla_policy_id`, `first_response_at`, `resolved_at`, `breach_at` (computed).
  - `channel`: `portal`, `email`, `sms`, `teams`, `phone`, `walkup`.
  - `ai_summary`, `ai_suggested_kb_article_ids` (generated on create).
- **Email-to-ticket** ingestion (Postmark/SES inbound).
- **Teams bot** — `/ticket` slash command + adaptive cards for status updates.
- **SMS gateway** (Twilio) for after-hours pages + agent self-service ("STATUS", "NEW").
- **AI triage** — classify, set priority, assign queue, draft first reply (RAG over KB).
- **Knowledge base** with `kb_articles` (markdown + vector embeddings via pgvector).

### Front end

- **Unified inbox** — Front-style; threading, internal notes, canned replies, snooze.
- **Tech queue dashboard** — load balance, color-coded SLA, drag to reassign.
- **Customer portal** — agents see their tickets, asset list, KB search, request new
  hardware/access from a catalog.
- **Mobile tech app** — push-notified, route-optimized for on-site visits, photo proof,
  parts inventory, time tracking.

---

## 4. Vault, Documents & E-Sign 🏠🛡

### Back end

- **Vault** (already in mig 004) — extend with:
  - Per-document classification: `commission_agreement`, `ica`, `w9`, `e&o`, `nda`,
    `transaction_packet`, `policy_acknowledgement`.
  - Retention policies by class (GA RE = 5 years for transaction docs).
  - **Watermarking** + per-view audit (who, when, IP).
- **E-sign workflows** — DocuSign / Dropbox Sign API; status webhooks → `vault_documents`.
- **OCR + extraction** — pull contract dates, prices, parties for searchability.

### Front end

- Doc viewer with side-panel metadata, signature timeline, version diff.
- "Send for signature" wizard with template library.

---

## 5. Billing, Subscriptions & Payments 💰

### Back end

- **Stripe** (recommended) for: brokerage subscriptions, per-seat agent billing,
  hardware leasing, professional services.
- **Stripe Connect** for commission payouts to agents (1099 + W-2 hybrid models).
- **Usage metering**: storage GB, devices under management, tickets resolved, sites
  hosted → metered billing line items.
- **Hardware-as-a-service**: 36-month amortization on each device, surfaced as a
  monthly recurring line.
- **Tax**: Stripe Tax + Avalara for GA sales tax on hardware.
- **Dunning + grace periods** with auto-suspension of services on hard failure.

### Front end

- **Brokerage billing portal** — invoices, payment methods, seat usage, hardware roster
  with monthly cost, upgrade/downgrade plans.
- **Agent statement** — monthly: "your tech costs this month" + commission credits.
- **Internal AR dashboard** — collections aging, churn risk, MRR/ARR.

---

## 6. Security, Compliance & Audit 🛡

### Back end

- **Conditional Access policy templates** pushed to Entra (geo-fence to US, MFA
  required, device-must-be-compliant).
- **Phishing simulator** integration (KnowBe4 or in-house) → per-user risk score.
- **DLP**: detect SSN/account-#/MLS-key in OneDrive + email; alert + auto-redact.
- **SIEM pipeline**: Entra audit + Intune + Supabase audit → BigQuery / Sentinel.
- **GA brokerage compliance pack**: GREC audit checklist, NAR Code of Ethics tracking,
  fair-housing training completion, REALTOR® Safe MLS access.
- **Cyber insurance evidence pack** generator: one-click PDF for renewal questionnaires.

### Front end

- **Risk dashboard** — per user, per office, per device.
- **Audit timeline** — searchable, filterable, exportable to CSV/PDF.
- **Policy library** — versioned policies with employee acknowledgement tracking.

---

## 7. Communications & Productivity 🛡🏠

### Back end

- **Microsoft 365 management**: mailbox provisioning, shared-mailbox lifecycle,
  distribution list automation by dynamic group.
- **Teams**: per-office team auto-created, channel templates per role.
- **VoIP** (RingCentral/Dialpad/Teams Phone): number provisioning, call routing,
  voicemail-to-email, call recording with retention rules.
- **eFax** for closing docs.
- **Calendar concierge** (P3) — AI scheduling of showings across agents.

### Front end

- **Comms console** — call history, voicemails, SMS, faxes per agent in one inbox.
- **Number management** — port-in workflow, IVR builder, after-hours rules.

---

## 8. Marketing & Growth Tooling 🏠

### Back end

- **Domain & DNS manager** — buy + park brokerage and agent domains via Cloudflare /
  Namecheap APIs. Auto SSL.
- **Hosted agent sites** (Next.js template per agent on Vercel).
- **Social media scheduler** + auto-post listing-status changes.
- **Email marketing** (Resend / Mailchimp) — per-brokerage campaigns, drip nurtures.
- **Print-on-demand**: yard signs, business cards, postcards via shippable vendor APIs.

### Front end

- **Marketing studio** — drag-drop email builder, listing post composer, asset library.
- **Brand kit** — broker uploads logo/colors once; cascades to every site/template.

---

## 9. Insights, Reporting & AI 📊🤖

### Back end

- **Data warehouse** — nightly Supabase → BigQuery sync via Fivetran or Postgres CDC.
- **Materialized views** for: GCI per agent, average days-on-market, ticket MTTR,
  device fleet health, license utilization.
- **Forecasting** — pipeline value × historical close rate → next-quarter revenue.
- **Anomaly detection** — sudden drop in agent activity, device offline > 7 days,
  cost spike per office.
- **Embedded LLM** assistant ("Ask MSP") with RAG over the brokerage's own data
  (tickets, KB, policies, transactions). Per-row RLS-aware retrieval.

### Front end

- **Executive dashboard** — broker-owner view: GCI, agent count, churn, cost per agent,
  open compliance items.
- **Tech ops dashboard** — MSP-internal: tickets, devices, SLA, MRR.
- **Custom report builder** — drag fields onto a canvas, save & share.

---

## 10. Mobile Apps 📱

### Realtor app (iOS + Android)

- Auth via Entra SSO + biometric.
- View assigned devices, request new hardware/access.
- Open ticket via voice memo (transcribed + triaged by AI).
- View commission statements, transaction status.
- Compliance reminders (license, E&O, training).
- Push for new leads (with one-tap accept/decline).

### MSP technician app

- Today's job route (map-optimized).
- Device staging wizard (scan → image → assign).
- Ticket resolution with photo + signature.
- Time tracking + parts pulled from van inventory.
- Offline-first, syncs when reconnected.

---

## 11. Integrations Wishlist (priority order)

| # | Integration             | Pillar | Phase |
|---|-------------------------|--------|-------|
| 1 | Microsoft Graph (Entra/Intune/M365) | 🛡 | P1 |
| 2 | ShipStation             | 🛡 | P1 |
| 3 | Stripe + Stripe Connect | 💰 | P1 |
| 4 | DocuSign / Dropbox Sign | 🏠 | P1 |
| 5 | FMLS / GAMLS            | 🏠 | P1 |
| 6 | kvCORE / BoomTown / FUB | 🏠 | P2 |
| 7 | Skyslope / Dotloop      | 🏠 | P2 |
| 8 | Twilio (SMS + Voice)    | 🛡🏠 | P1 |
| 9 | Cloudflare DNS + Vercel | 🏠 | P2 |
| 10| Resend / Postmark       | 🛡 | P1 |
| 11| Slack / Teams           | 🛡 | P1 |
| 12| KnowBe4                 | 🛡 | P2 |
| 13| QuickBooks Online       | 💰 | P2 |
| 14| Google Maps / Places    | 🏠 | P1 |

---

## 12. Cross-Cutting Concerns

- **Multi-tenant RLS** is non-negotiable; every new table joins to `org_id`.
- **Audit-everything** — write to `audit_events` from every mutating server action.
- **Feature flags** per brokerage (LaunchDarkly or Supabase-native flags table).
- **Background jobs** — queue with `pg_cron` + edge functions; idempotent + retried.
- **Observability** — Sentry (errors), PostHog (product analytics), Logtail (logs).
- **Disaster recovery** — daily logical backup → S3, weekly restore drill.
- **Localization-ready** — copy through i18n layer even if EN-only at launch
  (Atlanta has large ES-speaking agent population).

---

## 13. Atlanta-Specific Wedge Plays

- **GREC license sync**: scrape/API the Georgia Real Estate Commission roster nightly;
  auto-flag agents whose status changes (lapsed, suspended, transferred).
- **FMLS + GAMLS dual-roster sanity check**: many ATL agents are in both; detect
  mismatched profile data.
- **Local closing-attorney directory + integrations** (Campbell & Brannon, Weissman, etc.).
- **HOA / condo doc cache** for high-rises (Buckhead, Midtown, Atlantic Station).
- **County tax-assessor scrapers** (Fulton, DeKalb, Cobb, Gwinnett) for instant CMA pulls.
- **Showing-ready vehicle program** — branded EVs leased to top producers, telemetry
  rolled into our platform.

---

## 14. Stretch / Long-Bet Ideas (P3)

- **AI listing-description generator** trained on top-performing local copy.
- **Voice-cloned agent IVR** for after-hours buyer inquiries.
- **iBuyer integration** for instant-offer routing.
- **Closing-day concierge** — auto-orders flowers + housewarming kit when
  transaction status flips to `Closed`.
- **Brokerage M&A toolkit** — when one brokerage acquires another, one-click
  rebrand + license-and-asset migration.

---

## 15. Immediate Next Tickets (turn this doc into work)

1. ✅ Seed founding admin accounts (`supabase/seed.sql`).
2. ⏭ Build sign-in page + middleware that enforces `must_change_password`.
3. ⏭ Force-password-change screen on first login.
4. ⏭ `/admin/users` page: create user → choose role/department/job_title → preview
   the dynamic groups they'll land in.
5. ⏭ Microsoft Graph OAuth app registration + token storage.
6. ⏭ `role_entitlements` table + seed for default real-estate roles
   (Agent, Listing Agent, Buyer Agent, Office Manager, Broker-in-Charge,
   Transaction Coordinator, Marketing, Admin).
7. ⏭ Edge function: `provision_user(profile_id)` → Graph API calls → audit log.
8. ⏭ Hardware-bundle templates UI + `bundles` table.
9. ⏭ Onboarding Kanban board.
10. ⏭ Offboarding red-button workflow.
