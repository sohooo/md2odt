import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { collectHeadings } from './headings'
import { parseMarkdown } from './parse'

const renderer = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeStringify)

export function renderPreview(markdown: string): string {
  const document = parseMarkdown(markdown)
  const headings = collectHeadings(document)
  let headingIndex = 0
  const documentHtml = String(renderer.processSync(markdown)).replace(
    /<h([1-6])>/g,
    (_match, level: string) => {
      const heading = headings[headingIndex]
      headingIndex += 1
      return heading ? `<h${level} id="${heading.id}">` : `<h${level}>`
    },
  )

  if (headings.length === 0) return documentHtml

  const entries = headings
    .map(
      (heading) =>
        `<li class="toc-level-${heading.depth}"><a href="#${heading.id}">${escapeHtml(heading.title)}</a></li>`,
    )
    .join('')

  const toc = `<nav class="preview-toc" aria-label="Table of contents"><h2>Table of contents</h2><ol>${entries}</ol></nav>`
  const firstBlock = document.children[0]

  if (firstBlock?.type === 'heading' && firstBlock.depth === 1) {
    const closingTag = '</h1>'
    const titleEnd = documentHtml.indexOf(closingTag)
    if (titleEnd >= 0) {
      const insertionPoint = titleEnd + closingTag.length
      return `${documentHtml.slice(0, insertionPoint)}${toc}${documentHtml.slice(insertionPoint)}`
    }
  }

  return `${toc}${documentHtml}`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
