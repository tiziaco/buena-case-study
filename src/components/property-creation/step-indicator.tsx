'use client'

import { cn } from '@/lib/utils'

const STEPS = [
  { n: 1 as const, label: 'General Info' },
  { n: 2 as const, label: 'Buildings' },
  { n: 3 as const, label: 'Units' },
]

interface StepIndicatorProps {
  step: 1 | 2 | 3
  highestStepReached: 1 | 2 | 3
  onStepClick: (step: 1 | 2 | 3) => void
}

export function StepIndicator({ step, highestStepReached, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map(({ n, label }, i) => {
        const isCompleted = n < highestStepReached
        const isCurrent = n === step
        const isClickable = isCompleted

        return (
          <div key={n} className="flex items-center gap-0">
            {i > 0 && (
              <div
                className={cn(
                  'h-px w-12',
                  isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                )}
              />
            )}

            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(n)}
              className={cn(
                'flex flex-col items-center gap-1.5 group',
                isClickable ? 'cursor-pointer' : 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  !isCurrent && !isCompleted && 'border-border text-muted-foreground'
                )}
              >
                {n}
              </div>
              <span
                className={cn(
                  'text-xs',
                  isCurrent || isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
