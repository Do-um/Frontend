"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { exchangeCodeForSessionIfPresent, fetchCurrentUser, getAuthErrorAllowedDomain, getAuthErrorCode } from "@/lib/auth"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")

  const nextPath = useMemo(() => {
    const value = searchParams.get("next") || "/"
    return value.startsWith("/") ? value : "/"
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
      return await new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error("oauth_timeout"))
        }, timeoutMs)

        promise.then(
          (value) => {
            window.clearTimeout(timeoutId)
            resolve(value)
          },
          (error) => {
            window.clearTimeout(timeoutId)
            reject(error)
          },
        )
      })
    }

    async function handleCallback() {
      const errorCode = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const authCode = searchParams.get("code")

      if (errorCode || errorDescription) {
        if (!cancelled) {
          setStatus("error")
          router.replace(`/login?error=${encodeURIComponent(errorCode || errorDescription || "oauth_error")}`)
        }
        return
      }

      try {
        await withTimeout(
          (async () => {
            await exchangeCodeForSessionIfPresent(authCode)
            await fetchCurrentUser()
          })(),
          15000,
        )

        if (cancelled) {
          return
        }

        setStatus("success")
        router.replace(nextPath)
      } catch (error) {
        console.error(error)

        if (cancelled) {
          return
        }

        const target = new URL("/login", window.location.origin)
        const code = getAuthErrorCode(error) || "oauth_error"
        target.searchParams.set("error", code)

        if (code === "restricted_domain") {
          target.searchParams.set("allowedDomain", getAuthErrorAllowedDomain(error))
        }

        setStatus("error")
        router.replace(`${target.pathname}${target.search}`)
      }
    }

    void handleCallback()

    return () => {
      cancelled = true
    }
  }, [nextPath, router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">OAuth 로그인 처리</h1>
        {status === "processing" && (
          <p className="mt-4 text-sm text-muted-foreground">Supabase 세션을 확인하고 있습니다...</p>
        )}
        {status === "success" && (
          <p className="mt-4 text-sm text-muted-foreground">로그인 성공. 잠시 후 이동합니다.</p>
        )}
        {status === "error" && (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>로그인 정보를 확인할 수 없습니다.</p>
            <p>다시 로그인해 주세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}
