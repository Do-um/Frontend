"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Flame, Gamepad2, Sparkles, Trophy, Users } from "lucide-react"

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
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-scroll text-[#1f2730] lg:bg-fixed"
      style={{ backgroundImage: "url('/home-bg.png')" }}
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-white/8" />
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full border border-white/40" />
        <div className="pointer-events-none absolute -right-20 top-32 h-[28rem] w-[28rem] rounded-full border border-white/25" />
        <div className="pointer-events-none absolute -left-24 top-[24rem] h-80 w-80 rounded-full bg-[#d9edf4]/20 blur-3xl" />

        <div className="relative">
          <HeaderNav />

          {notice ? (
            <div className="pointer-events-none fixed right-4 top-20 z-[60] w-[min(26rem,calc(100vw-2rem))]">
              <div
                className={cn(
                  "rounded-[24px] border px-4 py-3 text-sm font-semibold shadow-[0_20px_50px_rgba(37,74,91,0.12)] backdrop-blur-sm",
                  notice.tone === "success"
                    ? "border-[#d5e4db] bg-white/88 text-[#4c6a5a]"
                    : "border-[#ecd8d6] bg-white/88 text-[#8a5750]",
                )}
              >
                {notice.message}
              </div>
            </div>
          ) : null}

          <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:pt-16">
            <section className="mx-auto max-w-3xl text-center">
              <div className="animate-float mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/72 shadow-[0_18px_50px_rgba(65,106,133,0.12)] backdrop-blur-sm sm:h-28 sm:w-28">
                <Image src="/doum-logo-large.png" alt="DO,UM 로고" width={62} height={88} priority />
              </div>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6a7d88] sm:mt-8 sm:text-xs sm:tracking-[0.22em]">
                <Sparkles className="size-3.5" />
                Bet Lounge
              </p>
              <h1 className="mt-5 text-3xl font-black tracking-tight text-black sm:mt-6 sm:text-5xl">내기</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#677680] sm:mt-4 sm:text-lg">
                한 대의 PC에서 돌아가며 즐기는 랜덤 당첨 보드입니다. 게임 결과는 바로 기록으로 쌓이고, 룰렛은
                스핀이 끝나는 즉시 명예의 전당에 자동 반영됩니다.
              </p>
            </section>

            {sessionLoading ? (
              <section className="mt-10 rounded-[28px] border border-white/70 bg-white/68 p-8 text-center shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:rounded-[36px]">
                <p className="text-lg font-bold text-[#213542]">회원 권한을 확인하는 중입니다.</p>
                <p className="mt-3 text-sm text-[#677680]">두음 회원 이상 계정만 이 탭을 볼 수 있습니다.</p>
              </section>
            ) : accessBlocked ? (
              <section className="mt-10 rounded-[28px] border border-white/70 bg-white/68 p-8 shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:rounded-[36px]">
                <AccessBlockedState isLoggedIn={isLoggedIn} />
              </section>
            ) : (
              <section className="mt-10 rounded-[28px] border border-white/70 bg-white/68 p-4 shadow-[0_24px_60px_rgba(48,72,88,0.08)] backdrop-blur-md sm:mt-12 sm:rounded-[36px] sm:p-8">
                <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#6f8590]">BET BOARD</p>
                    <h2 className="mt-2 text-2xl font-bold text-[#1d2a34]">게임 보드</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#677680]">
                      홈에서 원하는 모드를 고르고, 결과는 명예의 전당과 최근 기록 패널에서 바로 확인할 수 있습니다.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold text-[#5e7482] shadow-sm">
                      <Gamepad2 className="size-4" />
                      {historyStorageMode === "persistent" ? "공용 기록 영구 저장 중" : "브라우저 로컬 기록 사용 중"}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
                    <HeroStatCard label="총 기록" value={`${caughtHistory.length}회`} icon={Flame} />
                    <HeroStatCard label="걸린 사람" value={`${leaderboard.length}명`} icon={Users} />
                    <HeroStatCard label="현재 1위" value={leaderName} icon={Trophy} />
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
                  <section className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-[0_16px_40px_rgba(47,74,91,0.08)] backdrop-blur-sm sm:p-6">
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
              </section>
            )}
          </main>

          <SiteFooter />
        </div>
      </div>

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
        <DialogContent className="max-w-md rounded-[32px] border border-white/75 bg-[#f5f7f2] p-6 shadow-[0_32px_90px_rgba(24,39,54,0.2)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-black tracking-tight text-[#15212b]">전체 기록 초기화</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-[#677680]">
              명예의 전당, 최근 기록, 모드별 누적 카운트가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-[24px] border border-[#dae6eb] bg-white/82 px-4 py-4 text-sm text-[#526774] shadow-[0_12px_28px_rgba(47,74,91,0.05)]">
            현재 저장된 기록은 총 <span className="font-semibold text-[#223541]">{caughtHistory.length}건</span>입니다.
          </div>
          <DialogFooter className="gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              className="h-11 rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => void handleResetHistory()}
              className="h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2c3743]"
            >
              전체 초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
