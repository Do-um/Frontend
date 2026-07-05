import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { LoginForm } from "@/components/login-form"
import { getServerAuthenticatedUser } from "@/lib/server-auth"

export const metadata: Metadata = {
  title: "Do,um - Login",
  description: "Login page for Do,um",
}

export default async function LoginPage() {
  const user = await getServerAuthenticatedUser()

  if (user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
