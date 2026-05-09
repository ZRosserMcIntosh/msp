-- ╔══════════════════════════════════════════════════════════════╗
-- ║  MSP PLATFORM — SEED DATA                                   ║
-- ║  Day-1 onboarding: platform org + founding admin accounts.  ║
-- ║  Idempotent: safe to re-run.                                ║
-- ║                                                             ║
-- ║  ⚠️  PREREQUISITES — run migrations first, in order:        ║
-- ║    001_core_tenancy_rbac_audit.sql                          ║
-- ║    002_devices_inventory.sql                                ║
-- ║    003_tickets.sql                                          ║
-- ║    004_vault_billing.sql                                    ║
-- ║    005_support_schema.sql                                   ║
-- ║    006_intune_schema.sql                                    ║
-- ║    007_directory_schema.sql                                 ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Guard: abort immediately with a clear message if migrations haven't run yet.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organizations'
  ) THEN
    RAISE EXCEPTION
      E'❌  Seed aborted: public.organizations does not exist.\n'
      'Run migrations 001–007 first, then re-run this seed file.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'support'
  ) THEN
    RAISE EXCEPTION
      E'❌  Seed aborted: support schema does not exist.\n'
      'Run migrations 005–007 first, then re-run this seed file.';
  END IF;
END $$;

-- pgcrypto provides crypt() / gen_salt() for bcrypt hashing.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ────────────────────────────────────────────────────────────────
-- 1. Platform organization (the MSP itself)
-- ────────────────────────────────────────────────────────────────
INSERT INTO public.organizations (id, name, slug, is_platform, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'MSP Platform',
  'msp-platform',
  true,
  jsonb_build_object(
    'hq_city', 'Atlanta',
    'hq_state', 'GA',
    'vertical', 'real_estate_brokerage'
  )
)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      is_platform = EXCLUDED.is_platform,
      settings = EXCLUDED.settings;

-- ────────────────────────────────────────────────────────────────
-- 2. Founding admin accounts
--    Password (both): 123456789
--    must_change_password=true forces a reset on first login
--    (enforced by middleware in web/src/middleware.ts).
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  platform_org_id  uuid := '00000000-0000-0000-0000-000000000001';
  hashed_pw        text := crypt('123456789', gen_salt('bf'));
  founders         jsonb := jsonb_build_array(
    jsonb_build_object(
      'id',        '11111111-1111-1111-1111-111111111111',
      'email',     'joshuapoolos@gmail.com',
      'full_name', 'Joshua Poolos',
      'role',      'platform_admin',
      'job_title', 'Co-Founder / Operations',
      'department','Leadership'
    ),
    jsonb_build_object(
      'id',        '22222222-2222-2222-2222-222222222222',
      'email',     'rosserembrasil@gmail.com',
      'full_name', 'Rosser Embrasil',
      'role',      'platform_admin',
      'job_title', 'Co-Founder / Engineering',
      'department','Leadership'
    )
  );
  founder          jsonb;
  user_id          uuid;
BEGIN
  FOR founder IN SELECT * FROM jsonb_array_elements(founders) LOOP
    user_id := (founder->>'id')::uuid;

    -- 2a. auth.users row
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      founder->>'email',
      hashed_pw,
      now(),
      jsonb_build_object(
        'provider',  'email',
        'providers', jsonb_build_array('email')
      ),
      jsonb_build_object(
        'full_name',             founder->>'full_name',
        'must_change_password',  true,
        'job_title',             founder->>'job_title',
        'department',            founder->>'department'
      ),
      now(),
      now(),
      '', '', '', ''
    )
    ON CONFLICT (id) DO UPDATE
      SET encrypted_password = EXCLUDED.encrypted_password,
          email              = EXCLUDED.email,
          raw_user_meta_data = EXCLUDED.raw_user_meta_data,
          updated_at         = now();

    -- 2b. auth.identities row (email provider)
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      user_id,
      founder->>'email',
      jsonb_build_object(
        'sub',            user_id::text,
        'email',          founder->>'email',
        'email_verified', true
      ),
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;

    -- 2c. public.profiles row
    INSERT INTO public.profiles (
      id, org_id, email, full_name, role, is_active, metadata
    )
    VALUES (
      user_id,
      platform_org_id,
      founder->>'email',
      founder->>'full_name',
      founder->>'role',
      true,
      jsonb_build_object(
        'must_change_password', true,
        'job_title',            founder->>'job_title',
        'department',           founder->>'department',
        'seeded_at',            now()
      )
    )
    ON CONFLICT (id) DO UPDATE
      SET org_id    = EXCLUDED.org_id,
          email     = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role      = EXCLUDED.role,
          is_active = true,
          metadata  = public.profiles.metadata || EXCLUDED.metadata;
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. Audit trail for the seed itself
-- ────────────────────────────────────────────────────────────────
INSERT INTO public.audit_events (
  org_id, actor_id, action_type, entity_type, entity_id, after_state, metadata
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'platform.seeded',
  'organization',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('founders', 2, 'force_password_reset', true),
  jsonb_build_object('source', 'supabase/seed.sql')
);

