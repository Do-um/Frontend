import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getServerAuthenticatedUser } from "@/lib/server-auth"
import LoginPage from "../../src/app/login/page"

export default async function LoginPageEntry() {
  const user = await getServerAuthenticatedUser()

  if (user) {
    redirect("/")
  }

  // app/login 경로에서 실제 로그인 UI 컴포넌트를 렌더링하는 진입점입니다.
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
