import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import type { Icerik } from '../alan/tipler'
import { ornekIcerikler } from '../veri/ornekIcerik'
import { katalog } from '../veri/katalog'
import { YerelKaynak } from './yerelKaynak'
import {
  CevrimdisiHatasi,
  katalogGetir,
  kaynakAyarla,
  kitHtmlGetir,
  kitIndir,
  uniteIcerigiGetir,
  uniteSorulariniIndir,
  yerelKitEkle,
} from './depo'

/** İnternet bağlantısı açılıp kapatılabilen kaynak. */
class DenemeKaynagi extends YerelKaynak {
  cevrimici = true
  private kontrol() {
    if (!this.cevrimici) throw new TypeError('Failed to fetch')
  }
  override async katalog() {
    this.kontrol()
    return super.katalog()
  }
  override async uniteSorulari(u: string, k: string[]) {
    this.kontrol()
    return super.uniteSorulari(u, k)
  }
  override async uniteIcerikleri(u: string) {
    this.kontrol()
    return super.uniteIcerikleri(u)
  }
  override async kitHtml(i: Icerik) {
    this.kontrol()
    return `<html><body>${i.baslik}</body></html>`
  }
}

const kit = ornekIcerikler[0]!
const unite = kit.unite_id!
const kazanimlar = katalog.kazanimlar.filter((k) => k.unite_id === unite).map((k) => k.id)

describe('çevrimdışı çalışma', () => {
  it('indirilmiş kit ve sorular internet kesilince de açılır', async () => {
    const k = new DenemeKaynagi()
    kaynakAyarla(k)

    await katalogGetir()
    await kitIndir(kit)
    const soruSayisi = await uniteSorulariniIndir(unite, kazanimlar)
    expect(soruSayisi).toBeGreaterThan(0)

    k.cevrimici = false
    expect((await katalogGetir()).kazanimlar.length).toBe(katalog.kazanimlar.length)
    expect(await kitHtmlGetir(kit)).toContain(kit.baslik)
    const icerik = await uniteIcerigiGetir(unite, kazanimlar)
    expect(icerik.cevrimdisiKopya).toBe(true)
    expect(icerik.sorular).toHaveLength(soruSayisi)
    expect(icerik.icerikler.map((i) => i.id)).toContain(kit.id)
  })

  it('indirilmemiş kit çevrimdışıyken açıklayıcı hata verir', async () => {
    const k = new DenemeKaynagi()
    k.cevrimici = false
    kaynakAyarla(k)
    await expect(kitHtmlGetir({ ...kit, id: 'indirilmemis' })).rejects.toBeInstanceOf(CevrimdisiHatasi)
  })

  it('içe aktarılan kit ünite listesinde görünür ve internetsiz açılır', async () => {
    const k = new DenemeKaynagi()
    kaynakAyarla(k)
    const yeni = await yerelKitEkle(
      { ...kit, baslik: 'İçe aktarılan hafta', hafta: 2, ornek: false, html_yolu: null },
      '<html><body>Kendi kitim</body></html>',
    )
    k.cevrimici = false
    const icerik = await uniteIcerigiGetir(unite, kazanimlar)
    expect(icerik.icerikler.map((i) => i.baslik)).toContain('İçe aktarılan hafta')
    expect(await kitHtmlGetir(yeni.icerik)).toContain('Kendi kitim')
  })
})
