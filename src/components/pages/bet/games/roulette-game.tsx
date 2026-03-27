"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, ExternalLink, LoaderCircle, Maximize2, Minimize2, RefreshCw, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { BET_PANEL_CLASS, BET_TINTED_PANEL_CLASS, ScreenHeader } from "../common-ui"

const EMBEDDED_ROULETTE_URL = "/vendor/roulette/index.html?embed=1&v=20260327-3"
const SOURCE_REPOSITORY_URL = "https://github.com/lazygyu/roulette"
const LICENSE_URL = "/vendor/roulette/LICENSE.txt"
const FRAME_READY_TIMEOUT_MS = 15000
const FRAME_READY_POLL_MS = 250

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

type RouletteErrorMessage = {
  type: "lazygyu-roulette-error"
  source: "lazygyu-roulette"
  message: string
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

function isRouletteErrorMessage(value: unknown): value is RouletteErrorMessage {
  return (
    isObject(value) &&
    value.type === "lazygyu-roulette-error" &&
    value.source === "lazygyu-roulette" &&
    typeof value.message === "string"
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
  const [frameStatus, setFrameStatus] = useState<"loading" | "ready" | "error">("loading")
  const [frameError, setFrameError] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")
  const [latestResult, setLatestResult] = useState<RouletteGoalMessage | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const lastPayloadRef = useRef<AutoRecordPayload | null>(null)
  const handledEventIdsRef = useRef<Set<string>>(new Set())
  const frameCheckIntervalRef = useRef<number | null>(null)
  const frameCheckTimeoutRef = useRef<number | null>(null)

  function clearFrameCheckTimers() {
    if (frameCheckIntervalRef.current !== null) {
      window.clearInterval(frameCheckIntervalRef.current)
      frameCheckIntervalRef.current = null
    }

    if (frameCheckTimeoutRef.current !== null) {
      window.clearTimeout(frameCheckTimeoutRef.current)
      frameCheckTimeoutRef.current = null
    }
  }

  useEffect(() => {
    if (!isExpanded) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isExpanded])

  useEffect(() => {
    function handleMessage(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin) {
        return
      }

      if (isRouletteReadyMessage(event.data)) {
        clearFrameCheckTimers()
        setFrameError("")
        setFrameStatus("ready")
        return
      }

      if (isRouletteErrorMessage(event.data)) {
        clearFrameCheckTimers()
        setFrameError(event.data.message)
        setFrameStatus("error")
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
      clearFrameCheckTimers()
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
    clearFrameCheckTimers()
    setFrameKey((current) => current + 1)
    setFrameStatus("loading")
    setFrameError("")
  }

  function handleFrameLoad() {
    clearFrameCheckTimers()
    setFrameStatus("loading")
    setFrameError("")

    frameCheckIntervalRef.current = window.setInterval(() => {
      try {
        const frameWindow = frameRef.current?.contentWindow as
          | (Window & { roulette?: { isReady?: boolean } })
          | null
          | undefined
        const hasCanvas = Boolean(frameRef.current?.contentDocument?.querySelector("canvas"))
        const isRouletteReady = Boolean(frameWindow?.roulette?.isReady)

        if (hasCanvas || isRouletteReady) {
          clearFrameCheckTimers()
          setFrameStatus("ready")
          setFrameError("")
        }
      } catch {
        // Ignore transient iframe access errors while the document is still navigating.
      }
    }, FRAME_READY_POLL_MS)

    frameCheckTimeoutRef.current = window.setTimeout(() => {
      clearFrameCheckTimers()

      try {
        const bodyText = frameRef.current?.contentDocument?.body?.innerText?.trim()
        const fallbackMessage =
          bodyText && bodyText.length > 0
            ? `룰렛 iframe은 열렸지만 캔버스가 뜨지 않았습니다. iframe 문서 상태: ${bodyText.slice(0, 120)}`
            : "룰렛 엔진 캔버스가 초기화되지 않았습니다. 브라우저 캐시가 이전 응답을 잡고 있거나 벤더 앱 런타임 오류가 남아 있을 수 있습니다."

        setFrameError(fallbackMessage)
      } catch {
        setFrameError("룰렛 iframe 상태를 읽지 못했습니다. 브라우저가 이전 차단 페이지를 캐시했을 가능성이 있습니다.")
      }

      setFrameStatus("error")
    }, FRAME_READY_TIMEOUT_MS)
  }

  return (
    <div className="space-y-6">
      <ScreenHeader
        title="룰렛"
        description="lazygyu/roulette 원본 앱을 프로젝트 안에 내장했고, 당첨 결과는 same-origin 메시지로 받아 명예의 전당에 자동 저장합니다."
        onBackHome={onBackHome}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className={cn(isExpanded ? "fixed inset-0 z-[90] p-3 sm:p-6" : "")}>
          {isExpanded ? (
            <button
              type="button"
              aria-label="룰렛 확대 보기 닫기"
              onClick={() => setIsExpanded(false)}
              className="absolute inset-0 bg-[#1f2730]/42 backdrop-blur-[2px]"
            />
          ) : null}

          <div
            className={cn(
              `${BET_PANEL_CLASS} overflow-hidden`,
              isExpanded
                ? "relative z-[1] flex h-full w-full flex-col rounded-[32px] border-white/75 shadow-[0_32px_90px_rgba(24,39,54,0.24)]"
                : "",
            )}
          >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7e5ee] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(234,243,248,0.84))] px-5 py-4 text-[#1f2730]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Embedded Vendor App</p>
              <p className="mt-2 text-lg font-black tracking-tight">lazygyu Marble Roulette</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded((current) => !current)}
                className="h-10 rounded-full border-[#d7e5ee] bg-white/82 px-4 text-[#355264] hover:bg-[#f5fbfe]"
              >
                {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                {isExpanded ? "축소" : "확대 보기"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReloadFrame}
                className="h-10 rounded-full border-[#d7e5ee] bg-white/82 px-4 text-[#355264] hover:bg-[#f5fbfe]"
              >
                <RefreshCw className="size-4" />
                다시 불러오기
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-full border-[#d7e5ee] bg-white/82 px-4 text-[#355264] hover:bg-[#f5fbfe]"
              >
                <a href={EMBEDDED_ROULETTE_URL} target="_blank" rel="noreferrer">
                  새 탭
                  <ExternalLink className="size-4" />
                </a>
              </Button>
              {isExpanded ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                  className="h-10 rounded-full border-[#d7e5ee] bg-white/82 px-4 text-[#355264] hover:bg-[#f5fbfe]"
                >
                  <X className="size-4" />
                  닫기
                </Button>
              ) : null}
            </div>
          </div>

          <div className={cn("relative bg-[#edf3f6]", isExpanded ? "flex-1" : "")}>
            {frameStatus === "loading" || frameStatus === "error" ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[linear-gradient(180deg,rgba(237,243,246,0.82),rgba(237,243,246,0.56))]">
                <div className="rounded-[26px] border border-white/80 bg-white/82 px-5 py-4 text-center text-[#1f2730] shadow-[0_18px_40px_rgba(47,74,91,0.12)] backdrop-blur-sm">
                  {frameStatus === "error" ? (
                    <AlertTriangle className="mx-auto size-6 text-[#8a5750]" />
                  ) : (
                    <LoaderCircle className="mx-auto size-6 animate-spin text-[#567289]" />
                  )}
                  <p className="mt-3 text-sm font-semibold">
                    {frameStatus === "error" ? "룰렛 앱 로딩에 실패했습니다." : "룰렛 앱을 준비하는 중입니다."}
                  </p>
                  {frameStatus === "error" ? (
                    <p className="mt-2 max-w-[360px] text-sm leading-6 text-[#677680]">{frameError}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <iframe
              ref={frameRef}
              key={frameKey}
              src={EMBEDDED_ROULETTE_URL}
              title="lazygyu Marble Roulette"
              onLoad={handleFrameLoad}
              className={cn("block w-full border-0 bg-white", isExpanded ? "h-full min-h-[420px]" : "h-[980px]")}
            />
          </div>
        </div>
        </div>

        <div className="space-y-4">
          <div className={`${BET_TINTED_PANEL_CLASS} bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(233,242,247,0.86),rgba(244,247,240,0.84))] px-5 py-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Auto Hall Of Fame</p>
            <p className="mt-3 text-sm leading-6 text-[#576a77]">
              룰렛 내부에서 `Start`를 누르면 원본 게임 로직이 그대로 실행되고, 결승선 통과 시점의 당첨자를 즉시
              받아 저장합니다.
            </p>

            <div
              className={cn(
                "mt-5 rounded-[24px] border px-4 py-4",
                saveState === "saved"
                  ? "border-[#d5e4db] bg-white/84"
                  : saveState === "error"
                    ? "border-[#ead7d3] bg-white/84"
                    : "border-[#d7e5ee] bg-white/82",
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
                      : frameStatus === "error"
                        ? "Vendor Error"
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
                      : frameStatus === "error"
                        ? frameError
                      : frameStatus === "ready"
                        ? "이제 iframe 안에서 이름을 입력하고 룰렛을 시작하면 됩니다."
                        : "원본 룰렛 앱 초기화를 기다리는 중입니다."}
              </p>

              {saveState === "error" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRetrySave()}
                  className="mt-4 h-10 rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                >
                  자동 저장 다시 시도
                </Button>
              ) : null}
            </div>
          </div>

          <div className={`${BET_PANEL_CLASS} px-5 py-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">Latest Result</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-[#15212b]">
              {latestResult?.winner ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#60717d]">
              {latestResult
                ? `${latestResult.totalCount}개 구슬 중 ${latestResult.winningRank}등 결과를 기록했습니다.`
                : "최근 당첨자가 나오면 여기서 이름과 저장 상태를 바로 확인할 수 있습니다."}
            </p>
            {latestResult ? (
              <div className="mt-4 rounded-[22px] border border-[#dbe6eb] bg-white/82 px-4 py-4 text-sm leading-6 text-[#506673] shadow-[0_10px_24px_rgba(47,74,91,0.05)]">
                {latestResult.detail}
              </div>
            ) : null}
          </div>

          <div className={`${BET_PANEL_CLASS} px-5 py-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b8f99]">License</p>
            <p className="mt-3 text-sm leading-6 text-[#60717d]">
              이 룰렛은 MIT 라이선스의 lazygyu/roulette 소스를 내장한 것입니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-10 rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
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
                className="h-10 rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
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
