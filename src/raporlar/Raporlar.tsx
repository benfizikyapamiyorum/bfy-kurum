// Raporlar: sınıf seçilir; kazanım başarısı (zayıf olanlar işaretli, tek tıkla telafi testi),
// sınav özeti, öğrenci listesi ve seçilen öğrencinin net gelişimi.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { egilim, ogrenciOzetleri, zayifKazanimlar, ZAYIF_ESIK } from '../alan/rapor'
import { otomatikTestOlustur } from '../alan/testOlusturma'
import { trSayi } from '../alan/turkce'
import { CizgiGrafik, YuzdeCubuklari } from '../bilesenler/Grafikler'
import { kurumKullanicilari, siniflar } from '../depo/kurumDeposu'
import { kazanimBasarisi, sinifSonuclari, type KazanimBasarisi } from '../depo/raporDeposu'
import { kazanimSorulari, sinifaVerilmisSorular, testKaydet } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useKatalog, type KatalogYardimcisi } from '../katalogBaglami'
import { useOturum } from '../oturum/Oturum'

const tarih = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

export function Raporlar() {
  const { kurum } = useOturum()
  const gruplar = useVeri(() => siniflar(kurum!.id), [kurum?.id])
  const [sinifId, setSinifId] = useState<string | null>(null)
  const etkin = sinifId ?? gruplar.veri?.[0]?.id ?? null

  return (
    <div className="sayfa genis-sayfa">
      <h1>Raporlar</h1>
      {gruplar.veri?.length === 0 && <p className="soluk">Henüz sınıf yok. Kurum panelinden sınıf açılınca raporlar burada görünür.</p>}
      <div className="cip-satiri" role="group" aria-label="Sınıf">
        {gruplar.veri?.map((g) => (
          <button key={g.id} type="button" className={`cip ${etkin === g.id ? 'secili' : ''}`} aria-pressed={etkin === g.id} onClick={() => setSinifId(g.id)}>
            {g.ad}
          </button>
        ))}
      </div>
      {etkin && <SinifRaporu key={etkin} sinifId={etkin} sinifAdi={gruplar.veri?.find((g) => g.id === etkin)?.ad ?? ''} />}
    </div>
  )
}

