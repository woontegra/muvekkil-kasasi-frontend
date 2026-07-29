import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** e2e/.env.e2e dosyasını process.env'e yükler (varsa). */
export function loadE2eEnv(): void {
  const envPath = path.resolve(here, '../.env.e2e')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

export function requireE2eUser(): { user: string; password: string } {
  loadE2eEnv()
  const user = process.env.E2E_USER?.trim()
  const password = process.env.E2E_PASSWORD?.trim()
  if (!user || !password) {
    throw new Error(
      'E2E_USER ve E2E_PASSWORD gerekli. e2e/.env.e2e.example dosyasını e2e/.env.e2e olarak kopyalayın.'
    )
  }
  return { user, password }
}

export function apiBase(): string {
  loadE2eEnv()
  return (process.env.E2E_API_URL ?? 'http://localhost:4100').replace(/\/$/, '')
}
