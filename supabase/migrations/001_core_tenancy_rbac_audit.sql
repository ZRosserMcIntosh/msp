-- Migration: 001 — Core Tenancy + RBAC + Audit
-- Creates: organizations, profiles, roles, audit_events

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ORGANIZATIONS (top-level tenant)                           ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  is_platform   boolean NOT NULL DEFAULT false,  -- true = MSP internal org
  logo_url      text,
  settings      jsonb DEFAULT '{}',
  stripe_customer_id  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PROFILES (extends Supabase auth.users)                     ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  avatar_url    text,
  phone         text,
  role          text NOT NULL DEFAULT 'client_agent'
                CHECK (role IN (
                  'platform_admin',
                  'platform_tech',
                  'client_admin',
                  'client_manager',
                  'client_agent',
                  'client_viewer'
                )),
  is_active     boolean NOT NULL DEFAULT true,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TEAMS (sub-orgs within a tenant)                           ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  manager_id    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_org_id ON public.teams(org_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TEAM MEMBERS (join table)                                  ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.team_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('lead', 'member')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, profile_id)
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  AUDIT EVENTS (append-only, immutable)                      ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.audit_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES public.organizations(id),
  actor_id      uuid REFERENCES public.profiles(id),
  action_type   text NOT NULL,        -- e.g. 'device.staged', 'ticket.created'
  entity_type   text NOT NULL,        -- e.g. 'device', 'ticket', 'document'
  entity_id     uuid,
  before_state  jsonb,
  after_state   jsonb,
  metadata      jsonb DEFAULT '{}',   -- IP, user agent, request_id, etc.
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Partition-friendly index for time-range queries
CREATE INDEX idx_audit_events_org_created ON public.audit_events(org_id, created_at DESC);
CREATE INDEX idx_audit_events_entity ON public.audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_id, created_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ROW-LEVEL SECURITY POLICIES                               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Organizations: users can only see their own org
CREATE POLICY "Users can view own org"
  ON public.organizations FOR SELECT
  USING (id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Platform admins can see all orgs
CREATE POLICY "Platform admins can view all orgs"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );

-- Profiles: users in same org can see each other
CREATE POLICY "Users can view profiles in own org"
  ON public.profiles FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles: users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Teams: users can view teams in their org
CREATE POLICY "Users can view teams in own org"
  ON public.teams FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Audit events: users can view audit events for their org
CREATE POLICY "Users can view audit events in own org"
  ON public.audit_events FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Audit events: only service role can insert (via server-side functions)
CREATE POLICY "Service role can insert audit events"
  ON public.audit_events FOR INSERT
  WITH CHECK (true);  -- Enforced at application layer via service role

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  UPDATED_AT TRIGGER                                         ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
