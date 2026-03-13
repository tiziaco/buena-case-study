'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    toast.error('Something went wrong loading the dashboard.')
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        We couldn&apos;t load the dashboard. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
