"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Disc3, RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { parseParticipantNames } from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { EmptyGameState, ScreenHeader, SharedNamesInput } from "../common-ui"

const ROULETTE_SEGMENT_COLORS = [
  "#ffd166",
  "#ff9f7a",
  "#6fd1b3",
  "#70a8ff",
  "#b18cff",
  "#ff7eb6",
  "#7fd7ff",
  "#9fe870",
  "#ffc857",
  "#ff8f66",
  "#7f95ff",
  "#f29f67",
] as const

const ROULETTE_SPIN_DURATION_MS = 5200

type AutoRecordPayload = {
  name: string
  detail: string
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360
}

function buildRouletteBackground(playerCount: number) {
  if (playerCount < 2) {
    return "radial-gradient(circle at center, rgba(255,255,255,0.88), rgba(227,240,255,0.94))"
  }

  const segmentAngle = 360 / playerCount

  return `conic-gradient(${Array.from({ length: playerCount }, (_, index) => {
    const start = (segmentAngle * index).toFixed(3)
    const end = (segmentAngle * (index + 1)).toFixed(3)
    const color = ROULETTE_SEGMENT_COLORS[index % ROULETTE_SEGMENT_COLORS.length]

    return `${color} ${start}deg ${end}deg`
  }).join(", ")})`
}

