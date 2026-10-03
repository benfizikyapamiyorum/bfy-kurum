import { Link, useParams } from 'react-router-dom'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { TahtaCercevesi } from './TahtaCercevesi'

export function UniteSecimi() {
  const { seviye: seviyeKod = '' } = useParams()
  const { yardimci, hata, yenile } = useKatalog()
  const seviye = yardimci?.seviyeKoddan(seviyeKod)

  return (
    <TahtaCercevesi baslik={seviye ? seviye.ad : 'Ünite seçin'} altBaslik="Ünite seçin." geri="/tahta">
      {hata && !yardimci ? (
        <HataGoster hata={hata} yenile={yenile} />
      ) : !yardimci ? (
        <Yukleniyor />
      ) : !seviye ? (
        <HataGoster hata={new Error('Bu sınıf bulunamadı.')} />
      ) : (
        <div className="tahta-sayfa">
          <div className="buyuk-izgara">
            {yardimci.seviyeninUniteleri(seviye.id).map((u) => (
              <Link key={u.id} to={`/tahta/${encodeURIComponent(seviye.kod)}/${u.id}`} className="buyuk-kutu">
                <span className="buyuk-kutu-ust">{u.no}. ünite</span>
                <span className="buyuk-kutu-baslik">{u.ad}</span>
                <span className="buyuk-kutu-alt">{yardimci.uniteninKazanimlari(u.id).length} öğrenme çıktısı</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </TahtaCercevesi>
  )
}
