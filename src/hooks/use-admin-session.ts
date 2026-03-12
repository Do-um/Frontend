"use client"

import { useEffect, useState } from "react"

import { fetchCurrentUser, getStoredAccessToken, type AuthenticatedUser } from "@/lib/auth"

export function useAdminSession() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshSession() {
    const token = getStoredAccessToken()

    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const profile = await fetchCurrentUser(token)
      setUser(profile)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshSession()
  }, [])

  return {
    user,
    loading,
    isLoggedIn: Boolean(user),
    isAdmin: user?.role === "ADMIN",
    refreshSession,
  }
}
