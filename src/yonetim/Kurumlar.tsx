// Kurum listesi, yeni kurum, lisans uzatma, kontenjan ve kurum yöneticisi hesabı.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { lisansDurumu, tarihYaz as tarih } from '../alan/lisans'
import { hesapAc, type HesapSonucu } from '../depo/kurumDeposu'
import { kurumEkle, kurumGuncelle, kurumOzetleri, uzatilmisBitis, type KurumOzeti } from '../depo/yonetimDeposu'
import { useVeri } from '../kancalar'
import { HesapSonuclari, type KartKurumu } from '../kurum/HesapSonuclari'

// Yerel takvim günü (UTC değil): gece yarısından sonra yanlış güne kaymaz.
const bugunMetni = () => new Date().toLocaleDateString('sv-SE')

export function Kurumlar() {
  const v = useVeri(kurumOzetleri, [])
  const [secili, setSecili] = useState<string | null>(null)
  const [hesaplar, setHesaplar] = useState<{ sonuclar: HesapSonucu[]; kurum: KartKurumu } | null>(null)
  const kurum = v.veri?.find((k) => k.id === secili) ?? null

  return (
    <div className="panel-dikey">
      {hesaplar && <HesapSonuclari sonuclar={hesaplar.sonuclar} kurum={hesaplar.kurum} kapat={() => setHesaplar(null)} />}
      <YeniKurum
        eklendi={(id, h) => {
          setHesaplar(h)
          setSecili(id)
          v.yenile()
        }}
      />
      <section className="kart">
        <h2>Kurumlar {v.veri ? `(${v.veri.length})` : ''}</h2>
        {v.hata && <p className="hata-metni">Kurumlar alınamadı: {v.hata.message}</p>}
        {v.veri && v.veri.length === 0 && <p className="soluk">Henüz kurum yok.</p>}
        {v.veri && v.veri.length > 0 && (
          <div className="tablo-kaydir">
            <table className="tablo">
              <thead>
                <tr>
                  <th>Kurum</th>
                  <th>Kod</th>
                  <th>Lisans</th>
                  <th>Öğretmen</th>
                  <th>Öğrenci</th>
                  <th>Yönetici</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {v.veri.map((k) => {
                  const l = lisansDurumu(k)
                  return (
                    <tr key={k.id} className={k.aktif ? '' : 'pasif'}>
                      <td>
                        {k.ad} {k.demo && <span className="rozet">Demo</span>}
                      </td>
                      <td>{k.kod ?? 'Yok'}</td>
                      <td>
                        <span className={l.gecerli ? '' : 'hata-metni'}>{tarih(k.lisans_bitis)}</span>
                        {!k.aktif && <span className="soluk"> (kapalı)</span>}
                        {k.aktif && !l.gecerli && <span className="soluk"> (süresi doldu)</span>}
                      </td>
                      <td>
                        {k.ogretmen_sayisi} / {k.ogretmen_limiti}
                      </td>
                      <td>
                        {k.ogrenci_sayisi} / {k.ogrenci_limiti}
                      </td>
                      <td className="kisalt">{k.yonetici ?? <span className="soluk">Yok</span>}</td>
                      <td>
                        <button type="button" className="dugme sade kucuk" onClick={() => setSecili(secili === k.id ? null : k.id)}>
                          {secili === k.id ? 'Kapat' : 'Düzenle'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {kurum && (
        <KurumDuzenle
          key={kurum.id}
          kurum={kurum}
          degisti={v.yenile}
          hesapAcildi={(h) => {
            setHesaplar(h)
            v.yenile()
          }}
        />
      )}
    </div>
  )
}

function YeniKurum({ eklendi }: { eklendi: (id: string, hesaplar: { sonuclar: HesapSonucu[]; kurum: KartKurumu } | null) => void }) {
  const [ad, setAd] = useState('')
  const [kod, setKod] = useState('')
  const [bitis, setBitis] = useState(() => uzatilmisBitis(bugunMetni(), 12))
  const [ogretmen, setOgretmen] = useState(10)
  const [ogrenci, setOgrenci] = useState(300)
  const [yAd, setYAd] = useState('')
  const [yEposta, setYEposta] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    setHata(null)
    setBekliyor(true)
    try {
      const id = await kurumEkle({
        ad,
        kod,
        lisans_baslangic: bugunMetni(),
        lisans_bitis: bitis,
        ogretmen_limiti: ogretmen,
        ogrenci_limiti: ogrenci,
      })
      let h: { sonuclar: HesapSonucu[]; kurum: KartKurumu } | null = null
      if (yAd.trim() && yEposta.trim()) {
        h = { sonuclar: await hesapAc(id, [{ rol: 'kurum_yonetici', ad_soyad: yAd, eposta: yEposta }]), kurum: { ad: ad.trim(), kod: kod.trim() } }
      }
      setAd('')
      setKod('')
      setYAd('')
      setYEposta('')
      eklendi(id, h)
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    } finally {
      setBekliyor(false)
    }
  }

  return (
    <section className="kart">
      <details>
        <summary>
          <h2 style={{ display: 'inline' }}>Yeni kurum</h2>
        </summary>
        <form className="form-izgara" onSubmit={(e) => void gonder(e)}>
          <label>
            Kurum adı
            <input required minLength={2} value={ad} onChange={(e) => setAd(e.target.value)} />
          </label>
          <label>
            Kurum kodu (öğrenci girişinde yazılır)
            <input
              required
              pattern="[A-Za-z0-9]{3,12}"
              title="3-12 harf ya da rakam."
              value={kod}
              onChange={(e) => setKod(e.target.value.toLocaleUpperCase('tr-TR'))}
            />
          </label>
          <label>
            Lisans bitişi
            <input type="date" required value={bitis} onChange={(e) => setBitis(e.target.value)} />
          </label>
          <label>
            Öğretmen kontenjanı
            <input type="number" min={1} required value={ogretmen} onChange={(e) => setOgretmen(Number(e.target.value))} />
          </label>
          <label>
            Öğrenci kontenjanı
            <input type="number" min={1} required value={ogrenci} onChange={(e) => setOgrenci(Number(e.target.value))} />
          </label>
          <label>
            Kurum yöneticisi ad soyad
            <input value={yAd} onChange={(e) => setYAd(e.target.value)} />
          </label>
          <label>
            Kurum yöneticisi e-posta
            <input type="email" required={!!yAd.trim()} value={yEposta} onChange={(e) => setYEposta(e.target.value)} />
          </label>
          <button type="submit" className="dugme ana hizali" disabled={bekliyor}>
            Kurumu oluştur
          </button>
        </form>
        <p className="soluk kucuk">Yönetici bilgisi boş bırakılırsa hesap daha sonra bu sayfadan açılabilir.</p>
        {hata && <p className="hata-metni">{hata}</p>}
      </details>
    </section>
  )
}

function KurumDuzenle({
  kurum,
  degisti,
  hesapAcildi,
}: {
  kurum: KurumOzeti
  degisti: () => void
  hesapAcildi: (h: { sonuclar: HesapSonucu[]; kurum: KartKurumu }) => void
}) {
  const [ad, setAd] = useState(kurum.ad)
  const [kod, setKod] = useState(kurum.kod ?? '')
  const [bitis, setBitis] = useState(kurum.lisans_bitis)
  const [ogretmen, setOgretmen] = useState(kurum.ogretmen_limiti)
  const [ogrenci, setOgrenci] = useState(kurum.ogrenci_limiti)
  const [yAd, setYAd] = useState('')
  const [yEposta, setYEposta] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const kutu = useRef<HTMLElement>(null)
  // Bileşen kurum kimliğiyle anahtarlı: yalnızca açılışta kaydırılır.
  useEffect(() => kutu.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), [])

  const calistir = async (is: () => Promise<unknown>, basari: string) => {
    setHata(null)
    setMesaj(null)
    try {
      await is()
      setMesaj(basari)
      degisti()
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    }
  }

  const kaydet = (e: FormEvent) => {
    e.preventDefault()
    void calistir(
      () =>
        kurumGuncelle(kurum.id, {
          ad: ad.trim(),
          kod,
          lisans_bitis: bitis,
          ogretmen_limiti: ogretmen,
          ogrenci_limiti: ogrenci,
        }),
      'Kurum bilgileri kaydedildi.',
    )
  }

  const uzat = (ay: number) => {
    const yeni = uzatilmisBitis(kurum.lisans_bitis, ay)
    setBitis(yeni)
    void calistir(() => kurumGuncelle(kurum.id, { lisans_bitis: yeni }), `Lisans ${tarih(yeni)} tarihine uzatıldı.`)
  }

  const yoneticiAc = async (e: FormEvent) => {
    e.preventDefault()
    setHata(null)
    try {
      const h = await hesapAc(kurum.id, [{ rol: 'kurum_yonetici', ad_soyad: yAd, eposta: yEposta }])
      setYAd('')
      setYEposta('')
      hesapAcildi({ sonuclar: h, kurum: { ad: kurum.ad, kod: kurum.kod } })
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section
      className="kart"
      aria-label={`${kurum.ad} düzenleme`}
      ref={kutu}
    >
      <h2>{kurum.ad}</h2>
      <form className="form-izgara" onSubmit={kaydet}>
        <label>
          Kurum adı
          <input required minLength={2} value={ad} onChange={(e) => setAd(e.target.value)} />
        </label>
        <label>
          Kurum kodu
          <input
            required
            pattern="[A-Za-z0-9]{3,12}"
            value={kod}
            onChange={(e) => setKod(e.target.value.toLocaleUpperCase('tr-TR'))}
          />
        </label>
        <label>
          Lisans bitişi
          <input type="date" required min={kurum.lisans_baslangic} value={bitis} onChange={(e) => setBitis(e.target.value)} />
        </label>
        <label>
          Öğretmen kontenjanı
          <input type="number" min={1} required value={ogretmen} onChange={(e) => setOgretmen(Number(e.target.value))} />
        </label>
        <label>
          Öğrenci kontenjanı
          <input type="number" min={1} required value={ogrenci} onChange={(e) => setOgrenci(Number(e.target.value))} />
        </label>
        <button type="submit" className="dugme ana hizali">
          Kaydet
        </button>
      </form>
      <div className="satir-islemleri">
        <button type="button" className="dugme" onClick={() => uzat(1)}>
          1 ay uzat
        </button>
        <button type="button" className="dugme" onClick={() => uzat(12)}>
          1 yıl uzat
        </button>
        <button
          type="button"
          className="dugme sade"
          onClick={() =>
            void calistir(
              () => kurumGuncelle(kurum.id, { aktif: !kurum.aktif }),
              kurum.aktif ? 'Kurum kapatıldı. Kullanıcıları içeriğe erişemez.' : 'Kurum yeniden açıldı.',
            )
          }
        >
          {kurum.aktif ? 'Kurumu kapat' : 'Kurumu aç'}
        </button>
      </div>
      <p className="soluk kucuk">Uzatma, bugünden ya da mevcut bitişten (hangisi ileriyse) itibaren hesaplanır.</p>

      <h3>Kurum yöneticisi hesabı aç</h3>
      <form className="form-izgara" onSubmit={(e) => void yoneticiAc(e)}>
        <label>
          Ad soyad
          <input required minLength={2} value={yAd} onChange={(e) => setYAd(e.target.value)} />
        </label>
        <label>
          E-posta
          <input type="email" required value={yEposta} onChange={(e) => setYEposta(e.target.value)} />
        </label>
        <button type="submit" className="dugme hizali">
          Hesap aç
        </button>
      </form>
      {mesaj && (
        <p className="basari-metni" role="status">
          {mesaj}
        </p>
      )}
      {hata && <p className="hata-metni">{hata}</p>}
    </section>
  )
}
