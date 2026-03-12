"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Images,
  MapPin,
  PencilLine,
  Plus,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ActivityEditorDialog } from "@/components/pages/activity-editor-dialog"
import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAdminSession } from "@/hooks/use-admin-session"
import { fetchActivities, type ActivityItem } from "@/lib/content-api"
import { hasApiBaseUrl } from "@/lib/api"

const PAGE_SIZE = 6

function formatDate(value?: string | null) {
  if (!value) {
    return "미정"
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return "날짜 미정"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function getActivityTimeValue(activity: ActivityItem) {
  const normalized = activity.activityDate
    ? `${activity.activityDate}T00:00:00`
    : activity.createdAt
  const timestamp = new Date(normalized).getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
}

function formatParticipantSummary(activity: ActivityItem) {
  if (activity.participantNames.length) {
    if (activity.participantNames.length === 1) {
      return activity.participantNames[0]
    }

    return `${activity.participantNames[0]} 외 ${activity.participantNames.length - 1}명`
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
  if (normalized.includes("스터디") || normalized.includes("study")) {
    return { href: "/activities/study", label: "스터디" }
  }
  if (normalized.includes("모각코")) {
    return { href: "/activities/mogakko", label: "모각코" }
  }

  return { href: "/activities", label: "주요활동" }
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
    <div className="rounded-2xl border border-[#d7e5ea] bg-white/82 p-4 shadow-[0_10px_30px_rgba(47,74,91,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8f99]">
          <Icon className="mt-0.5 size-3.5 shrink-0" />
          <span>{label}</span>
        </div>
        <p className="max-w-[14rem] text-right text-base font-semibold leading-6 text-[#223541]">{value}</p>
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
  const target = inferActivityLink(activity.activityId)

  return (
    <button type="button" onClick={() => onSelect(activity)} className="group w-full text-left">
      <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 py-0 shadow-[0_20px_40px_rgba(37,74,91,0.08)] backdrop-blur-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(37,74,91,0.14)]">
        <div className="relative aspect-[1.6/1] overflow-hidden bg-[linear-gradient(135deg,#dcecf2,#edf4e8)]">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={activity.activityId}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Image src="/placeholder.svg" alt="" width={96} height={96} className="opacity-55" />
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#567289] shadow-sm">
            {target.label}
          </span>
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#1f2730]/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <span>상세보기</span>
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#1f2a33]">{activity.activityId}</h2>
            <p className="mt-2 overflow-hidden text-sm leading-6 text-[#60717d] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {activity.description}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#74838c]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(activity.activityDate ?? activity.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <Images className="size-3.5" />
              {activity.activityImages.length}장
            </span>
            {formatParticipantSummary(activity) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
                <Users className="size-3.5" />
                {formatParticipantSummary(activity)}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#74838c]">
            <div className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              <span>{formatDate(activity.createdAt)}</span>
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

export function ActivitiesLandingPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest")
  const [page, setPage] = useState(1)
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit"
    activity: ActivityItem | null
  } | null>(null)
  const { isAdmin } = useAdminSession()

  useEffect(() => {
    if (!hasApiBaseUrl()) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.")
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

  const sortedActivities = [...activities].sort((left, right) => {
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

  const selectedActivityTarget = selectedActivity ? inferActivityLink(selectedActivity.activityId) : null
  const selectedImages = selectedActivity?.activityImages ?? []
  const activeImage = selectedImages[activeImageIndex] ?? selectedImages[0]

  function openActivityDetail(activity: ActivityItem) {
    setSelectedActivity(activity)
    setActiveImageIndex(0)
  }

  function handleActivitySaved(savedActivity: ActivityItem) {
    setActivities((current) => {
      const hasExisting = current.some((activity) => activity.id === savedActivity.id)
      if (!hasExisting) {
        return [savedActivity, ...current]
      }

      return current.map((activity) => (activity.id === savedActivity.id ? savedActivity : activity))
    })
    openActivityDetail(savedActivity)
  }

  return (
    <div className="min-h-screen bg-[#eef2ec] text-[#1f2730]">
      <div
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/home-bg.png')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.72),_rgba(238,242,236,0.94)_60%)]" />
        <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full border border-white/50" />
        <div className="pointer-events-none absolute -right-24 top-36 h-[30rem] w-[30rem] rounded-full border border-white/35" />
        <div className="pointer-events-none absolute -left-24 top-[28rem] h-80 w-80 rounded-full bg-[#d9edf4]/40 blur-3xl" />

        <div className="relative">
          <HeaderNav />

          <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
            <section className="flex flex-col items-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/70 shadow-[0_18px_50px_rgba(65,106,133,0.12)] backdrop-blur-sm">
                <Image src="/doum-logo-large.png" alt="DO,UM 로고" width={62} height={88} priority />
              </div>
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#6a7d88] uppercase">
                <Sparkles className="size-3.5" />
                Activity Archive
              </p>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-black sm:text-5xl">Our Activity</h1>
              <p className="mt-4 text-base text-[#677680] sm:text-lg">우리가 해온 길, 우리가 가는 길</p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setSortOrder((current) => (current === "latest" ? "oldest" : "latest"))
                    setPage(1)
                  }}
                  className="rounded-full bg-[#7cb8e8] px-5 text-white shadow-sm hover:bg-[#65a6d8]"
                >
                  {sortOrder === "latest" ? "최신순" : "오래된순"}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/70 bg-white/75 px-5 text-[#355264] shadow-sm hover:bg-white"
                >
                  <Link href="/activities/projects">
                    프로젝트 보기
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </section>

            <section className="mt-14 rounded-[36px] border border-white/70 bg-white/68 p-5 shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:p-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#6f8590]">DO,UM STORYBOARD</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1d2a34]">활동 기록</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-[#72828c]">
                    총 <span className="font-semibold text-[#294255]">{activities.length}</span>개의 활동
                  </p>
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
                    프론트 `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` 형태로 설정해 주세요.
                  </p>
                </Card>
              ) : null}

              {!loading && !error && !activities.length ? (
                <Card className="rounded-[28px] border border-[#dbe6eb] bg-white/85 p-8 text-center shadow-none">
                  <h3 className="text-xl font-bold text-[#213542]">등록된 활동이 없습니다.</h3>
                  <p className="mt-3 text-sm leading-6 text-[#677983]">
                    `/api/introduce`에 데이터가 들어오면 이 영역이 바로 카드형 기록 보드로 채워집니다.
                  </p>
                </Card>
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
                            src={activeImage}
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
                                  src={imageUrl}
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

                    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                      <h2 className="text-3xl font-black tracking-tight text-[#15212b]">
                        {selectedActivity.activityId}
                      </h2>
                      {isAdmin ? (
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
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#576a75] sm:text-base">
                      {selectedActivity.description}
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <ActivityMetaItem
                        icon={CalendarDays}
                        label="Activity Date"
                        value={formatDate(selectedActivity.activityDate ?? selectedActivity.createdAt)}
                      />
                      <ActivityMetaItem
                        icon={Users}
                        label="Participants"
                        value={
                          selectedActivity.participantNames.length
                            ? selectedActivity.participantNames.join(", ")
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
                      <ActivityMetaItem
                        icon={Images}
                        label="Gallery"
                        value={`${selectedImages.length}장의 활동 사진`}
                      />
                    </div>

                    <div className="mt-8 rounded-[28px] border border-[#dae6eb] bg-white/78 p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
                        기록 메타데이터
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-[#4f6470]">
                        <div className="flex items-center justify-between gap-3 border-b border-[#edf1f3] pb-3">
                          <span>등록일</span>
                          <span className="font-medium text-[#223541]">{formatDate(selectedActivity.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>최근 수정일</span>
                          <span className="font-medium text-[#223541]">{formatDate(selectedActivity.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedActivity.participantNames.length ? (
                      <div className="mt-8 rounded-[28px] border border-[#dae6eb] bg-white/78 p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
                          참여자 목록
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedActivity.participantNames.map((name) => (
                            <span
                              key={name}
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
