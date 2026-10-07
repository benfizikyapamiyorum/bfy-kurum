// Kurum görüşmesi sunumu: tam ekran slaytlar, her özellik için uygulamanın gerçek ekranına geçiş.
// Klavye: sağ/sol ok, boşluk, Page Up/Down (sunum kumandası), F tam ekran.

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { UrunIsareti } from '../bilesenler/UrunIsareti'
import { useVeri } from '../kancalar'
import { marka } from '../yapilandirma/marka'
import { ortam } from '../yapilandirma/ortam'
import { katalog } from '../veri/katalog'
import { ornekSorular } from '../veri/ornekSorular'
import { SLAYTLAR, type CanliHedef, type Slayt } from './slaytlar'
import { sunumAdiminiKaydet } from './sunumDurumu'
import '../stil/sunum.css'

interface Paket {
  adresler: Record<CanliHedef, string>
  sayilar: { deger: number; ad: string }[] | null
}

/** Hareketli çözümü olan örnek soru (yatay atış): şekildeki top, x = x0 + ϑt + ½at² ile hareket eder. */
function hareketliSoruYolu(): string {
  const soru = ornekSorular.find((s) => s.sekil_svg?.includes('data-ciz-tur="kinematik"') && s.govde.includes('yatay'))
  const kazanim = soru && katalog.kazanimlar.find((k) => k.id === soru.kazanim_idleri[0])
  const unite = kazanim && katalog.uniteler.find((u) => u.id === kazanim.unite_id)
  const seviye = unite && katalog.seviyeler.find((s) => s.id === unite.seviye_id)
  return soru && unite && seviye ? `/tahta/${seviye.kod}/${unite.id}/soru/${soru.id}` : '/tahta'
}

async function paketBilgisi(): Promise<Paket> {
  const genel: Record<CanliHedef, string> = {
    tahtaSoru: '/tahta',
    hareketli: hareketliSoruYolu(),
    uniteSorulari: '/tahta',
    konu: '/tahta',
    ogrenciTest: '/demo/test',
    rapor: '/demo/rapor',
    kitapcik: '/demo/yazdir/ogrenci',
    internetsiz: '/tahta/indir',
    demo: '/demo',
  }
  if (!ortam.tanitim) return { adresler: genel, sayilar: null }
  const p = await import('../veri/tanitimPaketi')
  const unite = p.tanitimUniteYolu()
  // Dördüncü soru (batık gemiden çıkan metal) tahtada en etkileyici açılan sorudur.
  const vitrin = p.tanitimSorulari[3] ?? p.tanitimSorulari[0]
  const konu = p.tanitimIcerikleri.find((c) => c.veri)
  const gerekce = p.tanitimSorulari.reduce((t, s) => t + (s.secenekler?.filter((x) => x.gerekce).length ?? 0), 0)
  const adim = p.tanitimSorulari.reduce((t, s) => t + s.cozum_adimlari.length, 0)
  const sekilli = p.tanitimSorulari.filter((s) => s.sekil_svg).length
  return {
    adresler: {
      ...genel,
      tahtaSoru: vitrin ? `${unite}/soru/${vitrin.id}` : unite,
      uniteSorulari: unite,
      konu: konu ? `/tahta/konu/${konu.id}` : unite,
      ogrenciTest: '/demo/test?paket=kaldirma',
    },
    sayilar: [
      { deger: p.tanitimSorulari.length, ad: 'bağlam temelli soru' },
      { deger: sekilli, ad: 'özgün, gerçekçi şekil' },
      { deger: gerekce, ad: '“Neden bu değil?” açıklaması' },
      { deger: adim, ad: 'adım adım çözüm basamağı' },
    ],
  }
}

