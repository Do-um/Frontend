"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPinned, TriangleAlert } from "lucide-react"

import { VolunteerRegionDetailPanel } from "@/components/home/volunteer-region-detail-panel"
import { VolunteerRegionMap } from "@/components/home/volunteer-region-map"
import { VolunteerRegionMobileList } from "@/components/home/volunteer-region-mobile-list"
import { fetchActivities, type ActivityItem } from "@/lib/content-api"
import { hasSupabaseEnv } from "@/lib/supabase"
import {
  VOLUNTEER_REGION_DEFINITIONS,
  buildVolunteerRegionStatuses,
  type VolunteerRegionStatus,
} from "@/lib/volunteer-region-map"

function LegendItem({
  label,
  fillClassName,
  outlined = false,
}: {
  label: string
  fillClassName: string
  outlined?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e5ee] bg-white/86 px-3 py-1.5 text-xs font-semibold text-[#496171]">
      <span
        className={`block size-3 rounded-full ${fillClassName} ${outlined ? "ring-2 ring-[#274457] ring-offset-2 ring-offset-white" : ""}`}
      />
      {label}
    </div>
  )
}

function VolunteerMapSkeleton() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
      <div className="rounded-[30px] border border-[#d7e5ee] bg-white/72 p-5">
        <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-[#e8eef2] md:aspect-[5/4]" />
      </div>
      <div className="rounded-[30px] border border-[#d7e5ee] bg-white/72 p-6">
        <div className="h-6 w-32 animate-pulse rounded-full bg-[#e8eef2]" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-[#edf2f5]" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-[#edf2f5]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-[22px] bg-[#edf2f5]" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function VolunteerRegionMapSection() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null)

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setError("지역 지도를 불러오려면 Supabase 환경변수 설정이 필요합니다.")
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadVolunteerActivities() {
      try {
        const nextActivities = await fetchActivities()
        if (cancelled) {
          return
        }

        setActivities(nextActivities.filter((activity) => activity.activityType === "MAIN"))
        setError("")
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "봉사활동 지역 정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadVolunteerActivities()

    return () => {
      cancelled = true
    }
  }, [])

  const regionMeta = useMemo(() => buildVolunteerRegionStatuses(activities), [activities])

  const defaultRegionCode = useMemo(() => {
    return regionMeta.statuses.find((status) => status.visited)?.regionCode ?? VOLUNTEER_REGION_DEFINITIONS[0]?.regionCode ?? null
  }, [regionMeta.statuses])

  useEffect(() => {
    if (!defaultRegionCode) {
      return
    }

    const hasSelectedRegion = selectedRegionCode
      ? regionMeta.statuses.some((status) => status.regionCode === selectedRegionCode)
      : false

    if (!hasSelectedRegion) {
      setSelectedRegionCode(defaultRegionCode)
    }
  }, [defaultRegionCode, regionMeta.statuses, selectedRegionCode])

  const selectedRegion =
    regionMeta.statuses.find((status) => status.regionCode === selectedRegionCode) ??
    regionMeta.statuses.find((status) => status.regionCode === defaultRegionCode) ??
    null

  const emptyStateMessage = useMemo(() => {
    if (regionMeta.visitedRegionCount > 0) {
      return ""
    }

    if (!activities.length) {
      return "아직 지도에 반영할 주요 봉사활동 기록이 없습니다."
    }

    return "활동 기록은 있지만 지역 코드로 변환할 수 있는 장소 정보가 아직 충분하지 않습니다."
  }, [activities.length, regionMeta.visitedRegionCount])

  const partialMappingMessage =
    regionMeta.unmappedActivityCount > 0
      ? `지역을 식별할 수 없는 기록 ${regionMeta.unmappedActivityCount}건은 지도에서 안전하게 제외했습니다.`
      : ""

  return (
    <section id="volunteer-map" className="mt-14 border-t border-[#e3edf3] pt-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#6f8590]">VOLUNTEER MAP</p>
          <h3 className="mt-2 text-2xl font-bold text-[#1d2a34] sm:text-[1.9rem]">봉사활동 지역 지도</h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6f79] sm:text-[0.95rem]">
            대한민국 지도에서 방문한 지역을 한눈에 확인하고, 특정 지역을 선택해 방문 여부와 최근 활동 요약을 바로 볼 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#edf5fb] px-3 py-1.5 text-xs font-semibold text-[#356689]">
            방문 지역 {regionMeta.visitedRegionCount}곳
          </span>
          <span className="rounded-full bg-[#f3f6f8] px-3 py-1.5 text-xs font-semibold text-[#556d7b]">
            반영된 기록 {regionMeta.mappedActivityCount}건
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[24px] border border-[#d7e5ee] bg-[#f8fbfd] p-4">
        <LegendItem label="미방문 지역" fillClassName="bg-[#e8eef2]" />
        <LegendItem label="방문 지역" fillClassName="bg-[#7cb8e8]" />
        <LegendItem label="선택된 지역" fillClassName="bg-[#dbe7ef]" outlined />
      </div>

      {loading ? <VolunteerMapSkeleton /> : null}

      {!loading && error ? (
        <div className="mt-8 rounded-[30px] border border-[#f0d0d0] bg-[#fff6f6] p-6 text-[#954646] shadow-[0_16px_36px_rgba(154,59,59,0.06)]">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-base font-semibold">지역 지도를 불러오지 못했습니다.</p>
              <p className="mt-2 text-sm leading-6">{error}</p>
              <p className="mt-2 text-sm leading-6 text-[#a05a5a]">메인 페이지의 다른 섹션은 그대로 사용할 수 있습니다.</p>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="space-y-4">
            <VolunteerRegionMap
              statuses={regionMeta.statuses}
              selectedRegionCode={selectedRegionCode}
              onSelect={setSelectedRegionCode}
              className="hidden md:block"
            />

            <VolunteerRegionMobileList
              statuses={regionMeta.statuses}
              selectedRegionCode={selectedRegionCode}
              onSelect={setSelectedRegionCode}
              className="md:hidden"
            />

            {emptyStateMessage ? (
              <div className="rounded-[24px] border border-[#d7e5ee] bg-[#f8fbfd] px-4 py-3 text-sm leading-6 text-[#60717d]">
                {emptyStateMessage}
              </div>
            ) : null}

            {partialMappingMessage ? (
              <div className="flex items-start gap-2 rounded-[24px] border border-[#d9e7ee] bg-white/82 px-4 py-3 text-sm leading-6 text-[#60717d]">
                <MapPinned className="mt-0.5 size-4 shrink-0 text-[#6a8394]" />
                <p>{partialMappingMessage}</p>
              </div>
            ) : null}
          </div>

          <VolunteerRegionDetailPanel
            region={selectedRegion as VolunteerRegionStatus | null}
            visitedRegionCount={regionMeta.visitedRegionCount}
            mappedActivityCount={regionMeta.mappedActivityCount}
          />
        </div>
      ) : null}
    </section>
  )
}
