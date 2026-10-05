# Toplu içe aktarım biçimi

Süper admin, soru bankasını, konu anlatımlarını ve kazanım kataloğunu tek bir JSON dosyasıyla yükler:
**Süper admin > Toplu içe aktarım**. Dosya önce tarayıcıda doğrulanır, hatalar satır satır listelenir.
Hata yoksa önizleme gösterilir ve tek bir veritabanı işlemiyle (`toplu_ice_aktar` fonksiyonu) yazılır.

Temel kurallar:

- **Ya hep ya hiç.** Dosyadaki tek bir kayıt hatalıysa hiçbir kayıt yazılmaz.
- **Kopya oluşmaz.** Her soru ve içeriğin bir `dis_kimlik` değeri vardır. Aynı `dis_kimlik` ile yeniden yüklenen kayıt güncellenir. Ünite (sınıf + ünite no) ve kazanım (`kod`) için de aynı kural geçerlidir.
- **Elle yapılan düzeltmenin üzerine yazılır.** Panelde düzenlenen bir soru, aynı dosya yeniden yüklenirse dosyadaki hâline döner. Kalıcı düzeltmeyi kaynak dosyada yapın.
- **Yalnızca süper admin** içe aktarabilir. Bu kural veritabanında da denetlenir.
- Dosya UTF-8 olmalı. Başındaki BOM sorun çıkarmaz.

## Dosyanın iskeleti

```json
{
  "surum": 1,
  "kaynak": "Dosyanın nereden geldiğine dair kısa not.",
  "katalog": { "uniteler": [], "kazanimlar": [] },
  "sorular": [],
  "icerikler": []
}
```

`surum` zorunludur ve şimdilik `1` olur. Diğer bölümler isteğe bağlıdır.

## Katalog

Sistem 9-12. sınıf fizik kataloğuyla gelir. Dosya yalnızca eksik ünite ya da kazanımları ekler.
Mevcut bir kodu tekrar gönderirseniz metni ve sırası güncellenir.

