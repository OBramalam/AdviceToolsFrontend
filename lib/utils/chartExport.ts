import { toBlob } from 'html-to-image'

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface FileSystemWritableFileStreamLike {
  write(data: Blob): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableFileStreamLike>
}

interface WindowWithFilePicker extends Window {
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions
  ) => Promise<FileSystemFileHandleLike>
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').toLowerCase()
}

function buildDefaultFilename(baseName: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${sanitizeFilename(baseName)}-${date}.png`
}

async function saveWithPicker(blob: Blob, filename: string): Promise<boolean> {
  const pickerWindow = window as WindowWithFilePicker
  if (!pickerWindow.showSaveFilePicker) return false

  const handle = await pickerWindow.showSaveFilePicker({
    suggestedName: filename,
    types: [
      {
        description: 'PNG Image',
        accept: { 'image/png': ['.png'] },
      },
    ],
  })
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
  return true
}

function saveWithDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function hideExportExcludedElements(root: HTMLElement): () => void {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>('[data-export-hide="true"]')
  )
  const previousDisplayValues = elements.map((el) => el.style.display)
  elements.forEach((el) => {
    el.style.display = 'none'
  })

  return () => {
    elements.forEach((el, index) => {
      el.style.display = previousDisplayValues[index]
    })
  }
}

export async function exportElementAsPng(
  element: HTMLElement,
  baseName: string
): Promise<void> {
  const restoreHiddenElements = hideExportExcludedElements(element)
  let blob: Blob | null = null
  try {
    blob = await toBlob(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    })
  } finally {
    restoreHiddenElements()
  }

  if (!blob) {
    throw new Error('Failed to generate chart image')
  }

  const filename = buildDefaultFilename(baseName)
  try {
    const savedWithPicker = await saveWithPicker(blob, filename)
    if (!savedWithPicker) {
      saveWithDownload(blob, filename)
    }
  } catch (error) {
    // Fallback if picker is unavailable or user cancels/blocks save.
    saveWithDownload(blob, filename)
  }
}
