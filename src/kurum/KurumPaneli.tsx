import { NavLink, Outlet } from 'react-router-dom'
import { useOturum } from '../oturum/Oturum'
import { KurumVerisiSaglayici } from './kurumVerisi'

export function KurumPaneli() {
  const { kurum, lisans } = useOturum()
  if (!kurum) return <div className="sayfa">Kurum bilgisi bulunamadı.</div>
  return (
    <div className="sayfa panel">
      <header className="panel-ust">
        <div>
          <h1>{kurum.ad}</h1>
          <p className="soluk">Kurum paneli.</p>
        </div>
        {lisans && !lisans.gecerli && <p className="bilgi-kutusu uyari">{lisans.mesaj} Yeni kayıt açılamaz.</p>}
      </header>
      <nav className="panel-sekmeleri" aria-label="Kurum paneli">
        <NavLink end to="/kurum" className="dugme sade">
          Genel
        </NavLink>
        <NavLink to="/kurum/ogretmenler" className="dugme sade">
          Öğretmenler
        </NavLink>
        <NavLink to="/kurum/ogrenciler" className="dugme sade">
          Öğrenciler
        </NavLink>
        <NavLink to="/kurum/siniflar" className="dugme sade">
          Sınıflar
        </NavLink>
      </nav>
      <KurumVerisiSaglayici kurum={kurum}>
        <Outlet />
      </KurumVerisiSaglayici>
    </div>
  )
}
