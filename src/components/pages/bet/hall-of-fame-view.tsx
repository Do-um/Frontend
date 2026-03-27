"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  CAUGHT_MODE_LABELS,
  type CaughtRecord,
  type LeaderboardEntry,
} from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { MODE_BADGE_CLASSNAMES } from "./constants"
import { formatDateTime, formatModeSummary, getRankAccent, getRankIcon } from "./helpers"
import { ScreenHeader } from "./common-ui"

export function HallOfFameView({
  leaderboard,
  recentHistoryMap,
  onBackHome,
}: {
  leaderboard: LeaderboardEntry[]
  recentHistoryMap: Map<string, CaughtRecord[]>
  onBackHome: () => void
}) {
  const [expandedName, setExpandedName] = useState<string | null>(leaderboard[0]?.normalizedName ?? null)

  useEffect(() => {
    if (!leaderboard.length) {
      setExpandedName(null)
      return
    }

    if (expandedName && leaderboard.some((entry) => entry.normalizedName === expandedName)) {
      return
    }

    setExpandedName(leaderboard[0].normalizedName)
  }, [expandedName, leaderboard])

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="명예의 전당"
        description="총 횟수, 모드별 누적, 마지막으로 걸린 시각, 최근 5개 기록까지 한 번에 확인합니다."
        onBackHome={onBackHome}
      />

      {!leaderboard.length ? (
        <div className="rounded-[28px] border border-dashed border-[#d8e4eb] bg-[#f8fbfd] px-5 py-14 text-center">
          <p className="text-2xl font-black tracking-[-0.04em] text-[#213541]">아직 아무도 안 걸림</p>
          <p className="mt-3 text-sm leading-6 text-[#63727d]">게임 결과를 저장하거나 룰렛을 돌리면 이 목록이 바로 채워집니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => {
            const recentRecords = recentHistoryMap.get(entry.normalizedName) ?? []
            const isExpanded = expandedName === entry.normalizedName

            return (
              <article
                key={entry.normalizedName}
                className={cn(
                  "rounded-[28px] border px-5 py-5 shadow-[0_14px_34px_rgba(24,35,45,0.05)]",
                  getRankAccent(index),
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/78 px-3 text-sm font-black text-[#18232d]">
                        #{index + 1}
                      </span>
                      <h3 className="truncate text-2xl font-black tracking-[-0.04em] text-[#18232d]">{entry.displayName}</h3>
                      {index < 3 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/76 px-3 py-1 text-xs font-semibold text-[#5e5a47]">
                          {getRankIcon(index)}
                          TOP {index + 1}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/76 px-3 py-1 text-sm font-semibold text-[#213541]">
                        총 {entry.totalCount}회
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1 text-sm text-[#566b78]">
                        {formatModeSummary(entry.perModeCounts)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div className="text-sm text-[#5c6d78]">
                      마지막 걸림 <span className="font-semibold text-[#213541]">{formatDateTime(entry.lastCaughtAt)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setExpandedName((current) => (current === entry.normalizedName ? null : entry.normalizedName))
                      }
                      className="h-10 rounded-full border-white/75 bg-white/80 px-4 text-[#355264] hover:bg-white"
                    >
                      {isExpanded ? "최근 기록 닫기" : "최근 기록 5개 보기"}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {recentRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-[22px] border border-black/8 bg-white/82 px-4 py-4 shadow-[0_10px_24px_rgba(24,35,45,0.04)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              MODE_BADGE_CLASSNAMES[record.mode],
                            )}
                          >
                            {CAUGHT_MODE_LABELS[record.mode]}
                          </span>
                          <span className="text-xs font-semibold text-[#6d7d87]">{formatDateTime(record.createdAt)}</span>
                        </div>
                        {record.detail ? (
                          <p className="mt-3 text-sm leading-6 text-[#596974]">{record.detail}</p>
                        ) : (
                          <p className="mt-3 text-sm text-[#74838c]">추가 상세 없음</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
