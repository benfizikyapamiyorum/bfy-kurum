import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TEST_TURU_ADI } from '../alan/etiketler'
import { trSayi } from '../alan/turkce'
import { ogrenciAtamalari } from '../depo/ogrenciDeposu'
import { useVeri } from '../kancalar'
import { useOturum } from '../oturum/Oturum'

const zaman = (iso: string) => new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

export function OgrenciAna() {
  const { profil, kurum } = useOturum()
  const v = useVeri(ogrenciAtamalari, [])
  const [simdi] = useState(() => Date.now())
  const bekleyen = v.veri?.filter((a) => !a.tamamlandi && Date.parse(a.baslangic) <= simdi && (!a.bitis || Date.parse(a.bitis) > simdi)) ?? []
  const yaklasan = v.veri?.filter((a) => !a.tamamlandi && Date.parse(a.baslangic) > simdi) ?? []
  const biten = v.veri?.filter((a) => a.tamamlandi) ?? []
  const kacan = v.veri?.filter((a) => !a.tamamlandi && a.bitis && Date.parse(a.bitis) <= simdi) ?? []

  return (
    <div className="sayfa dar">
      <h1>Merhaba, {profil?.ad_soyad}.</h1>
      <p className="soluk">{kurum?.ad}</p>
      {v.hata && <p className="hata-metni">{v.hata.message}</p>}

      <section className="kart">
        <h2>Çözülecek testler</h2>
        {bekleyen.length === 0 && <p className="soluk">Şu an çözmen gereken test yok.</p>}
        <ul className="ogrenci-testleri">
          {bekleyen.map((a) => (
            <li key={a.atama_id}>
              <div>
                <strong>{a.baslik}</strong>
                <div className="soluk kucuk">
                  {TEST_TURU_ADI[a.tur]}, {a.soru_sayisi} soru{a.sure_dk ? `, ${a.sure_dk} dakika` : ''}
                  {a.bitis ? `. Son gün: ${zaman(a.bitis)}` : ''}.
                </div>
              </div>
              <Link className="dugme ana" to={`/ogrenci/test/${a.atama_id}`}>
                Başla
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {yaklasan.length > 0 && (
        <section className="kart">
          <h2>Yaklaşan testler</h2>
          <ul className="ogrenci-testleri">
            {yaklasan.map((a) => (
              <li key={a.atama_id}>
                <strong>{a.baslik}</strong>
                <span className="soluk kucuk">{zaman(a.baslangic)} tarihinde açılacak.</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="kart">
        <h2>Sonuçlarım</h2>
        {biten.length === 0 && <p className="soluk">Henüz tamamladığın test yok.</p>}
        <ul className="ogrenci-testleri">
          {biten.map((a) => (
            <li key={a.atama_id}>
              <div>
                <strong>{a.baslik}</strong>
                <div className="soluk kucuk">
                  {a.dogru} doğru, {a.yanlis} yanlış, {a.bos} boş.
                </div>
              </div>
              <Link className="dugme" to={`/ogrenci/test/${a.atama_id}`}>
                Net {trSayi(a.net ?? 0)}
              </Link>
            </li>
          ))}
          {kacan.map((a) => (
            <li key={a.atama_id}>
              <strong>{a.baslik}</strong>
              <span className="soluk kucuk">Süresi doldu, çözülmedi.</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
