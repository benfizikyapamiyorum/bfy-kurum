// "Bu haftaları tahtaya indir": seçilen kitler ve soru setleri bu cihaza kaydedilir,
// internet kesilince tahta modu bunlarla çalışmaya devam eder.

import { useEffect, useState } from 'react'
import type { Icerik } from '../alan/tipler'
import { trSayi } from '../alan/turkce'
import { OrnekRozeti } from '../bilesenler/Rozetler'
import { Simge } from '../bilesenler/Simge'
import {
  indirilenler,
  kaynak,
  kitIndir,
  kitIndirmesiniKaldir,
  uniteIndirmesiniKaldir,
  uniteSorulariniIndir,
} from '../depo/depo'
import { bekleyenIslemSayisi } from '../depo/senkronKuyrugu'
import { useCevrimici, useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { TahtaCercevesi } from './TahtaCercevesi'

const boyutYazisi = (bayt: number) =>
  bayt < 1024 * 1024 ? `${trSayi(bayt / 1024, 0)} KB` : `${trSayi(bayt / 1024 / 1024, 1)} MB`

const tarihYazisi = (iso: string) =>
  new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

type Secim = { tur: 'kit'; icerik: Icerik } | { tur: 'sorular'; uniteId: string; kazanimIdleri: string[] }
const secimAnahtari = (s: Secim) => (s.tur === 'kit' ? `kit:${s.icerik.id}` : `sorular:${s.uniteId}`)

export function TahtayaIndir() {
  const { yardimci } = useKatalog()
  const cevrimici = useCevrimici()
  const [secili, setSecili] = useState<Map<string, Secim>>(new Map())
  const [calisiyor, setCalisiyor] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [alan, setAlan] = useState<{ kullanilan: number; kota: number; kalici: boolean } | null>(null)

  const durum = useVeri(async () => {
    if (!yardimci) return null
    const uniteler = await Promise.all(
      yardimci.katalog.uniteler.map(async (u) => {
        const kazanimIdleri = yardimci.uniteninKazanimlari(u.id).map((k) => k.id)
        try {
          const [icerikler, sorular] = await Promise.all([
            kaynak().uniteIcerikleri(u.id),
            kaynak().uniteSorulari(u.id, kazanimIdleri),
          ])
          return { unite: u, kazanimIdleri, icerikler, soruSayisi: sorular.length }
        } catch {
          return { unite: u, kazanimIdleri, icerikler: [] as Icerik[], soruSayisi: 0 }
        }
      }),
    )
    return { uniteler: uniteler.filter((u) => u.icerikler.length > 0 || u.soruSayisi > 0), indirilen: await indirilenler() }
  }, [yardimci, cevrimici])

  useEffect(() => {
    const yenile = async () => {
      if (!navigator.storage?.estimate) return
      const t = await navigator.storage.estimate()
      const kalici = (await navigator.storage.persisted?.()) ?? false
      setAlan({ kullanilan: t.usage ?? 0, kota: t.quota ?? 0, kalici })
    }
    void yenile()
  }, [durum.veri])

  const degistir = (s: Secim) =>
    setSecili((m) => {
      const yeni = new Map(m)
      const a = secimAnahtari(s)
      if (yeni.has(a)) yeni.delete(a)
      else yeni.set(a, s)
      return yeni
    })

  const indir = async () => {
    // Tarayıcıdan, yer darlığında bu verileri silmemesini iste.
    await navigator.storage?.persist?.().catch(() => false)
    let basarili = 0
    const hatalar: string[] = []
    for (const s of secili.values()) {
      const ad = s.tur === 'kit' ? s.icerik.baslik : `${yardimci?.unite(s.uniteId)?.ad ?? ''} soruları`
      setCalisiyor(ad)
      try {
        if (s.tur === 'kit') await kitIndir(s.icerik)
        else await uniteSorulariniIndir(s.uniteId, s.kazanimIdleri)
        basarili++
      } catch {
        hatalar.push(ad)
      }
    }
    setCalisiyor(null)
    setSecili(new Map())
    setMesaj(
      hatalar.length === 0
        ? `${basarili} öğe tahtaya kaydedildi. İnternet kesilse de açılır.`
        : `${basarili} öğe kaydedildi. Kaydedilemeyenler: ${hatalar.join(', ')}.`,
    )
    durum.yenile()
  }

  const [bekleyen, setBekleyen] = useState(0)
  useEffect(() => {
    void bekleyenIslemSayisi().then(setBekleyen)
  }, [durum.veri])

  return (
    <TahtaCercevesi
      baslik="İnternetsiz kullanım için kaydet"
      altBaslik="Seçtiğiniz haftalar ve soru setleri bu cihaza kaydedilir."
      geri="/tahta"
      altCubuk={
        <>
          <span className="alt-bilgi-metni">
            {calisiyor ? `Kaydediliyor: ${calisiyor}.` : secili.size > 0 ? `${secili.size} öğe seçildi.` : 'Kaydetmek istediklerinizi seçin.'}
          </span>
          <span className="bosluk" />
          <button
            type="button"
            className="dugme ana genis"
            disabled={secili.size === 0 || calisiyor !== null || !cevrimici}
            onClick={() => void indir()}
          >
            <Simge ad="indir" />
            Seçilenleri kaydet
          </button>
        </>
      }
    >
      {durum.hata ? (
        <HataGoster hata={durum.hata} yenile={durum.yenile} />
      ) : !durum.veri || !yardimci ? (
        <Yukleniyor />
      ) : (
        <div className="tahta-sayfa indirme-sayfasi">
          {!cevrimici && (
            <p className="bilgi-kutusu uyari">İnternet yok. Yeni içerik indirilemez; daha önce indirilenler kullanılabilir.</p>
          )}
          {mesaj && (
            <p className="bilgi-kutusu" role="status">
              {mesaj}
            </p>
          )}
          {alan && alan.kota > 0 && (
            <p className="soluk">
              Bu cihazda kullanılan alan: {boyutYazisi(alan.kullanilan)}.{' '}
              {alan.kalici
                ? 'Tarayıcı kaydedilen içeriği kalıcı olarak saklıyor.'
                : 'Tarayıcı yer darlığında kaydedilenleri silebilir; sık kullandığınız haftaları ara ara kontrol edin.'}
              {bekleyen > 0 && ` Gönderilmeyi bekleyen ${bekleyen} işlem var; internet gelince gönderilecek.`}
            </p>
          )}

          {durum.veri.uniteler.length === 0 && <p className="soluk">Kaydedilecek içerik bulunamadı.</p>}

          {durum.veri.uniteler.map(({ unite, kazanimIdleri, icerikler, soruSayisi }) => {
            const seviye = yardimci.katalog.seviyeler.find((s) => s.id === unite.seviye_id)
            const uniteIndirme = durum.veri!.indirilen.uniteler.get(unite.id)
            const soruSecimi: Secim = { tur: 'sorular', uniteId: unite.id, kazanimIdleri }
            return (
              <section key={unite.id} className="indirme-unitesi">
                <h2>
                  {seviye?.ad}, {unite.no}. ünite: {unite.ad}
                </h2>
                <ul className="indirme-listesi">
                  {icerikler.map((i) => {
                    const s: Secim = { tur: 'kit', icerik: i }
                    const indirilen = durum.veri!.indirilen.kitler.get(i.id)
                    return (
                      <IndirmeSatiri
                        key={i.id}
                        secili={secili.has(secimAnahtari(s))}
                        onSec={() => degistir(s)}
                        baslik={
                          <>
                            {i.hafta ? `${i.hafta}. hafta: ` : ''}
                            {i.baslik} {i.ornek && <OrnekRozeti />}
                          </>
                        }
                        durumYazisi={
                          indirilen
                            ? `Kaydedildi, ${tarihYazisi(indirilen.indirilme)}, ${boyutYazisi(indirilen.boyut)}.`
                            : 'Kaydedilmedi.'
                        }
                        indirildi={!!indirilen}
                        onKaldir={async () => {
                          await kitIndirmesiniKaldir(i.id)
                          durum.yenile()
                        }}
                      />
                    )
                  })}
                  {soruSayisi > 0 && (
                    <IndirmeSatiri
                      secili={secili.has(secimAnahtari(soruSecimi))}
                      onSec={() => degistir(soruSecimi)}
                      baslik={<>Ünitenin soruları ({soruSayisi} soru)</>}
                      durumYazisi={
                        uniteIndirme
                          ? `Kaydedildi, ${tarihYazisi(uniteIndirme.indirilme)}, ${uniteIndirme.soruSayisi} soru.`
                          : 'Kaydedilmedi.'
                      }
                      indirildi={!!uniteIndirme}
                      onKaldir={async () => {
                        await uniteIndirmesiniKaldir(unite.id)
                        durum.yenile()
                      }}
                    />
                  )}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </TahtaCercevesi>
  )
}

function IndirmeSatiri(o: {
  secili: boolean
  onSec: () => void
  baslik: React.ReactNode
  durumYazisi: string
  indirildi: boolean
  onKaldir: () => void
}) {
  return (
    <li className={`indirme-satiri ${o.secili ? 'secili' : ''}`}>
      <label className="indirme-secim">
        <input type="checkbox" checked={o.secili} onChange={o.onSec} />
        <span>
          <span className="indirme-baslik">{o.baslik}</span>
          <span className={`indirme-durum ${o.indirildi ? 'tamam' : ''}`}>
            {o.indirildi && <Simge ad="tamam" />} {o.durumYazisi}
          </span>
        </span>
      </label>
      {o.indirildi && (
        <button type="button" className="dugme sade" onClick={o.onKaldir}>
          Kaldır
        </button>
      )}
    </li>
  )
}
