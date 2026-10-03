import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { OrnekRozeti } from '../bilesenler/Rozetler'
import { icerikGetir, kitHtmlGetir } from '../depo/depo'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { KIT_SANDBOX, kitSrcdoc } from './kitHtml'
import { TahtaCercevesi } from './TahtaCercevesi'

export function KitEkrani() {
  const { icerik: icerikId = '' } = useParams()
  const { yardimci } = useKatalog()
  const durum = useVeri(async () => {
    const icerik = await icerikGetir(decodeURIComponent(icerikId))
    if (!icerik) throw new Error('İçerik bulunamadı. Ünite listesinden yeniden açın.')
    return { icerik, html: await kitHtmlGetir(icerik) }
  }, [icerikId])

  const srcdoc = useMemo(() => (durum.veri ? kitSrcdoc(durum.veri.html) : ''), [durum.veri])
  const icerik = durum.veri?.icerik
  const unite = icerik?.unite_id ? yardimci?.unite(icerik.unite_id) : undefined
  const seviye = unite ? yardimci?.katalog.seviyeler.find((s) => s.id === unite.seviye_id) : undefined
  const geri = unite && seviye ? `/tahta/${encodeURIComponent(seviye.kod)}/${unite.id}` : '/tahta'

  return (
    <TahtaCercevesi
      baslik={
        <>
          {icerik?.baslik ?? 'Kit'} {icerik?.ornek && <OrnekRozeti />}
        </>
      }
      altBaslik={icerik?.hafta ? `${icerik.hafta}. hafta` : undefined}
      geri={geri}
      cizimAnahtari={icerikId}
      kaydirilabilir={false}
    >
      {durum.hata ? (
        <HataGoster hata={durum.hata} yenile={durum.yenile} />
      ) : !durum.veri ? (
        <Yukleniyor />
      ) : (
        <iframe
          className="kit-cercevesi"
          title={durum.veri.icerik.baslik}
          srcDoc={srcdoc}
          sandbox={KIT_SANDBOX}
          allow="fullscreen"
          referrerPolicy="no-referrer"
        />
      )}
    </TahtaCercevesi>
  )
}
