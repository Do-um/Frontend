import { NextResponse, type NextRequest } from "next/server"

import { hasSupabaseEnv } from "@/lib/supabase"
import { getSupabaseMiddlewareClient } from "@/lib/supabase-server"

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (!hasSupabaseEnv()) {
    return response
  }

  const supabase = getSupabaseMiddlewareClient(request, response)
  await supabase.auth.getClaims()

  return response
}
