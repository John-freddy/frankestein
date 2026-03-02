import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function useAutoSave(
  data: unknown,
  saveFn: (data: unknown) => Promise<void>,
  delay = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // No guardar en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(data)
        toast.success("Guardado", { duration: 1500 })
      } catch {
        toast.error("Error al guardar")
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [data])
}