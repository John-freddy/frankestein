import PublicPageRenderer from "./PublicPageRenderer"
import type { PageLayout } from "@/types/layout"

export default function PublicPageWithGridLayout({
  initialLayout,
}: {
  initialLayout: PageLayout
}) {
  return (
    <div suppressHydrationWarning>
      <PublicPageRenderer initialLayout={initialLayout} />
    </div>
  )
}
