"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { storeTokens } from "@/lib/auth"

function pickToken(params: URLSearchParams) {
  return (
    params.get("access_token") ||
    params.get("accessToken") ||
    params.get("token") ||
    params.get("jwt") ||
    ""
  )
}

function pickRefreshToken(params: URLSearchParams) {
  return params.get("refresh_token") || params.get("refreshToken") || ""
}

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")

  const nextPath = useMemo(() => {
    return searchParams.get("next") || "/"
  }, [searchParams])

  useEffect(() => {
    if (!searchParams) {
      return
    }

    const token = pickToken(searchParams)
    const refreshToken = pickRefreshToken(searchParams)
    const error = searchParams.get("error") || searchParams.get("error_description")

    if (error) {
      setStatus("error")
      return
    }

    if (!token) {
      setStatus("error")
      return
    }

    try {
      storeTokens(token, refreshToken)
      setStatus("success")
      router.replace(nextPath)
    } catch (err) {
      console.error(err)
      setStatus("error")
    }
  }, [router, nextPath, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">OAuth 로그인 처리</h1>
        {status === "processing" && (
          <p className="mt-4 text-sm text-muted-foreground">로그인 정보를 확인하고 있습니다...</p>
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
