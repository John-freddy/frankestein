import { performance } from 'node:perf_hooks'

const [baseUrlArg, ...paths] = process.argv.slice(2)

if (!baseUrlArg || paths.length === 0) {
  console.error('Uso: node scripts/benchmark-http.mjs <baseUrl> <path1> [path2] ...')
  console.error('Ejemplo: node scripts/benchmark-http.mjs http://localhost:3000 /app/mi-app/inicio /builder')
  process.exit(1)
}

const baseUrl = baseUrlArg.replace(/\/$/, '')
const runs = 8
const warmupRuns = 1

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const avg = values.reduce((acc, value) => acc + value, 0) / values.length
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
  const p95 = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)]
  return { avg, median, p95, min: sorted[0], max: sorted[sorted.length - 1] }
}

async function hit(url) {
  const started = performance.now()
  const response = await fetch(url, { method: 'GET' })
  await response.arrayBuffer()
  const elapsed = performance.now() - started
  return { elapsed, status: response.status }
}

for (const path of paths) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${baseUrl}${normalizedPath}`

  for (let index = 0; index < warmupRuns; index += 1) {
    await hit(url)
  }

  const results = []
  for (let index = 0; index < runs; index += 1) {
    results.push(await hit(url))
  }

  const times = results.map((item) => item.elapsed)
  const summary = stats(times)
  const statusSet = [...new Set(results.map((item) => item.status))]

  console.log(`\n${normalizedPath}`)
  console.log(`  status: ${statusSet.join(', ')}`)
  console.log(`  avg: ${summary.avg.toFixed(1)}ms`)
  console.log(`  median: ${summary.median.toFixed(1)}ms`)
  console.log(`  p95: ${summary.p95.toFixed(1)}ms`)
  console.log(`  min/max: ${summary.min.toFixed(1)}ms / ${summary.max.toFixed(1)}ms`)
}
