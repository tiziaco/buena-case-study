'use client'

import { Copy, MoreVertical, Trash2 } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UnitRowActionsProps {
  onDuplicate: () => void
  onDelete: () => void
}

export function UnitRowActions({ onDuplicate, onDelete }: UnitRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover/row:opacity-100"
        aria-label="Row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
