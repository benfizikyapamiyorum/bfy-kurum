// Tahta modu: 1920×1080 dokunmatik ekranda uçtan uca testler.

import { expect, test, type Page } from '@playwright/test'

const ORNEK_KIT = '60000000-0000-4000-8000-000000000001'

async function soruyaGit(page: Page, sinif: string, metin: string) {
  await page.goto('/tahta')
  await page.getByRole('link', { name: new RegExp(`^${sinif}`) }).tap()
  await page.getByRole('link', { name: /Kuvvet ve Hareket/ }).tap()
  await page.locator('.soru-karti', { hasText: metin }).tap()
  await expect(page.locator('.soru-govde')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  const hatalar: string[] = []
  page.on('pageerror', (e) => hatalar.push(e.message))
  ;(page as Page & { _hatalar?: string[] })._hatalar = hatalar
})

test.afterEach(async ({ page }) => {
  expect((page as Page & { _hatalar?: string[] })._hatalar ?? []).toEqual([])
})

test('sınıf → ünite → soru akışı dokunarak çalışır, cevap varsayılan olarak gizlidir', async ({ page }) => {
  await soruyaGit(page, '11. sınıf', 'gergin bir iple')
  await expect(page.getByText('Soru', { exact: false }).first()).toBeVisible()
  await expect(page.locator('.rozet.ornek').first()).toHaveText('ÖRNEK')

  // Cevap gizli; şıklarda doğru işareti yok.
  await expect(page.locator('.cevap-kutusu')).toHaveCount(0)
  await expect(page.locator('.secenek.dogru')).toHaveCount(0)

  await page.getByRole('button', { name: 'Cevabı göster' }).tap()
  await expect(page.locator('.cevap-kutusu')).toContainText('B')
  await expect(page.locator('.secenek.dogru')).toContainText('8')

  await page.getByRole('button', { name: 'Cevabı gizle' }).tap()
  await expect(page.locator('.cevap-kutusu')).toHaveCount(0)
})

test('çözüm adımları tek tek açılır ve şekil adım adım çizilir', async ({ page }) => {
  await soruyaGit(page, '9. sınıf', 'Birim karelere')
  const bilesen = page.locator('.soru-sekli [data-ciz-adim="2"]').first()
  const mVektoru = page.locator('.soru-sekli [data-ciz-adim="3"]').first()
  await expect(bilesen).toHaveCSS('opacity', '0')
  await expect(page.locator('.cozum-adimi')).toHaveCount(0)

  await page.getByRole('button', { name: /Çözümü başlat/ }).tap()
  await expect(page.locator('.cozum-adimi')).toHaveCount(1)
  await expect(bilesen).toHaveCSS('opacity', '0')

  await page.getByRole('button', { name: /Sonraki adım/ }).tap()
  await expect(page.locator('.cozum-adimi')).toHaveCount(2)
  await expect(bilesen).toHaveCSS('opacity', '1')
  await expect(mVektoru).toHaveCSS('opacity', '0')

  await page.getByRole('button', { name: /Sonraki adım/ }).tap()
  await expect(page.locator('.cozum-adimi')).toHaveCount(3)
  await expect(mVektoru).toHaveCSS('opacity', '1')
  await expect(page.getByRole('button', { name: /Çözüm tamam/ })).toBeDisabled()

  // Geri alınca son adım ve çizimi kapanır.
  await page.getByRole('button', { name: 'Son adımı kapat' }).tap()
  await expect(page.locator('.cozum-adimi')).toHaveCount(2)
  await expect(mVektoru).toHaveCSS('opacity', '0')
})

test('kinematik animasyon topu fiziksel yörüngede yere indirir', async ({ page }) => {
  await soruyaGit(page, '11. sınıf', 'uçurumun')
  const top = page.locator('.soru-sekli [data-ciz-tur="kinematik"]')
  await expect(top).toHaveAttribute('transform', 'translate(126 82)')
  await page.getByRole('button', { name: /Çözümü başlat/ }).tap()
  await expect(top).toHaveAttribute('transform', 'translate(366 262)', { timeout: 5000 })
})

