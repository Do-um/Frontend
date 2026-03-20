import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const rawSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
const rawSupabaseStorageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || ""

let browserClient: SupabaseClient | null = null

export function getSupabaseUrl() {
  return rawSupabaseUrl.trim().replace(/\/+$/, "")
}

export function getSupabaseAnonKey() {
  return rawSupabaseAnonKey.trim()
}

export function getSupabaseStorageBucket() {
  return rawSupabaseStorageBucket.trim()
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.")
  }

  if (!browserClient) {
    browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return browserClient
}
