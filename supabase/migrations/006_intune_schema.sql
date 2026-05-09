-- Migration: 006 — Intune / Endpoint Management schema
-- Creates: schema `intune` mirroring Microsoft Intune objects + run history.
-- See: docs/intune-deployment.md, docs/intune-daily-reboot.md

CREATE SCHEMA IF NOT EXISTS intune;

GRANT USAGE ON SCHEMA intune TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA intune
  GRANT SELECT ON TABLES TO authenticated;        -- writes via service role only
ALTER DEFAULT PRIVILEGES IN SCHEMA intune
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  INTUNE DEVICES (1:1 mirror, joined to assets via serial)   ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.intune_devices (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id                uuid REFERENCES public.devices(id) ON DELETE SET NULL,

  -- Microsoft identifiers
  intune_device_id         text NOT NULL,           -- managedDevice.id
  azure_ad_device_id       text,
  entra_device_object_id   text,
  serial_number            text,

  -- Owner
  primary_user_upn         text,
  primary_user_id          text,

  -- OS / hardware
  os_platform              text,                    -- 'Windows','macOS','iOS','Android','Linux'
  os_version               text,
  manufacturer             text,
  model                    text,
  total_storage_bytes      bigint,
  free_storage_bytes       bigint,

  -- State
  enrollment_state         text,                    -- 'enrolled','pendingReset','failed','notContacted'
  compliance_state         text,                    -- 'compliant','noncompliant','inGracePeriod','unknown'
  management_agent         text,
  ownership                text CHECK (ownership IN ('company','personal','shared','unknown')),
  is_supervised            boolean,
  is_encrypted             boolean,

  last_sync_at             timestamptz,
  enrolled_at              timestamptz,
  raw_payload              jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  UNIQUE (org_id, intune_device_id)
);

