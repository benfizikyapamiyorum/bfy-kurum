// Öğrencinin online test çözümü (tablet, telefon, bilgisayar). Her soru ayrı ekranda.
// Cevaplar hemen kaydedilir; internet kesilirse kuyrukta bekler, gelince gönderilir.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { trSayi } from '../alan/turkce'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { cozumKatmanlariniKaldir, sekilSvgTemizle } from '../bilesenler/zenginMetin'
import {
  cevapKaydet,
  ogrenciAtamalari,
  ogrenciTestSorulari,
  sonucAyrintisi,
  testiBitir,
  type BitisSonucu,
} from '../depo/ogrenciDeposu'
import { useCevrimici, useVeri } from '../kancalar'
import { tercihOku, tercihYaz } from '../tercihler'

export function TestCoz() {
  const { atama = '' } = useParams()
  const atamalar = useVeri(ogrenciAtamalari, [atama])
  const bilgi = atamalar.veri?.find((a) => a.atama_id === atama)
  if (atamalar.hata) return <div className="sayfa hata-metni">{atamalar.hata.message}</div>
  if (!atamalar.veri) return <div className="sayfa">Yükleniyor.</div>
  if (!bilgi) return <div className="sayfa">Bu test bulunamadı.</div>
  if (bilgi.tamamlandi)
    return (
      <SonucEkrani
        atama={atama}
        baslik={bilgi.baslik}
        sonuc={{ dogru: bilgi.dogru!, yanlis: bilgi.yanlis!, bos: bilgi.bos!, net: bilgi.net! }}
        cozumlerAcik={bilgi.cozumler_acik}
      />
    )
  return <Cozum atama={atama} baslik={bilgi.baslik} sureDk={bilgi.sure_dk} bitis={bilgi.bitis} onBitti={atamalar.yenile} />
}

/** Soruda geçen süre (saniye); yalnızca olay anında çağrılır. */
const soruSuresi = (baslangic: number | null) => (baslangic === null ? null : Math.round((Date.now() - baslangic) / 1000))

function Sekil({ svg, cozumlu = false }: { svg: string; cozumlu?: boolean }) {
  const html = useMemo(() => (cozumlu ? sekilSvgTemizle(svg) : cozumKatmanlariniKaldir(sekilSvgTemizle(svg))), [svg, cozumlu])
  return <div className="coz-sekil" dangerouslySetInnerHTML={{ __html: html }} />
}

