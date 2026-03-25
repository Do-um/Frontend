import { resolveMediaUrl } from "@/lib/media"

export type LocalImageAsset = {
  id: string
  previewUrl: string
  file: File | null
  persistedUrl: string | null
  name: string
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createAssetsFromUrls(urls: string[]) {
  return urls.map<LocalImageAsset>((url, index) => ({
    id: `persisted-${index}-${url}`,
    previewUrl: resolveMediaUrl(url) ?? url,
    file: null,
    persistedUrl: url,
    name: url.split("/").pop() || `image-${index + 1}`,
  }))
}

export function createAssetsFromFiles(files: File[]) {
  return files.map<LocalImageAsset>((file) => ({
    id: makeId(),
    previewUrl: URL.createObjectURL(file),
    file,
    persistedUrl: null,
    name: file.name,
  }))
}

export function revokeAsset(asset: LocalImageAsset) {
  if (asset.file && asset.previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(asset.previewUrl)
  }
}

export function revokeAssets(assets: LocalImageAsset[]) {
  assets.forEach(revokeAsset)
}
