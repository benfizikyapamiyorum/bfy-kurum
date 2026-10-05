import { Link } from 'react-router-dom'
import { TEST_TURU_ADI } from '../alan/etiketler'
import { testler } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useOturum } from '../oturum/Oturum'

const tarih = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

export function TestListesi() {
  const { kurum, lisans } = useOturum()
  const v = useVeri(() => testler(kurum!.id), [kurum?.id])
  return (
    <div className="sayfa">
      <div className="kart-ust">
        <h1>Test ve deneme</h1>
        {lisans?.gecerli && (
          <Link to="/testler/yeni" className="dugme ana">
            Yeni test
          </Link>
        )}
      </div>
      {v.hata && <p className="hata-metni">{v.hata.message}</p>}
      {!v.veri ? (
        <p className="soluk">Yükleniyor.</p>
      ) : v.veri.length === 0 ? (
        <section className="kart">
          <p>Henüz test yok. Soru havuzundan seçerek ya da kazanıma göre otomatik oluşturarak başlayın.</p>
        </section>
      ) : (
        <table className="tablo kart">
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Tür</th>
              <th>Soru</th>
              <th>Atama</th>
              <th>Oluşturma</th>
            </tr>
          </thead>
          <tbody>
            {v.veri.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link to={`/testler/${t.id}`}>{t.baslik}</Link>
                </td>
                <td>{TEST_TURU_ADI[t.tur]}</td>
                <td>{t.soru_sayisi}</td>
                <td>{t.atama_sayisi}</td>
                <td>{tarih(t.olusturma)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
