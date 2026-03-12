"use client"

import { useEffect, useRef, useState } from "react"

import { ImageDropzoneField } from "@/components/image-dropzone-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getStoredAccessToken } from "@/lib/auth"
import { type ClubContent, type ClubContentWritePayload, updateClubContent, uploadImageFiles } from "@/lib/content-api"
import {
  createAssetsFromFiles,
  createAssetsFromUrls,
  revokeAsset,
  revokeAssets,
  type LocalImageAsset,
} from "@/lib/image-assets"

type ClubContentEditorDialogProps = {
  open: boolean
  content?: ClubContent | null
  onOpenChange: (open: boolean) => void
  onSaved: (content: ClubContent) => void
}

type FormState = ClubContentWritePayload

const emptyFormState: FormState = {
  introTitle: "",
  introLead: "",
  introDescription: "",
  heroBannerImageUrl: "/hero-banner.png",
  activitySectionTitle: "",
  historySectionTitle: "",
  studyCaption: "",
  studyTitle: "",
  learnTitle: "",
  learnDescription: "",
  growTitle: "",
  growDescription: "",
  shareTitle: "",
  shareDescription: "",
  studyImageUrl: "/skill.png",
}

export function ClubContentEditorDialog({
  open,
  content,
  onOpenChange,
  onSaved,
}: ClubContentEditorDialogProps) {
  const [form, setForm] = useState<FormState>(emptyFormState)
  const [heroBannerAssets, setHeroBannerAssets] = useState<LocalImageAsset[]>([])
  const [studyImageAssets, setStudyImageAssets] = useState<LocalImageAsset[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const heroBannerAssetsRef = useRef<LocalImageAsset[]>([])
  const studyImageAssetsRef = useRef<LocalImageAsset[]>([])

  useEffect(() => {
    heroBannerAssetsRef.current = heroBannerAssets
  }, [heroBannerAssets])

  useEffect(() => {
    studyImageAssetsRef.current = studyImageAssets
  }, [studyImageAssets])

  useEffect(() => {
    return () => {
      revokeAssets(heroBannerAssetsRef.current)
      revokeAssets(studyImageAssetsRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      revokeAssets(heroBannerAssetsRef.current)
      revokeAssets(studyImageAssetsRef.current)
      setForm(emptyFormState)
      setHeroBannerAssets([])
      setStudyImageAssets([])
      setError("")
      return
    }

    if (content) {
      revokeAssets(heroBannerAssetsRef.current)
      revokeAssets(studyImageAssetsRef.current)
      setForm({
        introTitle: content.introTitle,
        introLead: content.introLead,
        introDescription: content.introDescription,
        heroBannerImageUrl: content.heroBannerImageUrl,
        activitySectionTitle: content.activitySectionTitle,
        historySectionTitle: content.historySectionTitle,
        studyCaption: content.studyCaption,
        studyTitle: content.studyTitle,
        learnTitle: content.learnTitle,
        learnDescription: content.learnDescription,
        growTitle: content.growTitle,
        growDescription: content.growDescription,
        shareTitle: content.shareTitle,
        shareDescription: content.shareDescription,
        studyImageUrl: content.studyImageUrl,
      })
      setHeroBannerAssets(
        content.heroBannerImageUrl ? createAssetsFromUrls([content.heroBannerImageUrl]) : []
      )
      setStudyImageAssets(content.studyImageUrl ? createAssetsFromUrls([content.studyImageUrl]) : [])
    } else {
      revokeAssets(heroBannerAssetsRef.current)
      revokeAssets(studyImageAssetsRef.current)
      setForm(emptyFormState)
      setHeroBannerAssets([])
      setStudyImageAssets([])
    }

    setError("")
  }, [open, content])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const heroBannerFile = heroBannerAssets.find((asset) => asset.file)?.file ?? null
      const uploadedHeroBannerUrls = heroBannerFile ? await uploadImageFiles([heroBannerFile], token) : []
      const studyImageFile = studyImageAssets.find((asset) => asset.file)?.file ?? null
      const uploadedStudyImageUrls = studyImageFile ? await uploadImageFiles([studyImageFile], token) : []

      const saved = await updateClubContent(
        {
          introTitle: form.introTitle.trim(),
          introLead: form.introLead.trim(),
          introDescription: form.introDescription.trim(),
          heroBannerImageUrl:
            heroBannerAssets.find((asset) => asset.persistedUrl)?.persistedUrl ||
            uploadedHeroBannerUrls[0] ||
            "/hero-banner.png",
          activitySectionTitle: form.activitySectionTitle.trim(),
          historySectionTitle: form.historySectionTitle.trim(),
          studyCaption: form.studyCaption.trim(),
          studyTitle: form.studyTitle.trim(),
          learnTitle: form.learnTitle.trim(),
          learnDescription: form.learnDescription.trim(),
          growTitle: form.growTitle.trim(),
          growDescription: form.growDescription.trim(),
          shareTitle: form.shareTitle.trim(),
          shareDescription: form.shareDescription.trim(),
          studyImageUrl:
            studyImageAssets.find((asset) => asset.persistedUrl)?.persistedUrl ||
            uploadedStudyImageUrls[0] ||
            "/skill.png",
        },
        token,
      )

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "동아리 소개 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[920px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">동아리 소개 수정</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              소개 문구와 메인페이지 이미지, 정규 활동/히스토리/스터디 섹션 문구를 한 번에 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">소개 제목</span>
              <Input
                value={form.introTitle}
                onChange={(event) => setForm((current) => ({ ...current, introTitle: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">소개 리드 문구</span>
              <Input
                value={form.introLead}
                onChange={(event) => setForm((current) => ({ ...current, introLead: event.target.value }))}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">소개 설명</span>
              <Textarea
                value={form.introDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, introDescription: event.target.value }))
                }
                className="min-h-[120px]"
              />
            </label>

            <div className="sm:col-span-2">
              <ImageDropzoneField
                label="메인 배너 이미지"
                description="상단 랜딩 배너에 사용하는 이미지를 업로드합니다."
                items={heroBannerAssets}
                multiple={false}
                onFilesSelected={(files) => {
                  setHeroBannerAssets((current) => {
                    revokeAssets(current)
                    return createAssetsFromFiles(files.slice(0, 1))
                  })
                }}
                onRemove={(id) => {
                  setHeroBannerAssets((current) => {
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
              <span className="text-sm font-semibold text-[#243845]">정규 활동 섹션 제목</span>
              <Input
                value={form.activitySectionTitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, activitySectionTitle: event.target.value }))
                }
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">활동 히스토리 제목</span>
              <Input
                value={form.historySectionTitle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, historySectionTitle: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">스터디 상단 캡션</span>
              <Input
                value={form.studyCaption}
                onChange={(event) => setForm((current) => ({ ...current, studyCaption: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">스터디 메인 제목</span>
              <Input
                value={form.studyTitle}
                onChange={(event) => setForm((current) => ({ ...current, studyTitle: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Learn 제목</span>
              <Input
                value={form.learnTitle}
                onChange={(event) => setForm((current) => ({ ...current, learnTitle: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Learn 설명</span>
              <Input
                value={form.learnDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, learnDescription: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Grow 제목</span>
              <Input
                value={form.growTitle}
                onChange={(event) => setForm((current) => ({ ...current, growTitle: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Grow 설명</span>
              <Input
                value={form.growDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, growDescription: event.target.value }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Share 제목</span>
              <Input
                value={form.shareTitle}
                onChange={(event) => setForm((current) => ({ ...current, shareTitle: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Share 설명</span>
              <Input
                value={form.shareDescription}
                onChange={(event) =>
                  setForm((current) => ({ ...current, shareDescription: event.target.value }))
                }
              />
            </label>

            <div className="sm:col-span-2">
              <ImageDropzoneField
                label="스터디 섹션 이미지"
                description="하단 Learn / Grow / Share 섹션 오른쪽 이미지를 업로드합니다."
                items={studyImageAssets}
                multiple={false}
                onFilesSelected={(files) => {
                  setStudyImageAssets((current) => {
                    revokeAssets(current)
                    return createAssetsFromFiles(files.slice(0, 1))
                  })
                }}
                onRemove={(id) => {
                  setStudyImageAssets((current) => {
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
              {submitting ? "저장 중..." : "수정 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
