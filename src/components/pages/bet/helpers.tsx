import { Crown, Medal } from "lucide-react"

import { CAUGHT_MODE_LABELS, type CaughtMode, type LeaderboardEntry } from "@/lib/bet-game"

import { MODE_SHORT_LABELS } from "./constants"

export function pickRandomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatModeSummary(counts: LeaderboardEntry["perModeCounts"]) {
  return (Object.keys(CAUGHT_MODE_LABELS) as CaughtMode[])
    .filter((mode) => counts[mode] > 0)
    .map((mode) => `${MODE_SHORT_LABELS[mode]} ${counts[mode]}`)
    .join(" / ")
}

export function formatElapsedSeconds(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}초`
}

export function getRankAccent(rank: number) {
  if (rank === 0) {
    return "border-[#e7dcc0] bg-[linear-gradient(135deg,rgba(249,242,224,0.96),rgba(255,255,255,0.86))]"
  }

  if (rank === 1) {
    return "border-[#d7e5ee] bg-[linear-gradient(135deg,rgba(238,244,249,0.96),rgba(255,255,255,0.86))]"
  }

  if (rank === 2) {
    return "border-[#e4dbd2] bg-[linear-gradient(135deg,rgba(245,239,232,0.94),rgba(255,255,255,0.86))]"
  }

  return "border-white/80 bg-white/84"
}

export function getRankIcon(rank: number) {
  if (rank === 0) {
    return <Crown className="size-4" />
  }

  if (rank === 1 || rank === 2) {
    return <Medal className="size-4" />
  }

  return null
}
