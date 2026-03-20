import type { Session, SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js"

import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase"

export const AUTH_STATE_CHANGED_EVENT = "doum-auth-state-changed"

const allowedLoginDomain = normalizeEmailDomain(process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN || "kookmin.ac.kr")

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
  auth_user_id: string | null
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

function getAllowedDomainLabel() {
  return `@${allowedLoginDomain}`
}

function isAllowedLoginEmail(email: string) {
  return email.toLowerCase().endsWith(`@${allowedLoginDomain}`)
}

function resolveInitialRole(email: string): NormalizedUserRole {
  return "OUTSIDER"
}

function dispatchAuthStateChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
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

async function fetchPublicUserByAuthUserId(client: SupabaseClient, authUserId: string) {
  const { data, error } = await client
    .from("users")
    .select("id, auth_user_id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as PublicUserRow | null) ?? null
}

async function fetchPublicUserByEmail(client: SupabaseClient, email: string) {
  const { data, error } = await client
    .from("users")
    .select("id, auth_user_id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .eq("email", email)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data as PublicUserRow | null) ?? null
}

async function insertPublicUser(client: SupabaseClient, authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)
  const { data, error } = await client
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      email,
      name: getDisplayName(authUser),
      profile_image_url: getProfileImageUrl(authUser),
      provider: getProviderName(authUser),
      role: resolveInitialRole(email),
    })
    .select("id, auth_user_id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .single()

  if (error) {
    const fallback = (await fetchPublicUserByAuthUserId(client, authUser.id)) ?? (await fetchPublicUserByEmail(client, email))
    if (fallback) {
      return fallback
    }

    throw new Error(error.message)
  }

  return data as PublicUserRow
}

async function updatePublicUser(client: SupabaseClient, authUser: SupabaseAuthUser, currentUser: PublicUserRow) {
  const nextEmail = getPrimaryEmail(authUser)
  const nextName = getDisplayName(authUser)
  const nextProfileImageUrl = getProfileImageUrl(authUser)
  const nextProvider = getProviderName(authUser)

  if (
    currentUser.auth_user_id === authUser.id &&
    currentUser.email === nextEmail &&
    currentUser.name === nextName &&
    currentUser.profile_image_url === nextProfileImageUrl &&
    currentUser.provider === nextProvider
  ) {
    return currentUser
  }

  const { data, error } = await client
    .from("users")
    .update({
      auth_user_id: authUser.id,
      email: nextEmail,
      name: nextName,
      profile_image_url: nextProfileImageUrl,
      provider: nextProvider,
    })
    .eq("id", currentUser.id)
    .select("id, auth_user_id, email, name, profile_image_url, provider, role, created_at, updated_at")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as PublicUserRow
}

async function ensurePublicUserProfile(authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)

  if (!isAllowedLoginEmail(email)) {
    await signOut()
    throw createRestrictedDomainError()
  }

  const client = getSupabaseBrowserClient()
  const existingUser = (await fetchPublicUserByAuthUserId(client, authUser.id)) ?? (await fetchPublicUserByEmail(client, email))
  const profile = existingUser ? await updatePublicUser(client, authUser, existingUser) : await insertPublicUser(client, authUser)
  return profile
}

export function getStoredAccessToken() {
  return hasSupabaseEnv() ? "supabase-session" : ""
}

export function getStoredRefreshToken() {
  return hasSupabaseEnv() ? "supabase-session" : ""
}

export function storeTokens() {
  dispatchAuthStateChanged()
}

export function clearStoredTokens() {
  dispatchAuthStateChanged()
}

export function getAuthorizationHeaders(): HeadersInit {
  return {}
}

export async function fetchCurrentUser() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.")
  }

  const client = getSupabaseBrowserClient()
  const {
    data: { user: authUser },
    error,
  } = await client.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  if (!authUser) {
    throw new Error("로그인이 필요합니다.")
  }

  return mapPublicUser(await ensurePublicUserProfile(authUser))
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
