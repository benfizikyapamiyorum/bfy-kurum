// Kurum görüşmesi için sunum slaytları.
// Yalnızca platformda gerçekten bulunan özellikler yazılır; fiyat bilgisi yoktur.
// Sunucunun konuşma notları bilerek burada değildir: bu dosya herkese açık tanıtım sürümüne girer.
// "canli" alanı, slayttan uygulamanın gerçek ekranına geçişi tanımlar.

import type { SimgeAdi } from '../bilesenler/Simge'
import cevapGorseli from './gorseller/cevap.jpg'
import indirGorseli from './gorseller/indir.jpg'
import kitapcikGorseli from './gorseller/kitapcik.jpg'
import konuGorseli from './gorseller/konu.jpg'
import raporGorseli from './gorseller/rapor.jpg'
import tahtaGorseli from './gorseller/tahta.jpg'
import telefonGorseli from './gorseller/telefon.jpg'

/** Canlı ekran hedefleri; adresler tanıtım paketine göre çalışma anında çözülür. */
export type CanliHedef = 'tahtaSoru' | 'uniteSorulari' | 'konu' | 'ogrenciTest' | 'rapor' | 'kitapcik' | 'internetsiz' | 'demo'

export interface Kart {
  simge: SimgeAdi
  baslik: string
  metin: string
}

export interface Slayt {
  tur: 'kapak' | 'maddeler' | 'kartlar' | 'dongu' | 'sayilar' | 'adimlar' | 'kapanis'
  ust?: string
  baslik: string
  alt?: string
  maddeler?: string[]
  kartlar?: Kart[]
  canli?: { hedef: CanliHedef; etiket: string }[]
  /** Uygulamanın gerçek ekranından alınmış görüntü (tanıtım sürümünden). */
  gorsel?: { kaynak: string; cerceve: 'ekran' | 'telefon'; aciklama: string }
}

