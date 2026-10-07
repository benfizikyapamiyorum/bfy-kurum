// Kurum görüşmesi sunumu: slaytlar arasında gezinme, canlı ekrana geçiş ve sunuma dönüş; demo kitapçık çıktısı.

import { expect, test } from '@playwright/test'

test('sunum klavye ve tıklamayla ilerler', async ({ page }) => {
  const hatalar: string[] = []
  page.on('pageerror', (e) => hatalar.push(e.message))
  await page.goto('/sunum')
  await expect(page.locator('.slayt h1')).toHaveText('Fizik Kurs Sistemi')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.sunum-sayac')).toHaveText(/^2 \//)
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.sunum-sayac')).toHaveText(/^1 \//)
  await page.getByRole('button', { name: 'Sonraki slayt' }).click()
  await expect(page.locator('.sunum-sayac')).toHaveText(/^2 \//)
  expect(hatalar).toEqual([])
})

test('canlı ekrana geçilir, "Sunuma dön" aynı slayta getirir', async ({ page }) => {
  await page.goto('/sunum?adim=7')
  await expect(page.locator('.sunum-sayac')).toHaveText(/^8 \//)
  await page.getByRole('button', { name: /Sınıf raporunu aç/ }).click()
  await expect(page).toHaveURL(/\/demo\/rapor$/)
  await page.getByRole('button', { name: 'Sunuma dön' }).click()
  await expect(page).toHaveURL(/\/sunum\?adim=7$/)
  await expect(page.locator('.sunum-sayac')).toHaveText(/^8 \//)
  await expect(page.getByRole('button', { name: 'Sunuma dön' })).toHaveCount(0)
})

test('sunuma girilmeden "Sunuma dön" görünmez', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sunuma dön' })).toHaveCount(0)
})

test('demo kitapçık: öğrenci, cevaplı ve optik form', async ({ page }) => {
  await page.goto('/demo/yazdir/ogrenci')
  await expect(page.locator('.kitapcik .y-soru').first()).toBeVisible()
  await expect(page.locator('.y-cozum')).toHaveCount(0)
  await page.getByRole('link', { name: 'Cevaplı öğretmen kitapçığı' }).click()
  await expect(page.locator('.cevap-anahtari')).toBeVisible()
  await page.getByRole('link', { name: 'Optik form' }).click()
  await expect(page.locator('.optik .yuvarlak').first()).toBeVisible()
})
