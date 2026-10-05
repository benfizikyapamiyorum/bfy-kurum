import { useState, type FormEvent } from 'react'
import { hesapAc, type HesapSonucu } from '../depo/kurumDeposu'
import { HesapSonuclari } from './HesapSonuclari'
import { KullaniciIslemleri } from './KullaniciIslemleri'
import { useKurumVerisi } from './kurumVerisi'

export function Ogretmenler() {
  const { kurum, kullanicilar, yenile } = useKurumVerisi()
  const personel = kullanicilar.filter((k) => k.rol === 'ogretmen' || k.rol === 'kurum_yonetici')
  const [ad, setAd] = useState('')
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [sonuclar, setSonuclar] = useState<HesapSonucu[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [yeniSifre, setYeniSifre] = useState<{ ad: string; sifre: string } | null>(null)

  const ekle = async (e: FormEvent) => {
    e.preventDefault()
    setHata(null)
    setBekliyor(true)
    try {
      const s = await hesapAc(kurum.id, [{ rol: 'ogretmen', ad_soyad: ad, eposta, sifre: sifre || null }])
      setSonuclar(s)
      if (s.every((x) => x.tamam)) {
        setAd('')
        setEposta('')
        setSifre('')
      }
      yenile()
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    } finally {
      setBekliyor(false)
    }
  }

  return (
    <div className="panel-dikey">
      {sonuclar && <HesapSonuclari sonuclar={sonuclar} kapat={() => setSonuclar(null)} />}
      <section className="kart">
        <h2>Öğretmen ekle</h2>
        <form className="form-izgara" onSubmit={(e) => void ekle(e)}>
          <label>
            Ad soyad
            <input required minLength={2} value={ad} onChange={(e) => setAd(e.target.value)} />
          </label>
          <label>
            E-posta
            <input type="email" required value={eposta} onChange={(e) => setEposta(e.target.value)} />
          </label>
          <label>
            Şifre (boş bırakılırsa üretilir)
            <input minLength={6} value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </label>
          <button type="submit" className="dugme ana hizali" disabled={bekliyor}>
            Hesap aç
          </button>
        </form>
        {hata && <p className="hata-metni">{hata}</p>}
      </section>

      <section className="kart">
        <h2>Öğretmenler ve yöneticiler ({personel.length})</h2>
        {yeniSifre && (
          <p className="bilgi-kutusu">
            {yeniSifre.ad} için yeni şifre: <strong className="sifre">{yeniSifre.sifre}</strong>
          </p>
        )}
        <table className="tablo">
          <thead>
            <tr>
              <th>Ad soyad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {personel.map((k) => (
              <tr key={k.id} className={k.aktif ? '' : 'pasif'}>
                <td>{k.ad_soyad}</td>
                <td>{k.eposta}</td>
                <td>{k.rol === 'kurum_yonetici' ? 'Yönetici' : 'Öğretmen'}</td>
                <td>{k.aktif ? 'Aktif' : 'Pasif'}</td>
                <td>
                  {k.rol === 'ogretmen' && (
                    <KullaniciIslemleri k={k} onSifre={(s) => setYeniSifre({ ad: k.ad_soyad, sifre: s })} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
