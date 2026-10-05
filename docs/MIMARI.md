# Mimari

Bu belge sistemin teknik yapısını anlatır. Ürün kararları [`URUN.md`](URUN.md) dosyasındadır.

## 1. Genel görünüm

```
Tarayıcı (akıllı tahta, bilgisayar, tablet, telefon)
 └─ React + TypeScript uygulaması (Vite ile derlenir, PWA)
     ├─ Service worker: uygulama kabuğunu önbelleğe alır (çevrimdışı açılış)
     ├─ IndexedDB: tahtaya indirilen içerikler, içe aktarılan kitler, senkron kuyruğu
     └─ supabase-js ──HTTPS──► Supabase (Frankfurt)
                                 ├─ Postgres + Row Level Security (tüm yetki burada)
                                 ├─ Auth (oturum, JWT)
                                 ├─ Storage (kurum logoları, HTML kitler)
                                 └─ Edge Function (yalnızca kullanıcı hesabı açmak için, M2)
Netlify: derlenmiş statik dosyaları yayınlar. Sunucu kodu yok.
```

**Temel ilke:** Güvenlik sınırı veritabanıdır. Arayüzdeki gizleme yalnızca kolaylıktır; bir kullanıcının görebileceği ve değiştirebileceği her şey RLS politikalarıyla belirlenir. Anon anahtarı herkese açıktır ve bu tasarımla güvenlidir.

## 2. Klasör yapısı

| Yol | İçerik |
|---|---|
| `src/alan/` | Saf iş kuralları: tipler, net hesabı, cevap dizisi çözümleme, test oluşturma, Türkçe metin işlemleri. Arayüzden ve veritabanından bağımsızdır, birim testleri yanındadır. |
| `src/veri/` | Katalog (ders, seviye, ünite, kazanım) ve örnek içerik. Yerel deneme modunun verisidir ve SQL tohum dosyalarının kaynağıdır. |
| `src/depo/` | Veri erişim katmanı: Supabase istemcisi, yerel kaynak, IndexedDB önbelleği, senkron kuyruğu. |
| `src/tahta/` | Tahta modu ekranları ve araçları (M1). |
| `src/sayfalar/` | Tahta dışındaki sayfalar. |
| `src/bilesenler/` | Ortak arayüz bileşenleri. |
| `src/yapilandirma/` | Marka (`marka.json`) ve ortam değişkenleri. |
| `src/stil/` | CSS. Renkler CSS değişkenleriyle tanımlıdır; açık, koyu ve yüksek kontrast temaları aynı belirteçleri değiştirir. |
| `supabase/migrations/` | Sıralı SQL dosyaları: şema, yardımcı fonksiyonlar, RLS, depolama, katalog, örnek veri. |
| `testler/db/` | Gerçek Postgres üzerinde RLS testleri ve Supabase taklit şeması. |
| `testler/e2e/` | Playwright ile tahta modu testleri (M1). |
| `scripts/` | Yerel veritabanı başlatma ve tohum SQL üretme betikleri. |

## 3. Veri modeli

Model dersten bağımsızdır: `ders → seviye → ünite → kazanım → içerik / soru`. Kimya ya da matematik eklemek için yalnızca katalog satırları eklenir; tablo değişmez.

```
kurum ─┬─ kullanici (rol, kurum_id)          ders ─┐
       ├─ sinif_grubu ── sinif_grubu_ogrenci    seviye ─┼─ unite ── kazanim
       ├─ test ── test_soru ──────────────┐            │              │
       ├─ atama (test → sinif_grubu)      │     icerik ── icerik_kazanim
       ├─ cevap (öğrenci, soru, verilen)  └──── soru ─── soru_kazanim
       └─ sonuc (doğru, yanlış, boş, net)
```

