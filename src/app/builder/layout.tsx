"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Topbar } from "@/components/layout/topbar"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { useAppStore } from "@/store/useAppStore"

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const setUsuario = useAppStore((state) => state.setUsuario)

  // Sincronizar sesión de NextAuth con el store global
  useEffect(() => {
    if (session?.user) {
      setUsuario({
        id: (session.user as any).id ?? "",
        nombre: session.user.name ?? "",
        email: session.user.email ?? "",
        rol: (session.user as any).rol ?? "viewer",
      })
    } else {
      setUsuario(null)
    }
  }, [session, setUsuario])

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