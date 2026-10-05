# Fizik Kurs Sistemi

Tek şubeli özel öğretim kursları için fizik eğitim platformu: akıllı tahtada ders anlatımı, kazanım etiketli soru bankası, test ve deneme hazırlama, sonuç raporları.

Ürün adı ve marka bilgileri `src/yapilandirma/marka.json` dosyasından gelir. Ürün adı kesinleşince yalnızca bu dosya değişir.

- Ürün tanımı: [`docs/URUN.md`](docs/URUN.md)
- Teknik mimari: [`docs/MIMARI.md`](docs/MIMARI.md)

---

## Hızlı bakış: hiçbir kurulum yapmadan denemek

Uygulama, Supabase bilgileri girilmeden de açılır. Bu durumda **yerel deneme modunda** çalışır: örnek sorular ve bu tarayıcıya yüklediğiniz HTML kitler kullanılır. Tahta modunu denemek için yeterlidir. Giriş, kurum, test ve rapor özellikleri Supabase bağlandıktan sonra çalışır.

### Tahta modunu deneme listesi

1. Ana sayfada **Tahta modunu aç** düğmesine dokunun. Sınıf, ünite ve soru seçin. 9, 10 ve 11. sınıfta "ÖRNEK" rozetli 10 soru var.
2. Soru ekranında cevap gizlidir. **Cevabı göster** ile açın. Bir şıkka dokunursanız sınıfın tahmini işaretlenir; cevap açılınca doğru şık yeşil olur.
3. **Çözümü başlat** ve **Sonraki adım** ile çözümü adım adım açın. Şekilli sorularda her adım şekildeki ilgili çizimi canlandırır. En iyi örnekler: 9. sınıf vektör sorusu, 10. sınıf hız-zaman grafiği, 11. sınıf serbest düşme ve yatay atış.
4. Üst çubuktaki **kalem** ile soru üzerine çizin; silgi, geri al ve temizle düğmeleri alttaki çubuktadır.
5. **Yüksek kontrast** ve **tam ekran** düğmeleri de üst çubuktadır. Sayaç her soruda sıfırdan başlar.
6. Kurum logosunu denemek için **Ayarlar** → **Kurum logosu** ile bir resim seçin. Logo tahtanın sağ üst köşesinde görünür.
7. **Kit içe aktar** ekranından kendi tek dosyalık HTML kitlerinizi yükleyin, sınıf, ünite ve haftaya bağlayın. Tahtada ilgili ünitede açılır. 9. sınıf, Kuvvet ve Hareket ünitesinde örnek bir kit de var.
8. **Tahtaya indir** ekranında haftaları ve soru setlerini seçip indirin. Ardından interneti kesin: indirilenler açılmaya devam eder. (Çevrimdışı çalışma yayınlanmış sürümde ya da `npm run build && npm run preview` ile denenir.)

---

## 1. Supabase kurulumu (veritabanı, giriş, dosya deposu)

Supabase ücretsiz planla başlanabilir. Bu ürün için **ayrı ve yeni bir proje** açın.

