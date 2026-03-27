import { Bomb, CirclePlay, GitBranch, Sparkles } from "lucide-react"

import type { CaughtMode } from "@/lib/bet-game"

import type { GameCardItem, RecordDialogState } from "./types"

export const GAME_CARDS: GameCardItem[] = [
  {
    screen: "ai_excuse",
    title: "AI 핑계 당첨",
    description: "미리 준비된 드립 템플릿으로 한 명을 재밌게 지목합니다.",
    eyebrow: "API 없는 랜덤 핑계",
    icon: Sparkles,
    accentClassName: "from-[#ffe3b0] via-[#ffd28c] to-[#ffb86b]",
  },
  {
    screen: "bomb_pass",
    title: "폭탄 넘기기",
    description: "제한 시간 안에서 터질 시점이 랜덤으로 정해지는 순환형 내기입니다.",
    eyebrow: "실시간 순서 게임",
    icon: Bomb,
    accentClassName: "from-[#ffc3c3] via-[#ff9d8d] to-[#ff6f61]",
  },
  {
    screen: "ladder",
    title: "사다리 타기",
    description: "랜덤 가로줄을 따라 내려가 걸림 슬롯에 도착한 사람을 찾습니다.",
    eyebrow: "경로 추적 애니메이션",
    icon: GitBranch,
    accentClassName: "from-[#c5f0d0] via-[#a8e7ca] to-[#6fd1b3]",
  },
  {
    screen: "roulette",
    title: "룰렛",
    description: "내장 룰렛을 바로 돌리고 결과를 자동으로 명예의 전당에 누적합니다.",
    eyebrow: "내장형 자동 기록",
    icon: CirclePlay,
    accentClassName: "from-[#cbe2ff] via-[#9fc7ff] to-[#70a8ff]",
  },
]

export const MODE_SHORT_LABELS: Record<CaughtMode, string> = {
  ai_excuse: "AI",
  bomb_pass: "폭탄",
  ladder: "사다리",
  roulette_manual: "룰렛",
  manual: "수동",
}

export const MODE_BADGE_CLASSNAMES: Record<CaughtMode, string> = {
  ai_excuse: "border-[#ffd8a8] bg-[#fff5e8] text-[#8b5a15]",
  bomb_pass: "border-[#ffc9c9] bg-[#fff1f1] text-[#9a3f3f]",
  ladder: "border-[#bee5cf] bg-[#eefaf1] text-[#20684b]",
  roulette_manual: "border-[#c7d9ff] bg-[#f0f5ff] text-[#3157a8]",
  manual: "border-[#d6d9dd] bg-[#f6f7f8] text-[#4b5563]",
}

export const LADDER_TRACE_COLORS = [
  "#ff8f66",
  "#3ea1ff",
  "#00b894",
  "#f7b731",
  "#8c7ae6",
  "#ff5f91",
  "#2dce89",
  "#ff7f50",
  "#45aaf2",
  "#9b59b6",
  "#ffb347",
  "#00c4cc",
] as const

export const EMPTY_RECORD_DIALOG_STATE: RecordDialogState = {
  open: false,
  kind: "manual",
  title: "",
  description: "",
  mode: "manual",
  defaultName: "",
  detail: "",
  allowModeChange: true,
  editableDetail: true,
}
