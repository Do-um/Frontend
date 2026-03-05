export type ApiEnvelope<T> = {
  data: T
  success: boolean
  error: { code: string; message: string } | null
}

export type IntroduceRecord = {
  id: number
  activityId: string
  description: string
  activityImages: string[]
  createdAt: string
  updatedAt: string
}

export type IntroduceCardItem = {
  id: string
  title: string
  description: string
  imageUrl: string
  createdAt: string
  badge: string
}

type IntroduceKind = "activity" | "project"

const PROJECT_KEYWORDS = ["project", "프로젝트", "해커톤", "hackathon"]
const BADGE_PATTERN = /(\d+\s*조|[가-힣]{1,8}\s*팀|team\s*\d+)/i

function resolveIntroduceApiBase() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080"
  )
    .trim()
    .replace(/\/+$/, "")
}

function toAbsoluteImageUrl(imageUrl: string | undefined, apiBase: string) {
  if (!imageUrl) {
    return "/placeholder.svg"
  }

  if (/^(https?:)?\/\//i.test(imageUrl)) {
    return imageUrl
  }

  if (imageUrl.startsWith("/")) {
    return `${apiBase}${imageUrl}`
  }

  return `${apiBase}/${imageUrl}`
}

function isProjectRecord(record: IntroduceRecord) {
  const source = `${record.activityId ?? ""} ${record.description ?? ""}`.toLowerCase()
  return PROJECT_KEYWORDS.some((keyword) => source.includes(keyword))
}

function extractBadge(record: IntroduceRecord, kind: IntroduceKind) {
  const source = `${record.activityId ?? ""} ${record.description ?? ""}`
  const matched = source.match(BADGE_PATTERN)

  if (matched?.[1]) {
    return matched[1].replace(/\s+/g, "")
  }

  return kind === "project" ? "프로젝트" : "주요활동"
}

function mapToCardItem(record: IntroduceRecord, apiBase: string, kind: IntroduceKind): IntroduceCardItem {
  return {
    id: String(record.id),
    title: record.activityId?.trim() || "제목 없음",
    description: record.description?.trim() || "설명이 아직 등록되지 않았습니다.",
    imageUrl: toAbsoluteImageUrl(record.activityImages?.[0], apiBase),
    createdAt: record.createdAt,
    badge: extractBadge(record, kind),
  }
}

export async function fetchIntroduceCardItems(kind: IntroduceKind): Promise<IntroduceCardItem[]> {
  const apiBase = resolveIntroduceApiBase()

  const res = await fetch(`${apiBase}/api/introduce`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`활동 API 응답 오류: ${res.status} ${res.statusText}`)
  }

  const envelope = (await res.json()) as ApiEnvelope<IntroduceRecord[]>
  if (!envelope?.success) {
    const message = envelope?.error?.message ?? "활동 API 처리에 실패했습니다."
    throw new Error(message)
  }

  const records = envelope.data ?? []
  const filtered = records.filter((record) => (kind === "project" ? isProjectRecord(record) : !isProjectRecord(record)))

  return filtered
    .map((record) => mapToCardItem(record, apiBase, kind))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
