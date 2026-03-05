"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

import { HeaderNav } from "@/components/header-nav"
import type { IntroduceCardItem } from "@/lib/introduce-content"

type ActivityBoardProps = {
  title: string
  subtitle: string
  emptyMessage: string
  items: IntroduceCardItem[]
  errorMessage?: string | null
}

const PAGE_SIZE = 6

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const visibleCount = 5
  const half = Math.floor(visibleCount / 2)

  let start = Math.max(1, currentPage - half)
  const end = Math.min(totalPages, start + visibleCount - 1)

  if (end - start + 1 < visibleCount) {
    start = Math.max(1, end - visibleCount + 1)
  }

  const pages: number[] = []
  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }
  return pages
}

export function ActivityBoard({ title, subtitle, emptyMessage, items, errorMessage = null }: ActivityBoardProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const visibleItems = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE
    return items.slice(startIndex, startIndex + PAGE_SIZE)
  }, [items, safePage])

  const pageNumbers = useMemo(() => getPageNumbers(safePage, totalPages), [safePage, totalPages])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#ecf3f8] text-[#12131a]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(72%_48%_at_50%_0%,rgba(255,255,255,0.92),rgba(237,245,251,0.7)_50%,rgba(226,238,247,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/70" />
      <div className="pointer-events-none absolute -right-48 top-32 h-[460px] w-[460px] rounded-full border border-white/60" />
      <div className="pointer-events-none absolute -right-24 top-48 h-[620px] w-[620px] rounded-full border border-white/45" />

      <div className="relative z-10">
        <HeaderNav />

        <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-14">
          <section className="flex flex-col items-center text-center">
            <Image src="/logo.png" alt="Do,um 로고" width={120} height={120} priority className="mb-4 h-28 w-28 object-contain" />
            <h1 className="text-5xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-4 text-lg text-[#5f6470]">{subtitle}</p>
          </section>

          <div className="mt-8 flex justify-end">
            <Link
              href="/login"
              className="rounded-xl bg-[#7cb8e8] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,184,232,0.38)] transition hover:bg-[#69a9dd]"
            >
              작성하기
            </Link>
          </div>

          {errorMessage ? (
            <section className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</section>
          ) : null}

          {visibleItems.length === 0 ? (
            <section className="mt-8 rounded-2xl border border-white/70 bg-white/85 p-10 text-center text-sm text-[#62697a] shadow-[0_8px_24px_rgba(44,62,80,0.12)]">
              {emptyMessage}
            </section>
          ) : (
            <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_10px_24px_rgba(44,62,80,0.14)]"
                >
                  <div className="relative h-40 bg-[linear-gradient(140deg,#d3e7f3_0%,#eef7fb_100%)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_0%_0%,rgba(255,255,255,0.34),transparent_65%)]" />
                  </div>

                  <div className="px-5 pb-4 pt-3">
                    <h2 className="line-clamp-2 text-[34px] font-extrabold leading-[1.15] tracking-tight text-[#101218]">{item.title}</h2>
                    <p className="mt-2 line-clamp-2 text-xs text-[#676d7b]">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-[#5c6372]">
                      <span>{formatDate(item.createdAt)}</span>
                      <span className="text-sm font-bold text-[#1c1f28]">{item.badge}</span>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {totalPages > 1 ? (
            <nav className="mt-14 flex items-center justify-center gap-4 text-2xl font-semibold text-[#252a36]">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="transition hover:text-[#6faee2] disabled:cursor-not-allowed disabled:text-[#95a0b0]"
              >
                이전
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`transition hover:text-[#6faee2] ${
                    page === safePage ? "text-[#0f1219]" : "text-[#596172]"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="transition hover:text-[#6faee2] disabled:cursor-not-allowed disabled:text-[#95a0b0]"
              >
                다음
              </button>
            </nav>
          ) : null}
        </main>

        <footer className="border-t border-white/75 py-10">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="text-3xl font-extrabold text-[#181c24]">DO,UM</p>
            <p className="mt-2 text-sm text-[#596071]">소프트웨어융합대학 코딩봉사 동아리</p>
            <p className="mt-1 text-sm text-[#596071]">Contact: doum@kookmin.ac.kr</p>
            <p className="mt-4 text-xs text-[#777f90]">© DO,UM</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
