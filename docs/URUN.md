# PROJE: Dershane / Özel Öğretim Kursu Fizik Sistemi (MVP)

Bu repoda, tek şubeli yerel özel öğretim kurslarına (dershane / etüt merkezi) yıllık lisansla satılacak bir eğitim platformu kuracağız. Önce bu dokümanı repoya `docs/URUN.md` olarak kaydet. Tüm kararlar buna dayanacak.

## 1. Bağlam

- Ürün sahibi: Timur Yıldırım. 16 yıllık fizik öğretmeni, "Ben Fizik Yapamıyorum" (benfizikyapamiyorum.com) platformunun kurucusu.
- Elinde hazır içerik var: 9. sınıf için 36 haftalık interaktif HTML kitler (her biri tek dosya, Tahta / Hoca / Öğrenci modlu, tıklayınca cevap açılan), 12 yazılı formu, 10 ve 11. sınıf paketleri (Yapabilirim 10/11). Bu içerik şu an bu repoda değil, sonradan içe aktarılacak.
- Hedef müşteri: Tek şubeli, yerel kurslar. Karar veren tek kişi (kurs sahibi). Satış vaadi: "Fizikte başka hiçbir şeye ihtiyacın kalmaz."
- Müfredat: Maarif Modeli (TYMM). Her içerik ve soru kazanım koduyla etiketlenir (örn. FİZ.9.2.3).

## 2. Temel mimari kararı: Motor genel, vitrin fizik

- Veri modeli DERSTEN BAĞIMSIZ olmalı (Ders → Sınıf düzeyi → Ünite → Kazanım → İçerik/Soru). İleride kimya, matematik eklenebilsin.
- Arayüz, örnek veri ve demo şimdilik sadece fizik.

## 3. Teknoloji

- Frontend: Vite + React + TypeScript, PWA (service worker ile çevrimdışı çalışma).
- Backend: Supabase (Postgres + Auth + Row Level Security + Storage), bölge Frankfurt (EU).
- Hosting: Netlify.
- PDF üretimi: tarayıcıda (print CSS veya pdf kütüphanesi). Sunucu tarafı gerekmesin.
- Ödeme entegrasyonu YOK. Lisanslar süper admin panelinden elle açılır.
- Gerekli ortam değişkenlerini `.env.example` içinde listele ve README'de Supabase/Netlify kurulumunu adım adım, teknik olmayan birinin yapabileceği şekilde Türkçe anlat.

## 4. Roller

- `superadmin` (Timur): Kurum oluşturur, lisans süresi ve kontenjan verir, içerik yönetir, içe aktarım yapar.
- `kurum_yonetici` (kurs sahibi): Öğretmen ve sınıf ekler, raporları görür, kurum logosunu yükler.
- `ogretmen`: Tahta modunda ders anlatır, test/deneme oluşturur ve atar, sonuçları görür.
- `ogrenci`: Atanan testleri çözer, kendi sonuçlarını görür.
- Çok kiracılı yapı: Her kurum yalnızca kendi verisini görür (RLS ile zorunlu).

## 5. Veri modeli (öneri, gerekirse iyileştir)

- `kurum` (ad, logo, lisans_baslangic, lisans_bitis, ogretmen_limiti, ogrenci_limiti, aktif)
- `kullanici` (rol, kurum_id, ad_soyad, e-posta veya kullanıcı adı). Öğrenciden TC kimlik no, telefon gibi veriler ALINMAZ (KVKK: minimum veri).
- `sinif_grubu` (kurum içindeki sınıf/şube, örn. "11-A Sayısal")
- `ders`, `seviye` (9–12, TYT, AYT), `unite`, `kazanim` (kod, metin)
- `icerik` (tür: hafta_kiti | konu_anlatimi | sunum; kazanım etiketleri; HTML dosyası veya yapılandırılmış içerik)
- `soru`:
  - türler: çoktan seçmeli (5 şık A–E), doğru/yanlış, açık uçlu
  - gövde (zengin metin + SVG şekil), şıklar, doğru cevap
  - adım adım çözüm (her adım ayrı açılabilir)
  - kazanım etiketleri, zorluk (1–5), bağlam temelli mi (bayrak), kaynak notu
