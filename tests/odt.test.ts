import { DOMParser } from '@xmldom/xmldom'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { createOdt } from '../src/odt/export'

const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function openOdt(markdown: string): Promise<{
  bytes: Uint8Array
  zip: JSZip
  content: string
  styles: string
  manifest: string
}> {
  const bytes = await createOdt(markdown, { title: 'Regression document' })
  const zip = await JSZip.loadAsync(bytes)
  const read = (path: string) => {
    const file = zip.file(path)
    if (!file) throw new Error(`Missing ${path}`)
    return file.async('string')
  }

  return {
    bytes,
    zip,
    content: await read('content.xml'),
    styles: await read('styles.xml'),
    manifest: await read('META-INF/manifest.xml'),
  }
}

function expectValidXml(xml: string): void {
  const errors: string[] = []
  new DOMParser({
    errorHandler: {
      warning: () => undefined,
      error: (message) => errors.push(message),
      fatalError: (message) => errors.push(message),
    },
  }).parseFromString(xml, 'application/xml')
  expect(errors).toEqual([])
}

describe('ODT package', () => {
  it('contains every required ODT file and valid XML', async () => {
    const document = await openOdt('# Hello\n\nA document.')

    expect(document.zip.file('mimetype')).not.toBeNull()
    expect(document.zip.file('content.xml')).not.toBeNull()
    expect(document.zip.file('styles.xml')).not.toBeNull()
    expect(document.zip.file('meta.xml')).not.toBeNull()
    expect(document.zip.file('settings.xml')).not.toBeNull()
    expect(document.zip.file('META-INF/manifest.xml')).not.toBeNull()

    for (const path of [
      'content.xml',
      'styles.xml',
      'meta.xml',
      'settings.xml',
      'META-INF/manifest.xml',
    ]) {
      const file = document.zip.file(path)
      expect(file).not.toBeNull()
      expectValidXml(await file!.async('string'))
    }

    const view = new DataView(document.bytes.buffer, document.bytes.byteOffset)
    expect(view.getUint32(0, true)).toBe(0x04034b50)
    expect(view.getUint16(8, true)).toBe(0)
    const nameLength = view.getUint16(26, true)
    const firstFilename = new TextDecoder().decode(document.bytes.slice(30, 30 + nameLength))
    expect(firstFilename).toBe('mimetype')
  })
})

describe('semantic headings and table of contents', () => {
  it('maps each Markdown heading to its Writer heading style and TOC entry', async () => {
    const document = await openOdt('# Introduction\n\n## Details\n\n### More details')

    expect(document.content).toContain('text:table-of-content text:name="Table of Contents"')
    expect(document.content.indexOf('<text:table-of-content')).toBeLessThan(
      document.content.indexOf('<text:h '),
    )
    expect(document.content).toContain('text:use-outline-level="true"')
    expect(document.content).toContain('text:style-name="Heading_20_1" text:outline-level="1"')
    expect(document.content).toContain('text:style-name="Heading_20_2" text:outline-level="2"')
    expect(document.content).toContain('text:style-name="Heading_20_3" text:outline-level="3"')
    expect(document.content).toContain('xlink:href="#introduction">Introduction</text:a>')
    expect(document.content).toContain('xlink:href="#details">Details</text:a>')
    expect(document.content).toContain('xlink:href="#more-details">More details</text:a>')
    expect(document.styles).toContain('style:display-name="Heading 1"')
    expect(document.styles).toContain('style:display-name="Heading 6"')
  })

  it('creates unique bookmarks for repeated heading names', async () => {
    const document = await openOdt('# Same\n\n## Same')

    expect(document.content).toContain('text:name="same"')
    expect(document.content).toContain('text:name="same-2"')
  })
})

describe('lists', () => {
  it('creates a native unnumbered list', async () => {
    const document = await openOdt('- Alpha\n- Beta\n  - Nested')

    expect(document.content).toContain('<text:list text:style-name="BulletList">')
    expect(document.content.match(/<text:list-item/g)).toHaveLength(3)
    expect(document.styles).toContain('text:list-level-style-bullet')
  })

  it('creates a native numbered list and preserves its start number', async () => {
    const document = await openOdt('3. Third\n4. Fourth')

    expect(document.content).toContain('<text:list text:style-name="NumberList">')
    expect(document.content).toContain('<text:list-item text:start-value="3">')
    expect(document.styles).toContain('text:list-level-style-number')
  })
})

describe('tables', () => {
  it('uses styled header, alternating rows, and Markdown alignment', async () => {
    const document = await openOdt(
      '| Left | Centre | Right |\n| :--- | :---: | ---: |\n| A | B | C |\n| D | E | F |',
    )

    expect(document.content).toContain('<table:table ')
    expect(document.content).toContain('table:style-name="TableHeaderCell"')
    expect(document.content).toContain('table:style-name="TableOddCell"')
    expect(document.content).toContain('table:style-name="TableEvenCell"')
    expect(document.content).toContain('text:style-name="TableTextLeft"')
    expect(document.content).toContain('text:style-name="TableTextCenter"')
    expect(document.content).toContain('text:style-name="TableTextRight"')
  })
})

describe('embedded images', () => {
  it('places image bytes in Pictures and registers them in the manifest', async () => {
    const document = await openOdt(`![A tiny pixel](${tinyPng})`)
    const image = document.zip.file('Pictures/image-1.png')

    expect(image).not.toBeNull()
    expect((await image!.async('uint8array')).length).toBeGreaterThan(0)
    expect(document.content).toContain('xlink:href="Pictures/image-1.png"')
    expect(document.content).toContain('<svg:desc>A tiny pixel</svg:desc>')
    expect(document.manifest).toContain(
      'manifest:full-path="Pictures/image-1.png" manifest:media-type="image/png"',
    )
  })

  it('reports unsupported image types rather than creating a broken document', async () => {
    await expect(createOdt('![Text](data:text/plain;base64,SGVsbG8=)')).rejects.toThrow(
      'unsupported type text/plain',
    )
  })
})

describe('footnotes', () => {
  it('creates native ODF notes at their Markdown references', async () => {
    const document = await openOdt('A claim.[^source]\n\n[^source]: The supporting note.')

    expect(document.content).toContain('text:note-class="footnote"')
    expect(document.content).toContain('<text:note-citation>1</text:note-citation>')
    expect(document.content).toContain('The supporting note.')
    expect(document.styles).toContain('text:notes-configuration text:note-class="footnote"')
  })
})
