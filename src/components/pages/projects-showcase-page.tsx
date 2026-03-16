"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  CalendarDays,
  FolderOpen,
  Github,
  Globe,
  Images,
  NotebookPen,
  PencilLine,
  Plus,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ProjectEditorDialog } from "@/components/pages/project-editor-dialog"
import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useAdminSession } from "@/hooks/use-admin-session"
import { fetchProjects, type ProjectItem } from "@/lib/content-api"
import { hasApiBaseUrl } from "@/lib/api"

function formatDate(value?: string | null) {
  if (!value) {
    return "미정"
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return "미정"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatPeriod(project: ProjectItem) {
  if (!project.period?.start && !project.period?.end) {
    return "기간 미정"
  }

  return `${formatDate(project.period?.start)} - ${formatDate(project.period?.end)}`
}

function getProjectImages(project: ProjectItem) {
  return Array.from(new Set([project.thumbnailUrl, ...project.images].filter(Boolean)))
}

function getProjectTimeValue(project: ProjectItem) {
  const timestamp = new Date(project.updatedAt).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function ProjectMetaItem({
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b8f99]">
          <Icon className="mt-0.5 size-3.5 shrink-0" />
          <span>{label}</span>
        </div>
        <p className="shrink-0 whitespace-nowrap text-right text-[clamp(1rem,2vw,1.25rem)] font-semibold leading-none text-[#223541]">
          {value}
        </p>
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: ProjectItem
  onSelect: (project: ProjectItem) => void
}) {
  const galleryImages = getProjectImages(project)

  return (
    <button type="button" onClick={() => onSelect(project)} className="group w-full text-left">
      <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/85 py-0 shadow-[0_20px_40px_rgba(37,74,91,0.08)] backdrop-blur-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_rgba(37,74,91,0.14)]">
        <div className="relative aspect-[1.65/1] overflow-hidden bg-[linear-gradient(135deg,#dcecf2,#edf4e8)]">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FolderOpen className="size-12 text-[#6f8590]" />
            </div>
          )}

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            {project.pinned ? (
              <span className="rounded-full bg-[#1f2730] px-3 py-1 text-xs font-semibold text-white">PINNED</span>
            ) : null}
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#567289] shadow-sm">
              {project.teamName || "DO,UM"}
            </span>
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#1f2730]/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <span>상세보기</span>
            <ArrowUpRight className="size-3.5" />
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#dbe7ef] bg-[#f7fbfd] px-3 py-1 text-xs font-medium text-[#557286]"
              >
                #{tag}
              </span>
            ))}
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1f2a33]">{project.title}</h2>
          <p className="mt-2 overflow-hidden text-sm leading-6 text-[#60717d] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {project.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#74838c]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <Users className="size-3.5" />
              {project.members.length}명
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <Images className="size-3.5" />
              {galleryImages.length}장
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f6f9] px-3 py-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(project.updatedAt)}
            </span>
          </div>
        </div>
      </Card>
    </button>
  )
}

function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/80 py-0">
      <div className="aspect-[1.65/1] animate-pulse bg-[#dfe9ee]" />
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-[#eef2f4]" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-[#eef2f4]" />
        </div>
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-[#e8eef1]" />
        <div className="h-4 w-full animate-pulse rounded-full bg-[#eef2f4]" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#eef2f4]" />
      </div>
    </Card>
  )
}

