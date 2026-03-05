"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/store/useAppStore"

export function SessionStoreSync() {
  const { data: session } = useSession()
  const setUsuario = useAppStore((state) => state.setUsuario)

  useEffect(() => {
    if (session?.user) {
      setUsuario({
        id: (session.user as any).id ?? "",
        nombre: (session.user as any).nombre ?? session.user.name ?? "",
        email: session.user.email ?? "",
        rol: (session.user as any).rol ?? "viewer",
      })
    } else {
      setUsuario(null)
    }
  }, [session, setUsuario])

  return null
}
