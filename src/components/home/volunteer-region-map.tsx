"use client"

import { cn } from "@/lib/utils"
import {
  VOLUNTEER_REGION_DEFINITIONS,
  VOLUNTEER_REGION_VIEWBOX,
  getVolunteerRegionDisplayName,
  type VolunteerRegionStatus,
} from "@/lib/volunteer-region-map"

type VolunteerRegionMapProps = {
  statuses: VolunteerRegionStatus[]
  selectedRegionCode: string | null
  onSelect: (regionCode: string) => void
  className?: string
}

const REGION_NEUTRAL_FILL = "#e8eef2"
const REGION_VISITED_FILL = "#7cb8e8"
const REGION_SELECTED_FILL = "#5c95bd"
const REGION_SELECTED_NEUTRAL_FILL = "#dbe7ef"
const REGION_STROKE = "#ffffff"
const REGION_SELECTED_STROKE = "#274457"
const REGION_TEXT = "#294255"
const REGION_TEXT_INVERTED = "#ffffff"

function getRegionPaint(status: VolunteerRegionStatus, isSelected: boolean) {
  if (isSelected && status.visited) {
    return {
      fill: REGION_SELECTED_FILL,
      stroke: REGION_SELECTED_STROKE,
      strokeWidth: 3.5,
      textColor: REGION_TEXT_INVERTED,
    }
  }

  if (isSelected) {
    return {
      fill: REGION_SELECTED_NEUTRAL_FILL,
      stroke: REGION_SELECTED_STROKE,
      strokeWidth: 3.5,
      textColor: REGION_TEXT,
    }
  }

  if (status.visited) {
    return {
      fill: REGION_VISITED_FILL,
      stroke: REGION_STROKE,
      strokeWidth: 2,
      textColor: REGION_TEXT_INVERTED,
    }
  }

  return {
    fill: REGION_NEUTRAL_FILL,
    stroke: REGION_STROKE,
    strokeWidth: 2,
    textColor: REGION_TEXT,
  }
}

export function VolunteerRegionMap({
  statuses,
  selectedRegionCode,
  onSelect,
  className,
}: VolunteerRegionMapProps) {
  const statusByCode = new Map(statuses.map((status) => [status.regionCode, status]))

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border border-[#d7e5ee] bg-[linear-gradient(180deg,#f7fbfe_0%,#eef4f8_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-6",
        className,
      )}
    >
      <svg viewBox={VOLUNTEER_REGION_VIEWBOX} className="h-auto w-full" role="img" aria-label="대한민국 봉사활동 지역 지도">
        <title>대한민국 봉사활동 지역 지도</title>
        <rect x="0" y="0" width="400" height="620" rx="28" fill="transparent" />

        {VOLUNTEER_REGION_DEFINITIONS.map((region) => {
          const status =
            statusByCode.get(region.regionCode) ?? {
              regionCode: region.regionCode,
              regionName: region.regionName,
              provinceName: region.provinceName,
              visited: false,
            }
          const isSelected = selectedRegionCode === region.regionCode
          const paint = getRegionPaint(status, isSelected)
          const regionLabel = getVolunteerRegionDisplayName(status)

          return (
            <g
              key={region.regionCode}
              role="button"
              aria-label={`${regionLabel}, ${status.visited ? "방문 지역" : "미방문 지역"}`}
              aria-pressed={isSelected}
              tabIndex={0}
              focusable="true"
              onClick={() => onSelect(region.regionCode)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onSelect(region.regionCode)
                }
              }}
              className="cursor-pointer outline-none"
              style={{
                filter: isSelected ? "drop-shadow(0 14px 20px rgba(39,68,87,0.14))" : "none",
              }}
            >
              <path
                id={region.pathId}
                d={region.pathD}
                fill={paint.fill}
                stroke={paint.stroke}
                strokeWidth={paint.strokeWidth}
                vectorEffect="non-scaling-stroke"
                style={{ transition: "fill 180ms ease, stroke 180ms ease, stroke-width 180ms ease" }}
              />
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={region.labelFontSize ?? 11}
                fontWeight={700}
                fill={paint.textColor}
                pointerEvents="none"
                style={{ userSelect: "none", transition: "fill 180ms ease" }}
              >
                {region.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