function SinifRaporu({ sinifId, sinifAdi }: { sinifId: string; sinifAdi: string }) {
  const { kurum, profil, lisans } = useOturum()
  const { yardimci } = useKatalog()
  const git = useNavigate()
  const kazanimlar = useVeri(() => kazanimBasarisi(sinifId), [sinifId])
  const sonuclar = useVeri(() => sinifSonuclari(sinifId), [sinifId])
  const ogrenciler = useVeri(
    async () => (await kurumKullanicilari(kurum!.id)).filter((k) => k.rol === 'ogrenci' && k.sinif_idleri.includes(sinifId)),
    [sinifId],
  )
  const [secilenOgrenci, setSecilenOgrenci] = useState<string | null>(null)
  const [telafiAdet, setTelafiAdet] = useState(10)
  const [telafiMesaji, setTelafiMesaji] = useState<string | null>(null)
  const [hazirlaniyor, setHazirlaniyor] = useState(false)

  const zayiflar = useMemo(() => zayifKazanimlar(kazanimlar.veri ?? []), [kazanimlar.veri])
  const ozetler = useMemo(() => ogrenciOzetleri(sonuclar.veri ?? []), [sonuclar.veri])

  // Sınav bazında özet.
  const sinavlar = useMemo(() => {
    const m = new Map<string, { baslik: string; tarih: string; netler: number[] }>()
    for (const s of sonuclar.veri ?? []) {
      const x = m.get(s.atama_id) ?? { baslik: s.test_baslik, tarih: s.baslangic, netler: [] }
      x.netler.push(s.net)
      m.set(s.atama_id, x)
    }
    return [...m.entries()].map(([id, x]) => ({
      id,
      ...x,
      ortalama: x.netler.reduce((t, n) => t + n, 0) / x.netler.length,
      enYuksek: Math.max(...x.netler),
    }))
  }, [sonuclar.veri])

  const telafiOlustur = async () => {
    setTelafiMesaji(null)
    setHazirlaniyor(true)
    try {
      const ids = zayiflar.map((z) => z.kazanim_id)
      const [havuz, verilen] = await Promise.all([kazanimSorulari(ids), sinifaVerilmisSorular(sinifId)])
      const r = otomatikTestOlustur({ havuz, kazanimIdleri: ids, adet: telafiAdet, dahaOnceVerilenler: verilen })
      if (r.soruIdleri.length === 0) {
        setTelafiMesaji('Bu kazanımlar için soru havuzunda soru bulunamadı.')
        return
      }
      const kodlar = ids.map((k) => yardimci?.kazanim(k)?.kod).filter(Boolean).join(', ')
      const id = await testKaydet(
        kurum!.id,
        profil!.id,
        {
          baslik: `Telafi: ${sinifAdi}, ${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`,
          tur: 'mini_test',
          aciklama: `Zayıf öğrenme çıktıları: ${kodlar}.`,
          sure_dk: Math.max(10, r.soruIdleri.length * 2),
          yanlis_dogru_orani: 4,
          ayarlar: { duzen: 'iki', islemAlani: 'kisa', filigran: false },
        },
        r.soruIdleri,
      )
      git(`/testler/${id}`, { state: { mesaj: r.uyarilar.join(' ') } })
    } catch (e) {
      setTelafiMesaji(e instanceof Error ? e.message : String(e))
    } finally {
      setHazirlaniyor(false)
    }
  }

  if (kazanimlar.hata || sonuclar.hata) return <p className="hata-metni">{(kazanimlar.hata ?? sonuclar.hata)!.message}</p>
  if (!kazanimlar.veri || !sonuclar.veri || !ogrenciler.veri) return <p className="soluk">Yükleniyor.</p>
  if (sonuclar.veri.length === 0) return <p className="kart soluk">Bu sınıfta henüz tamamlanmış test yok.</p>

  const ogrenciListesi = ogrenciler.veri
  const ogrenciAdi = new Map(ogrenciListesi.map((o) => [o.id, o.ad_soyad]))
  const secilen = secilenOgrenci ? (sonuclar.veri.filter((s) => s.ogrenci_id === secilenOgrenci)) : null

  return (
    <div className="panel-dikey">
      <section className="kart">
        <div className="kart-ust">
          <div>
            <h2>Öğrenme çıktısı başarısı</h2>
            <p className="soluk kucuk">
              Tamamlanan testlerdeki doğru cevap yüzdesi. Boş bırakılan soru doğru sayılmaz. %{ZAYIF_ESIK} altı ve en az 3 cevabı
              olan çıktılar zayıf sayılır.
            </p>
          </div>
        </div>
        <YuzdeCubuklari cubuklar={kazanimCubuklari(kazanimlar.veri, zayiflar, yardimci)} />
        <div className="telafi">
          {zayiflar.length === 0 ? (
            <p className="basari-metni">Bu sınıfta zayıf öğrenme çıktısı yok.</p>
          ) : (
            <>
              <p>
                <strong>Bu sınıf şu öğrenme çıktılarında zayıf:</strong>{' '}
                {zayiflar.map((z) => yardimci?.kazanim(z.kazanim_id)?.kod).join(', ')}.
              </p>
              <div className="satir-form">
                <label className="alan">
                  Soru sayısı
                  <input type="number" min={1} max={40} value={telafiAdet} onChange={(e) => setTelafiAdet(Math.max(1, +e.target.value || 1))} />
                </label>
                <button type="button" className="dugme ana" disabled={hazirlaniyor || !lisans?.gecerli} onClick={() => void telafiOlustur()}>
                  {hazirlaniyor ? 'Hazırlanıyor.' : 'Telafi testi oluştur'}
                </button>
              </div>
              <p className="soluk kucuk">
                Telafi testi zayıf çıktılardan, bu sınıfa daha önce verilmemiş sorularla oluşturulur ve düzenlemeniz için açılır.
              </p>
            </>
          )}
          {telafiMesaji && <p className="hata-metni">{telafiMesaji}</p>}
        </div>
      </section>

      <div className="panel-izgara">
        <section className="kart">
          <h2>Sınavlar</h2>
          <table className="tablo">
            <thead>
              <tr>
                <th>Test</th>
                <th>Tarih</th>
                <th>Katılım</th>
                <th>Ortalama net</th>
                <th>En yüksek</th>
              </tr>
            </thead>
            <tbody>
              {sinavlar.map((s) => (
                <tr key={s.id}>
                  <td>{s.baslik}</td>
                  <td>{tarih(s.tarih)}</td>
                  <td>
                    {s.netler.length} / {ogrenciListesi.length}
                  </td>
                  <td>{trSayi(s.ortalama)}</td>
                  <td>{trSayi(s.enYuksek)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="kart">
          <h2>Öğrenciler</h2>
          <table className="tablo">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>Sınav</th>
                <th>Ortalama</th>
                <th>Son</th>
                <th>Eğilim</th>
              </tr>
            </thead>
            <tbody>
              {ogrenciListesi.map((o) => {
                const z = ozetler.get(o.id)
                const e = z ? egilim(z.netler) : null
                return (
                  <tr key={o.id} className={secilenOgrenci === o.id ? 'secili-satir' : ''}>
                    <td>
                      <button type="button" className="baglanti-dugme" onClick={() => setSecilenOgrenci(o.id)} disabled={!z}>
                        {o.ad_soyad}
                      </button>
                    </td>
                    <td>{z?.sinav ?? 0}</td>
                    <td>{z ? trSayi(z.ortalama) : ''}</td>
                    <td>{z ? trSayi(z.son) : ''}</td>
                    <td>{e === 'artiyor' ? 'Yükseliyor' : e === 'azaliyor' ? 'Düşüyor' : e === 'sabit' ? 'Durağan' : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>

      {secilen && secilenOgrenci && (
        <OgrenciRaporu
          sinifId={sinifId}
          ogrenciId={secilenOgrenci}
          ad={ogrenciAdi.get(secilenOgrenci) ?? ''}
          sonuclar={secilen}
          kapat={() => setSecilenOgrenci(null)}
        />
      )}
    </div>
  )
}

function kazanimCubuklari(liste: KazanimBasarisi[], zayiflar: KazanimBasarisi[], yardimci: KatalogYardimcisi | null) {
  const zayif = new Set(zayiflar.map((z) => z.kazanim_id))
  return liste.map((k) => {
    const kz = yardimci?.kazanim(k.kazanim_id)
    return {
      anahtar: k.kazanim_id,
      etiket: kz?.kod ?? 'Bilinmeyen çıktı',
      aciklama: kz?.metin,
      deger: k.yuzde,
      zayif: zayif.has(k.kazanim_id),
      ayrinti: `(${k.dogru}/${k.deneme})`,
    }
  })
}

function OgrenciRaporu({
  sinifId,
  ogrenciId,
  ad,
  sonuclar,
  kapat,
}: {
  sinifId: string
  ogrenciId: string
  ad: string
  sonuclar: { test_baslik: string; baslangic: string; net: number; dogru: number; yanlis: number; bos: number }[]
  kapat: () => void
}) {
  const { yardimci } = useKatalog()
  const k = useVeri(() => kazanimBasarisi(sinifId, ogrenciId), [sinifId, ogrenciId])
  const zayiflar = zayifKazanimlar(k.veri ?? [], ZAYIF_ESIK, 2)
  return (
    <section className="kart" aria-label={`${ad} raporu`}>
      <div className="kart-ust">
        <h2>{ad}: net gelişimi</h2>
        <button type="button" className="dugme sade" onClick={kapat}>
          Kapat
        </button>
      </div>
      <CizgiGrafik noktalar={sonuclar.map((s) => ({ etiket: s.test_baslik, ayrinti: tarih(s.baslangic), deger: s.net }))} />
      <details>
        <summary>Tablo olarak gör</summary>
        <table className="tablo">
          <thead>
            <tr>
              <th>Test</th>
              <th>Tarih</th>
              <th>D</th>
              <th>Y</th>
              <th>B</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {sonuclar.map((s, i) => (
              <tr key={i}>
                <td>{s.test_baslik}</td>
                <td>{tarih(s.baslangic)}</td>
                <td>{s.dogru}</td>
                <td>{s.yanlis}</td>
                <td>{s.bos}</td>
                <td>{trSayi(s.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      {zayiflar.length > 0 && (
        <p>
          <strong>Çalışması gereken öğrenme çıktıları:</strong> {zayiflar.map((z) => yardimci?.kazanim(z.kazanim_id)?.kod).join(', ')}.
        </p>
      )}
    </section>
  )
}
