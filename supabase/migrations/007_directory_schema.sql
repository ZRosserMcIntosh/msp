-- Migration: 007 — Directory schema (Entra/Azure AD mirror, RBAC, dynamic groups)
-- Creates: schema `directory` for OAuth apps, external (Entra) users/groups,
--          dynamic-group rules, full RBAC matrix, and per-user scope.
-- See: docs/azure-graph-integration.md, docs/database-architecture.md

CREATE SCHEMA IF NOT EXISTS directory;

GRANT USAGE ON SCHEMA directory TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA directory GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA directory
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TENANTS / OAUTH APPS                                       ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS directory.azure_tenants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id           text NOT NULL UNIQUE,                 -- Entra tenantId
  primary_domain      text,
  display_name        text,
  consent_granted_at  timestamptz,
  consent_granted_by  uuid REFERENCES public.profiles(id),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','revoked')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS directory.oauth_apps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            text NOT NULL CHECK (provider IN (
                        'microsoft','google','slack','zoom','quickbooks','docusign','stripe',
                        'twilio','cloudflare','vercel','github')),
  name                text NOT NULL,
  client_id           text NOT NULL,
  redirect_uri        text,
  scopes              text[] DEFAULT '{}',
  is_active           boolean NOT NULL DEFAULT true,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, client_id)
);

CREATE TABLE IF NOT EXISTS directory.oauth_tokens (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oauth_app_id        uuid NOT NULL REFERENCES directory.oauth_apps(id) ON DELETE CASCADE,
  org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,  -- NULL = app-only
  kind                text NOT NULL CHECK (kind IN ('app_only','delegated')),
  access_token        text NOT NULL,                       -- TODO: encrypt with pgsodium
  refresh_token       text,
  token_expires_at    timestamptz,
  scopes              text[] DEFAULT '{}',
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_oauth_tokens_org ON directory.oauth_tokens(org_id);
CREATE INDEX IF NOT EXISTS ix_oauth_tokens_expires ON directory.oauth_tokens(token_expires_at);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  EXTERNAL USERS (Entra mirror)                              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS directory.external_users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entra_object_id     text NOT NULL,
  user_principal_name text NOT NULL,
  display_name        text,
  given_name          text,
  surname             text,
  job_title           text,
  department          text,
  company_name        text,
  office_location     text,
  account_enabled     boolean,
  on_premises_synced  boolean,
  licenses            text[] DEFAULT '{}',                 -- M365 SKU GUIDs
  raw_payload         jsonb NOT NULL DEFAULT '{}',
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, entra_object_id)
);

CREATE INDEX IF NOT EXISTS ix_external_users_upn ON directory.external_users(user_principal_name);
CREATE INDEX IF NOT EXISTS ix_external_users_jobdept ON directory.external_users(org_id, job_title, department);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  GROUPS + DYNAMIC GROUPS + NESTED MEMBERSHIP                ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS directory.groups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entra_object_id     text,                                -- NULL until pushed to Graph
  name                text NOT NULL,
  description         text,
  group_kind          text NOT NULL DEFAULT 'static' CHECK (group_kind IN ('static','dynamic')),
  membership_rule     text,                                -- Entra rule expression
  rule_definition     jsonb,                               -- our parsed AST
  rule_processing_state text,                              -- 'On'|'Paused'|'Error'
  is_security         boolean NOT NULL DEFAULT true,
  is_mail_enabled     boolean NOT NULL DEFAULT false,
  raw_payload         jsonb DEFAULT '{}',
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS ix_groups_org_kind ON directory.groups(org_id, group_kind);

-- Members can be users OR other groups (nesting). Exactly one of the two is non-null.
CREATE TABLE IF NOT EXISTS directory.group_members (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            uuid NOT NULL REFERENCES directory.groups(id) ON DELETE CASCADE,
  member_user_id      uuid REFERENCES directory.external_users(id) ON DELETE CASCADE,
  member_group_id     uuid REFERENCES directory.groups(id) ON DELETE CASCADE,
  source              text NOT NULL DEFAULT 'static' CHECK (source IN ('static','dynamic','synced')),
  added_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (member_user_id  IS NOT NULL AND member_group_id IS NULL) OR
    (member_user_id  IS NULL     AND member_group_id IS NOT NULL)
  ),
  UNIQUE (group_id, member_user_id, member_group_id)
);

