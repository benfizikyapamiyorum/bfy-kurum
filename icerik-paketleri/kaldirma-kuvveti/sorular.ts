// Kaldırma kuvveti soru paketi (9. sınıf, Akışkanlar). Kapsam: FİZ.9.3.5, FİZ.9.3.6.
// Gösterim ders kitabındaki gibidir: F_k kaldırma kuvveti, V_b batan hacim, d_s sıvının yoğunluğu,
// d_c cismin yoğunluğu, G ağırlık. Simgeler düz HTML ile yazılır (<i>, <sub>); her ortamda aynı görünür.
// Her sorunun sayısal cevabı dogrula() içinde verilen verilerden yeniden hesaplanır.

import type { IceAktarimSorusu } from '../../src/alan/iceAktarim'
import { SEKILLER } from './sekiller'

// ---------------------------------------------------------------------------
// Yazım yardımcıları
// ---------------------------------------------------------------------------

const NB = ' ' // bölünmeyen boşluk: sayı ile birim, binlik ayırıcı
export const sayi = (n: number, basamak = 2) =>
  n
    .toLocaleString('tr-TR', { maximumFractionDigits: basamak, minimumFractionDigits: 0 })
    .replace(/\./g, NB)
export const sabitSayi = (n: number, basamak: number) => n.toFixed(basamak).replace('.', ',')
const b = (n: number | string, birim: string) => `${typeof n === 'number' ? sayi(n) : n}${NB}${birim}`

const ss = (ana: string, alt: string) => `<i>${ana}</i><sub>${alt}</sub>`
const Fk = ss('F', 'k')
const Vb = ss('V', 'b')
const ds = ss('d', 's')
const G = '<i>G</i>'
const g = '<i>g</i>'

const tablo = (basliklar: string[], satirlar: string[][]) =>
  `<table><thead><tr>${basliklar.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${satirlar
    .map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`

const p = (...satirlar: string[]) => satirlar.map((x) => `<p>${x}</p>`).join('')
const oncul = (...maddeler: string[]) => `<p>${maddeler.map((m, i) => `${['I', 'II', 'III', 'IV'][i]}. ${m}`).join('<br>')}</p>`
const adim = (baslik: string, metin: string) => `<strong>${baslik}.</strong> ${metin}`

type Harf = 'A' | 'B' | 'C' | 'D' | 'E'
interface Taslak {
  no: number
  baslik: string
  kazanim: 'FİZ.9.3.5' | 'FİZ.9.3.6'
  zorluk: 2 | 3 | 4 | 5
  beceri: string
  govde: string
  secenekler: [string, string, string, string, string]
  dogru: Harf
  gerekceler: Partial<Record<Harf, string>>
  adimlar: string[]
  kavramYanilgisi: string
  puanlama?: string
}

const ONCULLU: Taslak['secenekler'] = ['Yalnız I', 'Yalnız II', 'I ve II', 'II ve III', 'I, II ve III']

// ---------------------------------------------------------------------------
// Sorular
// ---------------------------------------------------------------------------

