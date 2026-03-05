"use client"

import { useState } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Topbar } from "@/components/layout/topbar"
import { SidebarNav } from "@/components/layout/sidebar-nav"

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen">
        <Topbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex flex-1 overflow-hidden">
          <SidebarNav collapsed={collapsed} />
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}