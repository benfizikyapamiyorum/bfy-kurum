// Demo: kurgusal bir sınıfın raporu. Gerçek rapor ekranıyla aynı hesaplar ve grafikler, örnek veriyle.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { egilim, zayifKazanimlar, ZAYIF_ESIK } from '../alan/rapor'
import { trSayi } from '../alan/turkce'
import { CizgiGrafik, YuzdeCubuklari } from '../bilesenler/Grafikler'
import { katalog } from '../veri/katalog'
import { DEMO_KAZANIMLAR, DEMO_OGRENCILER, DEMO_TESTLER } from './ornekRapor'

const tarih = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
const ortalama = (x: number[]) => x.reduce((t, n) => t + n, 0) / x.length
const EGILIM_ADI = { artiyor: 'Yükseliyor', azaliyor: 'Düşüyor', sabit: 'Durağan' } as const

export function DemoRapor() {
  const [secilen, setSecilen] = useState<string | null>(DEMO_OGRENCILER[0]!.id)
  const [telafi, setTelafi] = useState(false)

  const kazanimlar = useMemo(
    () =>
      DEMO_KAZANIMLAR.map((k) => ({
        ...k,
        kazanim_id: k.kod,
        yuzde: Math.round((k.dogru / k.deneme) * 1000) / 10,
        metin: katalog.kazanimlar.find((x) => x.kod === k.kod)?.metin,
      })),
    [],
  )
  const zayiflar = zayifKazanimlar(kazanimlar)
  const zayifKodlar = new Set(zayiflar.map((z) => z.kod))
  const ogrenci = DEMO_OGRENCILER.find((o) => o.id === secilen)

  return (
    <div className="sayfa genis-sayfa">
      <p className="rozet ornek">DEMO</p>
      <h1>Raporlar: 9-A</h1>
      <p className="bilgi-kutusu">Bu sayfadaki öğrenciler ve sonuçlar örnek veridir. Hesaplar ve grafikler gerçek rapor ekranıyla aynıdır.</p>

      <div className="panel-dikey">
        <section className="kart">
          <h2>Öğrenme çıktısı başarısı</h2>
          <p className="soluk kucuk">
            Tamamlanan testlerdeki doğru cevap yüzdesi. Boş bırakılan soru doğru sayılmaz. %{ZAYIF_ESIK} altı ve en az 3 cevabı olan
            çıktılar zayıf sayılır.
          </p>
          <YuzdeCubuklari
            cubuklar={kazanimlar.map((k) => ({
              anahtar: k.kod,
              etiket: k.kod,
              aciklama: k.metin,
              deger: k.yuzde,
              zayif: zayifKodlar.has(k.kod),
              ayrinti: `(${k.dogru}/${k.deneme})`,
            }))}
          />
          <div className="telafi">
            <p>
              <strong>Bu sınıf şu öğrenme çıktılarında zayıf:</strong> {zayiflar.map((z) => z.kod).join(', ')}.
            </p>
            <button type="button" className="dugme ana" onClick={() => setTelafi(true)}>
              Telafi testi oluştur
            </button>
            {telafi && (
              <p className="bilgi-kutusu" role="status">
                Lisanslı kurumda bu düğme, zayıf çıktılardan ve bu sınıfa daha önce verilmemiş sorulardan 10 soruluk bir test hazırlar.
                Test düzenlemeniz için açılır; PDF olarak basılır ya da öğrencilere online atanır. Öğrenci gözünden bir test için{' '}
                <Link to="/demo/test">örnek testi çözün</Link>.
              </p>
            )}
          </div>
        </section>

        <div className="panel-izgara">
          <section className="kart">
            <h2>Sınavlar</h2>
            <div className="tablo-kaydir">
              <table className="tablo">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Tarih</th>
                    <th>Katılım</th>
                    <th>Ortalama net</th>
                    <th>En yüksek</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_TESTLER.map((t, i) => {
                    const netler = DEMO_OGRENCILER.map((o) => o.sonuclar[i]!.net)
                    return (
                      <tr key={t.baslik}>
                        <td>{t.baslik}</td>
                        <td>{tarih(t.tarih)}</td>
                        <td>
                          {netler.length} / {DEMO_OGRENCILER.length}
                        </td>
                        <td>{trSayi(ortalama(netler))}</td>
                        <td>{trSayi(Math.max(...netler))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="kart">
            <h2>Öğrenciler</h2>
            <div className="tablo-kaydir">
              <table className="tablo">
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>Ortalama</th>
                    <th>Son</th>
                    <th>Eğilim</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_OGRENCILER.map((o) => {
                    const netler = o.sonuclar.map((s) => s.net)
                    const e = egilim(netler)
                    return (
                      <tr key={o.id} className={secilen === o.id ? 'secili-satir' : ''}>
                        <td>
                          <button type="button" className="baglanti-dugme" onClick={() => setSecilen(o.id)}>
                            {o.ad}
                          </button>
                        </td>
                        <td>{trSayi(ortalama(netler))}</td>
                        <td>{trSayi(netler.at(-1)!)}</td>
                        <td>{e ? EGILIM_ADI[e] : ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {ogrenci && (
          <section className="kart" aria-label={`${ogrenci.ad} raporu`}>
            <h2>{ogrenci.ad}: net gelişimi</h2>
            <CizgiGrafik
              noktalar={ogrenci.sonuclar.map((s) => ({
                etiket: DEMO_TESTLER[s.test]!.baslik,
                ayrinti: tarih(DEMO_TESTLER[s.test]!.tarih),
                deger: s.net,
              }))}
            />
            <details>
              <summary>Tablo olarak gör</summary>
              <table className="tablo">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>D</th>
                    <th>Y</th>
                    <th>B</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {ogrenci.sonuclar.map((s) => (
                    <tr key={s.test}>
                      <td>{DEMO_TESTLER[s.test]!.baslik}</td>
                      <td>{s.dogru}</td>
                      <td>{s.yanlis}</td>
                      <td>{s.bos}</td>
                      <td>{trSayi(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>
        )}
        <div>
          <Link to="/demo" className="dugme">
            Demoya dön
          </Link>
        </div>
      </div>
    </div>
  )
}
