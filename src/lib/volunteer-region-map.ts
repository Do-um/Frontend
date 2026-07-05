import type { ActivityItem } from "@/lib/content-api"

export type VolunteerRegionCode =
  | "KR-11"
  | "KR-26"
  | "KR-27"
  | "KR-28"
  | "KR-29"
  | "KR-30"
  | "KR-31"
  | "KR-36"
  | "KR-41"
  | "KR-42"
  | "KR-43"
  | "KR-44"
  | "KR-45"
  | "KR-46"
  | "KR-47"
  | "KR-48"
  | "KR-49"

export type VolunteerRegionStatus = {
  regionCode: string
  regionName: string
  provinceName?: string
  visited: boolean
  visitCount?: number
  latestVisitedAt?: string
  latestActivityTitle?: string
}

export type VolunteerRegionDefinition = {
  regionCode: VolunteerRegionCode
  regionName: string
  provinceName?: string
  pathId: string
  label: string
  pathD: string
  labelX: number
  labelY: number
  labelFontSize?: number
  aliases: readonly string[]
}

type RegionActivityLike = Pick<ActivityItem, "activityId" | "activityDate" | "activityType" | "createdAt" | "location">

type VolunteerRegionBuildMeta = {
  statuses: VolunteerRegionStatus[]
  visitedRegionCount: number
  mappedActivityCount: number
  unmappedActivityCount: number
}

export const VOLUNTEER_REGION_VIEWBOX = "0 0 400 620"

export const VOLUNTEER_REGION_PATH_IDS = {
  "KR-11": "volunteer-region-kr-11",
  "KR-26": "volunteer-region-kr-26",
  "KR-27": "volunteer-region-kr-27",
  "KR-28": "volunteer-region-kr-28",
  "KR-29": "volunteer-region-kr-29",
  "KR-30": "volunteer-region-kr-30",
  "KR-31": "volunteer-region-kr-31",
  "KR-36": "volunteer-region-kr-36",
  "KR-41": "volunteer-region-kr-41",
  "KR-42": "volunteer-region-kr-42",
  "KR-43": "volunteer-region-kr-43",
  "KR-44": "volunteer-region-kr-44",
  "KR-45": "volunteer-region-kr-45",
  "KR-46": "volunteer-region-kr-46",
  "KR-47": "volunteer-region-kr-47",
  "KR-48": "volunteer-region-kr-48",
  "KR-49": "volunteer-region-kr-49",
} as const satisfies Record<VolunteerRegionCode, string>

