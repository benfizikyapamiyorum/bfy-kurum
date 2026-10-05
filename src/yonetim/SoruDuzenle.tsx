// Tek soru düzenleme: tüm alanlar, şık gerekçeleri, çözüm adımları, kazanım etiketleri, canlı önizleme.

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SORU_TURU_ADI, ZORLUK_ADI } from '../alan/etiketler'
import { SECENEK_HARFLERI, type Secenek, type SoruTuru } from '../alan/tipler'
import { ZenginMetin } from '../bilesenler/ZenginMetin'
import { sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { soruTaslagiDenetle } from '../alan/soruDenetimi'
import { bankaSorusu, soruKaydet, soruSil, type SoruTaslagi } from '../depo/yonetimDeposu'
import { useKatalog } from '../katalogBaglami'

const bosSecenekler = (): Secenek[] => SECENEK_HARFLERI.map((harf) => ({ harf, metin: '' }))

const BOS: SoruTaslagi = {
  tur: 'coktan_secmeli',
  govde: '',
  sekil_svg: null,
  secenekler: bosSecenekler(),
  dogru_cevap: 'A',
  cozum_adimlari: [{ metin: '' }],
  zorluk: 3,
  baglam_temelli: false,
  kaynak_notu: null,
  beceri: null,
  kavram_yanilgisi: null,
  puanlama_olcutu: null,
  ornek: false,
  yayinda: false,
  kazanim_idleri: [],
}

const bosuNulle = (s: string | null) => (s && s.trim() ? s.trim() : null)

export function SoruDuzenle() {
  const { id } = useParams()
  const yeni = !id || id === 'yeni'
  const git = useNavigate()
  const { yardimci } = useKatalog()
  const [t, setT] = useState<SoruTaslagi>(BOS)
  const [disKimlik, setDisKimlik] = useState<string | null>(null)
  const [yuklendi, setYuklendi] = useState(yeni)
  const [seviyeId, setSeviyeId] = useState('')
  const [hatalar, setHatalar] = useState<string[]>([])
  const [mesaj, setMesaj] = useState<string | null>(null)

  useEffect(() => {
    if (yeni) return
    void bankaSorusu(id!).then(
      (s) => {
        if (!s) {
          setHatalar(['Soru bulunamadı.'])
        } else {
          const { id: _i, dis_kimlik, kazanim_idleri, ...a } = s
          void _i
          setDisKimlik(dis_kimlik)
          setT({
            ...BOS,
            ...a,
            secenekler: a.secenekler ?? (a.tur === 'coktan_secmeli' ? bosSecenekler() : null),
            cozum_adimlari: a.cozum_adimlari.length ? a.cozum_adimlari : [{ metin: '' }],
            beceri: a.beceri ?? null,
            kavram_yanilgisi: a.kavram_yanilgisi ?? null,
            puanlama_olcutu: a.puanlama_olcutu ?? null,
            kazanim_idleri,
          })
        }
        setYuklendi(true)
      },
      (e: unknown) => {
        setHatalar([e instanceof Error ? e.message : String(e)])
        setYuklendi(true)
      },
    )
  }, [id, yeni])

  if (!yardimci || !yuklendi) return <p className="soluk">Yükleniyor.</p>

  const degis = <K extends keyof SoruTaslagi>(k: K, d: SoruTaslagi[K]) => setT((o) => ({ ...o, [k]: d }))
  const secenekDegis = (i: number, d: Partial<Secenek>) =>
    degis(
      'secenekler',
      (t.secenekler ?? bosSecenekler()).map((s, j) => (j === i ? { ...s, ...d } : s)),
    )
  const turDegis = (tur: SoruTuru) =>
    setT((o) => ({
      ...o,
      tur,
      secenekler: tur === 'coktan_secmeli' ? (o.secenekler ?? bosSecenekler()) : null,
      dogru_cevap: tur === 'coktan_secmeli' ? 'A' : tur === 'dogru_yanlis' ? 'D' : '',
    }))
  const kazanimDegis = (k: string, secili: boolean) =>
    degis('kazanim_idleri', secili ? [...t.kazanim_idleri, k] : t.kazanim_idleri.filter((x) => x !== k))

  const kaydet = async (e: FormEvent) => {
    e.preventDefault()
    setMesaj(null)
    const temiz: SoruTaslagi = {
      ...t,
      govde: t.govde.trim(),
      sekil_svg: bosuNulle(t.sekil_svg),
      secenekler:
        t.tur === 'coktan_secmeli'
          ? t.secenekler!.map((s) => (s.gerekce?.trim() && s.harf !== t.dogru_cevap ? { harf: s.harf, metin: s.metin.trim(), gerekce: s.gerekce.trim() } : { harf: s.harf, metin: s.metin.trim() }))
          : null,
      dogru_cevap: t.dogru_cevap.trim(),
      cozum_adimlari: t.cozum_adimlari.map((a) => ({ metin: a.metin.trim() })).filter((a) => a.metin),
      kaynak_notu: bosuNulle(t.kaynak_notu),
      beceri: bosuNulle(t.beceri),
      kavram_yanilgisi: bosuNulle(t.kavram_yanilgisi),
      puanlama_olcutu: bosuNulle(t.puanlama_olcutu),
    }
    const h = soruTaslagiDenetle(temiz)
    setHatalar(h)
    if (h.length) return
    try {
      const yeniId = await soruKaydet(yeni ? null : id!, temiz)
      setMesaj('Soru kaydedildi.')
      if (yeni) void git(`/yonetim/sorular/${yeniId}`, { replace: true })
    } catch (err) {
      setHatalar([err instanceof Error ? err.message : String(err)])
    }
  }

  const sil = async () => {
    if (!confirm('Soru kalıcı olarak silinsin mi?')) return
    try {
      await soruSil(id!)
      void git('/yonetim/sorular')
    } catch (err) {
      setHatalar([err instanceof Error ? err.message : String(err)])
    }
  }

  const seviyeler = yardimci.katalog.seviyeler
  const etiketliUniteler = new Set(t.kazanim_idleri.map((k) => yardimci.kazanim(k)?.unite_id))
  const gosterilenSeviye = seviyeId || (yardimci.unite([...etiketliUniteler][0] ?? '')?.seviye_id ?? seviyeler[0]?.id ?? '')
  const temizSekil = t.sekil_svg ? sekilSvgTemizle(t.sekil_svg) : ''

  return (
    <div className="soru-duzenleyici">
      <form className="kart form-dikey" onSubmit={(e) => void kaydet(e)}>
        <div className="kart-ust">
          <h2>{yeni ? 'Yeni soru' : 'Soruyu düzenle'}</h2>
          <Link to="/yonetim/sorular" className="dugme sade">
            Listeye dön
          </Link>
        </div>
        {disKimlik && <p className="soluk kucuk">Dış kimlik: {disKimlik}. Aynı dosya yeniden içe aktarılırsa bu sorunun üzerine yazılır.</p>}

        <div className="form-izgara">
          <label>
            Tür
            <select value={t.tur} onChange={(e) => turDegis(e.target.value as SoruTuru)}>
              {Object.entries(SORU_TURU_ADI).map(([k, ad]) => (
                <option key={k} value={k}>
                  {ad}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zorluk
            <select value={t.zorluk} onChange={(e) => degis('zorluk', Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((z) => (
                <option key={z} value={z}>
                  {z}, {ZORLUK_ADI[z]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ölçülen beceri
            <input value={t.beceri ?? ''} onChange={(e) => degis('beceri', e.target.value)} placeholder="Ör. Veriden çıkarım" />
          </label>
        </div>
        <div className="secim-grubu">
          <label>
            <input type="checkbox" checked={t.baglam_temelli} onChange={(e) => degis('baglam_temelli', e.target.checked)} /> Bağlam temelli
          </label>
          <label>
            <input type="checkbox" checked={t.yayinda} onChange={(e) => degis('yayinda', e.target.checked)} /> Yayında
          </label>
          <label>
            <input type="checkbox" checked={t.ornek} onChange={(e) => degis('ornek', e.target.checked)} /> Örnek (giriş yapmadan görünür)
          </label>
        </div>

        <label>
          Soru metni (HTML, KaTeX için $...$)
          <textarea required rows={5} value={t.govde} onChange={(e) => degis('govde', e.target.value)} />
        </label>
        <label>
          Şekil (SVG kodu, isteğe bağlı)
          <textarea rows={4} className="kod" value={t.sekil_svg ?? ''} onChange={(e) => degis('sekil_svg', e.target.value)} />
        </label>

        {t.tur === 'coktan_secmeli' && (
          <fieldset className="secenek-duzenleme">
            <legend>Seçenekler ve doğru cevap</legend>
            {(t.secenekler ?? bosSecenekler()).map((s, i) => (
              <div key={s.harf} className="secenek-satiri">
                <label className="dogru-secimi">
                  <input type="radio" name="dogru" checked={t.dogru_cevap === s.harf} onChange={() => degis('dogru_cevap', s.harf)} />
                  <span>{s.harf}</span>
                </label>
                <input aria-label={`${s.harf} seçeneği`} value={s.metin} onChange={(e) => secenekDegis(i, { metin: e.target.value })} />
                {t.dogru_cevap !== s.harf && (
                  <input
                    aria-label={`${s.harf} neden yanlış`}
                    placeholder={`Neden ${s.harf} değil? (isteğe bağlı)`}
                    value={s.gerekce ?? ''}
                    onChange={(e) => secenekDegis(i, { gerekce: e.target.value })}
                  />
                )}
              </div>
            ))}
          </fieldset>
        )}
        {t.tur === 'dogru_yanlis' && (
          <div className="secim-grubu" role="radiogroup" aria-label="Doğru cevap">
            <label>
              <input type="radio" checked={t.dogru_cevap === 'D'} onChange={() => degis('dogru_cevap', 'D')} /> Doğru
            </label>
            <label>
              <input type="radio" checked={t.dogru_cevap === 'Y'} onChange={() => degis('dogru_cevap', 'Y')} /> Yanlış
            </label>
          </div>
        )}
        {t.tur === 'acik_uclu' && (
          <label>
            Beklenen cevap
            <input value={t.dogru_cevap} onChange={(e) => degis('dogru_cevap', e.target.value)} />
          </label>
        )}

        <fieldset>
          <legend>Çözüm adımları (tahtada tek tek açılır)</legend>
          {t.cozum_adimlari.map((a, i) => (
            <div key={i} className="adim-satiri">
              <span className="coz-no">{i + 1}</span>
              <textarea
                aria-label={`${i + 1}. adım`}
                rows={2}
                value={a.metin}
                onChange={(e) => degis('cozum_adimlari', t.cozum_adimlari.map((x, j) => (j === i ? { metin: e.target.value } : x)))}
              />
              <button
                type="button"
                className="dugme sade kucuk"
                aria-label={`${i + 1}. adımı sil`}
                disabled={t.cozum_adimlari.length === 1}
                onClick={() => degis('cozum_adimlari', t.cozum_adimlari.filter((_, j) => j !== i))}
              >
                Sil
              </button>
            </div>
          ))}
          <button type="button" className="dugme sade kucuk" onClick={() => degis('cozum_adimlari', [...t.cozum_adimlari, { metin: '' }])}>
            Adım ekle
          </button>
        </fieldset>

        <label>
          Yokladığı kavram yanılgısı (yalnızca öğretmen görür)
          <textarea rows={2} value={t.kavram_yanilgisi ?? ''} onChange={(e) => degis('kavram_yanilgisi', e.target.value)} />
        </label>
        <label>
          Puanlama ölçütü
          <textarea rows={2} value={t.puanlama_olcutu ?? ''} onChange={(e) => degis('puanlama_olcutu', e.target.value)} />
        </label>
        <label>
          Kaynak notu (iç kullanım)
          <input value={t.kaynak_notu ?? ''} onChange={(e) => degis('kaynak_notu', e.target.value)} />
        </label>

        <fieldset className="kazanim-secimi">
          <legend>Kazanımlar ({t.kazanim_idleri.length} seçili)</legend>
          <label>
            Sınıf
            <select value={gosterilenSeviye} onChange={(e) => setSeviyeId(e.target.value)}>
              {seviyeler.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.ad}
                </option>
              ))}
            </select>
          </label>
          {yardimci.seviyeninUniteleri(gosterilenSeviye).map((u) => (
            <div key={u.id}>
              <strong>
                {u.no}. {u.ad}
              </strong>
              {yardimci.uniteninKazanimlari(u.id).map((k) => (
                <label key={k.id} className="kazanim-satiri">
                  <input type="checkbox" checked={t.kazanim_idleri.includes(k.id)} onChange={(e) => kazanimDegis(k.id, e.target.checked)} />
                  <span>
                    <strong>{k.kod}</strong> {k.metin}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </fieldset>

        {hatalar.length > 0 && (
          <ul className="hata-listesi" role="alert">
            {hatalar.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {mesaj && (
          <p className="basari-metni" role="status">
            {mesaj}
          </p>
        )}
        <div className="satir-islemleri">
          <button type="submit" className="dugme ana">
            Kaydet
          </button>
          {!yeni && (
            <button type="button" className="dugme sade" onClick={() => void sil()}>
              Soruyu sil
            </button>
          )}
        </div>
      </form>

      <aside className="kart soru-onizleme" aria-label="Önizleme">
        <h2>Önizleme</h2>
        <ZenginMetin metin={t.govde || '<p class="soluk">Soru metni.</p>'} />
        {temizSekil && <div className="sekil-onizleme" dangerouslySetInnerHTML={{ __html: temizSekil }} />}
        {t.tur === 'coktan_secmeli' && (
          <ol className="onizleme-secenekler">
            {(t.secenekler ?? []).map((s) => (
              <li key={s.harf} className={s.harf === t.dogru_cevap ? 'dogru' : ''}>
                <strong>{s.harf})</strong> <ZenginMetin metin={s.metin} etiket="span" />
              </li>
            ))}
          </ol>
        )}
        <h3>Çözüm</h3>
        <ol>
          {t.cozum_adimlari
            .filter((a) => a.metin.trim())
            .map((a, i) => (
              <li key={i}>
                <ZenginMetin metin={a.metin} />
              </li>
            ))}
        </ol>
      </aside>
    </div>
  )
}
