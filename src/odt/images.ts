import { escapeXml } from './xml'

export interface EmbeddedImage {
  name: string
  mediaType: string
  bytes: Uint8Array
  widthCm: number
  heightCm: number
  alt: string
}

const extensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

function parseDataUrl(url: string): { bytes: Uint8Array; mediaType: string } {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url)
  if (!match) throw new Error('The image contains an invalid data URL.')

  const mediaType = match[1] || 'application/octet-stream'
  const payload = match[3] || ''

  if (match[2]) {
    const decoded = atob(payload)
    return {
      mediaType,
      bytes: Uint8Array.from(decoded, (character) => character.charCodeAt(0)),
    }
  }

  return {
    mediaType,
    bytes: new TextEncoder().encode(decodeURIComponent(payload)),
  }
}

async function loadImageBytes(url: string): Promise<{ bytes: Uint8Array; mediaType: string }> {
  if (url.startsWith('data:')) return parseDataUrl(url)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Image request failed with HTTP ${response.status}.`)
  }

  const mediaType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream'
  return { bytes: new Uint8Array(await response.arrayBuffer()), mediaType }
}

async function imageSize(bytes: Uint8Array, mediaType: string): Promise<[number, number] | undefined> {
  if (typeof createImageBitmap !== 'function') return undefined

  try {
    const copy = new Uint8Array(bytes.byteLength)
    copy.set(bytes)
    const bitmap = await createImageBitmap(new Blob([copy.buffer], { type: mediaType }))
    const size: [number, number] = [bitmap.width, bitmap.height]
    bitmap.close()
    return size
  } catch {
    return undefined
  }
}

function sizeInCentimetres(size?: [number, number]): [number, number] {
  if (!size || size[0] <= 0 || size[1] <= 0) return [12, 7.5]

  const pixelsPerCentimetre = 96 / 2.54
  let width = size[0] / pixelsPerCentimetre
  let height = size[1] / pixelsPerCentimetre
  const scale = Math.min(1, 16 / width, 22 / height)
  width *= scale
  height *= scale

  return [Math.max(width, 0.5), Math.max(height, 0.5)]
}

export class ImageStore {
  readonly images: EmbeddedImage[] = []
  private readonly cache = new Map<string, EmbeddedImage>()

  async add(url: string, alt = ''): Promise<EmbeddedImage> {
    const cached = this.cache.get(url)
    if (cached) return cached

    let loaded: { bytes: Uint8Array; mediaType: string }
    try {
      loaded = await loadImageBytes(url)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`Could not embed image “${alt || url}”: ${reason}`)
    }

    const extension = extensions[loaded.mediaType]
    if (!extension) {
      throw new Error(
        `Could not embed image “${alt || url}”: unsupported type ${loaded.mediaType}.`,
      )
    }

    const [widthCm, heightCm] = sizeInCentimetres(
      await imageSize(loaded.bytes, loaded.mediaType),
    )
    const image: EmbeddedImage = {
      name: `Pictures/image-${this.images.length + 1}.${extension}`,
      mediaType: loaded.mediaType,
      bytes: loaded.bytes,
      widthCm,
      heightCm,
      alt: escapeXml(alt),
    }

    this.images.push(image)
    this.cache.set(url, image)
    return image
  }
}
