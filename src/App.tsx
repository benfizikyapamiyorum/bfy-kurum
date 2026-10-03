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

const yonlendirici = createBrowserRouter([
  {
    element: <Duzen />,
    children: [
      { path: '/', element: <AnaSayfa /> },
      { path: '/icerik/ice-aktar', element: <IceAktar /> },
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
      <KatalogSaglayici>
        <RouterProvider router={yonlendirici} />
      </KatalogSaglayici>
    </TemaSaglayici>
  )
}
