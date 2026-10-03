// Tek dosyalık HTML kitleri içe aktarma. M1'de kitler bu tarayıcıya (IndexedDB) kaydedilir;
// M5'te süper admin için Supabase Storage'a yükleme ve JSON ile toplu içe aktarım eklenecek.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { IcerikTuru } from '../alan/tipler'
import { trSayi } from '../alan/turkce'
import { Simge } from '../bilesenler/Simge'
import { yerelKitEkle, yerelKitler, yerelKitSil } from '../depo/depo'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { haftaTahmini, kitBasligi } from '../tahta/kitHtml'

const AZAMI_BOYUT = 25 * 1024 * 1024

interface Taslak {
  anahtar: string
  dosyaAdi: string
  html: string
  boyut: number
  baslik: string
  seviyeId: string
  uniteId: string
  hafta: string
  tur: IcerikTuru
  kazanimIdleri: string[]
}

export function IceAktar() {
  const { yardimci } = useKatalog()
  const [taslaklar, setTaslaklar] = useState<Taslak[]>([])
  const [mesaj, setMesaj] = useState<string | null>(null)
  const kayitlilar = useVeri(yerelKitler, [])

  if (!yardimci) return <div className="sayfa">Yükleniyor.</div>

  const ilkSeviye = yardimci.katalog.seviyeler.find((s) => yardimci.seviyeninUniteleri(s.id).length > 0)

  const dosyalariOku = async (dosyalar: FileList | null) => {
    if (!dosyalar) return
    const yeni: Taslak[] = []
    const reddedilen: string[] = []
    for (const d of Array.from(dosyalar)) {
      if (!/\.html?$/i.test(d.name) || d.size > AZAMI_BOYUT) {
        reddedilen.push(d.name)
        continue
      }
      const html = await d.text()
      const seviyeId = ilkSeviye?.id ?? ''
      yeni.push({
        anahtar: crypto.randomUUID(),
        dosyaAdi: d.name,
        html,
        boyut: d.size,
        baslik: kitBasligi(html) ?? d.name.replace(/\.html?$/i, ''),
        seviyeId,
        uniteId: yardimci.seviyeninUniteleri(seviyeId)[0]?.id ?? '',
        hafta: haftaTahmini(d.name),
        tur: 'hafta_kiti',
        kazanimIdleri: [],
      })
    }
    setTaslaklar((t) => [...t, ...yeni])
    setMesaj(
      reddedilen.length
        ? `Şu dosyalar alınmadı (yalnızca 25 MB'tan küçük .html dosyaları): ${reddedilen.join(', ')}.`
        : null,
    )
  }

  const guncelle = (anahtar: string, d: Partial<Taslak>) =>
    setTaslaklar((t) => t.map((x) => (x.anahtar === anahtar ? { ...x, ...d } : x)))

  const kaydet = async () => {
    for (const t of taslaklar) {
      const hafta = Number.parseInt(t.hafta, 10)
      await yerelKitEkle(
        {
          tur: t.tur,
          baslik: t.baslik.trim() || t.dosyaAdi,
          aciklama: null,
          unite_id: t.uniteId || null,
          hafta: Number.isFinite(hafta) && hafta > 0 ? hafta : null,
          sira: 0,
          html_yolu: null,
          meb_baglanti: null,
          ornek: false,
          kazanim_idleri: t.kazanimIdleri,
        },
        t.html,
      )
    }
    setMesaj(`${taslaklar.length} kit kaydedildi. Tahta modunda ilgili ünitede görünür.`)
    setTaslaklar([])
    kayitlilar.yenile()
  }

  return (
    <div className="sayfa ice-aktar">
      <h1>HTML kit içe aktar</h1>
      <p className="soluk">
        Tek dosyalık HTML kitlerinizi seçin. Her kiti bir sınıfa, üniteye ve haftaya bağlayın. Kitler şimdilik yalnızca bu
        tarayıcıya kaydedilir ve internet olmadan da açılır.
      </p>

      <label className="dosya-alani">
        <input type="file" accept=".html,.htm,text/html" multiple onChange={(e) => void dosyalariOku(e.target.files)} />
        <Simge ad="yukle" boyut={36} />
        <span>
          <strong>HTML dosyalarını seçin.</strong> Birden fazla dosya seçebilirsiniz.
        </span>
      </label>

      {mesaj && (
        <p className="bilgi-kutusu" role="status">
          {mesaj}
        </p>
      )}

      {taslaklar.length > 0 && (
        <section className="taslaklar">
          {taslaklar.map((t) => {
            const uniteler = yardimci.seviyeninUniteleri(t.seviyeId)
            const kazanimlar = yardimci.uniteninKazanimlari(t.uniteId)
            return (
              <article key={t.anahtar} className="kart taslak">
                <div className="taslak-ust">
                  <strong>{t.dosyaAdi}</strong>
                  <span className="soluk">{trSayi(Math.max(1, t.boyut / 1024), 0)} KB</span>
                  <button
                    type="button"
                    className="dugme sade"
                    onClick={() => setTaslaklar((x) => x.filter((y) => y.anahtar !== t.anahtar))}
                    aria-label="Listeden çıkar"
                  >
                    <Simge ad="kapat" />
                  </button>
                </div>
                <div className="form-izgara">
                  <label>
                    Başlık
                    <input value={t.baslik} onChange={(e) => guncelle(t.anahtar, { baslik: e.target.value })} />
                  </label>
                  <label>
                    Sınıf
                    <select
                      value={t.seviyeId}
                      onChange={(e) =>
                        guncelle(t.anahtar, {
                          seviyeId: e.target.value,
                          uniteId: yardimci.seviyeninUniteleri(e.target.value)[0]?.id ?? '',
                          kazanimIdleri: [],
                        })
                      }
                    >
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
                      value={t.uniteId}
                      onChange={(e) => guncelle(t.anahtar, { uniteId: e.target.value, kazanimIdleri: [] })}
                    >
                      {uniteler.length === 0 && <option value="">Bu sınıfta ünite yok</option>}
                      {uniteler.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.no}. {u.ad}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hafta
                    <input
                      inputMode="numeric"
                      value={t.hafta}
                      onChange={(e) => guncelle(t.anahtar, { hafta: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    />
                  </label>
                  <label>
                    Tür
                    <select value={t.tur} onChange={(e) => guncelle(t.anahtar, { tur: e.target.value as IcerikTuru })}>
                      <option value="hafta_kiti">Hafta kiti</option>
                      <option value="konu_anlatimi">Konu anlatımı</option>
                      <option value="sunum">Sunum</option>
                    </select>
                  </label>
                </div>
                {kazanimlar.length > 0 && (
                  <fieldset className="kazanim-secimi">
                    <legend>Öğrenme çıktıları</legend>
                    {kazanimlar.map((k) => (
                      <label key={k.id} className="kazanim-cipi">
                        <input
                          type="checkbox"
                          checked={t.kazanimIdleri.includes(k.id)}
                          onChange={(e) =>
                            guncelle(t.anahtar, {
                              kazanimIdleri: e.target.checked
                                ? [...t.kazanimIdleri, k.id]
                                : t.kazanimIdleri.filter((x) => x !== k.id),
                            })
                          }
                        />
                        <span title={k.metin}>{k.kod}</span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </article>
            )
          })}
          <button type="button" className="dugme ana buyuk" onClick={() => void kaydet()}>
            {taslaklar.length} kiti kaydet
          </button>
        </section>
      )}

      <section className="kayitli-kitler">
        <h2>Bu tarayıcıdaki kitler</h2>
        {kayitlilar.veri?.length === 0 && <p className="soluk">Henüz içe aktarılmış kit yok.</p>}
        <ul>
          {kayitlilar.veri?.map((k) => {
            const u = k.icerik.unite_id ? yardimci.unite(k.icerik.unite_id) : undefined
            const s = u ? yardimci.katalog.seviyeler.find((x) => x.id === u.seviye_id) : undefined
            return (
              <li key={k.icerik.id} className="kayitli-kit">
                <span>
                  <strong>{k.icerik.baslik}</strong>
                  <span className="soluk">
                    {' '}
                    {s?.ad}, {u ? `${u.no}. ünite` : 'ünitesiz'}
                    {k.icerik.hafta ? `, ${k.icerik.hafta}. hafta` : ''}, {trSayi(Math.max(1, k.boyut / 1024), 0)} KB
                  </span>
                </span>
                <span className="bosluk" />
                <Link className="dugme" to={`/tahta/kit/${encodeURIComponent(k.icerik.id)}`}>
                  Tahtada aç
                </Link>
                <button
                  type="button"
                  className="dugme sade"
                  onClick={async () => {
                    await yerelKitSil(k.icerik.id)
                    kayitlilar.yenile()
                  }}
                >
                  Sil
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
