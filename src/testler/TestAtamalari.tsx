import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { siniflar } from '../depo/kurumDeposu'
import { atamaOlustur, atamaSil, testAtamalari, testGetir } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useOturum } from '../oturum/Oturum'

const yerelZaman = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const zamanYaz = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Süresiz'

export function TestAtamalari() {
  const { id = '' } = useParams()
  const { kurum, profil, lisans } = useOturum()
  const test = useVeri(() => testGetir(id), [id])
  const atamalar = useVeri(() => testAtamalari(id), [id])
  const gruplar = useVeri(() => siniflar(kurum!.id), [kurum?.id])
  const [secili, setSecili] = useState<string[]>([])
  const [baslangic, setBaslangic] = useState(() => yerelZaman(new Date()))
  const [bitis, setBitis] = useState('')
  const [hata, setHata] = useState<string | null>(null)

  const ata = async (e: FormEvent) => {
    e.preventDefault()
    setHata(null)
    if (secili.length === 0) return setHata('En az bir sınıf seçin.')
    try {
      await atamaOlustur(kurum!.id, profil!.id, id, secili, new Date(baslangic), bitis ? new Date(bitis) : null)
      setSecili([])
      atamalar.yenile()
    } catch (err) {
      setHata(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="sayfa">
      <div className="kart-ust">
        <h1>{test.veri?.test.baslik ?? 'Test'}</h1>
        <Link to={`/testler/${id}`} className="dugme sade">
          Teste dön
        </Link>
      </div>
      <div className="panel-izgara">
        <section className="kart">
          <h2>Sınıfa ata</h2>
          <form className="form-dikey" onSubmit={(e) => void ata(e)}>
            <div className="cip-satiri" role="group" aria-label="Sınıflar">
              {gruplar.veri?.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`cip ${secili.includes(g.id) ? 'secili' : ''}`}
                  aria-pressed={secili.includes(g.id)}
                  onClick={() => setSecili((x) => (x.includes(g.id) ? x.filter((y) => y !== g.id) : [...x, g.id]))}
                >
                  {g.ad}
                </button>
              ))}
              {gruplar.veri?.length === 0 && <span className="soluk">Önce kurum panelinden sınıf açılmalı.</span>}
            </div>
            <label className="alan">
              Başlangıç
              <input type="datetime-local" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} required />
            </label>
            <label className="alan">
              Bitiş (boş bırakılırsa süresiz)
              <input type="datetime-local" value={bitis} onChange={(e) => setBitis(e.target.value)} />
            </label>
            <p className="soluk kucuk">
              Öğrenciler testi kendi hesaplarından çözer. Kâğıt üzerinde yapılan sınavlar için de atama açın; cevapları
              sonuç ekranından elle girebilirsiniz.
            </p>
            {hata && <p className="hata-metni">{hata}</p>}
            <button type="submit" className="dugme ana" disabled={!lisans?.gecerli}>
              Ata
            </button>
          </form>
        </section>

        <section className="kart">
          <h2>Atamalar</h2>
          {atamalar.veri?.length === 0 && <p className="soluk">Bu test henüz bir sınıfa atanmadı.</p>}
          <ul className="atama-listesi">
            {atamalar.veri?.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{a.sinif_adi}</strong>
                  <div className="soluk kucuk">
                    {zamanYaz(a.baslangic)}, bitiş: {zamanYaz(a.bitis)}. {a.tamamlayan} öğrenci tamamladı.
                  </div>
                </div>
                <div className="satir-islemleri">
                  <Link className="dugme kucuk ana" to={`/testler/${id}/atama/${a.id}`}>
                    Sonuçlar
                  </Link>
                  <a className="dugme kucuk" href={`/testler/${id}/yazdir/optik?sinif=${a.sinif_grubu_id}`} target="_blank" rel="noreferrer">
                    İsimli optik form
                  </a>
                  <button
                    type="button"
                    className="dugme kucuk sade tehlike"
                    onClick={async () => {
                      if (!window.confirm('Atama ve bu atamadaki tüm sonuçlar silinsin mi?')) return
                      await atamaSil(a.id)
                      atamalar.yenile()
                    }}
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
