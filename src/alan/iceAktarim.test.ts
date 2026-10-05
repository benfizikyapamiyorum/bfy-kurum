import { describe, expect, it } from 'vitest'
import { katalog } from '../veri/katalog'
import { iceAktarimDogrula } from './iceAktarim'
import paket from '../../icerik-paketleri/kaldirma-kuvveti.json'

const bilinen = new Set(katalog.kazanimlar.map((k) => k.kod))

describe('içe aktarım doğrulayıcısı', () => {
  it('Fizik Atölye paketi geçerli', () => {
    const s = iceAktarimDogrula(paket, bilinen)
    expect(s.hatalar).toEqual([])
    expect(s.ozet).toEqual({ uniteler: 1, kazanimlar: 2, sorular: 12, icerikler: 1 })
  })

  it('açıklayıcı Türkçe hatalar verir', () => {
    const s = iceAktarimDogrula(
      {
        surum: 1,
        sorular: [
          { dis_kimlik: 'a', tur: 'coktan_secmeli', govde: 'x', secenekler: [{ harf: 'A', metin: '1' }], dogru_cevap: 'F', zorluk: 9, kazanimlar: ['FİZ.9.9.9'] },
          { dis_kimlik: 'a', tur: 'dogru_yanlis', govde: 'y', dogru_cevap: 'B', zorluk: 2, kazanimlar: ['FİZ.9.2.1'], sekil_svg: '<svg onload="x()"></svg>' },
        ],
      },
      bilinen,
    )
    expect(s.gecerli).toBe(false)
    expect(s.hatalar).toEqual([
      'sorular[0] (a): zorluk 1-5 arası tam sayı olmalı.',
      'sorular[0] (a): çoktan seçmeli soruda tam 5 seçenek olmalı.',
      'sorular[0] (a): dogru_cevap A-E arası olmalı.',
      'sorular[0] (a): "FİZ.9.9.9" kazanımı katalogda yok; dosyanın katalog bölümüne ekleyin.',
      'sorular[1] (a): dis_kimlik "a" dosyada iki kez geçiyor.',
      'sorular[1] (a): doğru/yanlış sorusunda dogru_cevap D ya da Y olmalı.',
      'sorular[1] (a): sekil_svg betik ya da olay özniteliği içeremez.',
    ])
  })

  it('konu anlatımında bölüm yapısını denetler', () => {
    const s = iceAktarimDogrula(
      { surum: 1, icerikler: [{ dis_kimlik: 'k', tur: 'konu_anlatimi', baslik: 'K', veri: { bolumler: [{ baslik: 'B' }] } }] },
      bilinen,
    )
    expect(s.hatalar).toEqual(['icerikler[0] (k): veri.bolumler[0] için baslik ve metin gerekli.'])
  })

  it('JSON nesnesi olmayanı reddeder', () => {
    expect(iceAktarimDogrula([]).hatalar).toEqual(['Dosya bir JSON nesnesi olmalı.'])
  })
})
