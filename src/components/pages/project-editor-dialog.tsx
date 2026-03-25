"use client"

import { useEffect, useRef, useState } from "react"

import { MarkdownSupportNote } from "@/components/common/markdown-support-note"
import { ImageDropzoneField } from "@/components/image-dropzone-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAccessToken } from "@/lib/auth"
import {
  createProject,
  updateProject,
  uploadImageFiles,
  type ProjectItem,
  type ProjectWritePayload,
} from "@/lib/content-api"
import {
  createAssetsFromFiles,
  createAssetsFromUrls,
  revokeAsset,
  revokeAssets,
  type LocalImageAsset,
} from "@/lib/image-assets"

type ProjectEditorDialogProps = {
  open: boolean
  mode: "create" | "edit"
  project?: ProjectItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (projectId: string) => void
}

type ProjectFormState = {
  title: string
  summary: string
  description: string
  tags: string
  teamName: string
  members: string
  periodStart: string
  periodEnd: string
  github: string
  demo: string
  notion: string
  isPinned: boolean
}

const emptyFormState: ProjectFormState = {
  title: "",
  summary: "",
  description: "",
  tags: "",
  teamName: "",
  members: "",
  periodStart: "",
  periodEnd: "",
  github: "",
  demo: "",
  notion: "",
  isPinned: false,
}

