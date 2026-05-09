// ═══════════════════════════════════════════════════════════
//  Supabase Client — Browser (Client Components)
//  Usage: import { supabase } from '@/lib/supabase/client'
// ═══════════════════════════════════════════════════════════

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Supports both the legacy `ANON_KEY` and the new `PUBLISHABLE_KEY` naming.
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );
}
