-- Migration: 003 — Ticketing / Helpdesk
-- Creates: tickets, ticket_comments

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TICKETS                                                    ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to     uuid REFERENCES public.profiles(id),
  device_id       uuid REFERENCES public.devices(id),
  
  subject         text NOT NULL,
  description     text,
  priority        text NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category        text,
  
  resolved_at     timestamptz,
  closed_at       timestamptz,
  sla_due_at      timestamptz,
  
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_org ON public.tickets(org_id, status);
CREATE INDEX idx_tickets_assigned ON public.tickets(assigned_to, status);
CREATE INDEX idx_tickets_created_by ON public.tickets(created_by);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  TICKET COMMENTS                                            ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id       uuid NOT NULL REFERENCES public.profiles(id),
  body            text NOT NULL,
  is_internal     boolean NOT NULL DEFAULT false,  -- internal notes vs customer-visible
  attachments     jsonb DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments(ticket_id, created_at);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS POLICIES                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets in own org"
  ON public.tickets FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view comments on accessible tickets"
  ON public.ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_comments.ticket_id
      AND t.org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Internal comments only visible to platform staff
CREATE POLICY "Internal comments visible to platform staff"
  ON public.ticket_comments FOR SELECT
  USING (
    is_internal = false
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'platform_tech')
    )
  );

-- Triggers
CREATE TRIGGER set_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