export function ProjectsShowcasePage() {
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit"
    project: ProjectItem | null
  } | null>(null)
  const { isAdmin } = useAdminSession()

  useEffect(() => {
    if (!hasApiBaseUrl()) {
      setError("NEXT_PUBLIC_API_BASE_URL 설정이 필요합니다.")
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadProjects() {
      try {
        const data = await fetchProjects()
        if (!cancelled) {
          setProjects(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "프로젝트 데이터를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  async function refreshProjects(nextSelectedProjectId?: string) {
    try {
      const data = await fetchProjects()
      setProjects(data)

      if (nextSelectedProjectId) {
        const matchedProject = data.find((project) => project.projectId === nextSelectedProjectId) ?? null
        setSelectedProject(matchedProject)
        setActiveImageIndex(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로젝트 데이터를 다시 불러오지 못했습니다.")
    }
  }

  const orderedProjects = [...projects].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1
    }

    return getProjectTimeValue(right) - getProjectTimeValue(left)
  })

  const selectedImages = selectedProject ? getProjectImages(selectedProject) : []
  const activeImage = selectedImages[activeImageIndex] ?? selectedImages[0]
  const linkEntries = selectedProject
    ? [
        { label: "GitHub", href: selectedProject.links?.github, icon: Github },
        { label: "Demo", href: selectedProject.links?.demo, icon: Globe },
        { label: "Notion", href: selectedProject.links?.notion, icon: NotebookPen },
      ].filter(
        (
          item,
        ): item is {
          label: string
          href: string
          icon: LucideIcon
        } => Boolean(item.href),
      )
    : []

  function openProjectDetail(project: ProjectItem) {
    setSelectedProject(project)
    setActiveImageIndex(0)
  }

  return (
    <div className="min-h-screen bg-[#eef2ec] text-[#1f2730]">
      <div
        className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/home-bg.png')" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.76),_rgba(238,242,236,0.95)_62%)]" />
        <div className="pointer-events-none absolute -left-20 top-32 h-96 w-96 rounded-full bg-[#daeef8]/45 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8rem] top-16 h-[32rem] w-[32rem] rounded-full border border-white/40" />
        <div className="pointer-events-none absolute right-[-4rem] top-28 h-[26rem] w-[26rem] rounded-full border border-white/25" />

        <div className="relative">
          <HeaderNav />

          <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
            <section className="mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white/72 shadow-[0_18px_50px_rgba(65,106,133,0.12)] backdrop-blur-sm">
                <Image src="/doum-logo-large.png" alt="DO,UM 로고" width={62} height={88} priority />
              </div>
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#6a7d88] uppercase">
                <Sparkles className="size-3.5" />
                Project Showcase
              </p>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-black sm:text-5xl">Our Projects</h1>
              <p className="mt-4 text-base leading-7 text-[#677680] sm:text-lg">
                봉사 현장에서 쌓인 문제의식을 프로젝트로 확장하고, 다시 교육 현장으로 연결합니다.
              </p>
            </section>

            <section className="mt-12 rounded-[36px] border border-white/75 bg-white/68 p-5 shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:p-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#6f8590]">PROJECT ARCHIVE</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1d2a34]">프로젝트 기록</h2>
                </div>
                {isAdmin ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditorState({ mode: "create", project: null })}
                      className="self-end rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                    >
                      <Plus className="size-4" />
                      추가하기
                    </Button>
                  </div>
                ) : null}
              </div>

              {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <ProjectCardSkeleton key={index} />
                  ))}
                </div>
              ) : null}

              {!loading && error ? (
                <Card className="rounded-[28px] border border-[#dbe6eb] bg-white/85 p-8 text-center shadow-none">
                  <h3 className="text-xl font-bold text-[#213542]">프로젝트 데이터를 불러오지 못했습니다.</h3>
                  <p className="mt-3 text-sm leading-6 text-[#677983]">{error}</p>
                  <p className="mt-2 text-sm text-[#8a98a0]">
                    프론트 `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` 형태로 설정해 주세요.
                  </p>
                </Card>
              ) : null}

              {!loading && !error && !orderedProjects.length ? (
                <Card className="rounded-[28px] border border-[#dbe6eb] bg-white/85 p-8 text-center shadow-none">
                  <h3 className="text-xl font-bold text-[#213542]">등록된 프로젝트가 없습니다.</h3>
                  <p className="mt-3 text-sm leading-6 text-[#677983]">
                    `/api/project`에 프로젝트가 등록되면 이 영역이 카드형 프로젝트 보드로 채워집니다.
                  </p>
                </Card>
              ) : null}

              {!loading && !error && orderedProjects.length ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {orderedProjects.map((project) => (
                    <ProjectCard key={project.projectId} project={project} onSelect={openProjectDetail} />
                  ))}
                </div>
              ) : null}
            </section>
          </main>

          <Dialog
            open={Boolean(selectedProject)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedProject(null)
                setActiveImageIndex(0)
              }
            }}
          >
            <DialogContent
              className="max-h-[min(92vh,960px)] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] overflow-hidden rounded-[32px] border-0 bg-[#f5f7f2] p-0 shadow-[0_40px_120px_rgba(24,39,54,0.32)] sm:w-[min(1120px,calc(100vw-2rem))] sm:!max-w-[1120px] xl:!max-w-[1180px]"
              showCloseButton
            >
              {selectedProject ? (
                <div className="grid max-h-[min(92vh,960px)] grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1.08fr)_390px]">
                  <div className="border-b border-white/70 bg-[linear-gradient(180deg,#d9ebf5_0%,#eff4ea_100%)] p-5 xl:border-b-0 xl:border-r xl:p-7">
                    <DialogTitle className="sr-only">{selectedProject.title}</DialogTitle>
                    <DialogDescription className="sr-only">
                      프로젝트 이미지와 설명, 링크, 멤버, 기간 정보를 보여주는 상세 모달
                    </DialogDescription>

                    <div className="flex h-full flex-col gap-4">
                      <div className="relative overflow-hidden rounded-[28px] bg-white/65 shadow-[0_24px_60px_rgba(44,71,88,0.12)]">
                        {activeImage ? (
                          <img
                            src={activeImage}
                            alt={`${selectedProject.title} 대표 이미지`}
                            className="h-[280px] w-full object-cover sm:h-[360px] xl:h-[520px]"
                          />
                        ) : (
                          <div className="flex h-[280px] items-center justify-center sm:h-[360px] xl:h-[520px]">
                            <FolderOpen className="size-14 text-[#6f8590]" />
                          </div>
                        )}
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
                                  alt={`${selectedProject.title} 썸네일 ${index + 1}`}
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
                      Project Detail
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {selectedProject.pinned ? (
                        <span className="rounded-full bg-[#1f2730] px-3 py-1 text-xs font-semibold text-white">
                          PINNED
                        </span>
                      ) : null}
                      {selectedProject.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#dbe7ef] bg-[#f7fbfd] px-3 py-1 text-xs font-medium text-[#557286]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                      <h2 className="text-3xl font-black tracking-tight text-[#15212b]">
                        {selectedProject.title}
                      </h2>
                      {isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProject(null)
                            setEditorState({ mode: "edit", project: selectedProject })
                          }}
                          className="rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                        >
                          <PencilLine className="size-4" />
                          수정
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base leading-7 text-[#60717d]">{selectedProject.summary}</p>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#576a75] sm:text-base">
                      {selectedProject.description}
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <ProjectMetaItem
                        icon={Users}
                        label="Members"
                        value={
                          selectedProject.members.length
                            ? `${selectedProject.members.length}명`
                            : "멤버 정보 없음"
                        }
                      />
                      <ProjectMetaItem
                        icon={CalendarDays}
                        label="Period"
                        value={formatPeriod(selectedProject)}
                      />
                      <ProjectMetaItem
                        icon={FolderOpen}
                        label="Team"
                        value={selectedProject.teamName || "DO,UM"}
                      />
                    </div>

                    {selectedProject.members.length ? (
                      <div className="mt-8">
                        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#6a7d88]">
                          <Users className="size-4" />
                          Members
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedProject.members.map((member) => (
                            <span
                              key={member}
                              className="rounded-full border border-[#dbe7ef] bg-white px-3 py-1.5 text-sm text-[#435866]"
                            >
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {linkEntries.length ? (
                      <div className="mt-8 flex flex-wrap gap-3">
                        {linkEntries.map(({ label, href, icon: Icon }) => (
                          <Button
                            key={label}
                            asChild
                            variant="outline"
                            className="rounded-full border-[#d7e5ee] bg-white px-5 text-[#365265] hover:bg-[#f5fbfe]"
                          >
                            <a href={href} target="_blank" rel="noreferrer">
                              <Icon className="size-4" />
                              {label}
                              <ArrowUpRight className="size-4" />
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-8 rounded-[28px] border border-[#dae6eb] bg-white/78 p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
                        기록 메타데이터
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-[#4f6470]">
                        <div className="flex items-center justify-between gap-3 border-b border-[#edf1f3] pb-3">
                          <span>등록일</span>
                          <span className="font-medium text-[#223541]">{formatDate(selectedProject.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>최근 수정일</span>
                          <span className="font-medium text-[#223541]">{formatDate(selectedProject.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>

          <ProjectEditorDialog
            open={Boolean(editorState)}
            mode={editorState?.mode ?? "create"}
            project={editorState?.project}
            onOpenChange={(open) => {
              if (!open) {
                setEditorState(null)
              }
            }}
            onSaved={(projectId) => {
              void refreshProjects(projectId)
            }}
          />

          <SiteFooter />
        </div>
      </div>
    </div>
  )
}
