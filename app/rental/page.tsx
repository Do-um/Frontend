"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { type ComponentProps, useEffect, useMemo, useRef, useState } from "react"
import { PencilLine, Plus, Search, Sparkles, Trash2, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { HeaderNav } from "@/components/header-nav"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminSession } from "@/hooks/use-admin-session"
import {
  createRental,
  deleteRentalItem,
  fetchMyRentalHistory,
  fetchRentalItems,
  fetchRentalSchedule,
  returnRental,
  type RentalItem,
  type RentalScheduleEntry,
  type UserRentalHistoryItem,
} from "@/lib/content-api"
import { resolveMediaUrl } from "@/lib/media"
import { hasSupabaseEnv } from "@/lib/supabase"
import { cn } from "@/lib/utils"

const RentalItemEditorDialog = dynamic(
  () => import("@/components/pages/rental-item-editor-dialog").then((module) => module.RentalItemEditorDialog),
  { ssr: false },
)

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-"
  }

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

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) {
    return value
  }

  return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) {
    return "기간 정보 없음"
  }

  return `${formatDate(startDate)} ~ ${formatDate(endDate)}`
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function toApiDate(date: Date) {
  return toDateKey(date)
}

function buildReservationLabel(names: string[]) {
  if (!names.length) {
    return null
  }

  const firstName = names[0].length > 4 ? `${names[0].slice(0, 4)}…` : names[0]

  if (names.length === 1) {
    return firstName
  }

  return `${firstName}+${names.length - 1}`
}

function RentalScheduleDayButton({
  className,
  children,
  label,
  tooltip,
  ...props
}: ComponentProps<typeof CalendarDayButton> & {
  label?: string | null
  tooltip?: string | null
}) {
  return (
    <CalendarDayButton
      {...props}
      title={tooltip ?? undefined}
      className={cn(label ? "gap-0.5 pb-1" : "", className)}
    >
      <span>{children}</span>
      {label ? <span className="max-w-full truncate px-1 text-[10px] text-[#4a6a7c]">{label}</span> : null}
    </CalendarDayButton>
  )
}

