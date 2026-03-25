"use client"

import { useEffect, useState } from "react"

import { MarkdownSupportNote } from "@/components/common/markdown-support-note"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAccessToken } from "@/lib/auth"
import {
  createClubProgram,
  updateClubProgram,
  type ClubProgramItem,
  type ClubProgramWritePayload,
} from "@/lib/content-api"

type ClubProgramEditorDialogProps = {
  open: boolean
  mode: "create" | "edit"
  program?: ClubProgramItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (program: ClubProgramItem) => void
}

type FormState = {
  title: string
  description: string
  sortOrder: string
}

const emptyFormState: FormState = {
  title: "",
  description: "",
  sortOrder: "0",
}

export function ClubProgramEditorDialog({
  open,
  mode,
  program,
  onOpenChange,
  onSaved,
}: ClubProgramEditorDialogProps) {
  const [form, setForm] = useState<FormState>(emptyFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === "edit" && program) {
      setForm({
        title: program.title,
        description: program.description,
        sortOrder: String(program.sortOrder),
      })
    } else {
      setForm(emptyFormState)
    }

    setError("")
  }, [open, mode, program])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    const payload: ClubProgramWritePayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder || 0),
    }

    setSubmitting(true)
    setError("")

    try {
      const saved =
        mode === "edit" && program
          ? await updateClubProgram(program.id, payload, token)
          : await createClubProgram(payload, token)

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "정규 활동 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[760px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">
              {mode === "edit" ? "정규 활동 수정" : "정규 활동 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              동아리 메인 페이지에 노출할 정규 활동 카드 정보를 입력합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">활동 제목</span>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">활동 설명</span>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[130px]"
              />
              <MarkdownSupportNote />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">정렬 순서</span>
              <Input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
              />
            </label>
          </div>

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-[#1f2730] px-5 text-white hover:bg-[#2c3743]"
            >
              {submitting ? "저장 중..." : mode === "edit" ? "수정 저장" : "추가하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
