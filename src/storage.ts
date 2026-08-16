const DRAFT_KEY = 'md2odf:draft:v1'

export interface Draft {
  markdown: string
  filename: string
}

export function loadDraft(): Draft | undefined {
  try {
    const stored = localStorage.getItem(DRAFT_KEY)
    if (!stored) return undefined
    const parsed = JSON.parse(stored) as Partial<Draft>
    if (typeof parsed.markdown !== 'string' || typeof parsed.filename !== 'string') {
      return undefined
    }
    return { markdown: parsed.markdown, filename: parsed.filename }
  } catch {
    return undefined
  }
}

export function saveDraft(draft: Draft): boolean {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}
