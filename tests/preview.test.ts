import { describe, expect, it } from 'vitest'
import { renderPreview } from '../src/markdown/preview'
import { starterMarkdown } from '../src/starter'

describe('Markdown preview', () => {
  it('renders headings, lists, quotations, code, tables, images, and footnotes', () => {
    const html = renderPreview(`# Heading

- Bullet

1. Number

> A quotation

\`\`\`text
const answer = 42
\`\`\`

| A | B |
| - | - |
| 1 | 2 |

![Alt](data:image/png;base64,abc)

Note[^1]

[^1]: Footnote`)

    expect(html).toContain('<h1 id="heading">Heading</h1>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<p>A quotation</p>')
    expect(html).toContain('<pre><code class="language-text">const answer = 42\n</code></pre>')
    expect(html).toContain('<table>')
    expect(html).toContain('<img src="data:image/png;base64,abc" alt="Alt">')
    expect(html).toContain('data-footnote-ref')
    expect(html).toContain('Footnote')
  })

  it('does not include raw HTML from Markdown in the preview', () => {
    const html = renderPreview('<script>alert("unsafe")</script>')
    expect(html).not.toContain('<script>')
  })

  it('places a linked table of contents after the leading page title', () => {
    const html = renderPreview('# Introduction\n\n## Details\n\n### Examples')
    const tocPosition = html.indexOf('<nav class="preview-toc"')
    const titlePosition = html.indexOf('<h1 id="introduction">')
    const sectionPosition = html.indexOf('<h2 id="details">')

    expect(titlePosition).toBe(0)
    expect(titlePosition).toBeLessThan(tocPosition)
    expect(tocPosition).toBeLessThan(sectionPosition)
    expect(html).toContain('<a href="#introduction">Introduction</a>')
    expect(html).toContain('<a href="#details">Details</a>')
    expect(html).toContain('<a href="#examples">Examples</a>')
  })

  it('demonstrates automatic contents generation in the startup example', () => {
    expect(starterMarkdown).toContain('## Automatic table of contents')

    const html = renderPreview(starterMarkdown)
    expect(html.startsWith('<h1 id="a-polished-writer-document">')).toBe(true)
    expect(html.indexOf('<h1 ')).toBeLessThan(html.indexOf('<nav class="preview-toc"'))
    expect(html).toContain(
      '<a href="#automatic-table-of-contents">Automatic table of contents</a>',
    )
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<pre><code class="language-text">')
  })

  it('keeps the table of contents first when there is no leading page title', () => {
    const html = renderPreview('An introduction.\n\n## Details')

    expect(html.startsWith('<nav class="preview-toc"')).toBe(true)
  })
})
