'use client'

import { Check } from 'lucide-react'

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
    <div className="flex w-full items-center">
      {STEPS.map(({ n, label }, i) => {
        const isCompleted = n < highestStepReached
        const isCurrent = n === step
        const isClickable = isCompleted

        return (
          <div key={n} className={cn('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(n)}
              className={cn(
                'group flex items-center gap-3 transition-opacity',
                isClickable ? 'cursor-pointer' : 'cursor-default',
                !isCurrent && !isCompleted && 'opacity-40',
              )}
            >
              <div
                className={cn(
                  'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all',
                  isCurrent && 'bg-primary text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.4)]',
                  isCompleted && 'bg-primary text-primary-foreground',
                  !isCurrent && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : n}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Step {n}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold leading-tight',
                    isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            </button>

            {i < STEPS.length - 1 && (
              <div className="mx-3 h-px flex-1 bg-muted">
                <div
                  className={cn(
                    'h-full bg-primary transition-all duration-500',
                    isCompleted ? 'w-full' : 'w-0',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
