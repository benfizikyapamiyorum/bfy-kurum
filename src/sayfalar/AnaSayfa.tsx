import { Link } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { marka } from '../yapilandirma/marka'

export function AnaSayfa() {
  return (
    <div className="sayfa ana-sayfa">
      <section className="giris">
        <h1>{marka.urunAdi}</h1>
        <p className="giris-metni">
          Akıllı tahtada ders anlatımı, kazanım etiketli soru bankası, test ve deneme hazırlama, sonuç raporları.
          Hepsi tek yerde.
        </p>
        <div className="giris-dugmeleri">
          <Link to="/demo" className="dugme ana buyuk">
            <Simge ad="oynat" />
            Demoyu dene
          </Link>
          <Link to="/tahta" className="dugme buyuk">
            <Simge ad="tahta" />
            Tahta modunu aç
          </Link>
          <Link to="/tahta/indir" className="dugme buyuk">
            <Simge ad="indir" />
            Tahtaya indir
          </Link>
        </div>
      </section>

      <section className="izgara ozellikler">
        <article className="kart">
          <h2>Tahta modu</h2>
          <p className="soluk">
            Soruyu büyük gösterir, cevabı ve çözüm adımlarını dokunarak açarsınız. Kalemle üzerine çizebilir,
            süre tutabilirsiniz.
          </p>
        </article>
        <article className="kart">
          <h2>İnternetsiz çalışma</h2>
          <p className="soluk">Seçtiğiniz haftaları tahtaya indirirsiniz. İnternet kesilse de ders sürer.</p>
        </article>
        <article className="kart">
          <h2>Test ve deneme</h2>
          <p className="soluk">Kazanıma göre soru seçimi, PDF çıktısı, online çözüm ve net hesabı.</p>
        </article>
        <article className="kart">
          <h2>Raporlar ve telafi</h2>
          <p className="soluk">
            Sınıfın hangi öğrenme çıktısında zayıf olduğu, öğrencinin net gelişimi ve tek tıkla telafi testi.
          </p>
        </article>
      </section>
    </div>
  )
}
