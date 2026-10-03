# Fizik Kurs Sistemi

Tek şubeli özel öğretim kursları için fizik eğitim platformu: akıllı tahtada ders anlatımı, kazanım etiketli soru bankası, test ve deneme hazırlama, sonuç raporları.

Ürün adı ve marka bilgileri `src/yapilandirma/marka.json` dosyasından gelir. Ürün adı kesinleşince yalnızca bu dosya değişir.

- Ürün tanımı: [`docs/URUN.md`](docs/URUN.md)
- Teknik mimari: [`docs/MIMARI.md`](docs/MIMARI.md)

---

## Hızlı bakış: hiçbir kurulum yapmadan denemek

Uygulama, Supabase bilgileri girilmeden de açılır. Bu durumda **yerel deneme modunda** çalışır: örnek sorular ve bu tarayıcıya yüklediğiniz HTML kitler kullanılır. Tahta modunu denemek için yeterlidir. Giriş, kurum, test ve rapor özellikleri Supabase bağlandıktan sonra çalışır.

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

Giriş ekranı M2 aşamasında gelecek.

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

Gerekenler: [Node.js 22](https://nodejs.org) ve Git.

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
| `npm run lint` | Kod denetimi. |
| `npm run seed:uret` | `src/veri/` altındaki kataloğu SQL tohum dosyasına dönüştürür. |

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
| M1 | Tahta modu, örnek içerik, HTML kit içe aktarma, çevrimdışı önbellek. | Sırada. |
| M2 | Giriş sistemi, roller, çok kiracılı yapı, kurum paneli. | Bekliyor. |
| M3 | Test/deneme oluşturucu, PDF çıktıları, online çözüm, elle sonuç girişi, net hesabı. | Bekliyor. |
| M4 | Raporlar ve telafi testi. | Bekliyor. |
| M5 | Süper admin paneli, lisans yönetimi, toplu içe aktarım. | Bekliyor. |
| M6 | Demo kurum, Netlify yayını, son kontroller. | Bekliyor. |
