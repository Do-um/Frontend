"use client"

import {
  ArrowLeft,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export const BET_PANEL_CLASS =
  "rounded-[28px] border border-white/80 bg-white/85 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm"
export const BET_TINTED_PANEL_CLASS =
  "rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(234,243,248,0.84))] shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm"
export const BET_SUBTLE_PANEL_CLASS =
  "rounded-[24px] border border-[#d7e5ee] bg-white/82 shadow-[0_10px_24px_rgba(47,74,91,0.06)]"

export function HeroStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_14px_30px_rgba(37,74,91,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8590]">
            <Icon className="size-3.5" />
            {label}
          </div>
          <p className="mt-3 truncate text-xl font-black tracking-[-0.04em] text-[#1d2a34]">{value}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef6fb] text-[#44657b] shadow-sm">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  )
}

export function ScreenHeader({
  title,
  description,
  onBackHome,
}: {
  title: string
  description: string
  onBackHome: () => void
}) {
  return (
    <div className={cn(BET_TINTED_PANEL_CLASS, "flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7d88]">Game Screen</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#15212b]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#677680]">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBackHome}
          className="h-11 rounded-full border-[#d7e5ee] bg-white/80 px-5 text-[#355264] shadow-sm hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          홈으로
        </Button>
      </div>
    </div>
  )
}

export function SharedNamesInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#243440]">이름 목록</label>
        <span className="text-xs font-semibold text-[#6b7c86]">쉼표 또는 줄바꿈, 최대 12명</span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"예시\n민수, 지연, 태호\n또는 줄바꿈으로 한 명씩"}
        className="min-h-[132px] rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 py-3 text-sm leading-6 text-[#213541] shadow-[0_8px_20px_rgba(47,74,91,0.04)]"
      />
      {error ? <p className="text-sm font-semibold text-[#b04646]">{error}</p> : null}
    </div>
  )
}

export function EmptyGameState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-8 rounded-[28px] border border-[#dbe6eb] bg-white/82 px-5 py-12 text-center shadow-[0_12px_28px_rgba(47,74,91,0.05)]">
      <p className="text-2xl font-black tracking-tight text-[#1d2a34]">{title}</p>
      <p className="mt-3 text-sm leading-6 text-[#677680]">{description}</p>
    </div>
  )
}
