import './styles.css'
import { renderPreview } from './markdown/preview'
import { createOdt, odtBlob } from './odt/export'
import { starterMarkdown } from './starter'
import { clearDraft, loadDraft, saveDraft } from './storage'
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme'

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector)
  if (!found) throw new Error(`Missing required element: ${selector}`)
  return found
}

const markdown = element<HTMLTextAreaElement>('#markdown')
const filename = element<HTMLInputElement>('#filename')
const preview = element<HTMLDivElement>('#preview')
const downloadButton = element<HTMLButtonElement>('#download')
const clearButton = element<HTMLButtonElement>('#clear')
const insertImageButton = element<HTMLButtonElement>('#insert-image')
const imageInput = element<HTMLInputElement>('#image-input')
const saveStatus = element<HTMLSpanElement>('#save-status')
const message = element<HTMLParagraphElement>('#message')
const themeToggle = element<HTMLInputElement>('#theme-toggle')

const draft = loadDraft()
markdown.value = draft?.markdown || starterMarkdown
filename.value = draft?.filename || 'document'
const initialTheme = loadTheme()
applyTheme(initialTheme)
themeToggle.checked = initialTheme === 'dark'

let saveTimer: number | undefined
let messageTimer: number | undefined

function updatePreview(): void {
  preview.innerHTML = renderPreview(markdown.value)
}

function queueSave(): void {
  window.clearTimeout(saveTimer)
  saveStatus.textContent = 'Saving…'
  saveTimer = window.setTimeout(() => {
    const saved = saveDraft({ markdown: markdown.value, filename: filename.value })
    saveStatus.textContent = saved
      ? 'Saved locally'
      : 'Draft is too large for local storage'
  }, 250)
}

function showMessage(text: string, success = false): void {
  window.clearTimeout(messageTimer)
  message.textContent = text
  message.classList.toggle('success', success)
  if (success) {
    messageTimer = window.setTimeout(() => {
      message.textContent = ''
      message.classList.remove('success')
    }, 4500)
  }
}

function safeFilename(value: string): string {
  return (
    value
      .trim()
      .replace(/\.odt$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '-') || 'document'
  )
}

async function downloadDocument(): Promise<void> {
  downloadButton.disabled = true
  downloadButton.textContent = 'Building document…'
  showMessage('')

  try {
    const name = safeFilename(filename.value)
    const bytes = await createOdt(markdown.value, { title: name })
    const url = URL.createObjectURL(odtBlob(bytes))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${name}.odt`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    showMessage(`${name}.odt is ready.`, true)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : 'Could not create the document.')
  } finally {
    downloadButton.disabled = false
    downloadButton.textContent = 'Download ODT'
  }
}

function insertAtCursor(text: string): void {
  const start = markdown.selectionStart
  const end = markdown.selectionEnd
  markdown.setRangeText(text, start, end, 'end')
  markdown.focus()
  updatePreview()
  queueSave()
}

markdown.addEventListener('input', () => {
  updatePreview()
  queueSave()
})

filename.addEventListener('input', queueSave)
downloadButton.addEventListener('click', () => void downloadDocument())
themeToggle.addEventListener('change', () => {
  const theme: Theme = themeToggle.checked ? 'dark' : 'light'
  applyTheme(theme)
  saveTheme(theme)
})

clearButton.addEventListener('click', () => {
  markdown.value = ''
  clearDraft()
  updatePreview()
  markdown.focus()
  saveStatus.textContent = 'Draft cleared'
})

insertImageButton.addEventListener('click', () => imageInput.click())
imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.addEventListener('load', () => {
    if (typeof reader.result !== 'string') return
    const alt = file.name.replace(/\.[^.]+$/, '')
    insertAtCursor(`![${alt}](${reader.result})`)
    imageInput.value = ''
  })
  reader.addEventListener('error', () => showMessage(`Could not read ${file.name}.`))
  reader.readAsDataURL(file)
})

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    void downloadDocument()
  }
})

updatePreview()