| Tablo | Not |
|---|---|
| `kurum` | Lisans başlangıç ve bitiş tarihi, öğretmen ve öğrenci kontenjanı, aktif bayrağı, demo bayrağı. |
| `kullanici` | `auth.users` ile bire bir. Süper adminin kurumu yoktur, diğer herkesin vardır (CHECK kısıtı). KVKK gereği öğrenciden yalnızca ad soyad ve kullanıcı adı tutulur; TC kimlik no, telefon, adres sütunu yoktur. |
| `sinif_grubu` | Kurum içindeki şube. `katilim_kodu` öğrencinin sınıf koduyla girişi içindir (M2). |
| `icerik` | `hafta_kiti`, `konu_anlatimi`, `sunum`. HTML kit yolu ya da yapılandırılmış JSON. |
| `soru` | Üç tür: çoktan seçmeli (tam 5 şık, A-E), doğru/yanlış (D/Y), açık uçlu. Adım adım çözüm JSON dizisidir. Zorluk 1-5, bağlam temelli bayrağı, kaynak notu, `ornek` bayrağı. Tür ile şık/cevap tutarlılığı CHECK kısıtıyla zorlanır. |
| `test_soru` | Birincil anahtar `(test_id, soru_id)`: aynı test içinde aynı soru iki kez bulunamaz. `(test_id, sira)` da tekildir. |
| `atama` | Testin bir sınıfa verilmesi. Başlangıç ve isteğe bağlı bitiş zamanı. |
| `cevap` | Öğrencinin bir soruya cevabı. `kaynak`: online ya da elle (öğretmen girişi). |
| `sonuc` | Öğrencinin bir atamadaki toplu sonucu: doğru, yanlış, boş, net. |

İçerik ve soru bankası geneldir (tüm kurumlar için tek havuz) ve yalnızca süper admin yazar. Kurumlar bu havuzu lisansları süresince kullanır.

## 4. Yetki ve RLS

Politikalar `supabase/migrations/20261003000300_rls_politikalari.sql` dosyasındadır, testleri `testler/db/rls.test.ts` içindedir.

| Veri | Ziyaretçi (giriş yok) | Öğrenci | Öğretmen | Kurum yöneticisi | Süper admin |
|---|---|---|---|---|---|
| Katalog (ders, ünite, kazanım) | Okur | Okur | Okur | Okur | Yazar |
| `ornek = true` soru ve içerik | Okur | Okur | Okur | Okur | Yazar |
| Diğer soru ve içerik | — | — | Okur (lisans geçerliyse) | Okur (lisans geçerliyse) | Yazar |
| Kendi kurumu | — | Okur | Okur | Ad ve logoyu değiştirir | Yazar |
| Lisans ve kontenjan | — | — | — | Okur | Yazar |
| Kurum kullanıcıları | — | Yalnızca kendisi | Okur | Öğretmen ve öğrenci ekler/düzenler | Yazar |
| Sınıf grupları | — | Kendi sınıfı | Okur | Yazar | Yazar |
| Test, atama | — | Kendine atanmış test başlığı | Yazar | Yazar | Yazar |
| Cevap, sonuç | — | Yalnızca kendisininkini okur | Yazar (elle giriş) | Yazar | Yazar |

Önemli kurallar:

