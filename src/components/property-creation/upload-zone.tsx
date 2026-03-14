'use client'

import { FileText, Loader2, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface UploadZoneProps {
  file: File | null
  isExtracting: boolean
  onFile: (f: File) => void
  onClear: () => void
}

export function UploadZone({ file, isExtracting, onFile, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') onFile(f)
  }

  if (isExtracting) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-5 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Extracting data from PDF…</p>
      </div>
    )
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary/10 px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB · Form auto-filled
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-primary/20 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-5 text-center transition-all',
        dragging
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-primary hover:bg-primary/10',
      )}
    >
      <UploadCloud
        className={cn(
          'h-7 w-7 transition-colors',
          dragging ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <div>
        <p className="text-sm font-medium text-foreground">Upload PDF to auto-fill</p>
        <p className="text-xs text-muted-foreground">Drag & drop or click · PDF up to 10 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </div>
  )
}
