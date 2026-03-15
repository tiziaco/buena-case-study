'use client'

import { useMutation } from '@tanstack/react-query'
import type { ExtractionResult } from '@/lib/validators/extraction'

async function uploadAndExtract(file: File): Promise<{ extraction: ExtractionResult; fileRef: string }> {
  if (file.size > 10 * 1024 * 1024) throw new Error('File is too large. Maximum size is 10 MB.')

  const formData = new FormData()
  formData.append('file', file)
  const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!uploadRes.ok) throw new Error('Could not extract data from the PDF. Please fill in the fields manually.')

  const { data: { fileRef } } = await uploadRes.json()

  const extractRes = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileRef }),
  })
  if (!extractRes.ok) throw new Error('Could not extract data from the PDF. Please fill in the fields manually.')

  const { data: extraction } = await extractRes.json()
  return { extraction: extraction as ExtractionResult, fileRef }
}

export function useExtractFromPdf(
  onSuccess: (result: { extraction: ExtractionResult; fileRef: string }) => void,
  onError?: () => void,
) {
  return useMutation({
    mutationFn: uploadAndExtract,
    onSuccess,
    onError,
  })
}
