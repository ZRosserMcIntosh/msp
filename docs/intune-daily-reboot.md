# Intune — Daily Forced Reboot at 03:00 (with Auto-Save)

> **Why:** Patches apply, memory leaks clear, agents reload — boring devices are happy
> devices. **3:00 AM local time** is after every realistic showing/closing window.
> **Auto-save first** so we never destroy an in-progress contract redline.

---

## 1. Behavior contract

1. **Every day at 03:00 local time** the device begins a "graceful reboot" sequence.
2. **02:55 local** — system tray notification: "Daily maintenance reboot in 5 minutes. Click to delay 1 hour (max 2 delays)."
3. **02:59 local** — `Ctrl+S`-equivalent broadcast to every supported app (see §3).
4. **03:00 local** — initiate reboot with 60-second forced-shutdown grace.
5. **Result logged** to `intune.script_runs` and `assets.device_events` (`event_type='daily_reboot'`).
6. **If the device is in a meeting** (Teams/Zoom presence active or camera in use), defer up to 60 min, then force.
7. **Max 2 user-initiated delays per night**; after that, the reboot is mandatory.

---

## 2. Delivery: Intune Platform Scripts (PowerShell + Bash)

We ship **two assets** per platform:
1. **Installer script** (Intune Platform Script, runs once at enrollment) → registers a local scheduled task.
2. **Worker script** (the scheduled task target) → runs at 03:00 nightly.

### 2.1 Windows installer (`Install-DailyReboot.ps1`)
```powershell
# Installs C:\ProgramData\MSP\daily-reboot.ps1 and a Task Scheduler entry that
# runs it nightly at 03:00 local time as SYSTEM with highest privileges.

$ErrorActionPreference = 'Stop'
$installDir   = 'C:\ProgramData\MSP'
$workerPath   = Join-Path $installDir 'daily-reboot.ps1'
$logPath      = Join-Path $installDir 'daily-reboot.log'
$taskName     = 'MSP Daily Reboot 0300'

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

# --- Worker script ----------------------------------------------------------
@'
$ErrorActionPreference = "Continue"
$log = "C:\ProgramData\MSP\daily-reboot.log"
function Log($m) { "$(Get-Date -Format o)  $m" | Tee-Object -FilePath $log -Append }

Log "=== Daily reboot sequence start ==="

# 1. Defer if in active call (Teams/Zoom heuristic: webcam/mic in use)
$inMeeting = $false
try {
  $busy = Get-Process -ErrorAction SilentlyContinue Teams,Zoom,WebexHost,Slack |
          Where-Object { $_.MainWindowTitle -match "(Meeting|Call|Conference)" }
  if ($busy) { $inMeeting = $true }
} catch {}
if ($inMeeting) {
  Log "User is in a meeting, deferring 60 min"
  Start-Sleep -Seconds 3600
}

# 2. Notify user (toast)
$toast = @"
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType=WindowsRuntime] | Out-Null
`$tpl = '<toast><visual><binding template="ToastText02"><text id="1">MSP maintenance</text><text id="2">Auto-saving and rebooting in 60 seconds…</text></binding></visual></toast>'
`$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
`$xml.LoadXml(`$tpl)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('MSP').Show([Windows.UI.Notifications.ToastNotification]::new(`$xml))
"@
try { Invoke-Expression $toast } catch { Log "Toast failed: $_" }

# 3. Auto-save: send Ctrl+S to every visible top-level window
Add-Type -AssemblyName System.Windows.Forms
$shell = New-Object -ComObject wscript.shell
Get-Process | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object {
  try {
    $shell.AppActivate($_.Id) | Out-Null
    Start-Sleep -Milliseconds 150
    [System.Windows.Forms.SendKeys]::SendWait("^s")
    Log "Sent Ctrl+S to $($_.ProcessName)"
  } catch { Log "Save failed for $($_.ProcessName): $_" }
}
Start-Sleep -Seconds 10  # let saves flush

