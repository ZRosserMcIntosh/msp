# Intune — Automated Imaging & App Deployment

> **Goal:** A brand-new device shipped to a brokerage hire boots, joins Entra, pulls the
> imaging package, installs the role-based app set, and is desk-ready before the user
> finishes their coffee. Zero touch from our techs after staging.

This is the playbook our automation will encode. The doc is the spec; the
implementation lives in `intune.*` tables + the sync workers in
`web/src/server/jobs/intune/*`.

---

## 1. The Windows Autopilot pipeline

```
Vendor (Dell/HP/Lenovo/Microsoft) ── ships device with hardware hash ──►
  Microsoft Partner Center (Autopilot registration)                      ──►
  Intune (device shows up under Autopilot devices)                       ──►
  We assign an Autopilot Deployment Profile to the right group           ──►
  User powers on → ESP runs → device joins Entra → Intune pushes apps    ──►
  User signs in → assigned-user apps install → done
```

### 1.1 Prerequisites
- Microsoft 365 Business Premium **or** EMS E3/E5 per device.
- Azure AD (Entra) tenant for the brokerage.
- An MSP **multi-tenant Azure App Registration** with delegated + app-only permissions:
  - `DeviceManagementServiceConfig.ReadWrite.All`
  - `DeviceManagementConfiguration.ReadWrite.All`
  - `DeviceManagementApps.ReadWrite.All`
  - `DeviceManagementManagedDevices.ReadWrite.All`
  - `Group.ReadWrite.All`
  - `User.ReadWrite.All`
- A signed customer GDAP/admin-consent grant.

### 1.2 The Autopilot profile we ship by default
| Setting | Value | Why |
|---------|-------|-----|
| Deployment mode | User-driven | Self-service for new hires |
| Join | Microsoft Entra joined | No on-prem AD required |
| Skip OOBE | EULA, language, region, account, privacy, OEM | One-tap setup |
| User type | Standard (not local admin) | Least privilege |
| Device name template | `BRK-%RAND:6%` (e.g., `BRK-7H2K9R`) | Sortable, auditable |
| Hide change account options | Yes | Force company account |
| Apply scripts | "Daily 03:00 reboot enforcer" + "BitLocker baseline" | See `intune-daily-reboot.md` |

### 1.3 Enrollment Status Page (ESP)
- **Block device until apps install:** Yes
- **Required app deadline:** 60 minutes
- **Required apps for ESP:** Office 365, Edge, Defender for Endpoint, our agent (`MSP Agent`), 1Password/Bitwarden client.
- **On failure:** Allow user to continue; flag in `intune.enrollment_status_pages`.

### 1.4 Hash collection (the one manual step)
We collect each device's **hardware hash** in two ways:
1. **Vendor direct registration** (preferred): Dell/Lenovo/HP register at order time using our Partner Center ID — hash arrives before the box does.
2. **Tech staging** for whitebox/refurb: tech runs `Get-WindowsAutoPilotInfo.ps1` from an admin PowerShell, CSV emails to Intune, hash registered in <2 min.

We expose a **MSP Tech mobile app** flow: scan serial → upload hash CSV → device shows in `intune.intune_devices` with `lifecycle_state = 'imaged'`.

---

## 2. macOS deployment (Apple Business Manager → Intune)

```
Apple Business Manager (DEP) ── assigns devices to Intune MDM ──►
  Intune Enrollment Program token (renewed yearly) ──►
  Mac powers on → ABM redirects to Intune ──►
  Setup Assistant skipped → Configuration profiles applied ──►
  Apps install via VPP/managed apps
```

Mirror profile structure: device-naming `BRK-MAC-%RAND:6%`, FileVault enforced w/ escrow,
Self Service portal preinstalled.

---

## 3. App deployment matrix

Apps are **assigned to dynamic groups**, never to individuals. The groups are
populated by `job_title` + `department` rules synced from `core.profiles`.

