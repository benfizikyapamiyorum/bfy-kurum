import { Link, useParams } from 'react-router-dom'
import { ortam } from '../yapilandirma/ortam'
import { SORU_TURU_ADI } from '../alan/etiketler'
import { OrnekRozeti, ZorlukGostergesi } from '../bilesenler/Rozetler'
import { Simge } from '../bilesenler/Simge'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { indirilenler, uniteIcerigiGetir, YEREL_KIT_ON_EKI } from '../depo/depo'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { kazanimaGoreGrupla } from './soruSirasi'
import { TahtaCercevesi } from './TahtaCercevesi'

const ICERIK_TURU_ADI = { hafta_kiti: 'Hafta kiti', konu_anlatimi: 'Konu anlatımı', sunum: 'Sunum' } as const

export function IcerikListesi() {
  const { seviye: seviyeKod = '', unite: uniteId = '' } = useParams()
  const { yardimci } = useKatalog()
  const unite = yardimci?.unite(uniteId)
  const kazanimlar = yardimci?.uniteninKazanimlari(uniteId) ?? []
  const kazanimIdleri = kazanimlar.map((k) => k.id)

  const durum = useVeri(
    async () => {
      if (!yardimci) return null
      const [icerik, indirilen] = await Promise.all([uniteIcerigiGetir(uniteId, kazanimIdleri), indirilenler()])
      return { ...icerik, indirilen }
    },
    [uniteId, yardimci],
  )

  const temel = `/tahta/${encodeURIComponent(seviyeKod)}/${uniteId}`
  const gruplar = durum.veri ? kazanimaGoreGrupla(durum.veri.sorular, kazanimlar) : []
  let soruNo = 0

  return (
    <TahtaCercevesi
      baslik={unite ? `${unite.no}. ünite: ${unite.ad}` : 'Ünite'}
      altBaslik={yardimci?.seviyeKoddan(seviyeKod)?.ad}
      geri={`/tahta/${encodeURIComponent(seviyeKod)}`}
    >
      {durum.hata ? (
        <HataGoster hata={durum.hata} yenile={durum.yenile} />
      ) : !durum.veri ? (
        <Yukleniyor />
      ) : (
        <div className="tahta-sayfa">
          {durum.veri.cevrimdisiKopya && (
            <p className="bilgi-kutusu uyari">İnternet yok. Tahtaya indirilmiş kopya gösteriliyor.</p>
          )}

          <section className="tahta-bolum">
            <h2>Haftalar ve konu anlatımları</h2>
            {durum.veri.icerikler.length === 0 ? (
              <p className="soluk">Bu ünite için henüz kit yok. Kitler içe aktarıldıkça burada görünür.</p>
            ) : (
              <div className="buyuk-izgara">
                {durum.veri.icerikler.map((i) => {
                  const indirildi = durum.veri!.indirilen.kitler.has(i.id)
                  const yerel = i.id.startsWith(YEREL_KIT_ON_EKI)
                  return (
                    <Link key={i.id} to={`/tahta/${i.veri?.bolumler ? 'konu' : 'kit'}/${encodeURIComponent(i.id)}`} className="buyuk-kutu kit-kutusu">
                      <span className="buyuk-kutu-ust">
                        {i.hafta ? `${i.hafta}. hafta` : ICERIK_TURU_ADI[i.tur]}
                        {i.ornek && <OrnekRozeti />}
                      </span>
                      <span className="buyuk-kutu-baslik">{i.baslik}</span>
                      <span className="buyuk-kutu-alt">
                        {yerel ? (
                          <span className="durum-cipi">Bu tarayıcıda</span>
                        ) : indirildi ? (
                          <span className="durum-cipi tamam">
                            <Simge ad="tamam" /> Tahtaya indirildi
                          </span>
                        ) : ortam.tanitim ? (
                          <span className="durum-cipi tamam">
                            <Simge ad="tamam" /> Bu dosyada, internetsiz
                          </span>
                        ) : (
                          <span className="durum-cipi">İnternet gerekir</span>
                        )}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section className="tahta-bolum">
            <h2>Sorular</h2>
            {gruplar.length === 0 && <p className="soluk">Bu ünite için henüz soru yok.</p>}
            {gruplar.map((g) => (
              <div key={g.kazanim.id} className="kazanim-grubu">
                <h3>
                  <span className="kazanim-kodu">{g.kazanim.kod}</span> {g.kazanim.metin}
                </h3>
                <div className="soru-kartlari">
                  {g.sorular.map((s) => {
                    soruNo++
                    return (
                      <Link key={s.id} to={`${temel}/soru/${s.id}`} className="soru-karti">
                        <span className="soru-karti-no">{soruNo}</span>
                        <span className="soru-karti-govde">
                          <ZenginMetin metin={s.govde.replace(/<br\s*\/?>/g, ' ')} etiket="span" sinif="soru-karti-metin" />
                          <span className="soru-karti-bilgi">
                            {s.ornek && <OrnekRozeti />}
                            <span className="rozet">{SORU_TURU_ADI[s.tur]}</span>
                            {s.sekil_svg && <span className="rozet">Şekilli</span>}
                            <ZorlukGostergesi zorluk={s.zorluk} />
                          </span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </TahtaCercevesi>
  )
}
