"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"

// ========== 타입 정의 ==========
// 모집 정보 타입 (백엔드에서 받아올 데이터 구조)
interface RecruitmentInfo {
  applicationStart: string // 지원 시작일 (예: "2026년 02월 23일 (월)")
  applicationEnd: string // 지원 마감일 (예: "2026년 03월 04일 (수)")
  interviewStart: string // 면접 시작일
  interviewEnd: string // 면접 마감일
}

export default function RecruitPage() {
  // ========== 상태 관리 ==========
  // 마우스 위치
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // TODO: 백엔드 API 연동 시 fetch('/api/recruitment') 또는 SWR 사용
  const [recruitmentInfo, setRecruitmentInfo] = useState<RecruitmentInfo>({
    applicationStart: "2026년 02월 23일 (월)",
    applicationEnd: "2026년 03월 04일 (수)",
    interviewStart: "2026년 03월 09일 (월)",
    interviewEnd: "2026년 03월 11일 (수)",
  })

  // 마우스 움직임 추적
  useEffect(() => {
    // TODO: 백엔드 API에서 모집 정보 가져오기
    // 예시:
    // fetch('/api/recruitment')
    //   .then(res => res.json())
    //   .then(data => setRecruitmentInfo(data))

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // 로고 움직임 계산 (마우스 위치에 따라 -20px ~ 20px 범위로 이동)
  const calculateLogoOffset = () => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const offsetX = ((mousePosition.x - centerX) / centerX) * 20
    const offsetY = ((mousePosition.y - centerY) / centerY) * 20
    return { x: offsetX, y: offsetY }
  }

  const logoOffset = calculateLogoOffset()

  return (
    <div className="min-h-screen">
      {/* ========== 헤더 ========== */}
      <HeaderNav />

      {/* ========== 히어로 섹션 - 마우스에 따라 움직이는 DO,UM 로고 ========== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-100 to-cyan-50 py-24">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center" style={{ minHeight: "400px" }}>
            {/* 마우스 움직임에 반응하는 DO,UM 로고 */}
            <div
              className="transition-transform duration-100 ease-out"
              style={{
                transform: `translate(${logoOffset.x}px, ${logoOffset.y}px)`,
              }}
            >
              <Image src="/doum-logo-large.png" alt="DO,UM" width={600} height={400} priority className="select-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ========== 모집 개요 섹션 ========== */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-4xl px-4">
          {/* 제목 */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold">모집 개요</h1>
            <p className="text-lg text-muted-foreground">2026년도 1학기 Do,um 신입 부원 모집 개요</p>
          </div>

          <div className="mb-16 grid gap-6 md:grid-cols-2">
            {/* 지원 기간 */}
            <div className="rounded-2xl border-2 bg-card p-8 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">지원 기간</h3>
              <p className="text-lg leading-relaxed">
                {recruitmentInfo.applicationStart}~
                <br />
                {recruitmentInfo.applicationEnd}
              </p>
            </div>

            {/* 면접 일정 */}
            <div className="rounded-2xl border-2 bg-card p-8 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">면접 일정</h3>
              <p className="text-lg leading-relaxed">
                {recruitmentInfo.interviewStart}~
                <br />
                {recruitmentInfo.interviewEnd}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 모집 대상 섹션 ========== */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4">
          {/* 제목 */}
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-4xl font-bold">모집 대상</h2>
            <p className="text-lg text-muted-foreground">함께 활동할 적극적으로 할 수 있는 누구나 환영합니다</p>
          </div>

          {/* 자격 요건 박스 */}
          <div className="rounded-2xl border-2 bg-card p-10 shadow-sm">
            <div className="space-y-4 text-lg">
              <div className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <p>실력, 학과 무관! SW 교육에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <p>평소에 봉사활동에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <p>소통과 사람들과 다양한 교류 활동에 관심이 있으신 분!</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary">✓</span>
                <p>코딩 외에도 다양한 활동을 하고 싶으신 분!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 지원하기 CTA 섹션 ========== */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-8 text-3xl font-bold">2026학년도 1학기 Do,um 신규 부원</h2>
          <Button
            size="lg"
            className="rounded-full bg-primary px-10 py-6 text-lg font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            지원하기
          </Button>
        </div>
      </section>

      {/* ========== 푸터 ========== */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 text-xl font-bold">DO,UM</p>
          <p className="mb-1 text-sm text-muted-foreground">소프트웨어융합대학 코딩봉사 동아리</p>
          <p className="mb-6 text-sm text-muted-foreground">Contact: doum@kookmin.ac.kr</p>
          <p className="text-xs text-muted-foreground">© DO,UM</p>
        </div>
      </footer>
    </div>
  )
}
