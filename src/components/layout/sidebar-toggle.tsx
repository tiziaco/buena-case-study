'use client'

import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export function SidebarToggle() {
  const { toggleSidebar, state, isMobile } = useSidebar()

  if (isMobile) return null

  return (
    <button
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
      className="absolute top-4 left-0 -translate-x-1/2 z-20 flex items-center justify-center w-6 h-6 bg-sidebar border border-sidebar-border rounded-lg shadow-sm cursor-pointer hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
    >
      {state === 'expanded'
        ? <PanelRightClose className="size-3.5" />
        : <PanelRightOpen className="size-3.5" />
      }
    </button>
  )
}
