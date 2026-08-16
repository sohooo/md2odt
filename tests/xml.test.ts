import { describe, expect, it } from 'vitest'
import { escapeXml, slugify, textToXml } from '../src/odt/xml'

describe('ODF XML helpers', () => {
  it('escapes XML metacharacters from user content', () => {
    expect(escapeXml(`<tag a="b">Tom & 'Ada'</tag>`)).toBe(
      '&lt;tag a=&quot;b&quot;&gt;Tom &amp; &apos;Ada&apos;&lt;/tag&gt;',
    )
  })

  it('preserves significant whitespace', () => {
    expect(textToXml('one  two\tthree\nfour')).toBe(
      'one <text:s text:c="1"/>two<text:tab/>three<text:line-break/>four',
    )
  })

  it('creates stable bookmark names for Unicode headings', () => {
    expect(slugify('Über den Café!')).toBe('uber-den-cafe')
  })
})
