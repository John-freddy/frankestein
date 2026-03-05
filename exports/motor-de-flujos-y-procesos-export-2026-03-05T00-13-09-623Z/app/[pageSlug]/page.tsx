import { notFound } from 'next/navigation'
import { appData } from '@/lib/app-data'
import { PageRenderer } from '@/components/PageRenderer'

interface Props {
  params: Promise<{ pageSlug: string }>
}

export default async function ExportedPage({ params }: Props) {
  const { pageSlug } = await params
  const page = appData.pages.find((item) => item.url === pageSlug)

  if (!page) return notFound()

  return (
    <main className="app-main">
      <PageRenderer widgets={page.widgets} />
    </main>
  )
}