test('dokunma hedefleri en az 56 piksel, sayfa yatayda taşmaz', async ({ page }) => {
  for (const yol of ['/tahta', '/tahta/11']) {
    await page.goto(yol)
    await expect(page.locator('.tahta')).toBeVisible()
    await kontrolEt(page)
  }
  await soruyaGit(page, '11. sınıf', 'gergin bir iple')
  await page.getByRole('button', { name: 'Kalem' }).tap()
  await kontrolEt(page)
})

async function kontrolEt(page: Page) {
  const kucukler = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.tahta button, .tahta a, .tahta [role="button"]')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => {
        const r = e.getBoundingClientRect()
        return { ad: e.getAttribute('aria-label') ?? e.textContent?.trim(), w: r.width, h: r.height }
      })
      .filter((x) => Math.min(x.w, x.h) < 56),
  )
  expect(kucukler).toEqual([])
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(tasma).toBeLessThanOrEqual(0)
}

test('kalemle çizilir, temizle ile silinir, soru değişince çizim kalkar', async ({ page }) => {
  await soruyaGit(page, '11. sınıf', 'uçurumun')
  await page.getByRole('button', { name: 'Kalem' }).tap()
  const tuval = page.locator('.cizim-katmani')
  const doluPiksel = () =>
    tuval.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
      let n = 0
      for (let i = 3; i < d.length; i += 4) if (d[i]! > 0) n++
      return n
    })
  expect(await doluPiksel()).toBe(0)

  // Dokunmatik çizim (pointer olayları).
  const kutu = (await tuval.boundingBox())!
  await page.mouse.move(kutu.x + 300, kutu.y + 300)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) await page.mouse.move(kutu.x + 300 + i * 20, kutu.y + 300 + i * 5)
  await page.mouse.up()
  expect(await doluPiksel()).toBeGreaterThan(100)

  await page.getByRole('button', { name: 'Çizimleri temizle' }).tap()
  expect(await doluPiksel()).toBe(0)

  // Tekrar çiz, sonraki soruya geç: çizim temizlenmeli.
  await page.mouse.move(kutu.x + 300, kutu.y + 300)
  await page.mouse.down()
  await page.mouse.move(kutu.x + 600, kutu.y + 400)
  await page.mouse.up()
  expect(await doluPiksel()).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Kalemi kapat' }).tap()
  await page.getByRole('button', { name: 'Sonraki soru' }).tap()
  await expect(page.locator('.soru-govde')).toContainText('sabit hızla')
  expect(await doluPiksel()).toBe(0)
})

test('süre sayacı ilerler, durur ve soru değişince sıfırlanır', async ({ page }) => {
  await soruyaGit(page, '11. sınıf', 'uçurumun')
  const deger = page.locator('.sayac-deger')
  await expect(deger).not.toHaveText('00:00', { timeout: 3000 })
  await page.getByRole('button', { name: 'Süreyi durdur' }).tap()
  const durmus = await deger.textContent()
  await page.waitForTimeout(1500)
  await expect(deger).toHaveText(durmus!)
  await page.getByRole('button', { name: 'Sonraki soru' }).tap()
  await expect(deger).toHaveText(/00:0[01]/)
})

test('örnek HTML kit iframe içinde açılır ve kendi düğmeleri çalışır', async ({ page }) => {
  await page.goto('/tahta/9')
  await page.getByRole('link', { name: /Kuvvet ve Hareket/ }).tap()
  await page.getByRole('link', { name: /Örnek hafta kiti/ }).tap()
  const kit = page.frameLocator('iframe.kit-cercevesi')
  await expect(kit.getByRole('heading', { name: /Hafta 1/ })).toBeVisible()
  // Kit localStorage kullanıyor; sandbox içinde bile hata vermeden çalışmalı.
  await kit.getByRole('button', { name: 'Hoca' }).tap()
  await expect(kit.locator('body')).toHaveAttribute('data-mod', 'hoca')
  await kit.getByRole('button', { name: 'Cevabı göster' }).first().tap()
  await expect(kit.locator('#c1')).toBeVisible()
  // Kit uygulamanın verisine erişemez (allow-same-origin yok).
  await expect(page.locator('iframe.kit-cercevesi')).toHaveAttribute('sandbox', /allow-scripts/)
  await expect(page.locator('iframe.kit-cercevesi')).not.toHaveAttribute('sandbox', /allow-same-origin/)
})

