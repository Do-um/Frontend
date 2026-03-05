const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export function getApiBaseUrl() {
  return rawBaseUrl.replace(/\/+$/, "")
}

export function buildApiUrl(path: string) {
  const base = getApiBaseUrl()
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}

type ApiFetchInit = RequestInit & {
  json?: unknown
}

export async function apiFetch(path: string, init: ApiFetchInit = {}) {
  const { json, headers, ...rest } = init
  const url = buildApiUrl(path)
  const nextHeaders: HeadersInit = {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  }

  const response = await fetch(url, {
    ...rest,
    headers: nextHeaders,
    body: json ? JSON.stringify(json) : rest.body,
  })

  return response
}