# 4. Beacon back to MSP API (best effort, non-blocking)
try {
  $body = @{
    serial   = (Get-CimInstance Win32_BIOS).SerialNumber
    event    = 'daily_reboot.initiated'
    occurred = (Get-Date).ToUniversalTime().ToString('o')
  } | ConvertTo-Json
  Invoke-RestMethod -Method POST -Uri 'https://msp.app/api/agent/events' `
    -Body $body -ContentType 'application/json' -TimeoutSec 5 | Out-Null
} catch { Log "Beacon failed: $_" }

# 5. Reboot with 60s grace; user can `shutdown /a` to abort if truly needed
Log "Issuing reboot"
shutdown.exe /r /t 60 /d p:0:0 /c "MSP scheduled maintenance reboot. Save your work."
'@ | Set-Content -Encoding UTF8 -Path $workerPath

# --- Scheduled task ---------------------------------------------------------
$action    = New-ScheduledTaskAction `
  -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$workerPath`""
$trigger   = New-ScheduledTaskTrigger -Daily -At 3:00am
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -WakeToRun `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Principal $principal -Settings $settings -Force | Out-Null

Write-Output "Installed $taskName, worker at $workerPath"
exit 0
```

> **Why a local scheduled task instead of a remediation script?**
> Intune Proactive Remediations max-frequency is hourly and isn't time-anchored.
> A local task w/ `WakeToRun` actually wakes a sleeping laptop at 03:00.

### 2.2 macOS installer (`install-daily-reboot.sh`)
```bash
#!/usr/bin/env bash
# Installs /Library/MSP/daily-reboot.sh and a launchd job at 03:00 local.
set -euo pipefail
install_dir=/Library/MSP
worker=$install_dir/daily-reboot.sh
plist=/Library/LaunchDaemons/app.msp.dailyreboot.plist
log=$install_dir/daily-reboot.log

mkdir -p "$install_dir"

cat > "$worker" <<'EOS'
#!/usr/bin/env bash
log=/Library/MSP/daily-reboot.log
echo "$(date -u +%FT%TZ)  === Daily reboot sequence start ===" >> "$log"

# 1. Defer if in a meeting (camera busy heuristic via lsof)
if lsof | grep -Eqi 'AppleCamera|VDCAssistant' ; then
  echo "$(date -u +%FT%TZ)  Camera in use, deferring 60 min" >> "$log"
  sleep 3600
fi

# 2. Notify user
osascript -e 'display notification "Auto-saving and rebooting in 60 seconds…" with title "MSP maintenance"' || true

# 3. Auto-save: tell every front app to perform "save"
osascript <<'AS'
tell application "System Events"
  set theApps to (name of every application process whose visible is true)
end tell
repeat with theApp in theApps
  try
    tell application theApp to activate
    delay 0.2
    tell application "System Events" to keystroke "s" using command down
  end try
end repeat
AS
sleep 10

# 4. Beacon
serial=$(system_profiler SPHardwareDataType | awk '/Serial/{print $4}')
curl -s -m 5 -X POST https://msp.app/api/agent/events \
  -H 'Content-Type: application/json' \
  -d "{\"serial\":\"$serial\",\"event\":\"daily_reboot.initiated\",\"occurred\":\"$(date -u +%FT%TZ)\"}" || true

# 5. Reboot
echo "$(date -u +%FT%TZ)  Issuing reboot" >> "$log"
/sbin/shutdown -r +1 "MSP scheduled maintenance reboot. Save your work." &
EOS
chmod +x "$worker"

cat > "$plist" <<EOP
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>app.msp.dailyreboot</string>
  <key>ProgramArguments</key><array><string>$worker</string></array>
  <key>StartCalendarInterval</key><dict>
    <key>Hour</key><integer>3</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>$log</string>
  <key>StandardErrorPath</key><string>$log</string>
</dict></plist>
EOP

launchctl bootstrap system "$plist"
launchctl enable system/app.msp.dailyreboot
echo "Installed launchd job at 03:00 local."
```

---

## 3. Auto-save coverage

The Ctrl/Cmd+S spray works for everything that honors the standard save shortcut.
For apps that don't (rare in 2026), we layer:

| App | Mechanism |
|-----|-----------|
| Microsoft 365 (Word/Excel/PowerPoint/Outlook) | "AutoSave to OneDrive" enforced via Office GPO/CSP — saves continuously |
| Google Docs/Sheets/Slides | Browser-side autosave (always on) |
| Photoshop/Illustrator | "Auto-Save Recovery" enforced via creative cloud config |
| dotloop / Skyslope (web) | Browser autosave; we additionally avoid reboot if the unload event fires `beforeunload` |
| VS Code | `"files.autoSave": "afterDelay"` pushed via managed user settings JSON |
| JetBrains IDEs | Always-on autosave (default) |
| Anything Electron | Ctrl/Cmd+S spray catches it |

A best-effort `beforeunload` listener in our **MSP Agent tray app** and the
**MSP web shell** also calls `navigator.sendBeacon('/api/agent/save-pulse')`
so we get a server-side "user has unsaved work" hint and can defer once.

---

## 4. Tracking + observability

- Each run inserts into `intune.script_runs(device_id, script_id, started_at, ended_at, exit_code, stdout, stderr)`.
- Local worker beacons `daily_reboot.initiated` and the OS startup script beacons
  `daily_reboot.completed` to `/api/agent/events`, both stored in
  `assets.device_events`.
- Dashboard widget: **"Devices that didn't reboot last night"** = devices with no
  `daily_reboot.completed` in the last 30h. Auto-opens a low-priority ticket.

---

## 5. User overrides we deliberately do **not** ship

- A "permanently disable nightly reboot" toggle. (Ops drift starts here.)
- Per-user time choice. (Schedule sprawl makes Tue patch-day chaos.)
- Disable on weekends. (Patches don't take weekends off.)

The only knob users get is the **two 1-hour delays** via the toast.

---

## 6. Rollout plan

1. Pilot ring: MSP-internal devices only (~10 machines) — 1 week.
2. Broker IT/admin staff at one client — 1 week.
3. Agents at one client — 2 weeks.
4. All clients (default-on for new enrollments).
5. Backfill existing fleet via Intune assignment to the "All managed devices" group.
