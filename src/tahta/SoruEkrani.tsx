// Tahtada tek soru: soru büyük gösterilir, cevap gizlidir. Dokununca cevap açılır,
// çözüm adımları tek tek açılır ve her adım şekildeki ilgili çizimi canlandırır.

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Soru } from '../alan/tipler'
import { SORU_TURU_ADI } from '../alan/etiketler'
import { OrnekRozeti } from '../bilesenler/Rozetler'
import { Simge } from '../bilesenler/Simge'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { uniteIcerigiGetir } from '../depo/depo'
import { useVeri } from '../kancalar'
import { useKatalog, type KatalogYardimcisi } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { Sayac } from './Sayac'
import { SoruSekli } from './SoruSekli'
import { duzSira, kazanimaGoreGrupla } from './soruSirasi'
import { TahtaCercevesi } from './TahtaCercevesi'

export function SoruEkrani() {
  const { seviye: seviyeKod = '', unite: uniteId = '', soru: soruId = '' } = useParams()
  const { yardimci } = useKatalog()
  const kazanimlar = yardimci?.uniteninKazanimlari(uniteId) ?? []

  const durum = useVeri(async () => {
    if (!yardimci) return null
    const { sorular } = await uniteIcerigiGetir(uniteId, kazanimlar.map((k) => k.id))
    return duzSira(kazanimaGoreGrupla(sorular, kazanimlar))
  }, [uniteId, yardimci])

  const temel = `/tahta/${encodeURIComponent(seviyeKod)}/${uniteId}`
  const sira = durum.veri ?? []
  const index = sira.findIndex((s) => s.id === soruId)
  const soru = sira[index]

  if (durum.hata || (durum.veri && !soru) || !yardimci) {
    return (
      <TahtaCercevesi baslik="Soru" geri={temel}>
        {durum.hata ? (
          <HataGoster hata={durum.hata} yenile={durum.yenile} />
        ) : !yardimci ? (
          <Yukleniyor />
        ) : (
          <HataGoster hata={new Error('Soru bulunamadı.')} />
        )}
      </TahtaCercevesi>
    )
  }
  if (!soru) {
    return (
      <TahtaCercevesi baslik="Soru" geri={temel}>
        <Yukleniyor />
      </TahtaCercevesi>
    )
  }
  return (
    <SoruGorunumu
      key={soru.id}
      soru={soru}
      no={index + 1}
      toplam={sira.length}
      onceki={sira[index - 1]?.id}
      sonraki={sira[index + 1]?.id}
      temel={temel}
      yardimci={yardimci}
    />
  )
}

interface GorunumOzellikleri {
  soru: Soru
  no: number
  toplam: number
  onceki?: string
  sonraki?: string
  temel: string
  yardimci: KatalogYardimcisi
}

