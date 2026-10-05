import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../depo/supabaseIstemci'
import { ogrenciGirisi, personelGirisi } from '../oturum/girisIslemleri'
import { rolAnaSayfasi, useOturum } from '../oturum/Oturum'
import { tercihOku, tercihYaz } from '../tercihler'

type Sekme = 'personel' | 'ogrenci'

export function Giris() {
  const o = useOturum()
  const [parametreler] = useSearchParams()
  const [sekme, setSekme] = useState<Sekme>(() => tercihOku<Sekme>('girisSekmesi', 'personel'))
  const [eposta, setEposta] = useState('')
  const [kod, setKod] = useState(() => tercihOku('kurumKodu', ''))
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)

  if (!o.sunucuVar) {
    return (
      <div className="sayfa dar">
        <h1>Giriş</h1>
        <p className="bilgi-kutusu uyari">
          Sunucu bağlantısı tanımlı değil. Uygulama yerel deneme modunda; giriş için README'deki Supabase kurulumu gerekir.
        </p>
        <Link to="/tahta" className="dugme ana">
          Tahta modunu dene
        </Link>
      </div>
    )
  }
  if (o.oturum && o.profil) {
    const donus = parametreler.get('donus')
    return <Navigate to={donus && donus.startsWith('/') ? donus : rolAnaSayfasi(o.profil.rol)} replace />
  }

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    setHata(null)
    setBekliyor(true)
    try {
      const db = supabase()!
      if (sekme === 'personel') await personelGirisi(db, eposta, sifre)
      else {
        await ogrenciGirisi(db, kod, kullaniciAdi, sifre)
        tercihYaz('kurumKodu', kod.trim().toUpperCase())
      }
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    } finally {
      setBekliyor(false)
    }
  }

  const sekmeSec = (s: Sekme) => {
    setSekme(s)
    setHata(null)
    tercihYaz('girisSekmesi', s)
  }

  return (
    <div className="sayfa giris-sayfasi">
      <form className="kart giris-kutusu" onSubmit={(e) => void gonder(e)}>
        <h1>Giriş</h1>
        <div className="sekmeler" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={sekme === 'personel'}
            className={`dugme ${sekme === 'personel' ? 'secili' : ''}`}
            onClick={() => sekmeSec('personel')}
          >
            Öğretmen ve yönetici
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sekme === 'ogrenci'}
            className={`dugme ${sekme === 'ogrenci' ? 'secili' : ''}`}
            onClick={() => sekmeSec('ogrenci')}
          >
            Öğrenci
          </button>
        </div>

        {o.oturum && o.hata && <p className="hata-metni">{o.hata}</p>}

        {sekme === 'personel' ? (
          <label className="alan">
            E-posta
            <input type="email" autoComplete="username" required value={eposta} onChange={(e) => setEposta(e.target.value)} />
          </label>
        ) : (
          <>
            <label className="alan">
              Kurum kodu ya da sınıf kodu
              <input
                autoComplete="organization"
                autoCapitalize="characters"
                required
                value={kod}
                onChange={(e) => setKod(e.target.value.toLocaleUpperCase('tr-TR'))}
              />
            </label>
            <label className="alan">
              Kullanıcı adı
              <input
                autoComplete="username"
                autoCapitalize="none"
                required
                value={kullaniciAdi}
                onChange={(e) => setKullaniciAdi(e.target.value.toLocaleLowerCase('tr-TR'))}
              />
            </label>
          </>
        )}
        <label className="alan">
          Şifre
          <input type="password" autoComplete="current-password" required value={sifre} onChange={(e) => setSifre(e.target.value)} />
        </label>
        {hata && (
          <p className="hata-metni" role="alert">
            {hata}
          </p>
        )}
        <button type="submit" className="dugme ana buyuk" disabled={bekliyor}>
          {bekliyor ? 'Giriş yapılıyor.' : 'Giriş yap'}
        </button>
        <p className="soluk kucuk">
          {sekme === 'ogrenci'
            ? 'Kodu ve şifreni kursundan alırsın. Şifreni unuttuysan öğretmenine söyle.'
            : 'Şifrenizi unuttuysanız kurum yöneticinize başvurun.'}
        </p>
      </form>
    </div>
  )
}