- **Kurumlar arası yalıtım:** Kurum verisi taşıyan her tabloda `kurum_id` vardır ve politikalar `kurum_id`'yi oturumdaki kullanıcının kurumuyla karşılaştırır. Ayrıca tetikleyiciler, bir kurumun testinin başka kurumun sınıfına atanmasını ve öğrencinin başka kurumun sınıfına eklenmesini engeller.
- **Lisans:** Lisans süresi biten ya da pasif kurumun üyeleri soru bankasını göremez ve yazma işlemi yapamaz, ama kendi geçmiş verilerini okumaya devam eder.
- **Rol yükseltme yok:** Kurum yöneticisi yalnızca öğretmen ve öğrenci ekler, kendi rolünü değiştiremez. Lisans ve kontenjan alanlarını yalnızca süper admin değiştirir (`ozel.kurum_koruma` tetikleyicisi).
- **Kontenjan:** Aktif öğretmen ve öğrenci sayısı kurum limitini aşamaz (`ozel.kontenjan_kontrol` tetikleyicisi, eşzamanlı eklemeye karşı kurum satırını kilitler).
- **Cevap anahtarı öğrenciye sızmaz:** Öğrenci `soru` ve `test_soru` tablolarını doğrudan okuyamaz, `cevap` ve `sonuc` tablolarına yazamaz. Online çözüm (M3) iki RPC fonksiyonuyla çalışacak: biri cevapsız soruları döndürür, diğeri cevabı sunucuda puanlayıp kaydeder.
- **Pasif kullanıcı** hiçbir role sahip sayılmaz.

Yardımcı fonksiyonlar `ozel` şemasındadır. Bu şema Supabase Data API'ye açılmaz. Fonksiyonlar `SECURITY DEFINER` ve boş `search_path` ile tanımlıdır; politikalarda `(select ...)` içinde çağrılarak sorgu başına bir kez çalışır.

## 5. Kimlik doğrulama ve hesaplar

- **Öğretmen, yönetici, süper admin:** Supabase Auth ile e-posta ve şifre.
- **Öğrenci:** kurum kodu (ya da sınıf kodu), kullanıcı adı ve şifre. Supabase Auth e-posta istediği için öğrenciye görünmeyen bir iç adres kullanılır: `<kullanıcı-adı>@<kurum-kimliği>.ogrenci.invalid`. `.invalid` alan adı hiçbir zaman gerçek bir posta kutusuna gitmez; öğrenciden e-posta alınmaz. Giriş ekranı kodu `giris_kurumu_bul` RPC'siyle kurum kimliğine çevirir; bu fonksiyon yalnızca kimlik döndürür, ad ya da kullanıcı listesi vermez.
- **Kendi kendine kayıt kapalıdır** (`enable_signup = false`). Hesapları yalnızca `kullanici` Edge Function'ı açar.

### 5.1. `kullanici` Edge Function

Hesap açmak `service_role` yetkisi ister; bu yetki yalnızca bu işlevde, sunucuda kullanılır. İşlev dış paket kullanmaz (Supabase Auth ve REST uç noktalarını doğrudan çağırır).

| İşlem | Kim | Ne yapar |
|---|---|---|
| `olustur` | Süper admin (her kurum, her rol), kurum yöneticisi (kendi kurumu, öğretmen ve öğrenci, lisans geçerliyse) | Auth kullanıcısı ve `kullanici` satırı açar. Şifre verilmezse okunaklı bir geçici şifre üretir (`abcd234` biçimi). Profil açılamazsa (kontenjan dolu, kullanıcı adı çakışması) Auth kullanıcısını geri siler. En çok 500 kişi. |
| `sifre_sifirla` | Aynı yetki | Yeni şifre üretir ve bir kez döndürür. |
| `durum` | Aynı yetki | Hesabı pasifleştirir ya da açar; pasif hesabın oturumu da kapanır. |
| `sil` | Aynı yetki | Auth kullanıcısını siler, `kullanici` ve sonuçları zincirleme silinir. Panel önce onay ister. |

Kontenjan ve kurum tutarlılığı ayrıca veritabanı tetikleyicileriyle zorlanır; işlev atlatılsa bile limit aşılamaz.

### 5.2. Kurum paneli

`/kurum` (yalnızca kurum yöneticisi): lisans durumu ve kontenjan, kurum kodu, kurum adı ve logo (Storage `logolar/<kurum_id>/`), öğretmenler, öğrenciler (tek tek ya da Excel/CSV ile toplu), sınıflar (sınıf kodu, üyelik). Yeni hesapların şifreleri yalnızca bir kez gösterilir ve A4'e giriş kartı olarak yazdırılabilir.

