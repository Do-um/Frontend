"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  Bomb,
  CirclePlay,
  Crown,
  ExternalLink,
  Flame,
  Gamepad2,
  GitBranch,
  History,
  Medal,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react"

import { HeaderNav } from "@/components/header-nav"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminSession } from "@/hooks/use-admin-session"
import {
  AI_EXCUSE_TEMPLATES,
  CAUGHT_MODE_LABELS,
  buildLeaderboard,
  buildLadderTraces,
  buildRecentHistoryMap,
  createCaughtRecord,
  createLadderGeometry,
  createLadderStructure,
  getLadderEndIndex,
  getRecentHistory,
  loadCaughtHistory,
  parseParticipantNames,
  sanitizeDisplayName,
  saveCaughtHistory,
  type CaughtMode,
  type CaughtRecord,
  type LadderGeometry,
  type LadderStructure,
  type LadderTrace,
  type LeaderboardEntry,
} from "@/lib/bet-game"
import { cn } from "@/lib/utils"

type BetScreen = "home" | "ai_excuse" | "bomb_pass" | "ladder" | "roulette" | "hall"

type RecordDialogState = {
  open: boolean
  kind: "result" | "manual"
  title: string
  description: string
  mode: CaughtMode
  defaultName: string
  detail: string
  allowModeChange: boolean
  editableDetail: boolean
}

type NoticeState = {
  tone: "success" | "error"
  message: string
}

type RecordDraft = {
  name: string
  mode: CaughtMode
  detail?: string
}

type ResultPayload = {
  name: string
  mode: Extract<CaughtMode, "ai_excuse" | "bomb_pass" | "ladder">
  detail: string
}

type GameCardItem = {
  screen: Exclude<BetScreen, "hall">
  title: string
  description: string
  eyebrow: string
  icon: LucideIcon
  accentClassName: string
}

const ROULETTE_URL = "https://lazygyu.github.io/roulette/"

const GAME_CARDS: GameCardItem[] = [
  {
    screen: "ai_excuse",
    title: "AI 핑계 당첨",
    description: "미리 준비된 드립 템플릿으로 한 명을 재밌게 지목합니다.",
    eyebrow: "API 없는 랜덤 핑계",
    icon: Sparkles,
    accentClassName: "from-[#ffe3b0] via-[#ffd28c] to-[#ffb86b]",
  },
  {
    screen: "bomb_pass",
    title: "폭탄 넘기기",
    description: "제한 시간 안에서 터질 시점이 랜덤으로 정해지는 순환형 내기입니다.",
    eyebrow: "실시간 순서 게임",
    icon: Bomb,
    accentClassName: "from-[#ffc3c3] via-[#ff9d8d] to-[#ff6f61]",
  },
  {
    screen: "ladder",
    title: "사다리 타기",
    description: "랜덤 가로줄을 따라 내려가 걸림 슬롯에 도착한 사람을 찾습니다.",
    eyebrow: "경로 추적 애니메이션",
    icon: GitBranch,
    accentClassName: "from-[#c5f0d0] via-[#a8e7ca] to-[#6fd1b3]",
  },
  {
    screen: "roulette",
    title: "룰렛",
    description: "외부 룰렛 페이지로 이동한 뒤 결과만 직접 기록합니다.",
    eyebrow: "외부 페이지 연동",
    icon: CirclePlay,
    accentClassName: "from-[#cbe2ff] via-[#9fc7ff] to-[#70a8ff]",
  },
]

const MODE_SHORT_LABELS: Record<CaughtMode, string> = {
  ai_excuse: "AI",
  bomb_pass: "폭탄",
  ladder: "사다리",
  roulette_manual: "룰렛",
  manual: "수동",
}

const MODE_BADGE_CLASSNAMES: Record<CaughtMode, string> = {
  ai_excuse: "border-[#ffd8a8] bg-[#fff5e8] text-[#8b5a15]",
  bomb_pass: "border-[#ffc9c9] bg-[#fff1f1] text-[#9a3f3f]",
  ladder: "border-[#bee5cf] bg-[#eefaf1] text-[#20684b]",
  roulette_manual: "border-[#c7d9ff] bg-[#f0f5ff] text-[#3157a8]",
  manual: "border-[#d6d9dd] bg-[#f6f7f8] text-[#4b5563]",
}

const LADDER_TRACE_COLORS = [
  "#ff8f66",
  "#3ea1ff",
  "#00b894",
  "#f7b731",
  "#8c7ae6",
  "#ff5f91",
  "#2dce89",
  "#ff7f50",
  "#45aaf2",
  "#9b59b6",
  "#ffb347",
  "#00c4cc",
] as const

const EMPTY_RECORD_DIALOG_STATE: RecordDialogState = {
  open: false,
  kind: "manual",
  title: "",
  description: "",
  mode: "manual",
  defaultName: "",
  detail: "",
  allowModeChange: true,
  editableDetail: true,
}

function pickRandomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
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

function formatModeSummary(counts: LeaderboardEntry["perModeCounts"]) {
  return (Object.keys(CAUGHT_MODE_LABELS) as CaughtMode[])
    .filter((mode) => counts[mode] > 0)
    .map((mode) => `${MODE_SHORT_LABELS[mode]} ${counts[mode]}`)
    .join(" / ")
}

