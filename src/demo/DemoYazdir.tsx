// Demo: test çıktıları (öğrenci kitapçığı, cevaplı öğretmen sürümü, optik form).
// Lisanslı kurumdaki çıktı sayfasıyla aynı bileşenler; sorular örnek setten gelir, sunucu gerekmez.

import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Soru, Test } from '../alan/tipler'
import { useVeri } from '../kancalar'
import { Kitapcik, OptikForm } from '../testler/TestYazdir'
import { ornekSorular } from '../veri/ornekSorular'
import { marka } from '../yapilandirma/marka'
import { ortam } from '../yapilandirma/ortam'
import '../stil/yazdir.css'

type Surum = 'ogrenci' | 'ogretmen' | 'optik'

const SURUMLER: { surum: Surum; ad: string }[] = [
  { surum: 'ogrenci', ad: 'Öğrenci kitapçığı' },
  { surum: 'ogretmen', ad: 'Cevaplı öğretmen kitapçığı' },
  { surum: 'optik', ad: 'Optik form' },
]

async function demoTesti(): Promise<{ test: Test; sorular: Soru[] }> {
  const tanitim = ortam.tanitim ? (await import('../veri/tanitimPaketi')).tanitimSorulari : null
  const sorular = tanitim ?? ornekSorular.filter((s) => s.tur !== 'acik_uclu')
  return {
    sorular,
    test: {
      id: 'demo',
      kurum_id: 'demo',
      olusturan_id: null,
      tur: 'deneme',
      baslik: tanitim ? '9. sınıf kaldırma kuvveti denemesi' : 'Örnek deneme',
      aciklama: 'Her sorunun yalnızca bir doğru cevabı vardır. Aksi söylenmedikçe g = 10 m/s² alınız.',
      sure_dk: 40,
      yanlis_dogru_orani: 4,
      ayarlar: { duzen: 'iki', islemAlani: 'kisa', filigran: false },
      olusturma: new Date().toISOString(),
    },
  }
}

export function DemoYazdir() {
  const { surum = 'ogrenci' } = useParams() as { surum: Surum }
  const v = useVeri(demoTesti, [])

  useEffect(() => {
    if (v.veri) document.title = `${v.veri.test.baslik} (${SURUMLER.find((s) => s.surum === surum)?.ad ?? ''})`
  }, [v.veri, surum])

  if (!v.veri) return <p>Yükleniyor.</p>
  const { test, sorular } = v.veri
  const kurumAdi = marka.demoKurumAdi

  return (
    <div className={`yazdir-kok duzen-${test.ayarlar.duzen} islem-${test.ayarlar.islemAlani}`}>
      <div className="yazdir-arac ekranda demo-yazdir-arac">
        <Link to="/demo" className="dugme">
          Demoya dön
        </Link>
        <nav className="secim-grubu" aria-label="Çıktı türü">
          {SURUMLER.map((s) => (
            <Link key={s.surum} to={`/demo/yazdir/${s.surum}`} className={`dugme ${s.surum === surum ? 'ana' : ''}`}>
              {s.ad}
            </Link>
          ))}
        </nav>
        <button type="button" className="dugme" onClick={() => window.print()}>
          Yazdır ya da PDF olarak kaydet
        </button>
        <span className="soluk">
          Kurumunuzda kitapçığın üstünde kurumun adı ve logosu yer alır. Öğretmen soruları seçer, çıktı tek tıkla hazırlanır.
        </span>
      </div>
      {surum === 'optik' ? (
        <OptikForm test={test} soruSayisi={sorular.length} kurumAdi={kurumAdi} logo={null} ogrenci={null} />
      ) : (
        <Kitapcik test={test} sorular={sorular} ogretmen={surum === 'ogretmen'} kurumAdi={kurumAdi} logo={null} />
      )}
    </div>
  )
}