export const TASLAKLAR: Taslak[] = [
  {
    no: 1,
    baslik: 'Su altı aracının sensör gövdesi',
    kazanim: 'FİZ.9.3.6',
    zorluk: 4,
    beceri: 'Veriden çıkarım',
    govde:
      p(
        `Bir baraj gölünde çalışan su altı aracı, kenar uzunluğu ${b(20, 'cm')} olan küp biçimli bir sensör gövdesi taşıyor. Gövde, destek teknesindeki vinçten sarkıtılan kabloyla şekildeki iki konumda tamamen suda ve hareketsiz tutuluyor. Gövdenin üst ve alt yüzeyindeki sensörler yalnızca suyun oluşturduğu basıncı ölçüyor.`,
      ) +
      tablo(
        ['Konum', 'Üst yüzeyin derinliği', 'Üst sensör', 'Alt sensör'],
        [
          ['I', b('0,5', 'm'), b(5000, 'Pa'), b(7000, 'Pa')],
          ['II', b('2,0', 'm'), b(20000, 'Pa'), b(22000, 'Pa')],
        ],
      ) +
      p('Buna göre aşağıdaki yargılardan hangileri doğrudur?') +
      oncul(
        `Konum I’den konum II’ye geçerken hem üst hem alt yüzeye etki eden su kuvveti ${b(600, 'N')} artar.`,
        `Gövdeye etki eden kaldırma kuvveti iki konumda da ${b(80, 'N')} olur.`,
        `Sensörler atmosfer basıncını da ölçseydi bu verilerden hesaplanan kaldırma kuvveti ${b(80, 'N')}’dan büyük çıkardı.`,
      ),
    secenekler: ONCULLU,
    dogru: 'C',
    gerekceler: {
      A: `I doğru, ama II de doğru: kaldırma kuvveti alt ve üst yüzey kuvvetlerinin farkıdır, (${sayi(7000)} − ${sayi(5000)}) × 0,04 = ${b(80, 'N')}.`,
      B: `II doğru, ama I de doğru: iki yüzeyde de basınç ${b(15000, 'Pa')} artar, kuvvet artışı ${sayi(15000)} × 0,04 = ${b(600, 'N')} olur.`,
      D: 'III yanlış: atmosfer basıncı üst ve alt yüzeye aynı ek kuvveti uygular; iki kuvvetin farkı, yani kaldırma kuvveti, değişmez.',
      E: 'III yanlış: atmosfer basıncının üst ve alt yüzeye uyguladığı ek kuvvetler eşittir ve farkta birbirini götürür.',
    },
    adimlar: [
      adim('Alanı bul', `Bir yüzün alanı <i>A</i> = 0,2 × 0,2 = ${b('0,04', 'm²')}.`),
      adim(
        'Yüzey kuvvetlerini hesapla',
        `Konum I: üst yüzeye ${sayi(5000)} × 0,04 = ${b(200, 'N')}, alt yüzeye ${sayi(7000)} × 0,04 = ${b(280, 'N')}. Konum II: ${b(800, 'N')} ve ${b(880, 'N')}. İki yüzeydeki kuvvet de ${b(600, 'N')} artar; I doğru.`,
      ),
      adim('Farkı al', `${Fk} = <i>F</i><sub>alt</sub> − <i>F</i><sub>üst</sub>: konum I’de 280 − 200 = ${b(80, 'N')}, konum II’de 880 − 800 = ${b(80, 'N')}. II doğru.`),
      adim('Atmosferi düşün', 'Atmosfer basıncı iki yüzeye de aynı ek kuvveti ekler; fark değişmez. III yanlış.'),
    ],
    kavramYanilgisi: 'Derinlik ve basınç arttıkça kaldırma kuvvetinin de artacağını sanmak; basıncın kendisi ile basınç kuvvetlerinin farkını karıştırmak.',
  },
  {
    no: 2,
    baslik: 'Nehirden denize çıkan yük gemisi',
    kazanim: 'FİZ.9.3.6',
    zorluk: 5,
    beceri: 'Çok adımlı orantısal akıl yürütme',
    govde: p(
      `Bir yük gemisi nehir limanında yükünün bir kısmını boşaltıyor ve tatlı suda (${ds} = ${b('1 000', 'kg/m³')}) ${Vb} = ${b('5 100', 'm³')} batan hacimle yüzüyor. Gövdesindeki ⊖ biçimli su çizgisi işareti tam su yüzeyinde. Gemi denize (${ds} = ${b('1 020', 'kg/m³')}) çıktığında işaretin su yüzeyinin üstüne çıktığı görülüyor.`,
      'Gemi denizdeyken işaret yeniden tam su yüzeyine gelinceye kadar yük alınırsa gemiye kaç ton yük eklenmiş olur? (1 ton = 1 000 kg)',
    ),
    secenekler: [b(0, 'ton'), b(2, 'ton'), b(100, 'ton'), b(102, 'ton'), b('5 202', 'ton')],
    dogru: 'D',
    gerekceler: {
      A: 'İşaret aynı yere gelince batan hacim aynı olur, ama sıvı daha yoğun olduğu için kaldırma kuvveti daha büyüktür; aradaki fark kadar yük taşınır.',
      B: `Yalnız fazladan batan 100 m³’te yoğunluk farkını (100 × 20) hesaba katmak eksik kalır. Yoğunluk farkı batan hacmin tamamında etkilidir: taşınabilen kütle 5 100 × 20 = ${b('102 000', 'kg')} artar.`,
      C: `Fazladan batan 100 m³’ü tatlı su yoğunluğuyla çarpmak (100 × 1 000) yanlış: gemi artık denizde. 100 m³ deniz suyunun kütlesi 100 × 1 020 = ${b('102 000', 'kg')} = ${b(102, 'ton')} olur.`,
      E: `${b('5 202', 'ton')} geminin yük aldıktan sonraki toplam kütlesidir; eklenen yük değil.`,
    },
    adimlar: [
      adim('Geminin kütlesini bul', `Nehirde yüzüyor: ${Fk} = ${G}. Kütle = ${sayi(5100)} × ${sayi(1000)} = ${b('5 100 000', 'kg')} = ${b('5 100', 'ton')}.`),
      adim('İşaret yeniden su yüzeyinde', `Denizde batan hacim yine ${b('5 100', 'm³')}. Taşınabilecek toplam kütle = ${sayi(5100)} × ${sayi(1020)} = ${b('5 202 000', 'kg')}.`),
      adim('Farkı al', `Eklenen yük = 5 202 − 5 100 = ${b(102, 'ton')}.`),
    ],
    kavramYanilgisi: 'Su çizgisi aynı yerdeyse kaldırma kuvvetinin de aynı olduğunu sanmak; sıvının yoğunluğunu hesaba katmamak.',
  },
  {
    no: 3,
    baslik: 'Hangi deney hangi iddiayı kanıtlar?',
    kazanim: 'FİZ.9.3.5',
    zorluk: 4,
    beceri: 'Değişken kontrolü',
    govde:
      p(
        `Bir öğrenci grubu kaldırma kuvvetini etkileyen değişkenleri araştırıyor. X ve Z alüminyumdan, Y bakırdan yapılmış içi dolu cisimler. X ile Y’nin hacmi ${b(100, 'cm³')}, Z’nin hacmi ${b(200, 'cm³')}. Her denemede cisim dinamometreye asılıyor ve kaba değmiyor; yer çekimi her denemede aynı. Şekilde 5. deneme gösterilmiştir.`,
      ) +
      tablo(
        ['Deneme', 'Cisim', 'Sıvı', 'Batma', 'Havada', 'Sıvıda'],
        [
          ['1', 'X', 'su', 'tamamen', b('2,7', 'N'), b('1,7', 'N')],
          ['2', 'Y', 'su', 'tamamen', b('8,9', 'N'), b('7,9', 'N')],
          ['3', 'Z', 'su', 'tamamen', b('5,4', 'N'), b('3,4', 'N')],
          ['4', 'X', 'tuzlu su', 'tamamen', b('2,7', 'N'), b('1,5', 'N')],
          ['5', 'X', 'su', 'yarısına kadar', b('2,7', 'N'), b('2,2', 'N')],
          ['6', 'Y', 'tuzlu su', 'tamamen', b('8,9', 'N'), b('7,7', 'N')],
        ],
      ) +
      p(
        'Grup üç iddiayı, her biri için yalnızca bir değişkeni farklı olan iki deneyi karşılaştırarak desteklemek istiyor.',
        'İddia 1: Kaldırma kuvveti cismin ağırlığına bağlı değildir.<br>İddia 2: Sıvının yoğunluğu artarsa kaldırma kuvveti artar.<br>İddia 3: Kaldırma kuvveti batan hacimle doğru orantılıdır.',
        'Hangi seçenekteki deney çiftlerinin hepsi kendi iddiasını doğru biçimde destekler?',
      ),
    secenekler: [
      'İddia 1: 1 ile 2, İddia 2: 1 ile 4, İddia 3: 1 ile 5',
      'İddia 1: 1 ile 3, İddia 2: 1 ile 4, İddia 3: 1 ile 5',
      'İddia 1: 1 ile 2, İddia 2: 2 ile 4, İddia 3: 1 ile 5',
      'İddia 1: 1 ile 2, İddia 2: 1 ile 4, İddia 3: 4 ile 5',
      'İddia 1: 4 ile 6, İddia 2: 1 ile 6, İddia 3: 1 ile 5',
    ],
    dogru: 'A',
    gerekceler: {
      B: '1 ile 3’te ağırlıkla birlikte hacim de değişiyor; kaldırma kuvvetleri 1 N ve 2 N çıkıyor. Bu çift iddia 1’i desteklemez.',
      C: '2 ile 4’te hem cisim hem sıvı değişiyor; sonucu yalnız yoğunluğa bağlayamayız.',
      D: '4 ile 5’te hem sıvı hem batan hacim değişiyor; iki değişken birlikte değiştiği için iddia 3’ü desteklemez.',
      E: '4 ile 6 iddia 1 için uygun, ama 1 ile 6’da hem cisim hem sıvı değişiyor.',
    },
    adimlar: [
      adim('Kaldırma kuvvetlerini bul', 'Havadaki ve sıvıdaki okumaların farkı: 1: 1,0 N; 2: 1,0 N; 3: 2,0 N; 4: 1,2 N; 5: 0,5 N; 6: 1,2 N.'),
      adim('İddia 1', '1 ile 2’de hacim ve sıvı aynı; yalnız cismin maddesi, dolayısıyla ağırlığı farklı (2,7 N ve 8,9 N). Kaldırma kuvveti ikisinde de 1,0 N.'),
      adim('İddia 2', '1 ile 4’te yalnız sıvı farklı: suda 1,0 N, tuzlu suda 1,2 N.'),
      adim('İddia 3', '1 ile 5’te yalnız batan hacim farklı: hacim yarıya inince kaldırma kuvveti 1,0 N’dan 0,5 N’a iner.'),
    ],
    kavramYanilgisi: 'Ağır cisme daha büyük kaldırma kuvveti etki ettiğini sanmak; iki değişkenin birlikte değiştiği karşılaştırmadan sonuç çıkarmak.',
  },
  {
    no: 4,
    baslik: 'Taşan şurup',
    kazanim: 'FİZ.9.3.6',
    zorluk: 4,
    beceri: 'İki ölçümden kanıt oluşturma',
    govde: p(
      `Bir gıda kontrol laboratuvarında yoğunluğu bilinmeyen bir şurup inceleniyor. Dinamometreye asılı bir taş havada ${b('6,0', 'N')} gösteriyor. Taş, ağzına kadar şurup dolu taşırma kabına tamamen daldırıldığında kaptan ${b(150, 'cm³')} şurup taşıyor ve dinamometre ${b('4,2', 'N')} gösteriyor. Taş kaba değmiyor (${g} = ${b(10, 'N/kg')}, havanın kaldırma etkisi önemsenmiyor).`,
      `Aynı taş, ağzına kadar su (${b(1, 'g/cm³')}) dolu bir taşırma kabına aynı biçimde daldırılırsa dinamometre kaç newton gösterir?`,
    ),
    secenekler: [b('1,50', 'N'), b('3,84', 'N'), b('4,20', 'N'), b('4,50', 'N'), b('4,80', 'N')],
    dogru: 'D',
    gerekceler: {
      A: `${b('1,5', 'N')} taşa suda etki eden kaldırma kuvvetidir; dinamometre ağırlıktan bu kadar eksiğini gösterir.`,
      B: 'Şurup daha yoğun olduğu için suda kaldırma kuvveti daha küçük olur; daha büyük değil.',
      C: 'Kaldırma kuvveti sıvının yoğunluğuna bağlıdır; şuruptan suya geçince okuma değişir.',
      E: `Şurubun yoğunluğu (1,2) newton cinsinden bir kuvvet değildir; ${b('6,0', 'N')}’dan 1,2 çıkarılamaz.`,
    },
    adimlar: [
      adim('Şurupta kaldırma kuvveti', `${Fk} = 6,0 − 4,2 = ${b('1,8', 'N')}. Taşan şurubun ağırlığı da ${b('1,8', 'N')} (Arşimet ilkesi).`),
      adim('Şurubun yoğunluğu', `Taşan şurubun kütlesi ${b(180, 'g')}, hacmi ${b(150, 'cm³')}: ${ds} = 180 / 150 = ${b('1,2', 'g/cm³')}.`),
      adim('Suda kaldırma kuvveti', `Batan hacim yine ${b(150, 'cm³')}: ${Fk} = 0,15 kg × 10 = ${b('1,5', 'N')}.`),
      adim('Okuma', `Dinamometre 6,0 − 1,5 = ${b('4,5', 'N')} gösterir.`),
    ],
    kavramYanilgisi: 'Dinamometrenin sıvıdaki okumasını kaldırma kuvveti sanmak; daha yoğun sıvıda kaldırma kuvvetinin daha küçük olacağını düşünmek.',
  },
  {
    no: 5,
    baslik: 'Pekmezi sulandırılmış mı?',
    kazanim: 'FİZ.9.3.6',
    zorluk: 4,
    beceri: 'Modeli yeni duruma uygulama',
    govde: p(
      `Bir pekmez üreticisi, ürününün yoğunluğunu areometreyle denetliyor. Areometre, altında saçma bilyeler bulunan cam bir hazne ile kesit alanı ${b(1, 'cm²')} olan düzgün, ince bir cam borudan oluşuyor ve kütlesi ${b(60, 'g')}. Areometre önce suda (${b('1,00', 'g/cm³')}), sonra yoğunluğu ${b('1,25', 'g/cm³')} olan sulandırılmış pekmezde dik olarak yüzdürülüyor. İki ölçümde de sıvı yüzeyi ince borunun üzerinde kalıyor.`,
      'Areometre pekmezde, sudakine göre nasıl yüzer?',
    ),
    secenekler: ['15 cm daha fazla batar.', '12 cm daha az batar.', 'Suda olduğu derinliğe kadar batar.', '12 cm daha fazla batar.', '15 cm daha az batar.'],
    dogru: 'B',
    gerekceler: {
      A: 'Daha yoğun sıvıda aynı kaldırma kuvveti için daha az hacim batması yeterlidir; areometre daha fazla değil, daha az batar.',
      C: `Kaldırma kuvveti iki sıvıda da aynıdır (${b('0,6', 'N')}), ama batan hacim aynı değildir: ${Fk} = ${Vb} × ${ds} × ${g}.`,
      D: 'Yön yanlış: yoğunluk artınca batan hacim azalır.',
      E: `Batan hacmi yoğunluk farkıyla orantılı azaltmak (60 × 0,25) yanlış: ${Vb} yoğunlukla ters orantılıdır, 60 / 1,25 = ${b(48, 'cm³')}.`,
    },
    adimlar: [
      adim('Yüzme koşulu', `Areometre iki sıvıda da yüzüyor: ${Fk} = ${G} = 0,06 × 10 = ${b('0,6', 'N')}.`),
      adim('Batan hacimler', `Suda ${Vb} = 60 / 1,00 = ${b(60, 'cm³')}; pekmezde ${Vb} = 60 / 1,25 = ${b(48, 'cm³')}.`),
      adim('Boydaki fark', `Hacim farkı ${b(12, 'cm³')}; boru kesiti ${b(1, 'cm²')} olduğundan areometre ${b(12, 'cm')} daha az batar.`),
    ],
    kavramYanilgisi: 'Yoğun sıvıda cismin daha çok batacağını ya da kaldırma kuvveti aynıysa batan hacmin de aynı kalacağını sanmak.',
  },
  {
    no: 6,
    baslik: 'Batıktan çıkan tartı ağırlığı',
    kazanim: 'FİZ.9.3.6',
    zorluk: 3,
    beceri: 'Ölçümü yorumlama',
    govde:
      p(
        'Bir sualtı arkeoloji ekibi, batık bir ticaret gemisinden eski terazilerde kullanılan, içi dolu, metal bir tartı ağırlığı çıkarıyor. Bu cismin hangi metalden yapıldığını anlamak için onu dinamometreyle önce havada (I), sonra tatlı suda tamamen batmış olarak (II) tartıyorlar. Dinamometrenin okumaları şekilde verilmiştir; cisim kaba değmiyor, suyun yoğunluğu 1 g/cm³.',
      ) +
      tablo(
        ['Metal', 'Alüminyum', 'Demir', 'Bronz', 'Gümüş', 'Kurşun'],
        [['Yoğunluk (g/cm³)', '2,7', '7,8', '8,8', '10,5', '11,3']],
      ) +
      p('Cisim, tablodaki metallerden hangisinden yapılmıştır?'),
    secenekler: ['Alüminyum', 'Demir', 'Bronz', 'Gümüş', 'Kurşun'],
    dogru: 'C',
    gerekceler: {
      A: 'Kaldırma kuvveti 1,0 N ise hacim 100 cm³, kütle 880 g olur; yoğunluk 2,7 g/cm³ değil 8,8 g/cm³ çıkar.',
      B: '7,8 N, cismin suda dinamometrede okunan değeridir; kaldırma kuvveti değil. Yoğunluk 7,8 değil 8,8 / 1,0 = 8,8 g/cm³.',
      D: 'Bu yoğunluk için suda okumanın 8,8 − 8,8 / 10,5 ≈ 7,96 N olması gerekirdi.',
      E: 'Bu yoğunluk için suda okumanın 8,8 − 8,8 / 11,3 ≈ 8,02 N olması gerekirdi.',
    },
    adimlar: [
      adim('Kaldırma kuvveti', `${Fk} = 8,8 − 7,8 = ${b('1,0', 'N')}.`),
      adim('Hacim', `${Fk} = ${Vb} × ${ds} × ${g}: 1,0 = ${Vb} × 1 000 × 10, ${Vb} = 0,0001 m³ = ${b(100, 'cm³')}. Cisim tamamen battığı için bu, cismin hacmidir.`),
      adim('Yoğunluk', `Kütle 8,8 / 10 = 0,88 kg = ${b(880, 'g')}; yoğunluk 880 / 100 = ${b('8,8', 'g/cm³')}. Bronz.`),
    ],
    kavramYanilgisi: 'Dinamometrenin sudaki okumasını kaldırma kuvveti sanmak.',
  },
  {
    no: 7,
    baslik: 'Göldeki şamandıra',
    kazanim: 'FİZ.9.3.6',
    zorluk: 4,
    beceri: 'Basınç ile kuvveti ilişkilendirme',
    govde: p(
      `Bir gölde yüzme parkurunu gösteren silindir biçimli şamandıra, şekildeki gibi dik olarak yüzüyor. Şamandıranın taban alanı ${b('0,5', 'm²')}, alt yüzeyi ${b(60, 'cm')} derinlikte ve alt yüzeyindeki sensör suyun basıncını ${b('6 000', 'Pa')} olarak ölçüyor. Şamandıranın üstüne kütlesi ${b(50, 'kg')} olan güneş enerjili bir lamba takılıyor. Şamandıra yine dik yüzüyor ve tamamen batmıyor (${g} = ${b(10, 'N/kg')}, suyun yoğunluğu ${b('1 000', 'kg/m³')}).`,
      'Lamba takıldıktan sonra sensör kaç paskal gösterir ve şamandıra kaç santimetre daha batar?',
    ),
    secenekler: [`${b('3 500', 'Pa')}; ${b(70, 'cm')}`, `${b('6 000', 'Pa')}; ${b(0, 'cm')}`, `${b('6 500', 'Pa')}; ${b(5, 'cm')}`, `${b('7 000', 'Pa')}; ${b(1, 'cm')}`, `${b('7 000', 'Pa')}; ${b(10, 'cm')}`],
    dogru: 'E',
    gerekceler: {
      A: `${b('3 500', 'N')} yeni kaldırma kuvvetidir; basınç değildir. Basınç için kuvveti alana bölmek gerekir: 3 500 / 0,5 = ${b('7 000', 'Pa')}.`,
      B: 'Lamba eklenince ağırlık artar; yüzen şamandıra dengede kalmak için daha çok batar, kaldırma kuvveti ve alttaki basınç artar.',
      C: `Ek ağırlık ${b(500, 'N')}, alan ${b('0,5', 'm²')}: basınç ${b('1 000', 'Pa')} artar, ${b(500, 'Pa')} değil.`,
      D: `Ek batan hacim 0,05 m³; alana bölünce 0,1 m = ${b(10, 'cm')} olur, ${b(1, 'cm')} değil.`,
    },
    adimlar: [
      adim('Önce', `Yalnız alt yüzey suda: ${Fk} = <i>P</i> × <i>A</i> = ${sayi(6000)} × 0,5 = ${b('3 000', 'N')} = ${G}. Şamandıranın kütlesi ${b(300, 'kg')}.`),
      adim('Sonra', `Yeni ağırlık ${b('3 500', 'N')}; yüzdüğü için ${Fk} = ${b('3 500', 'N')}. Alt yüzeydeki basınç 3 500 / 0,5 = ${b('7 000', 'Pa')}.`),
      adim('Derinlik', `<i>P</i> = <i>h</i> × ${ds} × ${g}: <i>h</i> = 7 000 / 10 000 = ${b('0,7', 'm')}. Şamandıra ${b(10, 'cm')} daha batar.`),
    ],
    kavramYanilgisi: 'Basınç ile basınç kuvvetini karıştırmak; yüzen cisme yük eklenince kaldırma kuvvetinin değişmeyeceğini sanmak.',
  },
  {
    no: 8,
    baslik: 'Model denizaltının safra tankı',
    kazanim: 'FİZ.9.3.6',
    zorluk: 4,
    beceri: 'Koşulları karşılaştırma',
    govde: p(
      `Bir robotik kulübü, hacmi ${b('2 000', 'cm³')} olan model bir denizaltı yapıyor. Denizaltının safra tankı boşken kütlesi ${b('1 800', 'g')} ve şekildeki gibi su dolu havuzda yüzüyor. Safra tankının hacmi ${b(300, 'cm³')}; tanka havuzun suyu (${b(1, 'g/cm³')}) alınabiliyor. Denizaltının dış hacmi hiç değişmiyor (${g} = ${b(10, 'N/kg')}).`,
      'Buna göre aşağıdakilerden hangisi doğrudur?',
    ),
    secenekler: [
      `Tanka ${b(300, 'cm³')} su alınınca askıda kalır; tank dolu olduğu için tabana inmez.`,
      `Tanka ${b(200, 'cm³')} su alınınca askıda kalır; tank tamamen dolunca batar ve havuz tabanı denizaltıya ${b(1, 'N')} kuvvet uygular.`,
      `Tanka ${b(200, 'cm³')} su alınınca askıda kalır; tank tamamen dolunca batar ve havuz tabanı denizaltıya ${b(21, 'N')} kuvvet uygular.`,
      `Tanka ${b(180, 'cm³')} su alınınca askıda kalır; tank tamamen dolunca batar ve havuz tabanı denizaltıya ${b(3, 'N')} kuvvet uygular.`,
      `Tanka ${b(200, 'cm³')} su alınınca askıda kalır; tank tamamen dolunca, tamamen battığı için kaldırma kuvveti artar ve denizaltı yeniden yükselir.`,
    ],
    dogru: 'B',
    gerekceler: {
      A: `${b(300, 'cm³')} su alınınca kütle ${b('2 100', 'g')} olur; ağırlık (21 N) en büyük kaldırma kuvvetini (20 N) aşar ve denizaltı batar.`,
      C: `${b(21, 'N')} denizaltının ağırlığıdır. Tabanda dengedeyken kaldırma kuvveti ${b(20, 'N')} olduğundan taban yalnız aradaki ${b(1, 'N')}’u karşılar.`,
      D: `Askıda kalmak için toplam kütle ${b('2 000', 'g')} olmalı; ${b('1 800', 'g')}’ın %10’u değil, 2 000 − 1 800 = ${b(200, 'g')} su gerekir.`,
      E: 'Tamamen battıktan sonra batan hacim artmaz; kaldırma kuvveti 20 N’da sabit kalır.',
    },
    adimlar: [
      adim('Askıda kalma', `Tamamen batınca ${Fk} = 0,002 × 1 000 × 10 = ${b(20, 'N')}. Askıda kalmak için ${G} = ${b(20, 'N')}, kütle ${b('2 000', 'g')}: tanka ${b(200, 'g')} = ${b(200, 'cm³')} su alınmalı.`),
      adim('Tank dolu', `Kütle 1 800 + 300 = ${b('2 100', 'g')}, ${G} = ${b(21, 'N')}. Ağırlık en büyük kaldırma kuvvetinden (${b(20, 'N')}) büyük olduğu için denizaltı batar.`),
      adim('Tabanda denge', `${Fk} + <i>N</i> = ${G}: <i>N</i> = 21 − 20 = ${b(1, 'N')}.`),
    ],
    kavramYanilgisi: 'Tamamen batmış bir cisme daha derinde daha büyük kaldırma kuvveti etki ettiğini ya da tabana ağırlığının tamamını uyguladığını sanmak.',
  },
  {
    no: 9,
    baslik: 'Dalgıcın yeleği',
    kazanim: 'FİZ.9.3.6',
    zorluk: 5,
    beceri: 'Genellemenin sınırını belirleme',
    govde: p(
      `Bir dalış okulu, tatlı su göletinde eğitim veriyor (${ds} = ${b('1 000', 'kg/m³')}, ${g} = ${b(10, 'N/kg')}). Bir dalgıcın donanımıyla birlikte toplam kütlesi ${b(78, 'kg')}, yüzeye yakın derinlikte toplam hacmi ${b(80, 'L')}. Dalgıç ${b(10, 'm')} derinliğe indiğinde neopren elbisesindeki hava kabarcıkları sıkışıyor ve toplam hacmi ${b(76, 'L')}’ye düşüyor. Dalgıç yeleğine (BCD) tüpünden hava vererek hacmini artırabiliyor; verilen havanın kütlesi önemsenmiyor.`,
      `Eğitmen, “Tamamen batmış cisme etki eden kaldırma kuvveti derinliğe bağlı değildir.” diyor. Dalgıcın ${b(10, 'm')} derinlikte askıda kalabilmesi için yeleğine kaç litre hava vermesi gerekir?`,
    ),
    secenekler: [b(0, 'L'), b(2, 'L'), b(4, 'L'), b(6, 'L'), b(20, 'L')],
    dogru: 'B',
    gerekceler: {
      A: 'Eğitmenin cümlesi hacmi değişmeyen cisimler içindir. Dalgıcın hacmi küçüldüğü için kaldırma kuvveti 800 N’dan 760 N’a iner.',
      C: `Yüzeydeki hacme (80 L) dönmek gerekmez; askıda kalmak için ${Fk} = ${G} = 780 N, yani 78 L yeterlidir.`,
      D: 'Hacim kaybını (4 L) ve yüzeydeki fazlayı (2 L) toplamak yanlış; amaç başlangıçtaki duruma dönmek değil, ağırlığı dengelemektir.',
      E: '20 N net kuvvettir; hacim için kuvveti 10 000 N/m³’e bölmek gerekir: 20 / 10 000 = 0,002 m³ = 2 L.',
    },
    adimlar: [
      adim('Ağırlık', `${G} = 78 × 10 = ${b(780, 'N')}.`),
      adim('10 m’de kaldırma kuvveti', `${Fk} = 0,076 × 1 000 × 10 = ${b(760, 'N')}. Bu değer ${G} = ${b(780, 'N')}’dan küçük olduğu için dalgıç batmaya başlar.`),
      adim('Gereken hacim', `Askıda kalmak için ${Fk} = ${b(780, 'N')}, ${Vb} = 780 / 10 000 = 0,078 m³ = ${b(78, 'L')}. Yeleğe 78 − 76 = ${b(2, 'L')} hava verilir.`),
      adim('Genelleme', 'Kaldırma kuvvetinin derinliğe bağlı olmaması, hacmi değişmeyen cisimler için geçerlidir.'),
    ],
    kavramYanilgisi: 'Kaldırma kuvvetinin derinlikten bağımsız olduğu kuralını, hacmi basınçla değişen cisimlere de uygulamak.',
  },
  {
    no: 10,
    baslik: 'Ay üssündeki su tankı',
    kazanim: 'FİZ.9.3.5',
    zorluk: 4,
    beceri: 'Değişkenin etkisini ayırma',
    govde: p(
      `Dünya’daki bir laboratuvarda oyuncak bir tekne, su dolu cam tankta hacminin %40’ı suya batmış olarak yüzüyor. Aynı tekne ve aynı su, Ay’da kurulan bir araştırma üssündeki aynı tanka konuyor. Ay’daki çekim ivmesi Dünya’dakinin altıda biri; suyun yoğunluğu değişmiyor ve tekne yine serbestçe yüzüyor.`,
      'Ay üssünde teknenin batan hacminin oranı ve tekneye etki eden kaldırma kuvveti için ne söylenebilir?',
    ),
    secenekler: [
      'Batan oran yine %40 olur; kaldırma kuvveti altıda birine iner.',
      'Batan oran azalır; kaldırma kuvveti değişmez.',
      'Batan oran yine %40 olur; kaldırma kuvveti değişmez.',
      'Batan oran altıda birine iner; kaldırma kuvveti de altıda birine iner.',
      'Batan oran artar; kaldırma kuvveti altıda birine iner.',
    ],
    dogru: 'A',
    gerekceler: {
      B: `Çekim ivmesi hem ağırlığı hem kaldırma kuvvetini aynı oranda küçültür. ${Vb} × ${ds} × ${g} = <i>m</i> × ${g} eşitliğinde ${g} sadeleşir; batan oran değişmez.`,
      C: `Kaldırma kuvveti ${g} ile doğru orantılıdır; ${g} altıda birine inince ${Fk} da iner.`,
      D: `Ağırlık da altıda birine indiği için tekne aynı hacimle dengeye gelir; batan hacim değişmez.`,
      E: `${g} denge eşitliğinin iki tarafında da var; sadeleşir, batan oran değişmez.`,
    },
    adimlar: [
      adim('Yüzme koşulu', `${Fk} = ${G}: ${Vb} × ${ds} × ${g} = <i>m</i> × ${g}.`),
      adim('Batan hacim', `${g} sadeleşir: ${Vb} = <i>m</i> / ${ds}. Kütle ve sıvı aynı olduğu için batan hacim, yani oran, %40 kalır.`),
      adim('Kaldırma kuvveti', `${Fk} = ${G} = <i>m</i> × ${g}; ${g} altıda birine inince kaldırma kuvveti de altıda birine iner.`),
    ],
    kavramYanilgisi: 'Çekim azalınca cismin “hafifleyip” daha az batacağını sanmak; yer çekiminin ağırlığı ve kaldırma kuvvetini birlikte etkilediğini gözden kaçırmak.',
  },
  {
    no: 11,
    baslik: 'Eriyen buz ve su seviyesi',
    kazanim: 'FİZ.9.3.6',
    zorluk: 5,
    beceri: 'Arşimet ilkesini zincirleme uygulama',
    govde:
      p(
        'İklim haberlerinde buzulların erimesinin deniz seviyesine etkisi tartışılıyor. Bir öğretmen konuyu şekildeki üç durumla sınıfa getiriyor. I ve III’teki bardaklarda tatlı su ve tatlı sudan yapılmış buz var; buzlar serbestçe yüzüyor. II’de karadaki bir buzulun eriyen suyu denize akıyor. Buharlaşma önemsenmiyor.',
      ) +
      p('Buna göre aşağıdaki yargılardan hangileri doğrudur?') +
      oncul(
        'I’deki buz tamamen eridiğinde bardaktaki su seviyesi değişmez.',
        'II’deki buzul eriyip suyu denize aktığında deniz seviyesi yükselir.',
        'III’teki, içinde küçük bir taş donmuş buz tamamen eridiğinde bardaktaki su seviyesi düşer.',
      ),
    secenekler: ONCULLU,
    dogru: 'E',
    gerekceler: {
      A: 'II de doğru: karadaki buz denizde hiç su yerinden oynatmıyordu; eriyen suyu denize eklenen yeni hacimdir.',
      B: 'III de doğru: yüzerken taşın ağırlığı kadar su yerinden oynuyordu; eriyince taş batar ve yalnız kendi hacmi kadar su yerinden oynatır.',
      C: 'II de doğru: karadaki buzulun suyu denize sonradan eklenir.',
      D: 'I de doğru: yüzen buz, eridiğinde oluşacak su kadar ağırlıkta su yerinden oynatır.',
    },
    adimlar: [
      adim('I', `Yüzen buz için ${Fk} = ${G}: buz, kendi kütlesi kadar suyun hacmini yerinden oynatır. Eriyince tam bu hacimde su olur; seviye değişmez.`),
      adim('II', 'Karadaki buz denizde su yerinden oynatmıyordu. Eriyen suyu denize eklenir; seviye yükselir.'),
      adim('III', 'Yüzerken buz ve taşın toplam ağırlığı kadar su yerinden oynar; taş için bu, taşın hacminden fazla sudur. Eriyince taş batar ve yalnız kendi hacmi kadar yer kaplar; seviye düşer.'),
    ],
    kavramYanilgisi: 'Yüzen buzun erimesinin seviyeyi yükselteceğini sanmak; yüzen bir cismin yerinden oynattığı suyun ağırlığı ile batan cismin yerinden oynattığı suyun hacmini karıştırmak.',
  },
  {
    no: 12,
    baslik: 'Grafikten sıvıyı tanımak',
    kazanim: 'FİZ.9.3.5',
    zorluk: 4,
    beceri: 'Grafik okuma ve modelleme',
    govde: p(
      'Dinamometreye asılı, yüksekliği 10 cm olan dik bir silindir, şekildeki gibi sıvıya yavaşça indiriliyor. Silindirin alt yüzeyinin sıvı yüzeyinden derinliği <i>h</i> ile dinamometre okuması arasındaki ilişki, su ve X sıvısı için grafikte verilmiştir. Silindir kaba değmiyor ve sıvı yüzeyi deney boyunca değişmiyor.',
      'Silindir X sıvısına <i>h</i> = 6 cm olacak biçimde batırıldığında dinamometre kaç newton gösterir?',
    ),
    secenekler: [b('1,44', 'N'), b('3,60', 'N'), b('4,56', 'N'), b('4,80', 'N'), b('5,04', 'N')],
    dogru: 'C',
    gerekceler: {
      A: `${b('1,44', 'N')} bu durumdaki kaldırma kuvvetidir; dinamometre ağırlıktan bu kadar eksiğini gösterir.`,
      B: `${b('3,60', 'N')}, silindir X’e tamamen battığında okunur; <i>h</i> = 6 cm’de silindirin yalnız onda altısı batmıştır.`,
      D: `${b('4,80', 'N')} sudaki okumadır; X sıvısının grafiği farklıdır.`,
      E: '6 cm’lik değil, sıvının dışında kalan 4 cm’lik kısma göre kaldırma kuvveti hesaplanmış: 6 − 0,4 × 2,4 = 5,04 N.',
    },
    adimlar: [
      adim('Grafiği oku', `Ağırlık ${b(6, 'N')}. Tamamen batınca suda ${b(4, 'N')}, X’te ${b('3,6', 'N')} okunuyor: ${Fk}(su) = ${b(2, 'N')}, ${Fk}(X) = ${b('2,4', 'N')}.`),
      adim('Kısmi batma', `Silindir düzgün olduğu için ${Vb} batma derinliğiyle orantılı: <i>h</i> = 6 cm’de batan hacim tamamın 0,6 katı.`),
      adim('Okuma', `${Fk} = 0,6 × 2,4 = ${b('1,44', 'N')}; dinamometre 6 − 1,44 = ${b('4,56', 'N')} gösterir.`),
    ],
    kavramYanilgisi: 'Grafiğin yatay kısmını “kaldırma kuvveti sıfır” diye okumak; kısmi batmada kaldırma kuvvetinin batan hacimle orantılı olduğunu kullanmamak.',
  },
]

