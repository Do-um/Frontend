import type { Session, User as SupabaseAuthUser } from "@supabase/supabase-js"

import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase"

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const PUBLIC_USER_ID_KEY = "doum_public_user_id"
export const AUTH_STATE_CHANGED_EVENT = "doum-auth-state-changed"

const allowedLoginDomain = normalizeEmailDomain(process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN || "kookmin.ac.kr")
const adminEmails = new Set(parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS))
const doumMemberEmails = new Set(parseEmailList(process.env.NEXT_PUBLIC_DOUM_MEMBER_EMAILS))

export type NormalizedUserRole = "ADMIN" | "DOUM_MEMBER" | "OUTSIDER"

export type AuthenticatedUser = {
  id: number
  email: string
  name: string
  profileImageUrl: string | null
  role: string
  createdAt: string
  updatedAt: string
}

type PublicUserRow = {
  id: number
  email: string
  name: string
  profile_image_url: string | null
  provider: string
  role: string
  created_at: string
  updated_at: string
}

type AuthMetadataError = Error & {
  allowedDomain?: string
  code?: string
}

export function normalizeUserRole(role: string | null | undefined): NormalizedUserRole {
  if (role === "ADMIN") {
    return "ADMIN"
  }

  if (role === "DOUM_MEMBER" || role === "MEMBER" || role === "STAFF") {
    return "DOUM_MEMBER"
  }

  return "OUTSIDER"
}

function normalizeEmailDomain(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase()
}

