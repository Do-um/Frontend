"use client"

import {
  formatVolunteerRegionDate,
  getVolunteerRegionDisplayName,
  type VolunteerRegionStatus,
} from "@/lib/volunteer-region-map"

type VolunteerRegionDetailPanelProps = {
  region: VolunteerRegionStatus | null
  visitedRegionCount: number
  mappedActivityCount: number
}

function DetailItem({
  label,
  value,
  subdued = false,
}: {
  label: string
  value: string
  subdued?: boolean
}) {
  return (
    <div className="rounded-[22px] border border-[#d7e5ee] bg-white/86 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">{label}</p>
      <p className={`mt-2 text-sm font-semibold leading-6 ${subdued ? "text-[#6f7f88]" : "text-[#223541]"}`}>{value}</p>
    </div>
  )
}

export function VolunteerRegionDetailPanel({
  region,
  visitedRegionCount,
  mappedActivityCount,
}: VolunteerRegionDetailPanelProps) {
  if (!region) {
    return (
      <aside className="rounded-[30px] border border-[#d7e5ee] bg-white/82 p-6 shadow-[0_18px_40px_rgba(47,74,91,0.08)]">
        <p className="text-sm text-[#6f7f88]">선택된 지역 정보가 없습니다.</p>
      </aside>
    )
  }

  const regionLabel = getVolunteerRegionDisplayName(region)
  const visitedLabel = region.visited ? "방문 완료" : "미방문"
  const description = region.visited
    ? `${regionLabel}에서 진행한 봉사활동 기록이 지도와 연동되어 표시되고 있습니다.`
    : `${regionLabel} 방문 기록은 아직 등록되지 않았습니다. 다른 지역을 선택해 현재까지의 활동 요약을 확인할 수 있습니다.`

  return (
    <aside className="rounded-[30px] border border-[#d7e5ee] bg-white/82 p-6 shadow-[0_18px_40px_rgba(47,74,91,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b8f99]">Selected Region</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1b2a35]">{regionLabel}</h3>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
            region.visited ? "bg-[#e8f3fb] text-[#356689]" : "bg-[#eef3f6] text-[#617783]"
          }`}
        >
          {visitedLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#5b6e79]">{description}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <DetailItem label="방문 여부" value={visitedLabel} subdued={!region.visited} />
        <DetailItem label="누적 활동" value={region.visited ? `${region.visitCount ?? 0}회` : "0회"} subdued={!region.visited} />
        <DetailItem
          label="최근 방문"
          value={region.visited ? formatVolunteerRegionDate(region.latestVisitedAt) : "기록 없음"}
          subdued={!region.visited}
        />
        <DetailItem
          label="최근 활동"
          value={region.visited ? region.latestActivityTitle ?? "활동명 없음" : "기록 없음"}
          subdued={!region.visited}
        />
      </div>

      <div className="mt-6 rounded-[24px] border border-[#d7e5ee] bg-[linear-gradient(180deg,#f7fbfe_0%,#f2f7f9_100%)] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Map Summary</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#284153] shadow-sm">
            방문 지역 {visitedRegionCount}곳
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#284153] shadow-sm">
            반영된 활동 {mappedActivityCount}건
          </span>
        </div>
      </div>
    </aside>
  )
}
