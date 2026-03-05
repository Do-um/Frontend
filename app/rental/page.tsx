"use client"

import { useMemo, useState } from "react"
import { useEffect } from "react"
import Image from "next/image"
import { HeaderNav } from "@/components/header-nav"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type RentalItem = {
  id: string
  name: string
  image: string
  status: "대여중" | "대여가능"
  totalQuantity: number
}

type Booking = {
  id: string
  borrower: string
  purpose: string
  quantity: number
  from: Date
  to: Date
}

// 관리자 관리 영역: 최대 9개까지 추가/수정 가능
// name, image 값을 관리자가 변경해 업데이트합니다.
const rentalItems: RentalItem[] = [
  {
    id: "smart-cute-bot",
    name: "Smart Cute Bot",
    image: "/rental-smart-cute-bot.png",
    status: "대여중",
    totalQuantity: 10,
  },
  {
    id: "microbit",
    name: "Microbit",
    image: "/rental-microbit.png",
    status: "대여가능",
    totalQuantity: 10,
  },
  {
    id: "sqld-book",
    name: "SQLD 책",
    image: "/rental-sqld.png",
    status: "대여중",
    totalQuantity: 1,
  },
]

const statusStyles: Record<string, { dot: string; text: string }> = {
  대여중: { dot: "bg-red-500", text: "text-gray-600" },
  대여가능: { dot: "bg-green-500", text: "text-gray-600" },
}

const initialBookings: Record<string, Booking[]> = {}