- `test` (tür: mini_test | deneme | yazili; soru listesi; süre)
- `atama` (test → sınıf grubu, başlangıç/bitiş)
- `cevap` / `sonuc` (öğrenci, soru, verilen cevap, doğru mu, süre)

## 6. Modüller ve özellikler

### 6.1 Tahta Modu (en kritik özellik, satışı bu yapacak)

- Akıllı tahtada çalışacak: 1920×1080 ve 4K, dokunmatik, Android tabanlı tahtalar dahil Chromium tarayıcılar.
- Hover'a bağlı hiçbir etkileşim yok. Dokunma hedefleri en az 56px. Büyük, okunaklı yazı.
- Tam ekran butonu. Klavye gerekmeden kullanılabilir.
- Akış: Sınıf → Ünite → Hafta/Konu seç → anlat.
- Soru ekranı: Soru büyük gösterilir, cevap varsayılan olarak GİZLİ. Dokununca cevap açılır. Çözüm adımları tek tek açılır. Şekillerdeki çizimler (vektör, ışın yolu vb.) animasyonla çizilebilecek şekilde bir animasyon kancası (API) tasarla.
- Üzerine çizim katmanı: Öğretmen kalemle soru üzerine çizebilsin, silebilsin, temizleyebilsin.
- Sayaç (soru başına süre).
- Ekranın köşesinde kurumun logosu görünsün. Kurs sahipleri bunu çok sever, satış argümanıdır.
- Mevcut tek dosyalık HTML kitleri içe aktarılınca tahta modunda iframe ile tam ekran açılabilmeli. Böylece Timur'un hazır 36 haftası ilk günden kullanılabilir.

### 6.2 Çevrimdışı çalışma

- İnternet olduğunda normal çalışır.
- Öğretmen "Bu haftaları tahtaya indir" diyerek seçtiği içerikleri önbelleğe alabilir. İnternet kesilince tahta modu çalışmaya devam eder.
- Çevrimdışıyken yapılan işlemler (varsa) internet gelince senkronize edilir.

### 6.3 Test ve Deneme Oluşturucu

- Kazanım, ünite, zorluk ve soru türüne göre filtreleyip soru seçme.
- "Otomatik oluştur": Seçilen kazanımlardan istenen sayıda, dengeli zorlukta test üretir.
- Aynı test içinde aynı soru tekrar etmez. Bir sınıf grubuna daha önce verilmiş sorular işaretlenir.
- Çıktılar:
  1. Öğrenci PDF'i (soru ile şekli asla iki sayfaya bölünmez)
  2. Cevap anahtarlı öğretmen PDF'i
  3. Optik form PDF'i
  4. Online çözüm (öğrenci tablet/telefon/bilgisayardan)
- PDF'lerde kurum adı ve logosu yer alır (filigran gibi de kullanılabilir, içerik koruması için).

### 6.4 Puanlama ve Raporlar

- YKS usulü net hesabı: 4 yanlış 1 doğruyu götürür (ayarlanabilir).
- Elle sonuç girişi: Kâğıt üzerinde yapılan denemelerin cevapları öğretmen tarafından hızlıca girilebilsin (öğrenci başına cevap dizisi yazma, örn. "ABCDE...").
- Raporlar: Öğrenci bazında net gelişimi, sınıf bazında kazanım başarı yüzdesi, "Bu sınıf şu kazanımlarda zayıf" listesi ve o kazanımlardan tek tıkla telafi testi oluşturma.

### 6.5 Kurum Paneli

- Öğretmen ve öğrenci ekleme (tek tek veya Excel/CSV ile toplu).
- Öğrenci girişi basit olsun: kullanıcı adı + şifre veya kurumun verdiği sınıf kodu.
- Lisans durumu ve bitiş tarihi görünür.

### 6.6 Süper Admin Paneli

- Kurum oluşturma, lisans açma/uzatma/kapatma, kontenjan belirleme.
- İçerik ve soru yönetimi (ekle, düzenle, kazanım etiketle).
- Toplu içe aktarım: JSON şeması tanımla ve `docs/ICE_AKTARIM.md` içinde örnekle belgele. Ayrıca tek dosyalık HTML kitleri doğrudan yüklenebilsin.

