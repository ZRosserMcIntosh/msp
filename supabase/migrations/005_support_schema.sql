-- Migration: 005 — Support / Ticketing schema
-- Creates: schema `support` with tickets, messages, attachments, screenshots, SLA, KB.
--
-- Multi-schema strategy: this is the FIRST new bounded context to live outside `public`.
-- Existing tables in `public.*` (orgs, profiles, devices, etc.) remain for now;
-- a future migration `010_schema_refactor.sql` will move them to `core.*`/`assets.*`.
-- Until then, we FK from `support.*` to `public.*` and keep helpers small.
--
-- See: docs/database-architecture.md

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SCHEMA + GRANTS                                            ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE SCHEMA IF NOT EXISTS support;

GRANT USAGE ON SCHEMA support TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA support
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA support
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- pgvector for KB embeddings (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ENUMS                                                      ║
-- ╚══════════════════════════════════════════════════════════════╝
DO $$
BEGIN
  CREATE TYPE support.ticket_priority AS ENUM ('low','normal','high','urgent','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE support.ticket_status AS ENUM ('new','open','pending','on_hold','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TYPE support.ticket_channel AS ENUM (
    'hotkey',   -- Cmd/Ctrl+/ from inside the app
    'portal',   -- self-service web form
    'email',    -- inbound parsed email
    'sms',      -- twilio inbound
    'teams',    -- ms teams bot
    'phone',    -- voice call manually logged
    'walkup',   -- in-person at office
    'system'    -- auto-opened by drift / monitor
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SLA POLICIES                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.sla_policies (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name                     text NOT NULL,
  description              text,
  applies_to_priority      support.ticket_priority,
  first_response_minutes   int NOT NULL,
  resolution_minutes       int NOT NULL,
  business_hours_only      boolean NOT NULL DEFAULT true,
  is_default               boolean NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sla_policies_org ON support.sla_policies(org_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TICKETS                                                    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.tickets (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_number            bigserial UNIQUE,            -- human-friendly #
  requester_profile_id     uuid REFERENCES public.profiles(id),
  requester_email          text,                        -- when no profile
  assignee_profile_id      uuid REFERENCES public.profiles(id),
  queue                    text NOT NULL DEFAULT 'general',  -- 'general'|'helpdesk'|'field'|'drift_detector'|...
  subject                  text NOT NULL,
  body                     text,
  channel                  support.ticket_channel NOT NULL DEFAULT 'portal',
  priority                 support.ticket_priority NOT NULL DEFAULT 'normal',
  status                   support.ticket_status NOT NULL DEFAULT 'new',

  -- Context captured at creation (especially from Cmd/Ctrl+/ hotkey)
  source_url               text,
  source_user_agent        text,
  source_viewport          jsonb,                       -- {"w":..,"h":..,"dpr":..,"os":..}
  source_route             text,                        -- app-level route key
  source_state             jsonb,                       -- arbitrary debugging context

  -- Linkage
  related_device_id        uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  parent_ticket_id         uuid REFERENCES support.tickets(id) ON DELETE SET NULL,

  -- SLA
  sla_policy_id            uuid REFERENCES support.sla_policies(id),
  first_response_at        timestamptz,
  resolved_at              timestamptz,
  closed_at                timestamptz,
  breach_at                timestamptz,                 -- computed at write-time

  -- AI triage
  ai_summary               text,
  ai_priority_score        numeric(4,3),                -- 0..1
  ai_kb_article_ids        uuid[] DEFAULT '{}',

  metadata                 jsonb NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_tickets_org_status   ON support.tickets(org_id, status);
CREATE INDEX IF NOT EXISTS ix_tickets_org_queue    ON support.tickets(org_id, queue);
CREATE INDEX IF NOT EXISTS ix_tickets_assignee     ON support.tickets(assignee_profile_id);
CREATE INDEX IF NOT EXISTS ix_tickets_requester    ON support.tickets(requester_profile_id);
CREATE INDEX IF NOT EXISTS ix_tickets_created_desc ON support.tickets(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_tickets_breach       ON support.tickets(org_id, breach_at)
  WHERE status NOT IN ('resolved','closed');

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TICKET MESSAGES (thread)                                   ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.ticket_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES support.tickets(id) ON DELETE CASCADE,
  author_profile_id uuid REFERENCES public.profiles(id),
  author_email    text,
  body            text NOT NULL,
  body_format     text NOT NULL DEFAULT 'markdown' CHECK (body_format IN ('markdown','html','text')),
  is_internal     boolean NOT NULL DEFAULT false,    -- true = staff-only note
  channel         support.ticket_channel NOT NULL DEFAULT 'portal',
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ticket_messages_ticket ON support.ticket_messages(ticket_id, created_at);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ATTACHMENTS                                                ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.ticket_attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES support.tickets(id) ON DELETE CASCADE,
  message_id      uuid REFERENCES support.ticket_messages(id) ON DELETE CASCADE,
  uploader_id     uuid REFERENCES public.profiles(id),
  storage_path    text NOT NULL,                     -- bucket + key
  file_name       text NOT NULL,
  mime_type       text,
  size_bytes      bigint,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ticket_attachments_ticket ON support.ticket_attachments(ticket_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SCREENSHOTS (Cmd/Ctrl+/ captures get a dedicated table)    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.screenshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES support.tickets(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,                     -- e.g. support-screenshots/{org}/{yyyy}/{mm}/{id}.png
  mime_type       text NOT NULL DEFAULT 'image/png',
  width_px        int,
  height_px       int,
  device_pixel_ratio numeric(4,2),
  page_url        text NOT NULL,
  page_title      text,
  dom_html_path   text,                              -- optional serialized DOM
  console_log     jsonb,                             -- last N console entries
  network_log     jsonb,                             -- last N requests w/ status
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_screenshots_ticket ON support.screenshots(ticket_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  KNOWLEDGE BASE                                             ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.kb_articles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES public.organizations(id) ON DELETE CASCADE,  -- NULL = platform-wide
  slug            text NOT NULL,
  title           text NOT NULL,
  body_md         text NOT NULL,
  tags            text[] DEFAULT '{}',
  is_published    boolean NOT NULL DEFAULT false,
  visibility      text NOT NULL DEFAULT 'org' CHECK (visibility IN ('public','org','staff')),
  author_id       uuid REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS support.kb_embeddings (
  article_id      uuid PRIMARY KEY REFERENCES support.kb_articles(id) ON DELETE CASCADE,
  embedding       vector(1536),
  model           text NOT NULL DEFAULT 'text-embedding-3-small',
  embedded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_kb_embeddings_ann
  ON support.kb_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TRIAGE RULES                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.triage_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  enabled         boolean NOT NULL DEFAULT true,
  match           jsonb NOT NULL,                    -- e.g. {"channel":"hotkey","subject_contains":"crash"}
  actions         jsonb NOT NULL DEFAULT '[]',       -- [{"set_priority":"high"},{"assign_queue":"helpdesk"}]
  priority_order  int NOT NULL DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  CSAT                                                       ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS support.csat_surveys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL UNIQUE REFERENCES support.tickets(id) ON DELETE CASCADE,
  rating          int CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  responded_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TIMESTAMP TRIGGERS                                         ║
-- ╚══════════════════════════════════════════════════════════════╝
-- public.set_updated_at() was created in 001; reuse it.
CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON support.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_support_kb_articles_updated_at
  BEFORE UPDATE ON support.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_support_sla_policies_updated_at
  BEFORE UPDATE ON support.sla_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_support_triage_rules_updated_at
  BEFORE UPDATE ON support.triage_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ROW LEVEL SECURITY                                         ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE support.tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.ticket_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.ticket_attachments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.screenshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.kb_articles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.kb_embeddings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.sla_policies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.triage_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE support.csat_surveys        ENABLE ROW LEVEL SECURITY;

-- Helper: caller's org
-- (Will move to core.is_member_of_org() after schema refactor.)

CREATE POLICY tickets_select_own_org ON support.tickets
  FOR SELECT USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY tickets_insert_own_org ON support.tickets
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY tickets_update_own_org ON support.tickets
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY ticket_messages_org ON support.ticket_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM support.tickets t
            WHERE t.id = ticket_id
              AND t.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY ticket_attachments_org ON support.ticket_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM support.tickets t
            WHERE t.id = ticket_id
              AND t.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY screenshots_org ON support.screenshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM support.tickets t
            WHERE t.id = ticket_id
              AND t.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY kb_visible ON support.kb_articles
  FOR SELECT USING (
    visibility = 'public'
    OR (
      visibility IN ('org','staff')
      AND (org_id IS NULL OR org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
    )
  );

CREATE POLICY kb_embeddings_visible ON support.kb_embeddings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support.kb_articles a WHERE a.id = article_id)
  );

CREATE POLICY sla_select_own_org ON support.sla_policies
  FOR SELECT USING (
    org_id IS NULL
    OR org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY triage_select_own_org ON support.triage_rules
  FOR SELECT USING (
    org_id IS NULL
    OR org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY csat_org ON support.csat_surveys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM support.tickets t
            WHERE t.id = ticket_id
              AND t.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()))
  );

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SEED — default platform-wide SLA bands                     ║
-- ╚══════════════════════════════════════════════════════════════╝
INSERT INTO support.sla_policies
  (id, org_id, name, applies_to_priority, first_response_minutes, resolution_minutes, business_hours_only, is_default)
VALUES
  (gen_random_uuid(), NULL, 'Critical (P1)', 'critical', 15,  240,  false, false),
  (gen_random_uuid(), NULL, 'Urgent (P2)',   'urgent',   60,  480,  false, false),
  (gen_random_uuid(), NULL, 'High (P3)',     'high',     240, 1440, true,  false),
  (gen_random_uuid(), NULL, 'Normal (P4)',   'normal',   480, 2880, true,  true),
  (gen_random_uuid(), NULL, 'Low (P5)',      'low',      1440, 7200, true, false)
ON CONFLICT DO NOTHING;
