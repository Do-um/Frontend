const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export function getApiBaseUrl() {
  return rawBaseUrl.replace(/\/+$/, "")
}

export function hasApiBaseUrl() {
  return Boolean(getApiBaseUrl())
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

export type ApiErrorPayload = {
  code: string
  message: string
}

export type ApiEnvelope<T> = {
  data: T
  success: boolean
  error: ApiErrorPayload | null
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

export async function apiFetchData<T>(path: string, init: ApiFetchInit = {}) {
  const response = await apiFetch(path, init)

  let payload: ApiEnvelope<T> | null = null
  try {
    payload = (await response.json()) as ApiEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}`)
  }

  return payload.data
}
