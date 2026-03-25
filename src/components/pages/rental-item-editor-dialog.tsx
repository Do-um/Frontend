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
  createRentalItem,
  updateRentalItem,
  uploadImageFiles,
  type RentalItem,
} from "@/lib/content-api"
import {
  createAssetsFromFiles,
  createAssetsFromUrls,
  revokeAsset,
  revokeAssets,
  type LocalImageAsset,
} from "@/lib/image-assets"
import { resolveMediaUrl } from "@/lib/media"

type RentalItemEditorDialogProps = {
  open: boolean
  mode: "create" | "edit"
  item?: RentalItem | null
  onOpenChange: (open: boolean) => void
  onSaved: (item: RentalItem) => void
}

type FormState = {
  name: string
  category: string
  description: string
  itemImage: string
  totalQuantity: string
  maxRentalDays: string
  status: string
}

const emptyFormState: FormState = {
  name: "",
  category: "",
  description: "",
  itemImage: "",
  totalQuantity: "1",
  maxRentalDays: "7",
  status: "AVAILABLE",
}

const statusOptions = [
  { value: "AVAILABLE", label: "대여 가능" },
  { value: "UNAVAILABLE", label: "대여 불가" },
  { value: "MAINTENANCE", label: "점검중" },
]

export function RentalItemEditorDialog({
  open,
  mode,
  item,
  onOpenChange,
  onSaved,
}: RentalItemEditorDialogProps) {
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

    if (mode === "edit" && item) {
      revokeAssets(imageAssetsRef.current)
      setForm({
        name: item.name,
        category: item.category,
        description: item.description ?? "",
        itemImage: item.itemImage ?? "",
        totalQuantity: String(item.totalQuantity),
        maxRentalDays: String(item.maxRentalDays),
        status: item.status,
      })
      setImageAssets(item.itemImage ? createAssetsFromUrls([resolveMediaUrl(item.itemImage) ?? item.itemImage]) : [])
    } else {
      revokeAssets(imageAssetsRef.current)
      setForm(emptyFormState)
      setImageAssets([])
    }

    setError("")
  }, [item, mode, open])

  async function handleSubmit() {
    const token = getStoredAccessToken()
    if (!token) {
      setError("관리자 로그인이 필요합니다.")
      return
    }

    const totalQuantity = Number(form.totalQuantity)
    const maxRentalDays = Number(form.maxRentalDays)

    if (!Number.isFinite(totalQuantity) || totalQuantity < 0) {
      setError("총 수량은 0 이상이어야 합니다.")
      return
    }

    if (!Number.isFinite(maxRentalDays) || maxRentalDays <= 0) {
      setError("최대 대여 기간은 1일 이상이어야 합니다.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const newFiles = imageAssets.filter((asset) => asset.file).map((asset) => asset.file as File)
      const uploadedUrls = newFiles.length ? await uploadImageFiles(newFiles, token) : []
      const imageUrl =
        imageAssets.find((asset) => asset.persistedUrl)?.persistedUrl ||
        uploadedUrls[0] ||
        form.itemImage.trim()

      const basePayload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        itemImage: imageUrl,
        totalQuantity,
        maxRentalDays,
      }

      const saved =
        mode === "edit" && item
          ? await updateRentalItem(
              item.itemId,
              {
                ...basePayload,
                status: form.status,
              },
              token,
            )
          : await createRentalItem(basePayload, token)

      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "대여 물품 저장 중 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[28px] border-0 bg-[#f7faf7] p-0 sm:!max-w-[780px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-[#1b2832]">
              {mode === "edit" ? "대여 물품 수정" : "대여 물품 추가"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#667782]">
              물품명, 분류, 설명, 대표 이미지, 재고 수량과 대여 가능 기간을 관리합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">물품명</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="노트북 충전기"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">분류</span>
              <Input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="기기 / 케이블 / 촬영장비"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">총 수량</span>
              <Input
                type="number"
                min={0}
                value={form.totalQuantity}
                onChange={(event) => setForm((current) => ({ ...current, totalQuantity: event.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-[#243845]">최대 대여 기간(일)</span>
              <Input
                type="number"
                min={1}
                value={form.maxRentalDays}
                onChange={(event) => setForm((current) => ({ ...current, maxRentalDays: event.target.value }))}
              />
            </label>

            {mode === "edit" ? (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#243845]">상태</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="rounded-[22px] border border-[#d8e3de] bg-white/70 px-4 py-4">
                <p className="text-sm font-semibold text-[#243845]">초기 상태</p>
                <p className="mt-2 text-sm text-[#667782]">새 물품은 기본적으로 대여 가능 상태로 생성됩니다.</p>
              </div>
            )}

            <div className="space-y-2">
              <ImageDropzoneField
                label="대표 이미지"
                description="물품 대표 이미지를 등록하면 목록 카드와 상세 팝업에 바로 반영됩니다."
                items={imageAssets}
                multiple={false}
                compact
                onFilesSelected={(files) => {
                  setImageAssets((current) => {
                    revokeAssets(current)
                    return createAssetsFromFiles(files.slice(0, 1))
                  })
                  setForm((current) => ({ ...current, itemImage: "" }))
                }}
                onRemove={(id) => {
                  setImageAssets((current) => {
                    const target = current.find((asset) => asset.id === id)
                    if (target) {
                      revokeAsset(target)
                    }
                    return current.filter((asset) => asset.id !== id)
                  })
                  setForm((current) => ({ ...current, itemImage: "" }))
                }}
              />
            </div>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-[#243845]">설명</span>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[140px]"
                placeholder="물품 사용 용도와 주의사항을 입력하세요."
              />
              <MarkdownSupportNote />
            </label>
          </div>

          {mode === "edit" && item ? (
            <p className="mt-4 text-xs text-[#7a878a]">
              현재 대여 가능 수량 {item.availableQuantity}개 / 전체 수량 {item.totalQuantity}개
            </p>
          ) : null}
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
              {submitting ? "저장 중..." : mode === "edit" ? "수정 저장" : "물품 추가"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
