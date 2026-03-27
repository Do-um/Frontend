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
    accentClassName: "from-[#f8f1df] via-[#eef4e7] to-[#e6eff7]",
  },
  {
    screen: "bomb_pass",
    title: "폭탄 넘기기",
    description: "제한 시간 안에서 터질 시점이 랜덤으로 정해지는 순환형 내기입니다.",
    eyebrow: "실시간 순서 게임",
    icon: Bomb,
    accentClassName: "from-[#f7e9e5] via-[#f3f2ed] to-[#eaf0f5]",
  },
  {
    screen: "ladder",
    title: "사다리 타기",
    description: "랜덤 가로줄을 따라 내려가 걸림 슬롯에 도착한 사람을 찾습니다.",
    eyebrow: "경로 추적 애니메이션",
    icon: GitBranch,
    accentClassName: "from-[#e6f0e8] via-[#edf5ef] to-[#f4f7f0]",
  },
  {
    screen: "roulette",
    title: "룰렛",
    description: "내장 룰렛을 바로 돌리고 결과를 자동으로 명예의 전당에 누적합니다.",
    eyebrow: "내장형 자동 기록",
    icon: CirclePlay,
    accentClassName: "from-[#dde9f7] via-[#eaf2f6] to-[#f4f7f1]",
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
  ai_excuse: "border-[#e8dcc1] bg-[#fbf5e8] text-[#7a6841]",
  bomb_pass: "border-[#ead7d3] bg-[#faf2ef] text-[#7d5a54]",
  ladder: "border-[#d8e6dc] bg-[#eef5ef] text-[#476755]",
  roulette_manual: "border-[#d4e1ef] bg-[#eef4fb] text-[#4a647d]",
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
