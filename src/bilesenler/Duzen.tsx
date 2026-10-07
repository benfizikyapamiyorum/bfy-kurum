import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { rolAnaSayfasi, useOturum } from '../oturum/Oturum'
import { marka } from '../yapilandirma/marka'
import { ortam } from '../yapilandirma/ortam'
import { Simge } from './Simge'
import { UrunIsareti } from './UrunIsareti'

/** Tahta modu dışındaki sayfaların ortak çerçevesi. */
function KullaniciMenusu() {
  const o = useOturum()
  const git = useNavigate()
  if (!o.sunucuVar) return null
  if (!o.oturum || !o.profil) {
    return (
      <NavLink to="/giris" className="dugme sade">
        <Simge ad="kapi" />
        Giriş
      </NavLink>
    )
  }
  return (
    <>
      <NavLink to={rolAnaSayfasi(o.profil.rol)} className="dugme sade kullanici-adi">
        {o.profil.ad_soyad}
      </NavLink>
      <button
        type="button"
        className="dugme sade"
        onClick={async () => {
          await o.cikis()
          git('/')
        }}
        aria-label="Çıkış"
      >
        <Simge ad="kapi" />
        <span className="dar-gizle">Çıkış</span>
      </button>
    </>
  )
}

export function Duzen() {
  const { profil } = useOturum()
  const personel = !profil || profil.rol !== 'ogrenci'
  return (
    <div className="duzen">
      <header className="ust-serit">
        <Link to="/" className="urun">
          <UrunIsareti />
          <span className="urun-adi">{marka.urunAdi}</span>
        </Link>
        <span className="bosluk" />
        <nav className="ust-menu" aria-label="Ana menü">
          {personel && (
            <NavLink to="/tahta" className="dugme sade">
              <Simge ad="tahta" />
              <span className="dar-gizle">Tahta modu</span>
            </NavLink>
          )}
          {profil?.rol === 'superadmin' && (
            <NavLink to="/yonetim" className="dugme sade">
              <Simge ad="belge" />
              <span className="dar-gizle">Yönetim</span>
            </NavLink>
          )}
          {!profil && !ortam.tanitim && (
            <NavLink to="/icerik/ice-aktar" className="dugme sade">
              <Simge ad="yukle" />
              <span className="dar-gizle">Kit içe aktar</span>
            </NavLink>
          )}
          <NavLink to="/ayarlar" className="dugme sade" aria-label="Ayarlar">
            <Simge ad="ayarlar" />
          </NavLink>
          <KullaniciMenusu />
        </nav>
      </header>
      {!ortam.supabaseVar && !ortam.tanitim && (
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
        İçerik: {marka.sahipAdi}, {marka.web}, {marka.sosyalMedya}
      </span>
      <span>{marka.programIbaresi}</span>
      <Link to="/aydinlatma-metni">Aydınlatma metni</Link>
      <Link to="/gizlilik">Gizlilik politikası</Link>
    </footer>
  )
}
