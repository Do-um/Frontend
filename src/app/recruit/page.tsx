"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { PencilLine } from "lucide-react"

import { RecruitContentEditorDialog } from "@/components/pages/recruit-content-editor-dialog"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"
import { useAdminSession } from "@/hooks/use-admin-session"
import { fetchRecruitContent, type RecruitContent } from "@/lib/content-api"

const defaultRecruitContent: RecruitContent = {
  overviewTitle: "모집 개요",
  overviewDescription: "2026년도 1학기 Do,um 신입 부원 모집 개요",
  applicationPeriodTitle: "지원 기간",
  applicationStart: "2026년 02월 23일 (월)",
  applicationEnd: "2026년 03월 04일 (수)",
  interviewPeriodTitle: "면접 일정",
  interviewStart: "2026년 03월 09일 (월)",
  interviewEnd: "2026년 03월 11일 (수)",
  targetSectionTitle: "모집 대상",
  targetSectionDescription: "함께 활동을 적극적으로 할 수 있는 누구나 환영합니다",
  targetItems: [
    "실력, 학과 무관! SW 교육에 관심이 있으신 분!",
    "평소에 봉사활동에 관심이 있으신 분!",
    "소융대 사람들과 다양한 교류 활동에 관심이 있으신 분!",
    "코딩 외에도 다양한 활동을 하고 싶으신 분!",
  ],
  ctaTitle: "2026학년도 1학기 Do,um 신규 부원",
  ctaButtonLabel: "지원하기",
  applyUrl: "",
  createdAt: null,
  updatedAt: null,
}

export default function RecruitPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [recruitContent, setRecruitContent] = useState<RecruitContent>(defaultRecruitContent)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editorOpen, setEditorOpen] = useState(false)
  const { isAdmin } = useAdminSession()

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadRecruitContent() {
      setLoading(true)
      setError("")

      try {
        const data = await fetchRecruitContent()
        if (!cancelled) {
          setRecruitContent(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "모집 페이지 정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRecruitContent()

    return () => {
      cancelled = true
    }
  }, [])

  const calculateLogoOffset = () => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 }
    }

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const offsetX = ((mousePosition.x - centerX) / centerX) * 20
    const offsetY = ((mousePosition.y - centerY) / centerY) * 20

    return { x: offsetX, y: offsetY }
  }

  const logoOffset = calculateLogoOffset()
  const applyUrl = recruitContent.applyUrl.trim()

  function handleApplyClick() {
    if (!applyUrl) {
      return
    }

    window.location.href = applyUrl
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/recruit-bg.png')" }}
    >
      <HeaderNav />

      <section className="relative overflow-hidden py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-center" style={{ minHeight: "350px" }}>
            <div className="animate-float">
              <div
                className="transition-transform duration-100 ease-out"
                style={{ transform: `translate(${logoOffset.x}px, ${logoOffset.y}px)` }}
              >
                <Image
                  src="/doum-logo-large.png"
                  alt="DO,UM"
                  width={500}
                  height={350}
                  priority
                  className="select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{recruitContent.overviewTitle}</h1>
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorOpen(true)}
                  className="rounded-full border-[#d7e5ee] bg-white/80 px-4 text-[#355264] hover:bg-white"
                >
                  <PencilLine className="size-4" />
                  내용 수정
                </Button>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-gray-600">{recruitContent.overviewDescription}</p>
            {error ? (
              <p className="mt-4 rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-4 py-3 text-sm text-[#9a3b3b]">
                {error}
              </p>
            ) : null}
            {loading ? <p className="mt-4 text-sm text-gray-500">모집 정보를 불러오는 중입니다...</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-900">{recruitContent.applicationPeriodTitle}</h3>
              <p className="text-sm text-gray-700">
                {recruitContent.applicationStart}~<br />
                {recruitContent.applicationEnd}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-900">{recruitContent.interviewPeriodTitle}</h3>
              <p className="text-sm text-gray-700">
                {recruitContent.interviewStart}~<br />
                {recruitContent.interviewEnd}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">{recruitContent.targetSectionTitle}</h2>
            <p className="text-sm text-gray-600">{recruitContent.targetSectionDescription}</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <div className="space-y-3 text-sm">
              {recruitContent.targetItems.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="font-bold text-[#7CB8E8]">✓</span>
                  <p className="text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-xl font-bold text-gray-900">{recruitContent.ctaTitle}</h2>
          <Button
            size="lg"
            onClick={handleApplyClick}
            disabled={!applyUrl}
            className="rounded-full bg-[#7CB8E8] px-8 py-5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#6AA8D8] hover:shadow-lg disabled:bg-[#b9d7ee] disabled:text-white"
          >
            {recruitContent.ctaButtonLabel}
          </Button>
          {!applyUrl ? <p className="mt-3 text-xs text-gray-500">현재 지원 링크가 아직 등록되지 않았습니다.</p> : null}
        </div>
      </section>

      <footer className="mt-12 border-t border-gray-300 bg-transparent py-10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-2 text-base font-bold text-gray-900">DO,UM</p>
          <p className="mb-1 text-xs text-gray-600">소프트웨어융합대학 코딩봉사 동아리</p>
          <p className="mb-4 text-xs text-gray-600">Contact: doum@kookmin.ac.kr</p>
          <p className="text-xs text-gray-500">© DO,UM</p>
        </div>
      </footer>

      <RecruitContentEditorDialog
        open={editorOpen}
        content={recruitContent}
        onOpenChange={setEditorOpen}
        onSaved={setRecruitContent}
      />
    </div>
  )
}
