// Kurum yöneticilerine verilecek tanıtım metni: tanıtımda gösterilenler ve kurumda olacaklar.
// Aynı sayfa hem uygulamada (/tanitim) açılır hem de A4 PDF olarak yazdırılır (yazdırma stili aşağıda).
// Yalnızca platformda gerçekten bulunan özellikler yazılır.

import { Link } from 'react-router-dom'
import { UrunIsareti } from '../bilesenler/UrunIsareti'
import { marka } from '../yapilandirma/marka'

interface Bolum {
  baslik: string
  maddeler: string[]
}

const GOSTERILENLER: Bolum[] = [
  {
    baslik: 'Tahta modu',
    maddeler: [
      'Öğretmen sınıfı ve üniteyi seçer; soru akıllı tahtada büyük yazı ve şekille açılır.',
      'Cevap ve çözüm adımları dokunarak tek tek açılır; şekiller adım adım çizilir.',
      'Öğretmen kalemle sorunun üzerine yazar, süre tutar, yüksek kontrastlı görünüme geçer.',
    ],
  },
  {
    baslik: 'Kaldırma kuvveti soru paketi',
    maddeler: [
      '9. sınıf Akışkanlar ünitesi için 12 bağlam temelli, seçici soru ve şekilli konu anlatımı.',
      'Her yanlış şık gerçek bir kavram yanılgısına göre seçildi; her biri için “Neden bu değil?” açıklaması var.',
      '40 ve 80 dakikalık ders akışı, öğretmenin önünde açılan bir panelde durur.',
    ],
  },
  {
    baslik: 'Öğrenci gözünden online test',
    maddeler: [
      'Öğrenci testi telefondan, tabletten ya da bilgisayardan çözer.',
      'Bitirince netini, doğru ve yanlışlarını, her sorunun çözümünü görür.',
    ],
  },
  {
    baslik: 'Kurs yöneticisi gözünden sınıf raporu',
    maddeler: [
      'Sınıfın her öğrenme çıktısındaki başarısı ve zayıf konular.',
      'Öğrencilerin sınavlar boyunca net gelişimi ve tek tıkla telafi testi.',
      'Tanıtımdaki rapor örnek veriyle hazırlanmıştır.',
    ],
  },
]

