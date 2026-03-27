"use client"

import {
  ExternalLink,
  History,
  Target,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { GAME_CARDS } from "./constants"
import type { BetScreen, GameCardItem } from "./types"

export function HomeScreen({
  leaderName,
  storageDescription,
  totalRecords,
  uniqueCaughtCount,
  onSelectScreen,
}: {
  leaderName: string
  storageDescription: string
  totalRecords: number
  uniqueCaughtCount: number
  onSelectScreen: (screen: BetScreen) => void
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(234,243,248,0.84))] px-5 py-5 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/82 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a7d88] shadow-sm">
              <Target className="size-4" />
              Single PC Random Game
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#15212b]">오늘은 누가 걸릴까?</h2>
            <p className="mt-3 text-sm leading-6 text-[#677680]">
              이름은 쉼표나 줄바꿈으로 입력합니다. AI, 폭탄, 사다리는 결과 확인 뒤 저장하고, 룰렛은 스핀이 끝나면
              자동으로 명예의 전당에 반영됩니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="현재 선두" value={leaderName} />
            <MiniStat label="누적 기록" value={`${totalRecords}회`} />
            <MiniStat label="걸린 인원" value={`${uniqueCaughtCount}명`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {GAME_CARDS.map((item) => (
          <GameEntryCard key={item.screen} item={item} onClick={() => onSelectScreen(item.screen)} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <InfoBlock
          title="이름 입력 규칙"
          description="최소 2명, 권장 최대 12명입니다. 쉼표와 줄바꿈 모두 지원하고 공백은 자동 정리됩니다."
          icon={Users}
        />
        <InfoBlock
          title="기록 저장 방식"
          description={storageDescription}
          icon={History}
        />
        <InfoBlock
          title="룰렛 자동 기록"
          description="룰렛은 화면 안에서 바로 실행되고, 결과가 확정되면 명예의 전당과 최근 기록에 즉시 누적됩니다."
          icon={TriangleAlert}
        />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_12px_28px_rgba(47,74,91,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-tight text-[#1d2a34]">{value}</p>
    </div>
  )
}

function GameEntryCard({ item, onClick }: { item: GameCardItem; onClick: () => void }) {
  const Icon = item.icon

  return (
    <button type="button" onClick={onClick} className="group text-left">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_14px_30px_rgba(37,74,91,0.08)] backdrop-blur-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(37,74,91,0.14)]">
        <div className={cn("bg-gradient-to-br px-5 py-5", item.accentClassName)}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#617783]">{item.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-[#15212b]">{item.title}</h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/82 shadow-sm">
              <Icon className="size-7 text-[#365265]" />
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-[#60717d]">{item.description}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d7e5ee] bg-white/82 px-4 py-2 text-sm font-semibold text-[#355264] transition group-hover:bg-[#f5fbfe]">
            시작하기
            <ExternalLink className="size-4" />
          </div>
        </div>
      </div>
    </button>
  )
}

function InfoBlock({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/85 px-5 py-5 shadow-[0_14px_30px_rgba(37,74,91,0.08)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
        <Icon className="size-4" />
        Guide
      </div>
      <h3 className="mt-3 text-xl font-black tracking-tight text-[#1d2a34]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#60717d]">{description}</p>
    </div>
  )
}
