"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Flame, Gamepad2, Trophy, Users } from "lucide-react"

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
import { useAdminSession } from "@/hooks/use-admin-session"
import {
  clearPersistentCaughtHistory,
  createPersistentCaughtHistoryRecord,
  fetchPersistentCaughtHistory,
  isPersistentBetHistoryAvailable,
} from "@/lib/bet-history-store"
import {
  buildLeaderboard,
  buildRecentHistoryMap,
  createCaughtRecord,
  getRecentHistory,
  loadCaughtHistory,
  saveCaughtHistory,
  type CaughtMode,
  type CaughtRecord,
} from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { EMPTY_RECORD_DIALOG_STATE } from "./bet/constants"
import { AIExcuseGame } from "./bet/games/ai-excuse-game"
import { BombPassGame } from "./bet/games/bomb-pass-game"
import { LadderGame } from "./bet/games/ladder-game"
import { RouletteGame } from "./bet/games/roulette-game"
import { HallOfFameView } from "./bet/hall-of-fame-view"
import { HomeScreen } from "./bet/home-screen"
import { RecordDialogModal } from "./bet/modals/record-dialog-modal"
import { HeroStatCard } from "./bet/common-ui"
import {
  AccessBlockedState,
  HallOfFamePreviewPanel,
  QuickActionPanel,
  RecentHistoryPanel,
} from "./bet/sidebar-panels"
import type {
  BetScreen,
  NoticeState,
  RecordDialogState,
  RecordDraft,
  ResultPayload,
} from "./bet/types"

