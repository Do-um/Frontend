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
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/82 text-[#567289] shadow-[0_16px_36px_rgba(47,74,91,0.12)]">
        <ShieldCheck className="size-9" />
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-tight text-[#15212b]">
        {isLoggedIn ? "두음 회원 이상만 이용할 수 있습니다." : "로그인이 필요합니다."}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#677680]">
        {isLoggedIn
          ? "내기 탭은 두음 회원과 관리자만 노출됩니다. 현재 계정 권한으로는 접근할 수 없습니다."
          : "이 탭은 두음 회원 이상에게만 노출됩니다. 로그인 후 권한이 확인되면 이용할 수 있습니다."}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#2c3743]">
            <Link href="/">홈으로 이동</Link>
          </Button>
        ) : (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#2c3743]">
            <Link href="/login?next=%2Fbet">로그인하기</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function QuickActionPanel({
  historyLoaded,
  canResetHistory,
  storageDescription,
  onGoHome,
  onGoHall,
  onOpenManualRecord,
  onReset,
}: {
  historyLoaded: boolean
  canResetHistory: boolean
  storageDescription: string
  onGoHome: () => void
  onGoHall: () => void
  onOpenManualRecord: () => void
  onReset: () => void
}) {
  return (
    <Card className="rounded-[28px] border border-white/80 bg-white/85 p-0 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm">
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Quick Actions</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#15212b]">바로 가기</h2>
        <p className="mt-2 text-sm leading-6 text-[#677680]">
          홈, 명예의 전당, 수동 기록을 여기서 바로 처리할 수 있습니다.
        </p>

        <div className="mt-5 grid gap-3">
          <ActionButton icon={Gamepad2} label="게임 홈" onClick={onGoHome} />
          <ActionButton icon={Trophy} label="명예의 전당" onClick={onGoHall} />
          <ActionButton icon={PencilLine} label="수동 기록" onClick={onOpenManualRecord} />
          {canResetHistory ? <ActionButton icon={Trash2} label="전체 기록 초기화" onClick={onReset} destructive /> : null}
        </div>

        <div className="mt-5 rounded-[24px] border border-[#d7e5ee] bg-white/82 px-4 py-4 text-sm text-[#60717d] shadow-[0_10px_24px_rgba(47,74,91,0.05)]">
          {historyLoaded ? storageDescription : "기록을 불러오는 중입니다..."}
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
          ? "border-[#ead7d3] bg-[#faf2ef] text-[#7d5a54] hover:bg-white"
          : "border-[#d7e5ee] bg-white/86 text-[#355264] hover:bg-[#f5fbfe]",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            destructive ? "bg-[#f5e7e2]" : "bg-[#eef6fb]",
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
    <Card className="rounded-[28px] border border-white/80 bg-white/85 p-0 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Hall Of Fame</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#15212b]">상위 5명</h2>
          </div>
          <button
            type="button"
            onClick={onOpenHall}
            className="rounded-full border border-[#d7e5ee] bg-white/82 px-3 py-2 text-xs font-semibold text-[#355264] transition hover:bg-[#f5fbfe]"
          >
            전체 보기
          </button>
        </div>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-6 text-center text-sm text-[#677680]">
            기록을 읽는 중입니다...
          </div>
        ) : !leaderboard.length ? (
          <div className="mt-5 rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-6 text-center text-sm text-[#677680]">
            아직 아무도 안 걸림
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.normalizedName}
                className={cn(
                  "rounded-[22px] border px-4 py-4 shadow-[0_10px_24px_rgba(47,74,91,0.06)]",
                  getRankAccent(index),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/78 px-2 text-xs font-black text-[#1d2a34]">
                        {index + 1}
                      </span>
                      <p className="truncate text-lg font-black tracking-tight text-[#15212b]">{entry.displayName}</p>
                      {getRankIcon(index)}
                    </div>
                    <p className="mt-2 text-sm text-[#60717d]">총 {entry.totalCount}회 · {formatModeSummary(entry.perModeCounts)}</p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#7b8f99]">{formatDateTime(entry.lastCaughtAt)}</p>
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
    <Card className="rounded-[28px] border border-white/80 bg-white/85 p-0 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
          <History className="size-4" />
          Recent History
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#15212b]">최근 기록 5개</h2>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-6 text-center text-sm text-[#677680]">
            기록을 읽는 중입니다...
          </div>
        ) : !records.length ? (
          <div className="mt-5 rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-6 text-center text-sm text-[#677680]">
            최근 기록이 없습니다.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-4 shadow-[0_10px_24px_rgba(47,74,91,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black tracking-tight text-[#15212b]">{record.name}</p>
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
                  <p className="shrink-0 text-xs font-semibold text-[#7b8f99]">{formatDateTime(record.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
