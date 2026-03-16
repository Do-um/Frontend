"use client"

import { useRef, useState } from "react"
import { ImagePlus, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type LocalImageAsset } from "@/lib/image-assets"

type ImageDropzoneFieldProps = {
  label: string
  description?: string
  items: LocalImageAsset[]
  onFilesSelected: (files: File[]) => void
  onRemove: (id: string) => void
  multiple?: boolean
  compact?: boolean
}

export function ImageDropzoneField({
  label,
  description,
  items,
  onFilesSelected,
  onRemove,
  multiple = true,
  compact = false,
}: ImageDropzoneFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const usesCompactSinglePreview = !multiple || compact

  const handleFileList = (fileList: FileList | null) => {
    if (!fileList) {
      return
    }

    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"))
    if (!files.length) {
      return
    }

    onFilesSelected(multiple ? files : files.slice(0, 1))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="text-sm font-semibold text-[#243845]">{label}</span>
        {description ? <p className="text-xs leading-5 text-[#748690]">{description}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          handleFileList(event.target.files)
          event.currentTarget.value = ""
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragActive(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          handleFileList(event.dataTransfer.files)
        }}
        className={`flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-8 text-center transition ${
          dragActive
            ? "border-[#7cb8e8] bg-[#edf7ff]"
            : "border-[#c9d8e1] bg-white/70 hover:border-[#7cb8e8] hover:bg-[#f7fbff]"
        } cursor-pointer`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-[#eaf3f8] text-[#5b7991]">
          <Upload className="size-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-[#223541]">이미지를 드래그해서 놓거나 클릭해서 선택</p>
        <p className="mt-1 text-xs text-[#748690]">PNG, JPG, WEBP 파일을 업로드할 수 있습니다.</p>
        <p className="mt-1 text-xs text-[#8a9aa3]">큰 이미지는 업로드 전에 자동으로 용량을 줄여 저장합니다.</p>
        <div className="mt-4">
          <Button type="button" variant="outline" className="rounded-full bg-white" tabIndex={-1}>
            <ImagePlus className="size-4" />
            파일 선택
          </Button>
        </div>
      </div>

      {items.length ? (
        usesCompactSinglePreview && !multiple ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex max-w-[360px] items-center gap-3 rounded-[20px] border border-[#d7e5ea] bg-white px-3 py-3 shadow-[0_10px_24px_rgba(47,74,91,0.06)]"
              >
                <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-[14px] bg-[#eef4f7] sm:h-20 sm:w-28">
                  <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#223541]">{item.name}</p>
                  <p className="mt-1 text-xs text-[#748690]">
                    {item.persistedUrl ? "현재 저장된 이미지" : "새로 선택한 이미지"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1f2730]/85 text-white transition hover:bg-[#1f2730]"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={`overflow-hidden rounded-[18px] border border-[#d7e5ea] bg-white shadow-[0_10px_20px_rgba(47,74,91,0.08)] ${
                  compact ? "rounded-[18px]" : ""
                }`}
              >
                <div className={`relative bg-[#eef4f7] ${compact ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
                  <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className={`absolute right-2 top-2 flex items-center justify-center rounded-full bg-[#1f2730]/75 text-white backdrop-blur-sm ${
                      compact ? "size-7" : "size-8"
                    }`}
                  >
                    <X className={compact ? "size-3.5" : "size-4"} />
                  </button>
                </div>
                <div className={`truncate text-xs text-[#53656f] ${compact ? "px-2.5 py-2" : "px-2.5 py-2"}`}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  )
}
