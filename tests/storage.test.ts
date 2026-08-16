import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearDraft, loadDraft, saveDraft } from '../src/storage'

describe('local draft storage', () => {
  const values = new Map<string, string>()

  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    })
  })

  it('saves, reloads, and clears a draft without a database', () => {
    expect(saveDraft({ markdown: '# Saved', filename: 'notes' })).toBe(true)
    expect(loadDraft()).toEqual({ markdown: '# Saved', filename: 'notes' })

    clearDraft()
    expect(loadDraft()).toBeUndefined()
  })

  it('ignores malformed stored data', () => {
    values.set('md2odf:draft:v1', '{broken')
    expect(loadDraft()).toBeUndefined()
  })
})
