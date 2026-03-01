import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  const usuariosExistentes = await prisma.usuario.count()
  if (usuariosExistentes > 0) {
    console.log("✅ Ya existen usuarios. Seed omitido.")
    return
  }

  const config = await prisma.configuracion.create({
    data: {
      nombreOrganizacion: "Mi Organización",
      slug: "mi-org",
    },
  })
  console.log("✅ Configuración creada:", config.nombreOrganizacion)

  const passwordHash = await bcrypt.hash("admin123", 12)
  const admin = await prisma.usuario.create({
    data: {
      email: "admin@frank.local",
      nombre: "Administrador",
      passwordHash,
      rol: "ADMIN",
      activo: true,
    },
  })
  console.log("✅ Admin creado:", admin.email)
  console.log("")
  console.log("🔑 Credenciales iniciales:")
  console.log("   Email:      admin@frank.local")
  console.log("   Contraseña: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })