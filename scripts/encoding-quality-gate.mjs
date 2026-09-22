/**
 * Encoding quality gate for tracked UI sources.
 * FAIL on U+FFFD, invalid UTF-8, or known mojibake sequences.
 *
 * Usage: node scripts/encoding-quality-gate.mjs [roots...]
 * Default roots: src public index.html
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  'tmp-ofis-filter-shots',
  'tmp-ofis-table-shots',
  'tmp-responsive-quality',
  '.tmp-export-android',
  '.tmp-export-ios',
])

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.html',
  '.htm',
  '.md',
  '.svg',
  '.txt',
  '.yml',
  '.yaml',
])

/** Known mojibake markers (UTF-8 read as Latin-1/CP1252). */
const MOJIBAKE = [
  'Ã¼',
  'Ã¶',
  'Ã§',
  'Ä±',
  'ÅŸ',
  'ÄŸ',
  'Ãœ',
  'Ã–',
  'Ã‡',
  'Ä°',
  'Åž',
  'Äž',
  'â€™',
  'â€œ',
  'â€',
]

/**
 * Allowlist: documented exceptions (path substring → allowed marker).
 * Keep empty unless a real foreign term requires it.
 * @type {{ pathIncludes: string, marker: string, reason: string }[]}
 */
const ALLOWLIST = []

const FFFD = '\uFFFD'
const FFFD_BYTES = Buffer.from([0xef, 0xbf, 0xbd])

function isTextFile(name) {
  return TEXT_EXT.has(path.extname(name).toLowerCase()) || name === 'Dockerfile'
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const st = fs.statSync(dir)
  if (st.isFile()) {
    if (isTextFile(path.basename(dir))) out.push(dir)
    return out
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (isTextFile(ent.name)) out.push(p)
  }
  return out
}

function allowed(file, marker) {
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/')
  return ALLOWLIST.some((a) => rel.includes(a.pathIncludes) && a.marker === marker)
}

function scanFile(file) {
  const buf = fs.readFileSync(file)
  const findings = []
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    findings.push({ kind: 'INVALID_UTF8', line: 0, snippet: 'file is not valid UTF-8' })
    text = buf.toString('utf8')
  }

  if (buf.includes(FFFD_BYTES) || text.includes(FFFD)) {
    text.split(/\r?\n/).forEach((l, i) => {
      if (l.includes(FFFD)) {
        findings.push({ kind: 'U+FFFD', line: i + 1, snippet: l.trim().slice(0, 160) })
      }
    })
  }

  for (const marker of MOJIBAKE) {
    if (!text.includes(marker) || allowed(file, marker)) continue
    text.split(/\r?\n/).forEach((l, i) => {
      if (l.includes(marker)) {
        findings.push({
          kind: 'MOJIBAKE',
          line: i + 1,
          marker,
          snippet: l.trim().slice(0, 160),
        })
      }
    })
  }

  return findings
}

const rootsArg = process.argv.slice(2)
const roots =
  rootsArg.length > 0
    ? rootsArg.map((r) => path.resolve(repoRoot, r))
    : ['src', 'public', 'index.html'].map((r) => path.resolve(repoRoot, r))

const all = []
for (const root of roots) {
  for (const f of walk(root)) {
    for (const h of scanFile(f)) {
      all.push({ file: path.relative(repoRoot, f).replace(/\\/g, '/'), ...h })
    }
  }
}

if (all.length > 0) {
  console.error('ENCODING QUALITY GATE FAILED')
  console.error(JSON.stringify({ count: all.length, findings: all }, null, 2))
  process.exit(1)
}

console.log('ENCODING QUALITY GATE OK')
