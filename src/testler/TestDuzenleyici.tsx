// Test oluşturucu: kazanım, ünite, zorluk ve türe göre süzülen havuzdan soru seçme,
// otomatik oluşturma, sıralama. Aynı soru testte iki kez bulunamaz; seçilen sınıfa
// daha önce verilmiş sorular işaretlenir.

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SORU_TURU_ADI, TEST_TURU_ADI, ZORLUK_ADI } from '../alan/etiketler'
import { otomatikTestOlustur, testeSoruEkle } from '../alan/testOlusturma'
import type { Soru, SoruTuru, TestAyarlari, TestTuru } from '../alan/tipler'
import { OrnekRozeti, ZorlukGostergesi } from '../bilesenler/Rozetler'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { siniflar } from '../depo/kurumDeposu'
import { kazanimSorulari, sinifaVerilmisSorular, testGetir, testKaydet, testSil, type TestTaslagi } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { useOturum } from '../oturum/Oturum'

const BOS_TASLAK: TestTaslagi = {
  baslik: '',
  tur: 'mini_test',
  aciklama: null,
  sure_dk: 40,
  yanlis_dogru_orani: 4,
  ayarlar: { duzen: 'iki', islemAlani: 'kisa', filigran: false },
}

export function TestDuzenleyici() {
  const { id } = useParams()
  const git = useNavigate()
  const { kurum, profil } = useOturum()
  const { yardimci } = useKatalog()

  const [taslak, setTaslak] = useState<TestTaslagi>(BOS_TASLAK)
  const [secilen, setSecilen] = useState<Soru[]>([])
  const [yuklendi, setYuklendi] = useState(!id)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  // Süzgeçler
  const [seviyeId, setSeviyeId] = useState('')
  const [uniteIdleri, setUniteIdleri] = useState<string[]>([])
  const [kazanimIdleri, setKazanimIdleri] = useState<string[]>([])
  const [zorluklar, setZorluklar] = useState<number[]>([])
  const [turler, setTurler] = useState<SoruTuru[]>([])
  const [baglam, setBaglam] = useState(false)
  const [hedefSinif, setHedefSinif] = useState('')
  const [otoAdet, setOtoAdet] = useState(10)
  const [acikSoru, setAcikSoru] = useState<string | null>(null)

  // Var olan testi yükle.
  useEffect(() => {
    if (!id) return
    void testGetir(id).then(
      ({ test, sorular }) => {
        setTaslak({
          id: test.id,
          baslik: test.baslik,
          tur: test.tur,
          aciklama: test.aciklama,
          sure_dk: test.sure_dk,
          yanlis_dogru_orani: Number(test.yanlis_dogru_orani),
          ayarlar: { ...BOS_TASLAK.ayarlar, ...test.ayarlar },
        })
        setSecilen(sorular)
        // Süzgeci testin ilk sorusunun ünitesine ayarla.
        const k = sorular[0]?.kazanim_idleri[0]
        const u = k ? yardimci?.unite(yardimci.kazanim(k)?.unite_id ?? '') : undefined
        if (u) {
          setSeviyeId(u.seviye_id)
          setUniteIdleri([u.id])
        }
        setYuklendi(true)
      },
      (e: Error) => setHata(e.message),
    )
  }, [id, yardimci])

  const sinifListesi = useVeri(() => (kurum ? siniflar(kurum.id) : Promise.resolve([])), [kurum?.id])
  const seviyeler = yardimci?.katalog.seviyeler.filter((s) => yardimci.seviyeninUniteleri(s.id).length > 0) ?? []
  const uniteler = seviyeId ? (yardimci?.seviyeninUniteleri(seviyeId) ?? []) : []
  const uniteKazanimlari = uniteIdleri.flatMap((u) => yardimci?.uniteninKazanimlari(u) ?? [])
  const etkinKazanimlar = kazanimIdleri.length ? kazanimIdleri : uniteKazanimlari.map((k) => k.id)

  const havuz = useVeri(() => kazanimSorulari(etkinKazanimlar), [etkinKazanimlar.join(',')])
  const verilmis = useVeri(
    () => (hedefSinif ? sinifaVerilmisSorular(hedefSinif, taslak.id) : Promise.resolve(new Set<string>())),
    [hedefSinif, taslak.id],
  )

  const suzulmus = useMemo(
    () =>
      (havuz.veri ?? [])
        .filter(
          (s) =>
            (zorluklar.length === 0 || zorluklar.includes(s.zorluk)) &&
            (turler.length === 0 || turler.includes(s.tur)) &&
            (!baglam || s.baglam_temelli),
        )
        .sort((a, b) => a.zorluk - b.zorluk),
    [havuz.veri, zorluklar, turler, baglam],
  )
  const secilenIdler = new Set(secilen.map((s) => s.id))

  const kazanimKodu = (s: Soru) => s.kazanim_idleri.map((k) => yardimci?.kazanim(k)?.kod).filter(Boolean).join(', ')
  const degistir = <T,>(liste: T[], x: T) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x])

  const ekle = (s: Soru) => {
    try {
      testeSoruEkle(
        secilen.map((x) => x.id),
        s.id,
      )
      setSecilen((x) => [...x, s])
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }
  const tasi = (i: number, yon: -1 | 1) =>
    setSecilen((x) => {
      const y = [...x]
      const j = i + yon
      if (j < 0 || j >= y.length) return x
      ;[y[i], y[j]] = [y[j]!, y[i]!]
      return y
    })

  const otomatik = () => {
    setHata(null)
    const kalan = suzulmus.filter((s) => !secilenIdler.has(s.id))
    const r = otomatikTestOlustur({
      havuz: kalan,
      kazanimIdleri: etkinKazanimlar,
      adet: otoAdet,
      dahaOnceVerilenler: verilmis.veri ?? undefined,
    })
    const yeni = r.soruIdleri.map((x) => kalan.find((s) => s.id === x)!).filter(Boolean)
    setSecilen((x) => [...x, ...yeni])
    setMesaj(r.uyarilar.length ? r.uyarilar.join(' ') : `${yeni.length} soru eklendi.`)
  }

  const kaydet = async () => {
    setHata(null)
    setMesaj(null)
    if (!taslak.baslik.trim()) return setHata('Test başlığı yazın.')
    if (secilen.length === 0) return setHata('Teste en az bir soru ekleyin.')
    try {
      const yeniId = await testKaydet(
        kurum!.id,
        profil!.id,
        taslak,
        secilen.map((s) => s.id),
      )
      setMesaj('Test kaydedildi.')
      if (!taslak.id) git(`/testler/${yeniId}`, { replace: true })
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }

  const ayar = (a: Partial<TestAyarlari>) => setTaslak((t) => ({ ...t, ayarlar: { ...t.ayarlar, ...a } }))

  if (!yuklendi) return <div className="sayfa">{hata ? <p className="hata-metni">{hata}</p> : 'Yükleniyor.'}</div>

  return (
    <div className="sayfa genis-sayfa">
      <div className="kart-ust">
        <h1>{taslak.id ? taslak.baslik || 'Test' : 'Yeni test'}</h1>
        <div className="secim-grubu">
          <Link to="/testler" className="dugme sade">
            Testlere dön
          </Link>
        </div>
      </div>

      <div className="test-duzenleyici">
        {/* ---------------- Soru havuzu ---------------- */}
        <section className="kart havuz">
          <h2>Soru havuzu</h2>
          <div className="suzgecler">
            <label className="alan">
              Sınıf düzeyi
              <select
                value={seviyeId}
                onChange={(e) => {
                  setSeviyeId(e.target.value)
                  setUniteIdleri([])
                  setKazanimIdleri([])
                }}
              >
                <option value="">Seçin</option>
                {seviyeler.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>
            </label>
            {uniteler.length > 0 && (
              <div className="cip-satiri" role="group" aria-label="Üniteler">
                {uniteler.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className={`cip ${uniteIdleri.includes(u.id) ? 'secili' : ''}`}
                    aria-pressed={uniteIdleri.includes(u.id)}
                    onClick={() => {
                      setUniteIdleri((x) => degistir(x, u.id))
                      setKazanimIdleri([])
                    }}
                  >
                    {u.no}. {u.ad}
                  </button>
                ))}
              </div>
            )}
            {uniteKazanimlari.length > 0 && (
              <details className="kazanim-suzgeci">
                <summary>
                  Öğrenme çıktıları {kazanimIdleri.length ? `(${kazanimIdleri.length} seçili)` : '(tümü)'}
                </summary>
                {uniteKazanimlari.map((k) => (
                  <label key={k.id} className="kazanim-satiri">
                    <input
                      type="checkbox"
                      checked={kazanimIdleri.includes(k.id)}
                      onChange={() => setKazanimIdleri((x) => degistir(x, k.id))}
                    />
                    <span>
                      <strong>{k.kod}</strong> {k.metin}
                    </span>
                  </label>
                ))}
              </details>
            )}
            <div className="cip-satiri" role="group" aria-label="Zorluk">
              {[1, 2, 3, 4, 5].map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`cip ${zorluklar.includes(z) ? 'secili' : ''}`}
                  aria-pressed={zorluklar.includes(z)}
                  onClick={() => setZorluklar((x) => degistir(x, z))}
                  title={ZORLUK_ADI[z]}
                >
                  Zorluk {z}
                </button>
              ))}
            </div>
            <div className="cip-satiri" role="group" aria-label="Soru türü">
              {(Object.keys(SORU_TURU_ADI) as SoruTuru[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`cip ${turler.includes(t) ? 'secili' : ''}`}
                  aria-pressed={turler.includes(t)}
                  onClick={() => setTurler((x) => degistir(x, t))}
                >
                  {SORU_TURU_ADI[t]}
                </button>
              ))}
              <button type="button" className={`cip ${baglam ? 'secili' : ''}`} aria-pressed={baglam} onClick={() => setBaglam((b) => !b)}>
                Bağlam temelli
              </button>
            </div>
            <label className="alan">
              Hangi sınıf için? (daha önce verilen sorular işaretlenir)
              <select value={hedefSinif} onChange={(e) => setHedefSinif(e.target.value)}>
                <option value="">Sınıf seçilmedi</option>
                {sinifListesi.veri?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>
            </label>
            <div className="satir-form">
              <label className="alan">
                Soru sayısı
                <input type="number" min={1} max={100} value={otoAdet} onChange={(e) => setOtoAdet(Math.max(1, +e.target.value || 1))} />
              </label>
              <button type="button" className="dugme" onClick={otomatik} disabled={suzulmus.length === 0}>
                Otomatik oluştur
              </button>
            </div>
            <p className="soluk kucuk">
              Otomatik oluşturma seçili öğrenme çıktılarına dengeli dağıtır, zorluğu yaklaşık %30 kolay, %40 orta, %30 zor
              ayarlar ve bu sınıfa daha önce verilmiş soruları en sona bırakır.
            </p>
          </div>

          {!seviyeId ? (
            <p className="soluk">Soruları görmek için sınıf düzeyi ve ünite seçin.</p>
          ) : havuz.yukleniyor ? (
            <p className="soluk">Sorular yükleniyor.</p>
          ) : (
            <>
              <p className="soluk kucuk">{suzulmus.length} soru.</p>
              <ul className="havuz-listesi">
                {suzulmus.map((s) => {
                  const testte = secilenIdler.has(s.id)
                  const verildi = verilmis.veri?.has(s.id)
                  return (
                    <li key={s.id} className={`havuz-sorusu ${testte ? 'testte' : ''}`}>
                      <div className="havuz-ust">
                        <span className="kazanim-kodu">{kazanimKodu(s)}</span>
                        <span className="rozet">{SORU_TURU_ADI[s.tur]}</span>
                        <ZorlukGostergesi zorluk={s.zorluk} />
                        {s.baglam_temelli && <span className="rozet">Bağlam</span>}
                        {s.ornek && <OrnekRozeti />}
                        {verildi && <span className="rozet uyari-rozet">Bu sınıfa verildi</span>}
                      </div>
                      <button type="button" className="havuz-govde" onClick={() => setAcikSoru(acikSoru === s.id ? null : s.id)}>
                        <ZenginMetin metin={s.govde} sinif={acikSoru === s.id ? '' : 'kisalt'} />
                      </button>
                      {acikSoru === s.id && s.sekil_svg && <SekilOnizleme svg={s.sekil_svg} />}
                      <button type="button" className="dugme kucuk" disabled={testte} onClick={() => ekle(s)}>
                        {testte ? 'Testte' : 'Ekle'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        {/* ---------------- Test ---------------- */}
        <section className="kart test-paneli">
          <h2>Test</h2>
          <div className="form-dikey">
            <label className="alan">
              Başlık
              <input value={taslak.baslik} onChange={(e) => setTaslak({ ...taslak, baslik: e.target.value })} placeholder="11. sınıf Newton yasaları mini test" />
            </label>
            <div className="form-izgara">
              <label>
                Tür
                <select value={taslak.tur} onChange={(e) => setTaslak({ ...taslak, tur: e.target.value as TestTuru })}>
                  {(Object.keys(TEST_TURU_ADI) as TestTuru[]).map((t) => (
                    <option key={t} value={t}>
                      {TEST_TURU_ADI[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Süre (dakika)
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={taslak.sure_dk ?? ''}
                  onChange={(e) => setTaslak({ ...taslak, sure_dk: e.target.value ? +e.target.value : null })}
                />
              </label>
              <label>
                Net hesabı
                <select
                  value={taslak.yanlis_dogru_orani}
                  onChange={(e) => setTaslak({ ...taslak, yanlis_dogru_orani: +e.target.value })}
                >
                  <option value={4}>4 yanlış 1 doğruyu götürür</option>
                  <option value={3}>3 yanlış 1 doğruyu götürür</option>
                  <option value={0}>Yanlış doğruyu götürmez</option>
                </select>
              </label>
              <label>
                Sayfa düzeni
                <select value={taslak.ayarlar.duzen} onChange={(e) => ayar({ duzen: e.target.value as 'tek' | 'iki' })}>
                  <option value="iki">İki sütun</option>
                  <option value="tek">Tek sütun</option>
                </select>
              </label>
              <label>
                İşlem alanı
                <select
                  value={taslak.ayarlar.islemAlani}
                  onChange={(e) => ayar({ islemAlani: e.target.value as 'yok' | 'kisa' | 'genis' })}
                >
                  <option value="yok">Yok</option>
                  <option value="kisa">Kısa</option>
                  <option value="genis">Geniş</option>
                </select>
              </label>
            </div>
            <label className="anahtar-satiri">
              <input type="checkbox" checked={!!taslak.ayarlar.filigran} onChange={(e) => ayar({ filigran: e.target.checked })} />
              <span>Sayfalara kurum adıyla soluk filigran ekle.</span>
            </label>
          </div>

          <h3>
            Sorular ({secilen.length})
          </h3>
          {secilen.length === 0 && <p className="soluk">Soldaki havuzdan soru ekleyin ya da otomatik oluşturun.</p>}
          <ol className="test-sorulari">
            {secilen.map((s, i) => (
              <li key={s.id}>
                <span className="test-soru-no">{i + 1}</span>
                <span className="test-soru-ozet">
                  <ZenginMetin metin={s.govde} etiket="span" sinif="kisalt" />
                  <span className="soluk kucuk">
                    {kazanimKodu(s)}, zorluk {s.zorluk}
                  </span>
                </span>
                <span className="test-soru-dugmeleri">
                  <button type="button" className="dugme kucuk sade" onClick={() => tasi(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">
                    ↑
                  </button>
                  <button
                    type="button"
                    className="dugme kucuk sade"
                    onClick={() => tasi(i, 1)}
                    disabled={i === secilen.length - 1}
                    aria-label="Aşağı taşı"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="dugme kucuk sade"
                    onClick={() => setSecilen((x) => x.filter((y) => y.id !== s.id))}
                    aria-label="Testten çıkar"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {mesaj && <p className="basari-metni">{mesaj}</p>}
          {hata && <p className="hata-metni">{hata}</p>}
          <div className="secim-grubu">
            <button type="button" className="dugme ana" onClick={() => void kaydet()}>
              Kaydet
            </button>
            {taslak.id && (
              <button
                type="button"
                className="dugme sade tehlike"
                onClick={async () => {
                  if (!window.confirm('Test, atamaları ve sonuçlarıyla birlikte silinsin mi?')) return
                  await testSil(taslak.id!)
                  git('/testler')
                }}
              >
                Sil
              </button>
            )}
          </div>
          {taslak.id && (
            <div className="cikti-baglantilari">
              <h3>Çıktılar ve kullanım</h3>
              <div className="secim-grubu">
                <a className="dugme" href={`/testler/${taslak.id}/yazdir/ogrenci`} target="_blank" rel="noreferrer">
                  Öğrenci PDF
                </a>
                <a className="dugme" href={`/testler/${taslak.id}/yazdir/ogretmen`} target="_blank" rel="noreferrer">
                  Cevaplı öğretmen PDF
                </a>
                <a className="dugme" href={`/testler/${taslak.id}/yazdir/optik`} target="_blank" rel="noreferrer">
                  Optik form
                </a>
                <Link className="dugme" to={`/tahta/test/${taslak.id}/1`}>
                  Tahtada aç
                </Link>
                <Link className="dugme ana" to={`/testler/${taslak.id}/atamalar`}>
                  Sınıfa ata ve sonuçlar
                </Link>
              </div>
              <p className="soluk kucuk">Kaydetmediğiniz değişiklikler çıktılara yansımaz.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SekilOnizleme({ svg }: { svg: string }) {
  const html = useMemo(() => sekilSvgTemizle(svg), [svg])
  return <div className="sekil-onizleme" dangerouslySetInnerHTML={{ __html: html }} />
}
