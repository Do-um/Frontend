"use client"

import { cn } from "@/lib/utils"
import {
  formatVolunteerRegionDate,
  getVolunteerRegionDisplayName,
  type VolunteerRegionStatus,
} from "@/lib/volunteer-region-map"

type VolunteerRegionMobileListProps = {
  statuses: VolunteerRegionStatus[]
  selectedRegionCode: string | null
  onSelect: (regionCode: string) => void
  className?: string
}

export function VolunteerRegionMobileList({
  statuses,
  selectedRegionCode,
  onSelect,
  className,
}: VolunteerRegionMobileListProps) {
  const orderedStatuses = [...statuses].sort((left, right) => {
    if (left.visited !== right.visited) {
      return left.visited ? -1 : 1
    }

    return getVolunteerRegionDisplayName(left).localeCompare(getVolunteerRegionDisplayName(right), "ko")
  })

  return (
    <div className={cn("grid gap-3", className)}>
      {orderedStatuses.map((status) => {
        const isSelected = status.regionCode === selectedRegionCode
        const regionLabel = getVolunteerRegionDisplayName(status)

        return (
          <button
            key={status.regionCode}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(status.regionCode)}
            className={`rounded-[22px] border p-4 text-left transition ${
              isSelected
                ? "border-[#355264] bg-[#eff6fb] shadow-[0_16px_34px_rgba(47,74,91,0.1)]"
                : "border-[#d7e5ee] bg-white/86 shadow-[0_12px_26px_rgba(47,74,91,0.05)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#223541]">{regionLabel}</p>
                <p className="mt-1 text-xs text-[#70818b]">
                  {status.visited ? `최근 방문 ${formatVolunteerRegionDate(status.latestVisitedAt)}` : "아직 방문 기록 없음"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  status.visited ? "bg-[#e8f3fb] text-[#356689]" : "bg-[#eef3f6] text-[#617783]"
                }`}
              >
                {status.visited ? `${status.visitCount ?? 0}회` : "미방문"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5b6e79]">
              {status.visited ? status.latestActivityTitle ?? "최근 활동 정보 없음" : "선택하면 방문 여부와 요약 정보를 확인할 수 있습니다."}
            </p>
          </button>
        )
      })}
    </div>
  )
}
