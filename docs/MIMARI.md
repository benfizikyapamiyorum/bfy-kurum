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

## 5. Kimlik doğrulama planı (M2)

- Öğretmen ve yönetici: e-posta ve şifre (Supabase Auth).
- Öğrenci: kullanıcı adı ve şifre. Supabase Auth e-posta istediği için öğrenciye görünmeyen bir iç adres üretilir (`<kullanıcı-adı>@<kurum-kimliği>.ogrenci.invalid`). Öğrenciden gerçek e-posta alınmaz.
- Sınıf koduyla giriş: öğrenci sınıf kodunu ve kendi adını seçer, ardından şifresini girer.
- Hesap açma `service_role` yetkisi ister. Bu yüzden tek bir Supabase Edge Function (`kullanici-olustur`) kullanılır: çağıranın kurum yöneticisi olduğunu ve kontenjanı doğrular, ardından `auth.users` ve `kullanici` satırını birlikte açar. Uygulamanın geri kalanında sunucu kodu yoktur.

## 6. Çevrimdışı çalışma

- **Uygulama kabuğu:** `vite-plugin-pwa` (Workbox) tüm JavaScript, CSS ve yazı tiplerini önbelleğe alır. İnternet yokken uygulama açılır.
- **İçerik:** HTML kitler ve sorular uygulama kabuğuna girmez. Öğretmen "Tahtaya indir" ekranında haftaları seçer; seçilen içerik IndexedDB'ye yazılır. Veri katmanı önce ağı dener, ağ yoksa IndexedDB'deki kopyayı kullanır.
- **Senkronizasyon:** Çevrimdışıyken yapılan yazma işlemleri IndexedDB'deki bir kuyruğa eklenir ve internet gelince sırayla gönderilir. Her işlemin tekil kimliği vardır; sunucuda `upsert` ile yazıldığı için iki kez gönderilse de çift kayıt oluşmaz.

## 7. Marka ve yapılandırma

Ürün adı, sahip adı, web adresi, sosyal medya hesabı ve ana renk `src/yapilandirma/marka.json` içindedir. Kodda marka adı sabit yazılmaz. `index.html` başlığı ve PWA manifest'i de derleme sırasında bu dosyadan doldurulur.

## 8. Türkçe

- Sıralama `Intl.Collator('tr', { numeric: true })` ile yapılır: ç, ğ, ı, ö, ş, ü doğru yerde, "9-A" "10-A"dan önce gelir.
- Büyük/küçük harf dönüşümü `toLocaleUpperCase('tr-TR')` ile yapılır: i → İ, ı → I.
- Sayılar ondalık virgülle yazılır.
- Yazı tipi Inter. Latin ve Latin genişletilmiş alt kümeleri birlikte tüm Türkçe karakterleri içerir (fontTools ile denetlendi). Çevrimdışı önbelleğe yalnızca bu iki alt küme alınır.

## 9. Testler

| Komut | Kapsam |
|---|---|
| `npm test` | `src/**/*.test.ts`: net hesabı, cevap dizisi, soru tekrar etmeme ve otomatik test oluşturma, Türkçe sıralama. |
| `npm run test:db` | `testler/db/`: migration'lar gerçek bir Postgres'e uygulanır, Supabase'in `auth` ve `storage` şemaları taklit edilir, her rol için RLS davranışı denetlenir. |
| `npm run test:e2e` | `testler/e2e/`: tahta modu 1920×1080 ve dokunmatik ekranda (M1). |
