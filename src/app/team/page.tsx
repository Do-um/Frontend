import Image from "next/image"

import { HeaderNav } from "@/components/header-nav"

type ApiEnvelope<T> = {
  data: T
  success: boolean
  error: { code: string; message: string } | null
}

type IntroduceStaffResponse = {
  staffId: number
  userId?: number | null
  name: string
  department: string
  role: string
  description: string
  profileImage: string
}

type TeamMember = {
  id: string
  name: string
  photo: string
  department: string
  role: string
  description: string
}

type TeamSection = {
  key: string
  title: string
  members: TeamMember[]
}

function resolveTeamApiBase() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080"
  )
    .trim()
    .replace(/\/+$/, "")
}

function normalizeDepartment(department: string, role: string) {
  const combined = `${department ?? ""} ${role ?? ""}`
  if (/회장|부회장|회장단/.test(combined)) {
    return "회장단"
  }
  if (/총무/.test(combined)) {
    return "총무부"
  }
  if (/기획/.test(combined)) {
    return "기획부"
  }
  if (/홍보/.test(combined)) {
    return "홍보부"
  }
  return "그 외"
}

async function fetchStaffMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${resolveTeamApiBase()}/api/introduce/staff`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`운영진 API 응답 오류: ${res.status} ${res.statusText}`)
  }

  const envelope = (await res.json()) as ApiEnvelope<IntroduceStaffResponse[]>
  if (!envelope?.success) {
    const message = envelope?.error?.message ?? "운영진 API 처리 실패"
    throw new Error(message)
  }

  return (envelope.data ?? []).map((member) => ({
    id: String(member.staffId ?? ""),
    name: member.name,
    photo: member.profileImage ?? "",
    department: member.department ?? "그 외",
    role: member.role ?? "",
    description: member.description ?? "",
  }))
}

function buildTeamSections(members: TeamMember[]): TeamSection[] {
  const grouped: Record<string, TeamMember[]> = {
    회장단: [],
    총무부: [],
    기획부: [],
    홍보부: [],
    "그 외": [],
  }

  for (const member of members) {
    const section = normalizeDepartment(member.department, member.role)
    grouped[section] = grouped[section] ?? []
    grouped[section].push(member)
  }

  return [
    { key: "회장단", title: "<회장단>", members: grouped.회장단 },
    { key: "총무부", title: "<총무부>", members: grouped.총무부 },
    { key: "기획부", title: "<기획부>", members: grouped.기획부 },
    { key: "홍보부", title: "<홍보부>", members: grouped.홍보부 },
  ].filter((section) => section.members.length > 0)
}

export default async function TeamPage() {
  let sections: TeamSection[] = []
  let errorMessage: string | null = null

  try {
    const members = await fetchStaffMembers()
    sections = buildTeamSections(members)
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "운영진 데이터 로딩에 실패했습니다."
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/team-bg.png')" }}
    >
      <HeaderNav />

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col items-center text-center mb-20">
          <div className="animate-float mb-8">
            <Image src="/logo.png" alt="Do,um 로고" width={120} height={120} priority />
          </div>
          <h1 className="text-5xl font-bold mb-4">GROW TO GIVE</h1>
          <p className="text-xl text-muted-foreground">Introduction of Do,um team members</p>
        </div>

        {errorMessage ? (
          <section className="mb-20 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {errorMessage}
          </section>
        ) : null}

        {sections.length === 0 ? (
          <p className="text-center text-gray-600">표시할 운영진 데이터가 없습니다.</p>
        ) : (
          sections.map((section) => (
            <section key={section.key} className="mb-20">
              <h2 className="text-3xl font-bold text-center mb-10">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {section.members.map((member) => (
                  <MemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

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

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="border rounded-2xl p-6 bg-card hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {member.photo ? (
            <Image
              src={member.photo || "/placeholder.svg"}
              alt={member.name}
              width={64}
              height={64}
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl text-muted-foreground">👤</span>
          )}
        </div>
        <div>
          <p className="text-xl font-bold">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.role}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{member.department}</p>
      <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">{member.description}</p>
    </div>
  )
}
