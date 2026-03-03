'use client'

import dynamic from "next/dynamic"

const PublicPageRenderer = dynamic(
  () => import("./PublicPageRenderer"),
  { ssr: false }
)

export default function PublicPageWithGridLayout({
  appSlug,
  pageSlug,
}: {
  appSlug: string
  pageSlug: string
}) {
  return (
    <div suppressHydrationWarning>
      <PublicPageRenderer appSlug={appSlug} pageSlug={pageSlug} />
    </div>
  )
}
