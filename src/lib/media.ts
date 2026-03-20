import { getSupabaseUrl } from "@/lib/supabase"

export function resolveMediaUrl(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed
  }

  try {
    return new URL(trimmed).toString()
  } catch {
    const supabaseUrl = getSupabaseUrl()
    if (trimmed.startsWith("/storage/")) {
      return supabaseUrl ? `${supabaseUrl}${trimmed}` : trimmed
    }

    return trimmed
  }
}
