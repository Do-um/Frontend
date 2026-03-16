"use client"

import { useEffect, useState } from "react"
import { PencilLine, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAccessToken } from "@/lib/auth"
import {
  type RecruitContent,
  type RecruitContentWritePayload,
  updateRecruitContent,
} from "@/lib/content-api"

type RecruitContentEditorDialogProps = {
  open: boolean
  content?: RecruitContent | null
  onOpenChange: (open: boolean) => void
  onSaved: (content: RecruitContent) => void
}

type FormState = RecruitContentWritePayload

const emptyFormState: FormState = {
  overviewTitle: "",
  overviewDescription: "",
  applicationPeriodTitle: "",
  applicationStart: "",
  applicationEnd: "",
  interviewPeriodTitle: "",
  interviewStart: "",
  interviewEnd: "",
  targetSectionTitle: "",
  targetSectionDescription: "",
  targetItems: [""],
  ctaTitle: "",
  ctaButtonLabel: "",
  applyUrl: "",
}

function normalizeTargetItems(items: string[]) {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  return normalized.length ? normalized : [""]
}

export function RecruitContentEditorDialog({
  open,
  content,
  onOpenChange,
  onSaved,
}: RecruitContentEditorDialogProps) {
  const [form, setForm] = useState<FormState>(emptyFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setForm(emptyFormState)
      setError("")
      return
    }

    if (content) {
      setForm({
        overviewTitle: content.overviewTitle,
        overviewDescription: content.overviewDescription,
        applicationPeriodTitle: content.applicationPeriodTitle,
        applicationStart: content.applicationStart,
        applicationEnd: content.applicationEnd,
        interviewPeriodTitle: content.interviewPeriodTitle,
        interviewStart: content.interviewStart,
        interviewEnd: content.interviewEnd,
        targetSectionTitle: content.targetSectionTitle,
        targetSectionDescription: content.targetSectionDescription,
        targetItems: content.targetItems.length ? content.targetItems : [""],
        ctaTitle: content.ctaTitle,
        ctaButtonLabel: content.ctaButtonLabel,
        applyUrl: content.applyUrl,
      })
    } else {
      setForm(emptyFormState)
    }

    setError("")
  }, [open, content])

  function updateTargetItem(index: number, value: string) {
    setForm((current) => ({
      ...current,
      targetItems: current.targetItems.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
  }

  function addTargetItem() {
    setForm((current) => ({
      ...current,
      targetItems: [...current.targetItems, ""],
    }))
  }

  function removeTargetItem(index: number) {
    setForm((current) => {
      const nextItems = current.targetItems.filter((_, itemIndex) => itemIndex !== index)
      return {
        ...current,
        targetItems: nextItems.length ? nextItems : [""],
      }
    })
  }

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    const normalizedTargetItems = normalizeTargetItems(form.targetItems)
    if (!normalizedTargetItems[0]) {
      setError("모집 대상 항목을 최소 1개 이상 입력해 주세요.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const saved = await updateRecruitContent(
        {
          overviewTitle: form.overviewTitle.trim(),
          overviewDescription: form.overviewDescription.trim(),
          applicationPeriodTitle: form.applicationPeriodTitle.trim(),
          applicationStart: form.applicationStart.trim(),
          applicationEnd: form.applicationEnd.trim(),
          interviewPeriodTitle: form.interviewPeriodTitle.trim(),
          interviewStart: form.interviewStart.trim(),
          interviewEnd: form.interviewEnd.trim(),
          targetSectionTitle: form.targetSectionTitle.trim(),
          targetSectionDescription: form.targetSectionDescription.trim(),
          targetItems: normalizedTargetItems,
          ctaTitle: form.ctaTitle.trim(),
          ctaButtonLabel: form.ctaButtonLabel.trim(),
          applyUrl: form.applyUrl.trim(),
        },
        token,
      )

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "모집 페이지 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[920px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">모집 페이지 수정</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              모집 문구와 지원 버튼 문구, 지원하기 링크를 한 화면에서 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#243845]">모집 개요</h3>
                <p className="mt-1 text-xs leading-5 text-[#748690]">
                  상단 개요 제목과 설명, 지원/면접 일정 카드 문구를 관리합니다.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">개요 제목</span>
                  <Input
                    value={form.overviewTitle}
                    onChange={(event) => setForm((current) => ({ ...current, overviewTitle: event.target.value }))}
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">개요 설명</span>
                  <Textarea
                    value={form.overviewDescription}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, overviewDescription: event.target.value }))
                    }
                    className="min-h-[110px]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">지원 카드 제목</span>
                  <Input
                    value={form.applicationPeriodTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, applicationPeriodTitle: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">면접 카드 제목</span>
                  <Input
                    value={form.interviewPeriodTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewPeriodTitle: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">지원 시작 문구</span>
                  <Input
                    value={form.applicationStart}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, applicationStart: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">지원 종료 문구</span>
                  <Input
                    value={form.applicationEnd}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, applicationEnd: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">면접 시작 문구</span>
                  <Input
                    value={form.interviewStart}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewStart: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">면접 종료 문구</span>
                  <Input
                    value={form.interviewEnd}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewEnd: event.target.value }))
                    }
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#243845]">모집 대상</h3>
                <p className="mt-1 text-xs leading-5 text-[#748690]">
                  섹션 제목, 안내 문구, 체크 리스트 항목을 원하는 만큼 수정할 수 있습니다.
                </p>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">섹션 제목</span>
                  <Input
                    value={form.targetSectionTitle}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, targetSectionTitle: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">섹션 설명</span>
                  <Textarea
                    value={form.targetSectionDescription}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, targetSectionDescription: event.target.value }))
                    }
                    className="min-h-[96px]"
                  />
                </label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-[#243845]">대상 항목</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTargetItem}
                      className="rounded-full border-[#d7e5ee] bg-white px-4 text-[#355264] hover:bg-[#f5fbfe]"
                    >
                      <Plus className="size-4" />
                      항목 추가
                    </Button>
                  </div>

                  {form.targetItems.map((item, index) => (
                    <div key={`${index}-${item}`} className="flex items-center gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f3fb] text-[#4f7891]">
                        <PencilLine className="size-4" />
                      </div>
                      <Input
                        value={item}
                        onChange={(event) => updateTargetItem(index, event.target.value)}
                        placeholder="예: SW 교육에 관심이 있으신 분"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeTargetItem(index)}
                        disabled={form.targetItems.length === 1}
                        className="rounded-full text-[#355264] hover:bg-[#eef4f7]"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#243845]">지원 CTA</h3>
                <p className="mt-1 text-xs leading-5 text-[#748690]">
                  하단 지원 문구와 버튼 텍스트, 클릭 시 이동할 주소를 설정합니다.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">CTA 제목</span>
                  <Input
                    value={form.ctaTitle}
                    onChange={(event) => setForm((current) => ({ ...current, ctaTitle: event.target.value }))}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">버튼 문구</span>
                  <Input
                    value={form.ctaButtonLabel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ctaButtonLabel: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">지원 링크</span>
                  <Input
                    value={form.applyUrl}
                    onChange={(event) => setForm((current) => ({ ...current, applyUrl: event.target.value }))}
                    placeholder="https://forms.gle/..."
                  />
                </label>
              </div>
            </section>
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
              {submitting ? "저장 중..." : "수정 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
