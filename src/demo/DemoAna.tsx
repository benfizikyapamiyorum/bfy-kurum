// Herkese açık demo: kayıt olmadan tahta modu, örnek test ve örnek rapor.
// Sunucuya hiçbir şey yazılmaz; ortak bir demo şifresi yoktur.

import { Link } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { marka } from '../yapilandirma/marka'

export function DemoAna() {
  return (
    <div className="sayfa demo-sayfasi">
      <header className="demo-ust">
        <span className="rozet ornek">DEMO</span>
        <h1>{marka.demoKurumAdi}</h1>
        <p className="giris-metni">
          Kayıt olmadan sistemi deneyin. Öğretmenin tahtada ne gördüğüne, öğrencinin testi nasıl çözdüğüne ve kurs yöneticisinin hangi
          raporu aldığına buradan bakabilirsiniz. Demoda yaptıklarınız hiçbir yere kaydedilmez.
        </p>
      </header>

      <section className="izgara demo-kartlari">
        <Link to="/tahta" className="kart demo-karti">
          <Simge ad="tahta" boyut={36} />
          <h2>Öğretmen: tahta modu</h2>
          <p className="soluk">
            Sınıfı ve üniteyi seçin, soruyu tahtada açın. Cevabı ve çözüm adımlarını dokunarak açın, kalemle üzerine çizin, süre tutun.
          </p>
          <span className="dugme ana">Tahtayı aç</span>
        </Link>
        <Link to="/demo/test" className="kart demo-karti">
          <Simge ad="soru" boyut={36} />
          <h2>Öğrenci: online test</h2>
          <p className="soluk">
            Örnek testi telefondan ya da bilgisayardan çözün. Bitirince netinizi, doğru ve yanlışlarınızı, her sorunun çözümünü görün.
          </p>
          <span className="dugme ana">Testi çöz</span>
        </Link>
        <Link to="/demo/rapor" className="kart demo-karti">
          <Simge ad="belge" boyut={36} />
          <h2>Kurs yöneticisi: sınıf raporu</h2>
          <p className="soluk">
            Bir sınıfın öğrenme çıktısı başarısı, zayıf konular, öğrenci net gelişimi ve tek tıkla telafi testi. Örnek veriyle.
          </p>
          <span className="dugme ana">Raporu gör</span>
        </Link>
      </section>

      <section className="kart demo-alt">
        <h2>Kurumunuzda kullanmak için</h2>
        <p>
          Lisanslı kurumlarda öğretmen ve öğrenci hesaplarını kurs yöneticisi açar. Testler kazanıma göre hazırlanır, PDF olarak basılır
          ya da online atanır. Sonuçlar raporlara kendiliğinden düşer.
        </p>
        <p>
          Bilgi ve lisans için: <strong>{marka.web}</strong>
          {marka.sosyalMedya && <>, {marka.sosyalMedya}</>}
          {marka.iletisimEposta && <>, {marka.iletisimEposta}</>}.
        </p>
        <Link to="/giris" className="dugme">
          Hesabım var, giriş yap
        </Link>
      </section>
    </div>
  )
}
