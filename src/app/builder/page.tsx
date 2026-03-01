import { auth } from "@/auth"
import { signOut } from "@/auth"

export default async function BuilderPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Frank Builder</h1>
            <p className="text-slate-500 text-sm mt-1">
              Bienvenido, {(session?.user as any)?.nombre} — {(session?.user as any)?.rol}
            </p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-400 text-sm">
            ✅ Fase 1A completa — Auth funcionando
          </p>
          <p className="text-slate-300 text-xs mt-2">
            Próximo: App Shell y CRUD de aplicaciones (Fase 1B)
          </p>
        </div>
      </div>
    </div>
  )
}