function formatElapsedSeconds(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}초`
}

function getRankAccent(rank: number) {
  if (rank === 0) {
    return "border-[#ffd66b] bg-[linear-gradient(135deg,rgba(255,237,176,0.95),rgba(255,204,102,0.75))]"
  }

  if (rank === 1) {
    return "border-[#d9dfe7] bg-[linear-gradient(135deg,rgba(241,245,249,0.96),rgba(212,222,233,0.75))]"
  }

  if (rank === 2) {
    return "border-[#e8c1a0] bg-[linear-gradient(135deg,rgba(255,234,222,0.94),rgba(229,183,140,0.75))]"
  }

  return "border-black/8 bg-white/84"
}

function getRankIcon(rank: number) {
  if (rank === 0) {
    return <Crown className="size-4" />
  }

  if (rank === 1 || rank === 2) {
    return <Medal className="size-4" />
  }

  return null
}

export function BetPage() {
  const { isDoumMember, isLoggedIn, loading: sessionLoading } = useAdminSession()
  const [currentScreen, setCurrentScreen] = useState<BetScreen>("home")
  const [caughtHistory, setCaughtHistory] = useState<CaughtRecord[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [recordDialog, setRecordDialog] = useState<RecordDialogState>(EMPTY_RECORD_DIALOG_STATE)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [notice, setNotice] = useState<NoticeState | null>(null)

  useEffect(() => {
    setCaughtHistory(loadCaughtHistory())
    setHistoryLoaded(true)
  }, [])

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

  const leaderName = leaderboard[0]?.displayName ?? "아직 없음"

  function persistHistory(nextHistory: CaughtRecord[]) {
    setCaughtHistory(nextHistory)
    saveCaughtHistory(nextHistory)
  }

  async function handleSaveRecord(draft: RecordDraft) {
    const nextRecord = createCaughtRecord(draft)
    const nextHistory = [...caughtHistory, nextRecord]
    persistHistory(nextHistory)
    setNotice({
      tone: "success",
      message: `${nextRecord.name} 기록을 명예의 전당에 저장했습니다.`,
    })
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
          ? "외부 룰렛 결과를 직접 입력해 저장합니다."
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

  function handleResetHistory() {
    persistHistory([])
    setResetDialogOpen(false)
    setNotice({
      tone: "success",
      message: "명예의 전당 기록을 모두 초기화했습니다.",
    })
  }

  function handleRouletteLaunch() {
    window.open(ROULETTE_URL, "_blank", "noopener,noreferrer")
    setNotice({
      tone: "success",
      message: "룰렛 페이지를 새 탭에서 열었습니다. 결과가 나오면 수동 기록을 눌러 저장해 주세요.",
    })
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
          <RouletteGuide
            onBackHome={() => setCurrentScreen("home")}
            onOpenManualRecord={() => openManualRecordDialog("roulette_manual")}
            onLaunchRoulette={handleRouletteLaunch}
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
                한 대의 PC에서 돌아가며 즐기는 랜덤 당첨 게임입니다. 결과는 직접 확인한 뒤 저장하고,
                누가 얼마나 자주 걸렸는지 명예의 전당에서 바로 누적 확인할 수 있습니다.
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
              onClick={handleResetHistory}
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

function HeroStatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(249,245,236,0.86))] px-4 py-4 shadow-[0_12px_28px_rgba(24,35,45,0.05)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6b59]">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 truncate text-xl font-black tracking-[-0.04em] text-[#18232d]">{value}</p>
    </div>
  )
}

function AccessBlockedState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff6ea] text-[#c67a17] shadow-[0_16px_36px_rgba(198,122,23,0.18)]">
        <ShieldCheck className="size-9" />
      </div>
      <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-[#18232d]">
        {isLoggedIn ? "두음 회원 이상만 이용할 수 있습니다." : "로그인이 필요합니다."}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#63727d]">
        {isLoggedIn
          ? "내기 탭은 두음 회원과 관리자만 노출됩니다. 현재 계정 권한으로는 접근할 수 없습니다."
          : "이 탭은 두음 회원 이상에게만 노출됩니다. 로그인 후 권한이 확인되면 이용할 수 있습니다."}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#263441]">
            <Link href="/">홈으로 이동</Link>
          </Button>
        ) : (
          <Button asChild className="h-11 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#263441]">
            <Link href="/login?next=%2Fbet">로그인하기</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function QuickActionPanel({
  historyLoaded,
  onGoHome,
  onGoHall,
  onOpenManualRecord,
  onReset,
}: {
  historyLoaded: boolean
  onGoHome: () => void
  onGoHall: () => void
  onOpenManualRecord: () => void
  onReset: () => void
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,248,234,0.92),rgba(255,255,255,0.88))] p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b641d]">Quick Actions</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">바로 가기</h2>
        <p className="mt-2 text-sm leading-6 text-[#6b6a64]">
          홈, 명예의 전당, 수동 기록, 전체 초기화를 여기서 바로 처리할 수 있습니다.
        </p>

        <div className="mt-5 grid gap-3">
          <ActionButton icon={Gamepad2} label="게임 홈" onClick={onGoHome} />
          <ActionButton icon={Trophy} label="명예의 전당" onClick={onGoHall} />
          <ActionButton icon={PencilLine} label="수동 기록" onClick={onOpenManualRecord} />
          <ActionButton icon={Trash2} label="전체 기록 초기화" onClick={onReset} destructive />
        </div>

        <div className="mt-5 rounded-[22px] border border-black/8 bg-white/78 px-4 py-4 text-sm text-[#63727d]">
          {historyLoaded ? "기록은 이 브라우저의 localStorage에 저장됩니다." : "기록을 불러오는 중입니다..."}
        </div>
      </div>
    </Card>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center justify-between rounded-[22px] border px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5",
        destructive
          ? "border-[#f1d5d5] bg-[#fff8f8] text-[#934646] hover:bg-[#fff1f1]"
          : "border-black/8 bg-white/86 text-[#213541] hover:bg-white",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            destructive ? "bg-[#ffe8e8]" : "bg-[#f4f7f8]",
          )}
        >
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <ExternalLink className="size-4 opacity-55" />
    </button>
  )
}

function HallOfFamePreviewPanel({
  historyLoaded,
  leaderboard,
  onOpenHall,
}: {
  historyLoaded: boolean
  leaderboard: LeaderboardEntry[]
  onOpenHall: () => void
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-white/88 p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7f88]">Hall Of Fame</p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">상위 5명</h2>
          </div>
          <button
            type="button"
            onClick={onOpenHall}
            className="rounded-full border border-[#d8e4eb] bg-[#f8fbfd] px-3 py-2 text-xs font-semibold text-[#355264] transition hover:bg-white"
          >
            전체 보기
          </button>
        </div>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            기록을 읽는 중입니다...
          </div>
        ) : !leaderboard.length ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            아직 아무도 안 걸림
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.normalizedName}
                className={cn(
                  "rounded-[22px] border px-4 py-4 shadow-[0_8px_24px_rgba(24,35,45,0.04)]",
                  getRankAccent(index),
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white/75 px-2 text-xs font-black text-[#18232d]">
                        {index + 1}
                      </span>
                      <p className="truncate text-lg font-black tracking-[-0.03em] text-[#18232d]">{entry.displayName}</p>
                      {getRankIcon(index)}
                    </div>
                    <p className="mt-2 text-sm text-[#50606c]">총 {entry.totalCount}회 · {formatModeSummary(entry.perModeCounts)}</p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#6e7d88]">{formatDateTime(entry.lastCaughtAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function RecentHistoryPanel({
  historyLoaded,
  records,
}: {
  historyLoaded: boolean
  records: CaughtRecord[]
}) {
  return (
    <Card className="rounded-[30px] border border-black/10 bg-white/88 p-0 shadow-[0_18px_40px_rgba(24,35,45,0.06)]">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7f88]">
          <History className="size-4" />
          Recent History
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">최근 기록 5개</h2>

        {!historyLoaded ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            기록을 읽는 중입니다...
          </div>
        ) : !records.length ? (
          <div className="mt-5 rounded-[22px] border border-dashed border-[#d5e0e6] bg-[#f8fbfd] px-4 py-6 text-center text-sm text-[#6c7d87]">
            최근 기록이 없습니다.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {records.map((record) => (
              <div key={record.id} className="rounded-[22px] border border-black/8 bg-[#fbfcfd] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black tracking-[-0.03em] text-[#18232d]">{record.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-semibold",
                          MODE_BADGE_CLASSNAMES[record.mode],
                        )}
                      >
                        {CAUGHT_MODE_LABELS[record.mode]}
                      </span>
                      {record.detail ? (
                        <span className="truncate text-xs text-[#6d7c86]">{record.detail}</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#6e7d88]">{formatDateTime(record.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function HomeScreen({
  leaderName,
  totalRecords,
  uniqueCaughtCount,
  onSelectScreen,
}: {
  leaderName: string
  totalRecords: number
  uniqueCaughtCount: number
  onSelectScreen: (screen: BetScreen) => void
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,246,226,0.95),rgba(242,248,255,0.92))] px-5 py-5 shadow-[0_16px_36px_rgba(24,35,45,0.05)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#efdfbf] bg-white/72 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b641d]">
              <Target className="size-4" />
              Single PC Random Game
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#18232d]">오늘은 누가 걸릴까?</h2>
            <p className="mt-3 text-sm leading-6 text-[#63727d]">
              이름은 쉼표나 줄바꿈으로 입력하고, 내부 게임은 결과가 나오면 바로 기록 모달이 열립니다. 저장을 눌러야만 명예의 전당에 반영됩니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat label="현재 선두" value={leaderName} />
            <MiniStat label="누적 기록" value={`${totalRecords}회`} />
            <MiniStat label="걸린 인원" value={`${uniqueCaughtCount}명`} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {GAME_CARDS.map((item) => (
          <GameEntryCard key={item.screen} item={item} onClick={() => onSelectScreen(item.screen)} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <InfoBlock
          title="이름 입력 규칙"
          description="최소 2명, 권장 최대 12명입니다. 쉼표와 줄바꿈 모두 지원하고 공백은 자동 정리됩니다."
          icon={Users}
        />
        <InfoBlock
          title="기록 저장 방식"
          description="기록은 localStorage에 저장됩니다. 새로고침 후에도 남고, 저장 버튼을 누르지 않으면 반영되지 않습니다."
          icon={History}
        />
        <InfoBlock
          title="룰렛 주의"
          description="룰렛은 외부 페이지로 이동하며 결과를 자동으로 알 수 없습니다. 끝난 뒤 이름을 직접 기록해 주세요."
          icon={TriangleAlert}
        />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/72 px-4 py-4 shadow-[0_10px_24px_rgba(24,35,45,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8088]">{label}</p>
      <p className="mt-2 truncate text-lg font-black tracking-[-0.03em] text-[#18232d]">{value}</p>
    </div>
  )
}

function GameEntryCard({ item, onClick }: { item: GameCardItem; onClick: () => void }) {
  const Icon = item.icon

  return (
    <button type="button" onClick={onClick} className="group text-left">
      <div className="overflow-hidden rounded-[30px] border border-black/8 bg-white/88 shadow-[0_18px_44px_rgba(24,35,45,0.06)] transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_rgba(24,35,45,0.1)]">
        <div className={cn("bg-gradient-to-br px-5 py-5", item.accentClassName)}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">{item.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">{item.title}</h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/72 shadow-sm">
              <Icon className="size-7 text-[#18232d]" />
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm leading-6 text-[#5f707b]">{item.description}</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f4f7f8] px-4 py-2 text-sm font-semibold text-[#223541] transition group-hover:bg-[#edf3f6]">
            시작하기
            <ExternalLink className="size-4" />
          </div>
        </div>
      </div>
    </button>
  )
}

function InfoBlock({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-[26px] border border-black/8 bg-white/84 px-5 py-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c808b]">
        <Icon className="size-4" />
        Guide
      </div>
      <h3 className="mt-3 text-xl font-black tracking-[-0.03em] text-[#18232d]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5f707b]">{description}</p>
    </div>
  )
}

function HallOfFameView({
  leaderboard,
  recentHistoryMap,
  onBackHome,
}: {
  leaderboard: LeaderboardEntry[]
  recentHistoryMap: Map<string, CaughtRecord[]>
  onBackHome: () => void
}) {
  const [expandedName, setExpandedName] = useState<string | null>(leaderboard[0]?.normalizedName ?? null)

  useEffect(() => {
    if (!leaderboard.length) {
      setExpandedName(null)
      return
    }

    if (expandedName && leaderboard.some((entry) => entry.normalizedName === expandedName)) {
      return
    }

    setExpandedName(leaderboard[0].normalizedName)
  }, [expandedName, leaderboard])

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="명예의 전당"
        description="총 횟수, 모드별 누적, 마지막으로 걸린 시각, 최근 5개 기록까지 한 번에 확인합니다."
        onBackHome={onBackHome}
      />

      {!leaderboard.length ? (
        <div className="rounded-[28px] border border-dashed border-[#d8e4eb] bg-[#f8fbfd] px-5 py-14 text-center">
          <p className="text-2xl font-black tracking-[-0.04em] text-[#213541]">아직 아무도 안 걸림</p>
          <p className="mt-3 text-sm leading-6 text-[#63727d]">게임이 끝난 뒤 기록하기를 누르면 이 목록이 바로 채워집니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((entry, index) => {
            const recentRecords = recentHistoryMap.get(entry.normalizedName) ?? []
            const isExpanded = expandedName === entry.normalizedName

            return (
              <article
                key={entry.normalizedName}
                className={cn(
                  "rounded-[28px] border px-5 py-5 shadow-[0_14px_34px_rgba(24,35,45,0.05)]",
                  getRankAccent(index),
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-white/78 px-3 text-sm font-black text-[#18232d]">
                        #{index + 1}
                      </span>
                      <h3 className="truncate text-2xl font-black tracking-[-0.04em] text-[#18232d]">{entry.displayName}</h3>
                      {index < 3 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/76 px-3 py-1 text-xs font-semibold text-[#5e5a47]">
                          {getRankIcon(index)}
                          TOP {index + 1}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/76 px-3 py-1 text-sm font-semibold text-[#213541]">
                        총 {entry.totalCount}회
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1 text-sm text-[#566b78]">
                        {formatModeSummary(entry.perModeCounts)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <div className="text-sm text-[#5c6d78]">
                      마지막 걸림 <span className="font-semibold text-[#213541]">{formatDateTime(entry.lastCaughtAt)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setExpandedName((current) => (current === entry.normalizedName ? null : entry.normalizedName))
                      }
                      className="h-10 rounded-full border-white/75 bg-white/80 px-4 text-[#355264] hover:bg-white"
                    >
                      {isExpanded ? "최근 기록 닫기" : "최근 기록 5개 보기"}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {recentRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-[22px] border border-black/8 bg-white/82 px-4 py-4 shadow-[0_10px_24px_rgba(24,35,45,0.04)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              MODE_BADGE_CLASSNAMES[record.mode],
                            )}
                          >
                            {CAUGHT_MODE_LABELS[record.mode]}
                          </span>
                          <span className="text-xs font-semibold text-[#6d7d87]">{formatDateTime(record.createdAt)}</span>
                        </div>
                        {record.detail ? (
                          <p className="mt-3 text-sm leading-6 text-[#596974]">{record.detail}</p>
                        ) : (
                          <p className="mt-3 text-sm text-[#74838c]">추가 상세 없음</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScreenHeader({
  title,
  description,
  onBackHome,
}: {
  title: string
  description: string
  onBackHome: () => void
}) {
  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,252,245,0.96),rgba(244,248,255,0.92))] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d6b59]">Game Screen</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#18232d]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#63727d]">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onBackHome}
          className="h-11 rounded-full border-[#d8e4eb] bg-white/80 px-5 text-[#355264] hover:bg-white"
        >
          <ArrowLeft className="size-4" />
          홈으로
        </Button>
      </div>
    </div>
  )
}

function SharedNamesInput({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#243440]">이름 목록</label>
        <span className="text-xs font-semibold text-[#6b7c86]">쉼표 또는 줄바꿈, 최대 12명</span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"예시\n민수, 지연, 태호\n또는 줄바꿈으로 한 명씩"}
        className="min-h-[132px] rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 py-3 text-sm leading-6 text-[#213541]"
      />
      {error ? <p className="text-sm font-semibold text-[#b04646]">{error}</p> : null}
    </div>
  )
}

function AIExcuseGame({
  onBackHome,
  onOpenRecord,
}: {
  onBackHome: () => void
  onOpenRecord: (payload: ResultPayload) => void
}) {
  const [namesInput, setNamesInput] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "running" | "result">("idle")
  const [loserName, setLoserName] = useState("")
  const [reason, setReason] = useState("")
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  function clearPendingResult() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function handleStart() {
    clearPendingResult()
    const parsed = parseParticipantNames(namesInput)

    if (parsed.error) {
      setError(parsed.error)
      return
    }

    const nextLoser = pickRandomItem(parsed.names)
    const nextReason = pickRandomItem(AI_EXCUSE_TEMPLATES).replaceAll("{name}", nextLoser)

    setError("")
    setLoserName(nextLoser)
    setReason(nextReason)
    setStatus("running")

    timeoutRef.current = window.setTimeout(() => {
      setStatus("result")
      onOpenRecord({
        name: nextLoser,
        mode: "ai_excuse",
        detail: nextReason,
      })
      timeoutRef.current = null
    }, 1400)
  }

  function handleReset() {
    clearPendingResult()
    setStatus("idle")
    setLoserName("")
    setReason("")
    setError("")
  }

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="AI 핑계 당첨"
        description="입력한 사람 중 한 명을 랜덤으로 뽑고, 미리 준비된 장난스러운 핑계 문장을 붙여 결과를 공개합니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[28px] border border-black/8 bg-white/82 px-5 py-5">
          <SharedNamesInput value={namesInput} onChange={setNamesInput} error={error} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleStart}
              disabled={status === "running"}
              className="h-11 rounded-full bg-[#f5a623] px-5 text-white hover:bg-[#de941c]"
            >
              {status === "running" ? "핑계 생성 중..." : "당첨 뽑기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264] hover:bg-[#f7fbfd]"
            >
              <RefreshCw className="size-4" />
              다시 하기
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,241,220,0.94),rgba(255,255,255,0.88))] px-5 py-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8b641d]">
            <Sparkles className="size-4" />
            Result Stage
          </div>

          {status === "idle" ? (
            <EmptyGameState
              title="아직 결과가 없습니다."
              description="이름을 2명 이상 입력하고 당첨 뽑기를 누르면 핑계와 함께 결과가 공개됩니다."
            />
          ) : status === "running" ? (
            <div className="mt-10 space-y-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/80 shadow-[0_18px_40px_rgba(245,166,35,0.18)]">
                <Sparkles className="size-9 animate-pulse text-[#f5a623]" />
              </div>
              <p className="text-3xl font-black tracking-[-0.04em] text-[#18232d]">핑계 조합 중...</p>
              <p className="text-sm leading-6 text-[#6f6b60]">시스템이 가장 자연스럽게 걸릴 사람을 분석하고 있습니다.</p>
            </div>
          ) : (
            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9a6c2e]">최종 당첨</p>
              <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#18232d]">{loserName}</p>
              <div className="mt-6 rounded-[24px] border border-[#f1d39e] bg-white/76 px-5 py-5 text-base leading-7 text-[#5f5648]">
                {reason}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() =>
                    onOpenRecord({
                      name: loserName,
                      mode: "ai_excuse",
                      detail: reason,
                    })
                  }
                  className="h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2b3642]"
                >
                  기록하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="h-11 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264]"
                >
                  다시 하기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BombPassGame({
  onBackHome,
  onOpenRecord,
}: {
  onBackHome: () => void
  onOpenRecord: (payload: ResultPayload) => void
}) {
  const [namesInput, setNamesInput] = useState("")
  const [limitSecondsInput, setLimitSecondsInput] = useState("10")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "running" | "result">("idle")
  const [players, setPlayers] = useState<string[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [limitSeconds, setLimitSeconds] = useState(10)
  const [explodeTimeMs, setExplodeTimeMs] = useState(0)
  const [loserName, setLoserName] = useState("")
  const [resultDetail, setResultDetail] = useState("")
  const [boomActive, setBoomActive] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const boomTimeoutRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const currentPlayerIndexRef = useRef(0)
  const playersRef = useRef<string[]>([])
  const explodeTimeMsRef = useRef(0)
  const limitSecondsRef = useRef(10)

  function clearTimer() {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function clearBoomTimeout() {
    if (boomTimeoutRef.current !== null) {
      window.clearTimeout(boomTimeoutRef.current)
      boomTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearTimer()
      clearBoomTimeout()
    }
  }, [])

  function finishGame(playerIndex: number, elapsed: number) {
    clearTimer()
    clearBoomTimeout()

    const resolvedPlayers = playersRef.current
    const resolvedLoser = resolvedPlayers[playerIndex]

    if (!resolvedLoser) {
      return
    }

    const cappedElapsed = Math.min(elapsed, limitSecondsRef.current * 1000)
    const detail = `폭탄이 ${formatElapsedSeconds(cappedElapsed)}에 터졌습니다. 제한 시간은 ${limitSecondsRef.current.toFixed(0)}초였습니다.`

    setElapsedMs(cappedElapsed)
    setLoserName(resolvedLoser)
    setResultDetail(detail)
    setStatus("result")
    setBoomActive(true)
    onOpenRecord({
      name: resolvedLoser,
      mode: "bomb_pass",
      detail,
    })

    boomTimeoutRef.current = window.setTimeout(() => {
      setBoomActive(false)
      boomTimeoutRef.current = null
    }, 700)
  }

  function handleStart() {
    const parsed = parseParticipantNames(namesInput)
    if (parsed.error) {
      setError(parsed.error)
      return
    }

    const nextLimitSeconds = Number(limitSecondsInput)
    if (!Number.isFinite(nextLimitSeconds) || nextLimitSeconds <= 0) {
      setError("제한 시간을 1초 이상 입력해 주세요")
      return
    }

    const nextExplodeTimeMs = Math.random() * nextLimitSeconds * 1000

    setError("")
    setPlayers(parsed.names)
    playersRef.current = parsed.names
    setLimitSeconds(nextLimitSeconds)
    limitSecondsRef.current = nextLimitSeconds
    setExplodeTimeMs(nextExplodeTimeMs)
    explodeTimeMsRef.current = nextExplodeTimeMs
    setCurrentPlayerIndex(0)
    currentPlayerIndexRef.current = 0
    setElapsedMs(0)
    setLoserName("")
    setResultDetail("")
    setBoomActive(false)
    setStatus("running")
    startTimeRef.current = performance.now()
    clearTimer()

    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current
      setElapsedMs(Math.min(elapsed, limitSecondsRef.current * 1000))

      if (elapsed >= explodeTimeMsRef.current) {
        finishGame(currentPlayerIndexRef.current, elapsed)
      }
    }, 80)
  }

  function handlePass() {
    if (status !== "running") {
      return
    }

    const elapsed = performance.now() - startTimeRef.current
    if (elapsed >= explodeTimeMsRef.current) {
      finishGame(currentPlayerIndexRef.current, elapsed)
      return
    }

    const nextIndex = (currentPlayerIndexRef.current + 1) % playersRef.current.length
    currentPlayerIndexRef.current = nextIndex
    setCurrentPlayerIndex(nextIndex)
    setElapsedMs(Math.min(elapsed, limitSecondsRef.current * 1000))
  }

  function handleReset() {
    clearTimer()
    clearBoomTimeout()
    setStatus("idle")
    setPlayers([])
    playersRef.current = []
    setCurrentPlayerIndex(0)
    currentPlayerIndexRef.current = 0
    setElapsedMs(0)
    setExplodeTimeMs(0)
    explodeTimeMsRef.current = 0
    setLoserName("")
    setResultDetail("")
    setBoomActive(false)
    setError("")
  }

  const progressPercent = limitSeconds > 0 ? Math.min((elapsedMs / (limitSeconds * 1000)) * 100, 100) : 0
  const currentPlayerName = players[currentPlayerIndex] ?? "대기 중"

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="폭탄 넘기기"
        description="입력 순서대로 넘기기 버튼을 누르며 폭탄을 돌립니다. 랜덤한 시점에 폭탄이 터지면 그 순간 차례인 사람이 걸립니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="rounded-[28px] border border-black/8 bg-white/82 px-5 py-5">
          <SharedNamesInput value={namesInput} onChange={setNamesInput} error={error} />
          <div className="mt-5 space-y-3">
            <label className="text-sm font-semibold text-[#243440]">제한 시간(초)</label>
            <Input
              type="number"
              min="1"
              step="1"
              value={limitSecondsInput}
              onChange={(event) => setLimitSecondsInput(event.target.value)}
              className="h-12 rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 text-sm text-[#213541]"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleStart}
              disabled={status === "running"}
              className="h-11 rounded-full bg-[#ff6f61] px-5 text-white hover:bg-[#ec5f51]"
            >
              {status === "running" ? "진행 중..." : "시작"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264]"
            >
              <RefreshCw className="size-4" />
              다시 하기
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "rounded-[28px] border border-black/8 px-5 py-5 transition",
            boomActive
              ? "bg-[linear-gradient(135deg,rgba(255,210,210,0.95),rgba(255,240,240,0.92))] shadow-[0_0_0_4px_rgba(255,111,97,0.16)]"
              : "bg-[linear-gradient(135deg,rgba(255,235,232,0.92),rgba(255,255,255,0.9))]",
          )}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a4524a]">
            <Bomb className="size-4" />
            Bomb Stage
          </div>

          {status === "idle" ? (
            <EmptyGameState
              title="폭탄 대기 중"
              description="이름과 제한 시간을 입력하고 시작을 누르면 첫 번째 사람부터 폭탄이 돌아갑니다."
            />
          ) : (
            <div className="mt-7 space-y-6">
              <div className="rounded-[28px] border border-white/70 bg-white/72 px-5 py-6 text-center shadow-[0_16px_36px_rgba(24,35,45,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a5a52]">
                  {status === "running" ? "현재 차례" : "걸린 사람"}
                </p>
                <p className="mt-4 text-4xl font-black tracking-[-0.05em] text-[#18232d]">
                  {status === "running" ? currentPlayerName : loserName}
                </p>
                <div className="mt-5 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff3f1] shadow-[0_18px_40px_rgba(255,111,97,0.18)]">
                  <Bomb className={cn("size-10 text-[#ff6f61]", status === "running" ? "animate-pulse" : "")} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#5d6c77]">
                  <span>진행 시간 {formatElapsedSeconds(elapsedMs)}</span>
                  <span>제한 {limitSeconds.toFixed(0)}초</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/72">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#ff8a7d,#ff6f61)] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {players.map((player, index) => (
                  <div
                    key={`${player}-${index}`}
                    className={cn(
                      "rounded-[22px] border px-4 py-4 text-sm font-semibold transition",
                      status === "running" && index === currentPlayerIndex
                        ? "border-[#ff8f80] bg-[#fff2ef] text-[#9a463f] shadow-[0_14px_30px_rgba(255,111,97,0.14)]"
                        : status === "result" && player === loserName
                          ? "border-[#ff9f92] bg-[#fff1ee] text-[#9a463f]"
                          : "border-black/8 bg-white/76 text-[#475964]",
                    )}
                  >
                    {player}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handlePass}
                  disabled={status !== "running"}
                  className="h-12 rounded-full bg-[#1f2730] px-6 text-white hover:bg-[#2b3642]"
                >
                  넘기기
                </Button>

                {status === "result" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onOpenRecord({
                        name: loserName,
                        mode: "bomb_pass",
                        detail: resultDetail,
                      })
                    }
                    className="h-12 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264]"
                  >
                    기록하기
                  </Button>
                ) : null}
              </div>

              {status === "result" ? (
                <div className="rounded-[24px] border border-[#f0c9c9] bg-white/76 px-5 py-5 text-sm leading-6 text-[#6a4f4b]">
                  {resultDetail}
                  <div className="mt-3 text-xs font-semibold text-[#8e5d56]">
                    랜덤 폭발 시점: {formatElapsedSeconds(explodeTimeMs)}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LadderGame({
  onBackHome,
  onOpenRecord,
}: {
  onBackHome: () => void
  onOpenRecord: (payload: ResultPayload) => void
}) {
  const [namesInput, setNamesInput] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "tracing" | "result">("idle")
  const [players, setPlayers] = useState<string[]>([])
  const [structure, setStructure] = useState<LadderStructure | null>(null)
  const [geometry, setGeometry] = useState<LadderGeometry | null>(null)
  const [traces, setTraces] = useState<LadderTrace[]>([])
  const [activeTraceIndex, setActiveTraceIndex] = useState(-1)
  const [loserName, setLoserName] = useState("")
  const [loserTraceStartIndex, setLoserTraceStartIndex] = useState<number | null>(null)
  const [resultDetail, setResultDetail] = useState("")
  const timersRef = useRef<number[]>([])

  function clearAnimationTimers() {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    timersRef.current = []
  }

  useEffect(() => {
    return () => {
      clearAnimationTimers()
    }
  }, [])

  function handleStart() {
    clearAnimationTimers()
    const parsed = parseParticipantNames(namesInput)

    if (parsed.error) {
      setError(parsed.error)
      return
    }

    const nextStructure = createLadderStructure(parsed.names.length)
    const nextGeometry = createLadderGeometry(parsed.names.length, nextStructure.rows.length)
    const nextTraces = buildLadderTraces(nextStructure, nextGeometry)
    const loserStartIndex = nextTraces.find((trace) => trace.endIndex === nextStructure.loserSlotIndex)?.startIndex

    if (loserStartIndex === undefined) {
      setError("사다리 생성 중 오류가 발생했습니다. 다시 시도해 주세요.")
      return
    }

    const resolvedLoser = parsed.names[loserStartIndex]
    const detail = `${nextStructure.loserSlotIndex + 1}번 슬롯이 걸림으로 지정되었습니다.`

    setError("")
    setPlayers(parsed.names)
    setStructure(nextStructure)
    setGeometry(nextGeometry)
    setTraces(nextTraces)
    setActiveTraceIndex(-1)
    setLoserName("")
    setLoserTraceStartIndex(null)
    setResultDetail(detail)
    setStatus("tracing")

    nextTraces.forEach((_, index) => {
      timersRef.current.push(
        window.setTimeout(() => {
          setActiveTraceIndex(index)
        }, 650 * index),
      )
    })

    timersRef.current.push(
      window.setTimeout(() => {
        setLoserName(resolvedLoser)
        setLoserTraceStartIndex(loserStartIndex)
        setStatus("result")
        onOpenRecord({
          name: resolvedLoser,
          mode: "ladder",
          detail,
        })
      }, 650 * nextTraces.length + 500),
    )
  }

  function handleReset() {
    clearAnimationTimers()
    setStatus("idle")
    setPlayers([])
    setStructure(null)
    setGeometry(null)
    setTraces([])
    setActiveTraceIndex(-1)
    setLoserName("")
    setLoserTraceStartIndex(null)
    setResultDetail("")
    setError("")
  }

  const activeTraceLabel =
    status === "tracing" && activeTraceIndex >= 0 ? `${players[activeTraceIndex]} 경로 추적 중` : "사다리 준비 완료"
  const loserTrace =
    loserTraceStartIndex !== null ? traces.find((trace) => trace.startIndex === loserTraceStartIndex) : undefined

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="사다리 타기"
        description="이름 수에 맞게 랜덤 사다리를 만들고, 걸림 슬롯에 도착하는 사람을 순서대로 추적합니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
        <div className="rounded-[28px] border border-black/8 bg-white/82 px-5 py-5">
          <SharedNamesInput value={namesInput} onChange={setNamesInput} error={error} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleStart}
              disabled={status === "tracing"}
              className="h-11 rounded-full bg-[#23a36d] px-5 text-white hover:bg-[#1d905f]"
            >
              {status === "tracing" ? "경로 추적 중..." : "사다리 시작"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264]"
            >
              <RefreshCw className="size-4" />
              다시 하기
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(229,252,236,0.92),rgba(255,255,255,0.9))] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2d7a58]">
              <GitBranch className="size-4" />
              Ladder Board
            </div>
            <span className="rounded-full border border-white/72 bg-white/72 px-3 py-2 text-xs font-semibold text-[#35624b]">
              {activeTraceLabel}
            </span>
          </div>

          {!structure || !geometry || !players.length ? (
            <EmptyGameState
              title="사다리를 아직 만들지 않았습니다."
              description="이름을 입력하고 사다리 시작을 누르면 랜덤 가로줄과 걸림 슬롯이 생성됩니다."
            />
          ) : (
            <div className="mt-6 space-y-5">
              <div
                className="grid gap-3 text-center"
                style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}
              >
                {players.map((player, index) => (
                  <div
                    key={`ladder-top-${index}`}
                    className="truncate rounded-full border border-white/70 bg-white/82 px-3 py-2 text-sm font-semibold text-[#214236]"
                  >
                    {player}
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-[28px] border border-white/75 bg-white/62 p-4">
                <div style={{ minWidth: `${geometry.width}px` }}>
                  <svg
                    width="100%"
                    viewBox={`0 0 ${geometry.width} ${geometry.height}`}
                    className="h-[380px] w-full"
                    aria-label="사다리 게임 보드"
                  >
                    {geometry.xPositions.map((xPosition, index) => (
                      <line
                        key={`ladder-vertical-${index}`}
                        x1={xPosition}
                        y1={geometry.topY}
                        x2={xPosition}
                        y2={geometry.bottomY}
                        stroke="#97b8a7"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    ))}

                    {structure.rows.flatMap((row) =>
                      row.connections.map((hasConnection, index) => {
                        if (!hasConnection) {
                          return null
                        }

                        const rowY = geometry.rowYPositions[row.index]
                        return (
                          <line
                            key={`ladder-connection-${row.index}-${index}`}
                            x1={geometry.xPositions[index]}
                            y1={rowY}
                            x2={geometry.xPositions[index + 1]}
                            y2={rowY}
                            stroke="#6cb58e"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                        )
                      }),
                    )}

                    {traces.map((trace, index) => {
                      const isVisible = status === "result" || index <= activeTraceIndex
                      if (!isVisible) {
                        return null
                      }

                      const color = LADDER_TRACE_COLORS[index % LADDER_TRACE_COLORS.length]
                      const isHighlighted = (status === "tracing" && index === activeTraceIndex) || loserTrace === trace

                      return (
                        <path
                          key={`ladder-trace-${trace.startIndex}`}
                          d={trace.path}
                          fill="none"
                          stroke={color}
                          strokeWidth={isHighlighted ? 8 : 5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={status === "tracing" && index === activeTraceIndex ? "10 10" : undefined}
                          opacity={isHighlighted ? 1 : 0.42}
                        />
                      )
                    })}
                  </svg>
                </div>
              </div>

              <div
                className="grid gap-3 text-center"
                style={{ gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))` }}
              >
                {players.map((_, index) => {
                  const isLoserSlot = structure.loserSlotIndex === index

                  return (
                    <div
                      key={`ladder-bottom-${index}`}
                      className={cn(
                        "rounded-[22px] border px-3 py-3 text-sm font-semibold shadow-[0_10px_24px_rgba(24,35,45,0.04)]",
                        isLoserSlot
                          ? "border-[#ffb0a8] bg-[#fff1ee] text-[#9c4a43]"
                          : "border-white/72 bg-white/82 text-[#3c5d4c]",
                      )}
                    >
                      {isLoserSlot ? "걸림" : "통과"}
                    </div>
                  )
                })}
              </div>

              {status === "result" ? (
                <div className="rounded-[26px] border border-[#c6ead5] bg-white/76 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2e7d5a]">최종 결과</p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#18232d]">{loserName}</p>
                  <p className="mt-3 text-sm leading-6 text-[#587066]">{resultDetail}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      onClick={() =>
                        onOpenRecord({
                          name: loserName,
                          mode: "ladder",
                          detail: resultDetail,
                        })
                      }
                      className="h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2b3642]"
                    >
                      기록하기
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RouletteGuide({
  onBackHome,
  onOpenManualRecord,
  onLaunchRoulette,
}: {
  onBackHome: () => void
  onOpenManualRecord: () => void
  onLaunchRoulette: () => void
}) {
  return (
    <div className="space-y-6">
      <ScreenHeader
        title="룰렛"
        description="룰렛 게임은 외부 페이지에서 실행됩니다. 결과는 자동 수집하지 않으므로 끝난 뒤 수동 기록을 눌러 직접 입력해 주세요."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="rounded-[30px] border border-black/8 bg-[linear-gradient(135deg,rgba(227,240,255,0.94),rgba(255,255,255,0.9))] px-5 py-6 shadow-[0_18px_40px_rgba(24,35,45,0.05)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4a71ad]">
            <CirclePlay className="size-4" />
            External Roulette
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#18232d]">외부 룰렛으로 이동</h2>
          <p className="mt-4 text-sm leading-7 text-[#5f707b]">
            새 탭으로 룰렛 페이지를 열어 두고, 결과가 나오면 현재 페이지로 돌아와 수동 기록으로 명예의 전당에
            저장하는 흐름입니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onLaunchRoulette}
              className="h-11 rounded-full bg-[#4c7dff] px-5 text-white hover:bg-[#3d6df3]"
            >
              룰렛 열기
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-full border-[#d8e4eb] bg-white px-5 text-[#355264]"
            >
              <a href={ROULETTE_URL} target="_blank" rel="noreferrer">
                직접 링크 열기
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-black/8 bg-white/84 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8190]">Flow</p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-[#5e707b]">
              <li>1. 룰렛 열기를 눌러 외부 페이지에서 게임을 실행합니다.</li>
              <li>2. 걸린 사람 이름을 확인합니다.</li>
              <li>3. 이 페이지로 돌아와 수동 기록을 열어 이름을 입력합니다.</li>
              <li>4. 저장하면 mode가 룰렛으로 기록되어 명예의 전당에 반영됩니다.</li>
            </ol>
          </div>

          <div className="rounded-[28px] border border-black/8 bg-white/84 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8190]">Manual Record</p>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#18232d]">결과 입력하기</h3>
            <p className="mt-3 text-sm leading-6 text-[#5f707b]">
              외부 결과는 자동으로 저장되지 않습니다. 아래 버튼으로 룰렛 결과 수동 기록 모달을 열어 직접 입력해
              주세요.
            </p>
            <Button
              type="button"
              onClick={onOpenManualRecord}
              className="mt-5 h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2b3642]"
            >
              룰렛 결과 수동 기록
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyGameState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-10 rounded-[28px] border border-dashed border-white/70 bg-white/66 px-5 py-12 text-center">
      <p className="text-2xl font-black tracking-[-0.04em] text-[#18232d]">{title}</p>
      <p className="mt-3 text-sm leading-6 text-[#63727d]">{description}</p>
    </div>
  )
}

function RecordDialogModal({
  state,
  knownNames,
  onOpenChange,
  onSubmit,
}: {
  state: RecordDialogState
  knownNames: string[]
  onOpenChange: (open: boolean) => void
  onSubmit: (draft: RecordDraft) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [mode, setMode] = useState<CaughtMode>("manual")
  const [detail, setDetail] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!state.open) {
      return
    }

    setName(state.defaultName)
    setMode(state.mode)
    setDetail(state.detail)
    setError("")
    setSaving(false)
  }, [state])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving) {
      return
    }

    const cleanedName = sanitizeDisplayName(name)
    if (!cleanedName) {
      setError("걸린 사람 이름을 입력해 주세요")
      return
    }

    setSaving(true)
    setError("")

    try {
      await onSubmit({
        name: cleanedName,
        mode,
        detail,
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "기록 저장 중 오류가 발생했습니다.")
      setSaving(false)
      return
    }

    setSaving(false)
  }

  return (
    <Dialog
      open={state.open}
      onOpenChange={(open) => {
        if (!saving) {
          onOpenChange(open)
        }
      }}
    >
      <DialogContent className="max-w-lg rounded-[30px] border border-[#ddd8cd] bg-[linear-gradient(180deg,rgba(255,252,245,0.98),rgba(248,250,255,0.96))] p-6 shadow-[0_28px_80px_rgba(24,35,45,0.16)]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#18232d]">{state.title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-[#61727d]">
            {state.description}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="bet-record-name" className="text-sm font-semibold text-[#243440]">
              걸린 사람 이름
            </label>
            <Input
              id="bet-record-name"
              list="bet-known-names"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름 입력"
              className="h-12 rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 text-sm text-[#213541]"
              required
            />
            <datalist id="bet-known-names">
              {knownNames.map((knownName) => (
                <option key={knownName} value={knownName} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label htmlFor="bet-record-mode" className="text-sm font-semibold text-[#243440]">
              모드
            </label>
            {state.allowModeChange ? (
              <select
                id="bet-record-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as CaughtMode)}
                className="h-12 w-full rounded-[22px] border border-[#d7e4eb] bg-white/90 px-4 text-sm text-[#213541] outline-none transition focus:border-[#87aac2]"
              >
                {(Object.keys(CAUGHT_MODE_LABELS) as CaughtMode[]).map((caughtMode) => (
                  <option key={caughtMode} value={caughtMode}>
                    {CAUGHT_MODE_LABELS[caughtMode]}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-[22px] border border-[#d7e4eb] bg-white/86 px-4 py-3 text-sm font-semibold text-[#243440]">
                {CAUGHT_MODE_LABELS[mode]}
              </div>
            )}
          </div>

          {state.editableDetail ? (
            <div className="space-y-2">
              <label htmlFor="bet-record-detail" className="text-sm font-semibold text-[#243440]">
                상세 메모
              </label>
              <Textarea
                id="bet-record-detail"
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder="선택 입력"
                className="min-h-[112px] rounded-[22px] border-[#d7e4eb] bg-white/90 px-4 py-3 text-sm leading-6 text-[#213541]"
              />
            </div>
          ) : state.detail ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#243440]">상세 결과</p>
              <div className="rounded-[24px] border border-[#e3ddd0] bg-white/80 px-4 py-4 text-sm leading-6 text-[#5d6d78]">
                {state.detail}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-[20px] border border-[#f0cfcf] bg-[#fff6f6] px-4 py-3 text-sm font-semibold text-[#9a3b3b]">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-11 rounded-2xl border-[#d8e4eb] bg-white px-4 text-[#355264]"
            >
              취소
            </Button>
            <Button type="submit" disabled={saving} className="h-11 rounded-2xl bg-[#1f2730] px-5 text-white hover:bg-[#2b3642]">
              {saving ? "저장 중..." : "기록하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