Toplu ekleme `.xlsx` ve `.csv` okur. Türkçe Excel'in `;` ayraçlı ve Windows-1254 kodlu CSV'si tanınır. Sütun başlıkları esnektir (Ad Soyad, Adı + Soyadı, Şube, Kullanıcı adı, Şifre); başlık yoksa ilk sütun ad soyad, ikinci sütun sınıf sayılır. Kullanıcı adı adı ve soyadından Türkçe karakterler çevrilerek önerilir (`Şule Işık` → `sule.isik`), çakışırsa sayı eklenir. Olmayan sınıflar otomatik açılır.

## 6. Test, online çözüm ve net

### 6.1. Test oluşturucu (`/testler`)

- Soru havuzu sınıf düzeyi, ünite, öğrenme çıktısı, zorluk (1-5), soru türü ve "bağlam temelli" bayrağıyla süzülür.
- **Aynı soru iki kez yok:** arayüz eklenmiş soruyu "Testte" diye kilitler (`testeSoruEkle`), `test_sorulari_kaydet` RPC'si tekrar eden diziyi reddeder, `test_soru` birincil anahtarı da engeller.
- **Daha önce verilenler:** hedef sınıf seçilince o sınıfa atanmış testlerdeki sorular "Bu sınıfa verildi" rozetiyle işaretlenir.
- **Otomatik oluştur** (`otomatikTestOlustur`): seçili öğrenme çıktılarına dengeli dağıtır, zorluğu yaklaşık %30 kolay, %40 orta, %30 zor tutar, sınıfa daha önce verilmiş soruları ancak havuz yetmezse kullanır ve uyarır.
- Test ayarları: tür, süre, net kuralı (4 ya da 3 yanlış 1 doğruyu götürür, ya da götürmez), sayfa düzeni (tek ya da iki sütun), işlem alanı (yok, kısa, geniş), filigran.

### 6.2. PDF çıktıları (`/testler/:id/yazdir/:surum`)

Tarayıcının yazdırma özelliğiyle üretilir (`Yazdır` → `PDF olarak kaydet`); sunucu gerekmez. `src/stil/yazdir.css`:

- A4, sayfa numarası `@page` kenar kutusunda.
- **Soru ile şekli asla iki sayfaya bölünmez:** her soru `break-inside: avoid`. İki sütunlu düzende de geçerlidir.
- Başlıkta kurum adı ve logosu; isteğe bağlı soluk filigran (kurum adı) her sayfada.
- `ogrenci`: öğrenci kitapçığı. Şekillerden çözüm katmanları (`data-ciz-adim` ≥ 1, ör. bileşke vektör, alan değerleri) çıkarılır, cevap ele verilmez.
- `ogretmen`: doğru şık işaretli, çözüm adımları, "Neden B değil?" gerekçeleri ve cevap anahtarı.
- `optik`: A-E yuvarlaklı cevap kâğıdı. `?sinif=<id>` ile sınıftaki her öğrenci için isimli bir sayfa.

### 6.3. Online çözüm

Öğrenci `soru` ve `test_soru` tablolarını okuyamaz. Çözüm yalnızca şu `SECURITY DEFINER` fonksiyonlarla yürür:

| Fonksiyon | Ne yapar |
|---|---|
| `ogrenci_atamalari()` | Öğrencinin sınıflarına atanmış testler ve varsa sonucu. |
| `ogrenci_test_sorulari(atama)` | Soruları **cevap anahtarı, çözüm ve şık gerekçesi olmadan** verir. Atama öğrencinin sınıfına ait, başlamış ve lisans geçerli olmalı. |
| `ogrenci_cevap_kaydet(atama, soru, cevap, süre)` | Cevabı sunucuda puanlar (`dogru_mu`), aynı soruya yeni cevap eskisinin yerine geçer. Test bitince ya da bitiş + 10 dakika geçince reddeder. |
| `ogrenci_testi_bitir(atama)` | Doğru, yanlış, boş ve neti hesaplar; tekrar çağrılırsa sonucu değiştirmez. |
| `ogrenci_sonuc_ayrintisi(atama)` | Bitmiş testin cevapları. Doğru cevap, çözüm ve gerekçe yalnızca öğretmen "çözümleri aç" dediyse gelir. |
| `elle_sonuc_kaydet(atama, öğrenci, cevaplar[])` | Öğretmenin kâğıt sınav girişi; aynı puanlama. Yalnızca lisanslı kurumun personeli, yalnızca o sınıfın öğrencisi için. |

