import { Link } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { TahtaCercevesi } from './TahtaCercevesi'

export function SinifSecimi() {
  const { yardimci, hata, yenile } = useKatalog()
  return (
    <TahtaCercevesi baslik="Sınıf seçin" geri="/">
      {hata && !yardimci ? (
        <HataGoster hata={hata} yenile={yenile} />
      ) : !yardimci ? (
        <Yukleniyor />
      ) : (
        <div className="tahta-sayfa">
          <div className="buyuk-izgara">
            {yardimci.katalog.seviyeler.map((s) => {
              const uniteSayisi = yardimci.seviyeninUniteleri(s.id).length
              return uniteSayisi > 0 ? (
                <Link key={s.id} to={`/tahta/${encodeURIComponent(s.kod)}`} className="buyuk-kutu">
                  <span className="buyuk-kutu-baslik">{s.ad}</span>
                  <span className="buyuk-kutu-alt">{uniteSayisi} ünite</span>
                </Link>
              ) : (
                <div key={s.id} className="buyuk-kutu pasif" aria-disabled="true">
                  <span className="buyuk-kutu-baslik">{s.ad}</span>
                  <span className="buyuk-kutu-alt">İçerik yakında.</span>
                </div>
              )
            })}
          </div>
          <div className="tahta-alt-baglantilar">
            <Link to="/tahta/indir" className="dugme">
              <Simge ad="indir" />
              Tahtaya indir
            </Link>
            <Link to="/icerik/ice-aktar" className="dugme">
              <Simge ad="yukle" />
              HTML kit içe aktar
            </Link>
          </div>
        </div>
      )}
    </TahtaCercevesi>
  )
}
