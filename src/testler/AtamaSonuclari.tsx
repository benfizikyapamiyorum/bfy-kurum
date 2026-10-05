// Bir atamanın sonuçları: öğrenci bazında doğru/yanlış/boş/net, soru bazında başarı,
// kâğıt sınavı için elle cevap dizisi girişi ("ABCDE-..."), çözümleri öğrencilere açma.

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cevapDizisiniCozumle } from '../alan/cevapDizisi'
import { trSayi } from '../alan/turkce'
import { atamaGuncelle, atamaSonuclari, elleSonucKaydet, testGetir } from '../depo/testDeposu'
import { useVeri } from '../kancalar'

export function AtamaSonuclari() {
  const { id = '', atama = '' } = useParams()
  const test = useVeri(() => testGetir(id), [id])
  const v = useVeri(() => atamaSonuclari(atama), [atama])
  const [girdiler, setGirdiler] = useState<Record<string, string>>({})
  const [hatalar, setHatalar] = useState<Record<string, string>>({})
  const [kaydediliyor, setKaydediliyor] = useState<string | null>(null)
  const [cozumlerAcik, setCozumlerAcik] = useState<boolean | null>(null)

  if (v.hata || test.hata) return <div className="sayfa hata-metni">{(v.hata ?? test.hata)!.message}</div>
  if (!v.veri || !test.veri) return <div className="sayfa">Yükleniyor.</div>
  const { atama: a, ogrenciler, sonuclar, cevaplar } = v.veri
  const sorular = test.veri.sorular
  const tamamlayanlar = ogrenciler.filter((o) => sonuclar.has(o.id))
  const ortalama = tamamlayanlar.length
    ? tamamlayanlar.reduce((t, o) => t + sonuclar.get(o.id)!.net, 0) / tamamlayanlar.length
    : null

  const mevcutDizi = (ogrenciId: string) =>
    sorular.map((s) => cevaplar.get(ogrenciId)?.get(s.id)?.verilen?.slice(0, 1) ?? '-').join('')

  const kaydet = async (ogrenciId: string) => {
    const girdi = girdiler[ogrenciId] ?? ''
    const c = cevapDizisiniCozumle(girdi, sorular.length)
    if (!c.tamam) {
      setHatalar((h) => ({ ...h, [ogrenciId]: c.hata }))
      return
    }
    setHatalar((h) => ({ ...h, [ogrenciId]: '' }))
    setKaydediliyor(ogrenciId)
    try {
      await elleSonucKaydet(atama, ogrenciId, c.cevaplar)
      setGirdiler((g) => ({ ...g, [ogrenciId]: '' }))
      v.yenile()
    } catch (e) {
      setHatalar((h) => ({ ...h, [ogrenciId]: e instanceof Error ? e.message : String(e) }))
    } finally {
      setKaydediliyor(null)
    }
  }

  // Soru bazında başarı yüzdesi (yalnızca tamamlayanlar).
  const soruBasarisi = sorular.map((s) => {
    const n = tamamlayanlar.length
    if (n === 0 || s.tur === 'acik_uclu') return null
    const d = tamamlayanlar.filter((o) => cevaplar.get(o.id)?.get(s.id)?.dogru_mu === true).length
    return Math.round((100 * d) / n)
  })

  return (
    <div className="sayfa genis-sayfa">
      <div className="kart-ust">
        <div>
          <h1>{test.veri.test.baslik}</h1>
          <p className="soluk">
            {a.sinif_adi}: {tamamlayanlar.length} / {ogrenciler.length} öğrenci tamamladı
            {ortalama !== null && `, ortalama net ${trSayi(ortalama)}`}.
          </p>
        </div>
        <div className="secim-grubu">
          <label className="anahtar-satiri">
            <input
              type="checkbox"
              checked={cozumlerAcik ?? a.cozumler_acik}
              onChange={async (e) => {
                const deger = e.target.checked
                setCozumlerAcik(deger)
                try {
                  await atamaGuncelle(a.id, { cozumler_acik: deger })
                } catch {
                  setCozumlerAcik(!deger)
                }
              }}
            />
            <span>Doğru cevapları ve çözümleri öğrencilere aç.</span>
          </label>
          <Link to={`/testler/${id}/atamalar`} className="dugme sade">
            Atamalara dön
          </Link>
        </div>
      </div>

      <section className="kart">
        <h2>Öğrenciler</h2>
        <p className="soluk kucuk">
          Kâğıt üzerinde yapılan sınavda cevap dizisini yazın: harfler sırayla, boş için "-" (ör. ABCDE-BAC). Boşluklar yok
          sayılır. Net hesabı: {Number(test.veri.test.yanlis_dogru_orani) === 0
            ? 'yanlışlar doğruyu götürmez'
            : `${trSayi(Number(test.veri.test.yanlis_dogru_orani))} yanlış 1 doğruyu götürür`}
          .
        </p>
        <div className="tablo-kaydir">
          <table className="tablo sonuc-tablosu">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>D</th>
                <th>Y</th>
                <th>B</th>
                <th>Net</th>
                <th>Kaynak</th>
                <th>Cevap dizisi</th>
              </tr>
            </thead>
            <tbody>
              {ogrenciler.map((o) => {
                const s = sonuclar.get(o.id)
                return (
                  <tr key={o.id}>
                    <td>{o.ad_soyad}</td>
                    <td>{s?.dogru ?? ''}</td>
                    <td>{s?.yanlis ?? ''}</td>
                    <td>{s?.bos ?? ''}</td>
                    <td className="net">{s ? trSayi(s.net) : <span className="soluk">Girmedi</span>}</td>
                    <td>{s ? (s.kaynak === 'elle' ? 'Kâğıt' : 'Online') : ''}</td>
                    <td>
                      <form
                        className="elle-giris"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void kaydet(o.id)
                        }}
                      >
                        <input
                          aria-label={`${o.ad_soyad} cevap dizisi`}
                          className="sifre"
                          placeholder={s ? mevcutDizi(o.id) : `${sorular.length} cevap`}
                          value={girdiler[o.id] ?? ''}
                          onChange={(e) => setGirdiler((g) => ({ ...g, [o.id]: e.target.value }))}
                        />
                        <button type="submit" className="dugme kucuk" disabled={kaydediliyor === o.id || !(girdiler[o.id] ?? '').trim()}>
                          Kaydet
                        </button>
                        {hatalar[o.id] && <span className="hata-metni kucuk">{hatalar[o.id]}</span>}
                      </form>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="kart">
        <h2>Soru bazında başarı</h2>
        <div className="soru-basarilari">
          {sorular.map((s, i) => {
            const b = soruBasarisi[i] ?? null
            return (
              <div key={s.id} className="soru-basarisi" title={`${i + 1}. soru, cevap ${s.dogru_cevap}`}>
                <span className="soru-basarisi-no">{i + 1}</span>
                <span className="cubuk dikey">
                  <span style={{ height: `${b ?? 0}%` }} className={b !== null && b < 50 ? 'az' : ''} />
                </span>
                <span className="kucuk">{b === null ? '–' : `%${b}`}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