Öğrencinin cevapları önce IndexedDB kuyruğuna yazılır (`ogrenci_cevap` işleyicisi, işlem kimliği `cevap:<atama>:<soru>`). İnternet kesilirse kuyrukta bekler, bağlantı gelince gönderilir; "Testi bitir" önce kuyruğu boşaltır. Süre testin ilk açıldığı andan sayılır ve dolunca test otomatik teslim edilir.

**Net:** `net = doğru − yanlış / oran` (oran 0 ise net = doğru), 2 basamağa yuvarlanır. Açık uçlu sorular doğru/yanlış/boş sayımına ve nete girmez. Aynı kural istemcide `netHesapla` ile, sunucuda `ozel.sonuc_hesapla` ile uygulanır; ikisi de testlidir.

### 6.4. Elle sonuç girişi

Sonuç ekranında her öğrenci için cevap dizisi yazılır: `ABCDE-BAC` (boş için `-`, `_`, `.` ya da `*`; boşluklar yok sayılır; küçük harf kabul edilir; doğru/yanlış sorusunda `D` ya da `Y`). Soru sayısı tutmazsa kaydetmeden önce açıklayıcı hata gösterilir.

### 6.5. Tahtada test ve şık gerekçeleri

Kayıtlı test `/tahta/test/:test/:no` ile tahtada soru soru açılır. Çoktan seçmeli sorunun şıklarında `gerekce` varsa cevap açılınca "Neden B değil?" düğmeleri çıkar; sınıfın tartıştığı yanlış seçeneğin gerekçesi tek dokunuşla gösterilir. Soru modelinde ayrıca `beceri`, `kavram_yanilgisi` ve `puanlama_olcutu` alanları vardır (Fizik Atölye pilotundan alındı).

## 7. Çevrimdışı çalışma

- **Uygulama kabuğu:** `vite-plugin-pwa` (Workbox) tüm JavaScript, CSS ve yazı tiplerini önbelleğe alır. İnternet yokken uygulama açılır.
- **İçerik:** HTML kitler ve sorular uygulama kabuğuna girmez. Öğretmen "Tahtaya indir" ekranında haftaları seçer; seçilen içerik IndexedDB'ye yazılır. Veri katmanı önce ağı dener, ağ yoksa IndexedDB'deki kopyayı kullanır.
- **Senkronizasyon:** Çevrimdışıyken yapılan yazma işlemleri IndexedDB'deki bir kuyruğa eklenir ve internet gelince sırayla gönderilir. Her işlemin tekil kimliği vardır; sunucuda `upsert` ile yazıldığı için iki kez gönderilse de çift kayıt oluşmaz.

## 8. Tahta modu

| Adres | Ekran |
|---|---|
| `/tahta` | Sınıf seçimi. |
| `/tahta/:seviye` | Ünite seçimi. |
| `/tahta/:seviye/:unite` | Ünitenin kitleri ve kazanıma göre gruplanmış soruları. |
| `/tahta/:seviye/:unite/soru/:soru` | Soru ekranı. |
| `/tahta/kit/:icerik` | HTML kit, tam ekran iframe. |
| `/tahta/indir` | "Tahtaya indir": çevrimdışı kullanım için içerik seçimi. |

