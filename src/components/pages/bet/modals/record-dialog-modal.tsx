"use client"

import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
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
import { CAUGHT_MODE_LABELS, sanitizeDisplayName, type CaughtMode } from "@/lib/bet-game"

import type { RecordDialogState, RecordDraft } from "../types"

export function RecordDialogModal({
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
