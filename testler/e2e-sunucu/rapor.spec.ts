import { expect, test } from '@playwright/test'
import { admin, kullaniciAc, kurumAc, sinifVeOgrenciler, SIFRE } from './yardimci'

// 11. sınıf örnek soruları (src/veri/ornekSorular.ts): 7 (C), 9 (B), 10 (D/Y: D).
const S7 = '50000000-0000-4000-8000-000000000007'
const S9 = '50000000-0000-4000-8000-000000000009'
const S10 = '50000000-0000-4000-8000-000000000010'

async function sinav(kurumId: string, sinifId: string, baslik: string, gunOnce: number, cevaplar: Record<string, string[]>) {
  const { data: t } = await admin.from('test').insert({ kurum_id: kurumId, tur: 'mini_test', baslik }).select('id').single()
  await admin.from('test_soru').insert([S7, S9, S10].map((s, i) => ({ test_id: t!.id, soru_id: s, sira: i + 1 })))
  const { data: a } = await admin
    .from('atama')
    .insert({ kurum_id: kurumId, test_id: t!.id, sinif_grubu_id: sinifId, baslangic: new Date(Date.now() - gunOnce * 864e5).toISOString() })
    .select('id')
    .single()
  const anahtar = ['C', 'B', 'D']
  for (const [ogrenci, c] of Object.entries(cevaplar)) {
    const satirlar = [S7, S9, S10].map((s, i) => ({
      kurum_id: kurumId,
      atama_id: a!.id,
      ogrenci_id: ogrenci,
      soru_id: s,
      verilen: c[i] || null,
      dogru_mu: c[i] ? c[i] === anahtar[i] : null,
      kaynak: 'elle',
    }))
    await admin.from('cevap').insert(satirlar)
    const d = satirlar.filter((x) => x.dogru_mu === true).length
    const y = satirlar.filter((x) => x.dogru_mu === false).length
    await admin.from('sonuc').insert({
      kurum_id: kurumId,
      atama_id: a!.id,
      ogrenci_id: ogrenci,
      dogru: d,
      yanlis: y,
      bos: 3 - d - y,
      net: d - y / 4,
      kaynak: 'elle',
      tamamlandi: new Date(Date.now() - gunOnce * 864e5).toISOString(),
    })
  }
}

test('kazanım raporu zayıfları gösterir, telafi testi tek tıkla oluşur, öğrenci gelişimi çizilir', async ({ page }) => {
  const kurum = await kurumAc()
  const eposta = `rapor-${kurum.kod.toLowerCase()}@deneme.test`
  await kullaniciAc(eposta, 'ogretmen', 'Rapor Öğretmeni', kurum.id)
  const { sinifId, ogrenciler } = await sinifVeOgrenciler(kurum, ['Ayşe Yılmaz', 'Can Kaya', 'Deniz Ak'])
  const [a, c, d] = ogrenciler.map((o) => o.id) as [string, string, string]
  // Herkes 9. soruda (FİZ.11.1.4 ve 11.1.5) yanılıyor.
  await sinav(kurum.id, sinifId, 'Birinci tarama', 10, { [a]: ['C', 'A', 'Y'], [c]: ['C', 'D', 'D'], [d]: ['A', 'E', ''] })
  await sinav(kurum.id, sinifId, 'İkinci tarama', 3, { [a]: ['C', 'A', 'D'], [c]: ['C', 'C', 'D'], [d]: ['C', 'A', 'D'] })

  await page.goto('/giris')
  await page.getByLabel('E-posta').fill(eposta)
  await page.getByLabel('Şifre').fill(SIFRE)
  await page.getByRole('button', { name: 'Giriş yap' }).click()
  await expect(page).toHaveURL(/\/ogretmen$/)
  await page.getByRole('link', { name: /Raporlar/ }).click()

  const zayifSatir = page.locator('.yuzde-cubuklari li', { hasText: 'FİZ.11.1.5' })
  await expect(zayifSatir).toContainText('Zayıf')
  await expect(zayifSatir).toContainText('%0')
  await expect(page.locator('.yuzde-cubuklari li', { hasText: 'FİZ.11.1.1' })).not.toContainText('Zayıf')
  await expect(page.getByText('Bu sınıf şu öğrenme çıktılarında zayıf:')).toBeVisible()

  // Öğrenci gelişimi: Ayşe 1. sınavda 1 − 2/4 = 0,5; 2. sınavda 2 − 1/4 = 1,75.
  await page.getByRole('button', { name: 'Ayşe Yılmaz' }).click()
  await expect(page.getByRole('heading', { name: 'Ayşe Yılmaz: net gelişimi' })).toBeVisible()
  await expect(page.locator('.grafik-deger')).toHaveText('1,75')
  await expect(page.locator('tr', { hasText: 'Ayşe Yılmaz' })).toContainText('Yükseliyor')
  if (process.env.EKRAN_GORUNTUSU) await page.screenshot({ path: process.env.EKRAN_GORUNTUSU, fullPage: true })

  // Telafi testi.
  await page.getByLabel('Soru sayısı').fill('5')
  await page.getByRole('button', { name: 'Telafi testi oluştur' }).click()
  await expect(page).toHaveURL(/\/testler\/[0-9a-f-]{36}$/)
  await expect(page.getByLabel('Başlık')).toHaveValue(/^Telafi: 11-A/)
  await expect(page.locator('.test-sorulari li').first()).toBeVisible()
  // Havuzda yeni soru olmadığı için daha önce verilenler kullanıldı ve uyarıldı.
  await expect(page.locator('.basari-metni')).toContainText('daha önce verilmişti')
})
