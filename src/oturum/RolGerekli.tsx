import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import type { Rol } from '../alan/tipler'
import { rolAnaSayfasi, useOturum } from './Oturum'

/** Sayfayı yalnızca verilen rollere açar. Oturum yoksa giriş sayfasına yönlendirir. */
export function RolGerekli({ roller, children }: { roller: Rol[]; children: ReactNode }) {
  const o = useOturum()
  const konum = useLocation()
  if (!o.sunucuVar) {
    return (
      <div className="sayfa dar">
        <h1>Sunucu bağlantısı gerekli.</h1>
        <p className="soluk">
          Bu bölüm giriş gerektirir. Uygulama şu an yerel deneme modunda çalışıyor; Supabase bağlantısı README'deki
          adımlarla kurulunca açılır.
        </p>
        <Link to="/tahta" className="dugme ana">
          Tahta modunu dene
        </Link>
      </div>
    )
  }
  if (!o.hazir) return <div className="sayfa">Yükleniyor.</div>
  if (!o.oturum) return <Navigate to={`/giris?donus=${encodeURIComponent(konum.pathname)}`} replace />
  if (!o.profil || !roller.includes(o.profil.rol)) {
    return (
      <div className="sayfa dar">
        <h1>Bu sayfaya erişiminiz yok.</h1>
        <p className="soluk">{o.hata ?? 'Hesabınızın rolü bu sayfayı açmaya yetmiyor.'}</p>
        <Link to={rolAnaSayfasi(o.profil?.rol)} className="dugme ana">
          Ana sayfama dön
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
