import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Duzen } from './bilesenler/Duzen'
import { KatalogSaglayici } from './katalogBaglami'
import { AnaSayfa } from './sayfalar/AnaSayfa'
import { Ayarlar } from './sayfalar/Ayarlar'
import { Bulunamadi } from './sayfalar/Bulunamadi'
import { IceAktar } from './sayfalar/IceAktar'
import { AydinlatmaMetni, GizlilikPolitikasi } from './sayfalar/YerTutucuMetin'
import { IcerikListesi } from './tahta/IcerikListesi'
import { KitEkrani } from './tahta/KitEkrani'
import { SinifSecimi } from './tahta/SinifSecimi'
import { SoruEkrani } from './tahta/SoruEkrani'
import { TahtayaIndir } from './tahta/TahtayaIndir'
import { UniteSecimi } from './tahta/UniteSecimi'
import { TemaSaglayici } from './tema'
import { OturumSaglayici } from './oturum/Oturum'
import { RolGerekli } from './oturum/RolGerekli'
import { Giris } from './sayfalar/Giris'
import { OgretmenAna } from './sayfalar/OgretmenAna'
import { OgrenciAna } from './sayfalar/OgrenciAna'
import { KurumPaneli } from './kurum/KurumPaneli'
import { KurumGenel } from './kurum/KurumGenel'
import { Ogretmenler } from './kurum/Ogretmenler'
import { Ogrenciler } from './kurum/Ogrenciler'
import { Siniflar } from './kurum/Siniflar'
import type { Rol } from './alan/tipler'
import type { ReactNode } from 'react'

const PERSONEL: Rol[] = ['ogretmen', 'kurum_yonetici']
const korumali = (roller: Rol[], oge: ReactNode) => <RolGerekli roller={roller}>{oge}</RolGerekli>
const yakinda = (ad: string) => (
  <div className="sayfa dar">
    <h1>{ad}</h1>
    <p className="yer-tutucu">Bu bölüm sonraki aşamada eklenecek.</p>
  </div>
)

const yonlendirici = createBrowserRouter([
  {
    element: <Duzen />,
    children: [
      { path: '/', element: <AnaSayfa /> },
      { path: '/giris', element: <Giris /> },
      { path: '/icerik/ice-aktar', element: <IceAktar /> },
      { path: '/ogretmen', element: korumali(PERSONEL, <OgretmenAna />) },
      { path: '/ogrenci', element: korumali(['ogrenci'], <OgrenciAna />) },
      {
        path: '/kurum',
        element: korumali(['kurum_yonetici'], <KurumPaneli />),
        children: [
          { index: true, element: <KurumGenel /> },
          { path: 'ogretmenler', element: <Ogretmenler /> },
          { path: 'ogrenciler', element: <Ogrenciler /> },
          { path: 'siniflar', element: <Siniflar /> },
        ],
      },
      { path: '/testler/*', element: korumali(PERSONEL, yakinda('Test ve deneme')) },
      { path: '/raporlar/*', element: korumali(PERSONEL, yakinda('Raporlar')) },
      { path: '/yonetim/*', element: korumali(['superadmin'], yakinda('Süper admin paneli')) },
      { path: '/ayarlar', element: <Ayarlar /> },
      { path: '/aydinlatma-metni', element: <AydinlatmaMetni /> },
      { path: '/gizlilik', element: <GizlilikPolitikasi /> },
      { path: '*', element: <Bulunamadi /> },
    ],
  },
  // Tahta modu kendi tam ekran düzenini kullanır.
  { path: '/tahta', element: <SinifSecimi /> },
  { path: '/tahta/indir', element: <TahtayaIndir /> },
  { path: '/tahta/kit/:icerik', element: <KitEkrani /> },
  { path: '/tahta/:seviye', element: <UniteSecimi /> },
  { path: '/tahta/:seviye/:unite', element: <IcerikListesi /> },
  { path: '/tahta/:seviye/:unite/soru/:soru', element: <SoruEkrani /> },
])

export function App() {
  return (
    <TemaSaglayici>
      <OturumSaglayici>
        <KatalogSaglayici>
          <RouterProvider router={yonlendirici} />
        </KatalogSaglayici>
      </OturumSaglayici>
    </TemaSaglayici>
  )
}
