"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { PencilLine, Plus, Trash2 } from "lucide-react"

import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { useAdminSession } from "@/hooks/use-admin-session"
import {
  deleteActivity,
  deleteClubProgram,
  fetchActivities,
  fetchClubContent,
  fetchClubPrograms,
  updateClubContent,
  type ActivityItem,
  type ClubContent,
  type ClubProgramItem,
  type ClubContentWritePayload,
} from "@/lib/content-api"
import { resolveMediaUrl } from "@/lib/media"
import { getStartYearFromRangeValue, getYearsFromRangeValue, sortYearsForFilter } from "@/lib/year-filter"

const ActivityEditorDialog = dynamic(
  () => import("@/components/pages/activity-editor-dialog").then((module) => module.ActivityEditorDialog),
  { ssr: false },
)
const ClubContentEditorDialog = dynamic(
  () => import("@/components/pages/club-content-editor-dialog").then((module) => module.ClubContentEditorDialog),
  { ssr: false },
)
const ClubProgramEditorDialog = dynamic(
  () => import("@/components/pages/club-program-editor-dialog").then((module) => module.ClubProgramEditorDialog),
  { ssr: false },
)

const defaultClubContent: ClubContent = {
  introTitle: "",
  introLead: "",
  introDescription: "",
  heroBannerImageUrl: "",
  activitySectionTitle: "",
  historySectionTitle: "",
  studyCaption: "",
  studyTitle: "",
  learnTitle: "",
  learnDescription: "",
  growTitle: "",
  growDescription: "",
  shareTitle: "",
  shareDescription: "",
  studyImageUrl: "",
  createdAt: null,
  updatedAt: null,
}

const emptyClubContentPayload: ClubContentWritePayload = {
  introTitle: "",
  introLead: "",
  introDescription: "",
  heroBannerImageUrl: "",
  activitySectionTitle: "",
  historySectionTitle: "",
  studyCaption: "",
  studyTitle: "",
  learnTitle: "",
  learnDescription: "",
  growTitle: "",
  growDescription: "",
  shareTitle: "",
  shareDescription: "",
  studyImageUrl: "",
}

function compareActivities(left: ActivityItem, right: ActivityItem) {
  const leftStartYear = Number(getStartYearFromRangeValue(left.activityDate) ?? getStartYearFromRangeValue(left.createdAt) ?? 0)
  const rightStartYear = Number(getStartYearFromRangeValue(right.activityDate) ?? getStartYearFromRangeValue(right.createdAt) ?? 0)

  if (leftStartYear !== rightStartYear) {
    return rightStartYear - leftStartYear
  }

  return right.createdAt.localeCompare(left.createdAt)
}

function getActivityYears(activity: ActivityItem) {
  return getYearsFromRangeValue(activity.activityDate || activity.createdAt)
}