export function RouletteGame({
  onBackHome,
  onAutoRecord,
}: {
  onBackHome: () => void
  onAutoRecord: (payload: AutoRecordPayload) => Promise<void>
}) {
  const [namesInput, setNamesInput] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "spinning" | "result">("idle")
  const [participants, setParticipants] = useState<string[]>([])
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [resultDetail, setResultDetail] = useState("")
  const [rotationDeg, setRotationDeg] = useState(0)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")
  const spinTimeoutRef = useRef<number | null>(null)
  const pendingRecordRef = useRef<AutoRecordPayload | null>(null)

  function clearSpinTimeout() {
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current)
      spinTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearSpinTimeout()
    }
  }, [])

  const segmentAngle = participants.length > 0 ? 360 / participants.length : 0
  const wheelBackground = useMemo(() => buildRouletteBackground(participants.length), [participants.length])
  const winnerName = winnerIndex !== null ? participants[winnerIndex] ?? "" : ""
  const wheelStatusLabel =
    status === "spinning" ? "회전 중" : status === "result" && winnerName ? winnerName : "Ready"

  async function persistAutoRecord(payload: AutoRecordPayload) {
    pendingRecordRef.current = payload
    setSaveState("saving")
    setSaveError("")

    try {
      await onAutoRecord(payload)
      setSaveState("saved")
    } catch (recordError) {
      setSaveState("error")
      setSaveError(recordError instanceof Error ? recordError.message : "자동 저장 중 오류가 발생했습니다.")
    }
  }

  function handleSpin() {
    clearSpinTimeout()

    const parsed = parseParticipantNames(namesInput)
    if (parsed.error) {
      setError(parsed.error)
      return
    }

    const nextParticipants = parsed.names
    const nextWinnerIndex = Math.floor(Math.random() * nextParticipants.length)
    const nextSegmentAngle = 360 / nextParticipants.length
    const currentNormalizedRotation = normalizeRotation(rotationDeg)
    const targetNormalizedRotation = (360 - (nextWinnerIndex * nextSegmentAngle + nextSegmentAngle / 2)) % 360
    const additionalRotation = (targetNormalizedRotation - currentNormalizedRotation + 360) % 360
    const extraTurns = (5 + Math.floor(Math.random() * 3)) * 360
    const nextRotation = rotationDeg + extraTurns + additionalRotation
    const nextWinnerName = nextParticipants[nextWinnerIndex]
    const detail = `참여 ${nextParticipants.length}명 중 룰렛이 ${nextWinnerName}에서 멈췄습니다.`

    pendingRecordRef.current = {
      name: nextWinnerName,
      detail,
    }

    setError("")
    setParticipants(nextParticipants)
    setWinnerIndex(null)
    setResultDetail("")
    setSaveState("idle")
    setSaveError("")
    setStatus("spinning")
    setRotationDeg(nextRotation)

    spinTimeoutRef.current = window.setTimeout(() => {
      setWinnerIndex(nextWinnerIndex)
      setResultDetail(detail)
      setStatus("result")
      void persistAutoRecord({
        name: nextWinnerName,
        detail,
      })
      spinTimeoutRef.current = null
    }, ROULETTE_SPIN_DURATION_MS)
  }

  function handleReset() {
    clearSpinTimeout()
    pendingRecordRef.current = null
    setStatus("idle")
    setParticipants([])
    setWinnerIndex(null)
    setResultDetail("")
    setRotationDeg(0)
    setSaveState("idle")
    setSaveError("")
    setError("")
  }

  async function handleRetrySave() {
    if (!pendingRecordRef.current || saveState === "saving") {
      return
    }

    await persistAutoRecord(pendingRecordRef.current)
  }

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="룰렛"
        description="같은 화면에서 바로 룰렛을 돌리고, 결과가 확정되면 명예의 전당에 자동으로 누적합니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
        <div className="rounded-[28px] border border-black/8 bg-white/82 px-5 py-5">
          <SharedNamesInput value={namesInput} onChange={setNamesInput} error={error} />

          <div className="mt-5 rounded-[24px] border border-[#d8e4eb] bg-[linear-gradient(135deg,rgba(240,247,255,0.92),rgba(255,250,242,0.9))] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#50719a]">Auto Hall Of Fame</p>
            <p className="mt-3 text-sm leading-6 text-[#556874]">
              룰렛이 멈추는 순간 당첨자 이름과 참여 인원 메모를 즉시 저장합니다. 별도 수동 기록 버튼은 필요하지
              않습니다.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleSpin}
              disabled={status === "spinning"}
              className="h-11 rounded-full bg-[#4c7dff] px-5 text-white hover:bg-[#3d6df3]"
            >
              <Disc3 className={cn("size-4", status === "spinning" ? "animate-spin" : "")} />
              {status === "spinning" ? "회전 중..." : participants.length ? "다시 돌리기" : "룰렛 시작"}
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

        <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(228,240,255,0.94),rgba(255,250,240,0.88))] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#406ea8]">
              <Disc3 className="size-4" />
              Roulette Stage
            </div>
            <span className="rounded-full border border-white/72 bg-white/72 px-3 py-2 text-xs font-semibold text-[#355264]">
              {participants.length ? `참여 ${participants.length}명` : "참여자 대기 중"}
            </span>
          </div>

          {!participants.length ? (
            <EmptyGameState
              title="룰렛이 아직 준비되지 않았습니다."
              description="이름을 입력하고 룰렛 시작을 누르면 화면 안에서 바로 회전하고, 결과는 자동으로 저장됩니다."
            />
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
              <div className="space-y-4">
                <div className="relative mx-auto aspect-square w-full max-w-[430px]">
                  <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-0 w-0 -translate-x-1/2 border-x-[16px] border-b-[28px] border-x-transparent border-b-[#1f2730] drop-shadow-[0_8px_12px_rgba(24,35,45,0.18)]" />

                  <div
                    className="absolute inset-0 rounded-full border-[12px] border-white/85 shadow-[0_28px_70px_rgba(24,35,45,0.16)]"
                    style={{
                      background: wheelBackground,
                      transform: `rotate(${rotationDeg}deg)`,
                      transition: status === "spinning"
                        ? `transform ${ROULETTE_SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.84, 0.18, 1)`
                        : "none",
                    }}
                  >
                    <div className="absolute inset-3 rounded-full border border-white/28" />

                    {participants.map((participant, index) => {
                      const angle = segmentAngle * index + segmentAngle / 2 - 90
                      const radians = (angle * Math.PI) / 180
                      const left = 50 + Math.cos(radians) * 34
                      const top = 50 + Math.sin(radians) * 34
                      const isWinner = winnerIndex === index

                      return (
                        <div
                          key={`${participant}-${index}`}
                          className="absolute"
                          style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div
                            className={cn(
                              "w-[86px] rounded-full px-2 py-1 text-center text-[11px] font-black leading-4 shadow-sm",
                              isWinner
                                ? "bg-white text-[#1f2730] ring-2 ring-white/90"
                                : "bg-white/72 text-[#223541]",
                            )}
                          >
                            {participant}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/80 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(245,248,255,0.86))] text-center shadow-[0_16px_40px_rgba(24,35,45,0.12)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6d7f8c]">Roulette</p>
                    <p className="mt-2 px-2 text-lg font-black tracking-[-0.04em] text-[#18232d]">{wheelStatusLabel}</p>
                    <p className="mt-1 text-xs font-semibold text-[#6c7d88]">
                      {status === "spinning" ? "Auto Save Pending" : status === "result" ? "확정" : "대기"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/76 bg-white/74 px-4 py-4 text-sm leading-6 text-[#5a6d79]">
                  {status === "spinning"
                    ? "룰렛이 멈추는 중입니다. 스핀 완료 후 결과를 즉시 명예의 전당에 저장합니다."
                    : status === "result"
                      ? resultDetail
                      : "참여자를 확정한 뒤 룰렛 시작을 누르면 현재 목록 기준으로 결과를 계산합니다."}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-white/76 bg-white/78 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8190]">
                    {status === "result" ? "Winner" : status === "spinning" ? "Spinning" : "Status"}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#18232d]">
                    {status === "result" && winnerName ? winnerName : status === "spinning" ? "결과 계산 중..." : "준비 완료"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#5f707b]">
                    {status === "result"
                      ? "결과는 자동으로 명예의 전당에 반영됩니다."
                      : status === "spinning"
                        ? "회전이 끝나는 즉시 자동 저장을 시도합니다."
                        : "참가자 목록을 입력하고 회전을 시작해 주세요."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {participants.map((participant, index) => (
                    <div
                      key={`roulette-player-${participant}-${index}`}
                      className={cn(
                        "rounded-[22px] border px-4 py-4 text-sm font-semibold transition",
                        status === "spinning"
                          ? "border-[#d9e6ef] bg-white/72 text-[#4a6272]"
                          : winnerIndex === index
                            ? "border-[#7ea7ff] bg-[#edf3ff] text-[#2d4f92] shadow-[0_14px_30px_rgba(76,125,255,0.16)]"
                            : "border-black/8 bg-white/78 text-[#475964]",
                      )}
                    >
                      {participant}
                    </div>
                  ))}
                </div>

                {status === "result" ? (
                  <div
                    className={cn(
                      "rounded-[26px] border px-5 py-5",
                      saveState === "saved"
                        ? "border-[#c7defe] bg-white/82"
                        : saveState === "error"
                          ? "border-[#f0cfcf] bg-[#fff6f6]"
                          : "border-[#dce6f4] bg-white/76",
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                      <Sparkles className="size-4" />
                      {saveState === "saved"
                        ? "Auto Saved"
                        : saveState === "error"
                          ? "Auto Save Failed"
                          : "Saving"}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5c6d78]">
                      {saveState === "saved"
                        ? "룰렛 결과가 자동으로 기록되었습니다. 명예의 전당과 최근 기록 패널에서 바로 확인할 수 있습니다."
                        : saveState === "error"
                          ? saveError
                          : "룰렛 결과를 명예의 전당에 저장하는 중입니다."}
                    </p>

                    {saveState === "error" ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleRetrySave()}
                        className="mt-4 h-10 rounded-full border-[#e0c2c2] bg-white px-4 text-[#8d4c4c]"
                      >
                        자동 저장 다시 시도
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
