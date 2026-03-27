"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, LoaderCircle, RefreshCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ScreenHeader } from "../common-ui"

const EMBEDDED_ROULETTE_URL = "/vendor/roulette/index.html?embed=1"
const SOURCE_REPOSITORY_URL = "https://github.com/lazygyu/roulette"
const LICENSE_URL = "/vendor/roulette/LICENSE.txt"

type AutoRecordPayload = {
  name: string
  detail: string
}

type RouletteReadyMessage = {
  type: "lazygyu-roulette-ready"
  source: "lazygyu-roulette"
}

type RouletteGoalMessage = {
  type: "lazygyu-roulette-goal"
  source: "lazygyu-roulette"
  eventId: string
  winner: string
  detail: string
  names: string[]
  totalCount: number
  winningRank: number
  winnerType: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isRouletteReadyMessage(value: unknown): value is RouletteReadyMessage {
  return isObject(value) && value.type === "lazygyu-roulette-ready" && value.source === "lazygyu-roulette"
}

function isRouletteGoalMessage(value: unknown): value is RouletteGoalMessage {
  return (
    isObject(value) &&
    value.type === "lazygyu-roulette-goal" &&
    value.source === "lazygyu-roulette" &&
    typeof value.eventId === "string" &&
    typeof value.winner === "string" &&
    typeof value.detail === "string" &&
    Array.isArray(value.names) &&
    typeof value.totalCount === "number" &&
    typeof value.winningRank === "number" &&
    typeof value.winnerType === "string"
  )
}

export function RouletteGame({
  onBackHome,
  onAutoRecord,
}: {
  onBackHome: () => void
  onAutoRecord: (payload: AutoRecordPayload) => Promise<void>
}) {
  const [frameKey, setFrameKey] = useState(0)
  const [frameStatus, setFrameStatus] = useState<"loading" | "ready">("loading")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")
  const [latestResult, setLatestResult] = useState<RouletteGoalMessage | null>(null)
  const lastPayloadRef = useRef<AutoRecordPayload | null>(null)
  const handledEventIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (isRouletteReadyMessage(event.data)) {
        setFrameStatus("ready")
        return
      }

      if (!isRouletteGoalMessage(event.data) || handledEventIdsRef.current.has(event.data.eventId)) {
        return
      }

      handledEventIdsRef.current.add(event.data.eventId)
      setLatestResult(event.data)

      const nextPayload = {
        name: event.data.winner,
        detail: event.data.detail,
      }

      lastPayloadRef.current = nextPayload
      setSaveState("saving")
      setSaveError("")

      void (async () => {
        try {
          await onAutoRecord(nextPayload)
          setSaveState("saved")
        } catch (recordError) {
          setSaveState("error")
          setSaveError(recordError instanceof Error ? recordError.message : "룰렛 결과 자동 저장 중 오류가 발생했습니다.")
        }
      })()
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onAutoRecord])

  async function handleRetrySave() {
    if (!lastPayloadRef.current || saveState === "saving") {
      return
    }

    setSaveState("saving")
    setSaveError("")

    try {
      await onAutoRecord(lastPayloadRef.current)
      setSaveState("saved")
    } catch (recordError) {
      setSaveState("error")
      setSaveError(recordError instanceof Error ? recordError.message : "룰렛 결과 자동 저장 중 오류가 발생했습니다.")
    }
  }

  function handleReloadFrame() {
    setFrameKey((current) => current + 1)
    setFrameStatus("loading")
  }

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="룰렛"
        description="lazygyu/roulette 원본 앱을 프로젝트 안에 내장했고, 당첨 결과는 same-origin 메시지로 받아 명예의 전당에 자동 저장합니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="overflow-hidden rounded-[30px] border border-black/8 bg-[#0e1721] shadow-[0_20px_60px_rgba(24,35,45,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[linear-gradient(135deg,rgba(20,31,43,0.98),rgba(40,66,95,0.9))] px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Embedded Vendor App</p>
              <p className="mt-2 text-lg font-black tracking-[-0.04em]">lazygyu Marble Roulette</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReloadFrame}
                className="h-10 rounded-full border-white/20 bg-white/10 px-4 text-white hover:bg-white/16"
              >
                <RefreshCw className="size-4" />
                다시 불러오기
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-full border-white/20 bg-white/10 px-4 text-white hover:bg-white/16"
              >
                <a href={EMBEDDED_ROULETTE_URL} target="_blank" rel="noreferrer">
                  새 탭
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="relative bg-[#0b1218]">
            {frameStatus === "loading" ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[linear-gradient(180deg,rgba(11,18,24,0.72),rgba(11,18,24,0.4))]">
                <div className="rounded-[26px] border border-white/12 bg-black/30 px-5 py-4 text-center text-white backdrop-blur-sm">
                  <LoaderCircle className="mx-auto size-6 animate-spin" />
                  <p className="mt-3 text-sm font-semibold">룰렛 앱을 준비하는 중입니다.</p>
                </div>
              </div>
            ) : null}

            <iframe
              key={frameKey}
              src={EMBEDDED_ROULETTE_URL}
              title="lazygyu Marble Roulette"
              className="block h-[980px] w-full border-0 bg-[#0b1218]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(236,244,255,0.96),rgba(255,249,240,0.9))] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4e6d96]">Auto Hall Of Fame</p>
            <p className="mt-3 text-sm leading-6 text-[#576a77]">
              룰렛 내부에서 `Start`를 누르면 원본 게임 로직이 그대로 실행되고, 결승선 통과 시점의 당첨자를 즉시
              받아 저장합니다.
            </p>

            <div
              className={cn(
                "mt-5 rounded-[24px] border px-4 py-4",
                saveState === "saved"
                  ? "border-[#c9e2d0] bg-white/82"
                  : saveState === "error"
                    ? "border-[#f0cfcf] bg-[#fff7f7]"
                    : "border-[#d7e3f2] bg-white/76",
              )}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#587089]">
                <Sparkles className="size-4" />
                {saveState === "saved"
                  ? "Saved"
                  : saveState === "error"
                    ? "Save Failed"
                    : saveState === "saving"
                      ? "Saving"
                      : frameStatus === "ready"
                        ? "Ready"
                        : "Loading"}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5d6d78]">
                {saveState === "saved"
                  ? "당첨 결과가 명예의 전당과 최근 기록에 자동 반영되었습니다."
                  : saveState === "error"
                    ? saveError
                    : saveState === "saving"
                      ? "당첨 결과를 저장하는 중입니다."
                      : frameStatus === "ready"
                        ? "이제 iframe 안에서 이름을 입력하고 룰렛을 시작하면 됩니다."
                        : "원본 룰렛 앱 초기화를 기다리는 중입니다."}
              </p>

              {saveState === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRetrySave()}
                  className="mt-4 h-10 rounded-full border-[#e3c9c9] bg-white px-4 text-[#8f4a4a]"
                >
                  자동 저장 다시 시도
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-black/8 bg-white/84 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8190]">Latest Result</p>
            <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#18232d]">
              {latestResult?.winner ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#5f707b]">
              {latestResult
                ? `${latestResult.totalCount}개 구슬 중 ${latestResult.winningRank}등 결과를 기록했습니다.`
                : "최근 당첨자가 나오면 여기서 이름과 저장 상태를 바로 확인할 수 있습니다."}
            </p>
            {latestResult ? (
              <div className="mt-4 rounded-[22px] border border-[#dce6f2] bg-[#f7fbff] px-4 py-4 text-sm leading-6 text-[#506673]">
                {latestResult.detail}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-black/8 bg-white/84 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8190]">License</p>
            <p className="mt-3 text-sm leading-6 text-[#5f707b]">
              이 룰렛은 MIT 라이선스의 lazygyu/roulette 소스를 내장한 것입니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-full border-[#d8e4eb] bg-white px-4 text-[#355264]"
              >
                <a href={SOURCE_REPOSITORY_URL} target="_blank" rel="noreferrer">
                  원본 저장소
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-full border-[#d8e4eb] bg-white px-4 text-[#355264]"
              >
                <a href={LICENSE_URL} target="_blank" rel="noreferrer">
                  MIT 라이선스
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
