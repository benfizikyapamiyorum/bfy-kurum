// Herkese açık demo: kayıt olmadan tahta modu, örnek test ve örnek rapor.
// Sunucuya hiçbir şey yazılmaz; ortak bir demo şifresi yoktur.

import { Link } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { useVeri } from '../kancalar'
import { marka } from '../yapilandirma/marka'
import { ortam } from '../yapilandirma/ortam'

/** Tanıtım sürümünde öne çıkan soru paketi. */
function PaketKarti() {
  const v = useVeri(async () => (ortam.tanitim ? (await import('../veri/tanitimPaketi')).tanitimUniteYolu() : null), [])
  if (!v.veri) return null
  return (
    <section className="kart paket-karti" aria-label="Kaldırma kuvveti soru paketi">
      <div className="paket-metni">
        <span className="rozet">9. sınıf, Akışkanlar</span>
        <h2>Kaldırma kuvveti soru paketi</h2>
        <p>
          12 bağlam temelli, seçici soru: liman, pekmez üreticisi, dalış okulu, Ay üssü. Her şık gerçek bir kavram yanılgısına
          göre seçildi; her yanlış şık için “Neden bu değil?” açıklaması, adım adım çözüm ve konu anlatımı var.
        </p>
        <div className="secim-grubu">
          <Link to={v.veri} className="dugme ana">
            Tahtada aç
          </Link>
          <Link to="/demo/test?paket=kaldirma" className="dugme">
            Öğrenci gibi çöz
          </Link>
        </div>
      </div>
    </section>
  )
}

export function DemoAna() {
  return (
    <div className="sayfa demo-sayfasi">
      <header className="demo-ust">
        <span className="rozet ornek">DEMO</span>
        <h1>{marka.demoKurumAdi}</h1>
        <p className="marka-satiri">{marka.sahipAdi} içeriğiyle.</p>
        <p className="giris-metni">
          Kayıt olmadan sistemi deneyin. Öğretmenin tahtada ne gördüğüne, öğrencinin testi nasıl çözdüğüne ve kurs yöneticisinin hangi
          raporu aldığına buradan bakabilirsiniz. Demoda yaptıklarınız hiçbir yere kaydedilmez.
        </p>
      </header>

      {ortam.tanitim && <PaketKarti />}

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
        <Link to="/demo/yazdir/ogrenci" className="kart demo-karti">
          <Simge ad="belge" boyut={36} />
          <h2>Basılı deneme ve optik form</h2>
          <p className="soluk">
            Öğrenci kitapçığı, cevaplı öğretmen kitapçığı ve optik form. Soru ile şekli hiçbir zaman iki sayfaya bölünmez.
          </p>
          <span className="dugme ana">Kitapçığı gör</span>
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
        <div className="secim-grubu">
          <Link to="/tanitim" className="dugme ana">
            Kurumunuzda neler olacak?
          </Link>
          {!ortam.tanitim && (
            <Link to="/giris" className="dugme">
              Hesabım var, giriş yap
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