test('HTML kit içe aktarılır, ünitede görünür ve tahtada açılır', async ({ page }) => {
  await page.goto('/icerik/ice-aktar')
  await page.locator('input[type=file]').setInputFiles({
    name: 'hafta-07.html',
    mimeType: 'text/html',
    buffer: Buffer.from('<!doctype html><html><head><title>Hafta 7: Deneme kiti</title></head><body><h1>İçe aktarılan kit</h1></body></html>'),
  })
  await expect(page.locator('.taslak input').first()).toHaveValue('Hafta 7: Deneme kiti')
  await expect(page.locator('.taslak label', { hasText: 'Hafta' }).locator('input')).toHaveValue('7')
  await page.locator('.taslak select').first().selectOption({ label: '9. sınıf' })
  await page.getByRole('button', { name: /kiti kaydet/ }).click()
  await expect(page.getByText('1 kit kaydedildi.', { exact: false })).toBeVisible()

  await page.goto('/tahta/9')
  await page.getByRole('link', { name: /Fizik Bilimi ve Kariyer Keşfi/ }).tap()
  await page.getByRole('link', { name: /Deneme kiti/ }).tap()
  await expect(page.frameLocator('iframe.kit-cercevesi').getByRole('heading')).toHaveText('İçe aktarılan kit')
})

test('tahtaya indirilen kit internet kesilince de açılır', async ({ page, context }) => {
  // Service worker uygulama kabuğunu önbelleğe alsın.
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)

  // İndirilmeden önce: çevrimdışıyken kit açılmaz, açıklayıcı mesaj çıkar.
  await page.goto('/tahta/9')
  await page.getByRole('link', { name: /Kuvvet ve Hareket/ }).tap()
  await context.setOffline(true)
  await page.getByRole('link', { name: /Örnek hafta kiti/ }).tap()
  await expect(page.getByRole('alert')).toContainText('çevrimdışı kullanılamıyor')
  await context.setOffline(false)

  // İndir.
  await page.goto('/tahta/indir')
  await page.getByRole('checkbox').first().check()
  await page.getByRole('button', { name: 'Seçilenleri kaydet' }).tap()
  await expect(page.getByText('tahtaya kaydedildi', { exact: false }).first()).toBeVisible()

  // İnternet kesik: uygulama baştan açılır, kit ve sorular çalışır.
  await context.setOffline(true)
  await page.goto(`/tahta/kit/${ORNEK_KIT}`)
  await expect(page.frameLocator('iframe.kit-cercevesi').getByRole('heading', { name: /Hafta 1/ })).toBeVisible()
  await expect(page.locator('.cevrimdisi-rozeti')).toBeVisible()
  await page.goto('/tahta/9')
  await page.getByRole('link', { name: /Kuvvet ve Hareket/ }).tap()
  await page.locator('.soru-karti').first().tap()
  await expect(page.locator('.soru-govde')).toBeVisible()
  await context.setOffline(false)
})

test.describe('4K tahta', () => {
  test.use({ viewport: { width: 3840, height: 2160 } })
  test('soru ekranı ölçeklenir ve taşmaz', async ({ page }) => {
    await soruyaGit(page, '10. sınıf', 'konum-zaman')
    const boyut = await page.locator('.soru-govde').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    expect(boyut).toBeGreaterThan(50)
    await kontrolEt(page)
  })
})

test('kit doğrudan bağlantıyla (ünite listesi açılmadan) açılır', async ({ page }) => {
  await page.goto(`/tahta/kit/${ORNEK_KIT}`)
  await expect(page.frameLocator('iframe.kit-cercevesi').getByRole('heading', { name: /Hafta 1/ })).toBeVisible()
})

test.describe('telefon genişliği', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test('soru ekranı yatayda taşmaz', async ({ page }) => {
    await soruyaGit(page, '11. sınıf', 'gergin bir iple')
    const tasma = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.tahta *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).length,
    )
    expect(tasma).toBe(0)
  })
})