1. [supabase.com](https://supabase.com) adresine girin ve hesabınızla oturum açın.
2. **New project** düğmesine basın.
3. Alanları doldurun:
   - **Name:** Kurumu tanıyacağınız bir ad, örneğin `fizik-kurs`.
   - **Database Password:** Güçlü bir şifre üretin ve bir yere kaydedin.
   - **Region:** **Central EU (Frankfurt)** seçin. KVKK için veriler Avrupa Birliği'nde kalmalıdır.
4. **Create new project** düğmesine basın ve proje hazırlanana kadar 1-2 dakika bekleyin.

### 1.1. Veritabanı tablolarını oluşturmak

Repodaki `supabase/migrations/` klasöründe numaralı SQL dosyaları vardır. Bunlar **sırayla** çalıştırılır.

**Yol A: Supabase panelinden (teknik bilgi gerekmez)**

1. Sol menüden **SQL Editor** açın.
2. **New query** ile boş bir sorgu açın.
3. `supabase/migrations/` klasöründeki ilk dosyanın (adı en küçük tarihle başlayan) tüm içeriğini kopyalayıp yapıştırın.
4. **Run** düğmesine basın. "Success" yazısını görün.
5. Aynı işlemi sıradaki her dosya için tekrarlayın. Sıra dosya adındaki tarih-saat numarasıdır.

Bir dosya hata verirse sonrakilere geçmeyin; hata mesajını kaydedin.

**Yol B: Supabase komut satırı aracıyla**

```bash
npx supabase login
npx supabase link --project-ref <proje-kimliği>
npx supabase db push
```

Proje kimliği, proje adresindeki `https://<proje-kimliği>.supabase.co` kısmıdır.

### 1.2. Bağlantı bilgilerini almak

1. Sol menüden **Project Settings** açın, ardından **API Keys** (eski arayüzde **API**) bölümüne girin.
2. İki bilgiyi kopyalayın:
   - **Project URL:** `https://xxxx.supabase.co` biçimindedir. Bazı arayüzlerde **Data API** sayfasında görünür.
   - **Publishable key** (`sb_publishable_` ile başlar) ya da eski arayüzdeki **anon public** anahtar.

Bu anahtar tarayıcıda görünür ve paylaşılması güvenlidir: verileri satır düzeyi güvenlik (RLS) politikaları korur.
**`service_role` / `secret` anahtarını asla uygulamaya, `.env` dosyasına ya da Netlify'a yazmayın.**

### 1.3. İlk süper admin hesabı

1. Supabase panelinde **Authentication** → **Users** → **Add user** → **Create new user** yolunu izleyin.
2. E-posta ve şifrenizi girin, **Auto Confirm User** seçeneğini işaretleyin.
3. Oluşan kullanıcının **UID** değerini kopyalayın.
4. **SQL Editor** içinde şunu çalıştırın (UID ve ad soyad kısmını değiştirin):

```sql
insert into public.kullanici (id, kurum_id, rol, ad_soyad)
values ('BURAYA-UID', null, 'superadmin', 'Ad Soyad');
```

Artık `/giris` sayfasından bu e-posta ve şifreyle girebilirsiniz.

### 1.4. Hesap açma işlevini yayınlamak (bir kez)

Öğretmen ve öğrenci hesaplarını açan küçük sunucu işlevi (`supabase/functions/kullanici`) Supabase'e yüklenmelidir. Bilgisayarınızda bir kez şu komutları çalıştırın:

```bash
npx supabase login
npx supabase link --project-ref <proje-kimliği>
npx supabase functions deploy kullanici
```

İşlev, Supabase'in kendi gizli anahtarını sunucuda kullanır; sizin ayrıca anahtar girmeniz gerekmez.

### 1.5. Giriş ayarları

Supabase panelinde **Authentication** → **Sign In / Providers** bölümünde:

- **Allow new users to sign up** kapalı olsun. Hesapları yalnızca kurum yöneticisi ve süper admin açar.
- **Email** sağlayıcısı açık kalsın, **Confirm email** kapalı olsun.

### 1.6. İlk kurumu açmak (süper admin paneli gelene kadar)

M5 aşamasında süper admin paneli gelecek. O zamana kadar ilk kurum SQL Editor'da açılır:

```sql
insert into public.kurum (ad, kod, lisans_baslangic, lisans_bitis, ogretmen_limiti, ogrenci_limiti)
values ('Örnek Eğitim Kursu', 'ORNEK', current_date, current_date + 365, 5, 100)
returning id;
```

Ardından 1.3'teki gibi Authentication'da kurs sahibine bir kullanıcı açın ve şunu çalıştırın:

```sql
insert into public.kullanici (id, kurum_id, rol, ad_soyad, eposta)
values ('KULLANICI-UID', 'KURUM-ID', 'kurum_yonetici', 'Ad Soyad', 'eposta@ornek.com');
```

Kurs sahibi giriş yapınca **Kurum paneli** açılır: öğretmen ve öğrenci ekler (tek tek ya da Excel/CSV ile), sınıf açar, logo yükler, giriş kartlarını yazdırır.

### 1.7. Öğrenci girişi nasıl çalışır?

Öğrenci giriş ekranında **kurum kodunu** (ör. ORNEK) ya da **sınıf kodunu**, kendi **kullanıcı adını** ve **şifresini** yazar. Öğrenciden e-posta istenmez. Unutulan şifreyi kurum yöneticisi panelden sıfırlar.

---

## 2. Netlify kurulumu (yayına alma)

1. [app.netlify.com](https://app.netlify.com) adresine GitHub hesabınızla girin.
2. **Add new site** → **Import an existing project** → **GitHub** yolunu izleyin.
3. Bu repoyu (`bfy-kurum`) seçin. Derleme ayarları `netlify.toml` dosyasından otomatik gelir; hiçbir alanı değiştirmeyin.
4. **Deploy** düğmesine basın. İlk yayın birkaç dakika sürer.
5. Supabase'i bağlamak için **Site configuration** → **Environment variables** → **Add a variable** yolunu izleyin ve iki değişken ekleyin:

| Değişken adı | Değeri |
|---|---|
| `VITE_SUPABASE_URL` | 1.2'de kopyaladığınız Project URL |
| `VITE_SUPABASE_ANON_KEY` | 1.2'de kopyaladığınız publishable / anon anahtar |

6. **Deploys** sekmesinde **Trigger deploy** → **Deploy site** ile yeniden yayınlayın. Değişkenler ancak yeni yayında etkili olur.
7. Kendi alan adınızı bağlamak için **Domain management** bölümünü kullanın.

---

## 3. Bilgisayarda çalıştırmak (geliştirici için)

Gerekenler: [Node.js 22](https://nodejs.org) ve Git. Giriş ve kurum özelliklerini bilgisayarda denemek için ayrıca [Docker](https://www.docker.com).

Yerel Supabase ile tam deneme:

```bash
npx supabase start           # yerel veritabanı, giriş ve dosya sunucusu (ilk açılış birkaç dakika sürer)
npm run supabase:tohum       # deneme hesapları
# .env.local dosyasına: VITE_SUPABASE_URL=http://127.0.0.1:54321 ve
# VITE_SUPABASE_ANON_KEY=<npx supabase status çıktısındaki Publishable key>
npm run dev
```

```bash
git clone <repo-adresi>
cd bfy-kurum
npm install
cp .env.example .env      # Supabase bilgilerini isterseniz .env dosyasına yazın
npm run dev               # http://localhost:5173 adresinde açılır
```

Akıllı tahtadan denemek için aynı ağdaki tahtanın tarayıcısında `npm run dev -- --host` ile açılan adresi kullanın. Çevrimdışı çalışma yalnızca yayınlanmış (Netlify) sürümde ya da `npm run build && npm run preview` ile denenebilir.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusunu açar. |
| `npm run build` | Yayına hazır sürümü `dist/` klasörüne üretir. |
| `npm run preview` | Üretilen sürümü yerelde açar (service worker dahil). |
| `npm test` | Birim testleri (net hesabı, soru tekrar etmeme, Türkçe sıralama...). |
| `npm run test:db` | Veritabanı ve RLS testleri. Önce `bash scripts/yerel-db.sh` ile yerel Postgres başlatılır, ardından `DATABASE_URL=postgresql://postgres@localhost:54329/postgres npm run test:db`. |
| `npm run test:e2e` | Tahta modu uçtan uca testleri (1920×1080, dokunmatik). |
| `npm run test:e2e:sunucu` | Giriş, kurum paneli, hesap açma testleri. Önce `npx supabase start` ile yerel Supabase başlatılır (Docker gerekir). |
| `npm run supabase:tohum` | Yerel Supabase'e deneme hesapları açar: admin@ornek.test, yonetici@atlas.test, ogretmen@atlas.test (şifre: deneme123), kurum kodu ATLAS. |
| `npm run lint` | Kod denetimi. |
| `npm run seed:uret` | `src/veri/` altındaki kataloğu ve örnek içeriği SQL tohum dosyalarına dönüştürür. |

---

## 4. Ortam değişkenleri

Tam liste `.env.example` dosyasındadır.

| Değişken | Zorunlu mu | Açıklama |
|---|---|---|
| `VITE_SUPABASE_URL` | Hayır | Supabase proje adresi. Boşsa yerel deneme modu. |
| `VITE_SUPABASE_ANON_KEY` | Hayır | Supabase publishable / anon anahtarı. Boşsa yerel deneme modu. |

---

## 5. Aşamalar

| Aşama | İçerik | Durum |
|---|---|---|
| M0 | Proje iskeleti, kurulum rehberi, mimari, veritabanı şeması ve RLS. | Tamamlandı. |
| M1 | Tahta modu, örnek içerik, HTML kit içe aktarma, çevrimdışı önbellek. | Tamamlandı. |
| M2 | Giriş sistemi, roller, çok kiracılı yapı, kurum paneli. | Tamamlandı. |
| M3 | Test/deneme oluşturucu, PDF çıktıları, online çözüm, elle sonuç girişi, net hesabı. | Bekliyor. |
| M4 | Raporlar ve telafi testi. | Bekliyor. |
| M5 | Süper admin paneli, lisans yönetimi, toplu içe aktarım. | Bekliyor. |
| M6 | Demo kurum, Netlify yayını, son kontroller. | Bekliyor. |
