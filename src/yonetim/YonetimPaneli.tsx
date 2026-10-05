import { NavLink, Outlet } from 'react-router-dom'

export function YonetimPaneli() {
  return (
    <div className="sayfa panel">
      <header className="panel-ust">
        <div>
          <h1>Süper admin</h1>
          <p className="soluk">Kurumlar, lisanslar ve merkezî içerik bankası.</p>
        </div>
      </header>
      <nav className="panel-sekmeleri" aria-label="Süper admin paneli">
        <NavLink end to="/yonetim" className="dugme sade">
          Kurumlar
        </NavLink>
        <NavLink to="/yonetim/sorular" className="dugme sade">
          Soru bankası
        </NavLink>
        <NavLink to="/yonetim/icerikler" className="dugme sade">
          İçerikler
        </NavLink>
        <NavLink to="/yonetim/ice-aktarim" className="dugme sade">
          Toplu içe aktarım
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
