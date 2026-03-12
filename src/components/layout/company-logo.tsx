"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"

export function CompanyLogo() {
  const { state } = useSidebar()
  const { resolvedTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use theme as fallback during SSR to prevent hydration mismatch
  const currentTheme = mounted ? (resolvedTheme || theme) : theme
  const logoSrc = currentTheme === "dark" 
    ? "/images/buena-logo-white.png" 
    : "/images/buena-logo-black.png"

  return (
    <SidebarMenu className="mb-10">
      <SidebarMenuItem>
        <div className="flex items-center ml-1" suppressHydrationWarning>
          {state === "collapsed" && (
            <Image
              src={logoSrc}
              alt="App Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
          )}
          {state !== "collapsed" && (
            <div className="flex items-center gap-6">
              <Image
                src={logoSrc}
                alt="App Logo"
                width={250}
                height={40}
                className="h-10 w-auto object-contain"
              />
              <span className="text-3xl font-bold">Buen(it)a</span>
            </div>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}