- **Ölçekleme:** Tahta modunun yazı boyutu ekran genişliğinin %1,6'sıdır (en az 17, en çok 52 piksel). Dokunma hedefleri en az 56 pikseldir ve genişlikle büyür. Böylece 1920×1080 ve 4K tahtada aynı düzen görünür.
- **Hover yok:** Hiçbir bilgi ya da işlem fareyle üzerine gelmeye bağlı değildir. Her şey dokunarak açılır.
- **Soru ekranı:** Cevap varsayılan olarak gizlidir. Öğretmen sınıfın tahminini bir şıkka dokunarak işaretleyebilir; cevap açılınca doğru şık yeşil, işaretlenen yanlış şık kırmızı görünür. Çözüm adımları tek tek açılır ve geri kapatılabilir.
- **Çizim katmanı:** Soru ve kit ekranlarının üzerinde bir `<canvas>` vardır. Kalem açıkken dokunuşları çizgiye çevirir, kapalıyken dokunuşlar alttaki içeriğe geçer. Çizgiler vektör olarak saklanır, ekran boyutu değişince yeniden çizilir. Birden çok parmak aynı anda çizebilir. Kalemin silgi ucu otomatik olarak silgi olur. Soru değişince çizim temizlenir.
- **Sayaç:** Soru açılınca başlar, durdurulabilir, sıfırlanabilir; sonraki soruda sıfırdan başlar.
- **Kurum logosu:** Üst çubuğun sağ köşesindedir. M2'ye kadar Ayarlar ekranından bu tarayıcı için denenebilir.

### 8.1. Şekil animasyonu kancası

Soru şekli tek bir SVG'dir. Şekildeki öğeler `data-ciz-*` öznitelikleriyle işaretlenir; `src/tahta/animasyon.ts` içindeki `SekilAnimatoru` bunları okur.

| Öznitelik | Anlamı |
|---|---|
| `data-ciz-adim="n"` | Öğenin görüneceği adım. `0`: soru açılınca; `k`: k. çözüm adımı açılınca. İşaretsiz öğeler hep görünür. Adım geri alınınca öğe yeniden gizlenir. |
| `data-ciz-tur` | `ciz`: çizgi uçtan uca çizilir (vektör, ışın, grafik). `belir`: saydamlıktan belirir. `hareket`: öğe `data-ciz-yol` ile verilen yol boyunca ilerler. `kinematik`: öğe `x = x0 + ϑt + ½at²` ile hareket eder (serbest düşme, atış). Belirtilmezse çizgi öğeleri `ciz`, diğerleri `belir` olur. |
| `data-ciz-sure`, `data-ciz-gecikme` | Milisaniye. |
| `data-ciz-p0`, `data-ciz-v`, `data-ciz-a`, `data-ciz-t` | Yalnızca `kinematik`: başlangıç konumu, hız, ivme (SVG birimi/s, birim/s²) ve modeldeki süre (s). |

Bir grup (`<g>`) işaretlenirse içindeki çizgiler birlikte çizilir, ok uçları ve yazılar sonda belirir. Hareketli öğeler adımından önce de başlangıç konumunda görünür. Cihazda "hareketi azalt" tercihi açıksa her şey animasyonsuz gösterilir.

Yeni bir animasyon türü kod içinden eklenebilir (ör. ışığın kırılması):

```ts
import { animasyonTuruKaydet } from './tahta/animasyon'

animasyonTuruKaydet('isin-kirilma', (oge, { sure, gecikme }) => [
  oge.animate([{ opacity: 0 }, { opacity: 1 }], { duration: sure, delay: gecikme, fill: 'backwards' }),
])
// Şekilde: <path data-ciz-adim="2" data-ciz-tur="isin-kirilma" d="..."/>
```

Örnek sorulardaki şekiller (`src/veri/ornekSorular.ts`) bu kancanın tüm türlerini kullanır: vektörlerin çizilmesi, grafik alanlarının belirmesi, koşucunun pist boyunca ilerlemesi, taşın serbest düşmesi ve topun yatay atışı.

