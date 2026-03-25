"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Images,
  MapPin,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"

import { MarkdownContent } from "@/components/common/markdown-content"
import { ActivityEditorDialog } from "@/components/pages/activity-editor-dialog"
import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAdminSession } from "@/hooks/use-admin-session"
import { deleteActivity, fetchActivities, type ActivityItem } from "@/lib/content-api"
import { resolveMediaUrl } from "@/lib/media"
import { hasSupabaseEnv } from "@/lib/supabase"
import { getStartYearFromRangeValue, getYearsFromRangeValue, sortYearsForFilter } from "@/lib/year-filter"

const PAGE_SIZE = 6
type ActivityArchiveMode = "all" | "study"

type ActivitiesLandingPageProps = {
  mode?: ActivityArchiveMode
  archiveLabel?: string
  heroTitle?: string
  heroDescription?: string
  sectionEyebrow?: string
  sectionTitle?: string
  emptyTitle?: string
  emptyDescription?: string
}

function normalizeActivityDateToken(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`
  }

  const normalized = trimmed.replace(/\./g, "-").replace(/\//g, "-")
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

  if (isoDatePattern.test(normalized)) {
    return normalized
  }

  const dateTimePrefix = normalized.slice(0, 10)
  if (isoDatePattern.test(dateTimePrefix)) {
    return dateTimePrefix
  }

  return null
}

function parseActivityDateRange(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return {
      startDate: null,
      endDate: null,
    }
  }

  const parts = trimmed.split("~").map((part) => part.trim()).filter(Boolean)

  if (parts.length >= 2) {
    return {
      startDate: normalizeActivityDateToken(parts[0]),
      endDate: normalizeActivityDateToken(parts[1]),
    }
  }

  return {
    startDate: normalizeActivityDateToken(trimmed),
    endDate: null,
  }
}

function formatAbsoluteDate(value?: string | null) {
  if (!value) {
    return "미정"
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return "미정"
  }

  // Preserve free-form ranges like "2024 ~ 2025" instead of forcing date parsing.
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDatePattern.test(trimmed) && !trimmed.includes("T")) {
    return trimmed
  }

  const normalized = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return trimmed
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function formatActivityPeriod(value?: string | null) {
  if (!value) {
    return "미정"
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return "미정"
  }

  const { startDate, endDate } = parseActivityDateRange(trimmed)

  if (startDate && endDate) {
    const startYear = startDate.slice(0, 4)
    const endYear = endDate.slice(0, 4)

    return startYear === endYear ? startYear : `${startYear} ~ ${endYear}`
  }

  if (startDate) {
    return startDate.slice(0, 4)
  }

  return trimmed
}

function getActivityTimeValue(activity: ActivityItem) {
  const { startDate } = parseActivityDateRange(activity.activityDate)
  const fallbackStartYear = getStartYearFromRangeValue(activity.activityDate)
  const normalized = startDate ? `${startDate}T00:00:00` : fallbackStartYear ? `${fallbackStartYear}-01-01T00:00:00` : activity.createdAt
  const timestamp = new Date(normalized).getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getActivityYears(activity: ActivityItem) {
  return getYearsFromRangeValue(activity.activityDate || activity.createdAt)
}

function formatParticipantNames(names: string[], maxVisible = 3) {
  if (!names.length) {
    return ""
  }

  if (names.length <= maxVisible) {
    return names.join(", ")
  }

  return `${names.slice(0, maxVisible).join(", ")} 외 ${names.length - maxVisible}명`
}

function formatParticipantSummary(activity: ActivityItem) {
  if (activity.participantNames.length) {
    return formatParticipantNames(activity.participantNames)
  }

  if (activity.participantCount !== null && activity.participantCount !== undefined) {
    return `${activity.participantCount}명 참여`
  }

  return ""
}

function inferActivityLink(activityId: string) {
  const normalized = activityId.toLowerCase()

  if (normalized.includes("프로젝트") || normalized.includes("project")) {
    return { href: "/activities/projects", label: "프로젝트" }
  }
  return { href: "/activities", label: "주요활동" }
}

function inferActivityLinkByType(activity: ActivityItem) {
  if (activity.activityType === "STUDY") {
    return { href: "/activities/study", label: "스터디" }
  }

  return inferActivityLink(activity.activityId)
}

function matchesArchiveMode(activity: ActivityItem, mode: ActivityArchiveMode) {
  if (mode === "all") {
    return activity.activityType === "MAIN"
  }

  return activity.activityType === "STUDY"
}

function ActivityMetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex min-h-[96px] rounded-2xl border border-[#d7e5ea] bg-white/82 p-4 shadow-[0_10px_30px_rgba(47,74,91,0.06)]">
      <div className="flex h-full w-full items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8f99]">
          <Icon className="mt-0.5 size-3.5 shrink-0" />
          <span>{label}</span>
        </div>
        <p className="max-w-[14rem] overflow-hidden text-right text-base font-semibold leading-6 text-[#223541] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {value}
        </p>
      </div>
    </div>
  )
}

function ActivityCard({
  activity,
  onSelect,
}: {
  activity: ActivityItem
  onSelect: (activity: ActivityItem) => void
}) {
  const primaryImage = activity.activityImages[0]
  const target = inferActivityLinkByType(activity)
  const participantSummary = formatParticipantSummary(activity)
  const activityYears = getActivityYears(activity)

  return (
    <button type="button" onClick={() => onSelect(activity)} className="group flex h-full w-full text-left">
      <Card className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/85 py-0 shadow-[0_20px_40px_rgba(37,74,91,0.08)] backdrop-blur-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(37,74,91,0.14)]">
        <div className="relative aspect-[1.6/1] overflow-hidden bg-[linear-gradient(135deg,#dcecf2,#edf4e8)]">
          {primaryImage ? (
            <img
              src={resolveMediaUrl(primaryImage) || ""}
              alt={activity.activityId}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Image src="/placeholder.svg" alt="" width={96} height={96} className="opacity-55" />
            </div>
          )}
          <div className="absolute left-4 top-4 flex max-w-[70%] flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#567289] shadow-sm">
              {target.label}
            </span>
            {activityYears.map((year) => (
              <span
                key={`${activity.id}-${year}`}
                className="rounded-full border border-white/80 bg-[#7cb8e8]/90 px-3 py-1 text-xs font-semibold text-white shadow-sm"
              >
                {year}
              </span>
            ))}
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#1f2730]/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <span>상세보기</span>
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="min-w-0 min-h-[6.25rem]">
            <h2 className="overflow-hidden text-lg font-bold leading-7 text-[#1f2a33] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {activity.activityId}
            </h2>
            <MarkdownContent
              content={activity.description}
              compact
              className="mt-2 max-h-[3rem] overflow-hidden text-sm leading-6 text-[#60717d]"
            />
          </div>

          <div className="mt-5 flex min-h-[5rem] flex-wrap content-start items-start gap-2 text-xs text-[#74838c]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <CalendarDays className="size-3.5" />
              {formatActivityPeriod(activity.activityDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <Images className="size-3.5" />
              {activity.activityImages.length}장
            </span>
            {participantSummary ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
                <Users className="size-3.5" />
                <span className="max-w-[12rem] truncate sm:max-w-[14rem]">{participantSummary}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-[#74838c]">
            <div className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              <span>{formatAbsoluteDate(activity.createdAt)}</span>
            </div>
            <div className="text-[#4d6473]">클릭해서 상세 보기</div>
          </div>
        </div>
      </Card>
    </button>
  )
}

function ActivityCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/80 py-0">
      <div className="aspect-[1.6/1] animate-pulse bg-[#dfe9ee]" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-[#e8eef1]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[#eef2f4]" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#eef2f4]" />
        <div className="flex justify-between">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[#eef2f4]" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-[#eef2f4]" />
        </div>
      </div>
    </Card>
  )
}

export function ActivitiesLandingPage({
  mode = "all",
  archiveLabel = "Activity Archive",
  heroTitle = "Our Activity",
  heroDescription = "Fun, Value, Learning = Together",
  sectionEyebrow = "DO,UM STORYBOARD",
  sectionTitle = "활동 기록",
  emptyTitle = "등록된 활동이 없습니다.",
  emptyDescription = "`introduce`와 `introduce_activity_image` 테이블에 데이터가 들어오면 이 영역이 바로 카드형 기록 보드로 채워집니다.",
}: ActivitiesLandingPageProps = {}) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest")
  const [selectedYear, setSelectedYear] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null)
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit"
    activity: ActivityItem | null
  } | null>(null)
  const { isAdmin } = useAdminSession()

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setError("Supabase 환경변수 설정이 필요합니다.")
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadActivities() {
      try {
        const data = await fetchActivities()
        if (!cancelled) {
          setActivities(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "활동 데이터를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadActivities()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredActivities = activities.filter((activity) => matchesArchiveMode(activity, mode))

  const availableYears = useMemo(
    () => sortYearsForFilter(filteredActivities.flatMap((activity) => getActivityYears(activity))),
    [filteredActivities],
  )

  const yearFilteredActivities = filteredActivities.filter((activity) => {
    if (selectedYear === "all") {
      return true
    }

    return getActivityYears(activity).includes(selectedYear)
  })

  const sortedActivities = [...yearFilteredActivities].sort((left, right) => {
    const leftTime = getActivityTimeValue(left)
    const rightTime = getActivityTimeValue(right)
    return sortOrder === "latest" ? rightTime - leftTime : leftTime - rightTime
  })

  const totalPages = Math.max(1, Math.ceil(sortedActivities.length / PAGE_SIZE))
  const pageStart = (page - 1) * PAGE_SIZE
  const currentActivities = sortedActivities.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    if (selectedYear !== "all" && !availableYears.includes(selectedYear)) {
      setSelectedYear("all")
    }
  }, [availableYears, selectedYear])

  const selectedActivityTarget = selectedActivity ? inferActivityLinkByType(selectedActivity) : null
  const selectedImages = selectedActivity?.activityImages ?? []
  const activeImage = selectedImages[activeImageIndex] ?? selectedImages[0]
  const selectedActivityYears = selectedActivity ? getActivityYears(selectedActivity) : []
  function openActivityDetail(activity: ActivityItem) {
    setSelectedActivity(activity)
    setActiveImageIndex(0)
  }

  function handleActivitySaved(savedActivity: ActivityItem) {
    setActionError("")
    setActivities((current) => {
      const hasExisting = current.some((activity) => activity.id === savedActivity.id)
      if (!hasExisting) {
        return [savedActivity, ...current]
      }

      return current.map((activity) => (activity.id === savedActivity.id ? savedActivity : activity))
    })
    openActivityDetail(savedActivity)
  }

  async function handleActivityDelete(target: ActivityItem) {
    if (!window.confirm(`"${target.activityId}" 활동을 삭제할까요?`)) {
      return
    }

    setActionError("")
    setDeletingActivityId(target.id)

    try {
      await deleteActivity(target.id)
      setActivities((current) => current.filter((activity) => activity.id !== target.id))

      if (selectedActivity?.id === target.id) {
        setSelectedActivity(null)
        setActiveImageIndex(0)
      }

      if (editorState?.activity?.id === target.id) {
        setEditorState(null)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "활동 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingActivityId(null)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-[#1f2730]"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-white/8" />
        <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full border border-white/50" />
        <div className="pointer-events-none absolute -right-24 top-36 h-[30rem] w-[30rem] rounded-full border border-white/35" />
        <div className="pointer-events-none absolute -left-24 top-[28rem] h-80 w-80 rounded-full bg-[#d9edf4]/20 blur-3xl" />

        <div className="relative">
          <HeaderNav />

          <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
            <section className="flex flex-col items-center text-center">
              <div className="animate-float relative flex h-28 w-28 items-center justify-center rounded-full bg-white/70 shadow-[0_18px_50px_rgba(65,106,133,0.12)] backdrop-blur-sm">
                <Image src="/doum-logo-large.png" alt="DO,UM 로고" width={62} height={88} priority />
              </div>
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#6a7d88] uppercase">
                <Sparkles className="size-3.5" />
                {archiveLabel}
              </p>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-black sm:text-5xl">{heroTitle}</h1>
              <p className="mt-4 text-base text-[#677680] sm:text-lg">{heroDescription}</p>
            </section>

            <section className="mt-14 rounded-[36px] border border-white/70 bg-white/68 p-5 shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:p-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#6f8590]">{sectionEyebrow}</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1d2a34]">{sectionTitle}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-[#72828c]">
                    총 <span className="font-semibold text-[#294255]">{yearFilteredActivities.length}</span>개의 활동
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSortOrder((current) => (current === "latest" ? "oldest" : "latest"))
                      setPage(1)
                    }}
                    className={`rounded-full px-4 shadow-sm ${
                      sortOrder === "latest"
                        ? "border-[#85b7e7] bg-[#7cb8e8] text-white hover:bg-[#65a6d8] hover:text-white"
                        : "border-[#d7e5ee] bg-white/80 text-[#355264] hover:bg-white"
                    }`}
                  >
                    {sortOrder === "latest" ? "최신순" : "오래된순"}
                  </Button>
                  {isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditorState({ mode: "create", activity: null })}
                      className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                    >
                      <Plus className="size-4" />
                      추가하기
                    </Button>
                  ) : null}
                </div>
              </div>

              {availableYears.length ? (
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedYear("all")
                      setPage(1)
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedYear === "all"
                        ? "bg-[#1f2730] text-white shadow-sm"
                        : "border border-[#d7e5ee] bg-white/80 text-[#355264] hover:bg-white"
                    }`}
                  >
                    전체
                  </button>
                  {availableYears.map((year) => (
                    <button
                      key={`${mode}-${year}`}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year)
                        setPage(1)
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selectedYear === year
                          ? "bg-[#7cb8e8] text-white shadow-sm"
                          : "border border-[#d7e5ee] bg-white/80 text-[#355264] hover:bg-white"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : null}

              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <ActivityCardSkeleton key={index} />
                  ))}
                </div>
              ) : null}

              {!loading && error ? (
                <Card className="rounded-[28px] border border-[#dbe6eb] bg-white/85 p-8 text-center shadow-none">
                  <h3 className="text-xl font-bold text-[#213542]">활동 데이터를 불러오지 못했습니다.</h3>
                  <p className="mt-3 text-sm leading-6 text-[#677983]">{error}</p>
                  <p className="mt-2 text-sm text-[#8a98a0]">
                    프론트 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 설정해 주세요.
                  </p>
                </Card>
              ) : null}

              {!loading && !error && !yearFilteredActivities.length ? (
                <Card className="rounded-[28px] border border-[#dbe6eb] bg-white/85 p-8 text-center shadow-none">
                  <h3 className="text-xl font-bold text-[#213542]">{emptyTitle}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#677983]">{emptyDescription}</p>
                </Card>
              ) : null}

              {!loading && !error && actionError ? (
                <p className="rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#9a3b3b]">
                  {actionError}
                </p>
              ) : null}

              {!loading && !error && currentActivities.length ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {currentActivities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} onSelect={openActivityDetail} />
                    ))}
                  </div>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      className="rounded-full px-3 py-2 text-[#495a66] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      이전
                    </button>

                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1
                      const isCurrent = pageNumber === page

                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={`h-10 w-10 rounded-full transition ${
                            isCurrent
                              ? "bg-[#1f2730] text-white shadow-sm"
                              : "text-[#495a66] hover:bg-white/70"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}

                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      className="rounded-full px-3 py-2 text-[#495a66] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      다음
                    </button>
                  </div>
                </>
              ) : null}
            </section>
          </main>

          <Dialog
            open={Boolean(selectedActivity)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedActivity(null)
                setActiveImageIndex(0)
              }
            }}
          >
            <DialogContent
              className="max-h-[min(92vh,960px)] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] overflow-hidden rounded-[32px] border-0 bg-[#f5f7f2] p-0 shadow-[0_40px_120px_rgba(24,39,54,0.32)] sm:w-[min(1120px,calc(100vw-2rem))] sm:!max-w-[1120px] xl:!max-w-[1180px]"
              showCloseButton
            >
              {selectedActivity ? (
                <div className="grid max-h-[min(92vh,960px)] grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.08fr)_390px]">
                  <div className="border-b border-white/70 bg-[linear-gradient(180deg,#d9ebf5_0%,#eff4ea_100%)] p-5 xl:border-b-0 xl:border-r xl:p-7">
                    <DialogTitle className="sr-only">{selectedActivity.activityId}</DialogTitle>
                    <DialogDescription className="sr-only">
                      활동 사진과 설명, 날짜, 장소, 참여 인원 정보를 보여주는 상세 모달
                    </DialogDescription>

                    <div className="flex h-full flex-col gap-4">
                      <div className="relative overflow-hidden rounded-[28px] bg-white/65 shadow-[0_24px_60px_rgba(44,71,88,0.12)]">
                        {activeImage ? (
                          <img
                            src={resolveMediaUrl(activeImage) || ""}
                            alt={`${selectedActivity.activityId} 대표 이미지`}
                            className="h-[280px] w-full object-cover sm:h-[360px] xl:h-[520px]"
                          />
                        ) : (
                          <div className="flex h-[280px] items-center justify-center sm:h-[360px] xl:h-[520px]">
                            <Image src="/placeholder.svg" alt="" width={120} height={120} className="opacity-45" />
                          </div>
                        )}
                        <div className="absolute left-4 top-4 rounded-full bg-[#1f2730]/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                          총 {selectedImages.length}장
                        </div>
                      </div>

                      {selectedImages.length > 1 ? (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {selectedImages.map((imageUrl, index) => {
                            const isActive = index === activeImageIndex

                            return (
                              <button
                                key={`${imageUrl}-${index}`}
                                type="button"
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-24 shrink-0 overflow-hidden rounded-[20px] border bg-white/80 transition sm:w-28 ${
                                  isActive
                                    ? "border-[#1f2730] shadow-[0_16px_30px_rgba(31,39,48,0.18)]"
                                    : "border-white/70 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(47,74,91,0.12)]"
                                }`}
                              >
                                <img
                                  src={resolveMediaUrl(imageUrl) || ""}
                                  alt={`${selectedActivity.activityId} 썸네일 ${index + 1}`}
                                  className="h-24 w-full object-cover sm:h-28"
                                />
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-y-auto p-6 sm:p-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#617783]">
                      <Sparkles className="size-3.5" />
                      Activity Detail
                    </div>

                    {selectedActivityYears.length ? (
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {selectedActivityYears.map((year) => (
                          <span
                            key={`${selectedActivity.id}-${year}`}
                            className="rounded-full border border-[#d7e5ee] bg-[#eef6fb] px-3 py-1 text-xs font-semibold text-[#44657b]"
                          >
                            {year}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                      <h2 className="text-3xl font-black tracking-tight text-[#15212b]">
                        {selectedActivity.activityId}
                      </h2>
                      {isAdmin ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedActivity(null)
                              setEditorState({ mode: "edit", activity: selectedActivity })
                            }}
                            className="rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                          >
                            <PencilLine className="size-4" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleActivityDelete(selectedActivity)}
                            disabled={deletingActivityId === selectedActivity.id}
                            className="rounded-full border-[#efc9c9] bg-white px-4 text-[#a44a4a] hover:bg-[#fff5f5]"
                          >
                            <Trash2 className="size-4" />
                            {deletingActivityId === selectedActivity.id ? "삭제 중..." : "삭제"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <MarkdownContent
                      content={selectedActivity.description}
                      className="mt-4 text-sm leading-7 text-[#576a75] sm:text-base"
                    />

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <ActivityMetaItem
                        icon={CalendarDays}
                        label="Activity Date"
                        value={formatActivityPeriod(selectedActivity.activityDate)}
                      />
                      <ActivityMetaItem
                        icon={Users}
                        label="Participants"
                        value={
                          selectedActivity.participantNames.length
                            ? formatParticipantNames(selectedActivity.participantNames)
                            : selectedActivity.participantCount !== null &&
                                selectedActivity.participantCount !== undefined
                              ? `${selectedActivity.participantCount}명`
                              : "참여 인원 정보 없음"
                        }
                      />
                      <ActivityMetaItem
                        icon={MapPin}
                        label="Location"
                        value={selectedActivity.location ?? "활동 장소 정보 없음"}
                      />
                    </div>

                    {selectedActivity.participantNames.length ? (
                      <div className="mt-8 rounded-[28px] border border-[#dae6eb] bg-white/78 p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
                          참여자 목록
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedActivity.participantNames.map((name, index) => (
                            <span
                              key={`${name}-${index}`}
                              className="rounded-full bg-[#eef4f7] px-3 py-1.5 text-sm font-medium text-[#294255]"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedActivityTarget ? (
                      <div className="mt-8">
                        <Button
                          asChild
                          className="rounded-full bg-[#1f2730] px-5 text-white shadow-sm hover:bg-[#2c3743]"
                        >
                          <Link href={selectedActivityTarget.href}>
                            관련 페이지 이동
                            <ArrowUpRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>

          <ActivityEditorDialog
            open={Boolean(editorState)}
            mode={editorState?.mode ?? "create"}
            activity={editorState?.activity}
            activityType={mode === "study" ? "STUDY" : "MAIN"}
            onOpenChange={(open) => {
              if (!open) {
                setEditorState(null)
              }
            }}
            onSaved={handleActivitySaved}
          />

          <SiteFooter />
        </div>
      </div>
    </div>
  )
}