const KURUMDA: Bolum[] = [
  {
    baslik: 'Hesaplar ve kurum paneli',
    maddeler: [
      'Kurs yöneticisi öğretmen ve öğrenci hesaplarını tek tek ya da Excel listesiyle toplu açar.',
      'Öğrencinin e-posta adresi gerekmez: kurum kodu, kullanıcı adı ve şifreyle girer; giriş kartları yazdırılır.',
      'Sınıflar açılır, öğrenciler sınıflara yerleştirilir; her sınıfın kendi giriş kodu vardır.',
      'Tahtada ve çıktılarda kurumun kendi logosu görünür.',
    ],
  },
  {
    baslik: 'Tahta modu',
    maddeler: [
      'Bütün içerik akıllı tahtada büyük yazı ve şekillerle açılır.',
      'Seçilen haftalar tahtaya kaydedilir; internet kesilse de ders sürer.',
      'Hafta kitleri ve konu anlatımları, ders akışıyla birlikte gelir.',
    ],
  },
  {
    baslik: 'Test ve deneme',
    maddeler: [
      'Öğretmen soruları ünite, öğrenme çıktısı, zorluk ve türe göre seçer ya da testi otomatik oluşturur.',
      'Sınıfa daha önce verilmiş sorular işaretli gelir.',
      'PDF çıktıları: öğrenci kitapçığı, cevaplı öğretmen kitapçığı ve optik form; kurum logosuyla, tek ya da iki sütun.',
      'Online atamada öğrenci süreli testi telefondan çözer, sonuç anında hesaplanır; internet kesilirse cevaplar kaybolmaz.',
      'Kâğıt sınavın cevapları elle girilir; net, kurumun belirlediği yanlış-doğru oranıyla hesaplanır.',
    ],
  },
  {
    baslik: 'Raporlar',
    maddeler: [
      'Sınıfın her öğrenme çıktısındaki başarı yüzdesi; zayıf çıktılar işaretli.',
      'Zayıf çıktılardan, sınıfa daha önce verilmemiş sorularla tek tıkla telafi testi.',
      'Her öğrencinin net gelişimi; öğrenci kendi gelişimini kendi ekranında görür.',
    ],
  },
  {
    baslik: 'İçerik',
    maddeler: [
      `Sorular, konu anlatımları ve hafta kitleri ${marka.sahipAdi} tarafından hazırlanır.`,
      'Her soru Türkiye Yüzyılı Maarif Modeli öğrenme çıktılarına göre etiketlidir.',
      'Her soru yayına girmeden önce bağımsız olarak çözülür ve denetlenir.',
    ],
  },
  {
    baslik: 'Sürekli gelişen sistem',
    maddeler: [
      'İçerik ve özellikler yıl boyunca düzenli olarak eklenir.',
      'Kaldırma kuvveti paketi ilk pakettir; diğer üniteler hazırlandıkça eklenir.',
      'Güncellemeler kendiliğinden gelir; kurumun bir şey kurması gerekmez.',
      'Kurumlardan gelen öneriler geliştirmede önceliklidir.',
      'Altyapı çok derse uygundur; istenirse başka dersler eklenebilir.',
    ],
  },
  {
    baslik: 'Satın alma ve destek',
    maddeler: [
      'Kurum sistemi bir kez satın alır ve süre sınırı olmadan kullanır.',
      'İlk iki yıl içerik, güncelleme ve destek dahil; sonrası isteğe bağlı yıllık paket.',
      'Kurulum ve öğretmenlere uygulamalı gösterim birlikte yapılır; takıldığınız her konuda doğrudan ulaşırsınız.',
    ],
  },
  {
    baslik: 'Güvenlik ve kullanım',
    maddeler: [
      'Her kurumun verisi ayrı tutulur; bir kurum başka bir kurumun verisini göremez.',
      'Öğrenciden yalnızca ad soyad ve kullanıcı adı alınır; telefon, adres ya da kimlik numarası tutulmaz.',
      'Bilgisayar, tablet, telefon ve akıllı tahtada çalışır; kurulum gerekmez.',
    ],
  },
]

const BASLANGIC = [
  'Kurumunuz için kurum kodu ve yönetici hesabı açılır.',
  'Öğretmen ve öğrenci listenizi Excel ile yüklersiniz; giriş kartları hazır olur.',
  'Kurulumu ve öğretmenlere kullanım gösterimini birlikte yaparız; öğretmenler aynı gün kullanmaya başlar.',
]

function BolumListesi({ bolumler }: { bolumler: Bolum[] }) {
  return (
    <div className="tanitim-izgara">
      {bolumler.map((b) => (
        <section key={b.baslik} className="tanitim-bolum">
          <h3>{b.baslik}</h3>
          <ul>
            {b.maddeler.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function Tanitim() {
  return (
    <div className="sayfa tanitim-belgesi">
      <header className="tanitim-ust">
        <UrunIsareti boyut={44} />
        <div>
          <h1>{marka.urunAdi}</h1>
          <p className="marka-satiri">{marka.sahipAdi} içeriğiyle, kurslar için fizik platformu.</p>
        </div>
      </header>

      <h2>Bu tanıtımda gördükleriniz</h2>
      <BolumListesi bolumler={GOSTERILENLER} />

      <h2 className="sayfa-kir">Kurumunuzda neler olacak?</h2>
      <BolumListesi bolumler={KURUMDA} />

      <h2>Nasıl başlanır?</h2>
      <ol className="tanitim-adimlar">
        {BASLANGIC.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ol>

      <footer className="tanitim-alt">
        <strong>İletişim:</strong> {marka.web}
        {marka.sosyalMedya && <>, {marka.sosyalMedya}</>}
        {marka.iletisimEposta && <>, {marka.iletisimEposta}</>}.
        <span>{marka.programIbaresi}</span>
      </footer>

      <p className="ekranda tanitim-geri">
        <Link to="/demo" className="dugme ana">
          Demoya dön
        </Link>
      </p>
    </div>
  )
}