### 8.2. HTML kitler

- Kit, `sandbox="allow-scripts allow-forms allow-popups allow-modals allow-downloads"` olan bir iframe içinde `srcdoc` ile açılır. `allow-same-origin` verilmez: kitin betikleri çalışır, ama uygulamanın oturum anahtarına, çerezlerine ve IndexedDB'sine erişemez.
- Bu yalıtımda tarayıcı kitin `localStorage` erişimini engeller. Kit bozulmasın diye kitin başına bellekte çalışan bir `localStorage`/`sessionStorage` eklenir (`src/tahta/kitHtml.ts`). Kitin kaydettiği tercihler o oturum boyunca geçerlidir.
- Kitler tek dosya olmalıdır. Dış dosyaya göreli bağlantı (`resim.png`) iframe içinde çözülemez; resimler dosyanın içine gömülmelidir (data URI ya da satır içi SVG).
- İçe aktarma (M1): `/icerik/ice-aktar` ekranında seçilen HTML dosyaları bu tarayıcının IndexedDB'sine kaydedilir ve seçilen ünitede görünür. M5'te süper admin aynı ekrandan Supabase Storage'a yükleyecek ve kitler tüm kurumlara açılacak.

## 9. Marka ve yapılandırma

Ürün adı, sahip adı, web adresi, sosyal medya hesabı ve ana renk `src/yapilandirma/marka.json` içindedir. Kodda marka adı sabit yazılmaz. `index.html` başlığı ve PWA manifest'i de derleme sırasında bu dosyadan doldurulur.

## 10. Türkçe

- Sıralama `Intl.Collator('tr', { numeric: true })` ile yapılır: ç, ğ, ı, ö, ş, ü doğru yerde, "9-A" "10-A"dan önce gelir.
- Büyük/küçük harf dönüşümü `toLocaleUpperCase('tr-TR')` ile yapılır: i → İ, ı → I.
- Sayılar ondalık virgülle yazılır.
- Yazı tipi Inter. Latin ve Latin genişletilmiş alt kümeleri birlikte tüm Türkçe karakterleri içerir (fontTools ile denetlendi). Çevrimdışı önbelleğe yalnızca bu iki alt küme alınır.

## 11. Testler

| Komut | Kapsam |
|---|---|
| `npm test` | `src/**/*.test.ts`: net hesabı, cevap dizisi, soru tekrar etmeme ve otomatik test oluşturma, Türkçe sıralama. |
| `npm run test:db` | `testler/db/`: migration'lar gerçek bir Postgres'e uygulanır, Supabase'in `auth` ve `storage` şemaları taklit edilir, her rol için RLS davranışı denetlenir. |
| `npm run test:e2e:sunucu` | `testler/e2e-sunucu/`: yerel Supabase; ayrıca test oluşturma, PDF çıktıları, atama, öğrencinin online çözümü ve net, elle sonuç girişi, çözümleri açma, tahtada test ve şık gerekçeleri; ve (`npx supabase start`) üzerinde giriş, hesap açma, CSV ile toplu öğrenci, kurum ve sınıf koduyla öğrenci girişi, kontenjan, lisans bitişi, rol yalıtımı, logo. Her çalıştırma kendi kurumunu açar. |
| `npm run test:e2e` | `testler/e2e/`: üretim derlemesi üzerinde, 1920×1080 dokunmatik ekranda tahta akışı, cevabın gizli başlaması, adım adım çözüm ve şekil animasyonu, kalem, sayaç, 56 piksel dokunma hedefi, HTML kit açma ve içe aktarma, internet kesikken çalışma; ayrıca 4K ve telefon genişliği. |
| `src/veri/ornekSorular.test.ts` | Örnek soruların biçim kuralları ve her sayısal sonucun kodla yeniden hesaplanması. |
