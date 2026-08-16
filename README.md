# md2odt

> Markdown to LibreOffice Writer converter

md2odt is a small, private web app that turns Markdown into a polished and editable OpenDocument Text (`.odt`) file. Conversion happens entirely in the browser: documents and images are not uploaded to a server.

## Kubernetes quickstart

Released images and charts are published to GitHub Container Registry. The chart already points at the matching `ghcr.io/sohooo/md2odt` image, so a stable release can be installed directly without cloning this repository:

```sh
VERSION=0.1.0

helm upgrade --install md2odt \
  oci://ghcr.io/sohooo/charts/md2odt \
  --version "${VERSION}" \
  --namespace md2odt \
  --create-namespace
```

Wait for the application and access it locally:

```sh
kubectl --namespace md2odt rollout status deployment/md2odt
kubectl --namespace md2odt port-forward service/md2odt 8080:80
```

Open `http://localhost:8080`. To expose it through an existing Gateway API Gateway, add the route settings during installation:

```sh
helm upgrade --install md2odt \
  oci://ghcr.io/sohooo/charts/md2odt \
  --version "${VERSION}" \
  --namespace md2odt \
  --create-namespace \
  --set httpRoute.enabled=true \
  --set 'httpRoute.parentRefs[0].name=public-gateway' \
  --set 'httpRoute.parentRefs[0].namespace=gateway-system' \
  --set 'httpRoute.parentRefs[0].sectionName=https' \
  --set 'httpRoute.hostnames[0]=md2odt.example.com'
```

Change the version and Gateway values to match your release and cluster. The HTTPRoute requires the Gateway API CRDs, a compatible controller, and a Gateway listener that permits routes from the `md2odt` namespace.

## Current feature set

- Live Markdown preview
- Light and dark interface themes with a persistent header slider
- Native LibreOffice Writer `.odt` downloads
- Semantic headings from level 1 through 6
  - `# Heading` becomes the Writer style **Heading 1**
  - `## Heading` becomes **Heading 2**, and so on
  - Heading levels remain visible in Writer's document outline
- An automatically generated table of contents immediately after a leading level-one page title, containing every Markdown heading
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

When the document starts with a level-one heading, md2odt treats it as the page title and places the generated TOC directly after it. Without a leading level-one title, the TOC remains the first element.

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

### Quotations

```markdown
> Good tools make the simple things easy and the difficult things possible.
```

Quotations use Writer's block quotation style with an indented accent border.

### Code blocks

````markdown
```text
const document = await createOdt(markdown)
save(document)
```
````

Fenced code blocks preserve line breaks and spacing and use a fixed-width font. Language labels are accepted as normal Markdown metadata, but md2odt intentionally does not apply syntax highlighting.

## Development

The app uses vanilla TypeScript, Vite, the unified/remark Markdown parser, and JSZip. It produces an ODF 1.3 package directly in the browser.

Requirements:

- Node.js 20.19 or newer
- npm, pnpm, or another Node package manager

Install and run locally:

```sh
pnpm install
pnpm dev
```

Create a production build:

```sh
npm run build
```

The static build is written to `dist/` and can be served by any static web host.

## Container image

The multi-stage Docker build compiles the application with Node.js and copies only the static output into an Alpine-based, unprivileged NGINX runtime. The resulting container runs as user `101`, listens on port `8080`, and exposes a small `/healthz` endpoint.

Build and run it locally:

```sh
docker build --tag md2odt:0.1.0 .
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --publish 8080:8080 md2odt:0.1.0
```

Then open `http://localhost:8080` or check `http://localhost:8080/healthz`.

Published release images are available as `ghcr.io/sohooo/md2odt:<version>`. The `edge` tag tracks the latest successful build from `master`; every published build also has an immutable `sha-<commit>` tag.

## Kubernetes and Helm

The chart in `charts/md2odt` creates:

- A rolling-update Deployment running without root privileges
- A ClusterIP Service
- Startup, readiness, and liveness HTTP probes against `/healthz`
- A read-only root filesystem with a size-limited temporary volume
- An optional Gateway API `HTTPRoute`
- Conservative CPU and memory requests and limits

Build and push the image to a registry, then install it with:

```sh
helm upgrade --install md2odt charts/md2odt \
  --namespace md2odt --create-namespace \
  --set image.repository=registry.example.com/md2odt \
  --set image.tag=0.1.0
```

The HTTPRoute is disabled by default because it requires Gateway API and an existing Gateway. Enable it with a values file such as:

```yaml
httpRoute:
  enabled: true
  parentRefs:
    - name: public-gateway
      namespace: gateway-system
      sectionName: https
  hostnames:
    - md2odt.example.com
  pathPrefix: /
```

Apply the configuration during installation:

```sh
helm upgrade --install md2odt charts/md2odt \
  --namespace md2odt --create-namespace \
  --values my-values.yaml
```

The cluster must have the Gateway API CRDs and a compatible Gateway controller installed before enabling the HTTPRoute.

## Automated releases

The GitHub Actions workflow validates the application and Helm chart on pull requests. For pushes to `master`, it publishes:

- A multi-architecture `linux/amd64` and `linux/arm64` image tagged `edge` and `sha-<commit>`
- A uniquely versioned development Helm chart under `oci://ghcr.io/sohooo/charts/md2odt`

Pushing a semantic version tag such as `v0.2.0` publishes matching `0.2.0` image and chart versions. The container build includes BuildKit caching, an SBOM, and provenance attestations. Every workflow run also stores the packaged chart as a downloadable GitHub Actions artifact.

Publishing uses the workflow-provided `GITHUB_TOKEN`; no registry secret is required. After the first run, ensure the two GHCR packages inherit this repository's access or mark them public if the quickstart should work without GitHub authentication.

## Tests

Run the complete regression suite with:

```sh
npm test
```

Validate the Helm chart separately with:

```sh
npm run test:helm
```

The tests cover:

- Valid ODT packaging and XML files
- The required uncompressed first `mimetype` entry
- Semantic Heading 1–6 styles, generated TOC entries, and TOC placement after a leading page title
- Unique heading bookmarks
- Numbered, unnumbered, nested, and custom-start lists
- Styled and aligned tables
- Embedded image bytes and manifest entries
- Unsupported-image error handling
- Native footnotes
- Styled quotations and fixed-width fenced code blocks
- Markdown preview output and raw-HTML safety
- XML escaping and whitespace preservation
- Local draft persistence
- Theme preference persistence and system-theme fallback
- Helm rendering, health probes, workload hardening, and HTTPRoute generation

Each exported-document test opens the generated ZIP in memory and inspects its ODF XML and embedded assets. This makes document-format regressions visible before release.

## Known limitations

- LibreOffice may require **Tools → Update → Update All** to recalculate TOC page numbers after pagination changes.
- Remote images must be accessible to browser `fetch`; servers without suitable CORS headers cannot be embedded. Download the image and use **Add image** in that case.
- Very large documents and images are held in browser memory while the ODT is generated.
- Markdown containing raw HTML is intentionally not rendered or exported.
