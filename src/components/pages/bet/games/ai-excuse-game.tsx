"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AI_EXCUSE_TEMPLATES, parseParticipantNames } from "@/lib/bet-game"

import { EmptyGameState, ScreenHeader, SharedNamesInput } from "../common-ui"
import { pickRandomItem } from "../helpers"
import type { ResultPayload } from "../types"

export function AIExcuseGame({
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