### 6.7 Demo Modu

- Herkese açık bir "Demo kurum" hesabı: Kurs sahibi siteye girer, "Demoyu dene" der, tahta modunu ve örnek testi kayıt olmadan dener. Satışın ana aracı bu olacak.

## 7. İçerik kuralları (çok önemli)

- Fizik içeriği UYDURMA. Sadece sistemi göstermek için en fazla 10 örnek soru yaz, hepsini veritabanında `ornek = true` olarak işaretle ve arayüzde "ÖRNEK" rozetiyle göster. Timur gerçek içeriği kendisi aktaracak.
- Örnek sorularda da fizik hatası olmamalı. Birimler, işaretler, şekiller tutarlı olmalı.
- MEB / OGM Materyal içeriğini sisteme KOPYALAMA. Sadece TYMM kazanım kodları ve metinleri kullanılabilir. İçeriklere "İlgili MEB ders kitabı" bağlantısı eklenebilir.
- Kodda "Ben Fizik Yapamıyorum" markası sabit yazılmasın. Ürün adı ve marka yapılandırma dosyasından gelsin (ürün adı henüz kesinleşmedi).

## 8. Arayüz ve dil

- Tüm arayüz Türkçe. Türkçe karakterler, Türkçe sıralama (localeCompare 'tr') ve büyük/küçük harf dönüşümleri (İ/ı) doğru çalışmalı.
- Arayüzdeki her cümle noktayla biter.
- Tasarım: sade, ferah, net. Abartı yok, karmaşa yok. Bir öğretmen açtığında "vay" demeli ama kafası karışmamalı.
- Açık ve koyu tema. Tahta modunda yüksek kontrast seçeneği.

## 9. KVKK

- Minimum öğrenci verisi. Aydınlatma metni ve gizlilik politikası için yer tutucu sayfalar oluştur (`[METİN GELECEK]` ile işaretle).
- Veriler EU bölgesinde.

## 10. Aşamalar

Her aşamayı ayrı branch'te yap, bitince PR aç ve PR açıklamasına Türkçe, kısa, teknik olmayan bir özet yaz (ne yapıldı, nasıl denenir).

- **M0:** Proje iskeleti, README (Türkçe kurulum rehberi), `docs/URUN.md`, `docs/MIMARI.md`, veritabanı şeması ve RLS politikaları.
- **M1:** Tahta modu + örnek içerik + HTML kit içe aktarma + çevrimdışı önbellek.
- **M2:** Giriş sistemi, roller, çok kiracılı yapı, kurum paneli.
- **M3:** Test/deneme oluşturucu, PDF çıktıları, online çözüm, elle sonuç girişi, net hesabı.
- **M4:** Raporlar ve telafi testi.
- **M5:** Süper admin paneli, lisans yönetimi, toplu içe aktarım.
- **M6:** Demo kurum, Netlify yayını, son kontroller.

**M0 ve M1 bittikten sonra DUR** ve tahta modunu nasıl deneyebileceğimi anlat. Tasarım onayımı almadan M2'ye geçme. Onaydan sonra M2–M6'yı sırayla, her aşama sonunda PR açarak devam ettir.

## 11. Kalite

- TypeScript strict mod. Temel testler (özellikle net hesabı, RLS politikaları, soru tekrar etmeme kuralı).
- Tahta modunu 1920×1080 ve dokunmatik senaryoda test et.
- Belirsiz bir kararda en basit, en sağlam seçeneği seç ve PR açıklamasında belirt.

## 12. Supabase notu

Supabase hesabı mevcut, bu ürün için ayrı ve yeni bir proje kullanılacak (Frankfurt). Bulut oturumundan canlı Supabase'e erişemeyeceğin için şemayı, RLS politikalarını ve örnek verileri `supabase/migrations/` altında sıralı SQL dosyaları olarak hazırla. Bu SQL'ler başka bir oturumdan çalıştırılacak. Uygulama, `.env` içine proje URL'si ve anon key girilince çalışmalı.
