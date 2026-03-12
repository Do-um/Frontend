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
  onOpenChange: (open: boolean) => void
  onSaved: (activity: ActivityItem) => void
}

type ActivityFormState = {
  activityId: string
  description: string
  activityDate: string
  location: string
  participantNames: string
}

const emptyFormState: ActivityFormState = {
  activityId: "",
  description: "",
  activityDate: "",
  location: "",
  participantNames: "",
}

function toParticipantNames(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ActivityEditorDialog({
  open,
  mode,
  activity,
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
      setForm({
        activityId: activity.activityId,
        description: activity.description,
        activityDate: activity.activityDate ?? "",
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
      description: form.description.trim(),
      activityDate: form.activityDate || null,
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
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[760px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">
              {mode === "edit" ? "활동 수정" : "활동 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              활동 이름, 설명, 참여자 이름과 이미지를 입력하면 즉시 활동 페이지에 반영됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">활동명</span>
              <Input
                value={form.activityId}
                onChange={(event) => setForm((current) => ({ ...current, activityId: event.target.value }))}
                placeholder="2025-2 강북엔트리"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">활동 일자</span>
              <Input
                type="date"
                value={form.activityDate}
                onChange={(event) => setForm((current) => ({ ...current, activityDate: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">참여자 이름</span>
              <Textarea
                value={form.participantNames}
                onChange={(event) => setForm((current) => ({ ...current, participantNames: event.target.value }))}
                className="min-h-[122px]"
                placeholder={"한 줄에 한 명씩 입력하세요.\n홍길동\n김국민"}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">활동 장소</span>
              <Input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="국민대학교 미래관"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">활동 설명</span>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[140px]"
                placeholder="활동의 목적, 진행 방식, 현장 분위기를 설명해 주세요."
              />
            </label>

            <div className="sm:col-span-2">
              <ImageDropzoneField
                label="활동 이미지"
                description="이미지를 드래그해서 놓거나 파일 선택으로 추가하세요. 추가된 이미지는 저장 전에 미리보기로 확인할 수 있습니다."
                items={imageAssets}
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
            </div>
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
