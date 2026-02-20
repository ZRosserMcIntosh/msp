-- Migration: 002 — Inventory, Devices & Device Lifecycle
-- Creates: devices, device_events, accessories, device_accessories

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  DEVICES (inventory & lifecycle tracking)                   ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_to     uuid REFERENCES public.profiles(id),
  
  -- Device identity
  serial_number   text NOT NULL,
  asset_tag       text,
  device_type     text NOT NULL CHECK (device_type IN ('laptop', 'desktop', 'phone', 'tablet', 'monitor', 'printer', 'accessory', 'other')),
  manufacturer    text,
  model           text,
  
  -- Lifecycle
  status          text NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received', 'provisioned', 'qa_passed', 'shipped', 'active', 'retired')),
  
  -- Tracking
  shipstation_order_id  text,
  tracking_number       text,
  carrier               text,
  
  -- Microsoft integration
  intune_device_id      text,
  entra_device_id       text,
  compliance_state      text,
  last_compliance_check timestamptz,
  
  -- Metadata
  purchase_date   date,
  purchase_price  numeric(10,2),
  warranty_expiry date,
  notes           text,
  metadata        jsonb DEFAULT '{}',
  
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_org_id ON public.devices(org_id);
CREATE INDEX idx_devices_status ON public.devices(org_id, status);
CREATE INDEX idx_devices_serial ON public.devices(serial_number);
CREATE INDEX idx_devices_assigned ON public.devices(assigned_to);
CREATE UNIQUE INDEX idx_devices_asset_tag ON public.devices(org_id, asset_tag) WHERE asset_tag IS NOT NULL;

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  DEVICE EVENTS (lifecycle stage transitions)                ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.device_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES public.profiles(id),
  
  from_status     text,
  to_status       text NOT NULL,
  notes           text,
  checklist       jsonb,           -- QA checklist items, provisioning steps
  metadata        jsonb DEFAULT '{}',
  
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_events_device ON public.device_events(device_id, created_at DESC);
CREATE INDEX idx_device_events_org ON public.device_events(org_id, created_at DESC);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  ACCESSORIES (keyboards, chargers, bags, etc.)              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.accessories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  sku             text,
  category        text,
  quantity_total  integer NOT NULL DEFAULT 0,
  quantity_available integer NOT NULL DEFAULT 0,
  unit_cost       numeric(10,2),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_accessories_org ON public.accessories(org_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  DEVICE <-> ACCESSORY ASSIGNMENTS                           ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.device_accessories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  accessory_id    uuid NOT NULL REFERENCES public.accessories(id) ON DELETE CASCADE,
  quantity        integer NOT NULL DEFAULT 1,
  assigned_at     timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS POLICIES                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view devices in own org"
  ON public.devices FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view device events in own org"
  ON public.device_events FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view accessories in own org"
  ON public.accessories FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER set_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_accessories_updated_at
  BEFORE UPDATE ON public.accessories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
