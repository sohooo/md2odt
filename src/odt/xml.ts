export function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function textToXml(value: string): string {
  const parts = value.split(/(\n|\t| {2,})/g)

  return parts
    .map((part) => {
      if (part === '\n') return '<text:line-break/>'
      if (part === '\t') return '<text:tab/>'
      if (/^ {2,}$/.test(part)) {
        return ` <text:s text:c="${part.length - 1}"/>`
      }
      return escapeXml(part)
    })
    .join('')
}

export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'section'
}
