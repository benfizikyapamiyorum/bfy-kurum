// Demo: örnek sorularla online test. Puanlama tarayıcıda, gerçek testlerle aynı net kuralıyla yapılır.

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { puanla, VARSAYILAN_YANLIS_DOGRU_ORANI } from '../alan/puanlama'
import { trSayi } from '../alan/turkce'
import type { Soru } from '../alan/tipler'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { cozumKatmanlariniKaldir, sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { useVeri } from '../kancalar'
import { ornekSorular } from '../veri/ornekSorular'
import { ortam } from '../yapilandirma/ortam'

// Yalnızca otomatik puanlanan türler; açık uçlu sorular demoda yok.
const ORNEK: Soru[] = ornekSorular.filter((s) => s.tur !== 'acik_uclu')

/** ?paket=kaldirma: tanıtım sürümündeki kaldırma kuvveti paketi. */
async function soruSeti(paket: string | null): Promise<{ baslik: string; sorular: Soru[] }> {
  if (paket === 'kaldirma' && ortam.tanitim) {
    const { tanitimSorulari } = await import('../veri/tanitimPaketi')
    return { baslik: 'Kaldırma kuvveti testi', sorular: tanitimSorulari }
  }
  return { baslik: 'Örnek test', sorular: ORNEK }
}

export function DemoTest() {
  const [ara] = useSearchParams()
  const paket = ara.get('paket')
  const v = useVeri(() => soruSeti(paket), [paket])
  if (!v.veri) return <div className="sayfa">Yükleniyor.</div>
  return <DemoTestCoz key={paket ?? 'ornek'} baslik={v.veri.baslik} SORULAR={v.veri.sorular} />
}

function Sekil({ svg, cozumlu }: { svg: string; cozumlu: boolean }) {
  const html = useMemo(() => (cozumlu ? sekilSvgTemizle(svg) : cozumKatmanlariniKaldir(sekilSvgTemizle(svg))), [svg, cozumlu])
  return <div className="coz-sekil" dangerouslySetInnerHTML={{ __html: html }} />
}

const secenekleri = (s: Soru) =>
  s.tur === 'dogru_yanlis'
    ? [
        { harf: 'D', metin: 'Doğru' },
        { harf: 'Y', metin: 'Yanlış' },
      ]
    : (s.secenekler ?? [])

function DemoTestCoz({ baslik, SORULAR }: { baslik: string; SORULAR: Soru[] }) {
  const [no, setNo] = useState(0)
  const [cevaplar, setCevaplar] = useState<Record<string, string>>({})
  const [onay, setOnay] = useState(false)
  const [bitti, setBitti] = useState(false)

  const sonuc = useMemo(
    () =>
      puanla(
        SORULAR.map((s) => cevaplar[s.id] ?? null),
        SORULAR.map((s) => s.dogru_cevap),
      ),
    [cevaplar, SORULAR],
  )

  const yeniden = () => {
    setCevaplar({})
    setNo(0)
    setOnay(false)
    setBitti(false)
  }

  if (bitti) {
    return (
      <div className="sayfa dar">
        <p className="rozet ornek">DEMO</p>
        <h1>{baslik}: sonuç</h1>
        <section className="kart sonuc-karti" aria-label="Sonuç">
          <div>
            <span className="sonuc-net">{trSayi(sonuc.net)}</span>
            <span className="soluk">net</span>
          </div>
          <ul>
            <li>{sonuc.dogru} doğru</li>
            <li>{sonuc.yanlis} yanlış</li>
            <li>{sonuc.bos} boş</li>
          </ul>
        </section>
        <p className="soluk">
          Net, {VARSAYILAN_YANLIS_DOGRU_ORANI} yanlış 1 doğruyu götürecek biçimde hesaplanır. Oranı öğretmen her test için ayarlar.
        </p>
        <ol className="sonuc-sorulari">
          {SORULAR.map((s, i) => {
            const v = cevaplar[s.id]
            const durum = !v ? '' : v === s.dogru_cevap ? 'dogru' : 'yanlis'
            const yanlisSecenek = v && v !== s.dogru_cevap ? s.secenekler?.find((x) => x.harf === v) : undefined
            return (
              <li key={s.id} className={`kart ${durum}`}>
                <div className="sonuc-soru-ust">
                  <strong>{i + 1}. soru</strong>
                  <span>
                    Senin cevabın: {v ?? 'boş'}. Doğru cevap: {s.dogru_cevap}.
                  </span>
                </div>
                <ZenginMetin metin={s.govde} />
                {s.sekil_svg && <Sekil svg={s.sekil_svg} cozumlu />}
                {yanlisSecenek?.gerekce && (
                  <p className="bilgi-kutusu">
                    <strong>Neden {yanlisSecenek.harf} değil?</strong> <ZenginMetin metin={yanlisSecenek.gerekce} etiket="span" />
                  </p>
                )}
                {s.cozum_adimlari.length > 0 && (
                  <details>
                    <summary>Çözümü göster</summary>
                    <ol>
                      {s.cozum_adimlari.map((a, j) => (
                        <li key={j}>
                          <ZenginMetin metin={a.metin} etiket="span" />
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </li>
            )
          })}
        </ol>
        <div className="secim-grubu">
          <button type="button" className="dugme" onClick={yeniden}>
            Yeniden çöz
          </button>
          <Link to="/demo" className="dugme ana">
            Demoya dön
          </Link>
        </div>
      </div>
    )
  }

  const s = SORULAR[no]!
  const bosSayisi = SORULAR.filter((x) => !cevaplar[x.id]).length
  const sec = (harf: string) =>
    setCevaplar((c) => {
      const y = { ...c }
      if (y[s.id] === harf) delete y[s.id]
      else y[s.id] = harf
      return y
    })

  return (
    <div className="sayfa coz-sayfasi">
      <header className="coz-ust">
        <div>
          <h1>
            {baslik} <span className="rozet ornek">DEMO</span>
          </h1>
          <span className="soluk">
            Soru {no + 1} / {SORULAR.length}
          </span>
        </div>
        <Link to="/demo" className="dugme sade">
          Demodan çık
        </Link>
      </header>

      <section className="kart coz-soru">
        <ZenginMetin metin={s.govde} sinif="coz-govde" />
        {s.sekil_svg && <Sekil svg={s.sekil_svg} cozumlu={false} />}
        <div className="coz-secenekler" role="radiogroup" aria-label="Seçenekler">
          {secenekleri(s).map((x) => (
            <button
              key={x.harf}
              type="button"
              role="radio"
              aria-checked={cevaplar[s.id] === x.harf}
              className={`secenek ${cevaplar[s.id] === x.harf ? 'isaretli' : ''}`}
              onClick={() => sec(x.harf)}
            >
              <span className="secenek-harf">{x.harf}</span>
              <ZenginMetin metin={x.metin} etiket="span" sinif="secenek-metin" />
            </button>
          ))}
        </div>
      </section>

      <nav className="coz-gezinme">
        <button type="button" className="dugme" disabled={no === 0} onClick={() => setNo(no - 1)}>
          Önceki
        </button>
        {no < SORULAR.length - 1 ? (
          <button type="button" className="dugme ana" onClick={() => setNo(no + 1)}>
            Sonraki
          </button>
        ) : (
          <button type="button" className="dugme ana" onClick={() => setOnay(true)}>
            Testi bitir
          </button>
        )}
      </nav>

      <div className="coz-numaralar" aria-label="Sorular">
        {SORULAR.map((x, i) => (
          <button
            key={x.id}
            type="button"
            className={`coz-no ${i === no ? 'simdi' : ''} ${cevaplar[x.id] ? 'cevapli' : ''}`}
            onClick={() => setNo(i)}
            aria-label={`${i + 1}. soru${cevaplar[x.id] ? ', cevaplandı' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {onay && (
        <div className="kart coz-onay" role="dialog" aria-label="Testi bitir">
          <p>
            {bosSayisi > 0 ? `${bosSayisi} soruyu boş bıraktın. ` : 'Tüm soruları cevapladın. '}
            Testi bitirince cevaplarını değiştiremezsin.
          </p>
          <div className="secim-grubu">
            <button type="button" className="dugme ana" onClick={() => setBitti(true)}>
              Evet, bitir
            </button>
            <button type="button" className="dugme" onClick={() => setOnay(false)}>
              Teste dön
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
