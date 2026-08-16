import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, loadTheme, saveTheme } from '../src/theme'

describe('theme preference', () => {
  const values = new Map<string, string>()

  beforeEach(() => {
    values.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
  })

  it('saves and reloads the selected dark theme', () => {
    expect(saveTheme('dark')).toBe(true)
    expect(loadTheme()).toBe('dark')
  })

  it('uses the system preference until a theme is selected', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    expect(loadTheme()).toBe('dark')

    values.set('md2odf:theme:v1', 'invalid')
    expect(loadTheme()).toBe('dark')
  })

  it('applies the selected theme to the document root', () => {
    const documentElement = { dataset: {} as Record<string, string>, style: { colorScheme: '' } }
    vi.stubGlobal('document', { documentElement })

    applyTheme('dark')

    expect(documentElement.dataset.theme).toBe('dark')
    expect(documentElement.style.colorScheme).toBe('dark')
  })
})