export default function Home() {
  const { isAdmin } = useAdminSession()
  const [clubContent, setClubContent] = useState<ClubContent>(defaultClubContent)
  const [programs, setPrograms] = useState<ClubProgramItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mutationError, setMutationError] = useState("")
  const [selectedActivityYear, setSelectedActivityYear] = useState("all")
  const [contentEditorOpen, setContentEditorOpen] = useState(false)
  const [deletingProgramId, setDeletingProgramId] = useState<number | null>(null)
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null)
  const [deletingClubContent, setDeletingClubContent] = useState(false)
  const [programEditorState, setProgramEditorState] = useState<{
    mode: "create" | "edit"
    program: ClubProgramItem | null
  } | null>(null)
  const [activityEditorState, setActivityEditorState] = useState<{
    mode: "create" | "edit"
    activity: ActivityItem | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHome() {
      setLoading(true)
      setError("")

      try {
        const [nextContent, nextPrograms, nextActivities] = await Promise.all([
          fetchClubContent(),
          fetchClubPrograms(),
          fetchActivities(),
        ])

        if (cancelled) {
          return
        }

        setClubContent(nextContent)
        setPrograms(nextPrograms)
        setActivities(nextActivities)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "동아리 페이지 정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadHome()

    return () => {
      cancelled = true
    }
  }, [])

  const mainActivities = useMemo(() => {
    return activities.filter((activity) => activity.activityType === "MAIN")
  }, [activities])

  const availableActivityYears = useMemo(
    () => sortYearsForFilter(mainActivities.flatMap((activity) => getActivityYears(activity))),
    [mainActivities],
  )

  const displayedActivities = useMemo(() => {
    return mainActivities
      .filter((activity) => selectedActivityYear === "all" || getActivityYears(activity).includes(selectedActivityYear))
      .sort(compareActivities)
      .slice(0, 3)
  }, [mainActivities, selectedActivityYear])

  useEffect(() => {
    if (selectedActivityYear !== "all" && !availableActivityYears.includes(selectedActivityYear)) {
      setSelectedActivityYear("all")
    }
  }, [availableActivityYears, selectedActivityYear])

  function handleProgramSaved(savedProgram: ClubProgramItem) {
    setMutationError("")
    setPrograms((current) =>
      [...current.filter((item) => item.id !== savedProgram.id), savedProgram].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
      ),
    )
  }

  function handleActivitySaved(savedActivity: ActivityItem) {
    setMutationError("")
    setActivities((current) => {
      const hasExisting = current.some((activity) => activity.id === savedActivity.id)
      const nextActivities = hasExisting
        ? current.map((activity) => (activity.id === savedActivity.id ? savedActivity : activity))
        : [savedActivity, ...current]

      return nextActivities.sort(compareActivities)
    })
  }

  async function handleProgramDelete(target: ClubProgramItem) {
    if (!window.confirm(`"${target.title}" 정규 활동을 삭제할까요?`)) {
      return
    }

    setMutationError("")
    setDeletingProgramId(target.id)

    try {
      await deleteClubProgram(target.id)
      setPrograms((current) => current.filter((item) => item.id !== target.id))

      if (programEditorState?.program?.id === target.id) {
        setProgramEditorState(null)
      }
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "정규 활동 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingProgramId(null)
    }
  }

  async function handleActivityDelete(target: ActivityItem) {
    if (!window.confirm(`"${target.activityId}" 히스토리를 삭제할까요?`)) {
      return
    }

    setMutationError("")
    setDeletingActivityId(target.id)

    try {
      await deleteActivity(target.id)
      setActivities((current) => current.filter((item) => item.id !== target.id))

      if (activityEditorState?.activity?.id === target.id) {
        setActivityEditorState(null)
      }
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "히스토리 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingActivityId(null)
    }
  }

  async function handleClubContentDelete() {
    if (!window.confirm("메인 페이지 소개 내용을 모두 삭제할까요?")) {
      return
    }

    setMutationError("")
    setDeletingClubContent(true)

    try {
      const clearedContent = await updateClubContent(emptyClubContentPayload)
      setClubContent(clearedContent)
      setContentEditorOpen(false)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : "메인 페이지 소개 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingClubContent(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      <section className="min-h-screen">
        <HeaderNav />

        <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-8 pb-10 pt-6">
          <div className="flex w-full justify-center">
            <Image
              src={resolveMediaUrl(clubContent.heroBannerImageUrl) || "/hero-banner.png"}
              alt="DO,UM 배너"
              width={1200}
              height={200}
              className="animate-float w-full max-w-6xl object-contain"
              priority
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="rounded-full bg-[#7CB8E8] px-8 py-6 text-base font-semibold text-white shadow-md transition-all hover:bg-[#6AA8D8] hover:shadow-lg"
            >
              시작하기
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border border-gray-300 bg-white/90 p-6 shadow-xl backdrop-blur-sm lg:p-10">
            <div className="mb-10 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{clubContent.introTitle}</h2>
                <p className="mb-1 text-sm text-gray-600">{clubContent.introLead}</p>
                <p className="max-w-3xl text-sm leading-6 text-gray-600">{clubContent.introDescription}</p>
              </div>
              {isAdmin ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setContentEditorOpen(true)}
                    className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                  >
                    <PencilLine className="size-4" />
                    내용/이미지 수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleClubContentDelete()}
                    disabled={deletingClubContent}
                    className="rounded-full border-[#efc9c9] bg-white/80 px-4 text-[#a44a4a] hover:bg-[#fff5f5]"
                  >
                    <Trash2 className="size-4" />
                    {deletingClubContent ? "삭제 중..." : "내용 삭제"}
                  </Button>
                </div>
              ) : null}
            </div>

            {mutationError ? (
              <p className="mb-6 rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#9a3b3b]">
                {mutationError}
              </p>
            ) : null}

            <div id="activities" className="mb-12">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">{clubContent.activitySectionTitle}</h3>
                {isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProgramEditorState({ mode: "create", program: null })}
                    className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                  >
                    <Plus className="size-4" />
                    추가하기
                  </Button>
                ) : null}
              </div>

              {loading ? (
                <p className="text-sm text-gray-500">동아리 정보를 불러오는 중입니다...</p>
              ) : error ? (
                <p className="rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#9a3b3b]">
                  {error}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="flex h-full flex-col rounded-2xl border border-[#D0E4F5] bg-[#EAF4FB] p-4 shadow-sm"
                    >
                      <div className="flex min-h-[132px] items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900">{program.title}</p>
                          <p className="mt-1 overflow-hidden text-xs leading-5 text-gray-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                            {program.description}
                          </p>
                        </div>
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setProgramEditorState({ mode: "edit", program })}
                              className="rounded-full text-[#355264] hover:bg-white/70"
                            >
                              <PencilLine className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void handleProgramDelete(program)}
                              disabled={deletingProgramId === program.id}
                              className="rounded-full text-[#a44a4a] hover:bg-white/70"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-8 flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">{clubContent.historySectionTitle}</h3>
                {isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivityEditorState({ mode: "create", activity: null })}
                    className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                  >
                    <Plus className="size-4" />
                    히스토리 추가
                  </Button>
                ) : null}
              </div>

              {availableActivityYears.length ? (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedActivityYear("all")}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedActivityYear === "all"
                        ? "bg-[#1f2730] text-white shadow-sm"
                        : "border border-[#d7e5ee] bg-white text-[#355264] hover:bg-[#f7fbfd]"
                    }`}
                  >
                    전체
                  </button>
                  {availableActivityYears.map((year) => (
                    <button
                      key={`home-history-${year}`}
                      type="button"
                      onClick={() => setSelectedActivityYear(year)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        selectedActivityYear === year
                          ? "bg-[#7cb8e8] text-white shadow-sm"
                          : "border border-[#d7e5ee] bg-white text-[#355264] hover:bg-[#f7fbfd]"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-10">
                {!displayedActivities.length ? (
                  <div className="rounded-2xl border border-[#d7e5ee] bg-[#f8fbfd] px-5 py-4 text-sm text-[#60717d]">
                    선택한 연도에 등록된 주요활동이 없습니다.
                  </div>
                ) : null}

                {displayedActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex flex-col items-start gap-4 ${
                      index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full max-w-[220px] overflow-hidden rounded-[20px] bg-[#dbe6ea]">
                      {activity.activityImages[0] ? (
                        <Image
                          src={resolveMediaUrl(activity.activityImages[0]) || "/placeholder.svg"}
                          alt={activity.activityId}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex min-h-[160px] flex-col justify-center">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {getActivityYears(activity).map((year) => (
                              <span
                                key={`${activity.id}-${year}`}
                                className="rounded-full border border-[#d7e5ee] bg-[#eef6fb] px-3 py-1 text-xs font-semibold text-[#44657b]"
                              >
                                {year}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{activity.activityId}</p>
                        </div>
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setActivityEditorState({ mode: "edit", activity })}
                              className="rounded-full text-[#355264] hover:bg-white/70"
                            >
                              <PencilLine className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void handleActivityDelete(activity)}
                              disabled={deletingActivityId === activity.id}
                              className="rounded-full text-[#a44a4a] hover:bg-white/70"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-4 ml-2">
            <p className="text-sm text-gray-600">{clubContent.studyCaption}</p>
            <p className="text-lg font-bold text-gray-900">{clubContent.studyTitle}</p>
          </div>

          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row">
            <div className="ml-2 space-y-5">
              <div>
                <p className="text-lg font-bold text-gray-900">{clubContent.learnTitle}</p>
                <p className="text-base text-gray-600">{clubContent.learnDescription}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{clubContent.growTitle}</p>
                <p className="text-base text-gray-600">{clubContent.growDescription}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{clubContent.shareTitle}</p>
                <p className="text-base text-gray-600">{clubContent.shareDescription}</p>
              </div>
            </div>

            <div className="h-[18rem] w-full max-w-[28rem] lg:-mt-10">
              <Image
                src={resolveMediaUrl(clubContent.studyImageUrl) || "/skill.png"}
                alt="기술 스택 아이콘"
                width={600}
                height={472}
                className="h-full w-full rounded-lg object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      <ClubContentEditorDialog
        open={contentEditorOpen}
        content={clubContent}
        onOpenChange={setContentEditorOpen}
        onSaved={setClubContent}
      />

      <ClubProgramEditorDialog
        open={Boolean(programEditorState)}
        mode={programEditorState?.mode ?? "create"}
        program={programEditorState?.program}
        onOpenChange={(open) => {
          if (!open) {
            setProgramEditorState(null)
          }
        }}
        onSaved={handleProgramSaved}
      />

      <ActivityEditorDialog
        open={Boolean(activityEditorState)}
        mode={activityEditorState?.mode ?? "create"}
        activity={activityEditorState?.activity}
        activityType="MAIN"
        onOpenChange={(open) => {
          if (!open) {
            setActivityEditorState(null)
          }
        }}
        onSaved={handleActivitySaved}
      />
    </div>
  )
}