export function Sunum() {
  const [ara, setAra] = useSearchParams()
  const no = Math.min(Math.max(Number(ara.get('adim') ?? 0) || 0, 0), SLAYTLAR.length - 1)
  const [tamEkran, setTamEkran] = useState(false)
  const gezgin = useNavigate()
  const paket = useVeri(paketBilgisi, [])

  const git = useCallback(
    (yeni: number) => {
      const n = Math.min(Math.max(yeni, 0), SLAYTLAR.length - 1)
      setAra({ adim: String(n) }, { replace: true })
    },
    [setAra],
  )

  // Sunum açıkken dönüş düğmesi gizlenir; canlı ekrana geçince bu slayta dönülür.
  useEffect(() => sunumAdiminiKaydet(null), [])

  useEffect(() => {
    document.title = `${marka.urunAdi}: sunum`
    const tus = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        git(no + 1)
      } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        git(no - 1)
      } else if (e.key === 'Home') git(0)
      else if (e.key === 'End') git(SLAYTLAR.length - 1)
      else if (e.key === 'f' || e.key === 'F') void tamEkranDegistir()
    }
    window.addEventListener('keydown', tus)
    return () => window.removeEventListener('keydown', tus)
  }, [no, git])

  useEffect(() => {
    const d = () => setTamEkran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', d)
    return () => document.removeEventListener('fullscreenchange', d)
  }, [])

  const canliAc = (hedef: CanliHedef) => {
    if (!paket.veri) return
    sunumAdiminiKaydet(no)
    gezgin(paket.veri.adresler[hedef])
  }

  const slayt = SLAYTLAR[no]!
  return (
    <div className="sunum" data-tur={slayt.tur}>
      <div
        className="sunum-tiklama"
        onClick={(e) => {
          // Düğme dışındaki boş alana tıklama: sağ yarı ileri, sol yarı geri.
          if ((e.target as HTMLElement).closest('a, button')) return
          git(e.clientX > window.innerWidth / 2 ? no + 1 : no - 1)
        }}
      >
        <SlaytGorunumu key={no} slayt={slayt} paket={paket.veri ?? null} canliAc={canliAc} />
      </div>

      <footer className="sunum-alt">
        <span className="sunum-marka">
          <UrunIsareti boyut={22} />
          {marka.sahipAdi}
        </span>
        <div className="sunum-ilerleme" aria-hidden="true">
          {SLAYTLAR.map((_, i) => (
            <button key={i} type="button" className={i === no ? 'etkin' : i < no ? 'gecti' : ''} onClick={() => git(i)} tabIndex={-1} />
          ))}
        </div>
        <div className="sunum-dugmeler">
          <button type="button" onClick={() => git(no - 1)} disabled={no === 0} aria-label="Önceki slayt">
            <Simge ad="geri" />
          </button>
          <span className="sunum-sayac">
            {no + 1} / {SLAYTLAR.length}
          </span>
          <button type="button" onClick={() => git(no + 1)} disabled={no === SLAYTLAR.length - 1} aria-label="Sonraki slayt">
            <Simge ad="ileri" />
          </button>
          <button type="button" onClick={() => void tamEkranDegistir()} aria-label="Tam ekran" title="Tam ekran (F)">
            <Simge ad={tamEkran ? 'tamEkrandanCik' : 'tamEkran'} />
          </button>
          <Link to="/" aria-label="Sunumdan çık" title="Sunumdan çık">
            <Simge ad="kapat" />
          </Link>
        </div>
      </footer>
    </div>
  )
}

async function tamEkranDegistir() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    // Tarayıcı izin vermezse sunum normal pencerede sürer.
  }
}