function splitByComma(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ProjectEditorDialog({
  open,
  mode,
  project,
  onOpenChange,
  onSaved,
}: ProjectEditorDialogProps) {
  const [form, setForm] = useState<ProjectFormState>(emptyFormState)
  const [thumbnailAssets, setThumbnailAssets] = useState<LocalImageAsset[]>([])
  const [detailImageAssets, setDetailImageAssets] = useState<LocalImageAsset[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const thumbnailAssetsRef = useRef<LocalImageAsset[]>([])
  const detailImageAssetsRef = useRef<LocalImageAsset[]>([])

  useEffect(() => {
    thumbnailAssetsRef.current = thumbnailAssets
  }, [thumbnailAssets])

  useEffect(() => {
    detailImageAssetsRef.current = detailImageAssets
  }, [detailImageAssets])

  useEffect(() => {
    return () => {
      revokeAssets(thumbnailAssetsRef.current)
      revokeAssets(detailImageAssetsRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      revokeAssets(thumbnailAssetsRef.current)
      revokeAssets(detailImageAssetsRef.current)
      setForm(emptyFormState)
      setThumbnailAssets([])
      setDetailImageAssets([])
      setError("")
      return
    }

    if (mode === "edit" && project) {
      revokeAssets(thumbnailAssetsRef.current)
      revokeAssets(detailImageAssetsRef.current)
      setForm({
        title: project.title,
        summary: project.summary,
        description: project.description,
        tags: project.tags.join(", "),
        teamName: project.teamName ?? "",
        members: project.members.join(", "),
        periodStart: project.period?.start ?? "",
        periodEnd: project.period?.end ?? "",
        github: project.links?.github ?? "",
        demo: project.links?.demo ?? "",
        notion: project.links?.notion ?? "",
        isPinned: project.pinned,
      })
      setThumbnailAssets(project.thumbnailUrl ? createAssetsFromUrls([project.thumbnailUrl]) : [])
      setDetailImageAssets(createAssetsFromUrls(project.images))
      setError("")
      return
    }

    revokeAssets(thumbnailAssetsRef.current)
    revokeAssets(detailImageAssetsRef.current)
    setForm(emptyFormState)
    setThumbnailAssets([])
    setDetailImageAssets([])
    setError("")
  }, [open, mode, project])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const thumbnailFile = thumbnailAssets.find((asset) => asset.file)?.file ?? null
      const uploadedThumbnailUrls = thumbnailFile ? await uploadImageFiles([thumbnailFile], token) : []
      const newDetailFiles = detailImageAssets.filter((asset) => asset.file).map((asset) => asset.file as File)
      const uploadedDetailUrls = newDetailFiles.length ? await uploadImageFiles(newDetailFiles, token) : []
      let detailImageIndex = 0

      const payload: ProjectWritePayload = {
        projectId: project?.projectId,
        title: form.title.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        thumbnailUrl:
          thumbnailAssets.find((asset) => asset.persistedUrl)?.persistedUrl ||
          uploadedThumbnailUrls[0] ||
          "",
        images: detailImageAssets
          .map((asset) => {
            if (asset.persistedUrl) {
              return asset.persistedUrl
            }

            const nextUrl = uploadedDetailUrls[detailImageIndex]
            detailImageIndex += 1
            return nextUrl
          })
          .filter((url): url is string => Boolean(url)),
        tags: splitByComma(form.tags),
        teamName: form.teamName.trim() || null,
        members: splitByComma(form.members),
        period:
          form.periodStart || form.periodEnd
            ? {
                start: form.periodStart || null,
                end: form.periodEnd || null,
              }
            : null,
        links:
          form.github || form.demo || form.notion
            ? {
                github: form.github.trim() || null,
                demo: form.demo.trim() || null,
                notion: form.notion.trim() || null,
              }
            : null,
        isPinned: form.isPinned,
      }

      const saved =
        mode === "edit" && project
          ? await updateProject(payload, token)
          : await createProject(payload, token)

      onSaved(saved.projectId)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로젝트 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[840px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">
              {mode === "edit" ? "프로젝트 수정" : "프로젝트 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              제목, 요약, 설명, 이미지, 태그, 팀원, 링크 정보를 입력하면 프로젝트 페이지에 바로 반영됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">프로젝트 제목</span>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Activity Archive"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">프로젝트 요약</span>
              <Textarea
                value={form.summary}
                onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                className="min-h-[100px]"
                placeholder="한 줄 요약"
              />
              <MarkdownSupportNote />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">프로젝트 설명</span>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[160px]"
                placeholder="프로젝트 배경, 기능, 결과를 적어 주세요."
              />
              <MarkdownSupportNote />
            </label>

            <div className="sm:col-span-2">
              <ImageDropzoneField
                label="대표 썸네일"
                description="대표 이미지는 한 장만 선택할 수 있습니다. 드래그앤드랍이나 파일 선택 후 저장 전에 미리보기를 확인하세요."
                items={thumbnailAssets}
                multiple={false}
                onFilesSelected={(files) => {
                  setThumbnailAssets((current) => {
                    revokeAssets(current)
                    return createAssetsFromFiles(files.slice(0, 1))
                  })
                }}
                onRemove={(id) => {
                  setThumbnailAssets((current) => {
                    const target = current.find((item) => item.id === id)
                    if (target) {
                      revokeAsset(target)
                    }
                    return current.filter((item) => item.id !== id)
                  })
                }}
              />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">태그</span>
              <Input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="frontend, archive, volunteer"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">팀명</span>
              <Input
                value={form.teamName}
                onChange={(event) => setForm((current) => ({ ...current, teamName: event.target.value }))}
                placeholder="DO,UM WEB"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">시작일</span>
              <Input
                type="date"
                value={form.periodStart}
                onChange={(event) => setForm((current) => ({ ...current, periodStart: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">종료일</span>
              <Input
                type="date"
                value={form.periodEnd}
                onChange={(event) => setForm((current) => ({ ...current, periodEnd: event.target.value }))}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">팀원</span>
              <Input
                value={form.members}
                onChange={(event) => setForm((current) => ({ ...current, members: event.target.value }))}
                placeholder="김도움, 신민철, 홍길동"
              />
            </label>

            <div className="sm:col-span-2">
              <ImageDropzoneField
                label="상세 이미지"
                description="프로젝트 소개에 사용할 이미지를 여러 장 추가할 수 있습니다."
                items={detailImageAssets}
                onFilesSelected={(files) => {
                  setDetailImageAssets((current) => [...current, ...createAssetsFromFiles(files)])
                }}
                onRemove={(id) => {
                  setDetailImageAssets((current) => {
                    const target = current.find((item) => item.id === id)
                    if (target) {
                      revokeAsset(target)
                    }
                    return current.filter((item) => item.id !== id)
                  })
                }}
              />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">GitHub 링크</span>
              <Input
                value={form.github}
                onChange={(event) => setForm((current) => ({ ...current, github: event.target.value }))}
                placeholder="https://github.com/..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">데모 링크</span>
              <Input
                value={form.demo}
                onChange={(event) => setForm((current) => ({ ...current, demo: event.target.value }))}
                placeholder="https://example.com"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">Notion 링크</span>
              <Input
                value={form.notion}
                onChange={(event) => setForm((current) => ({ ...current, notion: event.target.value }))}
                placeholder="https://www.notion.so/..."
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-[#d7e5ea] bg-white px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))}
                className="h-4 w-4 accent-[#1f2730]"
              />
              <span className="text-sm font-semibold text-[#243845]">상단 고정 프로젝트로 표시</span>
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
