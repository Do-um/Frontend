"use client"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HeaderNav } from "@/components/header-nav"

interface ActivityHistory {
  id: number
  title: string
  description: string
  imageUrl: string
}

export default function Home() {
  // TODO: 백엔드 API 연동 시 fetch 또는 SWR로 교체
  const activityHistories: ActivityHistory[] = [
    { id: 1, title: "", description: "", imageUrl: "" },
    { id: 2, title: "", description: "", imageUrl: "" },
    { id: 3, title: "", description: "", imageUrl: "" },
    { id: 4, title: "", description: "", imageUrl: "" },
  ]
  const displayedActivities = activityHistories.slice(0, 4)

  // 활동 히스토리 이미지 색상 (디자인에 맞춤)
  const historyColors = ["#F5EBE0", "#E8D5D5", "#F5EBE0"]

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      {/* ========== 첫 화면 ========== */}
      <section className="min-h-screen">
        {/* ========== 헤더 영역 ========== */}
        <HeaderNav />

        {/* ========== 히어로 섹션 ========== */}
        <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-8 pb-10 pt-6">
          {/* 배너 이미지 - 위아래로 부드럽게 움직이는 애니메이션 */}
          <div className="flex w-full justify-center">
            <Image
              src="/hero-banner.png"
              alt="DO,UM 배너"
              width={1200}
              height={200}
              className="w-full max-w-6xl object-contain animate-float"
              priority
            />
          </div>

          {/* 시작하기 버튼 - 주황색 */}
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

      {/* ========== 메인 컨텐츠 박스 ========== */}
      <section id="about" className="px-4 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-gray-300 bg-white p-6 lg:p-10">
            {/* Do,um 소개 */}
            <div className="mb-10">
              <h2 className="mb-3 text-2xl font-bold text-gray-900">Do,um?</h2>
              <p className="mb-1 text-sm text-gray-600">'um' 하고 망설이기 전에, 'do' 무엇이든 해보자</p>
              <p className="text-sm text-gray-600">
                Do,um은 국민대학교 소프트웨어학부 교육 봉사 동아리로 매년 교내외로 다양한 봉사활동을 하고 있습니다
              </p>
            </div>

            {/* 정규 활동 */}
            <div id="activities" className="mb-10">
              <h3 className="mb-6 text-lg font-bold text-gray-900">정규 활동</h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "타전공", desc: "기후 변화 대응 협력단과 연계하여 타전공생 대상 코딩교육 진행" },
                  { title: "파이썬 기초교육", desc: "국민대학교 재학생 대상 파이썬 기초교육 진행" },
                  { title: "글빛 도서관", desc: "성북구 글빛 도서관과 협력하여 sw봉사 진행" },
                  { title: "강북 엔트리", desc: "우리 동네 키움 센터와 협력하여 엔트리 교육 진행" },
                  { title: "스터디", desc: "희망하는 스터디 참가/창설하여 개인 역량 강화" },
                  { title: "모각코", desc: "고려대 인근 카페파인에서 모여서 각자 코딩" },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[#D0E4F5] bg-[#EAF4FB] p-4"
                  >
                    <p className="text-sm font-bold text-gray-900">{activity.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{activity.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 활동 히스토리 */}
            <div>
              <h3 className="mb-8 text-lg font-bold text-gray-900">
                우리는 어떤 길을<br />걸어왔을까요?
              </h3>

              <div className="space-y-10">
                {displayedActivities.slice(0, 3).map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex flex-col items-start gap-4 ${
                      index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    {/* 이미지 플레이스홀더 */}
                    <div 
                      className="aspect-[4/3] w-full max-w-[200px] rounded-lg"
                      style={{ backgroundColor: historyColors[index] || "#E8E8E8" }}
                    />

                    {/* 설명 텍스트 */}
                    <div className="flex items-center">
                      <p className="text-sm text-gray-600">
                        {activity.description || "간단한 활동 설명"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 스터디 섹션 ========== */}
      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4">
            <p className="text-xs text-gray-600">자기개발을 위한</p>
            <p className="text-base font-bold text-gray-900">다양한 스터디와 친목활동 진행</p>
          </div>

          {/* Learn, Grow, Share + 이미지 영역 */}
          <div className="flex items-start justify-between">
            {/* 왼쪽: Learn, Grow, Share 텍스트 */}
            <div className="space-y-5">
              <div>
                <p className="text-base font-bold text-gray-900">Learn</p>
                <p className="text-sm text-gray-600">기초부터 차근차근, 함께 배우는 스터디</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Grow</p>
                <p className="text-sm text-gray-600">알고리즘·프로젝트로 쌓는 실력</p>
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">Share</p>
                <p className="text-sm text-gray-600">배운 기술로 실천하는 SW 봉사</p>
              </div>
            </div>

            {/* 오른쪽: 이미지 플레이스홀더 (나중에 사진 추가) */}
            <div className="mr-16 h-48 w-72 rounded-lg bg-[#F0E4DC]" />
          </div>
        </div>
      </section>

      {/* ========== 푸터 ========== */}
      <footer className="mt-8 border-t border-gray-300 bg-transparent py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mb-2 text-base font-bold text-gray-900">DO,UM</p>
          <p className="mb-1 text-xs text-gray-600">소프트웨어융합대학 코딩봉사 동아리</p>
          <p className="mb-4 text-xs text-gray-600">Contact: doum@kookmin.ac.kr</p>
          <p className="text-xs text-gray-500">© DO,UM</p>
        </div>
      </footer>
    </div>
  )
}