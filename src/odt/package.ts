import JSZip from 'jszip'
import type { EmbeddedImage } from './images'
import { createStylesXml } from './styles'
import { escapeXml } from './xml'

export interface DocumentMetadata {
  title?: string
  creator?: string
}

const MIME_TYPE = 'application/vnd.oasis.opendocument.text'
const ZIP_DATE = new Date(1980, 0, 1, 0, 0, 0)

function createManifestXml(images: EmbeddedImage[]): string {
  const imageEntries = images
    .map(
      (image) =>
        `  <manifest:file-entry manifest:full-path="${escapeXml(image.name)}" manifest:media-type="${escapeXml(image.mediaType)}"/>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${MIME_TYPE}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>
${imageEntries}
</manifest:manifest>`
}

function createMetaXml(metadata: DocumentMetadata): string {
  const created = new Date().toISOString()
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  office:version="1.3">
  <office:meta>
    <meta:generator>md2odt</meta:generator>
    <dc:title>${escapeXml(metadata.title || 'Markdown document')}</dc:title>
    <dc:creator>${escapeXml(metadata.creator || '')}</dc:creator>
    <meta:creation-date>${created}</meta:creation-date>
  </office:meta>
</office:document-meta>`
}

function createSettingsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"
  office:version="1.3">
  <office:settings>
    <config:config-item-set config:name="ooo:view-settings"/>
    <config:config-item-set config:name="ooo:configuration-settings"/>
  </office:settings>
</office:document-settings>`
}

export async function packageOdt(
  contentXml: string,
  images: EmbeddedImage[],
  metadata: DocumentMetadata = {},
): Promise<Uint8Array> {
  const zip = new JSZip()

  zip.file('mimetype', MIME_TYPE, { compression: 'STORE', date: ZIP_DATE })
  zip.file('content.xml', contentXml, { date: ZIP_DATE })
  zip.file('styles.xml', createStylesXml(), { date: ZIP_DATE })
  zip.file('meta.xml', createMetaXml(metadata), { date: ZIP_DATE })
  zip.file('settings.xml', createSettingsXml(), { date: ZIP_DATE })
  zip.file('META-INF/manifest.xml', createManifestXml(images), { date: ZIP_DATE })

  for (const image of images) {
    zip.file(image.name, image.bytes, { date: ZIP_DATE })
  }

  return zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: MIME_TYPE,
  })
}

export { MIME_TYPE }
