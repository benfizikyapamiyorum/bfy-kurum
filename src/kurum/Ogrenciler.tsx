import { useMemo, useState, type FormEvent } from 'react'
import { KULLANICI_ADI_KURALI, kullaniciAdiOner } from '../alan/kullaniciAdi'
import { csvCozumle, metneCevir, ogrenciListesiCozumle, type OgrenciSatiri } from '../alan/ogrenciListesi'
import { trAramaAnahtari } from '../alan/turkce'
import { hesapAc, sinifaEkle, sinifEkle, type HesapSonucu } from '../depo/kurumDeposu'
import { HesapSonuclari } from './HesapSonuclari'
import { KullaniciIslemleri } from './KullaniciIslemleri'
import { useKurumVerisi } from './kurumVerisi'

interface Taslak extends OgrenciSatiri {
  kullanici_adi: string
}

export function Ogrenciler() {
  const { kurum, kullanicilar, siniflar, yenile } = useKurumVerisi()
  const ogrenciler = kullanicilar.filter((k) => k.rol === 'ogrenci')
  const kullanilan = useMemo(
    () => new Set(kullanicilar.map((k) => k.kullanici_adi).filter((x): x is string => !!x)),
    [kullanicilar],
  )

  const [filtreSinif, setFiltreSinif] = useState<string>('')
  const [arama, setArama] = useState('')
  const [sonuclar, setSonuclar] = useState<HesapSonucu[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)
  const [yeniSifre, setYeniSifre] = useState<{ ad: string; sifre: string } | null>(null)

  // Tek öğrenci formu
  const [ad, setAd] = useState('')
  const [kadi, setKadi] = useState('')
  const [kadiElle, setKadiElle] = useState(false)
  const [sinifId, setSinifId] = useState('')
  const oneri = kullaniciAdiOner(ad, kullanilan)

  // Toplu ekleme
  const [taslaklar, setTaslaklar] = useState<Taslak[] | null>(null)
  const [uyarilar, setUyarilar] = useState<string[]>([])

  const sinifAdi = (id: string) => siniflar.find((s) => s.id === id)?.ad ?? ''

  const hesaplariAc = async (liste: { ad_soyad: string; kullanici_adi: string; sifre: string | null; sinif: string | null }[]) => {
    setHata(null)
    setBekliyor(true)
    try {
      const s = await hesapAc(
        kurum.id,
        liste.map((o) => ({ rol: 'ogrenci', ad_soyad: o.ad_soyad, kullanici_adi: o.kullanici_adi, sifre: o.sifre })),
      )
      // Sınıflara yerleştir; olmayan sınıfları aç.
      const sinifMap = new Map(siniflar.map((x) => [trAramaAnahtari(x.ad), x.id]))
      const gruplar = new Map<string, string[]>()
      s.forEach((r, i) => {
        const sinif = liste[i]?.sinif
        if (!r.tamam || !r.id || !sinif) return
        gruplar.set(sinif, [...(gruplar.get(sinif) ?? []), r.id])
      })
      for (const [sinif, idler] of gruplar) {
        let id = sinifMap.get(trAramaAnahtari(sinif)) ?? siniflar.find((x) => x.id === sinif)?.id
        if (!id) {
          id = (await sinifEkle(kurum.id, sinif, null)).id
          sinifMap.set(trAramaAnahtari(sinif), id)
        }
        await sinifaEkle(id, idler)
      }
      setSonuclar(s)
      return s
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
      return null
    } finally {
      setBekliyor(false)
      yenile()
    }
  }

  const tekEkle = async (e: FormEvent) => {
    e.preventDefault()
    const s = await hesaplariAc([{ ad_soyad: ad, kullanici_adi: kadiElle ? kadi : oneri, sifre: null, sinif: sinifId || null }])
    if (s?.every((x) => x.tamam)) {
      setAd('')
      setKadi('')
      setKadiElle(false)
    }
  }

  const dosyaOku = async (dosya: File | undefined) => {
    setHata(null)
    if (!dosya) return
    try {
      let tablo: unknown[][]
      if (/\.xlsx$/i.test(dosya.name)) {
        const { readSheet } = await import('read-excel-file/browser')
        tablo = (await readSheet(dosya)) as unknown[][]
      } else if (/\.(csv|txt)$/i.test(dosya.name)) {
        tablo = csvCozumle(metneCevir(await dosya.arrayBuffer()))
      } else {
        throw new Error('Yalnızca .xlsx ya da .csv dosyası yükleyin. Eski .xls dosyasını Excel’de .xlsx olarak kaydedin.')
      }
      const sonuc = ogrenciListesiCozumle(tablo)
      const yeniKullanilan = new Set(kullanilan)
      setTaslaklar(
        sonuc.ogrenciler.map((o) => {
          const k = o.kullanici_adi && KULLANICI_ADI_KURALI.test(o.kullanici_adi) && !yeniKullanilan.has(o.kullanici_adi)
            ? o.kullanici_adi
            : kullaniciAdiOner(o.ad_soyad, yeniKullanilan)
          yeniKullanilan.add(k)
          return { ...o, kullanici_adi: k }
        }),
      )
      setUyarilar(sonuc.uyarilar)
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    }
  }

  const gorunen = ogrenciler.filter(
    (o) =>
      (!filtreSinif || (filtreSinif === '-' ? o.sinif_idleri.length === 0 : o.sinif_idleri.includes(filtreSinif))) &&
      (!arama || trAramaAnahtari(`${o.ad_soyad} ${o.kullanici_adi}`).includes(trAramaAnahtari(arama))),
  )

  const gecersizTaslak = taslaklar?.some((t) => !KULLANICI_ADI_KURALI.test(t.kullanici_adi)) ?? false

  return (
    <div className="panel-dikey">
      {sonuclar && <HesapSonuclari sonuclar={sonuclar} kapat={() => setSonuclar(null)} />}
      {hata && <p className="hata-metni">{hata}</p>}

      <div className="panel-izgara">
        <section className="kart">
          <h2>Öğrenci ekle</h2>
          <form className="form-dikey" onSubmit={(e) => void tekEkle(e)}>
            <label className="alan">
              Ad soyad
              <input required minLength={2} value={ad} onChange={(e) => setAd(e.target.value)} />
            </label>
            <label className="alan">
              Kullanıcı adı
              <input
                value={kadiElle ? kadi : ad ? oneri : ''}
                pattern="[a-z0-9._\-]{3,40}"
                title="3-40 karakter: küçük harf, rakam, nokta, tire."
                onChange={(e) => {
                  setKadiElle(true)
                  setKadi(e.target.value.toLocaleLowerCase('tr-TR'))
                }}
              />
            </label>
            <label className="alan">
              Sınıf
              <select value={sinifId} onChange={(e) => setSinifId(e.target.value)}>
                <option value="">Sınıf seçilmedi</option>
                {siniflar.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ad}
                  </option>
                ))}
              </select>
            </label>
            <p className="soluk kucuk">Şifre otomatik üretilir ve bir kez gösterilir.</p>
            <button type="submit" className="dugme ana" disabled={bekliyor}>
              Hesap aç
            </button>
          </form>
        </section>

        <section className="kart">
          <h2>Excel ya da CSV ile toplu ekle</h2>
          <p className="soluk">
            İlk satırda <strong>Ad Soyad</strong> ve isterseniz <strong>Sınıf</strong>, <strong>Kullanıcı adı</strong>,{' '}
            <strong>Şifre</strong> başlıkları olsun. Olmayan sınıflar otomatik açılır. E-okul listesinden kopyalanan
            tablolar da olur.
          </p>
          <label className="dosya-alani kucuk">
            <input type="file" accept=".xlsx,.csv,.txt" onChange={(e) => void dosyaOku(e.target.files?.[0])} />
            <strong>Dosya seçin (.xlsx ya da .csv).</strong>
          </label>
        </section>
      </div>

      {taslaklar && (
        <section className="kart">
          <h2>{taslaklar.length} öğrenci eklenecek</h2>
          {uyarilar.length > 0 && (
            <ul className="uyari-listesi">
              {uyarilar.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}
          <table className="tablo">
            <thead>
              <tr>
                <th>Satır</th>
                <th>Ad soyad</th>
                <th>Kullanıcı adı</th>
                <th>Sınıf</th>
              </tr>
            </thead>
            <tbody>
              {taslaklar.map((t, i) => (
                <tr key={t.satir}>
                  <td>{t.satir}</td>
                  <td>{t.ad_soyad}</td>
                  <td>
                    <input
                      className={KULLANICI_ADI_KURALI.test(t.kullanici_adi) ? '' : 'gecersiz'}
                      value={t.kullanici_adi}
                      aria-label={`${t.ad_soyad} kullanıcı adı`}
                      onChange={(e) =>
                        setTaslaklar((x) =>
                          x!.map((y, j) => (j === i ? { ...y, kullanici_adi: e.target.value.toLocaleLowerCase('tr-TR') } : y)),
                        )
                      }
                    />
                  </td>
                  <td>{t.sinif ?? <span className="soluk">Yok</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="secim-grubu">
            <button
              type="button"
              className="dugme ana"
              disabled={bekliyor || gecersizTaslak || taslaklar.length === 0}
              onClick={async () => {
                const s = await hesaplariAc(taslaklar)
                if (s) setTaslaklar(null)
              }}
            >
              {bekliyor ? 'Hesaplar açılıyor.' : `${taslaklar.length} hesabı aç`}
            </button>
            <button type="button" className="dugme sade" onClick={() => setTaslaklar(null)}>
              Vazgeç
            </button>
          </div>
        </section>
      )}

      <section className="kart">
        <div className="kart-ust">
          <h2>Öğrenciler ({ogrenciler.length})</h2>
          <input className="arama" placeholder="Ara" value={arama} onChange={(e) => setArama(e.target.value)} aria-label="Öğrenci ara" />
        </div>
        <div className="cip-satiri" role="group" aria-label="Sınıfa göre süz">
          <button type="button" className={`cip ${filtreSinif === '' ? 'secili' : ''}`} onClick={() => setFiltreSinif('')}>
            Tümü
          </button>
          {siniflar.map((s) => (
            <button key={s.id} type="button" className={`cip ${filtreSinif === s.id ? 'secili' : ''}`} onClick={() => setFiltreSinif(s.id)}>
              {s.ad}
            </button>
          ))}
          <button type="button" className={`cip ${filtreSinif === '-' ? 'secili' : ''}`} onClick={() => setFiltreSinif('-')}>
            Sınıfsız
          </button>
        </div>
        {yeniSifre && (
          <p className="bilgi-kutusu">
            {yeniSifre.ad} için yeni şifre: <strong className="sifre">{yeniSifre.sifre}</strong>
          </p>
        )}
        <table className="tablo">
          <thead>
            <tr>
              <th>Ad soyad</th>
              <th>Kullanıcı adı</th>
              <th>Sınıf</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {gorunen.map((k) => (
              <tr key={k.id} className={k.aktif ? '' : 'pasif'}>
                <td>{k.ad_soyad}</td>
                <td>{k.kullanici_adi}</td>
                <td>{k.sinif_idleri.map(sinifAdi).join(', ')}</td>
                <td>{k.aktif ? 'Aktif' : 'Pasif'}</td>
                <td>
                  <KullaniciIslemleri k={k} onSifre={(s) => setYeniSifre({ ad: k.ad_soyad, sifre: s })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {gorunen.length === 0 && <p className="soluk">Öğrenci yok.</p>}
      </section>
    </div>
  )
}
