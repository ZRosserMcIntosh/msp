-- Migration: 004 — Document Vault + Billing Subscriptions
-- Creates: vault_files, vault_folders, subscriptions, subscription_items

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  VAULT FOLDERS                                              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.vault_folders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES public.vault_folders(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_by      uuid REFERENCES public.profiles(id),
  permissions     jsonb DEFAULT '{}',  -- role-based folder access
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_folders_org ON public.vault_folders(org_id);
CREATE INDEX idx_vault_folders_parent ON public.vault_folders(parent_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  VAULT FILES                                                ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.vault_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  folder_id       uuid REFERENCES public.vault_folders(id) ON DELETE SET NULL,
  uploaded_by     uuid REFERENCES public.profiles(id),
  
  name            text NOT NULL,
  storage_path    text NOT NULL,      -- Supabase Storage path
  mime_type       text,
  size_bytes      bigint NOT NULL DEFAULT 0,
  
  -- E-sign status
  esign_envelope_id   text,
  esign_status        text CHECK (esign_status IN ('pending', 'sent', 'signed', 'declined', 'voided')),
  
  -- Retention
  retention_until     timestamptz,
  is_archived         boolean NOT NULL DEFAULT false,
  
  -- Thumbnails & previews
  thumbnail_path      text,
  
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vault_files_org ON public.vault_files(org_id);
CREATE INDEX idx_vault_files_folder ON public.vault_files(folder_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SUBSCRIPTIONS (Stripe mirror)                              ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id  text NOT NULL UNIQUE,
  stripe_customer_id      text NOT NULL,
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  plan_name           text NOT NULL,
  
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at             timestamptz,
  canceled_at           timestamptz,
  
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON public.subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SUBSCRIPTION ITEMS (line items / add-ons)                  ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.subscription_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id     uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_item_id      text NOT NULL,
  product_type        text NOT NULL,     -- 'seat', 'device', 'storage', 'website', 'domain', 'esign'
  quantity            integer NOT NULL DEFAULT 1,
  unit_amount         integer,           -- cents
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  STORAGE QUOTAS (per-org)                                   ║
-- ╚══════════════════════════════════════════════════════════════╝
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  plan_name       text NOT NULL DEFAULT 'starter',
  storage_limit_bytes   bigint NOT NULL DEFAULT 53687091200,     -- 50 GB default
  storage_used_bytes    bigint NOT NULL DEFAULT 0,
  transfer_limit_bytes  bigint NOT NULL DEFAULT 26843545600,     -- 25 GB default
  transfer_used_bytes   bigint NOT NULL DEFAULT 0,
  billing_period_start  timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ╔══════════════════════════════════════════════════════════════╗
-- ║  RLS POLICIES                                               ║
-- ╚══════════════════════════════════════════════════════════════╝
ALTER TABLE public.vault_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vault folders in own org"
  ON public.vault_folders FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view vault files in own org"
  ON public.vault_files FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view subscriptions in own org"
  ON public.subscriptions FOR SELECT
  USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('platform_admin', 'client_admin')
    )
  );

CREATE POLICY "Users can view storage quotas in own org"
  ON public.storage_quotas FOR SELECT
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- Triggers
CREATE TRIGGER set_vault_folders_updated_at
  BEFORE UPDATE ON public.vault_folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_vault_files_updated_at
  BEFORE UPDATE ON public.vault_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_storage_quotas_updated_at
  BEFORE UPDATE ON public.storage_quotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