const VOLUNTEER_REGION_SVG_PATHS = {
  "KR-11": {
    pathD: "M138 101 L147 95 L156 99 L155 110 L145 116 L136 110 Z",
    label: "서울",
    labelX: 146,
    labelY: 107,
    labelFontSize: 9,
  },
  "KR-26": {
    pathD: "M292 430 L316 428 L338 454 L320 480 L296 472 L286 446 Z",
    label: "부산",
    labelX: 313,
    labelY: 455,
    labelFontSize: 10,
  },
  "KR-27": {
    pathD: "M250 316 L266 310 L280 320 L274 338 L258 342 L246 330 Z",
    label: "대구",
    labelX: 263,
    labelY: 327,
    labelFontSize: 10,
  },
  "KR-28": {
    pathD: "M76 104 L92 90 L112 94 L115 118 L93 130 L70 118 Z",
    label: "인천",
    labelX: 93,
    labelY: 111,
    labelFontSize: 10,
  },
  "KR-29": {
    pathD: "M106 370 L118 362 L130 368 L128 382 L116 388 L104 382 Z",
    label: "광주",
    labelX: 117,
    labelY: 377,
    labelFontSize: 10,
  },
  "KR-30": {
    pathD: "M172 204 L184 200 L190 212 L184 224 L170 220 Z",
    label: "대전",
    labelX: 180,
    labelY: 214,
    labelFontSize: 10,
  },
  "KR-31": {
    pathD: "M320 348 L338 342 L350 356 L348 378 L332 390 L318 374 Z",
    label: "울산",
    labelX: 334,
    labelY: 367,
    labelFontSize: 10,
  },
  "KR-36": {
    pathD: "M160 185 L171 182 L177 191 L172 202 L160 202 L154 194 Z",
    label: "세종",
    labelX: 166,
    labelY: 194,
    labelFontSize: 9,
  },
  "KR-41": {
    pathD: "M104 72 L164 60 L208 94 L198 144 L150 160 L116 150 L92 130 L115 118 L112 94 Z",
    label: "경기",
    labelX: 149,
    labelY: 114,
  },
  "KR-42": {
    pathD: "M210 54 L286 66 L338 116 L330 194 L272 228 L218 196 L198 144 L208 94 Z",
    label: "강원",
    labelX: 272,
    labelY: 146,
  },
  "KR-43": {
    pathD: "M174 156 L218 160 L252 214 L210 270 L154 256 L172 212 Z",
    label: "충북",
    labelX: 204,
    labelY: 213,
  },
  "KR-44": {
    pathD: "M58 196 L88 150 L116 150 L150 160 L172 212 L148 258 L90 252 L62 230 Z",
    label: "충남",
    labelX: 109,
    labelY: 211,
  },
  "KR-45": {
    pathD: "M66 302 L90 252 L148 258 L176 314 L152 370 L92 358 L68 332 Z",
    label: "전북",
    labelX: 118,
    labelY: 315,
  },
  "KR-46": {
    pathD: "M42 452 L60 372 L104 382 L152 370 L182 432 L156 498 L92 514 L44 484 Z",
    label: "전남",
    labelX: 109,
    labelY: 443,
  },
  "KR-47": {
    pathD: "M254 214 L324 214 L364 264 L346 354 L286 398 L228 360 L210 270 Z",
    label: "경북",
    labelX: 286,
    labelY: 300,
  },
  "KR-48": {
    pathD: "M156 438 L188 368 L228 360 L286 398 L296 430 L286 446 L296 472 L258 520 L176 502 L152 470 Z",
    label: "경남",
    labelX: 224,
    labelY: 441,
  },
  "KR-49": {
    pathD: "M112 542 L184 548 L204 568 L196 586 L124 590 L100 570 Z",
    label: "제주",
    labelX: 149,
    labelY: 569,
  },
} as const satisfies Record<
  VolunteerRegionCode,
  {
    pathD: string
    label: string
    labelX: number
    labelY: number
    labelFontSize?: number
  }
>

