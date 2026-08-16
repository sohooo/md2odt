import { describe, expect, it } from 'vitest'
import { renderPreview } from '../src/markdown/preview'
import { starterMarkdown } from '../src/starter'

describe('Markdown preview', () => {
  it('renders headings, both list types, tables, images, and footnotes', () => {
    const html = renderPreview(`# Heading

- Bullet

1. Number

| A | B |
| - | - |
| 1 | 2 |

![Alt](data:image/png;base64,abc)

Note[^1]

[^1]: Footnote`)

    expect(html).toContain('<h1 id="heading">Heading</h1>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<table>')
    expect(html).toContain('<img src="data:image/png;base64,abc" alt="Alt">')
    expect(html).toContain('data-footnote-ref')
    expect(html).toContain('Footnote')
  })

  it('does not include raw HTML from Markdown in the preview', () => {
    const html = renderPreview('<script>alert("unsafe")</script>')
    expect(html).not.toContain('<script>')
  })

  it('automatically places a linked table of contents before the first heading', () => {
    const html = renderPreview('# Introduction\n\n## Details\n\n### Examples')
    const tocPosition = html.indexOf('<nav class="preview-toc"')
    const headingPosition = html.indexOf('<h1 id="introduction">')

    expect(tocPosition).toBe(0)
    expect(tocPosition).toBeLessThan(headingPosition)
    expect(html).toContain('<a href="#introduction">Introduction</a>')
    expect(html).toContain('<a href="#details">Details</a>')
    expect(html).toContain('<a href="#examples">Examples</a>')
  })

  it('demonstrates automatic contents generation in the startup example', () => {
    expect(starterMarkdown).toContain('## Automatic table of contents')

    const html = renderPreview(starterMarkdown)
    expect(html.startsWith('<nav class="preview-toc"')).toBe(true)
    expect(html).toContain(
      '<a href="#automatic-table-of-contents">Automatic table of contents</a>',
    )
  })
})
