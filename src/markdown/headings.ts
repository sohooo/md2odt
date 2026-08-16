import type { Root } from 'mdast'
import { slugify } from '../odt/xml'

type HeadingNode = {
  type: string
  value?: string
  alt?: string | null
  depth?: number
  children?: HeadingNode[]
}

export interface DocumentHeading {
  depth: number
  title: string
  id: string
}

function plainText(node: HeadingNode): string {
  if (node.value) return node.value
  if (node.type === 'image') return node.alt || ''
  return (node.children || []).map(plainText).join('')
}

export function collectHeadings(root: Root): DocumentHeading[] {
  const headings: DocumentHeading[] = []
  const slugCounts = new Map<string, number>()

  function visit(node: HeadingNode): void {
    if (node.type === 'heading') {
      const title = plainText(node)
      const base = slugify(title)
      const count = (slugCounts.get(base) || 0) + 1
      slugCounts.set(base, count)
      headings.push({
        depth: Math.min(6, Math.max(1, node.depth || 1)),
        title,
        id: count === 1 ? base : `${base}-${count}`,
      })
    }

    node.children?.forEach(visit)
  }

  visit(root as unknown as HeadingNode)
  return headings
}