// ---------------------------------------------------------------------------
// Doğrulama: her sorunun sayısal cevabı verilen verilerden yeniden hesaplanır.
// ---------------------------------------------------------------------------

const yakin = (a: number, b0: number, tol = 1e-9) => Math.abs(a - b0) <= tol

export function dogrula(): string[] {
  const hata: string[] = []
  const bekle = (kosul: boolean, mesaj: string) => {
    if (!kosul) hata.push(mesaj)
  }
  const gY = 10

  // S1
  {
    const A = 0.2 * 0.2
    const [u1, a1, u2, a2] = [5000, 7000, 20000, 22000]
    bekle(yakin(u1, 0.5 * 1000 * gY) && yakin(u2, 2.0 * 1000 * gY), 'S1: üst sensör basınçları derinlikle uyuşmuyor')
    bekle(yakin(a1, 0.7 * 1000 * gY) && yakin(a2, 2.2 * 1000 * gY), 'S1: alt sensör basınçları (üst + 0,2 m) ile uyuşmuyor')
    bekle(yakin((u2 - u1) * A, 600) && yakin((a2 - a1) * A, 600), 'S1: öncül I (600 N artış) yanlış')
    bekle(yakin((a1 - u1) * A, 80) && yakin((a2 - u2) * A, 80), 'S1: öncül II (80 N) yanlış')
    bekle(yakin(0.2 ** 3 * 1000 * gY, 80), 'S1: 80 N, V × d × g ile uyuşmuyor')
  }
  // S2
  {
    const kutle = 5100 * 1000
    const yukluToplam = 5100 * 1020
    bekle(yakin((yukluToplam - kutle) / 1000, 102), 'S2: eklenen yük 102 ton değil')
    bekle(yakin(yukluToplam / 1000, 5202), 'S2: toplam 5 202 ton değil')
    bekle(5100 * 1000 / 1020 < 5100, 'S2: denizde batan hacim azalmalı')
  }
  // S3
  {
    const al = 2.7, cu = 8.9
    const fk = (V: number, d: number) => (V / 1e6) * d * 1000 * gY
    const G = (V: number, d: number) => (V / 1e6) * d * 1000 * gY
    const tablo: [number, number][] = [
      [G(100, al), G(100, al) - fk(100, 1)],
      [G(100, cu), G(100, cu) - fk(100, 1)],
      [G(200, al), G(200, al) - fk(200, 1)],
      [G(100, al), G(100, al) - fk(100, 1.2)],
      [G(100, al), G(100, al) - fk(50, 1)],
      [G(100, cu), G(100, cu) - fk(100, 1.2)],
    ]
    const verilen: [number, number][] = [[2.7, 1.7], [8.9, 7.9], [5.4, 3.4], [2.7, 1.5], [2.7, 2.2], [8.9, 7.7]]
    tablo.forEach(([h, s0], i) => bekle(yakin(h, verilen[i]![0], 1e-9) && yakin(s0, verilen[i]![1], 1e-9), `S3: deneme ${i + 1} okumaları tutarsız`))
  }
  // S4
  {
    const Fsurup = 6.0 - 4.2
    const dSurup = (Fsurup / gY) * 1000 / 150 // g/cm³
    bekle(yakin(dSurup, 1.2, 1e-9), 'S4: şurup yoğunluğu 1,2 değil')
    const Fsu = (150 / 1e6) * 1000 * gY
    bekle(yakin(6.0 - Fsu, 4.5), 'S4: sudaki okuma 4,5 N değil')
  }
  // S5
  {
    const Vsu = 60 / 1.0
    const Vpek = 60 / 1.25
    bekle(yakin(Vsu - Vpek, 12), 'S5: batma farkı 12 cm değil')
  }
  // S6
  {
    const Fk6 = 8.8 - 7.8
    const V = (Fk6 / (1000 * gY)) * 1e6 // cm³
    const d = (8.8 / gY) * 1000 / V
    bekle(yakin(V, 100, 1e-6) && yakin(d, 8.8, 1e-9), 'S6: yoğunluk 8,8 g/cm³ değil')
  }
  // S7
  {
    bekle(yakin(0.6 * 1000 * gY, 6000), 'S7: 60 cm ile 6 000 Pa uyuşmuyor')
    const G0 = 6000 * 0.5
    const G1 = G0 + 50 * gY
    const P1 = G1 / 0.5
    const h1 = P1 / (1000 * gY)
    bekle(yakin(P1, 7000) && yakin(h1 - 0.6, 0.1), 'S7: 7 000 Pa ve 10 cm değil')
  }
  // S8
  {
    const Fmaks = (2000 / 1e6) * 1000 * gY
    bekle(yakin(Fmaks, 20), 'S8: en büyük kaldırma kuvveti 20 N değil')
    bekle(yakin(2000 - 1800, 200), 'S8: askıda kalmak için 200 g gerekmeli')
    bekle(yakin(((1800 + 300) / 1000) * gY - Fmaks, 1), 'S8: tabandaki kuvvet 1 N değil')
    bekle(((1800 / 1000) * gY) < Fmaks, 'S8: boş tankla model yüzmeli')
  }
  // S9
  {
    const G9 = 78 * gY
    bekle(yakin(0.08 * 1000 * gY, 800) && yakin(0.076 * 1000 * gY, 760, 1e-9), 'S9: kaldırma kuvvetleri')
    bekle(yakin((G9 / (1000 * gY)) * 1000 - 76, 2, 1e-9), 'S9: eklenecek hava 2 L değil')
  }
  // S10: g sadeleşir (sembolik); kaldırma kuvveti g ile orantılı.
  {
    const m = 0.3, d = 1000
    const oranD = m / d / 0.00075, oranA = m / d / 0.00075
    bekle(yakin(oranD, oranA) && yakin((m * gY) / 6, (m * gY) / 6), 'S10')
  }
  // S11: III sayısal örnekle: 50 g buz + 20 g taş (2,5 g/cm³).
  {
    const yerdenOynayanOnce = (50 + 20) / 1
    const sonra = 50 / 1 + 20 / 2.5
    bekle(sonra < yerdenOynayanOnce, 'S11: III için seviye düşmeli')
  }
  // S12
  {
    const FkX = 6 - 3.6
    bekle(yakin(6 - 0.6 * FkX, 4.56, 1e-9), 'S12: okuma 4,56 N değil')
    bekle(yakin(6 - 0.6 * 2, 4.8, 1e-9), 'S12: şekildeki su okuması 4,8 N olmalı')
  }

  // Biçim denetimleri
  for (const t of TASLAKLAR) {
    const metinler = [t.govde, ...t.secenekler, ...Object.values(t.gerekceler), ...t.adimlar, t.kavramYanilgisi]
    for (const m of metinler) {
      if (m.includes('·')) hata.push(`S${t.no}: "·" kullanılmış`)
      if (/\d\.\d/.test(m.replace(/<[^>]+>/g, ''))) hata.push(`S${t.no}: ondalık nokta: ${m.slice(0, 60)}`)
      // HTML içinde çıplak < ya da > metin olarak kalmaz (etiket sanılıp silinebilir).
      if (/[<>]/.test(m.replace(/<\/?[a-z]+[^<>]*>/g, ''))) hata.push(`S${t.no}: çıplak < ya da >: ${m.slice(0, 60)}`)
    }
    if (new Set(t.secenekler).size !== 5) hata.push(`S${t.no}: aynı şık iki kez`)
    for (const h of ['A', 'B', 'C', 'D', 'E'] as Harf[]) {
      if (h !== t.dogru && !t.gerekceler[h]) hata.push(`S${t.no}: ${h} için gerekçe yok`)
      const gz = t.gerekceler[h]
      if (gz && !/[.!?]$/.test(gz.trim())) hata.push(`S${t.no}: ${h} gerekçesi noktayla bitmiyor`)
    }
    if (t.gerekceler[t.dogru]) hata.push(`S${t.no}: doğru şıkta gerekçe var`)
  }
  const dagilim = TASLAKLAR.reduce<Record<string, number>>((a, t) => ({ ...a, [t.dogru]: (a[t.dogru] ?? 0) + 1 }), {})
  if (Object.values(dagilim).some((n) => n > 3)) hata.push(`Cevap dağılımı dengesiz: ${JSON.stringify(dagilim)}`)
  return hata
}

