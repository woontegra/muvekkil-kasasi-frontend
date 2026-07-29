import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as setup, expect } from '@playwright/test'
import { apiBase, loadE2eEnv, requireE2eUser } from './helpers/env'

const here = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(here, '.auth', 'user.json')

setup('büro sahibi oturumu', async ({ page, request }) => {
  loadE2eEnv()
  mkdirSync(path.dirname(authFile), { recursive: true })

  const { user, password } = requireE2eUser()
  const health = await request.get(`${apiBase()}/health`)
  expect(health.ok(), 'Backend /health erişilebilir olmalı').toBeTruthy()

  await page.goto('/login')
  await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
  await page.getByLabel(/^şifre$/i).fill(password)
  await page.getByRole('button', { name: /giriş yap/i }).click()

  // İlk giriş onboarding (lisans/şifre) varsa atlanamaz — test tenant MANUEL olmalı
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })
  await page.context().storageState({ path: authFile })
})
