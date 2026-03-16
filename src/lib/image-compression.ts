const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024
const OUTPUT_DIMENSION_STEPS = [1920, 1600, 1280]
const OUTPUT_QUALITY_STEPS = [0.82, 0.74, 0.68]
const WEBP_TYPE = "image/webp"
const JPEG_TYPE = "image/jpeg"

function shouldSkipCompression(file: File) {
  return (
    !file.type.startsWith("image/") ||
    file.size <= MAX_IMAGE_UPLOAD_BYTES ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  )
}

function replaceExtension(filename: string, extension: string) {
  const dotIndex = filename.lastIndexOf(".")
  if (dotIndex < 0) {
    return `${filename}${extension}`
  }

  return `${filename.slice(0, dotIndex)}${extension}`
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`이미지를 불러오지 못했습니다: ${file.name}`))
    }

    image.src = objectUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

async function encodeCompressedBlob(canvas: HTMLCanvasElement, quality: number) {
  const webpBlob = await canvasToBlob(canvas, WEBP_TYPE, quality)
  if (webpBlob) {
    return webpBlob
  }

  return canvasToBlob(canvas, JPEG_TYPE, quality)
}

function toCompressedFile(blob: Blob, originalFile: File) {
  const extension = blob.type === WEBP_TYPE ? ".webp" : ".jpg"
  return new File([blob], replaceExtension(originalFile.name, extension), {
    type: blob.type,
    lastModified: Date.now(),
  })
}

async function compressSingleImage(file: File) {
  if (shouldSkipCompression(file)) {
    return file
  }

  if (typeof window === "undefined") {
    return file
  }

  try {
    const image = await loadImage(file)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) {
      return file
    }

    let smallestBlob: Blob | null = null

    // Try a few size/quality combinations and keep the first one that gets under target.
    for (const maxDimension of OUTPUT_DIMENSION_STEPS) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      for (const quality of OUTPUT_QUALITY_STEPS) {
        const blob = await encodeCompressedBlob(canvas, quality)
        if (!blob) {
          continue
        }

        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob
        }

        if (blob.size <= MAX_IMAGE_UPLOAD_BYTES) {
          return toCompressedFile(blob, file)
        }
      }
    }

    if (smallestBlob && smallestBlob.size < file.size) {
      return toCompressedFile(smallestBlob, file)
    }
  } catch (error) {
    console.warn("이미지 자동 최적화에 실패해 원본 파일을 유지합니다.", error)
  }

  return file
}

export async function compressImagesForUpload(files: File[]) {
  return Promise.all(files.map((file) => compressSingleImage(file)))
}
