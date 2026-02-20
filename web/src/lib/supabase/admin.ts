// ═══════════════════════════════════════════════════════════
//  Supabase Admin Client — Service Role (server-only)
//  Used for: audit logging, cross-tenant ops, webhooks
//  NEVER expose this to client-side code
// ═══════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
