// İçerik listesi ve HTML hafta kiti yükleme (Storage "icerik" kovası).

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { IcerikTuru } from '../alan/tipler'
import { bankaIcerikleri, icerikSil, icerikYayini, kitYukle, type BankaIcerigi } from '../depo/yonetimDeposu'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'

const TUR_ADI: Record<IcerikTuru, string> = {
  hafta_kiti: 'Hafta kiti',
  konu_anlatimi: 'Konu anlatımı',
  sunum: 'Sunum',
}

const icerikAdresi = (i: Pick<BankaIcerigi, 'id' | 'veri'>) =>
  i.veri?.bolumler ? `/tahta/konu/${encodeURIComponent(i.id)}` : `/tahta/kit/${encodeURIComponent(i.id)}`

export function Icerikler() {
  const { yardimci } = useKatalog()
  const v = useVeri(bankaIcerikleri, [])
  const [hata, setHata] = useState<string | null>(null)

  if (!yardimci) return <p className="soluk">Yükleniyor.</p>
  const uniteAdi = (id: string | null) => {
    const u = id ? yardimci.unite(id) : undefined
    if (!u) return 'Ünitesiz'
    const s = yardimci.katalog.seviyeler.find((x) => x.id === u.seviye_id)
    return `${s?.ad ?? ''}, ${u.no}. ${u.ad}`
  }

  const islem = async (is: () => Promise<void>) => {
    setHata(null)
    try {
      await is()
      v.yenile()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="panel-dikey">
      <KitYukleme yuklendi={v.yenile} />
      <section className="kart">
        <h2>İçerikler {v.veri ? `(${v.veri.length})` : ''}</h2>
        {v.hata && <p className="hata-metni">İçerikler alınamadı: {v.hata.message}</p>}
        {hata && <p className="hata-metni">{hata}</p>}
        <div className="tablo-kaydir">
          <table className="tablo">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Tür</th>
                <th>Ünite</th>
                <th>Hafta</th>
                <th>Yayında</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {v.veri?.map((i) => (
                <tr key={i.id} className={i.yayinda ? '' : 'pasif'}>
                  <td>
                    {i.ornek && <span className="rozet ornek">ÖRNEK</span>} {i.baslik}
                  </td>
                  <td>{TUR_ADI[i.tur]}</td>
                  <td>{uniteAdi(i.unite_id)}</td>
                  <td>{i.hafta ?? ''}</td>
                  <td>
                    <input
                      type="checkbox"
                      aria-label="Yayında"
                      checked={i.yayinda}
                      onChange={(e) => void islem(() => icerikYayini(i.id, e.target.checked))}
                    />
                  </td>
                  <td className="satir-islemleri">
                    <Link to={icerikAdresi(i)} className="dugme sade kucuk">
                      Aç
                    </Link>
                    {!i.ornek && (
                      <button
                        type="button"
                        className="dugme sade kucuk"
                        onClick={() => confirm(`"${i.baslik}" silinsin mi?`) && void islem(() => icerikSil(i))}
                      >
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function KitYukleme({ yuklendi }: { yuklendi: () => void }) {
  const { yardimci } = useKatalog()
  const [dosya, setDosya] = useState<File | null>(null)
  const [baslik, setBaslik] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [tur, setTur] = useState<IcerikTuru>('hafta_kiti')
  const [seviyeId, setSeviyeId] = useState('')
  const [uniteId, setUniteId] = useState('')
  const [hafta, setHafta] = useState('')
  const [kazanimlar, setKazanimlar] = useState<string[]>([])
  const [yayinda, setYayinda] = useState(false)
  const [durum, setDurum] = useState<{ hata?: string; mesaj?: string; bekliyor?: boolean }>({})
  const [formAnahtari, setFormAnahtari] = useState(0)

  if (!yardimci) return null
  const seviye = yardimci.katalog.seviyeler.find((s) => s.id === seviyeId)

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    if (!dosya || !seviye) return
    setDurum({ bekliyor: true })
    try {
      await kitYukle(dosya, {
        tur,
        baslik,
        aciklama: aciklama || null,
        unite_id: uniteId,
        seviye_kodu: seviye.kod,
        hafta: hafta ? Number(hafta) : null,
        kazanim_idleri: kazanimlar,
        yayinda,
      })
      setDurum({ mesaj: `"${baslik}" yüklendi.` })
      setDosya(null)
      setBaslik('')
      setAciklama('')
      setKazanimlar([])
      setFormAnahtari((n) => n + 1)
      yuklendi()
    } catch (err) {
      setDurum({ hata: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <section className="kart">
      <h2>HTML kit yükle</h2>
      <form key={formAnahtari} className="form-dikey" onSubmit={(e) => void gonder(e)}>
        <label>
          HTML dosyası
          <input
            type="file"
            accept=".html,.htm,text/html"
            required
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setDosya(f)
              if (f && !baslik) setBaslik(f.name.replace(/\.html?$/i, '').replace(/[-_]+/g, ' '))
            }}
          />
        </label>
        <div className="form-izgara">
          <label>
            Başlık
            <input required value={baslik} onChange={(e) => setBaslik(e.target.value)} />
          </label>
          <label>
            Tür
            <select value={tur} onChange={(e) => setTur(e.target.value as IcerikTuru)}>
              <option value="hafta_kiti">Hafta kiti</option>
              <option value="sunum">Sunum</option>
              <option value="konu_anlatimi">Konu anlatımı</option>
            </select>
          </label>
          <label>
            Sınıf
            <select
              required
              value={seviyeId}
              onChange={(e) => {
                setSeviyeId(e.target.value)
                setUniteId('')
                setKazanimlar([])
              }}
            >
              <option value="">Seçin</option>
              {yardimci.katalog.seviyeler.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ünite
            <select
              required
              disabled={!seviyeId}
              value={uniteId}
              onChange={(e) => {
                setUniteId(e.target.value)
                setKazanimlar([])
              }}
            >
              <option value="">Seçin</option>
              {seviyeId &&
                yardimci.seviyeninUniteleri(seviyeId).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.no}. {u.ad}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Hafta (isteğe bağlı)
            <input type="number" min={1} max={40} value={hafta} onChange={(e) => setHafta(e.target.value)} />
          </label>
        </div>
        <label>
          Kısa açıklama
          <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        </label>
        {uniteId && (
          <fieldset className="kazanim-secimi">
            <legend>Kazanımlar</legend>
            {yardimci.uniteninKazanimlari(uniteId).map((k) => (
              <label key={k.id} className="kazanim-satiri">
                <input
                  type="checkbox"
                  checked={kazanimlar.includes(k.id)}
                  onChange={(e) => setKazanimlar((o) => (e.target.checked ? [...o, k.id] : o.filter((x) => x !== k.id)))}
                />
                <span>
                  <strong>{k.kod}</strong> {k.metin}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <label className="anahtar-satiri">
          <input type="checkbox" checked={yayinda} onChange={(e) => setYayinda(e.target.checked)} /> Hemen yayına al
        </label>
        <p className="soluk kucuk">
          Kit, öğretmenin tahtasında yalıtılmış bir çerçevede açılır; dış bağlantı ve form gönderimi çalışmaz. En çok 25 MB.
        </p>
        <button type="submit" className="dugme ana" disabled={durum.bekliyor || !dosya}>
          Yükle
        </button>
        {durum.mesaj && (
          <p className="basari-metni" role="status">
            {durum.mesaj}
          </p>
        )}
        {durum.hata && <p className="hata-metni">{durum.hata}</p>}
      </form>
    </section>
  )
}
