import { Link, NavLink, Outlet } from 'react-router-dom'
import { marka } from '../yapilandirma/marka'
import { ortam } from '../yapilandirma/ortam'
import { Simge } from './Simge'
import { UrunIsareti } from './UrunIsareti'

/** Tahta modu dışındaki sayfaların ortak çerçevesi. */
export function Duzen() {
  return (
    <div className="duzen">
      <header className="ust-serit">
        <Link to="/" className="urun">
          <UrunIsareti />
          {marka.urunAdi}
        </Link>
        <span className="bosluk" />
        <nav className="ust-menu" aria-label="Ana menü">
          <NavLink to="/tahta" className="dugme sade">
            <Simge ad="tahta" />
            Tahta modu
          </NavLink>
          <NavLink to="/icerik/ice-aktar" className="dugme sade">
            <Simge ad="yukle" />
            <span className="dar-gizle">Kit içe aktar</span>
          </NavLink>
          <NavLink to="/ayarlar" className="dugme sade" aria-label="Ayarlar">
            <Simge ad="ayarlar" />
          </NavLink>
        </nav>
      </header>
      {!ortam.supabaseVar && (
        <div className="mod-seridi" role="status">
          Yerel deneme modu: sunucu bağlantısı tanımlı değil, örnek veriler kullanılıyor.
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <AltBilgi />
    </div>
  )
}

export function AltBilgi() {
  return (
    <footer className="alt-bilgi">
      <span>
        {marka.sahipAdi}, {marka.web}, {marka.sosyalMedya}
      </span>
      <span>{marka.programIbaresi}</span>
      <Link to="/aydinlatma-metni">Aydınlatma metni</Link>
      <Link to="/gizlilik">Gizlilik politikası</Link>
    </footer>
  )
}
