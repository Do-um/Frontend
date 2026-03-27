"use client"

import { useEffect, useRef, useState } from "react"
import { GitBranch, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  buildLadderTraces,
  createLadderGeometry,
  createLadderStructure,
  parseParticipantNames,
  type LadderGeometry,
  type LadderStructure,
  type LadderTrace,
} from "@/lib/bet-game"
import { cn } from "@/lib/utils"

import { BET_PANEL_CLASS, BET_TINTED_PANEL_CLASS, EmptyGameState, ScreenHeader, SharedNamesInput } from "../common-ui"
import { LADDER_TRACE_COLORS } from "../constants"
import type { ResultPayload } from "../types"

export function LadderGame({
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
        <div className={`${BET_PANEL_CLASS} px-5 py-5`}>
          <SharedNamesInput value={namesInput} onChange={setNamesInput} error={error} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleStart}
              disabled={status === "tracing"}
              className="h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2c3743]"
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

        <div className={`${BET_TINTED_PANEL_CLASS} bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(236,244,239,0.84),rgba(234,243,248,0.88))] px-5 py-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">
              <GitBranch className="size-4" />
              Ladder Board
            </div>
            <span className="rounded-full border border-white/80 bg-white/82 px-3 py-2 text-xs font-semibold text-[#5e7482] shadow-sm">
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
                    className="truncate rounded-full border border-white/80 bg-white/82 px-3 py-2 text-sm font-semibold text-[#355264] shadow-sm"
                  >
                    {player}
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-[28px] border border-white/80 bg-white/76 p-4 shadow-[0_12px_28px_rgba(47,74,91,0.05)]">
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
                        stroke="#a0b7c5"
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
                            stroke="#7ea3ba"
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
                          ? "border-[#e4dbd2] bg-[#f6efea] text-[#7d5a54]"
                          : "border-white/80 bg-white/82 text-[#355264]",
                    )}
                  >
                    {isLoserSlot ? "걸림" : "통과"}
                    </div>
                  )
                })}
              </div>

              {status === "result" ? (
                <div className="rounded-[26px] border border-[#dbe6eb] bg-white/82 px-5 py-5 shadow-[0_10px_24px_rgba(47,74,91,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">최종 결과</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-[#15212b]">{loserName}</p>
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
                      className="h-11 rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2c3743]"
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
