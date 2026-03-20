import { Suspense } from "react"
import OAuthCallbackPage from "../../../src/app/auth/callback/page"

export default function OAuthCallbackPageEntry() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackPage />
    </Suspense>
  )
}
