import { expect, test, type Page } from '@playwright/test'
import { admin, kullaniciAc, kurumAc, sinifVeOgrenciler, SIFRE } from './yardimci'

async function giris(page: Page, eposta: string) {
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğretmen ve yönetici' }).click()
  await page.getByLabel('E-posta').fill(eposta)
  await page.getByLabel('Şifre').fill(SIFRE)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page).not.toHaveURL(/giris/)
}

async function ogrenciGiris(page: Page, kod: string, kadi: string) {
  await page.goto('/giris')
  await page.getByRole('tab', { name: 'Öğrenci' }).click()
  await page.getByLabel('Kurum kodu ya da sınıf kodu').fill(kod)
  await page.getByLabel('Kullanıcı adı').fill(kadi)
  await page.getByLabel('Şifre').fill(SIFRE)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page).toHaveURL(/\/ogrenci$/)
}

test('test oluştur, ata, öğrenci online çözsün, öğretmen kâğıt sonucunu elle girsin', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const kurum = await kurumAc()
  const eposta = `ogt-${kurum.kod.toLowerCase()}@deneme.test`
  await kullaniciAc(eposta, 'ogretmen', 'Mehmet Demir', kurum.id)
  const { ogrenciler } = await sinifVeOgrenciler(kurum, ['Ayşe Yılmaz', 'Can Kaya'])

  // ---- Öğretmen: test oluştur ----
  await giris(page, eposta)
  await page.goto('/testler/yeni')
  await page.getByLabel('Sınıf düzeyi').selectOption({ label: '11. sınıf' })
  await page.getByRole('button', { name: '1. Kuvvet ve Hareket' }).click()
  await expect(page.locator('.havuz-sorusu')).toHaveCount(4)
  // Açık uçlu soruyu dışarıda bırak: çoktan seçmeli ve doğru/yanlış.
  await page.getByRole('button', { name: 'Çoktan seçmeli', exact: true }).click()
  await page.getByRole('button', { name: 'Doğru / yanlış', exact: true }).click()
  await expect(page.locator('.havuz-sorusu')).toHaveCount(3)
  await page.getByLabel('Soru sayısı').fill('3')
  await page.getByRole('button', { name: 'Otomatik oluştur' }).click()
  await expect(page.locator('.test-sorulari li')).toHaveCount(3)
  // Aynı soru iki kez eklenemez: havuzda "Testte" olarak görünür.
  await expect(page.locator('.havuz-sorusu .dugme', { hasText: 'Testte' })).toHaveCount(3)
  await page.getByLabel('Başlık').fill('Kuvvet ve hareket mini test')
  await page.getByRole('button', { name: 'Kaydet' }).click()
  await expect(page).toHaveURL(/\/testler\/[0-9a-f-]{36}$/)
  const testId = page.url().split('/').pop()!

  // Testin soru sırası ve doğru cevapları (doğrulama için).
  const { data: ts } = await admin.from('test_soru').select('sira, soru(dogru_cevap, tur)').eq('test_id', testId).order('sira')
  const anahtar = (ts as unknown as { soru: { dogru_cevap: string; tur: string } }[]).map((x) => x.soru)
  expect(anahtar).toHaveLength(3)

  // ---- Çıktılar ----
  const pdfSayfa = await page.context().newPage()
  await pdfSayfa.goto(`/testler/${testId}/yazdir/ogretmen`)
  await expect(pdfSayfa.locator('.y-soru')).toHaveCount(3)
  await expect(pdfSayfa.locator('.cevap-anahtari li')).toHaveCount(3)
  await pdfSayfa.goto(`/testler/${testId}/yazdir/optik`)
  await expect(pdfSayfa.locator('.optik-tablo tr')).toHaveCount(3)
  await pdfSayfa.close()

  // ---- Ata ----
  await page.getByRole('link', { name: 'Sınıfa ata ve sonuçlar' }).click()
  await page.getByRole('button', { name: '11-A' }).click()
  await page.getByRole('button', { name: 'Ata' }).click()
  await expect(page.locator('.atama-listesi li')).toHaveCount(1)

  // ---- Öğrenci 1: online çöz ----
  const ogr = await browser.newPage()
  await ogrenciGiris(ogr, kurum.kod, ogrenciler[0]!.kullanici_adi)
  await ogr.getByRole('link', { name: 'Başla' }).click()
  await expect(ogr.getByText('Soru 1 / 3')).toBeVisible()
  // 1. soru doğru, 2. soru yanlış, 3. soru boş.
  const sec = async (cevap: string) => {
    const tur = await ogr.locator('.coz-secenekler [role=radio]').count()
    if (tur === 2) await ogr.getByRole('radio', { name: cevap === 'D' ? /Doğru/ : /Yanlış/ }).click()
    else await ogr.locator('.coz-secenekler [role=radio]', { has: ogr.locator('.secenek-harf', { hasText: new RegExp(`^${cevap}$`) }) }).click()
  }
  const yanlisi = (c: string, tur: string) => (tur === 'dogru_yanlis' ? (c === 'D' ? 'Y' : 'D') : c === 'A' ? 'B' : 'A')
  await sec(anahtar[0]!.dogru_cevap)
  await ogr.getByRole('button', { name: 'Sonraki' }).click()
  await sec(yanlisi(anahtar[1]!.dogru_cevap, anahtar[1]!.tur))
  await ogr.getByRole('button', { name: 'Sonraki' }).click()
  await ogr.getByRole('button', { name: 'Testi bitir' }).click()
  await expect(ogr.getByText('1 soruyu boş bıraktın.', { exact: false })).toBeVisible()
  await ogr.getByRole('button', { name: 'Evet, bitir' }).click()
  // 1 doğru, 1 yanlış, 1 boş: net 1 − 1/4 = 0,75
  await expect(ogr.locator('.sonuc-net')).toHaveText('0,75')
  await expect(ogr.getByText('öğretmenin açınca', { exact: false })).toBeVisible()

  // ---- Öğretmen: sonuçlar, elle giriş, çözümleri aç ----
  await page.getByRole('link', { name: 'Sonuçlar' }).click()
  await expect(page.locator('tr', { hasText: 'Ayşe Yılmaz' }).locator('td.net')).toHaveText('0,75')
  const dizi = anahtar.map((a) => a.dogru_cevap).join('')
  await page.getByLabel('Can Kaya cevap dizisi').fill(dizi.slice(0, 2)) // eksik
  await page.locator('tr', { hasText: 'Can Kaya' }).getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.locator('tr', { hasText: 'Can Kaya' })).toContainText('Testte 3 soru var, 2 cevap yazıldı.')
  await page.getByLabel('Can Kaya cevap dizisi').fill(dizi.toLowerCase())
  await page.locator('tr', { hasText: 'Can Kaya' }).getByRole('button', { name: 'Kaydet' }).click()
  await expect(page.locator('tr', { hasText: 'Can Kaya' }).locator('td.net')).toHaveText('3')
  await expect(page.locator('tr', { hasText: 'Can Kaya' })).toContainText('Kâğıt')
  await page.getByLabel('Doğru cevapları ve çözümleri öğrencilere aç.').check()
  await expect.poll(async () => (await admin.from('atama').select('cozumler_acik').eq('test_id', testId).single()).data?.cozumler_acik).toBe(true)

  await ogr.reload()
  await expect(ogr.locator('.sonuc-sorulari li').first()).toContainText(`Doğru cevap: ${anahtar[0]!.dogru_cevap}`)
  await ogr.close()

  // ---- Tahtada aç ----
  await page.goto(`/tahta/test/${testId}/1`)
  await expect(page.getByText('Soru 1 / 3')).toBeVisible()
  await page.getByRole('button', { name: 'Sonraki soru' }).click()
  await expect(page).toHaveURL(new RegExp(`/tahta/test/${testId}/2$`))
})

test('tahtada "Neden B değil?" gerekçeleri cevap açılınca görünür', async ({ page }) => {
  const kurum = await kurumAc()
  const eposta = `ogt2-${kurum.kod.toLowerCase()}@deneme.test`
  await kullaniciAc(eposta, 'ogretmen', 'Mehmet Demir', kurum.id)
  await giris(page, eposta)
  await page.goto('/tahta/11')
  await page.getByRole('link', { name: /Kuvvet ve Hareket/ }).click()
  await page.locator('.soru-karti', { hasText: 'gergin bir iple' }).click()
  await expect(page.getByRole('button', { name: /Neden . değil/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Cevabı göster' }).click()
  await expect(page.getByRole('button', { name: /Neden . değil/ })).toHaveCount(4)
  await page.getByRole('button', { name: 'Neden D değil?' }).click()
  await expect(page.locator('.gerekce-metni')).toContainText('L bloğunu hızlandıran net kuvvettir')
})
