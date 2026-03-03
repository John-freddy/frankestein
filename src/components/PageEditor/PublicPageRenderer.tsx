'use client'

import React, { useEffect } from 'react'
import { GridCanvas } from './GridCanvas'
import { usePageStore } from '@/store/usePageStore'

/**
 * Página pública de la app - componentes en modo read-only con grid layout
 */
export default function PublicPageRenderer({
  appSlug,
  pageSlug,
}: {
  appSlug: string
  pageSlug: string
}) {
  const { setLayout, setLoading, setError, error } =
    usePageStore()

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/public/apps/${appSlug}/pages/${pageSlug}/layout`
        )

        if (!res.ok) {
          throw new Error('Error al cargar la página')
        }

        const data = await res.json()
        setLayout(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchLayout()
  }, [appSlug, pageSlug, setLayout, setLoading, setError])

  if (error) {
    return (
      <div className="error-page">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  return <GridCanvas isEditing={false} maxWidth={1400} />
}