CREATE INDEX IF NOT EXISTS ix_gm_group ON directory.group_members(group_id);
CREATE INDEX IF NOT EXISTS ix_gm_user  ON directory.group_members(member_user_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RBAC: ROLES, PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES     ║
-- ║  (Pattern lifted from stella.rbac, adapted for org_id)      ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS directory.roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES public.organizations(id) ON DELETE CASCADE,  -- NULL = platform-wide
  key           text NOT NULL,
  name          text NOT NULL,
  description   text,
  is_system     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

CREATE TABLE IF NOT EXISTS directory.permissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key               text UNIQUE NOT NULL,           -- 'support.ticket.write', 'devices.wipe', etc.
  description       text,
  is_sensitive      boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT false,
  scope_aware       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS directory.role_permissions (
  role_id        uuid NOT NULL REFERENCES directory.roles(id)       ON DELETE CASCADE,
  permission_id  uuid NOT NULL REFERENCES directory.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS directory.user_roles (
  profile_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id        uuid NOT NULL REFERENCES directory.roles(id) ON DELETE CASCADE,
  granted_by     uuid REFERENCES public.profiles(id),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, role_id)
);

-- Per-user overrides (allow OR deny a single permission)
CREATE TABLE IF NOT EXISTS directory.user_permissions (
  profile_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id  uuid NOT NULL REFERENCES directory.permissions(id) ON DELETE CASCADE,
  allowed        boolean NOT NULL DEFAULT true,
  reason         text,
  granted_by     uuid REFERENCES public.profiles(id),
  granted_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, permission_id)
);

-- Per-user data scope (own/team/office/city/all) for scope-aware permissions
CREATE TABLE IF NOT EXISTS directory.user_scopes (
  profile_id      uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope_devices   text NOT NULL DEFAULT 'own'   CHECK (scope_devices  IN ('own','team','office','city','all')),
  scope_tickets   text NOT NULL DEFAULT 'own'   CHECK (scope_tickets  IN ('own','team','office','city','all')),
  scope_listings  text NOT NULL DEFAULT 'own'   CHECK (scope_listings IN ('own','team','office','city','all')),
  scope_clients   text NOT NULL DEFAULT 'own'   CHECK (scope_clients  IN ('own','team','office','city','all')),
  cities          text[] DEFAULT '{}',
  offices         uuid[] DEFAULT '{}',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ROLE → ENTITLEMENT MAP (drives provisioning + drift detect)║
-- ╚══════════════════════════════════════════════════════════════╝
-- One row per (role, app/group/license) the role should always carry.
CREATE TABLE IF NOT EXISTS directory.role_entitlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id         uuid NOT NULL REFERENCES directory.roles(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('group','license','app','permission')),
  group_id        uuid REFERENCES directory.groups(id) ON DELETE CASCADE,
  permission_id   uuid REFERENCES directory.permissions(id) ON DELETE CASCADE,
  external_key    text,                                 -- license SKU id / Intune app id / etc.
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_role_entitlements_role ON directory.role_entitlements(role_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  CONDITIONAL ACCESS POLICY MIRROR                           ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS directory.conditional_access_policies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entra_policy_id     text,
  display_name        text NOT NULL,
  state               text NOT NULL DEFAULT 'enabledForReportingButNotEnforced'
                        CHECK (state IN ('enabled','disabled','enabledForReportingButNotEnforced')),
  conditions          jsonb NOT NULL DEFAULT '{}',
  grant_controls      jsonb NOT NULL DEFAULT '{}',
  session_controls    jsonb NOT NULL DEFAULT '{}',
  raw_payload         jsonb NOT NULL DEFAULT '{}',
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  UPDATED_AT TRIGGERS                                        ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TRIGGER set_dir_tenants_uat
  BEFORE UPDATE ON directory.azure_tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_dir_oauth_apps_uat
  BEFORE UPDATE ON directory.oauth_apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_dir_oauth_tokens_uat
  BEFORE UPDATE ON directory.oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_dir_external_users_uat
  BEFORE UPDATE ON directory.external_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_dir_groups_uat
  BEFORE UPDATE ON directory.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_dir_ca_uat
  BEFORE UPDATE ON directory.conditional_access_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS                                                        ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE directory.azure_tenants                ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.oauth_apps                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.oauth_tokens                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.external_users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.groups                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.group_members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.roles                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.permissions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.role_permissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.user_roles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.user_permissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.user_scopes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.role_entitlements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory.conditional_access_policies  ENABLE ROW LEVEL SECURITY;

-- Org-scoped read for everything that has org_id directly
CREATE POLICY tenants_read_org ON directory.azure_tenants
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY tokens_read_org ON directory.oauth_tokens
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY external_users_read_org ON directory.external_users
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY groups_read_org ON directory.groups
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY group_members_read_org ON directory.group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM directory.groups g
            WHERE g.id = group_id
              AND g.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY roles_read ON directory.roles
  FOR SELECT USING (
    org_id IS NULL
    OR org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY permissions_read ON directory.permissions
  FOR SELECT USING (true);                              -- catalog is global

CREATE POLICY role_perm_read ON directory.role_permissions
  FOR SELECT USING (true);                              -- read-through to role policy

CREATE POLICY user_roles_read ON directory.user_roles
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles me
               WHERE me.id = auth.uid() AND me.role IN ('platform_admin','client_admin'))
  );

CREATE POLICY user_perm_read ON directory.user_permissions
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles me
               WHERE me.id = auth.uid() AND me.role IN ('platform_admin','client_admin'))
  );