export const VOLUNTEER_REGION_DEFINITIONS: readonly VolunteerRegionDefinition[] = [
  {
    regionCode: "KR-11",
    regionName: "서울",
    provinceName: "서울특별시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-11"],
    aliases: ["서울특별시", "서울"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-11"],
  },
  {
    regionCode: "KR-28",
    regionName: "인천",
    provinceName: "인천광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-28"],
    aliases: ["인천광역시", "인천"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-28"],
  },
  {
    regionCode: "KR-41",
    regionName: "경기",
    provinceName: "경기도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-41"],
    aliases: [
      "경기도",
      "경기",
      "수원",
      "고양",
      "성남",
      "용인",
      "부천",
      "화성",
      "안산",
      "평택",
      "의정부",
      "남양주",
      "파주",
      "김포",
      "안양",
      "시흥",
      "군포",
      "광명",
      "하남",
      "오산",
      "이천",
      "안성",
      "포천",
      "양주",
      "동두천",
      "가평",
      "양평",
      "여주",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-41"],
  },
  {
    regionCode: "KR-42",
    regionName: "강원",
    provinceName: "강원특별자치도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-42"],
    aliases: [
      "강원특별자치도",
      "강원도",
      "강원",
      "춘천",
      "원주",
      "강릉",
      "속초",
      "동해",
      "태백",
      "삼척",
      "홍천",
      "횡성",
      "평창",
      "정선",
      "철원",
      "화천",
      "양구",
      "인제",
      "고성",
      "양양",
      "영월",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-42"],
  },
  {
    regionCode: "KR-44",
    regionName: "충남",
    provinceName: "충청남도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-44"],
    aliases: [
      "충청남도",
      "충남",
      "천안",
      "공주",
      "보령",
      "아산",
      "서산",
      "논산",
      "계룡",
      "당진",
      "금산",
      "부여",
      "서천",
      "청양",
      "홍성",
      "예산",
      "태안",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-44"],
  },
  {
    regionCode: "KR-36",
    regionName: "세종",
    provinceName: "세종특별자치시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-36"],
    aliases: ["세종특별자치시", "세종"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-36"],
  },
  {
    regionCode: "KR-43",
    regionName: "충북",
    provinceName: "충청북도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-43"],
    aliases: [
      "충청북도",
      "충북",
      "청주",
      "충주",
      "제천",
      "보은",
      "옥천",
      "영동",
      "증평",
      "진천",
      "괴산",
      "음성",
      "단양",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-43"],
  },
  {
    regionCode: "KR-30",
    regionName: "대전",
    provinceName: "대전광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-30"],
    aliases: ["대전광역시", "대전"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-30"],
  },
  {
    regionCode: "KR-45",
    regionName: "전북",
    provinceName: "전북특별자치도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-45"],
    aliases: [
      "전북특별자치도",
      "전라북도",
      "전북",
      "전주",
      "군산",
      "익산",
      "정읍",
      "남원",
      "김제",
      "완주",
      "진안",
      "무주",
      "장수",
      "임실",
      "순창",
      "고창",
      "부안",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-45"],
  },
  {
    regionCode: "KR-29",
    regionName: "광주",
    provinceName: "광주광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-29"],
    aliases: ["광주광역시", "광주"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-29"],
  },
  {
    regionCode: "KR-46",
    regionName: "전남",
    provinceName: "전라남도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-46"],
    aliases: [
      "전라남도",
      "전남",
      "목포",
      "여수",
      "순천",
      "나주",
      "광양",
      "담양",
      "곡성",
      "구례",
      "고흥",
      "보성",
      "화순",
      "장흥",
      "강진",
      "해남",
      "영암",
      "무안",
      "함평",
      "영광",
      "장성",
      "완도",
      "진도",
      "신안",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-46"],
  },
  {
    regionCode: "KR-47",
    regionName: "경북",
    provinceName: "경상북도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-47"],
    aliases: [
      "경상북도",
      "경북",
      "포항",
      "경주",
      "김천",
      "안동",
      "구미",
      "영주",
      "영천",
      "상주",
      "문경",
      "경산",
      "군위",
      "의성",
      "청송",
      "영양",
      "영덕",
      "청도",
      "고령",
      "성주",
      "칠곡",
      "예천",
      "봉화",
      "울진",
      "울릉",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-47"],
  },
  {
    regionCode: "KR-27",
    regionName: "대구",
    provinceName: "대구광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-27"],
    aliases: ["대구광역시", "대구"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-27"],
  },
  {
    regionCode: "KR-48",
    regionName: "경남",
    provinceName: "경상남도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-48"],
    aliases: [
      "경상남도",
      "경남",
      "창원",
      "진주",
      "통영",
      "사천",
      "김해",
      "밀양",
      "거제",
      "양산",
      "의령",
      "함안",
      "창녕",
      "고성",
      "남해",
      "하동",
      "산청",
      "함양",
      "거창",
      "합천",
    ],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-48"],
  },
  {
    regionCode: "KR-31",
    regionName: "울산",
    provinceName: "울산광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-31"],
    aliases: ["울산광역시", "울산"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-31"],
  },
  {
    regionCode: "KR-26",
    regionName: "부산",
    provinceName: "부산광역시",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-26"],
    aliases: ["부산광역시", "부산"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-26"],
  },
  {
    regionCode: "KR-49",
    regionName: "제주",
    provinceName: "제주특별자치도",
    pathId: VOLUNTEER_REGION_PATH_IDS["KR-49"],
    aliases: ["제주특별자치도", "제주도", "제주", "서귀포"],
    ...VOLUNTEER_REGION_SVG_PATHS["KR-49"],
  },
] as const

