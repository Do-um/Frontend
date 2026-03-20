"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { PencilLine, Plus } from "lucide-react"

import { ActivityEditorDialog } from "@/components/pages/activity-editor-dialog"
import { ClubContentEditorDialog } from "@/components/pages/club-content-editor-dialog"
import { ClubProgramEditorDialog } from "@/components/pages/club-program-editor-dialog"
import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { useAdminSession } from "@/hooks/use-admin-session"
import {
  fetchActivities,
  fetchClubContent,
  fetchClubPrograms,
  type ActivityItem,
  type ClubContent,
  type ClubProgramItem,
} from "@/lib/content-api"

const defaultClubContent: ClubContent = {
  introTitle: "Do,um?",
  introLead: "'um' 하고 망설이기 전에, 'do' 무엇이든 해보자",
  introDescription:
    "Do,um은 국민대학교 소프트웨어융합대학 학생들이 함께 배우고 나누기 위해 만든 교육 봉사 동아리입니다. 교내외 코딩 교육과 친목 활동, 스터디를 꾸준히 이어가고 있습니다.",
  heroBannerImageUrl: "/hero-banner.png",
  activitySectionTitle: "정규 활동",
  historySectionTitle: "우리는 어떤 길을 걸어왔을까요?",
  studyCaption: "자기개발을 위한",
  studyTitle: "다양한 스터디와 친목활동 진행",
  learnTitle: "Learn",
  learnDescription: "기초부터 차근차근, 함께 배우는 스터디",
  growTitle: "Grow",
  growDescription: "알고리즘과 프로젝트로 쌓는 실전 역량",
  shareTitle: "Share",
  shareDescription: "배운 기술로 실천하는 SW 교육 봉사",
  studyImageUrl: "/skill.png",
  createdAt: null,
  updatedAt: null,
}

function compareActivities(left: ActivityItem, right: ActivityItem) {
  const leftKey = left.activityDate || left.createdAt
  const rightKey = right.activityDate || right.createdAt
  return rightKey.localeCompare(leftKey)
}

export default function Home() {
  const { isAdmin } = useAdminSession()
  const [clubContent, setClubContent] = useState<ClubContent>(defaultClubContent)
  const [programs, setPrograms] = useState<ClubProgramItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contentEditorOpen, setContentEditorOpen] = useState(false)
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

  const displayedActivities = useMemo(() => {
    return [...activities].sort(compareActivities).slice(0, 3)
  }, [activities])

  function handleProgramSaved(savedProgram: ClubProgramItem) {
    setPrograms((current) =>
      [...current.filter((item) => item.id !== savedProgram.id), savedProgram].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
      ),
    )
  }

  function handleActivitySaved(savedActivity: ActivityItem) {
    setActivities((current) => {
      const hasExisting = current.some((activity) => activity.id === savedActivity.id)
      const nextActivities = hasExisting
        ? current.map((activity) => (activity.id === savedActivity.id ? savedActivity : activity))
        : [savedActivity, ...current]

      return nextActivities.sort(compareActivities)
    })
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
              src={clubContent.heroBannerImageUrl || "/hero-banner.png"}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentEditorOpen(true)}
                  className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                >
                  <PencilLine className="size-4" />
                  내용/이미지 수정
                </Button>
              ) : null}
            </div>

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
                      className="rounded-2xl border border-[#D0E4F5] bg-[#EAF4FB] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{program.title}</p>
                          <p className="mt-1 text-xs leading-5 text-gray-600">{program.description}</p>
                        </div>
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setProgramEditorState({ mode: "edit", program })}
                            className="rounded-full text-[#355264] hover:bg-white/70"
                          >
                            <PencilLine className="size-4" />
                          </Button>
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

              <div className="space-y-10">
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
                          src={activity.activityImages[0]}
                          alt={activity.activityId}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex min-h-[160px] flex-col justify-center">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">{activity.activityId}</p>
                        {isAdmin ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setActivityEditorState({ mode: "edit", activity })}
                            className="rounded-full text-[#355264] hover:bg-white/70"
                          >
                            <PencilLine className="size-4" />
                          </Button>
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
                src={clubContent.studyImageUrl || "/skill.png"}
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
