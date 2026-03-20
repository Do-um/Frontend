import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const rawSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ""
const DEFAULT_SUPABASE_STORAGE_BUCKET = "images"
const rawSupabaseStorageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_SUPABASE_STORAGE_BUCKET

let browserClient: SupabaseClient | null = null

export function getSupabaseUrl() {
  return rawSupabaseUrl.trim().replace(/\/+$/, "")
}

export function getSupabaseAnonKey() {
  return rawSupabaseAnonKey.trim()
}

export function getSupabaseStorageBucket() {
  return rawSupabaseStorageBucket.trim() || DEFAULT_SUPABASE_STORAGE_BUCKET
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

export function getSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.")
  }

  if (!browserClient) {
    browserClient = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: true,
        flowType: "pkce",
        persistSession: true,
      },
    })
  }

  return browserClient
}
