import type { Root } from 'mdast'
import { ImageStore } from './images'
import { CONTENT_AUTOMATIC_STYLES } from './styles'
import { escapeXml, slugify, textToXml } from './xml'

type MdNode = {
  type: string
  children?: MdNode[]
  value?: string
  depth?: number
  ordered?: boolean | null
  start?: number | null
  checked?: boolean | null
  identifier?: string
  url?: string
  title?: string | null
  alt?: string | null
  align?: Array<'left' | 'right' | 'center' | null>
}

type HeadingEntry = {
  depth: number
  title: string
  bookmark: string
  node: MdNode
}

type LinkDefinition = { url: string; title?: string | null }

export interface RenderedDocument {
  contentXml: string
  images: ImageStore['images']
}

class Renderer {
  private readonly footnotes = new Map<string, MdNode>()
  private readonly definitions = new Map<string, LinkDefinition>()
  private readonly headings: HeadingEntry[] = []
  private readonly headingByNode = new Map<MdNode, HeadingEntry>()
  private readonly slugCounts = new Map<string, number>()
  private footnoteCounter = 0
  private imageCounter = 0
  private tableCounter = 0
  private readonly imageStore = new ImageStore()

  constructor(private readonly root: MdNode) {
    this.collect(root)
  }

  async render(): Promise<RenderedDocument> {
    const blocks = this.root.children || []
    const [firstBlock, ...remainingBlocks] = blocks
    const hasTitle = firstBlock?.type === 'heading' && firstBlock.depth === 1
    const title = hasTitle ? await this.renderBlock(firstBlock) : ''
    const body = await this.renderBlocks(hasTitle ? remainingBlocks : blocks)
    const toc = this.renderToc()
    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.3">${CONTENT_AUTOMATIC_STYLES}
  <office:body>
    <office:text>${title}${toc}${body}
    </office:text>
  </office:body>
</office:document-content>`

    return { contentXml, images: this.imageStore.images }
  }

  private collect(node: MdNode): void {
    if (node.type === 'footnoteDefinition' && node.identifier) {
      this.footnotes.set(node.identifier.toLowerCase(), node)
    }

    if (node.type === 'definition' && node.identifier && node.url) {
      this.definitions.set(node.identifier.toLowerCase(), { url: node.url, title: node.title })
    }

    if (node.type === 'heading') {
      const title = this.plainText(node)
      const base = slugify(title)
      const count = (this.slugCounts.get(base) || 0) + 1
      this.slugCounts.set(base, count)
      const heading: HeadingEntry = {
        depth: Math.min(6, Math.max(1, node.depth || 1)),
        title,
        bookmark: count === 1 ? base : `${base}-${count}`,
        node,
      }
      this.headings.push(heading)
      this.headingByNode.set(node, heading)
    }

    node.children?.forEach((child) => this.collect(child))
  }

  private plainText(node: MdNode): string {
    if (node.value) return node.value
    if (node.type === 'image') return node.alt || ''
    return (node.children || []).map((child) => this.plainText(child)).join('')
  }

  private renderToc(): string {
    if (this.headings.length === 0) return ''

    const templates = Array.from({ length: 6 }, (_, index) => {
      const level = index + 1
      return `
          <text:table-of-content-entry-template text:outline-level="${level}" text:style-name="Contents_20_${level}">
            <text:index-entry-link-start text:style-name="TextLink"/>
            <text:index-entry-text/>
            <text:index-entry-tab-stop style:type="right" style:leader-char="."/>
            <text:index-entry-page-number/>
            <text:index-entry-link-end/>
          </text:table-of-content-entry-template>`
    }).join('')

    const entries = this.headings
      .map(
        (heading) => `
          <text:p text:style-name="Contents_20_${heading.depth}"><text:a xlink:type="simple" xlink:href="#${heading.bookmark}">${textToXml(heading.title)}</text:a></text:p>`,
      )
      .join('')

    return `
      <text:table-of-content text:name="Table of Contents">
        <text:table-of-content-source text:outline-level="6" text:use-outline-level="true">
          <text:index-title-template text:style-name="Contents_20_Heading">Table of Contents</text:index-title-template>${templates}
        </text:table-of-content-source>
        <text:index-body>
          <text:index-title text:name="Table of Contents_Head"><text:p text:style-name="Contents_20_Heading">Table of Contents</text:p></text:index-title>${entries}
        </text:index-body>
      </text:table-of-content>`
  }

  private async renderBlocks(nodes: MdNode[], paragraphStyle = 'Text_20_body'): Promise<string> {
    const rendered: string[] = []
    for (const node of nodes) rendered.push(await this.renderBlock(node, paragraphStyle))
    return rendered.join('')
  }

  private async renderBlock(node: MdNode, paragraphStyle = 'Text_20_body'): Promise<string> {
    switch (node.type) {
      case 'paragraph':
        return `<text:p text:style-name="${paragraphStyle}">${await this.renderInlines(node.children || [])}</text:p>`
      case 'heading': {
        const heading = this.headingByNode.get(node)
        const depth = heading?.depth || Math.min(6, Math.max(1, node.depth || 1))
        const bookmark = heading?.bookmark || slugify(this.plainText(node))
        return `<text:h text:style-name="Heading_20_${depth}" text:outline-level="${depth}"><text:bookmark-start text:name="${bookmark}"/>${await this.renderInlines(node.children || [])}<text:bookmark-end text:name="${bookmark}"/></text:h>`
      }
      case 'blockquote':
        return this.renderBlocks(node.children || [], 'Blockquote')
      case 'list':
        return this.renderList(node)
      case 'code':
        return `<text:p text:style-name="Code_20_Block">${textToXml(node.value || '')}</text:p>`
      case 'thematicBreak':
        return '<text:p text:style-name="Text_20_body">────────────────────────</text:p>'
      case 'table':
        return this.renderTable(node)
      case 'html':
      case 'definition':
      case 'footnoteDefinition':
        return ''
      default:
        return node.children ? this.renderBlocks(node.children, paragraphStyle) : ''
    }
  }

  private async renderList(node: MdNode): Promise<string> {
    const ordered = Boolean(node.ordered)
    const listStyle = ordered ? 'NumberList' : 'BulletList'
    const items: string[] = []

    for (const [index, item] of (node.children || []).entries()) {
      const start = ordered && index === 0 && node.start && node.start !== 1
        ? ` text:start-value="${node.start}"`
        : ''
      const prefix = item.checked === true ? '☑ ' : item.checked === false ? '☐ ' : ''
      const children = item.children || []
      const renderedChildren: string[] = []

      for (const [childIndex, child] of children.entries()) {
        if (child.type === 'paragraph' && childIndex === 0 && prefix) {
          renderedChildren.push(
            `<text:p text:style-name="Text_20_body">${prefix}${await this.renderInlines(child.children || [])}</text:p>`,
          )
        } else {
          renderedChildren.push(await this.renderBlock(child))
        }
      }

      items.push(`<text:list-item${start}>${renderedChildren.join('')}</text:list-item>`)
    }

    return `<text:list text:style-name="${listStyle}">${items.join('')}</text:list>`
  }

  private async renderTable(node: MdNode): Promise<string> {
    this.tableCounter += 1
    const rows = node.children || []
    const columnCount = Math.max(1, ...rows.map((row) => row.children?.length || 0))
    const renderedRows: string[] = []

    for (const [rowIndex, row] of rows.entries()) {
      const cells: string[] = []
      for (const [columnIndex, cell] of (row.children || []).entries()) {
        const style = rowIndex === 0
          ? 'TableHeaderCell'
          : rowIndex % 2 === 0
            ? 'TableEvenCell'
            : 'TableOddCell'
        const alignment = node.align?.[columnIndex] || 'left'
        const paragraphStyle = alignment === 'center'
          ? 'TableTextCenter'
          : alignment === 'right'
            ? 'TableTextRight'
            : 'TableTextLeft'
        const content = await this.renderInlines(cell.children || [])
        const cellContent = rowIndex === 0
          ? `<text:span text:style-name="Strong_20_Emphasis">${content}</text:span>`
          : content
        cells.push(
          `<table:table-cell table:style-name="${style}" office:value-type="string"><text:p text:style-name="${paragraphStyle}">${cellContent}</text:p></table:table-cell>`,
        )
      }
      renderedRows.push(`<table:table-row>${cells.join('')}</table:table-row>`)
    }

    return `<table:table table:name="Table${this.tableCounter}" table:style-name="Table1"><table:table-column table:style-name="TableColumn" table:number-columns-repeated="${columnCount}"/>${renderedRows.join('')}</table:table>`
  }

  private async renderInlines(nodes: MdNode[]): Promise<string> {
    const rendered: string[] = []
    for (const node of nodes) rendered.push(await this.renderInline(node))
    return rendered.join('')
  }

  private async renderInline(node: MdNode): Promise<string> {
    switch (node.type) {
      case 'text':
        return textToXml(node.value || '')
      case 'strong':
        return `<text:span text:style-name="Strong_20_Emphasis">${await this.renderInlines(node.children || [])}</text:span>`
      case 'emphasis':
        return `<text:span text:style-name="Emphasis">${await this.renderInlines(node.children || [])}</text:span>`
      case 'delete':
        return `<text:span text:style-name="Strike">${await this.renderInlines(node.children || [])}</text:span>`
      case 'inlineCode':
        return `<text:span text:style-name="Source_20_Text">${textToXml(node.value || '')}</text:span>`
      case 'break':
        return '<text:line-break/>'
      case 'link':
        return `<text:a xlink:type="simple" xlink:href="${escapeXml(node.url || '')}" text:style-name="TextLink">${await this.renderInlines(node.children || [])}</text:a>`
      case 'linkReference': {
        const definition = this.definitions.get((node.identifier || '').toLowerCase())
        if (!definition) return this.renderInlines(node.children || [])
        return `<text:a xlink:type="simple" xlink:href="${escapeXml(definition.url)}" text:style-name="TextLink">${await this.renderInlines(node.children || [])}</text:a>`
      }
      case 'image':
        return this.renderImage(node.url || '', node.alt || '')
      case 'imageReference': {
        const definition = this.definitions.get((node.identifier || '').toLowerCase())
        return definition ? this.renderImage(definition.url, node.alt || '') : textToXml(node.alt || '')
      }
      case 'footnoteReference':
        return this.renderFootnote(node.identifier || '')
      default:
        if (node.value) return textToXml(node.value)
        return node.children ? this.renderInlines(node.children) : ''
    }
  }

  private async renderImage(url: string, alt: string): Promise<string> {
    this.imageCounter += 1
    const image = await this.imageStore.add(url, alt)
    return `<draw:frame draw:name="Image ${this.imageCounter}" text:anchor-type="as-char" svg:width="${image.widthCm.toFixed(2)}cm" svg:height="${image.heightCm.toFixed(2)}cm"><draw:image xlink:href="${image.name}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:desc>${image.alt}</svg:desc></draw:frame>`
  }

  private async renderFootnote(identifier: string): Promise<string> {
    const definition = this.footnotes.get(identifier.toLowerCase())
    if (!definition) return textToXml(`[^${identifier}]`)

    this.footnoteCounter += 1
    const number = this.footnoteCounter
    const body = await this.renderBlocks(definition.children || [], 'Footnote')
    return `<text:note text:id="ftn${number}" text:note-class="footnote"><text:note-citation>${number}</text:note-citation><text:note-body>${body}</text:note-body></text:note>`
  }
}

export async function renderDocument(root: Root): Promise<RenderedDocument> {
  return new Renderer(root as unknown as MdNode).render()
}
