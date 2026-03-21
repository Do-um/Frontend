"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  AUTH_STATE_CHANGED_EVENT,
  fetchCurrentUser,
  normalizeUserRole,
  subscribeToAuthChanges,
  type AuthenticatedUser,
} from "@/lib/auth"
import { hasSupabaseEnv } from "@/lib/supabase"

type AdminSessionState = {
  user: AuthenticatedUser | null
  loading: boolean
  initialized: boolean
}

const listeners = new Set<() => void>()
let sessionState: AdminSessionState = {
  user: null,
  loading: true,
  initialized: false,
}
let refreshPromise: Promise<void> | null = null
let lifecycleInitialized = false

function emitSessionChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return sessionState
}

async function refreshSessionState(showLoading = !sessionState.initialized) {
  if (!hasSupabaseEnv()) {
    sessionState = {
      user: null,
      loading: false,
      initialized: true,
    }
    emitSessionChange()
    return
  }

  if (refreshPromise) {
    return refreshPromise
  }

  if (showLoading) {
    sessionState = {
      ...sessionState,
      loading: true,
    }
    emitSessionChange()
  }

  refreshPromise = (async () => {
    try {
      const profile = await fetchCurrentUser()
      sessionState = {
        user: profile,
        loading: false,
        initialized: true,
      }
    } catch {
      sessionState = {
        user: null,
        loading: false,
        initialized: true,
      }
    } finally {
      refreshPromise = null
      emitSessionChange()
    }
  })()

  return refreshPromise
}

function initializeSessionLifecycle() {
  if (typeof window === "undefined" || lifecycleInitialized) {
    return
  }

  lifecycleInitialized = true
  void refreshSessionState(!sessionState.initialized)

  subscribeToAuthChanges(() => {
    void refreshSessionState(false)
  })

  window.addEventListener(AUTH_STATE_CHANGED_EVENT, () => {
    void refreshSessionState(false)
  })

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshSessionState(false)
    }
  })
}

export function useAdminSession() {
  const { user, loading } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    initializeSessionLifecycle()
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
    refreshSession: () => refreshSessionState(false),
  }
}