function SlaytGorunumu({ slayt, paket, canliAc }: { slayt: Slayt; paket: Paket | null; canliAc: (h: CanliHedef) => void }) {
  return (
    <section className={`slayt tur-${slayt.tur}`}>
      {slayt.tur === 'kapak' || slayt.tur === 'kapanis' ? (
        <div className="slayt-kapak">
          <UrunIsareti boyut={slayt.tur === 'kapak' ? 96 : 64} />
          <h1>{slayt.baslik}</h1>
          {slayt.alt && <p className="slayt-alt">{slayt.alt}</p>}
          <p className="slayt-marka">{marka.sahipAdi} içeriğiyle, kurslar için.</p>
          {slayt.tur === 'kapanis' && (
            <p className="slayt-iletisim">
              {marka.web}
              {marka.sosyalMedya && <>, {marka.sosyalMedya}</>}
              {marka.iletisimEposta && <>, {marka.iletisimEposta}</>}
            </p>
          )}
          {slayt.tur === 'kapak' && <p className="slayt-ipucu">Başlamak için sağ ok tuşuna basın ya da ekranın sağına tıklayın.</p>}
        </div>
      ) : (
        <div className={slayt.gorsel ? 'slayt-iki-sutun' : 'slayt-govde'}>
          <div className="slayt-metin">
            <header>
              {slayt.ust && <p className="slayt-ust">{slayt.ust}</p>}
              <h1>{slayt.baslik}</h1>
            </header>
            {slayt.tur === 'dongu' && <Dongu />}
            {slayt.tur === 'sayilar' && paket?.sayilar && (
              <div className="sayi-izgara">
                {paket.sayilar.map((s) => (
                  <div key={s.ad}>
                    <strong>{s.deger}</strong>
                    <span>{s.ad}</span>
                  </div>
                ))}
              </div>
            )}
            {slayt.alt && <p className="slayt-alt">{slayt.alt}</p>}
            {slayt.maddeler &&
              (slayt.tur === 'adimlar' ? (
                <ol className="slayt-adimlar">
                  {slayt.maddeler.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ol>
              ) : (
                <ul className="slayt-maddeler">
                  {slayt.maddeler.map((m) => (
                    <li key={m}>
                      <Simge ad="tamam" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              ))}
            {slayt.kartlar && (
              <div className={`slayt-kartlar adet-${slayt.kartlar.length}`}>
                {slayt.kartlar.map((k) => (
                  <div key={k.baslik} className="slayt-kart">
                    <span className="slayt-kart-simge">
                      <Simge ad={k.simge} boyut={30} />
                    </span>
                    <h2>{k.baslik}</h2>
                    <p>{k.metin}</p>
                  </div>
                ))}
              </div>
            )}
            {slayt.canli && <CanliDugmeler slayt={slayt} paket={paket} canliAc={canliAc} />}
          </div>
          {slayt.gorsel && <Gorsel gorsel={slayt.gorsel} />}
        </div>
      )}
      {(slayt.tur === 'kapak' || slayt.tur === 'kapanis') && slayt.canli && <CanliDugmeler slayt={slayt} paket={paket} canliAc={canliAc} />}
    </section>
  )
}

function CanliDugmeler({ slayt, paket, canliAc }: { slayt: Slayt; paket: Paket | null; canliAc: (h: CanliHedef) => void }) {
  return (
    <div className="slayt-canli">
      {slayt.canli?.map((c) => (
        <button key={c.hedef} type="button" className="canli-dugme" disabled={!paket} onClick={() => canliAc(c.hedef)}>
          <span className="canli-nokta" aria-hidden="true" />
          {c.etiket}
          <Simge ad="ileri" />
        </button>
      ))}
    </div>
  )
}

function Gorsel({ gorsel }: { gorsel: NonNullable<Slayt['gorsel']> }) {
  return (
    <figure className={`slayt-gorsel cerceve-${gorsel.cerceve}`}>
      {gorsel.cerceve === 'ekran' && (
        <span className="cerceve-cubuk" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
      <img src={gorsel.kaynak} alt={gorsel.aciklama} />
    </figure>
  )
}

const DONGU = [
  {
    simge: 'tahta',
    baslik: 'Tahtada anlat',
    metin: 'Konu ve sorular akıllı tahtada.',
  },
  { simge: 'belge', baslik: 'Test et', metin: 'Online ya da basılı deneme.' },
  {
    simge: 'goz',
    baslik: 'Raporda gör',
    metin: 'Zayıf öğrenme çıktıları işaretli.',
  },
  { simge: 'yenile', baslik: 'Telafi et', metin: 'Tek tıkla telafi testi.' },
] as const

function Dongu() {
  return (
    <div className="dongu">
      <div className="dongu-sira">
        {DONGU.map((d, i) => (
          <div key={d.baslik} className="dongu-adim-kap">
            <div className="dongu-adim">
              <span className="dongu-simge">
                <Simge ad={d.simge} boyut={34} />
              </span>
              <strong>{d.baslik}</strong>
              <span>{d.metin}</span>
            </div>
            {i < DONGU.length - 1 && (
              <span className="dongu-ok" aria-hidden="true">
                <Simge ad="ileri" />
              </span>
            )}
          </div>
        ))}
      </div>
      <svg className="dongu-donus" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M 875 4 C 875 60, 860 62, 800 62 L 200 62 C 140 62, 125 60, 125 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 112 22 L 125 2 L 138 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
