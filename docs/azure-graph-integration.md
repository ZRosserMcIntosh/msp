# Microsoft Graph / Azure / Entra Integration

> The MSP platform is the **system of action** for everything Microsoft.
> Entra is the **system of record for identity**. Intune is the **system of action for endpoints**.
> We mirror the bits we need into our DB and call Graph for writes.

---

## 1. App registration

- **Single multi-tenant app** in our home Entra tenant: `MSP Operations Platform`.
- **Redirect URIs**: `https://msp.app/api/auth/callback/microsoft`, `https://msp.app/oauth/admin-consent`.
- **Authentication**: confidential client; certificate (preferred) or client secret in Supabase Vault.
- **Client credentials flow** for app-only sync; **auth code + PKCE** for delegated user actions.
- **Customer onboarding**: tenant admin clicks `https://login.microsoftonline.com/<tenantId>/adminconsent?client_id=...` → grants the static permission set below → we store `tenant_id` in `directory.oauth_apps`.

## 2. Permission scope set

| Scope | Type | Why |
|-------|------|-----|
| `User.ReadWrite.All` | App | CRUD employees |
| `Group.ReadWrite.All` | App | Manage dynamic + static groups |
| `Directory.ReadWrite.All` | App | License assignment |
| `RoleManagement.ReadWrite.Directory` | App | Assign Entra roles |
| `Policy.ReadWrite.ConditionalAccess` | App | Manage CA policies |
| `Policy.Read.All` | App | Read existing CA |
| `DeviceManagementConfiguration.ReadWrite.All` | App | Profiles |
| `DeviceManagementApps.ReadWrite.All` | App | App deployments |
| `DeviceManagementManagedDevices.ReadWrite.All` | App | Devices, scripts |
| `DeviceManagementServiceConfig.ReadWrite.All` | App | Autopilot + ESP |
| `Sites.FullControl.All` | App | SharePoint provisioning |
| `Mail.Send` | App | Transactional mail (signed) |
| `OnlineMeetings.ReadWrite.All` | App | Teams meeting auto-create |
| `AuditLog.Read.All` | App | Pull sign-in + audit logs into our SIEM view |
| `offline_access` | Delegated | Refresh tokens on user-context calls |

## 3. Sync workers

Every worker is idempotent + resumable via Graph **delta queries**.
Schedules live in `internal.cron_jobs`; runs logged in `automation.runs`.

| Worker | Endpoint | Frequency | Writes to |
|--------|----------|-----------|-----------|
| `users-delta` | `/users/delta?$select=id,userPrincipalName,displayName,jobTitle,department,accountEnabled` | 15m | `directory.external_users` |
| `groups-delta` | `/groups/delta?$select=id,displayName,membershipRule,membershipRuleProcessingState` | 15m | `directory.groups` |
| `group-members-delta` | `/groups/{id}/members/delta` | 15m | `directory.group_members` |
| `roles-snapshot` | `/directoryRoles` + `/directoryRoles/{id}/members` | hourly | `directory.role_assignments` |
| `intune-devices` | `/deviceManagement/managedDevices` | 30m | `intune.intune_devices` |
| `intune-compliance` | `/deviceManagement/managedDevices/{id}` | hourly | `intune.compliance_snapshots` |
| `intune-app-states` | `/deviceAppManagement/mobileApps/{id}/deviceStatuses` | hourly | `intune.app_deployment_runs` |
| `intune-script-runs` | `/deviceManagement/deviceManagementScripts/{id}/deviceRunStates` | hourly | `intune.script_runs` |
| `signin-logs` | `/auditLogs/signIns` | 60m (last 1h window) | `audit.signin_events` |
| `directory-audit` | `/auditLogs/directoryAudits` | 60m | `audit.directory_events` |

## 4. Write paths (we initiate)

| Action | Graph call |
|--------|-----------|
| Create user | `POST /users` then `POST /users/{id}/assignLicense` |
| Disable user | `PATCH /users/{id} { accountEnabled: false }` + revoke sessions: `POST /users/{id}/revokeSignInSessions` |
| Create dynamic group | `POST /groups` with `groupTypes:["DynamicMembership"]`, `membershipRule:"..."` |
| Add static member | `POST /groups/{id}/members/$ref` |
| Nest a group inside another | `POST /groups/{parent}/members/$ref { @odata.id: ".../groups/{child}" }` |
| Assign app to group | `POST /deviceAppManagement/mobileApps/{id}/assignments` with target `groupAssignmentTarget` |
| Push CA policy | `POST /identity/conditionalAccess/policies` |
| Force device sync | `POST /deviceManagement/managedDevices/{id}/syncDevice` |
| Wipe device | `POST /deviceManagement/managedDevices/{id}/wipe` |
| Retire device | `POST /deviceManagement/managedDevices/{id}/retire` |
| Reset password | `POST /users/{id}/authentication/methods/{methodId}/resetPassword` |
| Send mail (system) | `POST /users/no-reply@msp.app/sendMail` |

## 5. Dynamic-group rule patterns we'll templatize

| Job pattern | Membership rule |
|-------------|----------------|
| All Atlanta listing agents | `(user.department -eq "Atlanta") -and (user.jobTitle -contains "Listing")` |
| All admins of a brokerage | `(user.companyName -eq "Acme Realty") -and (user.jobTitle -in ["Office Manager","Broker In Charge","Admin"])` |
| All transaction coordinators | `user.jobTitle -contains "Transaction Coordinator"` |
| All on-leave staff | `user.extension_msp_status -eq "on_leave"` (custom directory ext) |

We expose a UI in `/admin/groups/new` that produces the rule and previews the
matching users via `/users?$filter=...&$count=true` before saving.

## 6. Drift detection

A nightly worker compares:
- `directory.role_entitlements` (intended) vs. `directory.role_assignments` (actual from Graph).
- `intune.app_deployments` declared in the YAML manifest vs. the actual Intune assignments.

Mismatches open `support.tickets` in the queue `drift_detector` with:
- the intended state JSON
- the actual state JSON
- a one-click "reconcile" button (calls Graph to bring it in line)

## 7. Token storage & rotation

- Per-tenant rows in `directory.oauth_tokens(tenant_id, kind, access_token, refresh_token, expires_at, scopes)`.
- Encrypted at rest with **Supabase Vault** (`pgsodium`).
- Refresher worker runs every 5 min; surfaces failures as P1 tickets.
- Cert-based auth where supported (preferred) — we rotate certs every 6 months via an automated job that uses the previous cert to push the new public key.

## 8. Observability

- Every Graph call wrapped in a helper that logs: tenant_id, endpoint, status, duration, request id (`client-request-id` header), correlation id.
- 429 backoff respects `Retry-After`.
- Aggregate metrics → `analytics.kpi_snapshots`: graph_call_count, graph_error_rate, p95_latency, deltatoken_age.

## 9. Security guardrails

- All Graph credentials live **server-side only** (`web/src/server/graph/*`).
- Per-tenant **kill switch** in `internal.kill_switches.graph_writes_enabled`.
- All write actions emit an `audit.events_partitioned` row with `before_state`, `after_state`, the Graph correlation id, and the actor profile.
- `wipe`, `retire`, `delete user` require **2-person approval** in the UI before the API call fires.
