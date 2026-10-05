// Yeni açılan hesapların listesi ve yazdırılabilir giriş kartları.
// Şifreler yalnızca bu ekranda bir kez görünür; sunucuda okunabilir hâlde saklanmaz.

import type { HesapSonucu } from '../depo/kurumDeposu'
import { marka } from '../yapilandirma/marka'
import { useKurumVerisi } from './kurumVerisi'

export function HesapSonuclari({ sonuclar, kapat }: { sonuclar: HesapSonucu[]; kapat: () => void }) {
  const { kurum } = useKurumVerisi()
  const basarili = sonuclar.filter((s) => s.tamam)
  const hatali = sonuclar.filter((s) => !s.tamam)
  const adres = typeof window !== 'undefined' ? window.location.host : marka.web

  return (
    <section className="kart hesap-sonuclari" aria-live="polite">
      <h2>
        {basarili.length} hesap açıldı{hatali.length ? `, ${hatali.length} hesap açılamadı` : ''}.
      </h2>
      <p className="bilgi-kutusu uyari">
        Şifreler yalnızca şimdi görünür. Giriş kartlarını yazdırın ya da şifreleri not edin. Unutulan şifre daha sonra
        sıfırlanabilir.
      </p>
      {hatali.length > 0 && (
        <ul className="hata-listesi">
          {hatali.map((h, i) => (
            <li key={i}>
              <strong>{h.ad_soyad}</strong>: {h.hata}
            </li>
          ))}
        </ul>
      )}
      {basarili.length > 0 && (
        <table className="tablo">
          <thead>
            <tr>
              <th>Ad soyad</th>
              <th>{basarili.some((b) => b.rol === 'ogrenci') ? 'Kullanıcı adı' : 'E-posta'}</th>
              <th>Şifre</th>
            </tr>
          </thead>
          <tbody>
            {basarili.map((b) => (
              <tr key={b.id}>
                <td>{b.ad_soyad}</td>
                <td>{b.rol === 'ogrenci' ? b.kullanici_adi : b.eposta}</td>
                <td className="sifre">{b.sifre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="secim-grubu">
        {basarili.length > 0 && (
          <button type="button" className="dugme ana" onClick={() => window.print()}>
            Giriş kartlarını yazdır
          </button>
        )}
        <button type="button" className="dugme" onClick={kapat}>
          Kapat
        </button>
      </div>

      <div className="yazdirma-alani" aria-hidden="true">
        {basarili.map((b) => (
          <div key={b.id} className="giris-karti">
            <div className="giris-karti-kurum">{kurum.ad}</div>
            <div className="giris-karti-ad">{b.ad_soyad}</div>
            <dl>
              <dt>Adres</dt>
              <dd>{adres}</dd>
              {b.rol === 'ogrenci' ? (
                <>
                  <dt>Kurum kodu</dt>
                  <dd>{kurum.kod}</dd>
                  <dt>Kullanıcı adı</dt>
                  <dd>{b.kullanici_adi}</dd>
                </>
              ) : (
                <>
                  <dt>E-posta</dt>
                  <dd>{b.eposta}</dd>
                </>
              )}
              <dt>Şifre</dt>
              <dd className="sifre">{b.sifre}</dd>
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
