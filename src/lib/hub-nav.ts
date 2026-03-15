"use client"

import { HomeIcon, FileText } from "lucide-react"
import type { NavItem } from "@/types/nav"

/**
 * Default hub navigation (used by HubSidebar when no items prop is provided)
 */
export const HUB_NAV: NavItem[] = [
  { title: "Dashboard",
    url: "/dashboard",
    icon: HomeIcon
  },
  {
    title: "Contracts",
    url: "/contracts",
    icon: FileText,
  },
]
