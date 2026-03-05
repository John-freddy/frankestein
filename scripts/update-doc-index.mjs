import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const DOC_ROOT = "documentacion"
const AGREEMENTS_ROOT = path.join(DOC_ROOT, "01-acuerdos-implementados")
const README_PATH = path.join(DOC_ROOT, "README.md")

const START_MARKER = "<!-- ACUERDOS_AUTO_START -->"
const END_MARKER = "<!-- ACUERDOS_AUTO_END -->"

function walk(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }

    if (entry.isFile() && /^ACUERDO_.*\.md$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/")
}

function parseAgreement(filePath) {
  const content = readFileSync(filePath, "utf8")

  const titleMatch = content.match(/^#\s*Acuerdo Final\s*—\s*(.+?)\s*\((\d{4}-\d{2}-\d{2})\)\s*$/m)
  const statusMatch = content.match(/##\s*Estado\s*[\r\n]+[\r\n]*\*\*(.+?)\*\*/m)

  const fileName = path.basename(filePath)
  const fileDateMatch = fileName.match(/_(\d{4}-\d{2}-\d{2})\.md$/)

  const tema = titleMatch?.[1]?.trim() ?? fileName.replace(/^ACUERDO_/, "").replace(/_\d{4}-\d{2}-\d{2}\.md$/i, "").replace(/_/g, " ")
  const fecha = titleMatch?.[2] ?? fileDateMatch?.[1] ?? ""
  const estado = statusMatch?.[1]?.trim() ?? "N/D"

  const relPath = toPosix(path.relative(DOC_ROOT, filePath))

  return { tema, fecha, estado, relPath }
}

function buildAutoSection(agreements) {
  const sorted = [...agreements].sort((a, b) => a.tema.localeCompare(b.tema, "es"))

  const bulletLines = sorted.map((a) => `- ${a.tema}: \`${a.relPath}\``)
  const tableLines = [
    "| Tema | Estado | Fecha | Documento |",
    "|---|---|---|---|",
    ...sorted.map((a) => `| ${a.tema} | ${a.estado} | ${a.fecha} | \`${a.relPath}\` |`),
  ]

  return [
    START_MARKER,
    "## Acuerdos implementados (índice rápido)",
    "",
    ...bulletLines,
    "",
    "## Estado actual (consolidado)",
    "",
    ...tableLines,
    END_MARKER,
  ].join("\n")
}

function main() {
  const agreementFiles = walk(AGREEMENTS_ROOT)
  const agreements = agreementFiles.map(parseAgreement)
  const autoSection = buildAutoSection(agreements)

  const readme = readFileSync(README_PATH, "utf8")

  const startIndex = readme.indexOf(START_MARKER)
  const endIndex = readme.indexOf(END_MARKER)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error("No se encontraron marcadores de autogeneración en documentacion/README.md")
  }

  const before = readme.slice(0, startIndex)
  const after = readme.slice(endIndex + END_MARKER.length)
  const nextContent = `${before}${autoSection}${after}`

  writeFileSync(README_PATH, nextContent)

  console.log(`Índice actualizado con ${agreements.length} acuerdos.`)
}

main()
