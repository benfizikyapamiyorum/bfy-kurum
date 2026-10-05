import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { admin, kullaniciAc, kurumAc, SIFRE } from './yardimci'

const PAKET = resolve(import.meta.dirname, '../../icerik-paketleri/kaldirma-kuvveti.json')

async function superGiris(page: Page) {
  const eposta = `super-${Math.random().toString(36).slice(2, 8)}@deneme.test`
  await kullaniciAc(eposta, 'superadmin', 'Süper Admin', null)
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğretmen ve yönetici' }).click()
  await page.getByLabel('E-posta').fill(eposta)
  await page.getByLabel('Şifre').fill(SIFRE)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page).toHaveURL(/\/yonetim$/)
}

test('süper admin: kurum ve yönetici açar, lisansı uzatır, kurumu kapatır', async ({ page }) => {
  await superGiris(page)
  const r = Math.random().toString(36).slice(2, 7).toUpperCase()
  const ad = `Yeni Kurs ${r}`
  await page.getByText('Yeni kurum').click()
  await page.getByLabel('Kurum adı').fill(ad)
  await page.getByLabel(/Kurum kodu/).fill(`Y${r}`)
  await page.getByLabel('Kurum yöneticisi ad soyad').fill('Ayşe Yönetici')
  await page.getByLabel('Kurum yöneticisi e-posta').fill(`ayse-${r.toLowerCase()}@deneme.test`)
  await page.getByRole('button', { name: 'Kurumu oluştur' }).click()
  await expect(page.getByText('1 hesap açıldı')).toBeVisible()
  await page.getByRole('button', { name: 'Kapat' }).first().click()

  const satir = page.getByRole('row', { name: new RegExp(ad) })
  await expect(satir).toContainText('Ayşe Yönetici')
  await expect(satir).toContainText(`Y${r}`)

  const duzen = page.getByRole('region', { name: `${ad} düzenleme` })
  await expect(duzen).toBeVisible()
  const { data: once } = await admin.from('kurum').select('id, lisans_bitis').eq('ad', ad).single()
  await duzen.getByRole('button', { name: '1 ay uzat' }).click()
  await expect(duzen.getByRole('status')).toContainText('Lisans')
  const { data: sonra } = await admin.from('kurum').select('lisans_bitis, aktif').eq('id', once!.id).single()
  expect(sonra!.lisans_bitis > once!.lisans_bitis).toBe(true)

  await duzen.getByRole('button', { name: 'Kurumu kapat' }).click()
  await expect(duzen.getByRole('status')).toContainText('Kurum kapatıldı')
  await expect(page.getByRole('row', { name: new RegExp(ad) })).toContainText('kapalı')
})

test('süper admin: paketi içe aktarır, soruyu düzenler; konu anlatımı tahtada açılır', async ({ page }) => {
  await superGiris(page)
  await page.getByRole('link', { name: 'Toplu içe aktarım' }).click()
  await page.getByLabel('JSON dosyası seçin').setInputFiles(PAKET)
  await expect(page.getByText('1 ünite, 2 kazanım, 12 soru, 1 içerik.')).toBeVisible()
  await page.getByRole('button', { name: 'İçe aktar' }).click()
  await expect(page.getByRole('status')).toContainText('Aktarım tamamlandı')

  // Soru bankası: dış kimlikle bul, düzenle.
  await page.getByRole('link', { name: 'Soru bankası' }).click()
  await page.getByLabel('Ara').fill('kaldirma-kuvveti/S8')
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('link', { name: 'Düzenle' }).click()
  await expect(page.getByLabel('A seçeneği')).toHaveValue('K–L ve M–N')
  await expect(page.getByLabel('A neden yanlış')).toHaveValue(/K–L ve M–N çiftlerinde/)
  await page.getByLabel('Ölçülen beceri').fill('Deney tasarımı')
  await page.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.getByRole('status')).toHaveText('Soru kaydedildi.')
  const { data } = await admin.from('soru').select('beceri').eq('dis_kimlik', 'fizik-atolye/kaldirma-kuvveti/S8').single()
  expect(data!.beceri).toBe('Deney tasarımı')

  // Konu anlatımı tahtada bölüm bölüm.
  await page.getByRole('link', { name: 'İçerikler' }).click()
  await page.getByRole('row', { name: /Kaldırma kuvveti: kavram rehberi/ }).getByRole('link', { name: 'Aç' }).click()
  await expect(page).toHaveURL(/\/tahta\/konu\//)
  await expect(page.getByRole('heading', { name: 'Kaldırma kuvveti nedir?' })).toBeVisible()
  await expect(page.locator('.konu-sekli svg')).toBeVisible()
  await page.getByRole('button', { name: 'Sonraki' }).click()
  await expect(page.getByRole('heading', { name: 'Batan hacim ve Arşimet ilkesi' })).toBeVisible()
  await page.getByRole('button', { name: 'Ders akışı' }).click()
  await expect(page.getByRole('complementary', { name: 'Ders akışı' })).toContainText('Ön kontrol')
})

test('süper admin olmayan /yonetim sayfasını açamaz', async ({ page }) => {
  const eposta = `ogretmen-${Math.random().toString(36).slice(2, 8)}@deneme.test`
  const k = await kurumAc()
  await kullaniciAc(eposta, 'ogretmen', 'Öğretmen', k.id)
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğretmen ve yönetici' }).click()
  await page.getByLabel('E-posta').fill(eposta)
  await page.getByLabel('Şifre').fill(SIFRE)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page).toHaveURL(/\/ogretmen$/)
  await page.goto('/yonetim')
  await expect(page.getByRole('heading', { name: 'Süper admin' })).toHaveCount(0)
})
