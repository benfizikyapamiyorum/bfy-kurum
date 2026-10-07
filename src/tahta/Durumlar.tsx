import { Link } from 'react-router-dom'
import { CevrimdisiHatasi } from '../depo/depo'

export function Yukleniyor() {
  return (
    <div className="tahta-durum" role="status">
      Yükleniyor.
    </div>
  )
}

export function HataGoster({ hata, yenile }: { hata: Error; yenile?: () => void }) {
  const cevrimdisi = hata instanceof CevrimdisiHatasi
  return (
    <div className="tahta-durum hata" role="alert">
      <p>{cevrimdisi ? hata.message : `Bir sorun oluştu: ${hata.message}`}</p>
      <div className="dugme-satiri">
        {yenile && (
          <button type="button" className="dugme ana" onClick={yenile}>
            Yeniden dene
          </button>
        )}
        {cevrimdisi && (
          <Link to="/tahta/indir" className="dugme">
            İnternetsiz kullanım ekranı
          </Link>
        )}
      </div>
    </div>
  )
}
