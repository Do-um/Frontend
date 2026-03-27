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
    return "border-[#ffd66b] bg-[linear-gradient(135deg,rgba(255,237,176,0.95),rgba(255,204,102,0.75))]"
  }

  if (rank === 1) {
    return "border-[#d9dfe7] bg-[linear-gradient(135deg,rgba(241,245,249,0.96),rgba(212,222,233,0.75))]"
  }

  if (rank === 2) {
    return "border-[#e8c1a0] bg-[linear-gradient(135deg,rgba(255,234,222,0.94),rgba(229,183,140,0.75))]"
  }

  return "border-black/8 bg-white/84"
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
