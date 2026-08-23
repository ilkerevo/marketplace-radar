import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

/**
 * Service-role client — RLS'i bypass eder.
 * SADECE trusted server context'lerde (webhook/callback route handler) kullan.
 * Client component'e veya normal server action'a asla taşıma.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