export function BetPage() {
  const { isAdmin, isDoumMember, isLoggedIn, loading: sessionLoading } = useAdminSession()
  const [currentScreen, setCurrentScreen] = useState<BetScreen>("home")
  const [caughtHistory, setCaughtHistory] = useState<CaughtRecord[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyStorageMode, setHistoryStorageMode] = useState<"local" | "persistent">(
    isPersistentBetHistoryAvailable() ? "persistent" : "local",
  )
  const [recordDialog, setRecordDialog] = useState<RecordDialogState>(EMPTY_RECORD_DIALOG_STATE)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const caughtHistoryRef = useRef<CaughtRecord[]>([])

  useEffect(() => {
    caughtHistoryRef.current = caughtHistory
  }, [caughtHistory])

  useEffect(() => {
    if (sessionLoading) {
      return
    }

    if (!isLoggedIn || !isDoumMember) {
      setCaughtHistory([])
      setHistoryLoaded(true)
      return
    }

    let cancelled = false

    async function loadHistory() {
      setHistoryLoaded(false)

      try {
        if (isPersistentBetHistoryAvailable()) {
          const remoteHistory = await fetchPersistentCaughtHistory()

          if (cancelled) {
            return
          }

          setCaughtHistory(remoteHistory)
          setHistoryStorageMode("persistent")
          setHistoryLoaded(true)
          return
        }

        const localHistory = loadCaughtHistory()

        if (cancelled) {
          return
        }

        setCaughtHistory(localHistory)
        setHistoryStorageMode("local")
        setHistoryLoaded(true)
      } catch (error) {
        if (cancelled) {
          return
        }

        setCaughtHistory([])
        setHistoryStorageMode(isPersistentBetHistoryAvailable() ? "persistent" : "local")
        setHistoryLoaded(true)
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "명예의 전당 기록을 불러오지 못했습니다.",
        })
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [isDoumMember, isLoggedIn, sessionLoading])

  useEffect(() => {
    if (!notice) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null)
    }, 2600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [notice])

  const leaderboard = useMemo(() => buildLeaderboard(caughtHistory), [caughtHistory])
  const hallPreview = useMemo(() => leaderboard.slice(0, 5), [leaderboard])
  const latestHistory = useMemo(() => getRecentHistory(caughtHistory, 5), [caughtHistory])
  const recentHistoryMap = useMemo(() => buildRecentHistoryMap(caughtHistory, 5), [caughtHistory])
  const nameSuggestions = useMemo(() => leaderboard.map((entry) => entry.displayName), [leaderboard])
  const storageDescription =
    historyStorageMode === "persistent"
      ? "기록은 Supabase에 영구 저장됩니다. 같은 권한 계정이면 다른 기기에서도 같은 명예의 전당을 봅니다."
      : "기록은 이 브라우저의 localStorage에 저장됩니다. 개발 환경이나 Supabase 미설정 상태에서만 이 방식으로 동작합니다."

  const leaderName = leaderboard[0]?.displayName ?? "아직 없음"

  async function appendRecord(draft: RecordDraft, successMessage?: string) {
    const nextRecord =
      historyStorageMode === "persistent"
        ? await createPersistentCaughtHistoryRecord(draft)
        : createCaughtRecord(draft)

    const nextHistory = [...caughtHistoryRef.current, nextRecord]

    if (historyStorageMode === "local") {
      saveCaughtHistory(nextHistory)
    }

    setCaughtHistory(nextHistory)
    setNotice({
      tone: "success",
      message: successMessage ?? `${nextRecord.name} 기록을 명예의 전당에 저장했습니다.`,
    })

    return nextRecord
  }

  async function handleSaveRecord(draft: RecordDraft) {
    await appendRecord(draft)
  }

  async function handleAutoSaveRouletteResult(payload: { name: string; detail: string }) {
    await appendRecord(
      {
        name: payload.name,
        mode: "roulette_manual",
        detail: payload.detail,
      },
      `${payload.name} 룰렛 결과를 명예의 전당에 자동 저장했습니다.`,
    )
  }

  function openResultRecordDialog(payload: ResultPayload) {
    setRecordDialog({
      open: true,
      kind: "result",
      title: "결과 기록",
      description: "걸린 사람 이름을 확인한 뒤 명예의 전당에 저장해 주세요.",
      mode: payload.mode,
      defaultName: payload.name,
      detail: payload.detail,
      allowModeChange: false,
      editableDetail: false,
    })
  }

  function openManualRecordDialog(defaultMode: CaughtMode = "manual") {
    setRecordDialog({
      open: true,
      kind: "manual",
      title: defaultMode === "roulette_manual" ? "룰렛 결과 수동 기록" : "수동 기록",
      description:
        defaultMode === "roulette_manual"
          ? "룰렛 결과를 직접 보정해 저장합니다."
          : "이름과 모드를 직접 입력해 명예의 전당에 추가합니다.",
      mode: defaultMode,
      defaultName: "",
      detail: "",
      allowModeChange: true,
      editableDetail: true,
    })
  }

  function closeRecordDialog() {
    setRecordDialog((current) => ({
      ...current,
      open: false,
    }))
  }

  async function handleResetHistory() {
    try {
      if (historyStorageMode === "persistent") {
        await clearPersistentCaughtHistory()
      } else {
        saveCaughtHistory([])
      }

      setCaughtHistory([])
      setResetDialogOpen(false)
      setNotice({
        tone: "success",
        message: "명예의 전당 기록을 모두 초기화했습니다.",
      })
    } catch (error) {
      setResetDialogOpen(false)
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "명예의 전당 기록을 초기화하지 못했습니다.",
      })
    }
  }

  function renderMainScreen() {
    switch (currentScreen) {
      case "ai_excuse":
        return <AIExcuseGame onBackHome={() => setCurrentScreen("home")} onOpenRecord={openResultRecordDialog} />
      case "bomb_pass":
        return <BombPassGame onBackHome={() => setCurrentScreen("home")} onOpenRecord={openResultRecordDialog} />
      case "ladder":
        return <LadderGame onBackHome={() => setCurrentScreen("home")} onOpenRecord={openResultRecordDialog} />
      case "roulette":
        return (
          <RouletteGame
            onBackHome={() => setCurrentScreen("home")}
            onAutoRecord={handleAutoSaveRouletteResult}
          />
        )
      case "hall":
        return (
          <HallOfFameView
            leaderboard={leaderboard}
            recentHistoryMap={recentHistoryMap}
            onBackHome={() => setCurrentScreen("home")}
          />
        )
      case "home":
      default:
        return (
          <HomeScreen
            leaderName={leaderName}
            storageDescription={storageDescription}
            totalRecords={caughtHistory.length}
            uniqueCaughtCount={leaderboard.length}
            onSelectScreen={setCurrentScreen}
          />
        )
    }
  }

  const accessBlocked = !sessionLoading && (!isLoggedIn || !isDoumMember)

  return (
    <div
      className="min-h-screen bg-[#f7f2e7] text-[#18232d]"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(255, 215, 130, 0.34), transparent 24%), radial-gradient(circle at right 12%, rgba(132, 181, 231, 0.24), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,240,228,0.94) 100%)",
      }}
    >
      <HeaderNav />

      {notice ? (
        <div className="pointer-events-none fixed right-4 top-20 z-[60] w-[min(26rem,calc(100vw-2rem))]">
          <div
            className={cn(
              "rounded-[24px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_50px_rgba(24,35,45,0.12)] backdrop-blur-sm",
              notice.tone === "success"
                ? "border-[#c9e7d4] bg-[#f4fbf6] text-[#2d6848]"
                : "border-[#f0cfcf] bg-[#fff6f6] text-[#9a3b3b]",
            )}
          >
            {notice.message}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1380px] px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-12 xl:px-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/72 px-6 py-8 shadow-[0_24px_60px_rgba(24,35,45,0.08)] backdrop-blur-md sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#ffd485]/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[#9ec9ff]/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e7d8bb] bg-[#fff8ea] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b641d]">
                <Gamepad2 className="size-4" />
                Bet Lounge
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#18232d] sm:text-5xl">내기</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5e6d78] sm:text-base sm:leading-7">
                한 대의 PC에서 돌아가며 즐기는 랜덤 당첨 게임입니다. 게임 결과는 저장과 동시에 명예의 전당에
                누적되고, 내장 룰렛은 스핀이 끝나면 자동으로 기록됩니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[32rem]">
              <HeroStatCard label="총 기록" value={`${caughtHistory.length}회`} icon={Flame} />
              <HeroStatCard label="걸린 사람" value={`${leaderboard.length}명`} icon={Users} />
              <HeroStatCard label="현재 1위" value={leaderName} icon={Trophy} />
            </div>
          </div>
        </section>

        {sessionLoading ? (
          <section className="mt-8 rounded-[32px] border border-black/10 bg-white/84 px-6 py-16 text-center shadow-[0_18px_40px_rgba(24,35,45,0.06)] backdrop-blur-sm">
            <p className="text-lg font-bold text-[#203340]">회원 권한을 확인하는 중입니다.</p>
            <p className="mt-3 text-sm text-[#61727d]">두음 회원 이상 계정만 이 탭을 볼 수 있습니다.</p>
          </section>
        ) : accessBlocked ? (
          <section className="mt-8 rounded-[32px] border border-black/10 bg-white/84 px-6 py-16 shadow-[0_18px_40px_rgba(24,35,45,0.06)] backdrop-blur-sm">
            <AccessBlockedState isLoggedIn={isLoggedIn} />
          </section>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <section className="rounded-[32px] border border-black/10 bg-white/84 p-5 shadow-[0_22px_50px_rgba(24,35,45,0.06)] backdrop-blur-sm sm:p-6">
              {renderMainScreen()}
            </section>

            <aside className="space-y-6">
              <QuickActionPanel
                historyLoaded={historyLoaded}
                canResetHistory={historyStorageMode === "local" || isAdmin}
                storageDescription={
                  historyStorageMode === "persistent"
                    ? isAdmin
                      ? "기록은 Supabase에 영구 저장됩니다. 전체 초기화는 관리자만 공용 기록에 대해 실행할 수 있습니다."
                      : "기록은 Supabase에 영구 저장됩니다. 전체 초기화는 관리자만 가능합니다."
                    : storageDescription
                }
                onGoHall={() => setCurrentScreen("hall")}
                onGoHome={() => setCurrentScreen("home")}
                onOpenManualRecord={() => openManualRecordDialog("manual")}
                onReset={() => setResetDialogOpen(true)}
              />

              <HallOfFamePreviewPanel
                historyLoaded={historyLoaded}
                leaderboard={hallPreview}
                onOpenHall={() => setCurrentScreen("hall")}
              />

              <RecentHistoryPanel historyLoaded={historyLoaded} records={latestHistory} />
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />

      <RecordDialogModal
        state={recordDialog}
        knownNames={nameSuggestions}
        onOpenChange={(open) => {
          if (!open) {
            closeRecordDialog()
          }
        }}
        onSubmit={handleSaveRecord}
      />

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-md rounded-[28px] border border-[#ead9d1] bg-[#fff9f6] p-6 shadow-[0_24px_70px_rgba(24,35,45,0.14)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#18232d]">전체 기록 초기화</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-[#665b55]">
              명예의 전당, 최근 기록, 모드별 누적 카운트가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[24px] border border-[#f1d5c7] bg-white/80 px-4 py-4 text-sm text-[#8a4d3a]">
            현재 저장된 기록은 총 <span className="font-semibold">{caughtHistory.length}건</span>입니다.
          </div>
          <DialogFooter className="gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              className="h-11 rounded-2xl border-[#e4d8d2] bg-white px-4 text-[#4c5a66]"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => void handleResetHistory()}
              className="h-11 rounded-2xl bg-[#a54141] px-5 text-white hover:bg-[#8f3434]"
            >
              전체 초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
