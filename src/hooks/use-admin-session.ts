"use client"

import { useEffect, useState } from "react"

import {
  AUTH_STATE_CHANGED_EVENT,
  fetchCurrentUser,
  getStoredAccessToken,
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

    const token = getStoredAccessToken()
    if (!token) {
      setUser(null)
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

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === "access_token" || event.key === "refresh_token") {
        void refreshSession()
      }
    }

    window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
    window.addEventListener("storage", handleStorage)

    return () => {
      unsubscribe()
      window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged)
      window.removeEventListener("storage", handleStorage)
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