| App | Source | Assignment | Required for |
|-----|--------|------------|---------------|
| Microsoft 365 Apps | M365 Admin Center | Required | All staff |
| Microsoft Teams | M365 | Required | All |
| Microsoft Edge | Built-in | Required | All |
| Defender for Endpoint | M365 | Required | All |
| 1Password Business / Bitwarden | LOB MSI/PKG | Required | All |
| MSP Agent (our daemon) | Custom MSI/PKG | Required | All |
| Adobe Acrobat | Adobe VIP | Required | All |
| Zoom | Win32/PKG | Available | All |
| dotloop / Skyslope | Web shortcut | Available | Agents |
| BoomTown / kvCORE / FUB desktop | Webclip/MSI | Available | Agents |
| QuickBooks Online (browser PWA) | PWA | Available | Accounting |
| Slack | Win32/PKG | Available | All |

`intune.app_deployments` rows are seeded from a YAML manifest in
`/web/src/server/intune/manifests/<role>.yml` so changes are versioned in git.

---

## 4. Configuration profiles we always apply

| Profile | Platform | Effect |
|---------|----------|--------|
| BitLocker / FileVault enforced | Win/Mac | Disk encryption + key escrow to Entra |
| Defender ASR rules | Win | Block macros, LSASS, ransomware behaviors |
| Smart Screen / Gatekeeper | Win/Mac | Block unsigned binaries |
| Update ring "Broad" | Win | 7-day deferral, monthly patch Tue + 2 |
| Apple OS Update | Mac | Auto install minor, prompt for major |
| Wi-Fi (office SSIDs) | All | Pre-provisioned cert auth |
| VPN (Tailscale/AOVPN) | All | Always-on for protected resources |
| Compliance: device must be encrypted, OS up to date, AV running | All | Conditional Access input |
| Idle lock 10 min, password policy | All | NIST 800-171 baseline |
| **Daily 03:00 reboot script** | Win/Mac | See `intune-daily-reboot.md` |

---

## 5. Conditional Access (CA) policies

We chain Intune compliance into Entra CA so non-compliant devices can't reach M365:

1. **CA: Require compliant device for Office 365** — applies to all users except break-glass.
2. **CA: Require MFA for all users** — every sign-in.
3. **CA: Block legacy auth** — kills POP/IMAP/basic.
4. **CA: Require compliant device for SharePoint download** — agents on personal devices get web-only access.
5. **CA: Geo-fence to US** — block sign-in attempts outside US/Brazil unless travel-exception is set.

These are codified in `directory.conditional_access_policies` and pushed via Graph.

---

## 6. Imaging package contents (the "MSP Gold Image")

For OEMs that support custom image preload (Dell ImageAssist, HP Image Assistant), we provide a single WIM containing:
- Windows 11 Pro 24H2 cumulative + .NET 8 + WebView2 evergreen
- Office 365 Apps for Enterprise (channel: Monthly Enterprise)
- Edge enterprise w/ our managed bookmarks JSON
- Defender for Endpoint onboarding script (run-once)
- MSP Agent (telemetry + remote help)
- Drivers: vendor's latest driver pack
- BitLocker pre-provisioning enabled

The image is built nightly by an Azure Pipelines workflow (`/.azure/pipelines/image.yml` — to scaffold) and signed.

---

## 7. The "MSP Agent" — what it does

A small cross-platform daemon (Tauri or .NET MAUI native) installed on every managed device:
- Heartbeats to `/api/agent/checkin` every 5 min → updates `assets.devices.last_seen_at`.
- Reports CPU/RAM/disk + battery health every 15 min → `intune.compliance_snapshots`.
- Hosts the **support hotkey listener** outside the browser too (Cmd/Ctrl + Shift + /).
- Implements the **3 AM reboot** locally as a backup if Intune script doesn't run.
- Surfaces a system tray menu: "Open ticket", "Run diagnostics", "Reboot now (saves work)".

---

## 8. Implementation order

1. ✅ Tables: `intune.*` (migration 006).
2. ⏭ Azure App Registration; store creds in Supabase Vault.
3. ⏭ Background worker `intune-sync-devices` (every 30m).
4. ⏭ Background worker `intune-sync-app-states` (hourly).
5. ⏭ YAML manifest → Intune assignment reconciler.
6. ⏭ Autopilot CSV uploader (admin UI).
7. ⏭ ESP / compliance dashboard (read-only views over `intune.compliance_snapshots`).
8. ⏭ MSP Agent v0.1 (Windows only, heartbeat + tray).
9. ⏭ macOS support (ABM token, configuration profiles, agent build).
10. ⏭ Linux/iOS/Android (later).
