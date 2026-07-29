import { test, expect } from '@playwright/test'
import { assertEditableTextField, tabToNext } from './helpers/inputMatrix'

test.describe('Giriş ekranı input matrisi', () => {
  test('identifier ve şifre alanlarına yazma / silme / TR karakter / Tab', async ({ page }) => {
    await page.goto('/login')
    const identifier = page.getByLabel(/e-posta veya kullanıcı/i)
    const sifre = page.getByLabel(/^şifre$/i)

    await assertEditableTextField(page, identifier, { turkish: true })
    await identifier.fill('deneme.kullanici')
    await tabToNext(page)
    await expect(sifre).toBeFocused()

    await sifre.fill('')
    await sifre.type('Aa1!ğüş', { delay: 20 })
    await expect(sifre).toHaveValue('Aa1!ğüş')
    await sifre.press('Control+A')
    await sifre.type('YeniSifre', { delay: 15 })
    await expect(sifre).toHaveValue('YeniSifre')
    await sifre.fill('')
    await sifre.type('son', { delay: 30 })
    await sifre.press('Backspace')
    await expect(sifre).toHaveValue('so')

    // Hatalı giriş sonrası alanlar yazılabilir kalsın
    await identifier.fill('olmayan.kullanici')
    await sifre.fill('yanlis-sifre')
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page.getByText(/giriş başarısız|hatalı|bulunamadı|geçersiz/i).first()).toBeVisible({
      timeout: 15_000
    })
    await assertEditableTextField(page, identifier, { turkish: true, clearAndRetype: true })
  })

  test('şifremi unuttum formu yazılabilir', async ({ page }) => {
    await page.goto('/forgot-password')
    const email = page.getByLabel(/e-posta/i).first()
    await assertEditableTextField(page, email, { turkish: false })
  })
})
