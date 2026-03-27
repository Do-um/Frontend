"use client"

import {
  ArrowLeft,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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
    <div className="rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(249,245,236,0.86))] px-4 py-4 shadow-[0_12px_28px_rgba(24,35,45,0.05)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6b59]">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 truncate text-xl font-black tracking-[-0.04em] text-[#18232d]">{value}</p>
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
    <div className="flex flex-col gap-5 rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,252,245,0.96),rgba(244,248,255,0.92))] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d6b59]">Game Screen</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#18232d]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#63727d]">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBackHome}
          className="h-11 rounded-full border-[#d8e4eb] bg-white/80 px-5 text-[#355264] hover:bg-white"
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
        className="min-h-[132px] rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 py-3 text-sm leading-6 text-[#213541]"
      />
      {error ? <p className="text-sm font-semibold text-[#b04646]">{error}</p> : null}
    </div>
  )
}

export function EmptyGameState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 rounded-[28px] border border-dashed border-white/70 bg-white/66 px-5 py-12 text-center">
      <p className="text-2xl font-black tracking-[-0.04em] text-[#18232d]">{title}</p>
      <p className="mt-3 text-sm leading-6 text-[#63727d]">{description}</p>
    </div>
  )
}
