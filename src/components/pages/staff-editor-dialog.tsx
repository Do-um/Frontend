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
  createStaff,
  updateStaff,
  uploadImageFiles,
  type StaffItem,
  type StaffWritePayload,
} from "@/lib/content-api"
import {
  createAssetsFromFiles,
  createAssetsFromUrls,
  revokeAsset,
  revokeAssets,
  type LocalImageAsset,
} from "@/lib/image-assets"

type StaffEditorDialogProps = {
  open: boolean
  mode: "create" | "edit"
  staff?: StaffItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (staff: StaffItem) => void
}

type FormState = StaffWritePayload

const emptyFormState: FormState = {
  name: "",
  department: "",
  role: "",
  description: "",
  profileImage: "",
  githubUrl: "",
  instagramUrl: "",
}

export function StaffEditorDialog({
  open,
  mode,
  staff,
  onOpenChange,
  onSaved,
}: StaffEditorDialogProps) {
  const [form, setForm] = useState<FormState>(emptyFormState)
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

    if (mode === "edit" && staff) {
      revokeAssets(imageAssetsRef.current)
      setForm({
        name: staff.name,
        department: staff.department,
        role: staff.role,
        description: staff.description,
        profileImage: staff.profileImage || "",
        githubUrl: staff.githubUrl || "",
        instagramUrl: staff.instagramUrl || "",
      })
      setImageAssets(staff.profileImage ? createAssetsFromUrls([staff.profileImage]) : [])
    } else {
      revokeAssets(imageAssetsRef.current)
      setForm(emptyFormState)
      setImageAssets([])
    }

    setError("")
  }, [open, mode, staff])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const newFiles = imageAssets.filter((asset) => asset.file).map((asset) => asset.file as File)
      const uploadedUrls = newFiles.length ? await uploadImageFiles(newFiles, token) : []
      const nextProfileImage =
        imageAssets.find((asset) => asset.persistedUrl)?.persistedUrl ||
        uploadedUrls[0] ||
        form.profileImage.trim()

      const payload: StaffWritePayload = {
        name: form.name.trim(),
        department: form.department.trim(),
        role: form.role.trim(),
        description: form.description.trim(),
        profileImage: nextProfileImage,
        githubUrl: form.githubUrl?.trim() || null,
        instagramUrl: form.instagramUrl?.trim() || null,
      }

      const saved =
        mode === "edit" && staff
          ? await updateStaff(staff.staffId, payload, token)
          : await createStaff(payload, token)

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "운영진 저장 중 오류가 발생했습니다.")
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
              {mode === "edit" ? "운영진 수정" : "운영진 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              운영진 이름, 부서, 역할, 소개 문구, 프로필 이미지와 GitHub/Instagram 링크를 입력합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">이름</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">부서</span>
              <Input
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                placeholder="회장단 / 총무부 / 기획부 / 홍보부"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">역할</span>
              <Input
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                placeholder="회장"
              />
            </label>

            <div className="space-y-2">
              <ImageDropzoneField
                label="프로필 이미지"
                description="프로필 이미지를 드래그하거나 파일 선택으로 추가하세요."
                items={imageAssets}
                multiple={false}
                onFilesSelected={(files) => {
                  setImageAssets((current) => {
                    revokeAssets(current)
                    return createAssetsFromFiles(files.slice(0, 1))
                  })
                  setForm((current) => ({ ...current, profileImage: "" }))
                }}
                onRemove={(id) => {
                  setImageAssets((current) => {
                    const target = current.find((item) => item.id === id)
                    if (target) {
                      revokeAsset(target)
                    }
                    return current.filter((item) => item.id !== id)
                  })
                  setForm((current) => ({ ...current, profileImage: "" }))
                }}
              />
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">GitHub 링크</span>
              <Input
                value={form.githubUrl ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))}
                placeholder="https://github.com/username"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">Instagram 링크</span>
              <Input
                value={form.instagramUrl ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, instagramUrl: event.target.value }))
                }
                placeholder="https://instagram.com/username"
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">소개 문구</span>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-[130px]"
              />
              <MarkdownSupportNote />
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
