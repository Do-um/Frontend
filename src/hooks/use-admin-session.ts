"use client"

import { useEffect, useState } from "react"

import {
  AUTH_STATE_CHANGED_EVENT,
  fetchCurrentUser,
  normalizeUserRole,
  subscribeToAuthChanges,
  type AuthenticatedUser,
} from "@/lib/auth"
import { hasSupabaseEnv } from "@/lib/supabase"

export function useAdminSession() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshSession() {
    if (!hasSupabaseEnv()) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const profile = await fetchCurrentUser()
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshSession()

    const unsubscribe = subscribeToAuthChanges(() => {
      void refreshSession()
    })

    function handleAuthStateChanged() {
      void refreshSession()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSession()
      }
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      unsubscribe()
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const role = normalizeUserRole(user?.role)

  return {
    user,
    role,
    loading,
    isLoggedIn: Boolean(user),
    isAdmin: role === "ADMIN",
    isDoumMember: role === "ADMIN" || role === "DOUM_MEMBER",
    isOutsider: role === "OUTSIDER",
    refreshSession,
  }
}
