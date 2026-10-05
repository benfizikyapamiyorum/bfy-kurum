import { useState, type FormEvent } from 'react'
import { sinifaEkle, sinifEkle, sinifGuncelle, sinifKodunuYenile, siniftanCikar } from '../depo/kurumDeposu'
import { useKatalog } from '../katalogBaglami'
import { useKurumVerisi } from './kurumVerisi'

export function Siniflar() {
  const { kurum, siniflar, kullanicilar, yenile } = useKurumVerisi()
  const { yardimci } = useKatalog()
  const [ad, setAd] = useState('')
  const [seviyeId, setSeviyeId] = useState('')
  const [acik, setAcik] = useState<string | null>(null)
  const [eklenecek, setEklenecek] = useState<Set<string>>(new Set())
  const [hata, setHata] = useState<string | null>(null)

  const ogrenciler = kullanicilar.filter((k) => k.rol === 'ogrenci' && k.aktif)
  const calistir = async (is: () => Promise<unknown>) => {
    setHata(null)
    try {
      await is()
      yenile()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }

  const ekle = (e: FormEvent) => {
    e.preventDefault()
    void calistir(async () => {
      await sinifEkle(kurum.id, ad, seviyeId || null)
      setAd('')
    })
  }

  return (
    <div className="panel-dikey">
      <section className="kart">
        <h2>Sınıf aç</h2>
        <form className="form-izgara" onSubmit={ekle}>
          <label>
            Sınıf adı
            <input required placeholder="11-A Sayısal" value={ad} onChange={(e) => setAd(e.target.value)} />
          </label>
          <label>
            Düzey
            <select value={seviyeId} onChange={(e) => setSeviyeId(e.target.value)}>
              <option value="">Seçilmedi</option>
              {yardimci?.katalog.seviyeler.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="dugme ana hizali">
            Sınıf aç
          </button>
        </form>
        {hata && <p className="hata-metni">{hata}</p>}
      </section>

      {siniflar.length === 0 && <p className="soluk">Henüz sınıf yok.</p>}
      {siniflar.map((s) => {
        const uyeler = ogrenciler.filter((o) => o.sinif_idleri.includes(s.id))
        const disarida = ogrenciler.filter((o) => !o.sinif_idleri.includes(s.id))
        const seviye = yardimci?.katalog.seviyeler.find((x) => x.id === s.seviye_id)
        return (
          <section key={s.id} className="kart sinif-karti">
            <div className="kart-ust">
              <div>
                <h2>{s.ad}</h2>
                <p className="soluk">
                  {seviye ? `${seviye.ad}, ` : ''}
                  {uyeler.length} öğrenci
                </p>
              </div>
              <div className="sinif-kodu">
                <span className="soluk kucuk">Sınıf kodu</span>
                <strong>{s.katilim_kodu}</strong>
                <button type="button" className="dugme kucuk sade" onClick={() => void calistir(() => sinifKodunuYenile(s.id))}>
                  Yeni kod
                </button>
              </div>
            </div>
            <div className="secim-grubu">
              <button type="button" className="dugme" onClick={() => setAcik(acik === s.id ? null : s.id)} aria-expanded={acik === s.id}>
                {acik === s.id ? 'Kapat' : 'Öğrencileri düzenle'}
              </button>
              <button
                type="button"
                className="dugme sade"
                onClick={() => {
                  if (window.confirm(`${s.ad} sınıfı arşivlensin mi? Öğrenciler silinmez, geçmiş sonuçlar korunur.`))
                    void calistir(() => sinifGuncelle(s.id, { arsiv: true }))
                }}
              >
                Arşivle
              </button>
            </div>
            {acik === s.id && (
              <div className="uyelik">
                <div>
                  <h3>Sınıftakiler</h3>
                  <ul className="uye-listesi">
                    {uyeler.map((o) => (
                      <li key={o.id}>
                        <span>{o.ad_soyad}</span>
                        <button type="button" className="dugme kucuk sade" onClick={() => void calistir(() => siniftanCikar(s.id, o.id))}>
                          Çıkar
                        </button>
                      </li>
                    ))}
                    {uyeler.length === 0 && <li className="soluk">Sınıfta öğrenci yok.</li>}
                  </ul>
                </div>
                <div>
                  <h3>Eklenebilecekler</h3>
                  <ul className="uye-listesi">
                    {disarida.map((o) => (
                      <li key={o.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={eklenecek.has(o.id)}
                            onChange={(e) =>
                              setEklenecek((x) => {
                                const y = new Set(x)
                                if (e.target.checked) y.add(o.id)
                                else y.delete(o.id)
                                return y
                              })
                            }
                          />
                          {o.ad_soyad}
                          {o.sinif_idleri.length === 0 && <span className="soluk kucuk"> (sınıfsız)</span>}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="dugme ana"
                    disabled={eklenecek.size === 0}
                    onClick={() =>
                      void calistir(async () => {
                        await sinifaEkle(s.id, [...eklenecek])
                        setEklenecek(new Set())
                      })
                    }
                  >
                    Seçilenleri sınıfa ekle
                  </button>
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
