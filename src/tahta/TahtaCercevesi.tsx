// Tahta modunun ortak çerçevesi: üst çubuk (geri, başlık, araçlar, kurum logosu), çizim katmanı, alt çubuk.
// Tüm etkileşimler dokunmayla çalışır; hover'a bağlı hiçbir şey yoktur.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { KurumLogosu } from '../bilesenler/KurumLogosu'
import { Simge } from '../bilesenler/Simge'
import { useCevrimici, useTamEkran } from '../kancalar'
import { useTema } from '../tema'
import { tercihOku, tercihYaz } from '../tercihler'
import { CizimKatmani, type CizimKatmaniKontrol } from './CizimKatmani'

const KALEM_RENKLERI: [string, string][] = [
  ['#e53935', 'Kırmızı'],
  ['#1e63d6', 'Mavi'],
  ['#1b8a4b', 'Yeşil'],
  ['#111111', 'Siyah'],
  ['#ffd400', 'Sarı'],
]

interface Ozellikler {
  baslik: ReactNode
  altBaslik?: ReactNode
  /** Geri düğmesinin gideceği adres. Verilmezse geri düğmesi ana sayfaya gider. */
  geri?: string
  /** Üst çubukta araçların soluna eklenecek öğeler (ör. sayaç). */
  ustEk?: ReactNode
  altCubuk?: ReactNode
  /** Değişince çizimler temizlenir (ör. soru kimliği). */
  cizimAnahtari?: string
  /** Gövde kaydırılabilir mi (liste ekranları) yoksa sabit mi (soru, kit). */
  kaydirilabilir?: boolean
  children: ReactNode
}

export function TahtaCercevesi({
  baslik,
  altBaslik,
  geri = '/',
  ustEk,
  altCubuk,
  cizimAnahtari = '',
  kaydirilabilir = true,
  children,
}: Ozellikler) {
  const git = useNavigate()
  const cevrimici = useCevrimici()
  const [tamEkran, tamEkranDegistir] = useTamEkran()
  const { yuksekKontrast, kontrastAyarla } = useTema()

  const [kalemAcik, setKalemAcik] = useState(false)
  const [renk, setRenk] = useState(() => tercihOku('kalemRengi', KALEM_RENKLERI[0]![0]))
  const [kalin, setKalin] = useState(() => tercihOku('kalemKalin', false))
  const [silgi, setSilgi] = useState(false)
  const [cizgiSayisi, setCizgiSayisi] = useState(0)
  const cizim = useRef<CizimKatmaniKontrol>(null)

  useEffect(() => {
    cizim.current?.temizle()
  }, [cizimAnahtari])

  return (
    <div className="tahta">
      <header className="tahta-ust">
        <button type="button" className="dugme tahta-geri" onClick={() => git(geri)} aria-label="Geri">
          <Simge ad="geri" />
        </button>
        <div className="tahta-baslik">
          <div className="tahta-baslik-ana">{baslik}</div>
          {altBaslik && <div className="tahta-baslik-alt">{altBaslik}</div>}
        </div>
        {!cevrimici && (
          <span className="cevrimdisi-rozeti" role="status">
            <Simge ad="bulutYok" />
            Çevrimdışı
          </span>
        )}
        {ustEk}
        <div className="tahta-araclar">
          <button
            type="button"
            className={`dugme ${kalemAcik ? 'secili' : ''}`}
            onClick={() => {
              setKalemAcik((a) => !a)
              setSilgi(false)
            }}
            aria-pressed={kalemAcik}
            aria-label="Kalem"
          >
            <Simge ad="kalem" />
          </button>
          <button
            type="button"
            className={`dugme ${yuksekKontrast ? 'secili' : ''}`}
            onClick={() => kontrastAyarla(!yuksekKontrast)}
            aria-pressed={yuksekKontrast}
            aria-label="Yüksek kontrast"
          >
            <Simge ad="kontrast" />
          </button>
          <button
            type="button"
            className="dugme"
            onClick={tamEkranDegistir}
            aria-label={tamEkran ? 'Tam ekrandan çık' : 'Tam ekran'}
          >
            <Simge ad={tamEkran ? 'tamEkrandanCik' : 'tamEkran'} />
          </button>
        </div>
        <KurumLogosu sinif="tahta-logo" />
      </header>

      <div className="tahta-govde">
        <div className={`tahta-icerik ${kaydirilabilir ? 'kaydirilabilir' : ''}`}>{children}</div>
        <CizimKatmani
          ref={cizim}
          etkin={kalemAcik}
          renk={renk}
          kalinlik={kalin ? 9 : 4}
          silgi={silgi}
          onDegisti={setCizgiSayisi}
        />
      </div>

      {kalemAcik && (
        <div className="kalem-araclari" role="toolbar" aria-label="Kalem araçları">
          {KALEM_RENKLERI.map(([r, ad]) => (
            <button
              key={r}
              type="button"
              className={`renk-dugmesi ${!silgi && renk === r ? 'secili' : ''}`}
              style={{ background: r }}
              onClick={() => {
                setRenk(r)
                setSilgi(false)
                tercihYaz('kalemRengi', r)
              }}
              aria-label={ad}
              aria-pressed={!silgi && renk === r}
            />
          ))}
          <span className="ayirac" />
          <button
            type="button"
            className={`dugme ${kalin ? 'secili' : ''}`}
            onClick={() => {
              setKalin((k) => !k)
              tercihYaz('kalemKalin', !kalin)
            }}
            aria-pressed={kalin}
            aria-label="Kalın uç"
          >
            <span className={`uc-onizleme ${kalin ? 'kalin' : ''}`} />
          </button>
          <button
            type="button"
            className={`dugme ${silgi ? 'secili' : ''}`}
            onClick={() => setSilgi((s) => !s)}
            aria-pressed={silgi}
            aria-label="Silgi"
          >
            <Simge ad="silgi" />
          </button>
          <button
            type="button"
            className="dugme"
            onClick={() => cizim.current?.geriAl()}
            disabled={cizgiSayisi === 0}
            aria-label="Son çizgiyi geri al"
          >
            <Simge ad="yenile" />
          </button>
          <button
            type="button"
            className="dugme"
            onClick={() => cizim.current?.temizle()}
            disabled={cizgiSayisi === 0}
            aria-label="Çizimleri temizle"
          >
            <Simge ad="temizle" />
          </button>
          <button
            type="button"
            className="dugme"
            onClick={() => setKalemAcik(false)}
            aria-label="Kalemi kapat"
          >
            <Simge ad="kapat" />
          </button>
        </div>
      )}

      {altCubuk && <footer className="tahta-alt">{altCubuk}</footer>}
    </div>
  )
}