CREATE INDEX IF NOT EXISTS ix_intune_devices_org           ON intune.intune_devices(org_id);
CREATE INDEX IF NOT EXISTS ix_intune_devices_serial        ON intune.intune_devices(serial_number);
CREATE INDEX IF NOT EXISTS ix_intune_devices_compliance    ON intune.intune_devices(org_id, compliance_state);
CREATE INDEX IF NOT EXISTS ix_intune_devices_last_sync     ON intune.intune_devices(last_sync_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  COMPLIANCE SNAPSHOTS (time-series)                         ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.compliance_snapshots (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intune_device_id         uuid NOT NULL REFERENCES intune.intune_devices(id) ON DELETE CASCADE,
  taken_at                 timestamptz NOT NULL DEFAULT now(),
  compliance_state         text,
  encryption_state         text,
  defender_state           text,
  os_up_to_date            boolean,
  failed_setting_count     int,
  raw_payload              jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_compliance_snapshots_device_time
  ON intune.compliance_snapshots(intune_device_id, taken_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  CONFIGURATION PROFILES                                     ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.configuration_profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intune_profile_id        text NOT NULL,
  name                     text NOT NULL,
  platform                 text,                    -- 'windows','macOS','ios','android'
  type                     text,                    -- '#microsoft.graph.windows10GeneralConfiguration', etc.
  description              text,
  settings                 jsonb NOT NULL DEFAULT '{}',
  raw_payload              jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, intune_profile_id)
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  AUTOPILOT PROFILES                                         ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.autopilot_profiles (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intune_profile_id        text NOT NULL,
  name                     text NOT NULL,
  device_name_template     text,                    -- e.g. 'BRK-%RAND:6%'
  deployment_mode          text,                    -- 'userDriven' | 'selfDeploying'
  join_type                text,                    -- 'azureADJoined' | 'hybrid'
  settings                 jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, intune_profile_id)
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ENROLLMENT STATUS PAGES                                    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.enrollment_status_pages (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intune_device_id         uuid NOT NULL REFERENCES intune.intune_devices(id) ON DELETE CASCADE,
  user_upn                 text,
  state                    text,                    -- 'success'|'inProgress'|'failed'
  account_setup_status     text,
  device_setup_status      text,
  failed_apps              jsonb DEFAULT '[]',
  ended_at                 timestamptz,
  raw_payload              jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  APPS & DEPLOYMENTS                                         ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.apps (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intune_app_id            text NOT NULL,
  display_name             text NOT NULL,
  publisher                text,
  app_type                 text,                    -- '#microsoft.graph.win32LobApp', etc.
  version                  text,
  icon_url                 text,
  install_command          text,
  uninstall_command        text,
  detection_rules          jsonb DEFAULT '[]',
  raw_payload              jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, intune_app_id)
);

CREATE TABLE IF NOT EXISTS intune.app_deployments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id                   uuid NOT NULL REFERENCES intune.apps(id) ON DELETE CASCADE,
  intune_assignment_id     text,
  intent                   text NOT NULL CHECK (intent IN ('required','available','uninstall','availableWithoutEnrollment')),
  target_kind              text NOT NULL,           -- 'allDevices'|'allUsers'|'group'|'exclusion'
  target_group_id          text,                    -- Entra/Intune group object id
  settings                 jsonb DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_app_deployments_app ON intune.app_deployments(app_id);

CREATE TABLE IF NOT EXISTS intune.app_deployment_runs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id                   uuid NOT NULL REFERENCES intune.apps(id) ON DELETE CASCADE,
  intune_device_id         uuid REFERENCES intune.intune_devices(id) ON DELETE CASCADE,
  user_upn                 text,
  install_state            text,                    -- 'installed','failed','notInstalled','pending', etc.
  error_code               text,
  detected_at              timestamptz NOT NULL DEFAULT now(),
  raw_payload              jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_app_deployment_runs_app_device
  ON intune.app_deployment_runs(app_id, intune_device_id, detected_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PLATFORM SCRIPTS (the 03:00 reboot lives here)             ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.scripts (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intune_script_id         text,                    -- NULL until pushed
  name                     text NOT NULL,
  platform                 text NOT NULL CHECK (platform IN ('windows','macOS','linux')),
  run_as                   text NOT NULL DEFAULT 'system' CHECK (run_as IN ('system','user')),
  script_body              text NOT NULL,
  enforce_signature_check  boolean NOT NULL DEFAULT false,
  description              text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name, platform)
);

CREATE TABLE IF NOT EXISTS intune.script_runs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id                uuid NOT NULL REFERENCES intune.scripts(id) ON DELETE CASCADE,
  intune_device_id         uuid REFERENCES intune.intune_devices(id) ON DELETE SET NULL,
  serial_number            text,
  status                   text,                    -- 'success'|'fail'|'pending'
  exit_code                int,
  started_at               timestamptz,
  ended_at                 timestamptz,
  stdout                   text,
  stderr                   text,
  raw_payload              jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_script_runs_script_time
  ON intune.script_runs(script_id, started_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  UPDATE RINGS                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS intune.update_rings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  intune_ring_id           text NOT NULL,
  name                     text NOT NULL,
  platform                 text NOT NULL,
  deferral_days            int,
  active_hours_start       int,
  active_hours_end         int,
  settings                 jsonb DEFAULT '{}',
  raw_payload              jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, intune_ring_id)
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  UPDATED_AT TRIGGERS                                        ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TRIGGER set_intune_devices_uat
  BEFORE UPDATE ON intune.intune_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_config_profiles_uat
  BEFORE UPDATE ON intune.configuration_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_autopilot_profiles_uat
  BEFORE UPDATE ON intune.autopilot_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_apps_uat
  BEFORE UPDATE ON intune.apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_app_deployments_uat
  BEFORE UPDATE ON intune.app_deployments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_scripts_uat
  BEFORE UPDATE ON intune.scripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_intune_update_rings_uat
  BEFORE UPDATE ON intune.update_rings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY (read-only for tenants; writes via SR)  ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE intune.intune_devices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.compliance_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.configuration_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.autopilot_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.enrollment_status_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.apps                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.app_deployments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.app_deployment_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.scripts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.script_runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE intune.update_rings           ENABLE ROW LEVEL SECURITY;

CREATE POLICY intune_devices_read_org ON intune.intune_devices
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY compliance_read_org ON intune.compliance_snapshots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM intune.intune_devices d
            WHERE d.id = intune.compliance_snapshots.intune_device_id  -- explicit qual avoids resolving to d.intune_device_id (text)
              AND d.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY config_profiles_read_org ON intune.configuration_profiles
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY autopilot_read_org ON intune.autopilot_profiles
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY esp_read_org ON intune.enrollment_status_pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM intune.intune_devices d
            WHERE d.id = intune.enrollment_status_pages.intune_device_id  -- explicit qual avoids resolving to d.intune_device_id (text)
              AND d.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY apps_read_org ON intune.apps
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY app_dep_read_org ON intune.app_deployments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM intune.apps a
            WHERE a.id = app_id
              AND a.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY app_dep_runs_read_org ON intune.app_deployment_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM intune.apps a
            WHERE a.id = app_id
              AND a.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY scripts_read_org ON intune.scripts
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY script_runs_read_org ON intune.script_runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM intune.scripts s
            WHERE s.id = script_id
              AND s.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY update_rings_read_org ON intune.update_rings
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SEED — the daily 03:00 reboot script (Windows + macOS)     ║
-- ║  Bodies are short; full installers live in docs/ md files.  ║
-- ╚══════════════════════════════════════════════════════════════╝
DO $$
DECLARE
  platform_org uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id = platform_org) THEN
    INSERT INTO intune.scripts (org_id, name, platform, run_as, script_body, description)
    VALUES
      (platform_org,
       'MSP Daily Reboot 0300 (Windows)',
       'windows', 'system',
       '# See docs/intune-daily-reboot.md — Install-DailyReboot.ps1',
       'Registers a local scheduled task that auto-saves and reboots at 03:00 local time daily.'),
      (platform_org,
       'MSP Daily Reboot 0300 (macOS)',
       'macOS',  'system',
       '# See docs/intune-daily-reboot.md — install-daily-reboot.sh',
       'Registers a launchd job that auto-saves and reboots at 03:00 local time daily.')
    ON CONFLICT (org_id, name, platform) DO NOTHING;
  END IF;
END $$;
