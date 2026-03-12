import { apiFetchData } from "@/lib/api"

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export type AuthenticatedUser = {
  id: number
  email: string
  name: string
  profileImageUrl: string | null
  role: string
  createdAt: string
  updatedAt: string
}

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return ""
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY) || ""
}

export function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return ""
  }

  return localStorage.getItem(REFRESH_TOKEN_KEY) || ""
}

export function storeTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearStoredTokens() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAuthorizationHeaders(token = getStoredAccessToken()): HeadersInit {
  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchCurrentUser(token = getStoredAccessToken()) {
  if (!token) {
    throw new Error("로그인이 필요합니다.")
  }

  return apiFetchData<AuthenticatedUser>("/api/users/me", {
    headers: getAuthorizationHeaders(token),
  })
}