function getDayCount(from?: Date, to?: Date) {
  if (!from || !to) {
    return 0
  }

  const start = startOfDay(from)
  const end = startOfDay(to)
  const diff = end.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

function getItemStatusMeta(item: RentalItem) {
  if (item.status === "MAINTENANCE") {
    return {
      label: "점검중",
      dotClassName: "bg-amber-500",
      textClassName: "text-gray-600",
      disabled: true,
    }
  }

  if (item.status !== "AVAILABLE") {
    return {
      label: "대여불가",
      dotClassName: "bg-gray-400",
      textClassName: "text-gray-600",
      disabled: true,
    }
  }

  if (item.availableQuantity <= 0) {
    return {
      label: "대여중",
      dotClassName: "bg-red-500",
      textClassName: "text-gray-600",
      disabled: true,
    }
  }

  return {
    label: "대여가능",
    dotClassName: "bg-green-500",
    textClassName: "text-gray-600",
    disabled: false,
  }
}

export default function RentalPage() {
  const { isAdmin, isLoggedIn, isDoumMember, loading: sessionLoading } = useAdminSession()
  const [items, setItems] = useState<RentalItem[]>([])
  const [rentalHistory, setRentalHistory] = useState<UserRentalHistoryItem[]>([])
  const [scheduleEntries, setScheduleEntries] = useState<RentalScheduleEntry[]>([])
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const [quantityInput, setQuantityInput] = useState("1")
  const [purposeInput, setPurposeInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [scheduleError, setScheduleError] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [managingItemId, setManagingItemId] = useState<number | null>(null)
  const [editorState, setEditorState] = useState<{
    mode: "create" | "edit"
    item: RentalItem | null
  } | null>(null)
  const detailSectionRef = useRef<HTMLElement | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.itemId === selectedItemId) ?? null,
    [items, selectedItemId],
  )
  const canUseRentalActions = isAdmin || isDoumMember
  const canManageRentalItems = isAdmin

  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

    if (!keyword) {
      return items
    }

    return items.filter((item) => {
      const itemName = item.name.toLowerCase()
      const categoryName = item.category.toLowerCase()
      return itemName.includes(keyword) || categoryName.includes(keyword)
    })
  }, [items, searchQuery])

  const activeRentals = useMemo(
    () => rentalHistory.filter((item) => !item.returned && item.rentalStatus === "RENTED"),
    [rentalHistory],
  )

  const selectedItemRentals = useMemo(() => {
    if (!selectedItem) {
      return []
    }

    return activeRentals.filter((item) => item.itemId === selectedItem.itemId)
  }, [activeRentals, selectedItem])

  const scheduleEntriesByDate = useMemo(() => {
    const entriesByDate = new Map<string, RentalScheduleEntry[]>()

    scheduleEntries.forEach((entry) => {
      let cursor = parseDateOnly(entry.startDate)
      const endDate = parseDateOnly(entry.endDate)

      while (cursor <= endDate) {
        const key = toDateKey(cursor)
        const currentEntries = entriesByDate.get(key) ?? []
        currentEntries.push(entry)
        entriesByDate.set(key, currentEntries)
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
      }
    })

    return entriesByDate
  }, [scheduleEntries])

  const reservationLabelsByDate = useMemo(() => {
    const labels = new Map<string, string>()

    scheduleEntriesByDate.forEach((entries, key) => {
      const reservedNames = Array.from(
        new Set(entries.map((entry) => entry.reservedByName?.trim()).filter(Boolean) as string[]),
      )
      const label = buildReservationLabel(reservedNames)

      if (label) {
        labels.set(key, label)
      }
    })

    return labels
  }, [scheduleEntriesByDate])

  const reservationTooltipsByDate = useMemo(() => {
    const tooltips = new Map<string, string>()

    scheduleEntriesByDate.forEach((entries, key) => {
      const reservedNames = Array.from(
        new Set(entries.map((entry) => entry.reservedByName?.trim()).filter(Boolean) as string[]),
      )

      if (!reservedNames.length) {
        return
      }

      tooltips.set(key, `예약자: ${reservedNames.join(", ")}`)
    })

    return tooltips
  }, [scheduleEntriesByDate])

  const bookedDateCounts = useMemo(() => {
    const counts = new Map<string, number>()

    scheduleEntries.forEach((entry) => {
      let cursor = parseDateOnly(entry.startDate)
      const endDate = parseDateOnly(entry.endDate)

      while (cursor <= endDate) {
        const key = toDateKey(cursor)
        counts.set(key, (counts.get(key) ?? 0) + entry.quantity)
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
      }
    })

    return counts
  }, [scheduleEntries])

  const fullyBookedDates = useMemo(() => {
    if (!selectedItem) {
      return []
    }

    return Array.from(bookedDateCounts.entries())
      .filter(([, quantity]) => quantity >= selectedItem.totalQuantity)
      .map(([key]) => parseDateOnly(key))
  }, [bookedDateCounts, selectedItem])

  const availableQuantityForRange = useMemo(() => {
    const from = range?.from
    const to = range?.to

    if (!selectedItem || !from || !to) {
      return 0
    }

    let minAvailable = selectedItem.totalQuantity
    let cursor = startOfDay(from)
    const endDate = startOfDay(to)

    while (cursor <= endDate) {
      const key = toDateKey(cursor)
      const reserved = bookedDateCounts.get(key) ?? 0
      minAvailable = Math.min(minAvailable, selectedItem.totalQuantity - reserved)
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
    }

    return Math.max(minAvailable, 0)
  }, [bookedDateCounts, range?.from, range?.to, selectedItem])

  async function loadItems() {
    setLoadingItems(true)
    setError("")

    try {
      const data = await fetchRentalItems()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "대여 물품 정보를 불러오지 못했습니다.")
    } finally {
      setLoadingItems(false)
    }
  }

  async function loadRentalHistory() {
    if (!isLoggedIn || !canUseRentalActions) {
      setRentalHistory([])
      return
    }

    setLoadingHistory(true)
    try {
      const data = await fetchMyRentalHistory()
      setRentalHistory(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "내 대여 내역을 불러오지 못했습니다.")
    } finally {
      setLoadingHistory(false)
    }
  }

  async function loadRentalSchedule(itemId: number) {
    if (!isLoggedIn || !canUseRentalActions) {
      setScheduleEntries([])
      setScheduleError("")
      setLoadingSchedule(false)
      return
    }

    setLoadingSchedule(true)
    setScheduleError("")

    try {
      const data = await fetchRentalSchedule(itemId)
      setScheduleEntries(data)
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "예약 일정을 불러오지 못했습니다.")
      setScheduleEntries([])
    } finally {
      setLoadingSchedule(false)
    }
  }

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setError("Supabase 환경변수 설정이 필요합니다.")
      setLoadingItems(false)
      return
    }

    void loadItems()
  }, [])

  useEffect(() => {
    if (sessionLoading || !hasSupabaseEnv()) {
      return
    }

    if (!isLoggedIn || !canUseRentalActions) {
      setRentalHistory([])
      return
    }

    void loadRentalHistory()
  }, [canUseRentalActions, isLoggedIn, sessionLoading])

  useEffect(() => {
    if (!selectedItemId) {
      return
    }

    detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [selectedItemId])

  function handleOpen(itemId: number) {
    setSelectedItemId(itemId)
    setRange(undefined)
    setQuantityInput("1")
    setPurposeInput("")
    setActionError("")
    setScheduleError("")
    setScheduleEntries([])
    void loadRentalSchedule(itemId)
  }

  function handleClose() {
    setSelectedItemId(null)
    setRange(undefined)
    setQuantityInput("1")
    setPurposeInput("")
    setActionError("")
    setScheduleError("")
    setScheduleEntries([])
  }

  function handleEditorSaved(savedItem: RentalItem) {
    setItems((current) => {
      const exists = current.some((item) => item.itemId === savedItem.itemId)
      if (!exists) {
        return [savedItem, ...current]
      }

      return current.map((item) => (item.itemId === savedItem.itemId ? savedItem : item))
    })

    if (selectedItemId === savedItem.itemId) {
      setSelectedItemId(savedItem.itemId)
    }
  }

  async function refreshAfterMutation() {
    await Promise.all([
      loadItems(),
      isLoggedIn && canUseRentalActions ? loadRentalHistory() : Promise.resolve(),
      selectedItemId && isLoggedIn && canUseRentalActions ? loadRentalSchedule(selectedItemId) : Promise.resolve(),
    ])
  }

  async function handleRent() {
    if (!selectedItem) {
      return
    }

    if (!isLoggedIn) {
      setActionError("로그인 후 대여할 수 있습니다.")
      return
    }

    if (!canUseRentalActions) {
      setActionError("대여와 반납은 어드민 및 두음 회원만 사용할 수 있습니다.")
      return
    }

    const selectedFrom = range?.from
    const selectedTo = range?.to

    if (!selectedFrom || !selectedTo) {
      setActionError("대여 기간을 달력에서 선택해 주세요.")
      return
    }

    if (!purposeInput.trim()) {
      setActionError("대여 사유를 입력해 주세요.")
      return
    }

    const quantity = Number(quantityInput)
    if (!Number.isFinite(quantity) || quantity < 1) {
      setActionError("대여 수량은 1개 이상이어야 합니다.")
      return
    }

    const selectedDayCount = getDayCount(selectedFrom, selectedTo)
    if (selectedDayCount > selectedItem.maxRentalDays) {
      setActionError(`최대 대여 기간은 ${selectedItem.maxRentalDays}일입니다.`)
      return
    }

    if (quantity > availableQuantityForRange) {
      setActionError(`선택한 기간에 대여 가능한 수량은 ${availableQuantityForRange}개입니다.`)
      return
    }

    setSubmitting(true)
    setActionError("")

    try {
      await createRental({
        itemId: selectedItem.itemId,
        quantity,
        startDate: toApiDate(selectedFrom),
        endDate: toApiDate(selectedTo),
        purpose: purposeInput.trim(),
      })

      setRange(undefined)
      setQuantityInput("1")
      setPurposeInput("")
      await refreshAfterMutation()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "대여 신청 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReturn(rentalId: number) {
    if (!isLoggedIn) {
      setActionError("로그인 후 반납할 수 있습니다.")
      return
    }

    if (!canUseRentalActions) {
      setActionError("대여와 반납은 어드민 및 두음 회원만 사용할 수 있습니다.")
      return
    }

    setSubmitting(true)
    setActionError("")

    try {
      await returnRental(rentalId)
      await refreshAfterMutation()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "반납 처리 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteItem(item: RentalItem) {
    if (!canManageRentalItems) {
      return
    }

    if (!window.confirm(`${item.name} 물품을 삭제할까요?`)) {
      return
    }

    setManagingItemId(item.itemId)
    setDeleteError("")

    try {
      await deleteRentalItem(item.itemId)
      setItems((current) => current.filter((entry) => entry.itemId !== item.itemId))
      if (selectedItemId === item.itemId) {
        handleClose()
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "물품 삭제 중 오류가 발생했습니다.")
    } finally {
      setManagingItemId(null)
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/recruit-bg.png')" }}
    >
      <HeaderNav />

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
        <section className="mb-14 flex flex-col items-center text-center">
          <div className="animate-float relative flex h-28 w-28 items-center justify-center rounded-full bg-white/70 shadow-[0_18px_50px_rgba(65,106,133,0.12)] backdrop-blur-sm">
            <Image src="/doum-logo-large.png" alt="DO,UM 로고" width={62} height={88} priority />
          </div>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6a7d88]">
            <Sparkles className="size-3.5" />
            Rental Archive
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-black sm:text-5xl">물품 대여</h1>
          <p className="mt-4 max-w-3xl text-base text-[#677680] sm:text-lg">
            물품 목록과 상세 조회는 누구나 가능하고, 예약 일정과 실제 대여는 로그인된 두음 회원 및 관리자 기준으로 제공합니다.
          </p>
        </section>

        {error ? (
          <div className="mb-8 rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-5 py-4 text-sm text-[#9a3b3b]">
            {error}
          </div>
        ) : null}

        <section>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">대여 가능 물품</h2>
              <p className="mt-1 text-sm text-gray-600">
                {searchQuery.trim() ? (
                  <>
                    검색 결과 <span className="font-semibold text-gray-900">{filteredItems.length}</span>개
                    <span className="mx-1 text-gray-400">/</span>전체
                    <span className="ml-1 font-semibold text-gray-900">{items.length}</span>개 물품
                  </>
                ) : (
                  <>
                    총 <span className="font-semibold text-gray-900">{items.length}</span>개 물품
                  </>
                )}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b8f99]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="물품 이름 또는 분류 검색"
                  className="h-11 rounded-full border-[#d7e5ee] bg-white/90 pl-11 pr-11 text-sm text-[#243440] placeholder:text-[#8ca0aa]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7b8f99] transition hover:bg-[#eef4f8] hover:text-[#355264]"
                    aria-label="검색어 지우기"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              {canManageRentalItems ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditorState({ mode: "create", item: null })}
                  className="rounded-full border-[#d7e5ee] bg-white/90 px-4 text-[#355264] hover:bg-white"
                >
                  <Plus className="size-4" />
                  물품 추가
                </Button>
              ) : null}
            </div>
          </div>
          {deleteError ? (
            <div className="mb-6 rounded-2xl border border-[#f1cccc] bg-[#fff6f6] px-5 py-4 text-sm text-[#9a3b3b]">
              {deleteError}
            </div>
          ) : null}

          {loadingItems ? (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
              대여 물품 정보를 불러오는 중입니다...
            </div>
          ) : filteredItems.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const statusMeta = getItemStatusMeta(item)
                const itemImageUrl = resolveMediaUrl(item.itemImage) || "/placeholder.svg"

                return (
                  <article
                    key={item.itemId}
                    className={`overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-1 ${
                      selectedItemId === item.itemId ? "ring-2 ring-[#9ec6df] shadow-[0_18px_34px_rgba(72,122,151,0.18)]" : ""
                    }`}
                    onClick={() => handleOpen(item.itemId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        handleOpen(item.itemId)
                      }
                    }}
                  >
                    <div className="relative h-32 w-full bg-[#f3f3f3] sm:h-36">
                      <Image
                        src={itemImageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 90vw"
                      />
                      {canManageRentalItems ? (
                        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              setEditorState({ mode: "edit", item })
                            }}
                            className="rounded-full bg-white/88 text-[#355264] shadow-sm hover:bg-white"
                          >
                            <PencilLine className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={managingItemId === item.itemId}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              void handleDeleteItem(item)
                            }}
                            className="rounded-full bg-white/88 text-[#a44a4a] shadow-sm hover:bg-white"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2.5 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                          <p className="mt-0.5 text-[11px] font-medium text-[#7b8f99]">
                            {item.category}
                          </p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-[12px] font-medium ${statusMeta.textClassName}`}>
                          <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="h-10 overflow-hidden text-[13px] leading-5 text-gray-600">
                        {item.description || "물품 설명이 아직 등록되지 않았습니다."}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">총 {item.totalQuantity}개</span>
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">
                          오늘 대여 가능 {item.availableQuantity}개
                        </span>
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">
                          최대 {item.maxRentalDays}일
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-gray-500 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
              {searchQuery.trim() ? "검색 조건에 맞는 물품이 없습니다." : "등록된 대여 물품이 없습니다."}
            </div>
          )}
        </section>

        {selectedItem ? (
          <section
            ref={detailSectionRef}
            className="mt-12 overflow-hidden rounded-[32px] bg-[#f9f6f1] shadow-[0_22px_70px_rgba(29,49,63,0.12)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr]">
              <div className="border-b border-[#e8ecef] bg-[#f3f6f8] p-5 lg:border-b-0 lg:border-r lg:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6a7d88]">대여 상세</p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleClose}
                    className="rounded-full text-[#5d7482] hover:bg-white/70 hover:text-[#223541]"
                    aria-label="상세 닫기"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_40px_rgba(47,74,91,0.08)]">
                      <div className="relative h-44 w-full bg-[#e9eef1] lg:h-48">
                        <Image
                          src={resolveMediaUrl(selectedItem.itemImage) || "/placeholder.svg"}
                          alt={selectedItem.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1280px) 420px, (min-width: 1024px) 540px, 100vw"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-gray-600">
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">{selectedItem.category}</span>
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">총 {selectedItem.totalQuantity}개</span>
                        <span className="rounded-full bg-[#f1f6f9] px-3 py-1.5">최대 {selectedItem.maxRentalDays}일</span>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_rgba(47,74,91,0.08)]">
                      <p className="text-sm font-semibold text-gray-800">대여 기간 선택</p>
                      <div className="mt-3 overflow-x-auto">
                        <Calendar
                          mode="range"
                          selected={range}
                          onSelect={(nextRange) => {
                            setRange(nextRange)
                            setActionError("")
                          }}
                          disabled={(date) =>
                            startOfDay(date) < startOfDay() ||
                            fullyBookedDates.some((blockedDate) => blockedDate.toDateString() === date.toDateString())
                          }
                          modifiers={{
                            booked: (date) =>
                              fullyBookedDates.some((blockedDate) => blockedDate.toDateString() === date.toDateString()),
                          }}
                          modifiersClassNames={{
                            booked: "bg-blue-100 text-blue-900 opacity-60",
                          }}
                          components={{
                            DayButton: (props) => {
                              const dateKey = toDateKey(props.day.date)

                              return (
                                <RentalScheduleDayButton
                                  {...props}
                                  label={reservationLabelsByDate.get(dateKey)}
                                  tooltip={reservationTooltipsByDate.get(dateKey)}
                                />
                              )
                            },
                          }}
                          className="w-full [--cell-size:--spacing(10)] xl:[--cell-size:--spacing(9)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                        <p className="text-sm font-semibold text-gray-800">예약 안내</p>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          달력의 예약 표시는 해당 날짜에 이미 예약을 진행한 사람입니다. 수량이 모두 찬 날짜는 선택할 수 없습니다.
                        </p>
                      </div>
                      <div className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                        <p className="text-sm font-semibold text-gray-800">선택 기간 가용 수량</p>
                        <p className="mt-2 text-[2rem] font-bold leading-none text-[#223541]">{availableQuantityForRange}개</p>
                        <p className="mt-2 text-xs leading-5 text-gray-500">최대 대여 기간은 {selectedItem.maxRentalDays}일입니다.</p>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                      <p className="text-sm font-semibold text-gray-800">현재 예약 일정</p>
                      {!isLoggedIn ? (
                        <p className="mt-2 text-sm text-gray-500">로그인 후 예약 일정을 확인할 수 있습니다.</p>
                      ) : !canUseRentalActions ? (
                        <p className="mt-2 text-sm text-gray-500">현재 계정은 조회 전용입니다. 리더보드 또는 회원만 예약 일정을 확인할 수 있습니다.</p>
                      ) : scheduleError ? (
                        <p className="mt-2 text-sm text-red-500">{scheduleError}</p>
                      ) : loadingSchedule ? (
                        <p className="mt-2 text-sm text-gray-500">예약 일정을 불러오는 중입니다...</p>
                      ) : scheduleEntries.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-gray-600 xl:max-h-[18rem] xl:overflow-y-auto xl:pr-1">
                          {scheduleEntries.map((entry) => (
                            <li
                              key={entry.rentalId}
                              className="rounded-2xl border border-[#e3edf2] bg-[#f8fbfd] px-3 py-2.5"
                            >
                              <p className="text-sm font-medium text-gray-700">
                                {formatDateRange(entry.startDate, entry.endDate)} · {entry.quantity}개 예약
                              </p>
                              {entry.reservedByName ? <p className="mt-1 text-sm font-medium text-[#355264]">예약자 {entry.reservedByName}</p> : null}
                              <p className="mt-1 text-xs leading-5 text-gray-500">{entry.purpose || "사유 미입력"}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">현재 예약된 일정이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-white p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                  <p className="text-sm font-semibold text-gray-800">대여 정보 입력</p>
                  <div className="mt-4 space-y-3">
                    <Input
                      type="number"
                      min={1}
                      max={selectedItem.totalQuantity}
                      value={quantityInput}
                      onChange={(event) => setQuantityInput(event.target.value)}
                      placeholder="대여 수량"
                      disabled={!isLoggedIn || !canUseRentalActions || submitting}
                    />
                    <Textarea
                      value={purposeInput}
                      onChange={(event) => setPurposeInput(event.target.value)}
                      placeholder="대여 사유를 입력해 주세요."
                      className="min-h-[120px]"
                      disabled={!isLoggedIn || !canUseRentalActions || submitting}
                    />
                    <div className="rounded-2xl bg-[#f7fafc] px-4 py-3 text-xs text-gray-600">
                      선택한 기간:{" "}
                      {range?.from && range?.to
                        ? `${formatDate(toApiDate(range.from))} ~ ${formatDate(toApiDate(range.to))}`
                        : "기간을 선택해 주세요."}
                    </div>
                    {!isLoggedIn ? (
                      <p className="text-xs text-gray-500">로그인 후 대여할 수 있습니다.</p>
                    ) : !canUseRentalActions ? (
                      <p className="text-xs text-gray-500">현재 계정은 조회 전용입니다. 어드민 및 두음 회원만 대여할 수 있습니다.</p>
                    ) : null}
                    {actionError ? <p className="text-xs text-red-500">{actionError}</p> : null}
                    <Button
                      className="w-full"
                      onClick={handleRent}
                      disabled={!isLoggedIn || !canUseRentalActions || submitting || getItemStatusMeta(selectedItem).disabled}
                    >
                      {submitting ? "처리 중.." : "대여 신청"}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-white p-5 shadow-[0_16px_40px_rgba(47,74,91,0.06)]">
                  <p className="text-sm font-semibold text-gray-800">이 물품의 내 대여 내역</p>
                  {!isLoggedIn ? (
                    <p className="mt-3 text-sm text-gray-500">로그인 후 확인할 수 있습니다.</p>
                  ) : !canUseRentalActions ? (
                    <p className="mt-3 text-sm text-gray-500">현재 계정은 조회 전용입니다.</p>
                  ) : selectedItemRentals.length ? (
                    <div className="mt-3 space-y-2">
                      {selectedItemRentals.map((rental) => (
                        <div
                          key={rental.rentalId}
                          className="rounded-2xl border border-[#e3edf2] bg-[#f8fbfd] px-4 py-4"
                        >
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDateRange(rental.startDate, rental.endDate)} · {rental.quantity}개
                          </p>
                          <p className="mt-2 text-sm text-gray-600">{rental.purpose || "사유 미입력"}</p>
                          <p className="mt-1 text-xs text-gray-500">신청 시각 {formatDateTime(rental.rentedAt)}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturn(rental.rentalId)}
                            disabled={submitting}
                            className="mt-3 rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                          >
                            반납하기
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500">현재 이 물품으로 진행 중인 내 대여 기록이 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12 rounded-2xl bg-white/88 p-6 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900">내 대여 현황</h2>
            <p className="text-sm text-gray-600">
              {isLoggedIn && canUseRentalActions
                ? `현재 대여 중 ${activeRentals.length}건`
                : "어드민 및 두음 회원 로그인 시 대여 내역을 확인할 수 있습니다."}
            </p>
          </div>

          {!isLoggedIn ? (
            <p className="text-sm text-gray-500">로그인 후 물품 대여 권한을 확인할 수 있습니다.</p>
          ) : !canUseRentalActions ? (
            <p className="text-sm text-gray-500">현재 계정은 조회 전용입니다. 대여와 반납은 어드민 및 두음 회원만 가능합니다.</p>
          ) : loadingHistory ? (
            <p className="text-sm text-gray-500">내 대여 내역을 불러오는 중입니다...</p>
          ) : activeRentals.length ? (
            <div className="space-y-3">
              {activeRentals.map((rental) => (
                <div
                  key={rental.rentalId}
                  className="flex flex-col gap-3 rounded-2xl border border-[#e3edf2] bg-[#f8fbfd] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{rental.itemName}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {rental.quantity}개 · {formatDateRange(rental.startDate, rental.endDate)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{rental.purpose || "사유 미입력"}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReturn(rental.rentalId)}
                    disabled={submitting}
                    className="rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                  >
                    반납하기
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">현재 대여 중인 물품이 없습니다.</p>
          )}
        </section>
      </main>
      <footer className="border-t border-gray-300 bg-transparent py-10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="mb-2 text-base font-bold text-gray-900">DO,UM</p>
          <p className="mb-1 text-xs text-gray-600">소프트웨어융합대학 SW봉사 동아리</p>
          <p className="mb-4 text-xs text-gray-600">Contact: doum2018@kookmin.ac.kr</p>
          <p className="text-xs text-gray-500">© DO,UM</p>
        </div>
      </footer>

      <RentalItemEditorDialog
        open={Boolean(editorState)}
        mode={editorState?.mode ?? "create"}
        item={editorState?.item}
        onOpenChange={(open) => {
          if (!open) {
            setEditorState(null)
          }
        }}
        onSaved={handleEditorSaved}
      />
    </div>
  )
}
