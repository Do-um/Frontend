"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"

// ========== 타입 정의 ==========
interface RecruitmentInfo {
  description: string        // 모집 개요 설명 (예: "2026년도 1학기 Do,um 신입 부원 모집 개요")
  ctaTitle: string           // 지원하기 버튼 위 제목 (예: "2026학년도 1학기 Do,um 신규 부원")
  applicationStart: string
  applicationEnd: string
  interviewStart: string
  interviewEnd: string
}

export default function RecruitPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // ========== 모집 정보 (관리자가 수정 가능) ==========
  // TODO: 백엔드 API 연동 시 아래를 fetch 또는 SWR로 교체
  // 예시: const { data: recruitmentInfo } = useSWR('/api/recruitment')
  // API 응답 예시: GET /api/recruitment -> { applicationStart, applicationEnd, interviewStart, interviewEnd }
  const [recruitmentInfo, setRecruitmentInfo] = useState<RecruitmentInfo>({
    description: "2026년도 1학기 Do,um 신입 부원 모집 개요",  // 관리자가 수정
    ctaTitle: "2026학년도 1학기 Do,um 신규 부원",            // 관리자가 수정
    applicationStart: "2026년 02월 23일 (월)",  // 관리자가 수정
    applicationEnd: "2026년 03월 04일 (수)",    // 관리자가 수정
    interviewStart: "2026년 03월 09일 (월)",   // 관리자가 수정
    interviewEnd: "2026년 03월 11일 (수)",     // 관리자가 수정
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const calculateLogoOffset = () => {
    if (typeof window === "undefined") return { x: 0, y: 0 }
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const offsetX = ((mousePosition.x - centerX) / centerX) * 20
    const offsetY = ((mousePosition.y - centerY) / centerY) * 20
    return { x: offsetX, y: offsetY }
  }

  const logoOffset = calculateLogoOffset()

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/recruit-bg.png')" }}
    >
      {/* ========== 헤더 ========== */}
      <HeaderNav />

      {/* ========== 히어로 섹션 - 마우스에 반응하는 DO,UM 로고 ========== */}
      <section className="relative overflow-hidden py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-center" style={{ minHeight: "350px" }}>
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
      </section>

      {/* ========== 모집 개요 섹션 ========== */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">모집 개요</h1>
            <p className="text-sm text-gray-600">{recruitmentInfo.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* 지원 기간 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-900">지원 기간</h3>
              <p className="text-sm text-gray-700">
                {recruitmentInfo.applicationStart}~<br />
                {recruitmentInfo.applicationEnd}
              </p>
            </div>

            {/* 면접 일정 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-sm font-bold text-gray-900">면접 일정</h3>
              <p className="text-sm text-gray-700">
                {recruitmentInfo.interviewStart}~<br />
                {recruitmentInfo.interviewEnd}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 모집 대상 섹션 ========== */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">모집 대상</h2>
            <p className="text-sm text-gray-600">함께 활동을 적극적으로 할 수 있는 누구나 환영합니다</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-[#7CB8E8] font-bold">✓</span>
                <p className="text-gray-800">실력, 학과 무관! SW 교육에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#7CB8E8] font-bold">✓</span>
                <p className="text-gray-800">평소에 봉사활동에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#7CB8E8] font-bold">✓</span>
                <p className="text-gray-800">소융대 사람들과 다양한 교류 활동에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#7CB8E8] font-bold">✓</span>
                <p className="text-gray-800">코딩 외에도 다양한 활동을 하고 싶으신 분!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 지원하기 CTA 섹션 ========== */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-xl font-bold text-gray-900">{recruitmentInfo.ctaTitle}</h2>
          <Button
            size="lg"
            className="rounded-full bg-[#7CB8E8] px-8 py-5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#6AA8D8] hover:shadow-lg"
          >
            지원하기
          </Button>
        </div>
      </section>

      {/* ========== 푸터 ========== */}
      <footer className="mt-12 border-t border-gray-300 bg-transparent py-10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-2 text-base font-bold text-gray-900">DO,UM</p>
          <p className="mb-1 text-xs text-gray-600">소프트웨어융합대학 코딩봉사 동아리</p>
          <p className="mb-4 text-xs text-gray-600">Contact: doum@kookmin.ac.kr</p>
          <p className="text-xs text-gray-500">© DO,UM</p>
        </div>
      </footer>
    </div>
  )
}
