export const starterMarkdown = `# A polished Writer document

md2odt converts **Markdown** into an editable LibreOffice Writer file, entirely in your browser.

## Automatic table of contents

The page title comes first, followed by an automatically generated table of contents. Every Markdown heading is listed with its semantic level and links to the corresponding section.

## Semantic headings

Headings keep their levels, appear as Heading 1, Heading 2, and so on in Writer, and are included in the generated table of contents.

### Lists

Unnumbered lists use Writer's native bullet list style:

- Clear and familiar
- Easy to edit later
- Supports nested items

Numbered lists retain their numbering:

1. Write Markdown
2. Check the preview
3. Download the ODT

### Quotations

> Good tools make the simple things easy and the difficult things possible.

### Code blocks

Fenced code remains readable without language-specific highlighting:

~~~text
const document = await createOdt(markdown)
save(document)
~~~

### Tables

| Feature | Included | Output |
| :--- | :---: | ---: |
| Contents | Yes | Native TOC |
| Tables | Yes | Styled |
| Footnotes | Yes | Native note |

### Footnotes

Footnotes stay attached to their reference.[^privacy]

[^privacy]: Your document is converted locally and is not uploaded to a server.
`
