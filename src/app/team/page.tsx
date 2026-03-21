"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Github, Instagram, PencilLine, Plus, Trash2 } from "lucide-react"

import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { useAdminSession } from "@/hooks/use-admin-session"
import { deleteStaff, fetchStaff, type StaffItem } from "@/lib/content-api"
import { resolveMediaUrl } from "@/lib/media"

const StaffEditorDialog = dynamic(
  () => import("@/components/pages/staff-editor-dialog").then((module) => module.StaffEditorDialog),
  { ssr: false },
)

const departmentOrder = ["회장단", "총무부", "기획부", "홍보부"]
const leadRoleOrder = ["회장", "부회장", "고문"]

function normalizeDepartment(member: StaffItem) {
  const department = member.department.trim()
  const role = member.role.trim()

  if (department === "회장단" || department === "회장" || department === "부회장") {
    return "회장단"
  }

  if (role === "회장" || role === "부회장") {
    return "회장단"
  }

  if (department.includes("총무")) {
    return "총무부"
  }

  if (department.includes("기획")) {
    return "기획부"
  }

  if (department.includes("홍보")) {
    return "홍보부"
  }

  return department
}

function normalizeExternalUrl(url: string | null) {
  if (!url) {
    return ""
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  return `https://${trimmed}`
}

function getMemberSortOrder(member: StaffItem) {
  const normalizedDepartment = normalizeDepartment(member)
  const normalizedRole = member.role.trim()

  if (normalizedDepartment === "회장단") {
    const roleIndex = leadRoleOrder.indexOf(normalizedRole)
    return roleIndex >= 0 ? roleIndex : leadRoleOrder.length
  }

  return Number.MAX_SAFE_INTEGER
}

export default function TeamPage() {
  const { isAdmin } = useAdminSession()
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit"
    staff: StaffItem | null
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStaff() {
      setLoading(true)
      setError("")

      try {
        const response = await fetchStaff()
        if (!cancelled) {
          setStaff(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "운영진 정보를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStaff()

    return () => {
      cancelled = true
    }
  }, [])

  const groupedStaff = useMemo(() => {
    const grouped = new Map<string, StaffItem[]>()

    for (const item of staff) {
      const normalizedDepartment = normalizeDepartment(item)
      const normalizedItem =
        normalizedDepartment === item.department
          ? item
          : {
              ...item,
              department: normalizedDepartment,
            }
      const group = grouped.get(normalizedDepartment) ?? []
      group.push(normalizedItem)
      grouped.set(normalizedDepartment, group)
    }

    const orderedKeys = [
      ...departmentOrder.filter((department) => grouped.has(department)),
      ...[...grouped.keys()].filter((department) => !departmentOrder.includes(department)).sort(),
    ]

    return orderedKeys.map((department) => ({
      department,
      members: [...(grouped.get(department) ?? [])].sort((left, right) => {
        const orderDiff = getMemberSortOrder(left) - getMemberSortOrder(right)
        if (orderDiff !== 0) {
          return orderDiff
        }
        return left.staffId - right.staffId
      }),
    }))
  }, [staff])

  const leadSection = groupedStaff.find((section) => section.department === "회장단") ?? null
  const fixedSecondarySections = departmentOrder
    .filter((department) => department !== "회장단")
    .map((department) => ({
      department,
      members: groupedStaff.find((section) => section.department === department)?.members ?? [],
    }))
  const extraSections = groupedStaff.filter((section) => !departmentOrder.includes(section.department))
  const secondarySections = [...fixedSecondarySections, ...extraSections]
  function handleStaffSaved(savedStaff: StaffItem) {
    setStaff((current) => {
      const next = [...current.filter((item) => item.staffId !== savedStaff.staffId), savedStaff]
      return next.sort((left, right) => left.staffId - right.staffId)
    })
  }

  async function handleStaffDelete(target: StaffItem) {
    if (!window.confirm(`${target.name} 운영진 정보를 삭제할까요?`)) {
      return
    }

    try {
      await deleteStaff(target.staffId)
      setStaff((current) => current.filter((item) => item.staffId !== target.staffId))
      if (editorState?.staff?.staffId === target.staffId) {
        setEditorState(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "운영진 삭제 중 오류가 발생했습니다.")
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/team-bg.png')" }}
    >
      <HeaderNav />

      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10">
        <div className="mb-[72px] flex flex-col items-center text-center">
          <div className="animate-float mb-10">
            <Image src="/logo.png" alt="Do,um 로고" width={150} height={150} />
          </div>
          <h1 className="mb-4 text-[3.4rem] font-black tracking-[-0.04em] text-black sm:text-[4.2rem]">
            GROW TO GIVE
          </h1>
          <p className="text-[1.4rem] text-[#6f6f6f] sm:text-[1.9rem]">
            Do,um 운영진 소개
          </p>
          {isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorState({ mode: "create", staff: null })}
              className="mt-8 rounded-full border-[#bccfd9] bg-white/80 px-4 text-[#355264] hover:bg-white"
            >
              <Plus className="size-4" />
              추가하기
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-black/15 bg-white/75 px-6 py-8 text-center text-sm text-muted-foreground">
            운영진 정보를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="rounded-[28px] border border-[#f1c9c9] bg-[#fff4f4] px-6 py-8 text-center text-sm text-[#9a3b3b]">
            {error}
          </div>
        ) : (
          <div className="space-y-[88px]">
            {leadSection ? (
              <section>
                <SectionHeading title="회장단" subtitle="Leadership" />
                {leadSection.members.length === 3 ? (
                  <div className="space-y-7">
                    <div className="mx-auto max-w-[420px]">
                      <MemberCard
                        member={leadSection.members[0]}
                        isAdmin={isAdmin}
                        onEdit={() => setEditorState({ mode: "edit", staff: leadSection.members[0] })}
                        onDelete={() => handleStaffDelete(leadSection.members[0])}
                      />
                    </div>
                    <div className="mx-auto grid max-w-[860px] gap-7 grid-cols-1 md:grid-cols-2">
                      {leadSection.members.slice(1).map((member) => (
                        <MemberCard
                          key={member.staffId}
                          member={member}
                          isAdmin={isAdmin}
                          onEdit={() => setEditorState({ mode: "edit", staff: member })}
                          onDelete={() => handleStaffDelete(member)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mx-auto grid gap-7 ${
                      leadSection.members.length <= 1
                        ? "max-w-[420px] grid-cols-1"
                        : leadSection.members.length === 2
                          ? "max-w-[860px] grid-cols-1 md:grid-cols-2"
                          : "max-w-[1280px] grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    }`}
                  >
                    {leadSection.members.map((member) => (
                      <MemberCard
                        key={member.staffId}
                        member={member}
                        isAdmin={isAdmin}
                        onEdit={() => setEditorState({ mode: "edit", staff: member })}
                        onDelete={() => handleStaffDelete(member)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {secondarySections.length ? (
              <section className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
                {secondarySections.map((section) => (
                  <div key={section.department}>
                    <SectionHeading title={section.department} compact />
                    {section.members.length ? (
                      <div className="space-y-6">
                        {section.members.map((member) => (
                          <MemberCard
                            key={member.staffId}
                            member={member}
                            isAdmin={isAdmin}
                            onEdit={() => setEditorState({ mode: "edit", staff: member })}
                            onDelete={() => handleStaffDelete(member)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-black/15 bg-white/55 px-5 py-8 text-center text-sm text-[#6f6f6f]">
                        등록된 운영진이 없습니다.
                      </div>
                    )}
                  </div>
                ))}
              </section>
            ) : null}
          </div>
        )}
      </main>

      <SiteFooter />

      <StaffEditorDialog
        open={Boolean(editorState)}
        mode={editorState?.mode ?? "create"}
        staff={editorState?.staff}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState(null)
          }
        }}
        onSaved={handleStaffSaved}
      />
    </div>
  )
}

function MemberCard({
  member,
  isAdmin,
  onEdit,
  onDelete,
}: {
  member: StaffItem
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const githubUrl = normalizeExternalUrl(member.githubUrl)
  const instagramUrl = normalizeExternalUrl(member.instagramUrl)

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/45 bg-[#f7f5ef]/90 shadow-[0_16px_36px_rgba(18,30,44,0.08)] backdrop-blur-sm">
      <div className="flex min-h-[128px] items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-full border border-black/45 bg-[#d9d9d9]">
            {member.profileImage ? (
              <Image
                src={resolveMediaUrl(member.profileImage) || "/placeholder-user.jpg"}
                alt={member.name}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="truncate text-[1.8rem] font-black tracking-[-0.04em] text-black">{member.name}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-[#6f8590]">
                <span className="h-px w-4 bg-[#b8c9d3]" />
                {member.role}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#707070]">{member.description}</p>
          </div>
        </div>
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              className="rounded-full text-[#355264] hover:bg-white"
            >
              <PencilLine className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              className="rounded-full text-[#a44a4a] hover:bg-white"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 border-t border-black/25">
        <SocialLink
          href={githubUrl}
          label="Github"
          icon={<Github className="size-4" />}
          className="border-r border-black/20"
        />
        <SocialLink
          href={instagramUrl}
          label="Instagram"
          icon={<Instagram className="size-4" />}
        />
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  subtitle,
  compact = false,
}: {
  title: string
  subtitle?: string
  compact?: boolean
}) {
  return (
    <div className={compact ? "mb-8 text-center" : "mb-8 text-center sm:mb-10"}>
      {subtitle ? (
        <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.36em] text-[#6f8590]">
          {subtitle}
        </p>
      ) : null}
      <div className="flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#9fbfd4]" />
        <h2
          className={
            compact
              ? "text-[1.9rem] font-black tracking-[-0.03em] text-black"
              : "text-[2rem] font-black tracking-[-0.03em] text-black sm:text-[2.35rem]"
          }
        >
          {title}
        </h2>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#9fbfd4]" />
      </div>
    </div>
  )
}

function SocialLink({
  href,
  label,
  icon,
  className = "",
}: {
  href: string
  label: string
  icon: ReactNode
  className?: string
}) {
  const baseClassName =
    `flex items-center justify-center gap-2 px-4 py-3 text-[1rem] font-bold transition sm:px-6 sm:py-4 ${className}`.trim()

  if (!href) {
    return <div className={`${baseClassName} text-black/35`}>{icon}{label}</div>
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${baseClassName} text-black hover:bg-white/70`}
    >
      {icon}
      {label}
    </Link>
  )
}