function parseEmailList(rawValue: string | undefined) {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(/[\s,;]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function getAllowedDomainLabel() {
  return `@${allowedLoginDomain}`
}

function isAllowedLoginEmail(email: string) {
  return email.toLowerCase().endsWith(`@${allowedLoginDomain}`)
}

function resolveInitialRole(email: string): NormalizedUserRole {
  const normalizedEmail = email.trim().toLowerCase()

  if (adminEmails.has(normalizedEmail)) {
    return "ADMIN"
  }

  if (doumMemberEmails.has(normalizedEmail)) {
    return "DOUM_MEMBER"
  }

  return "OUTSIDER"
}

function dispatchAuthStateChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
}

function updateStoredTokens(session: Session | null) {
  if (typeof window === "undefined") {
    return
  }

  if (!session) {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    return
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token)

  if (session.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

function setStoredPublicUserId(userId: number | null) {
  if (typeof window === "undefined") {
    return
  }

  if (userId === null) {
    localStorage.removeItem(PUBLIC_USER_ID_KEY)
    return
  }

  localStorage.setItem(PUBLIC_USER_ID_KEY, String(userId))
}

function createRestrictedDomainError() {
  const error = new Error(`국민대학교 Google 계정(${getAllowedDomainLabel()})만 로그인할 수 있습니다.`) as AuthMetadataError
  error.code = "restricted_domain"
  error.allowedDomain = getAllowedDomainLabel()
  return error
}

function getPrimaryEmail(authUser: SupabaseAuthUser) {
  const email = authUser.email?.trim().toLowerCase()

  if (!email) {
    throw new Error("이메일 정보를 확인할 수 없습니다.")
  }

  return email
}

function getDisplayName(authUser: SupabaseAuthUser) {
  const fullName = authUser.user_metadata?.full_name
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim()
  }

  const name = authUser.user_metadata?.name
  if (typeof name === "string" && name.trim()) {
    return name.trim()
  }

  const nickname = authUser.user_metadata?.user_name
  if (typeof nickname === "string" && nickname.trim()) {
    return nickname.trim()
  }

  return getPrimaryEmail(authUser).split("@")[0]
}

function getProfileImageUrl(authUser: SupabaseAuthUser) {
  const avatarUrl = authUser.user_metadata?.avatar_url
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim()
  }

  const picture = authUser.user_metadata?.picture
  if (typeof picture === "string" && picture.trim()) {
    return picture.trim()
  }

  return null
}

function getProviderName(authUser: SupabaseAuthUser) {
  const provider = authUser.app_metadata?.provider
  if (typeof provider === "string" && provider.trim()) {
    return provider.trim()
  }

  return "google"
}

function mapPublicUser(row: PublicUserRow): AuthenticatedUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    profileImageUrl: row.profile_image_url,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function fetchPublicUserByEmail(email: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from("users")
    .select("id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as PublicUserRow | null) ?? null
}

async function insertPublicUser(authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)
  const { data, error } = await getSupabaseBrowserClient()
    .from("users")
    .insert({
      email,
      name: getDisplayName(authUser),
      profile_image_url: getProfileImageUrl(authUser),
      provider: getProviderName(authUser),
      role: resolveInitialRole(email),
    })
    .select("id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .single()

  if (error) {
    const fallback = await fetchPublicUserByEmail(email)
    if (fallback) {
      return fallback
    }

    throw new Error(error.message)
  }

  return data as PublicUserRow
}

async function updatePublicUser(authUser: SupabaseAuthUser, currentUser: PublicUserRow) {
  const nextName = getDisplayName(authUser)
  const nextProfileImageUrl = getProfileImageUrl(authUser)
  const nextProvider = getProviderName(authUser)

  if (
    currentUser.name === nextName &&
    currentUser.profile_image_url === nextProfileImageUrl &&
    currentUser.provider === nextProvider
  ) {
    return currentUser
  }

  const { data, error } = await getSupabaseBrowserClient()
    .from("users")
    .update({
      name: nextName,
      profile_image_url: nextProfileImageUrl,
      provider: nextProvider,
    })
    .eq("id", currentUser.id)
    .select("id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PublicUserRow
}

async function ensurePublicUserProfile(authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)

  if (!isAllowedLoginEmail(email)) {
    if (hasSupabaseEnv()) {
      await getSupabaseBrowserClient().auth.signOut()
    }

    clearStoredTokens()
    throw createRestrictedDomainError()
  }

  const existingUser = await fetchPublicUserByEmail(email)
  const profile = existingUser ? await updatePublicUser(authUser, existingUser) : await insertPublicUser(authUser)
  setStoredPublicUserId(profile.id)
  return profile
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
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
}

export function clearStoredTokens() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(PUBLIC_USER_ID_KEY)
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
}

export function getAuthorizationHeaders(token = getStoredAccessToken()): HeadersInit {
  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function restoreSupabaseSession() {
  if (!hasSupabaseEnv()) {
    return null
  }

  const { data, error } = await getSupabaseBrowserClient().auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  updateStoredTokens(data.session)
  return data.session
}

export async function exchangeCodeForSessionIfPresent(code: string | null) {
  if (!hasSupabaseEnv()) {
    return null
  }

  const client = getSupabaseBrowserClient()
  const { data: existingSessionData, error: existingSessionError } = await client.auth.getSession()

  if (existingSessionError) {
    throw new Error(existingSessionError.message)
  }

  if (existingSessionData.session) {
    updateStoredTokens(existingSessionData.session)
    return existingSessionData.session
  }

  if (!code) {
    return null
  }

  const { data, error } = await client.auth.exchangeCodeForSession(code)

  if (error) {
    throw new Error(error.message)
  }

  updateStoredTokens(data.session)
  return data.session
}

export async function fetchCurrentUser() {
  const session = await restoreSupabaseSession()

  if (!session?.user) {
    setStoredPublicUserId(null)
    throw new Error("로그인이 필요합니다.")
  }

  return mapPublicUser(await ensurePublicUserProfile(session.user))
}

export async function requireAdminUser() {
  const profile = await fetchCurrentUser()

  if (normalizeUserRole(profile.role) !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.")
  }

  return profile
}

export async function requireRentalUser() {
  const profile = await fetchCurrentUser()
  const role = normalizeUserRole(profile.role)

  if (role !== "ADMIN" && role !== "DOUM_MEMBER") {
    throw new Error("대여와 반납은 어드민 및 두음 회원만 사용할 수 있습니다.")
  }

  return profile
}

export async function signInWithGoogle(nextPath = "/") {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.")
  }

  if (typeof window === "undefined") {
    return
  }

  const redirectUrl = new URL("/auth/callback", window.location.origin)
  if (nextPath && nextPath !== "/") {
    redirectUrl.searchParams.set("next", nextPath)
  }

  const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      scopes: "openid email profile https://www.googleapis.com/auth/userinfo.email",
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const { error } = await getSupabaseBrowserClient().auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  clearStoredTokens()
}

export function subscribeToAuthChanges(onChange?: (session: Session | null) => void) {
  if (!hasSupabaseEnv()) {
    return () => {}
  }

  const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
    updateStoredTokens(session)

    if (!session) {
      setStoredPublicUserId(null)
    }

    dispatchAuthStateChanged()
    onChange?.(session)
  })

  return () => {
    data.subscription.unsubscribe()
  }
}

export function getAuthErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return ""
  }

  const code = (error as AuthMetadataError).code
  return typeof code === "string" ? code : ""
}

export function getAuthErrorAllowedDomain(error: unknown) {
  if (typeof error !== "object" || error === null || !("allowedDomain" in error)) {
    return getAllowedDomainLabel()
  }

  const allowedDomain = (error as AuthMetadataError).allowedDomain
  return typeof allowedDomain === "string" && allowedDomain ? allowedDomain : getAllowedDomainLabel()
}
