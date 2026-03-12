"use client"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"

export function CompanyLogo() {
  const { state } = useSidebar()
  const { resolvedTheme } = useTheme()

  const logoSrc = resolvedTheme === "dark" 
    ? "/images/buena-logo-white.png" 
    : "/images/buena-logo-black.png"

  return (
    <SidebarMenu className="mb-10">
      <SidebarMenuItem>
        <div className="flex items-center gap-2">
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
            <Image
              src={logoSrc}
              alt="App Logo"
              width={250}
              height={40}
              className="h-10 w-auto object-contain"
            />
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}