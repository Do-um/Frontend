"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bomb, RefreshCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseParticipantNames } from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { EmptyGameState, ScreenHeader, SharedNamesInput } from "../common-ui"
import { formatElapsedSeconds } from "../helpers"
import type { ResultPayload } from "../types"

export function BombPassGame({
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
