"use client"
import Image from "next/image"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"
import { useGetIntroduces } from "@/api/introduce/get/useGetIntroduces"

interface ActivityHistory {
  id: number
  title: string
  description: string
  imageUrl: string
  imagePosition?: "left" | "right" // 이미지가 왼쪽인지 오른쪽인지
}

export default function Home() {
  const { introduces, isLoading, errorMessage } = useGetIntroduces()

  const activityHistories: ActivityHistory[] = useMemo(
    () =>
      introduces.map((introduce) => ({
        id: introduce.id,
        title: introduce.activityId,
        description: introduce.description,
        imageUrl: introduce.activityImage || "/placeholder.svg?height=400&width=600",
      })),
    [introduces]
  )
  // 최대 4개까지만 표시
  const displayedActivities = activityHistories.slice(0, 4)

  return (
    <div className="min-h-screen">
      {/* ========== 헤더 영역 ========== */}
      <HeaderNav />

      {/* ========== 히어로 섹션 (첫 화면) ========== */}
      <section className="relative overflow-hidden py-32 lg:py-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />

        <div className="container relative mx-auto px-4 text-center">
          {/* 메인 타이틀 */}
          <h1 className="mb-2 text-5xl font-bold tracking-tight lg:text-6xl">학습을 통한 성장</h1>
          <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">성장을 통한 나눔</h1>

          {/* 동아리 이름 및 안내 */}
          <p className="mb-2 text-3xl font-semibold text-primary">Do,um</p>

          {/* 시작하기 버튼 */}
          <Button
            size="lg"
            onClick={() => {
              document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
            }}
            className="mt-8 rounded-full bg-primary px-8 py-6 text-base font-medium text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            시작하기
          </Button>
        </div>
      </section>

      {/* ========== 메인 컨텐츠 박스 ========== */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border-2 bg-card p-8 shadow-lg lg:p-12">
            {/* Do,um 소개 영역 */}
            <div className="mb-16">
              <h2 className="mb-4 text-3xl font-bold">Do,um?</h2>
              <p className="mb-2 text-muted-foreground">'um' 하고 망설이기 전에, 'do' 무엇이든 해보자</p>
              <p className="text-muted-foreground">
                Do,um은 국민대학교 소프트웨어학부 교육 봉사 동아리로 매년 교내외로 다양한 봉사활동을 하고 있습니다
              </p>
            </div>

            {/* 정규 활동 영역 */}
            <div id="activities" className="mb-16">
              <h3 className="mb-8 text-2xl font-bold">정규 활동</h3>

              {/* 그리드 레이아웃 */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "타전공", desc: "사진 or 글" },
                  { title: "파이썬 기초교육", desc: "사진 or 글" },
                  { title: "글빛 도서관", desc: "사진 or 글" },
                  { title: "강북 엔트리", desc: "사진 or 글" },
                  { title: "스터디", desc: "사진 or 글" },
                  { title: "모각코", desc: "사진 or 글" },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-accent/30 p-6 transition-all hover:bg-accent/50 hover:shadow-md"
                  >
                    <p className="mb-2 text-lg font-bold">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 활동 히스토리 영역 */}
            <div className="mb-8">
              <h3 className="mb-10 text-2xl font-bold">
                우리는 어떤 길을
                <br />
                걸어왔을까요?
              </h3>

              {isLoading && <p className="text-sm text-muted-foreground">주요 활동을 불러오는 중입니다.</p>}
              {!isLoading && errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}

              <div className="space-y-12">
                {displayedActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex flex-col items-center gap-6 lg:gap-8 ${
                      index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                    }`}
                  >
                    {/* 활동 이미지 */}
                    <div className="aspect-video w-full rounded-xl bg-muted lg:w-[35%] overflow-hidden shadow-md">
                      <Image
                        src={activity.imageUrl || "/placeholder.svg"}
                        alt={activity.title || "활동 이미지"}
                        width={400}
                        height={280}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* 활동 제목 및 설명 */}
                    <div className="flex w-full flex-col justify-center lg:w-[65%]">
                      {activity.title && <h4 className="mb-3 text-xl font-bold">{activity.title}</h4>}
                      {activity.description && (
                        <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                      )}
                      {!activity.title && !activity.description && (
                        <p className="text-muted-foreground/60">간단한 활동 설명</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 스터디 섹션 ========== */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-primary">자기계발을 위한</p>
            <p className="text-2xl font-bold">다양한 스터디와 친목활동 진행</p>
          </div>

          {/* 스터디 이미지 영역 */}
          <div className="aspect-[3/1] w-full rounded-2xl bg-muted shadow-lg"></div>
        </div>
      </section>

      {/* ========== 푸터 ========== */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center">
          {/* 동아리 이름 */}
          <p className="mb-3 text-xl font-bold">DO,UM</p>

          {/* 동아리 소속 및 설명 */}
          <p className="mb-1 text-sm text-muted-foreground">소프트웨어융합대학 sw봉사 동아리</p>

          {/* 연락처 이메일 */}
          <p className="mb-6 text-sm text-muted-foreground">Contact: doum@kookmin.ac.kr</p>

          {/* 저작권 표시 */}
          <p className="text-xs text-muted-foreground">© DO,UM</p>
        </div>
      </footer>
    </div>
  )
}
