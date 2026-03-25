"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronRight, Search, ShieldCheck, Trash2, Users } from "lucide-react"

import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAdminSession } from "@/hooks/use-admin-session"
import { normalizeUserRole, type NormalizedUserRole } from "@/lib/auth"
import { deleteManagedUser, fetchManagedUsers, updateManagedUserRole, type ManagedUser } from "@/lib/content-api"

const roleOptions: Array<{ value: NormalizedUserRole; label: string; description: string }> = [
  { value: "ADMIN", label: "어드민", description: "모든 수정과 권한 관리 가능" },
  { value: "DOUM_MEMBER", label: "두음부원", description: "대여 기능 사용 가능" },
  { value: "OUTSIDER", label: "이외", description: "조회 전용" },
]

const PAGE_SIZE = 10

const rolePriority: Record<NormalizedUserRole, number> = {
  ADMIN: 0,
  DOUM_MEMBER: 1,
  OUTSIDER: 2,
}

function getRoleLabel(role: NormalizedUserRole) {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getUserInitial(name: string, email: string) {
  const source = name.trim() || email.trim()
  return source.slice(0, 1).toUpperCase()
}

type UserRoleFilter = "ADMIN_AND_MEMBER" | "ALL" | NormalizedUserRole

export default function AdminUsersPage() {
  const { user, isAdmin, isLoggedIn, loading: sessionLoading } = useAdminSession()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("ADMIN_AND_MEMBER")
  const [draftRoles, setDraftRoles] = useState<Record<number, NormalizedUserRole>>({})
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError("")

      try {
        const response = await fetchManagedUsers()
        if (!cancelled) {
          setUsers(response)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "회원 목록을 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (sessionLoading) {
      return () => {
        cancelled = true
      }
    }

    if (!isAdmin) {
      setUsers([])
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [isAdmin, sessionLoading])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return [...users]
      .sort((left, right) => {
        const leftRole = normalizeUserRole(left.role)
        const rightRole = normalizeUserRole(right.role)
        const roleDiff = rolePriority[leftRole] - rolePriority[rightRole]
        if (roleDiff !== 0) {
          return roleDiff
        }

        return right.createdAt.localeCompare(left.createdAt)
      })
      .filter((member) => {
        const normalizedRole = normalizeUserRole(member.role)
        const matchesRole =
          roleFilter === "ALL" ||
          (roleFilter === "ADMIN_AND_MEMBER" &&
            (normalizedRole === "ADMIN" || normalizedRole === "DOUM_MEMBER")) ||
          normalizedRole === roleFilter
        if (!matchesRole) {
          return false
        }

        if (!normalizedQuery) {
          return true
        }

        const target = `${member.name} ${member.email}`.toLowerCase()
        return target.includes(normalizedQuery)
      })
  }, [roleFilter, searchQuery, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredUsers, page])

  const summary = useMemo(() => {
    return users.reduce(
      (counts, member) => {
        const role = normalizeUserRole(member.role)
        counts.total += 1
        counts[role] += 1
        return counts
      },
      {
        total: 0,
        ADMIN: 0,
        DOUM_MEMBER: 0,
        OUTSIDER: 0,
      },
    )
  }, [users])

  const selectedUser = useMemo(
    () => users.find((member) => member.id === selectedUserId) ?? null,
    [selectedUserId, users],
  )

  useEffect(() => {
    setPage(1)
  }, [roleFilter, searchQuery])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  async function handleRoleSave(targetUser: ManagedUser) {
    const currentRole = normalizeUserRole(targetUser.role)
    const nextRole = draftRoles[targetUser.id] ?? currentRole

    if (nextRole === currentRole) {
      return
    }

    setSavingUserId(targetUser.id)
    setError("")
    setNotice("")

    try {
      const updated = await updateManagedUserRole(targetUser.id, nextRole)
      setUsers((current) => current.map((member) => (member.id === updated.id ? updated : member)))
      setDraftRoles((current) => {
        const next = { ...current }
        delete next[targetUser.id]
        return next
      })
      setNotice(`${updated.name} 권한을 ${getRoleLabel(nextRole)}으로 변경했습니다.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "권한 변경 중 오류가 발생했습니다.")
    } finally {
      setSavingUserId(null)
    }
  }

  async function handleUserDelete(targetUser: ManagedUser) {
    if (!window.confirm(`"${targetUser.name}" 회원을 삭제할까요?\n다시 로그인하면 일반 사용자로 다시 생성될 수 있습니다.`)) {
      return
    }

    setDeletingUserId(targetUser.id)
    setError("")
    setNotice("")

    try {
      await deleteManagedUser(targetUser.id)
      setUsers((current) => current.filter((member) => member.id !== targetUser.id))
      if (selectedUserId === targetUser.id) {
        setSelectedUserId(null)
      }
      setDraftRoles((current) => {
        const next = { ...current }
        delete next[targetUser.id]
        return next
      })
      setNotice(`${targetUser.name} 회원을 삭제했습니다.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 삭제 중 오류가 발생했습니다.")
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#eef4f1]"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(141, 189, 170, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(132, 174, 211, 0.20), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(240,245,242,0.95) 100%)",
      }}
    >
      <HeaderNav />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-14">
        <section className="rounded-[32px] border border-black/10 bg-white/80 px-6 py-8 shadow-[0_20px_50px_rgba(24,35,45,0.08)] backdrop-blur-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c8d8d0] bg-[#f3f8f5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6a63]">
                <ShieldCheck className="size-4" />
                Admin Console
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em] text-[#18232d] sm:text-4xl">회원 권한 관리</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6f69]">
                  로그인한 회원 계정의 역할을 어드민, 두음부원, 이외로 관리합니다. 기본 보기는 어드민과
                  두음부원만 표시되며, 대여 기능은 어드민과 두음부원만 사용할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#dbe7e0] bg-[#f7fbf8] px-5 py-4 text-sm text-[#4e635d]">
              <p className="font-semibold text-[#243440]">{user?.name ?? "관리자"}</p>
              <p className="mt-1">{user?.email ?? ""}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard icon={<Users className="size-4" />} label="전체 회원" value={summary.total} accent="text-[#29465a]" />
          <SummaryCard label="어드민" value={summary.ADMIN} accent="text-[#0f5c5c]" />
          <SummaryCard label="두음부원" value={summary.DOUM_MEMBER} accent="text-[#355264]" />
          <SummaryCard label="이외" value={summary.OUTSIDER} accent="text-[#7b5a4c]" />
        </section>

        <section className="mt-8 rounded-[32px] border border-black/10 bg-white/82 p-6 shadow-[0_20px_50px_rgba(24,35,45,0.07)] backdrop-blur-sm">
          {sessionLoading || loading ? (
            <div className="rounded-[24px] border border-dashed border-[#c8d8d0] bg-[#f7fbf8] px-6 py-12 text-center text-sm text-[#61736d]">
              회원 정보를 불러오는 중입니다...
            </div>
          ) : !isLoggedIn ? (
            <BlockedState
              title="로그인이 필요합니다."
              description="권한 관리 페이지는 관리자 로그인 후 접근할 수 있습니다."
              actionHref="/login"
              actionLabel="로그인하기"
            />
          ) : !isAdmin ? (
            <BlockedState
              title="관리자 권한이 필요합니다."
              description="이 페이지는 어드민만 접근할 수 있습니다."
              actionHref="/"
              actionLabel="홈으로 이동"
            />
          ) : (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7a8d88]" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="이름 또는 이메일로 검색"
                    className="h-11 rounded-full border-[#d8e3de] bg-[#f9fbfa] pl-10 pr-4 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <RoleFilterButton
                    active={roleFilter === "ADMIN_AND_MEMBER"}
                    label="어드민 + 두음 회원"
                    onClick={() => setRoleFilter("ADMIN_AND_MEMBER")}
                  />
                  <RoleFilterButton active={roleFilter === "ALL"} label="전체" onClick={() => setRoleFilter("ALL")} />
                  {roleOptions.map((option) => (
                    <RoleFilterButton
                      key={option.value}
                      active={roleFilter === option.value}
                      label={option.label}
                      onClick={() => setRoleFilter(option.value)}
                    />
                  ))}
                </div>
              </div>

              {notice ? (
                <p className="mt-4 rounded-2xl border border-[#cfe5d7] bg-[#f4fbf6] px-4 py-3 text-sm text-[#315c46]">
                  {notice}
                </p>
              ) : null}
              {error ? (
                <p className="mt-4 rounded-2xl border border-[#f0cfcf] bg-[#fff6f6] px-4 py-3 text-sm text-[#9a3b3b]">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 space-y-4">
                {paginatedUsers.length ? (
                  paginatedUsers.map((member) => {
                    const currentRole = normalizeUserRole(member.role)
                    const isSelf = user?.id === member.id

                    return (
                      <article
                        key={member.id}
                        className="rounded-[28px] border border-[#dbe6e1] bg-[#fbfcfb] shadow-[0_10px_24px_rgba(24,35,45,0.04)] transition hover:border-[#c6d7d0] hover:bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(member.id)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c9d6d1] bg-[#edf4f1] text-lg font-bold text-[#274457]">
                              {member.profileImageUrl ? (
                                <img
                                  src={member.profileImageUrl}
                                  alt={member.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getUserInitial(member.name, member.email)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xl font-black tracking-[-0.03em] text-[#18232d]">{member.name}</p>
                                <span className="rounded-full bg-[#eef4f1] px-3 py-1 text-xs font-semibold text-[#4f6a63]">
                                  {getRoleLabel(currentRole)}
                                </span>
                                {isSelf ? (
                                  <span className="rounded-full bg-[#243440] px-3 py-1 text-xs font-semibold text-white">
                                    본인
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 break-all text-sm text-[#556761]">{member.email}</p>
                            </div>
                          </div>

                          <span className="hidden shrink-0 items-center gap-2 rounded-full bg-[#f3f7f5] px-4 py-2 text-sm font-semibold text-[#566862] sm:inline-flex">
                            상세 보기
                            <ChevronRight className="size-4" />
                          </span>
                        </button>
                      </article>
                    )
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#c8d8d0] bg-[#f7fbf8] px-6 py-12 text-center text-sm text-[#61736d]">
                    조건에 맞는 회원이 없습니다.
                  </div>
                )}
              </div>

              {filteredUsers.length ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#61736d]">
                    총 <span className="font-semibold text-[#243440]">{filteredUsers.length}</span>명 중{" "}
                    <span className="font-semibold text-[#243440]">{(page - 1) * PAGE_SIZE + 1}</span>-
                    <span className="font-semibold text-[#243440]">
                      {Math.min(page * PAGE_SIZE, filteredUsers.length)}
                    </span>
                    명 표시
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                      className="rounded-full border-[#d8e3de] bg-white px-4 text-[#355264] hover:bg-[#f7fbfd]"
                    >
                      이전
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                      const pageNumber = index + 1
                      return (
                        <RoleFilterButton
                          key={`page-${pageNumber}`}
                          active={page === pageNumber}
                          label={String(pageNumber)}
                          onClick={() => setPage(pageNumber)}
                        />
                      )
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                      className="rounded-full border-[#d8e3de] bg-white px-4 text-[#355264] hover:bg-[#f7fbfd]"
                    >
                      다음
                    </Button>
                  </div>
                </div>
              ) : null}

              <Dialog open={selectedUser !== null} onOpenChange={(open) => (!open ? setSelectedUserId(null) : undefined)}>
                {selectedUser ? (
                  <DialogContent className="max-w-2xl rounded-[32px] border border-[#dbe6e1] bg-[#fbfcfb] p-0 shadow-[0_20px_60px_rgba(24,35,45,0.12)]">
                    <UserDetailDialogContent
                      currentViewerId={user?.id ?? null}
                      deletingUserId={deletingUserId}
                      draftRole={draftRoles[selectedUser.id] ?? normalizeUserRole(selectedUser.role)}
                      member={selectedUser}
                      onDelete={handleUserDelete}
                      onDraftRoleChange={(nextRole) =>
                        setDraftRoles((current) => ({
                          ...current,
                          [selectedUser.id]: nextRole,
                        }))
                      }
                      onRoleSave={handleRoleSave}
                      savingUserId={savingUserId}
                    />
                  </DialogContent>
                ) : null}
              </Dialog>
            </>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function UserDetailDialogContent({
  member,
  currentViewerId,
  draftRole,
  savingUserId,
  deletingUserId,
  onDraftRoleChange,
  onRoleSave,
  onDelete,
}: {
  member: ManagedUser
  currentViewerId: number | null
  draftRole: NormalizedUserRole
  savingUserId: number | null
  deletingUserId: number | null
  onDraftRoleChange: (role: NormalizedUserRole) => void
  onRoleSave: (member: ManagedUser) => Promise<void>
  onDelete: (member: ManagedUser) => Promise<void>
}) {
  const currentRole = normalizeUserRole(member.role)
  const isDirty = draftRole !== currentRole
  const isSelf = currentViewerId === member.id
  const isSaving = savingUserId === member.id
  const isDeleting = deletingUserId === member.id

  return (
    <div className="p-6 sm:p-8">
      <DialogHeader className="border-b border-[#e4ece8] pb-5 text-left">
        <div className="flex items-start gap-4 pr-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c9d6d1] bg-[#edf4f1] text-xl font-bold text-[#274457]">
            {member.profileImageUrl ? (
              <img src={member.profileImageUrl} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              getUserInitial(member.name, member.email)
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#18232d]">
                {member.name}
              </DialogTitle>
              <span className="rounded-full bg-[#eef4f1] px-3 py-1 text-xs font-semibold text-[#4f6a63]">
                {getRoleLabel(currentRole)}
              </span>
              {isSelf ? (
                <span className="rounded-full bg-[#243440] px-3 py-1 text-xs font-semibold text-white">본인</span>
              ) : null}
            </div>
            <DialogDescription className="mt-2 break-all text-sm text-[#556761]">
              {member.email}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <DetailItem label="가입일" value={formatDateTime(member.createdAt)} />
        <DetailItem label="최근 갱신" value={formatDateTime(member.updatedAt)} />
        <DetailItem label="로그인 방식" value={member.provider} />
        <DetailItem label="회원 역할" value={getRoleLabel(currentRole)} />
      </div>

      <div className="mt-6 rounded-[24px] border border-[#dbe6e1] bg-white px-5 py-5">
        <label
          htmlFor={`role-${member.id}`}
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7f79]"
        >
          권한 변경
        </label>
        <select
          id={`role-${member.id}`}
          value={draftRole}
          onChange={(event) => onDraftRoleChange(event.target.value as NormalizedUserRole)}
          disabled={isSelf || isSaving || isDeleting}
          className="h-12 w-full rounded-2xl border border-[#d8e3de] bg-[#fbfcfb] px-4 text-sm text-[#243440] outline-none transition focus:border-[#8fb3c6]"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} · {option.description}
            </option>
          ))}
        </select>
        {isSelf ? (
          <p className="mt-3 text-xs text-[#7a6a61]">현재 로그인한 관리자 본인 계정은 이 페이지에서 변경할 수 없습니다.</p>
        ) : null}
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => void onDelete(member)}
          disabled={isSelf || isSaving || isDeleting}
          className="h-11 rounded-2xl border-[#efc9c9] bg-white px-4 text-[#a44a4a] hover:bg-[#fff5f5]"
        >
          <Trash2 className="size-4" />
          {isDeleting ? "삭제 중..." : "회원 삭제"}
        </Button>
        <Button
          type="button"
          onClick={() => void onRoleSave(member)}
          disabled={isSelf || !isDirty || isSaving || isDeleting}
          className="h-11 rounded-2xl bg-[#243440] px-5 text-white hover:bg-[#1b2b36]"
        >
          {isSaving ? "저장 중..." : "권한 저장"}
        </Button>
      </DialogFooter>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#e3ebe7] bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#748680]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#243440]">{value}</p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: number
  accent: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white/78 px-5 py-5 shadow-[0_12px_28px_rgba(24,35,45,0.06)] backdrop-blur-sm">
      <div className={`flex items-center gap-2 text-sm font-semibold ${accent}`}>
        {icon}
        {label}
      </div>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#18232d]">{value}</p>
    </div>
  )
}

function RoleFilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-[#243440] text-white shadow-sm" : "bg-[#f3f7f5] text-[#566862] hover:bg-[#ebf1ee]"
      }`}
    >
      {label}
    </button>
  )
}

function BlockedState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#c8d8d0] bg-[#f7fbf8] px-6 py-12 text-center">
      <p className="text-lg font-bold text-[#243440]">{title}</p>
      <p className="mt-3 text-sm text-[#61736d]">{description}</p>
      <Button asChild className="mt-6 rounded-full bg-[#243440] px-5 text-white hover:bg-[#1b2b36]">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  )
}
