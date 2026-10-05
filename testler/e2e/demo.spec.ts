import { expect, test } from '@playwright/test'

test('demo: kayıt olmadan örnek test çözülür, net gerçek kuralla hesaplanır', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Demoyu dene' }).click()
  await expect(page).toHaveURL(/\/demo$/)
  await page.getByRole('link', { name: /Öğrenci: online test/ }).click()

  // Yalnızca puanlanan türler: 6 çoktan seçmeli + 2 doğru/yanlış.
  await expect(page.getByText('Soru 1 / 8')).toBeVisible()
  // 1. soruyu boş bırak, 2. soruda bir seçenek işaretle, gerisi boş.
  await page.getByRole('button', { name: 'Sonraki' }).click()
  await page.getByRole('radio').first().click()
  await expect(page.getByRole('button', { name: '2. soru, cevaplandı' })).toBeVisible()
  await page.getByRole('button', { name: '8. soru' }).click()
  await page.getByRole('button', { name: 'Testi bitir' }).click()
  await expect(page.getByRole('dialog')).toContainText('7 soruyu boş bıraktın.')
  await page.getByRole('button', { name: 'Evet, bitir' }).click()

  const sonuc = page.getByRole('region', { name: 'Sonuç' })
  await expect(sonuc).toContainText('7 boş')
  // 2. soru doğru/yanlış: ilk seçenek "Doğru"; anahtarı Y olduğundan yanlış sayılır, net 0 − 1/4.
  await expect(sonuc).toContainText('0 doğru')
  await expect(sonuc).toContainText('1 yanlış')
  await expect(sonuc).toContainText('-0,25')
  await page.getByRole('button', { name: 'Yeniden çöz' }).click()
  await expect(page.getByText('Soru 1 / 8')).toBeVisible()
})

test('demo raporu: zayıf çıktılar simge ve yazıyla işaretli, sayfa telefonda taşmaz', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/demo/rapor')
  await expect(page.getByText('örnek veridir')).toBeVisible()
  await expect(page.locator('.zayif-rozet')).toHaveCount(2)
  await page.getByRole('button', { name: 'Telafi testi oluştur' }).click()
  await expect(page.getByText('Lisanslı kurumda bu düğme')).toBeVisible()
  await page.getByRole('button', { name: 'Mert Kaya' }).click()
  await expect(page.getByRole('region', { name: 'Mert Kaya raporu' })).toBeVisible()
  const genislik = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(genislik).toBeLessThanOrEqual(390)
})