export const VOLUNTEER_REGION_BY_CODE = new Map(
  VOLUNTEER_REGION_DEFINITIONS.map((region) => [region.regionCode, region]),
)

const volunteerRegionAliasEntries = VOLUNTEER_REGION_DEFINITIONS.flatMap((region) =>
  region.aliases.map((alias) => ({
    regionCode: region.regionCode,
    alias: normalizeRegionLookupValue(alias),
  })),
).sort((left, right) => right.alias.length - left.alias.length)

function normalizeRegionLookupValue(value: string | null | undefined) {
  return value?.toLowerCase().replace(/\s+/g, "").replace(/[()\-_,./]/g, "") ?? ""
}

function createEmptyRegionStatus(region: VolunteerRegionDefinition): VolunteerRegionStatus {
  return {
    regionCode: region.regionCode,
    regionName: region.regionName,
    provinceName: region.provinceName,
    visited: false,
  }
}

function createSortKey(activity: RegionActivityLike) {
  const activityDateKey = normalizeDateSortKey(activity.activityDate)
  if (activityDateKey) {
    return activityDateKey
  }

  return normalizeDateSortKey(activity.createdAt) ?? "0000-00-00"
}

function normalizeDateSortKey(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  const normalized = trimmed.replace(/[./]/g, "-")
  const datePrefix = normalized.match(/\d{4}-\d{2}-\d{2}/)?.[0]
  if (datePrefix) {
    return datePrefix
  }

  const years = normalized.match(/\d{4}/g)
  if (years?.length) {
    return `${years[years.length - 1]}-12-31`
  }

  return null
}

export function getVolunteerRegionDisplayName(region: Pick<VolunteerRegionStatus, "regionName" | "provinceName">) {
  return region.provinceName ?? region.regionName
}

export function formatVolunteerRegionDate(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return "기록 없음"
  }

  const datePrefix = trimmed.replace(/[./]/g, "-").match(/^\d{4}-\d{2}-\d{2}/)?.[0]
  if (datePrefix) {
    const date = new Date(`${datePrefix}T00:00:00`)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date)
    }
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}년`
  }

  return trimmed
}

export function inferVolunteerRegionCodeFromLocation(location: string | null | undefined) {
  const normalizedLocation = normalizeRegionLookupValue(location)
  if (!normalizedLocation) {
    return null
  }

  const matched = volunteerRegionAliasEntries.find((entry) => normalizedLocation.includes(entry.alias))
  return matched?.regionCode ?? null
}

export function buildVolunteerRegionStatuses(activities: RegionActivityLike[]): VolunteerRegionBuildMeta {
  const statuses = VOLUNTEER_REGION_DEFINITIONS.map(createEmptyRegionStatus)
  const statusByCode = new Map(statuses.map((status) => [status.regionCode, status]))
  const latestSortKeyByCode = new Map<string, string>()
  let mappedActivityCount = 0
  let unmappedActivityCount = 0

  activities.forEach((activity) => {
    const regionCode = inferVolunteerRegionCodeFromLocation(activity.location)
    if (!regionCode) {
      unmappedActivityCount += 1
      return
    }

    const status = statusByCode.get(regionCode)
    if (!status) {
      unmappedActivityCount += 1
      return
    }

    mappedActivityCount += 1
    status.visited = true
    status.visitCount = (status.visitCount ?? 0) + 1

    const nextSortKey = createSortKey(activity)
    const currentSortKey = latestSortKeyByCode.get(regionCode)
    if (!currentSortKey || nextSortKey > currentSortKey) {
      latestSortKeyByCode.set(regionCode, nextSortKey)
      status.latestVisitedAt = activity.activityDate?.trim() || activity.createdAt
      status.latestActivityTitle = activity.activityId
    }
  })

  const visitedRegionCount = statuses.filter((status) => status.visited).length

  return {
    statuses,
    visitedRegionCount,
    mappedActivityCount,
    unmappedActivityCount,
  }
}
