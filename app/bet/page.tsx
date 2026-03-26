import type { Metadata } from "next"

import { BetPage } from "@/components/pages/bet-page"

export const metadata: Metadata = {
  title: "Do,um - 내기",
  description: "두음 회원 전용 랜덤 당첨 게임과 명예의 전당",
}

export default function BetRoutePage() {
  return <BetPage />
}