function Cozum({
  atama,
  baslik,
  sureDk,
  bitis,
  onBitti,
}: {
  atama: string
  baslik: string
  sureDk: number | null
  bitis: string | null
  onBitti: () => void
}) {
  const v = useVeri(() => ogrenciTestSorulari(atama), [atama])
  const cevrimici = useCevrimici()
  const [no, setNo] = useState(0)
  // Sunucudan gelen cevapların üzerine bu oturumda verilenler yazılır.
  const [degisen, setDegisen] = useState<Record<string, string | null>>({})
  const [onay, setOnay] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const soruBaslangic = useRef<number | null>(null)
  useEffect(() => {
    soruBaslangic.current = Date.now()
  }, [])

  // Süre: testi ilk açtığı an bu cihazda saklanır.
  const [baslangic] = useState(() => {
    const k = `testBaslangic:${atama}`
    const b = tercihOku<number | null>(k, null)
    if (b) return b
    const simdi = Date.now()
    tercihYaz(k, simdi)
    return simdi
  })
  const [simdi, setSimdi] = useState(() => Date.now())
  useEffect(() => {
    const z = setInterval(() => setSimdi(Date.now()), 1000)
    return () => clearInterval(z)
  }, [])
  const bitisZamani = Math.min(
    sureDk ? baslangic + sureDk * 60000 : Infinity,
    bitis ? Date.parse(bitis) : Infinity,
  )
  const kalanSn = Number.isFinite(bitisZamani) ? Math.max(0, Math.round((bitisZamani - simdi) / 1000)) : null

  const cevaplar: Record<string, string | null> = useMemo(
    () => ({ ...Object.fromEntries((v.veri ?? []).map((s) => [s.soru_id, s.verilen])), ...degisen }),
    [v.veri, degisen],
  )

  const bitir = async () => {
    setHata(null)
    setGonderiliyor(true)
    try {
      await testiBitir(atama)
      onBitti()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
      setGonderiliyor(false)
    }
  }

  // Süre bitince otomatik teslim.
  const teslimEdildi = useRef(false)
  useEffect(() => {
    if (kalanSn === 0 && !teslimEdildi.current && v.veri) {
      teslimEdildi.current = true
      void bitir()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalanSn, v.veri])

  if (v.hata) return <div className="sayfa hata-metni">{v.hata.message}</div>
  if (!v.veri) return <div className="sayfa">Yükleniyor.</div>
  const sorular = v.veri
  const s = sorular[no]!
  const bosSayisi = sorular.filter((x) => !cevaplar[x.soru_id]).length

  const sec = (deger: string | null) => {
    const sure = soruSuresi(soruBaslangic.current)
    setDegisen((c) => ({ ...c, [s.soru_id]: deger }))
    void cevapKaydet(atama, s.soru_id, deger, sure)
  }
  const git = (i: number) => {
    soruBaslangic.current = Date.now()
    setNo(i)
  }

  return (
    <div className="sayfa coz-sayfasi">
      <header className="coz-ust">
        <div>
          <h1>{baslik}</h1>
          <span className="soluk">
            Soru {no + 1} / {sorular.length}
          </span>
        </div>
        {kalanSn !== null && (
          <span className={`coz-sure ${kalanSn < 300 ? 'az' : ''}`} role="timer">
            {String(Math.floor(kalanSn / 60)).padStart(2, '0')}:{String(kalanSn % 60).padStart(2, '0')}
          </span>
        )}
      </header>
      {!cevrimici && (
        <p className="bilgi-kutusu uyari">İnternet yok. Cevapların bu cihazda saklanıyor, bağlantı gelince gönderilecek.</p>
      )}

      <section className="kart coz-soru">
        <ZenginMetin metin={s.govde} sinif="coz-govde" />
        {s.sekil_svg && <Sekil svg={s.sekil_svg} />}
        {s.tur === 'acik_uclu' ? (
          <textarea
            className="coz-acik"
            rows={6}
            placeholder="Cevabını yaz."
            value={cevaplar[s.soru_id] ?? ''}
            onChange={(e) => setDegisen((c) => ({ ...c, [s.soru_id]: e.target.value }))}
            onBlur={(e) => sec(e.target.value.trim() || null)}
          />
        ) : (
          <div className="coz-secenekler" role="radiogroup" aria-label="Seçenekler">
            {(s.tur === 'dogru_yanlis'
              ? [
                  { harf: 'D', metin: 'Doğru' },
                  { harf: 'Y', metin: 'Yanlış' },
                ]
              : (s.secenekler ?? [])
            ).map((x) => (
              <button
                key={x.harf}
                type="button"
                role="radio"
                aria-checked={cevaplar[s.soru_id] === x.harf}
                className={`secenek ${cevaplar[s.soru_id] === x.harf ? 'isaretli' : ''}`}
                onClick={() => sec(cevaplar[s.soru_id] === x.harf ? null : x.harf)}
              >
                <span className="secenek-harf">{x.harf}</span>
                <ZenginMetin metin={x.metin} etiket="span" sinif="secenek-metin" />
              </button>
            ))}
          </div>
        )}
      </section>

      <nav className="coz-gezinme">
        <button type="button" className="dugme" disabled={no === 0} onClick={() => git(no - 1)}>
          Önceki
        </button>
        {no < sorular.length - 1 ? (
          <button type="button" className="dugme ana" onClick={() => git(no + 1)}>
            Sonraki
          </button>
        ) : (
          <button type="button" className="dugme ana" onClick={() => setOnay(true)}>
            Testi bitir
          </button>
        )}
      </nav>

      <div className="coz-numaralar" aria-label="Sorular">
        {sorular.map((x, i) => (
          <button
            key={x.soru_id}
            type="button"
            className={`coz-no ${i === no ? 'simdi' : ''} ${cevaplar[x.soru_id] ? 'cevapli' : ''}`}
            onClick={() => git(i)}
            aria-label={`${i + 1}. soru${cevaplar[x.soru_id] ? ', cevaplandı' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {(onay || hata) && (
        <div className="kart coz-onay" role="dialog" aria-label="Testi bitir">
          <p>
            {bosSayisi > 0 ? `${bosSayisi} soruyu boş bıraktın. ` : 'Tüm soruları cevapladın. '}
            Testi bitirince cevaplarını değiştiremezsin.
          </p>
          {hata && <p className="hata-metni">{hata}</p>}
          <div className="secim-grubu">
            <button type="button" className="dugme ana" disabled={gonderiliyor} onClick={() => void bitir()}>
              {gonderiliyor ? 'Gönderiliyor.' : 'Evet, bitir'}
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

function SonucEkrani({
  atama,
  baslik,
  sonuc,
  cozumlerAcik,
}: {
  atama: string
  baslik: string
  sonuc: BitisSonucu
  cozumlerAcik: boolean
}) {
  const v = useVeri(() => sonucAyrintisi(atama), [atama])
  return (
    <div className="sayfa dar">
      <h1>{baslik}</h1>
      <section className="kart sonuc-karti">
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
      {!cozumlerAcik && <p className="soluk">Doğru cevaplar ve çözümler öğretmenin açınca burada görünecek.</p>}
      <ol className="sonuc-sorulari">
        {v.veri?.map((s) => (
          <li key={s.soru_id} className={`kart ${s.dogru_mu === true ? 'dogru' : s.dogru_mu === false ? 'yanlis' : ''}`}>
            <div className="sonuc-soru-ust">
              <strong>{s.sira}. soru</strong>
              <span>
                Senin cevabın: {s.verilen ?? 'boş'}
                {s.dogru_cevap && s.tur !== 'acik_uclu' ? `. Doğru cevap: ${s.dogru_cevap}.` : '.'}
              </span>
            </div>
            <ZenginMetin metin={s.govde} />
            {s.sekil_svg && <Sekil svg={s.sekil_svg} cozumlu={!!s.dogru_cevap} />}
            {s.cozum_adimlari && s.cozum_adimlari.length > 0 && (
              <details>
                <summary>Çözümü göster</summary>
                <ol>
                  {s.cozum_adimlari.map((a, i) => (
                    <li key={i}>
                      <ZenginMetin metin={a.metin} etiket="span" />
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </li>
        ))}
      </ol>
      <Link to="/ogrenci" className="dugme">
        Testlerime dön
      </Link>
    </div>
  )
}
