import { expect, test, type Page } from '@playwright/test'
import { kurumAc, kullaniciAc, SIFRE } from './yardimci'

async function personelGiris(page: Page, eposta: string, sifre = SIFRE) {
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğretmen ve yönetici' }).click()
  await page.getByLabel('E-posta').fill(eposta)
  await page.getByLabel('Şifre').fill(sifre)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
}

async function ogrenciGiris(page: Page, kod: string, kadi: string, sifre: string) {
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğrenci' }).click()
  await page.getByLabel('Kurum kodu ya da sınıf kodu').fill(kod)
  await page.getByLabel('Kullanıcı adı').fill(kadi)
  await page.getByLabel('Şifre').fill(sifre)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
}

test('yönetici: öğretmen ve öğrenci ekler, sınıf açar; öğrenci kurum ve sınıf koduyla girer', async ({ page, browser }) => {
  const kurum = await kurumAc()
  await personelGiris(page, kurum.yoneticiEposta)
  await expect(page).toHaveURL(/\/kurum$/)
  await expect(page.getByRole('heading', { name: kurum.ad })).toBeVisible()
  await expect(page.locator('.kurum-kodu')).toHaveText(kurum.kod)

  // Öğretmen ekle.
  await page.getByRole('link', { name: 'Öğretmenler' }).click()
  await page.getByLabel('Ad soyad').fill('Zeynep Ak')
  await page.getByLabel('E-posta').fill(`zeynep-${kurum.kod.toLowerCase()}@deneme.test`)
  await page.getByLabel(/Şifre/).fill('ogretmen1')
  await page.getByRole('button', { name: 'Hesap aç' }).click()
  await expect(page.getByText('1 hesap açıldı')).toBeVisible()

  // Sınıf aç.
  await page.getByRole('link', { name: 'Sınıflar' }).click()
  await page.getByLabel('Sınıf adı').fill('11-A Sayısal')
  await page.getByRole('button', { name: 'Sınıf aç' }).click()
  const sinifKodu = (await page.locator('.sinif-kodu strong').first().textContent())!.trim()
  expect(sinifKodu).toMatch(/^[A-Z2-9]{6}$/)

  // Excel'den kopyalanmış Türkçe CSV ile toplu öğrenci.
  await page.getByRole('link', { name: 'Öğrenciler' }).click()
  await expect(page.getByRole('heading', { name: 'Excel ya da CSV ile toplu ekle' })).toBeVisible()
  const csv = 'Ad Soyad;Sınıf\r\nAyşe Yılmaz;11-A Sayısal\r\nŞule Işık;11-B\r\n'
  await page.locator('input[type=file]').setInputFiles({ name: 'liste.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByRole('heading', { name: '2 öğrenci eklenecek' })).toBeVisible()
  await page.getByRole('button', { name: '2 hesabı aç' }).click()
  await expect(page.getByText('2 hesap açıldı')).toBeVisible()
  const satir = page.locator('.hesap-sonuclari tr', { hasText: 'Şule Işık' })
  await expect(satir).toContainText('sule.isik')
  const sifre = (await satir.locator('.sifre').textContent())!.trim()
  // Olmayan sınıf (11-B) otomatik açıldı.
  await expect(page.locator('.cip', { hasText: '11-B' })).toBeVisible()

  // Öğrenci, kurum koduyla girer.
  const ogr = await browser.newPage()
  await ogrenciGiris(ogr, kurum.kod.toLowerCase(), 'sule.isik', sifre)
  await expect(ogr).toHaveURL(/\/ogrenci$/)
  await expect(ogr.getByRole('heading', { name: 'Merhaba, Şule Işık.' })).toBeVisible()
  // Öğrenci kurum paneline giremez.
  await ogr.goto('/kurum')
  await expect(ogr.getByRole('heading', { name: 'Bu sayfaya erişiminiz yok.' })).toBeVisible()
  await ogr.close()

  // Ayşe sınıf koduyla da girebilir; önce şifresini sıfırla.
  await page.locator('tr', { hasText: 'Ayşe Yılmaz' }).getByRole('button', { name: 'Şifre sıfırla' }).click()
  const yeni = (await page.locator('.bilgi-kutusu .sifre').textContent())!.trim()
  const ogr2 = await browser.newPage()
  await ogrenciGiris(ogr2, sinifKodu, 'ayse.yilmaz', yeni)
  await expect(ogr2).toHaveURL(/\/ogrenci$/)
  await ogr2.close()

  // Pasifleştirilen öğrenci giremez.
  await page.getByRole('button', { name: 'Kapat' }).click()
  await page.locator('tr', { hasText: 'Ayşe Yılmaz' }).getByRole('button', { name: 'Pasifleştir' }).click()
  await expect(page.locator('tr', { hasText: 'Ayşe Yılmaz' })).toContainText('Pasif')
  const ogr3 = await browser.newPage()
  await ogrenciGiris(ogr3, kurum.kod, 'ayse.yilmaz', yeni)
  await expect(ogr3.getByRole('alert')).toContainText(/kapatılmış|hatalı/)
  await ogr3.close()
})

test('yanlış şifre ve bilinmeyen kod açıklayıcı hata verir', async ({ page }) => {
  const kurum = await kurumAc()
  await personelGiris(page, kurum.yoneticiEposta, 'yanlis-sifre')
  await expect(page.getByRole('alert')).toHaveText('Bilgiler hatalı. Kullanıcı adınızı ve şifrenizi kontrol edin.')
  await ogrenciGiris(page, 'YOKKOD', 'ali', 'x')
  await expect(page.getByRole('alert')).toHaveText('Bu kurum ya da sınıf kodu bulunamadı.')
})

test('öğrenci kontenjanı dolunca hesap açılmaz', async ({ page }) => {
  const kurum = await kurumAc({ ogrenciLimiti: 1 })
  await personelGiris(page, kurum.yoneticiEposta)
  await page.getByRole('link', { name: 'Öğrenciler' }).click()
  await expect(page.getByRole('heading', { name: 'Excel ya da CSV ile toplu ekle' })).toBeVisible()
  const csv = 'Ad Soyad\nBir Öğrenci\nİki Öğrenci\n'
  await page.locator('input[type=file]').setInputFiles({ name: 'l.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await page.getByRole('button', { name: '2 hesabı aç' }).click()
  await expect(page.getByText('1 hesap açıldı, 1 hesap açılamadı')).toBeVisible()
  await expect(page.locator('.hata-listesi')).toContainText('öğrenci kontenjanı dolu')
})

test('lisansı biten kurumda uyarı görünür ve hesap açılamaz', async ({ page }) => {
  const kurum = await kurumAc({ lisansBitti: true })
  await personelGiris(page, kurum.yoneticiEposta)
  await expect(page.getByText('Lisans süresi doldu.').first()).toBeVisible()
  await page.getByRole('link', { name: 'Öğrenciler' }).click()
  await expect(page.getByRole('heading', { name: 'Excel ya da CSV ile toplu ekle' })).toBeVisible()
  await page.getByLabel('Ad soyad').fill('Geç Kalan')
  await page.getByRole('button', { name: 'Hesap aç' }).click()
  await expect(page.locator('.hata-metni')).toContainText('lisansı geçerli değil')
})

test('öğretmen kendi ana sayfasına gider, kurum paneline giremez', async ({ page }) => {
  const kurum = await kurumAc()
  const eposta = `ogretmen-${kurum.kod.toLowerCase()}@deneme.test`
  await kullaniciAc(eposta, 'ogretmen', 'Mehmet Demir', kurum.id)
  await personelGiris(page, eposta)
  await expect(page).toHaveURL(/\/ogretmen$/)
  await expect(page.getByRole('link', { name: /Tahta modu/ }).first()).toBeVisible()
  await page.goto('/kurum')
  await expect(page.getByRole('heading', { name: 'Bu sayfaya erişiminiz yok.' })).toBeVisible()
})

test('yöneticinin yüklediği logo tahtanın köşesinde görünür', async ({ page }) => {
  const kurum = await kurumAc()
  await personelGiris(page, kurum.yoneticiEposta)
  await expect(page.getByRole('heading', { name: 'Kurum adı ve logosu' })).toBeVisible()
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  )
  await page.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByText('Logo yüklendi.')).toBeVisible()
  await page.goto('/tahta')
  const img = page.locator('.tahta-logo img')
  await expect(img).toHaveAttribute('src', new RegExp(`/storage/v1/object/public/logolar/${kurum.id}/logo-`))
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.naturalWidth)).toBe(1)
})
