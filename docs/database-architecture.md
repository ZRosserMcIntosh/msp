# MSP Platform — Database Architecture

> **Goal:** Avoid a monolithic `public` schema. Lay down clear bounded contexts as
> Postgres schemas from day one so refactors stay local, RLS stays auditable,
> and Prisma stays sane.
> **Postgres flavor:** Supabase (PG 15+) with `pgcrypto`, `pg_cron`, `pgvector`, `uuid-ossp`.

---

## 1. Bounded contexts → Postgres schemas

| # | Schema | Owns | Talks to | Notes |
|---|--------|------|----------|-------|
| 1 | `auth` | Supabase managed identities | — | Don't touch — referenced via FK only |
| 2 | `core` | `organizations`, `profiles`, `teams`, `team_members`, `audit_events`, `notifications`, `feature_flags`, `tenant_settings` | All schemas FK here | The only schema other schemas may reach into |
| 3 | `directory` | Entra/Azure mirror: `external_users`, `groups`, `group_members`, `dynamic_group_rules`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permissions`, `user_scopes`, `oauth_apps`, `oauth_tokens` | `core`, `auth` | Source of truth for SSO + RBAC |
| 4 | `assets` | `devices`, `device_events`, `accessories`, `device_accessories`, `bundles`, `bundle_items`, `device_assignments`, `chain_of_custody`, `software_inventory`, `licenses`, `license_assignments` | `core`, `directory` | Hardware + software inventory |
| 5 | `intune` | `intune_devices`, `compliance_snapshots`, `configuration_profiles`, `app_deployments`, `assignment_targets`, `scripts`, `script_runs`, `autopilot_profiles`, `enrollment_status_pages`, `update_rings` | `assets`, `directory` | Mirrors Microsoft Intune objects + run history |
| 6 | `support` | `tickets`, `ticket_messages`, `ticket_attachments`, `screenshots`, `sla_policies`, `kb_articles`, `kb_embeddings` (`vector`), `triage_rules`, `csat_surveys` | `core`, `assets`, `directory` | Includes Cmd/Ctrl+/ ticket-from-page captures |
| 7 | `realestate` | `brokerages`, `offices`, `agents` (view over `core.profiles` + RE fields), `licenses_grec`, `mls_feeds`, `listings`, `transactions`, `commission_plans`, `commission_calculations`, `payouts` | `core`, `vault`, `billing` | RE-specific overlays; Stella's `stella.*` lives here re-namespaced |
| 8 | `vault` | `documents`, `document_versions`, `signatures`, `signature_requests`, `retention_policies`, `document_access_log` | `core`, `realestate`, `support` | E-sign + retention |
| 9 | `billing` | `stripe_customers`, `subscriptions`, `subscription_items`, `invoices`, `usage_meters`, `usage_events`, `payouts`, `tax_locations`, `dunning_attempts` | `core` | Stripe + Stripe Connect mirror |
| 10 | `marketing` | `sites`, `site_settings`, `site_settings_history`, `site_pages`, `templates`, `domains`, `dns_records`, `campaigns`, `email_lists`, `social_connections`, `social_posts`, `social_analytics`, `social_account_tokens` | `core`, `directory` | Includes ported Stella `social_*` tables |
| 11 | `analytics` | `goals`, `key_results`, `kpis`, `kpi_snapshots`, `report_definitions`, `dashboards`, `materialized views` | All (read-only) | Reads from everywhere; write only via jobs |
| 12 | `automation` | `rules`, `triggers`, `actions`, `runs`, `run_steps`, `webhooks`, `schedules` | All | Generic automation engine |
| 13 | `audit` | `events_partitioned` (monthly partitions), `data_changes` (CDC), `access_log` | All | High-volume; partitioned by month |
| 14 | `internal` | Service-only tables: `migrations_meta`, `cron_jobs`, `kill_switches` | — | Never RLS-exposed; service role only |

**Rules of thumb**
1. **No cross-schema joins in RLS policies** beyond `core` (avoid policy thrashing).
2. **Every domain table has `org_id uuid NOT NULL REFERENCES core.organizations(id)`** unless it's a global lookup (e.g., `realestate.mls_feeds`).
3. **Every table has `created_at`, `updated_at`** + `set_updated_at()` trigger from `core`.
4. **Every mutating action** writes a row to `audit.events_partitioned` via a server-side helper (`audit.log_event(...)`).
5. **Soft-delete only where the regulator requires it** (vault docs, transactions, commissions). Everything else hard-deletes with audit trail.
6. **Prisma schema is split per domain** under `web/prisma/schemas/*.prisma` and stitched via `prismaSchemaFolder` preview feature, mirroring the Postgres layout.

---

## 2. Migration path from current state

The current MSP migrations (`001`–`004`) put everything in `public`. We will:

1. **Freeze** `public.*` (no new tables there).
2. **Create new schemas now** (this doc + new migrations `005`–`007` introduce `support`, `intune`, `directory`).
3. **In a future migration `010_schema_refactor.sql`** we will:
   - `ALTER TABLE public.organizations SET SCHEMA core;` (and friends)
   - Recreate RLS policies under new namespace
   - Update Supabase generated types + Prisma client
   - Keep updatable views in `public.*` for one release as compatibility shims

Doing this **before** any production data lands is cheap; deferring it is expensive.

---

## 3. Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Schema | `snake_case`, singular concept | `intune` |
| Table | `snake_case`, plural | `assets.devices` |
| PK | `id uuid` | — |
| FK | `<thing>_id` | `org_id`, `assigned_to_profile_id` |
| Bool | `is_*` or `has_*` | `is_active` |
| Enum | Postgres `enum` named `<schema>_<concept>` | `support.ticket_priority` |
| Index | `ix_<table>_<cols>` | `ix_devices_org_status` |
| RLS policy | `"<verb>_<scope>"` | `"select_own_org"` |

---

## 4. Asset tracking (schema: `assets`)

```
assets.bundles ────────┐
                       │
assets.bundle_items ◄──┘  (laptop + phone + headset = "Agent Standard")

assets.devices ─────► assets.device_events (lifecycle log: ordered → received → imaged → staged → shipped → active → in_repair → retired → disposed)
       │
       ├─► assets.device_assignments (current + historical owner)
       ├─► assets.chain_of_custody (signed PDF per hand-off)
       ├─► assets.accessories (1:N keyboards, mice, monitors per device)
       └─► intune.intune_devices (1:1 link via serial / Entra device id)

assets.software_inventory  ─► detected installs per device (synced from Intune)
assets.licenses            ─► seat-counted SKUs (M365 E3, Adobe, etc.)
assets.license_assignments ─► (license_id, profile_id, assigned_at)
```

Key columns on `assets.devices`:
- `org_id`, `assigned_to_profile_id`, `office_id`
- `serial_number` (UNIQUE within org), `manufacturer`, `model`, `device_type`
- `lifecycle_state` (enum), `purchase_cost`, `purchase_date`, `warranty_expires_at`, `lease_ends_at`, `refresh_eligible_at`
- `intune_device_id`, `entra_device_id`, `azure_ad_joined`, `compliance_state`
- `bundle_id` (the bundle it shipped as part of)
- `tco_to_date numeric` (computed)

---

## 5. Employee management (schemas: `core` + `directory` + `realestate`)

The employee record is **layered** to avoid a monolithic `users` table:

```
core.profiles            (1:1 auth.users) — universal: name, email, role, org, manager
   │
   ├── directory.user_roles            (M:N → directory.roles)
   ├── directory.user_permissions      (per-user overrides)
   ├── directory.user_scopes           (data scope: own/team/office/city/all)
   ├── directory.group_members         (M:N → directory.groups, includes dynamic groups)
   │
   ├── realestate.agent_profiles       (RE-only: GREC #, MLS keys, headshot, bio_*, splits)
   ├── assets.device_assignments       (their hardware)
   └── support.tickets (created_by / assigned_to)
```

**Dynamic groups** live in `directory.groups` with a `rule_definition jsonb`:
```json
{ "all": [
  { "field": "job_title",  "op": "eq",  "value": "Listing Agent" },
  { "field": "department", "op": "eq",  "value": "Atlanta-North" }
]}
```
A nightly `automation.rules` run + a real-time trigger on `core.profiles` UPDATE re-evaluates membership and pushes deltas to **Microsoft Graph** (Entra dynamic group sync). Nesting is modeled as `directory.group_members.member_group_id` so groups can contain groups.

---

## 6. App deployments (schema: `intune`)

```
intune.app_deployments ─► assignment_targets (group, user, device)
                       └─► assignment_intent ('required' | 'available' | 'uninstall')
                       └─► detection_rules jsonb
                       └─► install_command, uninstall_command
                       └─► icon_url, publisher, version

intune.scripts ─► PowerShell/Bash scripts (e.g., the 3 AM reboot enforcer)
intune.script_runs ─► per-device execution status

intune.configuration_profiles ─► OS settings (BitLocker, FileVault, WiFi, VPN, MDM passcode)
intune.update_rings ─► Windows Update for Business / Apple OS update policies
```

App + script provisioning **always** routes through `directory.groups` so removing a user from a job-title-based dynamic group automatically retracts apps, licenses, and policies.

---

## 7. Microsoft Azure / Entra connectivity

Single OAuth app registration per MSP tenant (multi-tenant for the brokerages).
Tokens stored in `directory.oauth_tokens` (encrypted at rest via Supabase Vault).
Sync jobs in `automation.schedules`:

| Sync | Direction | Frequency | Source / Sink |
|------|-----------|-----------|----------------|
| Users | Entra ↔ `directory.external_users` | every 15m | Graph `/users` delta query |
| Groups | Entra ↔ `directory.groups` | every 15m | `/groups` delta |
| Group members | Entra ↔ `directory.group_members` | every 15m | `/groups/{id}/members/delta` |
| Devices | Entra/Intune ↔ `intune.intune_devices` | every 30m | `/deviceManagement/managedDevices` |
| Compliance | Intune → `intune.compliance_snapshots` | hourly | `/managedDevices` |
| App install state | Intune → `intune.app_deployments` runs | hourly | `/mobileApps/{id}/deviceStatuses` |
| Script run state | Intune → `intune.script_runs` | hourly | `/deviceManagementScripts` |

See `azure-graph-integration.md` for endpoint, scopes, and consent flow.

---

## 8. Support / ticketing (schema: `support`)

```
support.tickets
   ├── id, org_id, requester_profile_id, assignee_profile_id, queue
   ├── subject, body, channel ('hotkey' | 'email' | 'portal' | 'sms' | 'teams' | 'phone' | 'walkup')
   ├── priority ('low'|'normal'|'high'|'urgent'|'critical')
   ├── status ('new'|'open'|'pending'|'on_hold'|'resolved'|'closed')
   ├── source_url text                           -- for hotkey tickets
   ├── source_user_agent text
   ├── source_viewport jsonb                     -- {w,h,dpr,os}
   ├── related_device_id uuid FK assets.devices
   ├── sla_policy_id, first_response_at, resolved_at, breach_at
   ├── ai_summary, ai_priority_score, ai_kb_article_ids uuid[]
   └── created_at, updated_at, closed_at

support.ticket_messages       -- thread (internal_note bool)
support.ticket_attachments    -- arbitrary files
support.screenshots           -- captures from Cmd/Ctrl+/ hotkey
   ├── ticket_id, storage_path, mime, width, height, dom_html_path (optional)
support.kb_articles + support.kb_embeddings (pgvector)
support.sla_policies          -- per-tier SLAs (response/resolve)
support.csat_surveys          -- post-resolution rating
```

The **Cmd/Ctrl+/ hotkey** flow:
1. Client captures `location.href`, `navigator.userAgent`, `window.innerWidth/Height`, `devicePixelRatio`.
2. `html2canvas` snapshots the visible viewport → PNG blob.
3. POST to `/api/support/tickets` with multipart payload.
4. API uploads PNG to Supabase Storage bucket `support-screenshots/{org_id}/{yyyy}/{mm}/{ticket_id}.png` (signed URL).
5. Insert `support.tickets` (channel `'hotkey'`) + `support.screenshots` row.
6. Fire `automation.rules` for triage (priority guess, AI summary, route to queue).

---

## 9. Schema-aware RLS pattern

Every domain ships a **single `is_member_of_org(o uuid)` SQL function in `core`** that returns `boolean` from the caller's session. Every policy reduces to:

```sql
CREATE POLICY "select_own_org" ON support.tickets
  FOR SELECT USING (core.is_member_of_org(org_id));

CREATE POLICY "modify_with_perm" ON support.tickets
  FOR ALL USING (
    core.is_member_of_org(org_id)
    AND core.has_permission('support.ticket.write')
  );
```

Centralizing the auth predicate makes future refactors (e.g. delegated admin) one-line changes per table.

---

## 10. Prisma layout to mirror schemas

```
web/prisma/
├── schema.prisma                   (datasource + generator + previewFeatures)
└── schemas/
    ├── core.prisma
    ├── directory.prisma
    ├── assets.prisma
    ├── intune.prisma
    ├── support.prisma
    ├── realestate.prisma
    ├── vault.prisma
    ├── billing.prisma
    ├── marketing.prisma
    ├── analytics.prisma
    └── automation.prisma
```

Enable in `schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema", "prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = [
    "auth", "core", "directory", "assets", "intune",
    "support", "realestate", "vault", "billing",
    "marketing", "analytics", "automation"
  ]
}
```

---

## 11. Day-1 acceptance checklist

- [ ] All new schemas exist with `GRANT USAGE` to `authenticated`, `service_role`.
- [ ] `core.is_member_of_org()`, `core.has_permission()`, `core.set_updated_at()` exist.
- [ ] Every new table has `org_id`, RLS enabled, `created_at`/`updated_at` triggers.
- [ ] Every new table is reachable via Prisma model (regen client passes).
- [ ] `audit.log_event()` server helper used by all mutating server actions.
- [ ] Supabase Storage buckets created with matching `org_id` path prefixing rules.
- [ ] Background jobs (`pg_cron`) registered in `internal.cron_jobs` for sync tasks.