export default function RentalPage() {
  // TODO: 인증 연동 시 관리자 여부를 서버에서 판별해 주세요.
  const isAdmin = true

  const [selectedItem, setSelectedItem] = useState<RentalItem | null>(null)
  const [bookings, setBookings] = useState<Record<string, Booking[]>>(initialBookings)
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({})
  const [borrower, setBorrower] = useState("")
  const [purpose, setPurpose] = useState("")
  const [quantityInput, setQuantityInput] = useState("1")
  const [error, setError] = useState("")

  //기간 지난 대여는 자동으로 반납처리
  useEffect(() => {
  const today = new Date()
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let changed = false
  const next = Object.fromEntries(
    Object.entries(bookings).map(([itemId, list]) => {
      const filtered = list.filter((booking) => {
        const end = new Date(booking.to.getFullYear(), booking.to.getMonth(), booking.to.getDate())
        return end >= todayOnly
      })
      if (filtered.length !== list.length) changed = true
      return [itemId, filtered]
    }),
  )
  if (changed) setBookings(next)
}, [bookings])


  const selectedBookings = useMemo(() => {
    if (!selectedItem) return []
    return bookings[selectedItem.id] ?? []
  }, [bookings, selectedItem])

  const dateKey = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
  }

  const bookedDateCounts = useMemo(() => {
    const counts = new Map<string, number>()
    selectedBookings.forEach((booking) => {
      const cursor = new Date(booking.from)
      while (cursor <= booking.to) {
        const key = dateKey(cursor)
        counts.set(key, (counts.get(key) ?? 0) + booking.quantity)
        cursor.setDate(cursor.getDate() + 1)
      }
    })
    return counts
  }, [selectedBookings])

  const bookedDates = useMemo(() => {
    if (!selectedItem) return []
    const total = selectedItem.totalQuantity
    return Array.from(bookedDateCounts.entries())
      .filter(([, count]) => count >= total)
      .map(([key]) => {
        const [year, month, day] = key.split("-").map(Number)
        return new Date(year, month - 1, day)
      })
  }, [bookedDateCounts, selectedItem])

  const getAvailableQuantityForRange = (from?: Date, to?: Date) => {
    if (!selectedItem || !from || !to) return 0
    const total = selectedItem.totalQuantity
    let minAvailable = total
    const cursor = new Date(from)
    while (cursor <= to) {
      const key = dateKey(cursor)
      const bookedCount = bookedDateCounts.get(key) ?? 0
      minAvailable = Math.min(minAvailable, total - bookedCount)
      cursor.setDate(cursor.getDate() + 1)
    }
    return Math.max(minAvailable, 0)
  }

  const handleOpen = (item: RentalItem) => {
    setSelectedItem(item)
    setRange({})
    setBorrower("")
    setPurpose("")
    setQuantityInput("1")
    setError("")
  }

  const handleClose = () => {
    setSelectedItem(null)
  }

  const handleSubmit = () => {
    if (!isAdmin) {
      setError("관리자만 예약을 추가/수정할 수 있습니다.")
      return
    }
    if (!selectedItem) return
    if (!borrower.trim()) {
      setError("대여자를 입력해 주세요.")
      return
    }
    if (!range.from || !range.to) {
      setError("대여 기간을 선택해 주세요.")
      return
    }
    const requestedQuantity = Number(quantityInput)
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1) {
      setError("대여 수량은 1개 이상이어야 합니다.")
      return
    }
    const available = getAvailableQuantityForRange(range.from, range.to)
    if (requestedQuantity > available) {
      setError(`해당 기간에 대여 가능한 수량은 ${available}개입니다.`)
      return
    }

    const newBooking: Booking = {
      id: `${selectedItem.id}-${Date.now()}`,
      borrower: borrower.trim(),
      purpose: purpose.trim() || "사유 미입력",
      quantity: requestedQuantity,
      from: range.from,
      to: range.to,
    }

    setBookings((prev) => ({
      ...prev,
      [selectedItem.id]: [...(prev[selectedItem.id] ?? []), newBooking],
    }))
    setRange({})
    setBorrower("")
    setPurpose("")
    setError("")
  }

  //반납
  const handleReturn = (bookingId: string) => {
    if (!selectedItem) return
    if (!isAdmin) {
      setError("관리자만 반납 처리가 가능합니다.")
      return
    }
    setBookings((prev) => ({
      ...prev,
      [selectedItem.id]: (prev[selectedItem.id] ?? []).filter((booking) => booking.id !== bookingId),
    }))
  }

  const isCurrentlyRented = (itemId: string) => {
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const item = rentalItems.find((entry) => entry.id === itemId)
    const total = item?.totalQuantity ?? 0
    const bookedToday = (bookings[itemId] ?? [])
      .filter((booking) => {
        const from = new Date(booking.from.getFullYear(), booking.from.getMonth(), booking.from.getDate())
        const to = new Date(booking.to.getFullYear(), booking.to.getMonth(), booking.to.getDate())
        return todayOnly >= from && todayOnly <= to
      })
      .reduce((sum, booking) => sum + booking.quantity, 0)
    if (total === 0) return false
    return bookedToday >= total
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/recruit-bg.png')" }}
    >
      <HeaderNav />

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">동아리 물품 대여</h1>
        </div>

        <section>
          <h2 className="mb-6 text-lg font-bold text-gray-900">대여 가능 물품</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rentalItems.slice(0, 9).map((item) => {
              const computedStatus = isCurrentlyRented(item.id) ? "대여중" : "대여가능"
              const styles = statusStyles[computedStatus]
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => handleOpen(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleOpen(item)
                    }
                  }}
                >
                  <div className="relative h-44 w-full bg-[#f3f3f3]">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 320px, (min-width: 768px) 45vw, 90vw"
                    />
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-xs text-gray-500">총 {item.totalQuantity}개</span>
                      <span className={`flex items-center gap-2 font-medium ${styles.text}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                        {computedStatus}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => (!open ? handleClose() : null)}>
        <DialogContent className="h-[720px] !w-[64vw] !max-w-[64vw] max-h-[92vh] gap-0 overflow-hidden rounded-3xl bg-[#f9f6f1] p-0 sm:!w-[64vw] sm:!max-w-[64vw]">
          {selectedItem && (
            <div className="h-full overflow-y-auto p-5">
              <DialogHeader className="mb-3">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
                <div className="rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between">
                    <Calendar
                      mode="range"
                      selected={range}
                      onSelect={(nextRange) => {
                        setRange(nextRange ?? {})
                        setError("")
                      }}
                      disabled={(date) => bookedDates.some((d) => d.toDateString() === date.toDateString())}
                      modifiers={{ booked: (date) => bookedDates.some((d) => d.toDateString() === date.toDateString()) }}
                      modifiersClassNames={{
                        booked: "bg-blue-100 text-blue-900 opacity-60",
                      }}
                      className="w-full [--cell-size:--spacing(5)]"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                      <p className="text-sm font-semibold text-gray-700">대여 불가 일자</p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-3 w-3 rounded bg-blue-200" />
                        다른 사람이 대여한 날짜
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-sm text-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                      <p className="font-semibold">대여중인 물품의 사용 시간대 외 사용 시</p>
                      <p className="mt-2 text-xs text-gray-600">
                        대여자에게 확인 후 사용 바랍니다.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 text-sm text-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:col-span-2">
                      <p className="mb-2 text-sm font-semibold text-gray-800">현재 대여 목록</p>
                      {selectedBookings.length === 0 ? (
                        <p className="text-xs text-gray-500">현재 대여된 일정이 없습니다.</p>
                      ) : (
                        <ul className="max-h-20 space-y-1 overflow-y-auto text-xs text-gray-600">
                          {selectedBookings.map((booking) => (
                            <li key={booking.id} className="flex items-center justify-between gap-2">
                              <span>
                                {booking.borrower} · {booking.purpose} · {booking.quantity}개 ·{" "}
                                {booking.from.toLocaleDateString()} ~ {booking.to.toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px]"
                                onClick={() => handleReturn(booking.id)}
                                disabled={!isAdmin}
                              >
                                반납
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                    <p className="text-sm font-semibold text-gray-700">대여 정보 입력</p>
                    <div className="mt-4 space-y-3">
                      <Input
                        type="number"
                        min={1}
                        max={selectedItem.totalQuantity}
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="대여 수량"
                        disabled={!isAdmin}
                      />
                      <Input
                        value={borrower}
                        onChange={(e) => setBorrower(e.target.value)}
                        placeholder="대여자 이름"
                        disabled={!isAdmin}
                      />
                      <Textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        placeholder="대여 사유"
                        className="min-h-[70px]"
                        disabled={!isAdmin}
                      />
                      <div className="text-xs text-gray-600">
                        선택된 기간:{" "}
                        {range.from && range.to
                          ? `${range.from.toLocaleDateString()} ~ ${range.to.toLocaleDateString()}`
                          : "기간을 선택해 주세요."}
                      </div>
                      <div className="text-xs text-gray-600">
                        선택 기간 대여 가능 수량: {getAvailableQuantityForRange(range.from, range.to)}개
                      </div>
                      {!isAdmin && (
                        <p className="text-xs text-gray-500">
                          예약 추가/수정은 관리자만 가능합니다.
                        </p>
                      )}
                      {error && <p className="text-xs text-red-500">{error}</p>}
                      <Button className="w-full" onClick={handleSubmit} disabled={!isAdmin}>
                        대여 신청
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
