"use client"

import Link from "next/link"
import {
  ExternalLink,
  Gamepad2,
  History,
  PencilLine,
  ShieldCheck,
  Trash2,
  Trophy,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CAUGHT_MODE_LABELS,
  type CaughtRecord,
  type LeaderboardEntry,
} from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { MODE_BADGE_CLASSNAMES } from "./constants"
import { formatDateTime, formatModeSummary, getRankAccent, getRankIcon } from "./helpers"

export function AccessBlockedState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff6ea] text-[#c67a17] shadow-[0_16px_36px_rgba(198,122,23,0.18)]">
        <ShieldCheck className="size-9" />
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[#18232d]">
        {isLoggedIn ? "두음 회원 이상만 이용할 수 있습니다." : "로그인이 필요합니다."}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#63727d]">
        {isLoggedIn
          ? "내기 탭은 두음 회원과 관리자만 노출됩니다. 현재 계정 권한으로는 접근할 수 없습니다."
          : "이 탭은 두음 회원 이상에게만 노출됩니다. 로그인 후 권한이 확인되면 이용할 수 있습니다."}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#263441]">
            <Link href="/">홈으로 이동</Link>
          </Button>
        ) : (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#263441]">
            <Link href="/login?next=%2Fbet">로그인하기</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function QuickActionPanel({
  historyLoaded,
  onGoHome,
  onGoHall,
  onOpenManualRecord,
  onReset,
}: {
  historyLoaded: boolean
  onGoHome: () => void
  onGoHall: () => void
  onOpenManualRecord: () => void
  onReset: () => void
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,248,234,0.92),rgba(255,255,255,0.88))] p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b641d]">Quick Actions</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">바로 가기</h2>
        <p className="mt-2 text-sm leading-6 text-[#6b6a64]">
          홈, 명예의 전당, 수동 기록, 전체 초기화를 여기서 바로 처리할 수 있습니다.
        </p>

        <div className="mt-5 grid gap-3">
          <ActionButton icon={Gamepad2} label="게임 홈" onClick={onGoHome} />
          <ActionButton icon={Trophy} label="명예의 전당" onClick={onGoHall} />
          <ActionButton icon={PencilLine} label="수동 기록" onClick={onOpenManualRecord} />
          <ActionButton icon={Trash2} label="전체 기록 초기화" onClick={onReset} destructive />
        </div>

        <div className="mt-5 rounded-[22px] border border-black/8 bg-white/78 px-4 py-4 text-sm text-[#63727d]">
          {historyLoaded ? "기록은 이 브라우저의 localStorage에 저장됩니다." : "기록을 불러오는 중입니다..."}
        </div>
      </div>
    </Card>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-[22px] border px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5",
        destructive
          ? "border-[#f1d5d5] bg-[#fff8f8] text-[#934646] hover:bg-[#fff1f1]"
          : "border-black/8 bg-white/86 text-[#213541] hover:bg-white",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            destructive ? "bg-[#ffe8e8]" : "bg-[#f4f7f8]",
          )}
        >
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <ExternalLink className="size-4 opacity-55" />
    </button>
  )
}

export function HallOfFamePreviewPanel({
  historyLoaded,
  leaderboard,
  onOpenHall,
}: {
  historyLoaded: boolean
  leaderboard: LeaderboardEntry[]
  onOpenHall: () => void
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-white/88 p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7f88]">Hall Of Fame</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">상위 5명</h2>
          </div>
          <button
            type="button"
            onClick={onOpenHall}
            className="rounded-full border border-[#d8e4eb] bg-[#f8fbfd] px-3 py-2 text-xs font-semibold text-[#355264] transition hover:bg-white"
          >
            전체 보기
          </button>
        </div>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            기록을 읽는 중입니다...
          </div>
        ) : !leaderboard.length ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            아직 아무도 안 걸림
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.normalizedName}
                className={cn(
                  "rounded-[22px] border px-4 py-4 shadow-[0_8px_24px_rgba(24,35,45,0.04)]",
                  getRankAccent(index),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/75 px-2 text-xs font-black text-[#18232d]">
                        {index + 1}
                      </span>
                      <p className="truncate text-lg font-black tracking-[-0.03em] text-[#18232d]">{entry.displayName}</p>
                      {getRankIcon(index)}
                    </div>
                    <p className="mt-2 text-sm text-[#50606c]">총 {entry.totalCount}회 · {formatModeSummary(entry.perModeCounts)}</p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#6e7d88]">{formatDateTime(entry.lastCaughtAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export function RecentHistoryPanel({
  historyLoaded,
  records,
}: {
  historyLoaded: boolean
  records: CaughtRecord[]
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-white/88 p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7f88]">
          <History className="size-4" />
          Recent History
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">최근 기록 5개</h2>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            기록을 읽는 중입니다...
          </div>
        ) : !records.length ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            최근 기록이 없습니다.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-[22px] border border-black/8 bg-[#fbfcfd] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black tracking-[-0.03em] text-[#18232d]">{record.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          MODE_BADGE_CLASSNAMES[record.mode],
                        )}
                      >
                        {CAUGHT_MODE_LABELS[record.mode]}
                      </span>
                      {record.detail ? (
                        <span className="truncate text-xs text-[#6d7c86]">{record.detail}</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#6e7d88]">{formatDateTime(record.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
