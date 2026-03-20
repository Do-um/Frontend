import { redirect } from "next/navigation"
import type { User as SupabaseAuthUser } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import { hasSupabaseEnv } from "@/lib/supabase"
import { getSupabaseServerClient } from "@/lib/supabase-server"

type ServerUserRole = "ADMIN" | "DOUM_MEMBER" | "OUTSIDER"

export type ServerAuthenticatedUser = {
  id: number
  email: string
  role: ServerUserRole
  isAdmin: boolean
  isDoumMember: boolean
}

type ServerPublicUserRow = {
  id: number
  auth_user_id: string | null
  email: string
  name: string
  profile_image_url: string | null
  provider: string
  role: string
}

const allowedLoginDomain = normalizeEmailDomain(
  process.env.ALLOWED_LOGIN_DOMAIN || process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAIN || "kookmin.ac.kr",
)
const adminEmails = new Set(parseEmailList(process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS))
const doumMemberEmails = new Set(parseEmailList(process.env.DOUM_MEMBER_EMAILS || process.env.NEXT_PUBLIC_DOUM_MEMBER_EMAILS))

function normalizeUserRole(role: string | null | undefined): ServerUserRole {
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

function getPrimaryEmail(authUser: SupabaseAuthUser) {
  const email = authUser.email?.trim().toLowerCase()

  if (!email) {
    throw new Error("이메일 정보를 확인할 수 없습니다.")
  }

  return email
}

function isAllowedLoginEmail(email: string) {
  return email.endsWith(`@${allowedLoginDomain}`)
}

function resolveInitialRole(email: string): ServerUserRole {
  if (adminEmails.has(email)) {
    return "ADMIN"
  }

  if (doumMemberEmails.has(email)) {
    return "DOUM_MEMBER"
  }

  return "OUTSIDER"
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

async function fetchPublicUser(supabase: SupabaseClient, authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)
  const { data: byAuthId, error: byAuthIdError } = await supabase
    .from("users")
    .select("id, auth_user_id, email, name, profile_image_url, provider, role")
    .eq("auth_user_id", authUser.id)
    .maybeSingle()

  if (byAuthIdError) {
    throw new Error(byAuthIdError.message)
  }

  if (byAuthId) {
    return byAuthId as ServerPublicUserRow
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from("users")
    .select("id, auth_user_id, email, name, profile_image_url, provider, role")
    .eq("email", email)
    .maybeSingle()

  if (byEmailError) {
    throw new Error(byEmailError.message)
  }

  return (byEmail as ServerPublicUserRow | null) ?? null
}

async function ensureServerPublicUser(supabase: SupabaseClient, authUser: SupabaseAuthUser) {
  const email = getPrimaryEmail(authUser)

  if (!isAllowedLoginEmail(email)) {
    return null
  }

  const existing = await fetchPublicUser(supabase, authUser)

  if (!existing) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUser.id,
        email,
        name: getDisplayName(authUser),
        profile_image_url: getProfileImageUrl(authUser),
        provider: getProviderName(authUser),
        role: resolveInitialRole(email),
      })
      .select("id, auth_user_id, email, name, profile_image_url, provider, role")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data as ServerPublicUserRow
  }

  const nextName = getDisplayName(authUser)
  const nextProfileImageUrl = getProfileImageUrl(authUser)
  const nextProvider = getProviderName(authUser)

  if (
    existing.auth_user_id === authUser.id &&
    existing.email === email &&
    existing.name === nextName &&
    existing.profile_image_url === nextProfileImageUrl &&
    existing.provider === nextProvider
  ) {
    return existing
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      auth_user_id: authUser.id,
      email,
      name: nextName,
      profile_image_url: nextProfileImageUrl,
      provider: nextProvider,
    })
    .eq("id", existing.id)
    .select("id, auth_user_id, email, name, profile_image_url, provider, role")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ServerPublicUserRow
}

export async function syncServerAuthenticatedUser(supabase: SupabaseClient, authUser: SupabaseAuthUser) {
  const profile = await ensureServerPublicUser(supabase, authUser)

  if (!profile) {
    return null
  }

  const role = normalizeUserRole(profile.role)

  return {
    id: profile.id,
    email: profile.email,
    role,
    isAdmin: role === "ADMIN",
    isDoumMember: role === "ADMIN" || role === "DOUM_MEMBER",
  } satisfies ServerAuthenticatedUser
}

export async function getServerAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return null
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authUser) {
    return null
  }

  return await syncServerAuthenticatedUser(supabase, authUser)
}

export async function requireServerAuthenticatedUser(nextPath = "/") {
  const user = await getServerAuthenticatedUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }

  return user
}

export async function requireServerAdminUser(nextPath = "/admin/users") {
  const user = await requireServerAuthenticatedUser(nextPath)

  if (!user.isAdmin) {
    redirect("/")
  }

  return user
}