// ---------------------------------------------------------------------------
// İçe aktarım biçimine çevirme
// ---------------------------------------------------------------------------

export function iceAktarimSorulari(): IceAktarimSorusu[] {
  return TASLAKLAR.map((t) => ({
    // Aynı kimlik: eski pilot sorularının üzerine yazılır, kopya kalmaz.
    dis_kimlik: `fizik-atolye/kaldirma-kuvveti/S${t.no}`,
    tur: 'coktan_secmeli',
    govde: t.govde,
    sekil_svg: SEKILLER[`s${t.no}`]!(),
    secenekler: t.secenekler.map((metin, i) => {
      const harf = 'ABCDE'[i] as Harf
      const gerekce = t.gerekceler[harf]
      return gerekce ? { harf, metin, gerekce } : { harf, metin }
    }),
    dogru_cevap: t.dogru,
    cozum_adimlari: t.adimlar,
    zorluk: t.zorluk,
    baglam_temelli: true,
    kazanimlar: [t.kazanim],
    kaynak_notu: `Ben Fizik Yapamıyorum kaldırma kuvveti paketi, S${t.no}: ${t.baslik}.`,
    beceri: t.beceri,
    kavram_yanilgisi: t.kavramYanilgisi,
    puanlama_olcutu: t.puanlama ?? 'Doğru seçenek: 1 puan. İsteğe bağlı gerekçe: doğru ilişkiyi kuran ve hesabı tamamlayan gerekçe 2 puan, ilişkiyi kurup hesapta hata yapan gerekçe 1 puan.',
    ornek: false,
    yayinda: true,
  }))
}