```json
"katalog": {
  "uniteler": [
    { "ders": "FIZ", "seviye": "9", "no": 3, "ad": "Akışkanlar" }
  ],
  "kazanimlar": [
    {
      "kod": "FİZ.9.3.5",
      "metin": "Kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik deney yapabilme",
      "unite": { "seviye": "9", "no": 3 },
      "sira": 5
    }
  ]
}
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `ders` | Hayır | Ders kodu. Varsayılan `FIZ`. |
| `seviye` | Evet | `9`, `10`, `11`, `12`, `TYT` ya da `AYT`. |
| `no` | Evet | Ünite numarası (pozitif tam sayı). |
| `kod` | Evet | TYMM öğrenme çıktısı kodu, ör. `FİZ.11.1.3`. |
| `metin` | Evet | Öğrenme çıktısının resmî metni. |
| `sira` | Hayır | Ünite içindeki sıra. |

Yalnızca TYMM kodları ve resmî öğrenme çıktısı metinleri girilir. Ders kitabından metin, soru ya da şekil alınmaz.

## Sorular

```json
{
  "dis_kimlik": "fizik-atolye/kaldirma-kuvveti/S6",
  "tur": "coktan_secmeli",
  "govde": "Bir cisim dinamometreye asılıyor... <table>...</table>",
  "sekil_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 200\">...</svg>",
  "secenekler": [
    { "harf": "A", "metin": "3 N", "gerekce": "Dinamometrenin sudaki değeri kaldırma kuvveti değildir." },
    { "harf": "B", "metin": "..." },
    { "harf": "C", "metin": "..." },
    { "harf": "D", "metin": "2 N" },
    { "harf": "E", "metin": "..." }
  ],
  "dogru_cevap": "D",
  "cozum_adimlari": [
    "<strong>Veriyi fark et.</strong> Havadaki değer ağırlıktır.",
    { "metin": "<strong>Sonucu göster.</strong> $F_k = 5 - 3 = 2$ N." }
  ],
  "zorluk": 3,
  "baglam_temelli": true,
  "kazanimlar": ["FİZ.9.3.6"],
  "beceri": "Ölçümü yorumlama",
  "kavram_yanilgisi": "Dinamometrenin sudaki değerini kaldırma kuvveti sanmak.",
  "puanlama_olcutu": "Seçenek: 1 puan. Gerekçe: 2 puan.",
  "kaynak_notu": "İç not, öğrenciye gösterilmez.",
  "ornek": false,
  "yayinda": false
}
```

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `dis_kimlik` | Evet | Dosyalar arasında tekil kimlik. Önerilen biçim: `kaynak/konu/numara`. |
| `tur` | Evet | `coktan_secmeli`, `dogru_yanlis` ya da `acik_uclu`. |
| `govde` | Evet | Soru metni. HTML (`<p>`, `<strong>`, `<table>` vb.) ve KaTeX (`$...$`) kullanılabilir. |
| `sekil_svg` | Hayır | Tek bir `<svg>` öğesi. Betik ve olay özniteliği (`onclick` vb.) yasaktır. Gösterilmeden önce ayrıca temizlenir. |
| `secenekler` | Çoktan seçmelide evet | Tam 5 seçenek, harfleri sırasıyla A-E, metinleri birbirinden farklı. |
| `secenekler[].gerekce` | Hayır | "Bu şık neden yanlış?" açıklaması. Tahtada "Neden B değil?" düğmesiyle açılır. Doğru şıkta yazılmaz. |
| `dogru_cevap` | Evet | Çoktan seçmelide `A`-`E`, doğru/yanlışta `D` ya da `Y`, açık uçluda beklenen cevap. |
| `cozum_adimlari` | Hayır | Tahtada tek tek açılan adımlar. Düz metin ya da `{ "metin": ... }` olabilir. |
| `zorluk` | Evet | 1 (çok kolay) ile 5 (çok zor) arası tam sayı. |
| `baglam_temelli` | Hayır | Günlük yaşam ya da deney bağlamı varsa `true`. |
| `kazanimlar` | Evet | En az bir kazanım kodu. Kod katalogda ya da dosyanın katalog bölümünde olmalı. |
| `beceri` | Hayır | Ölçülen beceri. |
| `kavram_yanilgisi` | Hayır | Sorunun yokladığı yanılgı. Yalnızca öğretmen görür. |
| `puanlama_olcutu` | Hayır | Gerekçeli ya da açık uçlu cevap için ölçüt. |
| `kaynak_notu` | Hayır | İç not. Ürüne yansımaz. |
| `ornek` | Hayır | `true` ise giriş yapmadan da görünür ve "ÖRNEK" rozeti taşır. Varsayılan `false`. |
| `yayinda` | Hayır | Varsayılan `true`. Hakem denetimi bitmemiş soruları `false` yükleyin, panelden yayına alın. |

Soru yazım kuralları (hız ϑ, g = 10 m/s², ondalık virgül, "·" yerine "×", her cümle noktayla biter) dosyada da geçerlidir.
Doğrulayıcı gövdede "·" görürse uyarır.

## İçerikler

İki çeşit içerik vardır.

**Yapılandırılmış konu anlatımı.** Tahtada başlık başlık, büyük yazı ve şekille gösterilir. İsteğe bağlı ders akışı yalnızca öğretmenin açtığı panelde durur.

```json
{
  "dis_kimlik": "fizik-atolye/kaldirma-kuvveti/konu",
  "tur": "konu_anlatimi",
  "baslik": "Kaldırma kuvveti: kavram rehberi",
  "aciklama": "Şekilli kavram başlıkları ve ders akışı.",
  "unite": { "seviye": "9", "no": 3 },
  "sira": 1,
  "kazanimlar": ["FİZ.9.3.5", "FİZ.9.3.6"],
  "veri": {
    "bolumler": [
      { "baslik": "Kaldırma kuvveti nedir?", "metin": "Sıvıların...", "sekil_svg": "<svg ...>...</svg>" }
    ],
    "planlar": {
      "40": [{ "time": "0-5 dk", "title": "Ön kontrol", "body": "..." }],
      "80": [{ "time": "0-10 dk", "title": "Ön kontrol ve gerekçe", "body": "..." }]
    }
  },
  "yayinda": true
}
```

**HTML hafta kiti.** Kendi başına çalışan tek bir HTML dosyasıdır. Dosyayı **Süper admin > İçerikler > HTML kit yükle** ile yüklemek daha kolaydır.
JSON ile bağlamak için `html_yolu` alanına Storage `icerik` kovasındaki yolu (ör. `kitler/11/1-hafta.html`) ya da uygulamayla yayınlanan bir dosyanın yolunu (`/ornek/...`) yazın.

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `dis_kimlik` | Evet | Tekil kimlik. |
| `tur` | Evet | `konu_anlatimi`, `hafta_kiti` ya da `sunum`. |
| `baslik` | Evet | Listede görünen ad. |
| `unite` | Hayır | `{ "seviye": "9", "no": 3 }`. Boşsa içerik hiçbir ünitede listelenmez. |
| `hafta`, `sira` | Hayır | Ünite içindeki sıralama. |
| `veri` | `html_yolu` yoksa evet | `bolumler` en az bir `{ baslik, metin }` içerir. `sekil_svg` isteğe bağlıdır. |
| `html_yolu` | `veri` yoksa evet | Kit dosyasının yolu. |
| `meb_baglanti` | Hayır | İlgili MEB kaynağının bağlantısı. İçerik kopyalanmaz. |
| `ornek`, `yayinda` | Hayır | Sorulardakiyle aynı. |

## Örnek dosya ve dönüştürücü

`icerik-paketleri/kaldirma-kuvveti.json` eksiksiz bir örnektir: 9. sınıf kaldırma kuvveti, 12 soru ve 1 konu anlatımı içerir.
Dosya, Fizik Atölye pilot paketinden şu komutla üretilir:

```bash
npx tsx scripts/atolye-paketi-donustur.ts
```

Dönüştürücü pakete bağımsız hakem incelemesinin düzeltmelerini uygular. Düzeltmeler betiğin başında listelidir.
Sonucu aynı doğrulayıcıyla denetler ve şekil ilkellerini dolgulu SVG'ye çevirir.

### Pilot paketin hakem durumu

Hakem 12 sorunun anahtarlarını ve sayılarını bağımsız çözdü, hepsi doğru çıktı. Aşağıdaki sorular şekil ya da kurgu düzeyinde değişiklik bekliyor. Bu nedenle `yayinda: false` aktarılır:

| Soru | Açık bulgu |
|---|---|
| S5 | Kapalı balon suda serbestçe asılı çizilmiş, oysa batmaz, yükselir. Bir ağırlığa bağlı çizilmeli. 200 → 120 cm³ küçülme yaklaşık 7 m derinlik ister; soru metni ve şekil bunu göstermeli. |
| S7 | Model tekne kurgusu ve şekli S2 ile neredeyse aynı. Farklı bir kurgu gerekiyor (ör. oyuncak sal, 320 g + 80 g; cevap %25 kalır). |
| S12 | S5 ile aynı balon kurgusu ve şekli, biri diğerinin cevabını veriyor. Farklı bir cisim gerekiyor (ör. derinde ezilen ince plastik şişe). |

Yazım ve küçük şekil önerileri (S1 şekil ölçeği, S11 taşırma ağzındaki su seviyesi) de kaynak pakette düzeltilmeli.
Ders akışı metinleri soruları pilot paketteki numaralarıyla (S4, S6...) anıyor; paketin soru sırası korunduğu sürece bu tutarlıdır.

## Sık görülen hatalar

| Mesaj | Çözüm |
|---|---|
| `"FİZ.9.9.9" kazanımı katalogda yok` | Kodu düzeltin ya da dosyanın `katalog.kazanimlar` bölümüne ekleyin. |
| `dis_kimlik "..." dosyada iki kez geçiyor` | Her soruya ayrı kimlik verin. |
| `çoktan seçmeli soruda tam 5 seçenek olmalı` | A-E arası beş seçenek yazın. |
| `sekil_svg betik ya da olay özniteliği içeremez` | `onload`, `onclick`, `<script>` gibi parçaları silin. Animasyon için `data-ciz-*` öznitelikleri kullanılır. |
| `Desteklenmeyen dosya sürümü` | `"surum": 1` ekleyin. |
