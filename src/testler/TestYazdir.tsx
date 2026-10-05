// Test çıktıları: öğrenci kitapçığı, cevaplı öğretmen sürümü, optik form.
// Tarayıcının "PDF olarak kaydet" özelliğiyle PDF üretilir; sunucu gerekmez.
// Soru ve şekli asla iki sayfaya bölünmez (break-inside: avoid).

import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { TEST_TURU_ADI } from '../alan/etiketler'
import type { Soru, Test } from '../alan/tipler'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { cozumKatmanlariniKaldir, sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { kurumKullanicilari, logoAdresi } from '../depo/kurumDeposu'
import { testGetir } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { useOturum } from '../oturum/Oturum'
import { marka } from '../yapilandirma/marka'
import '../stil/yazdir.css'

type Surum = 'ogrenci' | 'ogretmen' | 'optik'

export function TestYazdir() {
  const { id = '', surum = 'ogrenci' } = useParams() as { id: string; surum: Surum }
  const [p] = useSearchParams()
  const sinifId = p.get('sinif')
  const { kurum } = useOturum()
  const v = useVeri(() => testGetir(id), [id])
  const ogrenciler = useVeri(
    async () =>
      sinifId && kurum ? (await kurumKullanicilari(kurum.id)).filter((k) => k.rol === 'ogrenci' && k.sinif_idleri.includes(sinifId)) : [],
    [sinifId, kurum?.id],
  )

  useEffect(() => {
    if (v.veri) document.title = `${v.veri.test.baslik} (${surum === 'ogrenci' ? 'öğrenci' : surum === 'ogretmen' ? 'cevaplı' : 'optik form'})`
  }, [v.veri, surum])

  if (v.hata) return <p className="hata-metni">{v.hata.message}</p>
  if (!v.veri || !kurum) return <p>Yükleniyor.</p>
  const { test, sorular } = v.veri

  return (
    <div className={`yazdir-kok duzen-${test.ayarlar.duzen ?? 'iki'} islem-${test.ayarlar.islemAlani ?? 'kisa'}`}>
      <div className="yazdir-arac ekranda">
        <button type="button" className="dugme ana" onClick={() => window.print()}>
          Yazdır ya da PDF olarak kaydet
        </button>
        <span className="soluk">
          Yazdırma penceresinde hedef olarak "PDF olarak kaydet"i seçin. Kâğıt boyutu A4, kenar boşlukları varsayılan olmalı.
        </span>
      </div>
      {test.ayarlar.filigran && <div className="filigran">{kurum.ad}</div>}
      {surum === 'optik' ? (
        (ogrenciler.veri && ogrenciler.veri.length > 0 ? ogrenciler.veri.map((o) => o.ad_soyad) : [null]).map((ad, i) => (
          <OptikForm key={i} test={test} soruSayisi={sorular.length} kurumAdi={kurum.ad} logo={logoAdresi(kurum.logo_yolu)} ogrenci={ad} />
        ))
      ) : (
        <Kitapcik test={test} sorular={sorular} ogretmen={surum === 'ogretmen'} kurumAdi={kurum.ad} logo={logoAdresi(kurum.logo_yolu)} />
      )}
    </div>
  )
}

function Ust({ test, kurumAdi, logo, ek }: { test: Test; kurumAdi: string; logo: string | null; ek?: string }) {
  return (
    <header className="kitapcik-ust">
      <div className="kitapcik-kurum">
        {logo && <img src={logo} alt="" />}
        <span>{kurumAdi}</span>
      </div>
      <h1>
        {test.baslik}
        {ek && <small> {ek}</small>}
      </h1>
      <div className="kitapcik-bilgi">
        <span>{TEST_TURU_ADI[test.tur]}</span>
        {test.sure_dk && <span>Süre: {test.sure_dk} dakika</span>}
        <span className="kitapcik-ibare">{marka.programIbaresi}</span>
      </div>
    </header>
  )
}

function Kitapcik({
  test,
  sorular,
  ogretmen,
  kurumAdi,
  logo,
}: {
  test: Test
  sorular: Soru[]
  ogretmen: boolean
  kurumAdi: string
  logo: string | null
}) {
  const { yardimci } = useKatalog()
  return (
    <article className="kitapcik">
      <Ust test={test} kurumAdi={kurumAdi} logo={logo} ek={ogretmen ? '(cevaplı öğretmen sürümü)' : undefined} />
      {!ogretmen && (
        <div className="ogrenci-bilgi">
          <span>Ad soyad: ..............................................</span>
          <span>Sınıf: ..............</span>
          <span>No: ..........</span>
        </div>
      )}
      {test.aciklama && <p className="kitapcik-aciklama">{test.aciklama}</p>}
      <div className="sorular">
        {sorular.map((s, i) => (
          <section key={s.id} className={`y-soru ${s.sekil_svg && s.sekil_svg.length > 0 ? 'sekilli' : ''}`}>
            <div className="y-soru-no">{i + 1}.</div>
            <div className="y-soru-icerik">
              <ZenginMetin metin={s.govde} sinif="y-govde" />
              {s.sekil_svg && <YazdirSekli svg={s.sekil_svg} cozumlu={ogretmen} />}
              {s.secenekler && (
                <ol className="y-secenekler">
                  {s.secenekler.map((x) => (
                    <li key={x.harf} className={ogretmen && x.harf === s.dogru_cevap ? 'y-dogru' : ''}>
                      <strong>{x.harf})</strong> <ZenginMetin metin={x.metin} etiket="span" />
                    </li>
                  ))}
                </ol>
              )}
              {s.tur === 'dogru_yanlis' && (
                <div className="y-dy">
                  <span className={ogretmen && s.dogru_cevap === 'D' ? 'y-dogru' : ''}>( ) Doğru</span>
                  <span className={ogretmen && s.dogru_cevap === 'Y' ? 'y-dogru' : ''}>( ) Yanlış</span>
                </div>
              )}
              {ogretmen ? (
                <div className="y-cozum">
                  <div>
                    <strong>Cevap:</strong>{' '}
                    {s.tur === 'dogru_yanlis' ? (s.dogru_cevap === 'D' ? 'Doğru.' : 'Yanlış.') : <ZenginMetin metin={s.dogru_cevap} etiket="span" />}
                    <span className="y-kazanim">
                      {' '}
                      {s.kazanim_idleri.map((k) => yardimci?.kazanim(k)?.kod).filter(Boolean).join(', ')}
                    </span>
                  </div>
                  {s.cozum_adimlari.length > 0 && (
                    <ol>
                      {s.cozum_adimlari.map((a, j) => (
                        <li key={j}>
                          <ZenginMetin metin={a.metin} etiket="span" />
                        </li>
                      ))}
                    </ol>
                  )}
                  {s.secenekler?.some((x) => x.gerekce) && (
                    <ul className="y-gerekceler">
                      {s.secenekler
                        .filter((x) => x.gerekce)
                        .map((x) => (
                          <li key={x.harf}>
                            <strong>Neden {x.harf} değil?</strong> <ZenginMetin metin={x.gerekce!} etiket="span" />
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ) : (
                (s.tur === 'acik_uclu' || test.ayarlar.islemAlani !== 'yok') && <div className={`y-islem ${s.tur === 'acik_uclu' ? 'acik' : ''}`} />
              )}
            </div>
          </section>
        ))}
      </div>
      {ogretmen && (
        <section className="cevap-anahtari">
          <h2>Cevap anahtarı</h2>
          <ol>
            {sorular.map((s) => (
              <li key={s.id}>{s.tur === 'acik_uclu' ? 'Açık uçlu' : s.dogru_cevap}</li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}

function YazdirSekli({ svg, cozumlu }: { svg: string; cozumlu: boolean }) {
  const html = useMemo(() => (cozumlu ? sekilSvgTemizle(svg) : cozumKatmanlariniKaldir(sekilSvgTemizle(svg))), [svg, cozumlu])
  return <div className="y-sekil" dangerouslySetInnerHTML={{ __html: html }} />
}

function OptikForm({
  test,
  soruSayisi,
  kurumAdi,
  logo,
  ogrenci,
}: {
  test: Test
  soruSayisi: number
  kurumAdi: string
  logo: string | null
  ogrenci: string | null
}) {
  const sutunlar: number[][] = []
  for (let i = 0; i < soruSayisi; i += 25) sutunlar.push(Array.from({ length: Math.min(25, soruSayisi - i) }, (_, j) => i + j + 1))
  return (
    <article className="optik">
      <Ust test={test} kurumAdi={kurumAdi} logo={logo} ek="(cevap kâğıdı)" />
      <div className="ogrenci-bilgi">
        <span>Ad soyad: {ogrenci ?? '..............................................'}</span>
        <span>Sınıf: ..............</span>
        <span>No: ..........</span>
      </div>
      <p className="optik-not">Her soru için yalnızca bir yuvarlağı tamamen doldurun. Doğru/yanlış sorularında D ya da Y'yi işaretleyin.</p>
      <div className="optik-sutunlar">
        {sutunlar.map((s, i) => (
          <table key={i} className="optik-tablo">
            <tbody>
              {s.map((n) => (
                <tr key={n}>
                  <th>{n}</th>
                  {['A', 'B', 'C', 'D', 'E'].map((h) => (
                    <td key={h}>
                      <span className="yuvarlak">{h}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </article>
  )
}
