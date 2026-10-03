import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Duzen } from './bilesenler/Duzen'
import { AnaSayfa } from './sayfalar/AnaSayfa'
import { Ayarlar } from './sayfalar/Ayarlar'
import { Bulunamadi } from './sayfalar/Bulunamadi'
import { AydinlatmaMetni, GizlilikPolitikasi } from './sayfalar/YerTutucuMetin'
import { TemaSaglayici } from './tema'

const yonlendirici = createBrowserRouter([
  {
    element: <Duzen />,
    children: [
      { path: '/', element: <AnaSayfa /> },
      { path: '/tahta', element: <div className="sayfa yer-tutucu">Tahta modu M1 aşamasında eklenecek.</div> },
      { path: '/ayarlar', element: <Ayarlar /> },
      { path: '/aydinlatma-metni', element: <AydinlatmaMetni /> },
      { path: '/gizlilik', element: <GizlilikPolitikasi /> },
      { path: '*', element: <Bulunamadi /> },
    ],
  },
])

export function App() {
  return (
    <TemaSaglayici>
      <RouterProvider router={yonlendirici} />
    </TemaSaglayici>
  )
}
