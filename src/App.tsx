import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom'
import { ortam } from './yapilandirma/ortam'
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
import { TestListesi } from './testler/TestListesi'
import { TestDuzenleyici } from './testler/TestDuzenleyici'
import { TestAtamalari } from './testler/TestAtamalari'
import { AtamaSonuclari } from './testler/AtamaSonuclari'
import { TestYazdir } from './testler/TestYazdir'
import { TestCoz } from './ogrenci/TestCoz'
import { TestTahta } from './tahta/TestTahta'
import { Raporlar } from './raporlar/Raporlar'
import { YonetimPaneli } from './yonetim/YonetimPaneli'
import { Kurumlar } from './yonetim/Kurumlar'
import { Sorular } from './yonetim/Sorular'
import { SoruDuzenle } from './yonetim/SoruDuzenle'
import { Icerikler } from './yonetim/Icerikler'
import { TopluIceAktarim } from './yonetim/TopluIceAktarim'
import { KonuEkrani } from './tahta/KonuEkrani'
import { DemoAna } from './demo/DemoAna'
import { Tanitim } from './sayfalar/Tanitim'
import { DemoTest } from './demo/DemoTest'
import { DemoRapor } from './demo/DemoRapor'
import type { ReactNode } from 'react'

const PERSONEL: Rol[] = ['ogretmen', 'kurum_yonetici']
const korumali = (roller: Rol[], oge: ReactNode) => <RolGerekli roller={roller}>{oge}</RolGerekli>

// Tek dosya (file://) sürümünde adres yolu yok; sayfalar # ile ayrılır.
const yonlendirici = (ortam.tekDosya ? createHashRouter : createBrowserRouter)([
  {
    element: <Duzen />,
    children: [
      { path: '/', element: <AnaSayfa /> },
      { path: '/giris', element: <Giris /> },
      { path: '/demo', element: <DemoAna /> },
      { path: '/tanitim', element: <Tanitim /> },
      { path: '/demo/test', element: <DemoTest /> },
      { path: '/demo/rapor', element: <DemoRapor /> },
      { path: '/icerik/ice-aktar', element: <IceAktar /> },
      { path: '/ogretmen', element: korumali(PERSONEL, <OgretmenAna />) },
      { path: '/ogrenci', element: korumali(['ogrenci'], <OgrenciAna />) },
      { path: '/ogrenci/test/:atama', element: korumali(['ogrenci'], <TestCoz />) },
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
      { path: '/testler', element: korumali(PERSONEL, <TestListesi />) },
      { path: '/testler/yeni', element: korumali(PERSONEL, <TestDuzenleyici />) },
      { path: '/testler/:id', element: korumali(PERSONEL, <TestDuzenleyici />) },
      { path: '/testler/:id/atamalar', element: korumali(PERSONEL, <TestAtamalari />) },
      { path: '/testler/:id/atama/:atama', element: korumali(PERSONEL, <AtamaSonuclari />) },
      { path: '/raporlar', element: korumali(PERSONEL, <Raporlar />) },
      {
        path: '/yonetim',
        element: korumali(['superadmin'], <YonetimPaneli />),
        children: [
          { index: true, element: <Kurumlar /> },
          { path: 'sorular', element: <Sorular /> },
          { path: 'sorular/:id', element: <SoruDuzenle /> },
          { path: 'icerikler', element: <Icerikler /> },
          { path: 'ice-aktarim', element: <TopluIceAktarim /> },
        ],
      },
      { path: '/ayarlar', element: <Ayarlar /> },
      { path: '/aydinlatma-metni', element: <AydinlatmaMetni /> },
      { path: '/gizlilik', element: <GizlilikPolitikasi /> },
      { path: '*', element: <Bulunamadi /> },
    ],
  },
  // Yazdırma sayfası: yalnızca kâğıt.
  { path: '/testler/:id/yazdir/:surum', element: korumali(PERSONEL, <TestYazdir />) },
  // Tahta modu kendi tam ekran düzenini kullanır.
  { path: '/tahta/test/:test/:no', element: korumali(PERSONEL, <TestTahta />) },
  { path: '/tahta', element: <SinifSecimi /> },
  { path: '/tahta/indir', element: <TahtayaIndir /> },
  { path: '/tahta/kit/:icerik', element: <KitEkrani /> },
  { path: '/tahta/konu/:icerik', element: <KonuEkrani /> },
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
