'use client'

import React, { useEffect } from 'react'
import { GridCanvas } from './GridCanvas'
import { usePageStore } from '@/store/usePageStore'
import type { PageLayout } from '@/types/layout'

/**
 * Página pública de la app - componentes en modo read-only con grid layout
 */
export default function PublicPageRenderer({
  initialLayout,
}: {
  initialLayout: PageLayout
}) {
  const { setLayout, setLoading, setError, error } =
    usePageStore()

  useEffect(() => {
    setError(null)
    setLoading(false)
    setLayout(initialLayout)
  }, [initialLayout, setLayout, setLoading, setError])

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
