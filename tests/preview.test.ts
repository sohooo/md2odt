import { describe, expect, it } from 'vitest'
import { renderPreview } from '../src/markdown/preview'

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

    expect(html).toContain('<h1>Heading</h1>')
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
})