function SoruGorunumu({ soru, no, toplam, onceki, sonraki, temel, yardimci }: GorunumOzellikleri) {
  const git = useNavigate()
  const [cevapAcik, setCevapAcik] = useState(false)
  const [adim, setAdim] = useState(0)
  const [secilen, setSecilen] = useState<string | null>(null)
  const [yenidenOynat, setYenidenOynat] = useState(0)
  const [sekilAnimasyonlu, setSekilAnimasyonlu] = useState(false)
  const cevapRef = useRef<HTMLDivElement>(null)
  const adimlarRef = useRef<HTMLOListElement>(null)

  // Yeni açılan cevap ya da adım görünür alanın dışında kalmasın.
  useEffect(() => {
    if (cevapAcik) cevapRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cevapAcik])
  useEffect(() => {
    if (adim > 0) adimlarRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [adim])

  const adimSayisi = soru.cozum_adimlari.length
  const kazanimKodlari = soru.kazanim_idleri
    .map((id) => yardimci.kazanim(id)?.kod)
    .filter(Boolean)
    .join(', ')

  const secenekSinifi = (harf: string) => {
    const s = ['secenek']
    if (secilen === harf) s.push('isaretli')
    if (cevapAcik && soru.dogru_cevap === harf) s.push('dogru')
    else if (cevapAcik && secilen === harf) s.push('yanlis')
    return s.join(' ')
  }

  const altCubuk = (
    <>
      <button
        type="button"
        className="dugme"
        disabled={!onceki}
        onClick={() => onceki && git(`${temel}/soru/${onceki}`)}
        aria-label="Önceki soru"
      >
        <Simge ad="geri" />
        <span className="dar-gizle">Önceki</span>
      </button>
      <span className="bosluk" />
      <button
        type="button"
        className={`dugme ana genis ${cevapAcik ? 'secili' : ''}`}
        onClick={() => setCevapAcik((a) => !a)}
        aria-pressed={cevapAcik}
      >
        <Simge ad={cevapAcik ? 'gozKapali' : 'goz'} />
        {cevapAcik ? 'Cevabı gizle' : 'Cevabı göster'}
      </button>
      {adimSayisi > 0 && (
        <>
          <button
            type="button"
            className="dugme genis"
            disabled={adim >= adimSayisi}
            onClick={() => setAdim((a) => Math.min(a + 1, adimSayisi))}
          >
            <Simge ad="adim" />
            {adim === 0 ? 'Çözümü başlat' : adim >= adimSayisi ? 'Çözüm tamam' : 'Sonraki adım'}
            <span className="adim-sayaci">
              {adim}/{adimSayisi}
            </span>
          </button>
          <button
            type="button"
            className="dugme"
            disabled={adim === 0}
            onClick={() => setAdim((a) => Math.max(a - 1, 0))}
            aria-label="Son adımı kapat"
          >
            <Simge ad="geri" />
          </button>
        </>
      )}
      <span className="bosluk" />
      <button
        type="button"
        className="dugme"
        disabled={!sonraki}
        onClick={() => sonraki && git(`${temel}/soru/${sonraki}`)}
        aria-label="Sonraki soru"
      >
        <span className="dar-gizle">Sonraki</span>
        <Simge ad="ileri" />
      </button>
    </>
  )

  return (
    <TahtaCercevesi
      baslik={
        <>
          Soru {no} / {toplam}
        </>
      }
      altBaslik={
        <>
          {kazanimKodlari}, {SORU_TURU_ADI[soru.tur].toLocaleLowerCase('tr-TR')}
        </>
      }
      geri={temel}
      ustEk={<Sayac sifirlaAnahtari={soru.id} />}
      altCubuk={altCubuk}
      cizimAnahtari={soru.id}
      kaydirilabilir={false}
    >
      <div className={`soru-ekrani ${soru.sekil_svg ? 'sekilli' : ''}`}>
        <div className="soru-sol">
          {soru.ornek && (
            <div className="soru-rozetleri">
              <OrnekRozeti />
            </div>
          )}
          <ZenginMetin metin={soru.govde} sinif="soru-govde" />

          {soru.tur === 'coktan_secmeli' && soru.secenekler && (
            <div className="secenekler" role="group" aria-label="Seçenekler">
              {soru.secenekler.map((s) => (
                <button
                  key={s.harf}
                  type="button"
                  className={secenekSinifi(s.harf)}
                  onClick={() => setSecilen((x) => (x === s.harf ? null : s.harf))}
                  aria-pressed={secilen === s.harf}
                >
                  <span className="secenek-harf">{s.harf}</span>
                  <ZenginMetin metin={s.metin} etiket="span" sinif="secenek-metin" />
                </button>
              ))}
            </div>
          )}

          {soru.tur === 'dogru_yanlis' && (
            <div className="secenekler dy" role="group" aria-label="Doğru ya da yanlış">
              {(
                [
                  ['D', 'Doğru'],
                  ['Y', 'Yanlış'],
                ] as const
              ).map(([harf, ad]) => (
                <button
                  key={harf}
                  type="button"
                  className={secenekSinifi(harf)}
                  onClick={() => setSecilen((x) => (x === harf ? null : harf))}
                  aria-pressed={secilen === harf}
                >
                  <span className="secenek-harf">{harf}</span>
                  <span className="secenek-metin">{ad}</span>
                </button>
              ))}
            </div>
          )}

          {cevapAcik && (
            <div ref={cevapRef} className="cevap-kutusu" role="status">
              <strong>Cevap: </strong>
              {soru.tur === 'coktan_secmeli' ? (
                <>{soru.dogru_cevap}.</>
              ) : soru.tur === 'dogru_yanlis' ? (
                <>{soru.dogru_cevap === 'D' ? 'Doğru.' : 'Yanlış.'}</>
              ) : (
                <ZenginMetin metin={soru.dogru_cevap} etiket="span" />
              )}
            </div>
          )}

          {adim > 0 && (
            <ol ref={adimlarRef} className="cozum-adimlari" aria-label="Çözüm adımları">
              {soru.cozum_adimlari.slice(0, adim).map((a, i) => (
                <li key={i} className="cozum-adimi">
                  <ZenginMetin metin={a.metin} />
                </li>
              ))}
            </ol>
          )}
        </div>

        {soru.sekil_svg && (
          <div className="soru-sag">
            <SoruSekli
              svg={soru.sekil_svg}
              adim={adim}
              yenidenOynatSayaci={yenidenOynat}
              onAnimasyonVar={setSekilAnimasyonlu}
            />
            {sekilAnimasyonlu && (
              <button type="button" className="dugme sade sekil-yeniden" onClick={() => setYenidenOynat((n) => n + 1)}>
                <Simge ad="yenile" />
                Şekli yeniden çiz
              </button>
            )}
          </div>
        )}
      </div>
    </TahtaCercevesi>
  )
}
