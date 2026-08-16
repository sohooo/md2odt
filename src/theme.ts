export type Theme = 'light' | 'dark'

const THEME_KEY = 'md2odf:theme:v1'

function systemTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : systemTheme()
  } catch {
    return systemTheme()
  }
}

export function saveTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
