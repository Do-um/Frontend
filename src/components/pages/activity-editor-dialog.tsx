"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ImageDropzoneField } from "@/components/image-dropzone-field"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAccessToken } from "@/lib/auth"
import {
  createActivity,
  updateActivity,
  type ActivityItem,
  type ActivityType,
  type ActivityWritePayload,
  uploadImageFiles,
} from "@/lib/content-api"
import {
  createAssetsFromFiles,
  createAssetsFromUrls,
  revokeAsset,
  revokeAssets,
  type LocalImageAsset,
} from "@/lib/image-assets"

type ActivityEditorDialogProps = {
  open: boolean
  mode: "create" | "edit"
  activity?: ActivityItem | null
  activityType?: ActivityType
  onOpenChange: (open: boolean) => void
  onSaved: (activity: ActivityItem) => void
}

type ActivityFormState = {
  activityId: string
  description: string
  startDate: string
  endDate: string
  location: string
  participantNames: string
}

const emptyFormState: ActivityFormState = {
  activityId: "",
  description: "",
  startDate: "",
  endDate: "",
  location: "",
  participantNames: "",
}

function toParticipantNames(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDateInputValue(value: string | null | undefined, boundary: "start" | "end") {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ""
  }

  if (/^\d{4}$/.test(trimmed)) {
    return boundary === "start" ? `${trimmed}-01-01` : `${trimmed}-12-31`
  }

  const normalized = trimmed.replace(/\./g, "-").replace(/\//g, "-")
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

  if (isoDatePattern.test(normalized)) {
    return normalized
  }

  const dateTimePrefix = normalized.slice(0, 10)
  if (isoDatePattern.test(dateTimePrefix)) {
    return dateTimePrefix
  }

  return ""
}

function toDateRangeFormState(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return {
      startDate: "",
      endDate: "",
    }
  }

  const parts = trimmed.split("~").map((part) => part.trim()).filter(Boolean)

  if (parts.length >= 2) {
    return {
      startDate: toDateInputValue(parts[0], "start"),
      endDate: toDateInputValue(parts[1], "end"),
    }
  }

  const singleDate = toDateInputValue(trimmed, "start")

  return {
    startDate: singleDate,
    endDate: singleDate,
  }
}

function buildActivityDateValue(startDate: string, endDate: string) {
  const normalizedStart = startDate.trim()
  const normalizedEnd = endDate.trim()

  if (normalizedStart && normalizedEnd) {
    if (normalizedStart === normalizedEnd) {
      return normalizedStart
    }

    return `${normalizedStart} ~ ${normalizedEnd}`
  }

  return normalizedStart || normalizedEnd || null
}

export function ActivityEditorDialog({
  open,
  mode,
  activity,
  activityType = "MAIN",
  onOpenChange,
  onSaved,
}: ActivityEditorDialogProps) {
  const [form, setForm] = useState<ActivityFormState>(emptyFormState)
  const [imageAssets, setImageAssets] = useState<LocalImageAsset[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const imageAssetsRef = useRef<LocalImageAsset[]>([])

  useEffect(() => {
    imageAssetsRef.current = imageAssets
  }, [imageAssets])

  useEffect(() => {
    return () => {
      revokeAssets(imageAssetsRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      revokeAssets(imageAssetsRef.current)
      setForm(emptyFormState)
      setImageAssets([])
      setError("")
      return
    }

    if (mode === "edit" && activity) {
      revokeAssets(imageAssetsRef.current)
      const { startDate, endDate } = toDateRangeFormState(activity.activityDate)

      setForm({
        activityId: activity.activityId,
        description: activity.description,
        startDate,
        endDate,
        location: activity.location ?? "",
        participantNames: activity.participantNames.join("\n"),
      })
      setImageAssets(createAssetsFromUrls(activity.activityImages))
      setError("")
      return
    }

    revokeAssets(imageAssetsRef.current)
    setForm(emptyFormState)
    setImageAssets([])
    setError("")
  }, [open, mode, activity])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    const payload: ActivityWritePayload = {
      activityId: form.activityId.trim(),
      activityType: activity?.activityType ?? activityType,
      description: form.description.trim(),
      activityDate: buildActivityDateValue(form.startDate, form.endDate),
      location: form.location.trim() || null,
      participantNames: toParticipantNames(form.participantNames),
      participantCount: null,
      activityImages: [],
    }

    setSubmitting(true)
    setError("")

    try {
      const newFiles = imageAssets.filter((asset) => asset.file).map((asset) => asset.file as File)
      const uploadedUrls = newFiles.length ? await uploadImageFiles(newFiles, token) : []
      let uploadedIndex = 0

      payload.activityImages = imageAssets.map((asset) => {
        if (asset.persistedUrl) {
          return asset.persistedUrl
        }

        const nextUrl = uploadedUrls[uploadedIndex]
        uploadedIndex += 1
        return nextUrl
      }).filter((url): url is string => Boolean(url))

      const saved =
        mode === "edit" && activity
          ? await updateActivity(activity.id, payload, token)
          : await createActivity(payload, token)

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "활동 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[820px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">
              {mode === "edit" ? "활동 수정" : "활동 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              활동 이름, 설명, 참여자 이름과 이미지를 입력하면 즉시 활동 페이지에 반영됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#243845]">기본 정보</h3>
                <p className="mt-1 text-xs leading-5 text-[#748690]">
                  카드 제목과 활동 메타데이터에 함께 반영되는 정보입니다. 날짜는 저장 후 `2024 ~ 2025` 형식으로 표시됩니다.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">활동명</span>
                  <Input
                    value={form.activityId}
                    onChange={(event) => setForm((current) => ({ ...current, activityId: event.target.value }))}
                    placeholder="2025-2 강북엔트리"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">시작일</span>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, startDate: event.target.value }))
                    }
                    placeholder="년도-월-일"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">종료일</span>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, endDate: event.target.value }))
                    }
                    placeholder="년도-월-일"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#243845]">활동 장소</span>
                  <Input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder="국민대학교 미래관"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#243845]">스토리 내용</h3>
                <p className="mt-1 text-xs leading-5 text-[#748690]">
                  홈의 히스토리 카드와 활동 상세 화면에 표시되는 설명과 참여자 정보를 수정합니다.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">활동 설명</span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="min-h-[160px]"
                    placeholder="활동의 목적, 진행 방식, 현장 분위기를 설명해 주세요."
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-[#243845]">참여자 이름</span>
                  <Textarea
                    value={form.participantNames}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, participantNames: event.target.value }))
                    }
                    className="min-h-[132px]"
                    placeholder={"한 줄에 한 명씩 입력하세요.\n홍길동\n김국민"}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-[24px] border border-[#dbe7ea] bg-white/80 p-4 shadow-[0_12px_30px_rgba(47,74,91,0.05)] sm:p-5">
              <ImageDropzoneField
                label="활동 이미지"
                description="히스토리 카드와 상세 화면에 보일 이미지를 추가하세요. 미리보기를 작게 정리해 두어 빠르게 검토할 수 있습니다."
                items={imageAssets}
                compact
                onFilesSelected={(files) => {
                  setImageAssets((current) => [...current, ...createAssetsFromFiles(files)])
                }}
                onRemove={(id) => {
                  setImageAssets((current) => {
                    const target = current.find((item) => item.id === id)
                    if (target) {
                      revokeAsset(target)
                    }
                    return current.filter((item) => item.id !== id)
                  })
                }}
              />
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
              {submitting ? "저장 중..." : mode === "edit" ? "수정 저장" : "추가하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
