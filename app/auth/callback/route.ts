import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase"
import { syncServerAuthenticatedUser } from "@/lib/server-auth"

type CookieToSet = {
  name: string
  value: string
  options?: Record<string, unknown>
}

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}

function buildLoginRedirect(requestUrl: URL, errorCode: string, nextPath: string) {
  const target = new URL("/login", requestUrl.origin)
  target.searchParams.set("error", errorCode)

  if (nextPath !== "/") {
    target.searchParams.set("next", nextPath)
  }

  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"))

  if (!hasSupabaseEnv()) {
    return buildLoginRedirect(requestUrl, "supabase_env", nextPath)
  }

  if (error || errorDescription) {
    return buildLoginRedirect(requestUrl, error || errorDescription || "oauth_error", nextPath)
  }

  if (!code) {
    return buildLoginRedirect(requestUrl, "missing_code", nextPath)
  }

  const cookieStore = await cookies()
  let response = NextResponse.redirect(new URL(nextPath, requestUrl.origin))
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return buildLoginRedirect(requestUrl, "oauth_error", nextPath)
  }

  const {
    data: { user: authUser },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !authUser) {
    return buildLoginRedirect(requestUrl, "oauth_error", nextPath)
  }

  let profile = null

  try {
    profile = await syncServerAuthenticatedUser(supabase, authUser)
  } catch {
    return buildLoginRedirect(requestUrl, "profile_sync_error", nextPath)
  }

  if (!profile) {
    await supabase.auth.signOut()
    return buildLoginRedirect(requestUrl, "restricted_domain", nextPath)
  }

  return response
}
