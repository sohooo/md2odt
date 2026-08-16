# md2odf

> Markdown to LibreOffice Writer converter

md2odf is a small, private web app that turns Markdown into a polished and editable OpenDocument Text (`.odt`) file. Conversion happens entirely in the browser: documents and images are not uploaded to a server.

## Current feature set

- Live Markdown preview
- Light and dark interface themes with a persistent header slider
- Native LibreOffice Writer `.odt` downloads
- Semantic headings from level 1 through 6
  - `# Heading` becomes the Writer style **Heading 1**
  - `## Heading` becomes **Heading 2**, and so on
  - Heading levels remain visible in Writer's document outline
- An automatically generated table of contents at the beginning of the preview and exported document, containing every Markdown heading
- Native numbered and unnumbered Writer lists, including nested lists
- Styled GFM tables with a shaded header, alternating row colors, borders, padding, and column alignment
- Embedded PNG, JPEG, GIF, WebP, and SVG images
  - Add local images with the image button
  - Remote images are fetched and embedded when their server permits cross-origin access
  - Images retain their aspect ratio and are scaled to the printable page
- Native LibreOffice footnotes using GFM footnote syntax
- Bold, italic, struck-through, inline-code, block-code, blockquote, link, and horizontal-rule formatting
- Automatic local draft and filename saving with `localStorage`
- No backend, accounts, tracking, or database

The generated TOC is a native OpenDocument table of contents. Its entries are included in the initial file; LibreOffice calculates final page numbers when it lays out or refreshes the document.

## Markdown examples

### Headings and table of contents

```markdown
# Introduction
## Background
### Details
```

All three headings appear in the generated TOC and use the corresponding semantic Writer heading style.

### Lists

```markdown
- Unnumbered item
- Another item
  - Nested item

1. First step
2. Second step
3. Third step
```

### Tables

```markdown
| Name | Status | Score |
| :--- | :----: | ----: |
| Alpha | Ready | 10 |
| Beta | Draft | 7 |
```

The separator-row colons control left, center, and right alignment.

### Images

```markdown
![Description of the image](https://example.com/image.png)
```

The **Add image** button inserts a local image as a Markdown data URL so it can be embedded without a server. Large data URLs may exceed the browser's local-storage quota; the app reports this without preventing the current document from being exported.

### Footnotes

```markdown
This statement has a source.[^source]

[^source]: The full source or explanatory note.
```

## Development

The app uses vanilla TypeScript, Vite, the unified/remark Markdown parser, and JSZip. It produces an ODF 1.3 package directly in the browser.

Requirements:

- Node.js 20.19 or newer
- npm, pnpm, or another Node package manager

Install and run locally:

```sh
npm install
npm run dev
```

Create a production build:

```sh
npm run build
```

The static build is written to `dist/` and can be served by any static web host.

## Tests

Run the complete regression suite with:

```sh
npm test
```

The tests cover:

- Valid ODT packaging and XML files
- The required uncompressed first `mimetype` entry
- Semantic Heading 1–6 styles, generated TOC entries, and TOC placement before document content
- Unique heading bookmarks
- Numbered, unnumbered, nested, and custom-start lists
- Styled and aligned tables
- Embedded image bytes and manifest entries
- Unsupported-image error handling
- Native footnotes
- Markdown preview output and raw-HTML safety
- XML escaping and whitespace preservation
- Local draft persistence
- Theme preference persistence and system-theme fallback

Each exported-document test opens the generated ZIP in memory and inspects its ODF XML and embedded assets. This makes document-format regressions visible before release.

## Known limitations

- LibreOffice may require **Tools → Update → Update All** to recalculate TOC page numbers after pagination changes.
- Remote images must be accessible to browser `fetch`; servers without suitable CORS headers cannot be embedded. Download the image and use **Add image** in that case.
- Very large documents and images are held in browser memory while the ODT is generated.
- Markdown containing raw HTML is intentionally not rendered or exported.
