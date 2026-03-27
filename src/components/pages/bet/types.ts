import type { LucideIcon } from "lucide-react"

import type { CaughtMode } from "@/lib/bet-game"

export type BetScreen = "home" | "ai_excuse" | "bomb_pass" | "ladder" | "roulette" | "hall"

export type RecordDialogState = {
  open: boolean
  kind: "result" | "manual"
  title: string
  description: string
  mode: CaughtMode
  defaultName: string
  detail: string
  allowModeChange: boolean
  editableDetail: boolean
}

export type NoticeState = {
  tone: "success" | "error"
  message: string
}

export type RecordDraft = {
  name: string
  mode: CaughtMode
  detail?: string
}

export type ResultPayload = {
  name: string
  mode: Extract<CaughtMode, "ai_excuse" | "bomb_pass" | "ladder">
  detail: string
}

export type GameCardItem = {
  screen: Exclude<BetScreen, "hall">
  title: string
  description: string
  eyebrow: string
  icon: LucideIcon
  accentClassName: string
}