CREATE POLICY user_scope_read ON directory.user_scopes
  FOR SELECT USING (
    profile_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles me
               WHERE me.id = auth.uid() AND me.role IN ('platform_admin','client_admin'))
  );

CREATE POLICY role_ent_read ON directory.role_entitlements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM directory.roles r
            WHERE r.id = role_id
              AND (r.org_id IS NULL
                   OR r.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())))
  );

CREATE POLICY ca_read_org ON directory.conditional_access_policies
  FOR SELECT USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SEED — platform-wide permission catalog                    ║
-- ╚══════════════════════════════════════════════════════════════╝
INSERT INTO directory.permissions (key, description, is_sensitive, scope_aware) VALUES
  ('platform.admin',           'Full platform admin (MSP staff)',          true,  false),
  ('org.admin',                'Full org admin',                           true,  false),
  ('users.read',               'Read users in own org',                    false, true),
  ('users.write',              'Create/edit users in own org',             true,  true),
  ('users.offboard',           'Initiate offboarding',                     true,  true),
  ('devices.read',             'View devices',                             false, true),
  ('devices.write',            'Edit/assign devices',                      false, true),
  ('devices.wipe',             'Remote wipe a device',                     true,  true),
  ('devices.retire',           'Retire a device',                          true,  true),
  ('intune.scripts.read',      'Read Intune scripts',                      false, false),
  ('intune.scripts.write',     'Push Intune scripts',                      true,  false),
  ('intune.apps.assign',       'Assign apps to groups',                    true,  false),
  ('groups.read',              'Read directory groups',                    false, false),
  ('groups.write',             'Create/edit groups + dynamic rules',       true,  false),
  ('support.ticket.read',      'Read tickets',                             false, true),
  ('support.ticket.write',     'Create/respond to tickets',                false, true),
  ('support.ticket.delete',    'Delete tickets (rare)',                    true,  false),
  ('support.kb.write',         'Author KB articles',                       false, false),
  ('billing.read',             'View billing',                             false, false),
  ('billing.write',            'Manage subscriptions/payment methods',     true,  false),
  ('vault.read',               'Read documents',                           false, true),
  ('vault.write',              'Upload documents',                         false, true),
  ('vault.delete',             'Delete documents (with retention rules)', true,  true),
  ('analytics.read',           'View dashboards',                          false, true),
  ('automation.write',         'Author automation rules',                  true,  false),
  ('audit.read',               'View audit log',                           true,  false)
ON CONFLICT (key) DO NOTHING;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SEED — system roles                                        ║
-- ╚══════════════════════════════════════════════════════════════╝
INSERT INTO directory.roles (key, name, description, is_system) VALUES
  ('platform_admin',  'Platform Admin',  'MSP staff — full access',          true),
  ('platform_tech',   'Platform Tech',   'MSP technician',                    true),
  ('client_admin',    'Client Admin',    'Brokerage owner / IT lead',         true),
  ('broker_in_charge','Broker in Charge','Compliance + transaction oversight',true),
  ('office_manager',  'Office Manager',  'Office-level admin',                true),
  ('listing_agent',   'Listing Agent',   'RE agent — listings focus',         true),
  ('buyer_agent',     'Buyer Agent',     'RE agent — buyer focus',            true),
  ('agent',           'Agent',           'General agent',                     true),
  ('transaction_coord','Transaction Coordinator','Closing operations',        true),
  ('marketing',       'Marketing',       'Content + social',                  true),
  ('accounting',      'Accounting',      'Finance + payouts',                 true),
  ('legal',           'Legal',           'Contracts + compliance',            true),
  ('viewer',          'Viewer',          'Read-only',                         true),
  ('external',        'External',        'Limited contractor',                true)
ON CONFLICT (org_id, key) DO NOTHING;
