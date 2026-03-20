import { Suspense } from "react"
import Home from "../src/app/page"

export default function HomePageEntry() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
