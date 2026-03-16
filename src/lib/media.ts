import { getApiBaseUrl } from "@/lib/api"

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
    const baseUrl = getApiBaseUrl()
    if (!baseUrl) {
      return trimmed
    }

    if (trimmed.startsWith("/")) {
      return `${baseUrl}${trimmed}`
    }

    return `${baseUrl}/${trimmed.replace(/^\/+/, "")}`
  }
}
