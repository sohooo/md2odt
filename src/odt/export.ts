import { parseMarkdown } from '../markdown/parse'
import { packageOdt, type DocumentMetadata, MIME_TYPE } from './package'
import { renderDocument } from './render'

export async function createOdt(
  markdown: string,
  metadata: DocumentMetadata = {},
): Promise<Uint8Array> {
  const root = parseMarkdown(markdown)
  const rendered = await renderDocument(root)
  return packageOdt(rendered.contentXml, rendered.images, metadata)
}

export function odtBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer], { type: MIME_TYPE })
}
