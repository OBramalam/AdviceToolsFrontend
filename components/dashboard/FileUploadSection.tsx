'use client'

// File upload section for creating a plan from a document (PDF, DOC, TXT, images, etc.)

import { useState, ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useUploadConversationFile } from '@/lib/hooks/useUpload'

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.html', '.csv', '.tsv',
  '.xlsx', '.xls', '.ods', '.ppt', '.pptx', '.png', '.jpg', '.jpeg',
  '.gif', '.bmp', '.tiff', '.webp', '.svg', '.epub', '.xml',
]

const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',')

const MAX_SIZE_MB = 25
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export interface FileUploadSectionProps {
  onUploadSuccess?: (planId: number) => void
}

export function FileUploadSection({ onUploadSuccess }: FileUploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useUploadConversationFile()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0] || null
    if (!file) {
      setSelectedFile(null)
      return
    }

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      setError(
        'Unsupported file type. Supported: PDF, DOC, DOCX, TXT, RTF, HTML, CSV, TSV, XLSX, XLS, ODS, PPT, PPTX, PNG, JPG, GIF, BMP, TIFF, WEBP, SVG, EPUB, XML.'
      )
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selectedFile) {
      setError('Please select a supported file to upload.')
      return
    }

    try {
      const result = await uploadMutation.mutateAsync(selectedFile)
      if (!result.success) {
        setError('Upload failed. Please check your file and try again.')
        return
      }

      if (result.financial_plan?.id && onUploadSuccess) {
        onUploadSuccess(result.financial_plan.id)
      }
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'An unexpected error occurred while uploading.'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="w-full max-w-md">
        <label
          htmlFor="plan-upload"
          className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">
            {selectedFile ? 'Change file' : 'Upload document'}
          </span>
          <span className="mt-1 text-xs text-gray-500">
            PDF, DOC, DOCX, TXT, images, and more. Max {MAX_SIZE_MB}MB.
          </span>
        </label>
        <input
          id="plan-upload"
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <p className="mt-2 text-xs text-gray-600 truncate">
            Selected file: <span className="font-medium">{selectedFile.name}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="w-full max-w-md text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        className="mt-2"
        isLoading={uploadMutation.isPending}
        disabled={!selectedFile}
      >
        Create plan from document
      </Button>
    </form>
  )
}


