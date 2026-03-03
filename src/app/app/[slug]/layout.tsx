import { Toaster } from "@/components/ui/sonner"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <Toaster richColors position="bottom-right" />
    </div>
  )
}