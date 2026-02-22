"use client"

import { HeaderNav } from "@/components/header-nav"
import Image from "next/image"
import Link from "next/link"

// ========== 팀원 정보 타입 정의 ==========
type TeamMember = {
  id: string
  name: string // 이름 - 관리자 수정 가능
  photo: string // 프로필 사진 URL - 관리자 업로드 가능
  github?: string // Github URL (선택)
  instagram?: string // Instagram URL (선택)
}

// ========== 운영진 소개 페이지 ==========
export default function TeamPage() {
  // TODO: 백엔드 API에서 팀원 데이터 받아오기
  // 예: const { data: teamData } = useSWR('/api/team')
  // fetch('/api/team') 또는 SWR 사용해서 관리자가 추가/수정한 데이터 가져오기

  // 더미 데이터 - 관리자가 백엔드에서 추가/수정 가능
  const executives: TeamMember[] = [
    { id: "1", name: "김국민", photo: "", github: "", instagram: "" },
    { id: "2", name: "김국민", photo: "", github: "", instagram: "" },
  ]

  const generalAffairs: TeamMember[] = [{ id: "3", name: "김국민", photo: "", github: "", instagram: "" }]

  const planning: TeamMember[] = [{ id: "4", name: "김국민", photo: "", github: "", instagram: "" }]

  const publicity: TeamMember[] = [{ id: "5", name: "김국민", photo: "", github: "", instagram: "" }]

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/team-bg.png')" }}
    >
      {/* 헤더 */}
      <HeaderNav />

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* 히어로 섹션 - 로고와 타이틀 */}
        <div className="flex flex-col items-center text-center mb-20">
          <div className="animate-float mb-8">
            <Image src="/logo.png" alt="Do,um 로고" width={120} height={120} />
          </div>
          <h1 className="text-5xl font-bold mb-4">GROW TO GIVE</h1>
          <p className="text-xl text-muted-foreground">Introduction of Do,um team members</p>
        </div>

        {/* 회장단 */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-10">&lt;회장단&gt;</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {executives.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>

        {/* 총무부, 기획부, 홍보부 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {/* 총무부 */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-10">&lt;총무부&gt;</h2>
            <div className="space-y-6">
              {generalAffairs.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>

          {/* 기획부 */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-10">&lt;기획부&gt;</h2>
            <div className="space-y-6">
              {planning.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>

          {/* 홍보부 */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-10">&lt;홍보부&gt;</h2>
            <div className="space-y-6">
              {publicity.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-300 bg-transparent py-10">
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

// ========== 팀원 카드 컴포넌트 ==========
function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="border rounded-2xl p-6 bg-card hover:shadow-lg transition-shadow">
      {/* 프로필 사진과 이름 - 관리자가 수정 가능 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {member.photo ? (
            <Image
              src={member.photo || "/placeholder.svg"}
              alt={member.name}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl text-muted-foreground">👤</span>
          )}
        </div>
        <p className="text-xl font-bold">{member.name}</p>
      </div>

      {/* SNS 링크 - 관리자가 입력 가능 */}
      <div className="flex gap-8 pt-4 border-t">
        {member.github && (
          <Link
            href={member.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold hover:text-primary transition-colors"
          >
            Github
          </Link>
        )}
        {member.instagram && (
          <Link
            href={member.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-semibold hover:text-primary transition-colors"
          >
            Instagram
          </Link>
        )}
        {!member.github && !member.instagram && (
          <>
            <span className="text-base font-semibold text-muted-foreground">Github</span>
            <span className="text-base font-semibold text-muted-foreground">Instagram</span>
          </>
        )}
      </div>
    </div>
  )
}

