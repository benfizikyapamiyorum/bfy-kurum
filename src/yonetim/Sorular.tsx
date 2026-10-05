// Merkezî soru bankası: süzme, yayına alma, düzenleme.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SORU_TURU_ADI } from '../alan/etiketler'
import { trAramaAnahtari } from '../alan/turkce'
import type { SoruTuru } from '../alan/tipler'
import { OrnekRozeti, ZorlukGostergesi } from '../bilesenler/Rozetler'
import { bankaSorulari, soruYayini } from '../depo/yonetimDeposu'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'

const metneCevir = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function Sorular() {
  const { yardimci } = useKatalog()
  const v = useVeri(bankaSorulari, [])
  const [seviyeId, setSeviyeId] = useState('')
  const [uniteId, setUniteId] = useState('')
  const [tur, setTur] = useState<SoruTuru | ''>('')
  const [durum, setDurum] = useState<'' | 'yayinda' | 'kapali'>('')
  const [arama, setArama] = useState('')
  const [hata, setHata] = useState<string | null>(null)

  const sorular = useMemo(() => {
    if (!v.veri || !yardimci) return []
    const kazanimlar = uniteId
      ? new Set(yardimci.uniteninKazanimlari(uniteId).map((k) => k.id))
      : seviyeId
        ? new Set(yardimci.seviyeninUniteleri(seviyeId).flatMap((u) => yardimci.uniteninKazanimlari(u.id).map((k) => k.id)))
        : null
    return v.veri.filter(
      (s) =>
        (!kazanimlar || s.kazanim_idleri.some((k) => kazanimlar.has(k))) &&
        (!tur || s.tur === tur) &&
        (!durum || s.yayinda === (durum === 'yayinda')) &&
        (!arama.trim() || trAramaAnahtari(metneCevir(s.govde) + ' ' + (s.dis_kimlik ?? '')).includes(trAramaAnahtari(arama))),
    )
  }, [v.veri, yardimci, seviyeId, uniteId, tur, durum, arama])

  if (!yardimci) return <p className="soluk">Yükleniyor.</p>
  const kodlar = (ids: string[]) => ids.map((i) => yardimci.kazanim(i)?.kod ?? '?').join(', ')

  const yayinDegistir = async (id: string, yayinda: boolean) => {
    setHata(null)
    try {
      await soruYayini(id, yayinda)
      v.yenile()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <section className="kart">
      <div className="kart-ust">
        <h2>Soru bankası {v.veri ? `(${sorular.length} / ${v.veri.length})` : ''}</h2>
        <Link to="/yonetim/sorular/yeni" className="dugme ana">
          Yeni soru
        </Link>
      </div>
      <div className="suzgecler">
        <label>
          Sınıf
          <select
            value={seviyeId}
            onChange={(e) => {
              setSeviyeId(e.target.value)
              setUniteId('')
            }}
          >
            <option value="">Tümü</option>
            {yardimci.katalog.seviyeler.map((s) => (
              <option key={s.id} value={s.id}>
                {s.ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ünite
          <select value={uniteId} disabled={!seviyeId} onChange={(e) => setUniteId(e.target.value)}>
            <option value="">Tümü</option>
            {seviyeId &&
              yardimci.seviyeninUniteleri(seviyeId).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.no}. {u.ad}
                </option>
              ))}
          </select>
        </label>
        <label>
          Tür
          <select value={tur} onChange={(e) => setTur(e.target.value as SoruTuru | '')}>
            <option value="">Tümü</option>
            {Object.entries(SORU_TURU_ADI).map(([k, ad]) => (
              <option key={k} value={k}>
                {ad}
              </option>
            ))}
          </select>
        </label>
        <label>
          Durum
          <select value={durum} onChange={(e) => setDurum(e.target.value as typeof durum)}>
            <option value="">Tümü</option>
            <option value="yayinda">Yayında</option>
            <option value="kapali">Yayında değil</option>
          </select>
        </label>
        <label>
          Ara
          <input type="search" value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Soru metni ya da dış kimlik" />
        </label>
      </div>
      {v.hata && <p className="hata-metni">Sorular alınamadı: {v.hata.message}</p>}
      {hata && <p className="hata-metni">{hata}</p>}
      <div className="tablo-kaydir">
        <table className="tablo">
          <thead>
            <tr>
              <th>Soru</th>
              <th>Kazanım</th>
              <th>Tür</th>
              <th>Zorluk</th>
              <th>Yayında</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorular.map((s) => (
              <tr key={s.id} className={s.yayinda ? '' : 'pasif'}>
                <td className="kisalt" title={metneCevir(s.govde)}>
                  {s.ornek && <OrnekRozeti />} {metneCevir(s.govde).slice(0, 110)}
                </td>
                <td>{kodlar(s.kazanim_idleri)}</td>
                <td>{SORU_TURU_ADI[s.tur]}</td>
                <td>
                  <ZorlukGostergesi zorluk={s.zorluk} />
                </td>
                <td>
                  <input
                    type="checkbox"
                    aria-label="Yayında"
                    checked={s.yayinda}
                    onChange={(e) => void yayinDegistir(s.id, e.target.checked)}
                  />
                </td>
                <td>
                  <Link to={`/yonetim/sorular/${s.id}`} className="dugme sade kucuk">
                    Düzenle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {v.veri && sorular.length === 0 && <p className="soluk">Süzgeçlere uyan soru yok.</p>}
    </section>
  )
}
