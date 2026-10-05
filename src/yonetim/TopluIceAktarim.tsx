// Toplu içe aktarım: JSON dosyasını tarayıcıda doğrular, önizletir, tek işlemde sunucuya yazar.
// Biçim: docs/ICE_AKTARIM.md

import { useState } from 'react'
import { iceAktarimDogrula, type DogrulamaSonucu, type IceAktarimDosyasi } from '../alan/iceAktarim'
import { SORU_TURU_ADI } from '../alan/etiketler'
import { topluIceAktar, type AktarimSonucu } from '../depo/yonetimDeposu'
import { useKatalog } from '../katalogBaglami'

const metin = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function TopluIceAktarim() {
  const { yardimci, yenile } = useKatalog()
  const [dosyaAdi, setDosyaAdi] = useState<string | null>(null)
  const [veri, setVeri] = useState<IceAktarimDosyasi | null>(null)
  const [denetim, setDenetim] = useState<DogrulamaSonucu | null>(null)
  const [okumaHatasi, setOkumaHatasi] = useState<string | null>(null)
  const [sonuc, setSonuc] = useState<AktarimSonucu | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)

  const oku = async (f: File | undefined) => {
    setVeri(null)
    setDenetim(null)
    setSonuc(null)
    setHata(null)
    setOkumaHatasi(null)
    if (!f) return
    setDosyaAdi(f.name)
    try {
      const j: unknown = JSON.parse((await f.text()).replace(/^\uFEFF/, ''))
      const bilinen = new Set(yardimci?.katalog.kazanimlar.map((k) => k.kod) ?? [])
      setDenetim(iceAktarimDogrula(j, bilinen))
      setVeri(j as IceAktarimDosyasi)
    } catch (e) {
      setOkumaHatasi(`Dosya JSON olarak okunamadı: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const aktar = async () => {
    if (!veri) return
    setBekliyor(true)
    setHata(null)
    try {
      setSonuc(await topluIceAktar(veri))
      yenile()
    } catch (e) {
      setHata(`${e instanceof Error ? e.message : String(e)} Hiçbir kayıt yazılmadı.`)
    } finally {
      setBekliyor(false)
    }
  }

  return (
    <div className="panel-dikey">
      <section className="kart">
        <h2>Toplu içe aktarım</h2>
        <p>
          Soru, konu anlatımı ve kazanım kataloğunu tek bir JSON dosyasıyla yükleyin. Aynı <code>dis_kimlik</code> ile tekrar yüklenen
          kayıt kopyalanmaz, güncellenir. Dosyada tek bir hata varsa hiçbir kayıt yazılmaz.
        </p>
        <p className="soluk kucuk">Dosya biçimi ve örnekler: depodaki docs/ICE_AKTARIM.md belgesi.</p>
        <label className="dosya-alani">
          JSON dosyası seçin
          <input type="file" accept=".json,application/json" onChange={(e) => void oku(e.target.files?.[0])} />
        </label>
        {okumaHatasi && <p className="hata-metni">{okumaHatasi}</p>}
      </section>

      {denetim && veri && (
        <section className="kart" aria-label="Doğrulama">
          <h2>{dosyaAdi}</h2>
          {veri.kaynak && <p className="soluk">{veri.kaynak}</p>}
          <p>
            {denetim.ozet.uniteler} ünite, {denetim.ozet.kazanimlar} kazanım, {denetim.ozet.sorular} soru, {denetim.ozet.icerikler} içerik.
          </p>
          {denetim.hatalar.length > 0 && (
            <>
              <h3>Düzeltilmesi gerekenler ({denetim.hatalar.length})</h3>
              <ul className="hata-listesi">
                {denetim.hatalar.slice(0, 100).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
              {denetim.hatalar.length > 100 && <p className="soluk">İlk 100 hata gösteriliyor.</p>}
            </>
          )}
          {denetim.uyarilar.length > 0 && (
            <>
              <h3>Uyarılar</h3>
              <ul className="uyari-listesi">
                {denetim.uyarilar.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          )}
          {denetim.gecerli && (
            <>
              <div className="tablo-kaydir">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>Dış kimlik</th>
                      <th>Tür</th>
                      <th>Soru</th>
                      <th>Kazanım</th>
                      <th>Yayında</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(veri.sorular ?? []).slice(0, 50).map((s) => (
                      <tr key={s.dis_kimlik}>
                        <td>{s.dis_kimlik}</td>
                        <td>{SORU_TURU_ADI[s.tur]}</td>
                        <td className="kisalt">{metin(s.govde).slice(0, 90)}</td>
                        <td>{s.kazanimlar.join(', ')}</td>
                        <td>{s.yayinda === false ? 'Hayır' : 'Evet'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(veri.sorular?.length ?? 0) > 50 && <p className="soluk">İlk 50 soru gösteriliyor.</p>}
              <button type="button" className="dugme ana" disabled={bekliyor || !!sonuc} onClick={() => void aktar()}>
                {bekliyor ? 'Aktarılıyor.' : 'İçe aktar'}
              </button>
            </>
          )}
          {hata && <p className="hata-metni">{hata}</p>}
          {sonuc && (
            <p className="basari-metni" role="status">
              Aktarım tamamlandı: {sonuc.sorular_yeni} yeni soru, {sonuc.sorular_guncellenen} güncellenen soru, {sonuc.icerikler} içerik,{' '}
              {sonuc.kazanimlar} kazanım, {sonuc.uniteler} ünite.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
