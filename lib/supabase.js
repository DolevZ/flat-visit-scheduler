import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/config";

let supabase;

export function getSupabaseAdmin() {
  if (!supabase) {
    supabase = createClient(
      getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return supabase;
}