export const SLAYTLAR: Slayt[] = [
  {
    tur: 'kapak',
    baslik: 'Fizik Kurs Sistemi',
    alt: 'Akıllı tahta, test ve rapor tek yerde.',
  },
  {
    tur: 'kartlar',
    ust: 'Bugün kurslarda',
    baslik: 'Fizik dersinin üç derdi',
    kartlar: [
      { simge: 'belge', baslik: 'Soru arama ve fotokopi', metin: 'Öğretmen her hafta sınıfına uygun soru arar, çoğaltır, dağıtır.' },
      { simge: 'goz', baslik: 'Görünmeyen eksikler', metin: 'Deneme okunur, net çıkar; ama hangi öğrencinin hangi konuda zayıf olduğu görünmez.' },
      { simge: 'sekil', baslik: 'Kopuk parçalar', metin: 'Tahtada anlatılan, testte sorulan ve raporda görülen birbirine bağlı değildir.' },
    ],
  },
  {
    tur: 'dongu',
    ust: 'Çözüm',
    baslik: 'Tek sistem, kapalı döngü',
    alt: 'Her soru Maarif öğrenme çıktısına göre etiketlidir; bu yüzden döngünün her adımı birbirine bağlıdır.',
  },
  {
    tur: 'maddeler',
    ust: 'Öğretmen',
    baslik: 'Tahta modu',
    maddeler: [
      'Soru akıllı tahtada büyük yazı ve şekille açılır.',
      'Cevap ve çözüm adımları dokunarak tek tek açılır; şekil çözümle birlikte adım adım değişir.',
      'Öğretmen kalemle sorunun üstüne yazar, süre tutar, yüksek kontrastlı görünüme geçer.',
    ],
    canli: [{ hedef: 'tahtaSoru', etiket: 'Tahtada bir soru aç' }],
    gorsel: { kaynak: tahtaGorseli, cerceve: 'ekran', aciklama: 'Tahta modunda bir soru: çözümün iki adımı açılmış.' },
  },
  {
    tur: 'sayilar',
    ust: 'İçerik',
    baslik: 'Ezber değil, düşündüren sorular',
    alt: 'Liman, dalış okulu, pekmez üreticisi, Ay üssü: sorular gerçek durumlarda geçer. Her yanlış şık, öğrencilerde sık görülen bir kavram yanılgısına göre seçilir.',
    canli: [{ hedef: 'uniteSorulari', etiket: 'Soru paketini aç' }],
    gorsel: { kaynak: cevapGorseli, cerceve: 'ekran', aciklama: 'Cevabı açılmış, tablolu ve şekilli bir soru.' },
  },
  {
    tur: 'maddeler',
    ust: 'Öğretmen',
    baslik: 'Konu anlatımı ve ders akışı',
    maddeler: [
      'Konu tahtada bölüm bölüm, şekillerle anlatılır.',
      '40 ve 80 dakikalık ders akışı, yalnızca öğretmenin açtığı panelde durur; öğrenciler görmez.',
      'Konu anlatımı ve sorular aynı öğrenme çıktılarına bağlıdır.',
    ],
    canli: [{ hedef: 'konu', etiket: 'Konu anlatımını aç' }],
    gorsel: { kaynak: konuGorseli, cerceve: 'ekran', aciklama: 'Konu anlatımının bir bölümü.' },
  },
  {
    tur: 'adimlar',
    ust: 'Öğrenci',
    baslik: 'Öğrenci sistemi nasıl kullanır?',
    maddeler: [
      'Kurum kodu, kullanıcı adı ve şifreyle girer; e-posta adresi gerekmez.',
      'Ana ekranında çözmesi gereken ve yaklaşan testleri görür.',
      'Testi telefondan, tabletten ya da bilgisayardan süreli çözer; internet kesilirse cevapları kaybolmaz.',
      'Bitirince netini görür; öğretmen izin verdiyse her sorunun çözümünü de görür.',
      'Kendi net gelişimini kendi ekranında izler.',
    ],
    canli: [{ hedef: 'ogrenciTest', etiket: 'Öğrenci gibi test çöz' }],
    gorsel: { kaynak: telefonGorseli, cerceve: 'telefon', aciklama: 'Öğrencinin telefonunda test ekranı.' },
  },
  {
    tur: 'maddeler',
    ust: 'Kurs yöneticisi',
    baslik: 'Sınıfın durumu tek ekranda',
    maddeler: [
      'Sınıfın her öğrenme çıktısındaki başarı yüzdesi; zayıf çıktılar işaretli gelir.',
      'Zayıf çıktılardan, sınıfa daha önce verilmemiş sorularla tek tıkla telafi testi.',
      'Her öğrencinin sınavlar boyunca net gelişimi.',
    ],
    canli: [{ hedef: 'rapor', etiket: 'Sınıf raporunu aç' }],
    gorsel: { kaynak: raporGorseli, cerceve: 'ekran', aciklama: 'Sınıf raporu: öğrenme çıktısı başarısı ve zayıf çıktılar.' },
  },
  {
    tur: 'maddeler',
    ust: 'Kâğıt sınavlar',
    baslik: 'Basılı deneme tek tıkla',
    maddeler: [
      'Öğrenci kitapçığı, cevaplı öğretmen kitapçığı ve optik form.',
      'Kurumun adı ve logosuyla; tek ya da iki sütun.',
      'Bir soru ile şekli hiçbir zaman iki sayfaya bölünmez.',
      'Kâğıt sınavın cevapları sisteme girilir; net, kurumun belirlediği yanlış-doğru oranıyla hesaplanır ve raporlara düşer.',
    ],
    canli: [{ hedef: 'kitapcik', etiket: 'Kitapçığı göster' }],
    gorsel: { kaynak: kitapcikGorseli, cerceve: 'ekran', aciklama: 'İki sütunlu öğrenci kitapçığı.' },
  },
  {
    tur: 'kartlar',
    ust: 'Kurumunuzda',
    baslik: 'Kurum paneli',
    kartlar: [
      { simge: 'yukle', baslik: 'Toplu hesap açma', metin: 'Öğretmen ve öğrenci listesi Excel ile yüklenir; giriş kartları yazdırılır.' },
      { simge: 'tahta', baslik: 'Sınıflar', metin: 'Sınıflar açılır, öğrenciler yerleştirilir; her sınıfın kendi giriş kodu vardır.' },
      { simge: 'belge', baslik: 'Kurum logosu', metin: 'Tahtada ve bütün çıktılarda kurumun kendi logosu görünür.' },
      { simge: 'kapi', baslik: 'Ayrı ve güvenli veri', metin: 'Her kurumun verisi ayrıdır. Öğrenciden telefon, adres ya da kimlik numarası alınmaz.' },
    ],
  },
  {
    tur: 'kartlar',
    ust: 'Kullanım süresi',
    baslik: 'Lisans nasıl işler?',
    kartlar: [
      { simge: 'sayac', baslik: 'Belirli bir dönem', metin: 'Lisans başlangıç ve bitiş tarihiyle tanımlanır; dönem kurumla birlikte belirlenir.' },
      { simge: 'goz', baslik: 'Kalan süre görünür', metin: 'Kurum panelinde lisans tarihleri ve kalan gün sayısı her zaman görünür.' },
      { simge: 'ayarlar', baslik: 'Kuruma göre boyut', metin: 'Öğretmen ve öğrenci sayısı kurumun ihtiyacına göre belirlenir.' },
      { simge: 'yenile', baslik: 'Güncellemeler dahil', metin: 'Lisans süresince eklenen bütün içerik ve yenilikler kuruma kendiliğinden gelir.' },
    ],
  },
  {
    tur: 'maddeler',
    ust: 'Güvence',
    baslik: 'İnternet kesilse de ders sürer',
    maddeler: [
      'Öğretmen haftanın içeriğini önceden tahtaya kaydeder.',
      'Bağlantı giderse tahta modu kayıtlı kopyayla çalışmaya devam eder.',
      'Bilgisayar, tablet, telefon ve akıllı tahtada çalışır; kurulum gerekmez.',
    ],
    canli: [{ hedef: 'internetsiz', etiket: 'Kaydetme ekranını aç' }],
    gorsel: { kaynak: indirGorseli, cerceve: 'ekran', aciklama: 'İnternetsiz kullanım için içerik seçme ekranı.' },
  },
  {
    tur: 'kartlar',
    ust: 'Birlikte büyüyen sistem',
    baslik: 'Sürekli gelişir, yanınızdayız',
    kartlar: [
      { simge: 'yenile', baslik: 'Düzenli içerik', metin: 'İçerik yıl boyunca ders sırasına göre eklenir; diğer üniteler hazırlandıkça sisteme girer.' },
      { simge: 'bulut', baslik: 'Kendiliğinden güncelleme', metin: 'Yenilikler bütün cihazlara kendiliğinden gelir; kimse bir şey kurmaz.' },
      { simge: 'ayarlar', baslik: 'Çok derse uygun', metin: 'Altyapı çok derse uygundur; istenirse başka dersler eklenebilir.' },
      { simge: 'tamam', baslik: 'Kurulum ve eğitim', metin: 'Kurulumu ve öğretmenlere uygulamalı gösterimi birlikte yaparız; takıldığınız her konuda doğrudan ulaşırsınız.' },
    ],
  },
  {
    tur: 'adimlar',
    ust: 'Sonraki adım',
    baslik: 'Kurucu kurum olarak başlayalım',
    alt: 'İlk kurumlarla birlikte başlıyoruz; içerik sizin ders programınıza göre önceliklendirilir, önerileriniz sisteme ilk yansıyanlar olur.',
    maddeler: [
      'Kurumunuz için kurum kodu ve yönetici hesabı açılır.',
      'Öğretmen ve öğrenci listeniz Excel ile yüklenir; giriş kartları hazır olur.',
      'Öğretmenlerinize kullanımı birlikte gösteririz; aynı gün kullanmaya başlarlar.',
    ],
  },
  {
    tur: 'kapanis',
    baslik: 'Teşekkürler.',
    alt: 'Sorularınızı memnuniyetle yanıtlarım.',
    canli: [{ hedef: 'demo', etiket: 'Demoyu birlikte dolaşalım' }],
  },
]
