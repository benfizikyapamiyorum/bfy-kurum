// Yapılandırılmış konu anlatımı: başlıklar tahtada tek tek, büyük ve şekilli gösterilir.
// Ders akışı (40/80 dk) yalnızca öğretmenin önünde açılan bir panelde durur.

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { OrnekRozeti } from '../bilesenler/Rozetler'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { icerikGetir } from '../depo/depo'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { TahtaCercevesi } from './TahtaCercevesi'

export function KonuEkrani() {
  const { icerik: icerikId = '' } = useParams()
  const { yardimci } = useKatalog()
  const durum = useVeri(async () => {
    const icerik = await icerikGetir(decodeURIComponent(icerikId))
    if (!icerik) throw new Error('İçerik bulunamadı. Ünite listesinden yeniden açın.')
    if (!icerik.veri?.bolumler?.length) throw new Error('Bu içeriğin gösterilecek bölümü yok.')
    return icerik
  }, [icerikId])
  const [sira, setSira] = useState(0)
  const [plan, setPlan] = useState<string | null>(null)

  const icerik = durum.veri
  const bolumler = icerik?.veri?.bolumler ?? []
  const bolum = bolumler[Math.min(sira, bolumler.length - 1)]
  const sekil = useMemo(() => (bolum?.sekil_svg ? sekilSvgTemizle(bolum.sekil_svg) : ''), [bolum])

  // Klavye ve sunum kumandası: sağ/sol ok, PageUp/PageDown.
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setSira((s) => Math.min(s + 1, bolumler.length - 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setSira((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [bolumler.length])

  const unite = icerik?.unite_id ? yardimci?.unite(icerik.unite_id) : undefined
  const seviye = unite ? yardimci?.katalog.seviyeler.find((s) => s.id === unite.seviye_id) : undefined
  const geri = unite && seviye ? `/tahta/${encodeURIComponent(seviye.kod)}/${unite.id}` : '/tahta'
  const planlar = icerik?.veri?.planlar ?? {}

  return (
    <TahtaCercevesi
      baslik={
        <>
          {icerik?.baslik ?? 'Konu anlatımı'} {icerik?.ornek && <OrnekRozeti />}
        </>
      }
      altBaslik={bolumler.length ? `${sira + 1} / ${bolumler.length}` : undefined}
      geri={geri}
      cizimAnahtari={`${icerikId}:${sira}`}
      altCubuk={
        bolumler.length > 0 && (
          <div className="konu-gezinme">
            <button type="button" className="dugme" disabled={sira === 0} onClick={() => setSira(sira - 1)}>
              Önceki
            </button>
            <ol className="konu-noktalari" aria-label="Bölümler">
              {bolumler.map((b, i) => (
                <li key={i}>
                  <button
                    type="button"
                    aria-label={b.baslik}
                    aria-current={i === sira ? 'step' : undefined}
                    className={i === sira ? 'secili' : ''}
                    onClick={() => setSira(i)}
                  />
                </li>
              ))}
            </ol>
            <button type="button" className="dugme ana" disabled={sira >= bolumler.length - 1} onClick={() => setSira(sira + 1)}>
              Sonraki
            </button>
            {Object.keys(planlar).length > 0 && (
              <button type="button" className="dugme sade" aria-expanded={!!plan} onClick={() => setPlan(plan ? null : Object.keys(planlar)[0]!)}>
                Ders akışı
              </button>
            )}
          </div>
        )
      }
    >
      {durum.hata ? (
        <HataGoster hata={durum.hata} yenile={durum.yenile} />
      ) : !icerik || !bolum ? (
        <Yukleniyor />
      ) : (
        <div className={`konu-sahnesi ${sekil ? 'sekilli' : ''}`}>
          <article className="konu-bolumu" aria-live="polite">
            <h2>{bolum.baslik}</h2>
            <ZenginMetin metin={bolum.metin} />
          </article>
          {sekil && <div className="konu-sekli" dangerouslySetInnerHTML={{ __html: sekil }} />}
          {plan && (
            <aside className="ders-akisi" aria-label="Ders akışı">
              <div className="ders-akisi-ust">
                <strong>Ders akışı</strong>
                <div className="secim-grubu">
                  {Object.keys(planlar).map((dk) => (
                    <button key={dk} type="button" className={`dugme kucuk ${plan === dk ? 'ana' : 'sade'}`} onClick={() => setPlan(dk)}>
                      {dk} dk
                    </button>
                  ))}
                  <button type="button" className="dugme sade kucuk" onClick={() => setPlan(null)}>
                    Kapat
                  </button>
                </div>
              </div>
              <ol>
                {(planlar[plan] ?? []).map((a, i) => (
                  <li key={i}>
                    <span className="ders-akisi-sure">{a.time}</span> <strong>{a.title}.</strong> {a.body}
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      )}
    </TahtaCercevesi>
  )
}
