// Uygulamanın alan (domain) tipleri. Veritabanı tablolarıyla birebir aynı adları taşır
// (supabase/migrations/20261003000100_temel_sema.sql). Model dersten bağımsızdır.

export type Rol = 'superadmin' | 'kurum_yonetici' | 'ogretmen' | 'ogrenci'
export type IcerikTuru = 'hafta_kiti' | 'konu_anlatimi' | 'sunum'
export type SoruTuru = 'coktan_secmeli' | 'dogru_yanlis' | 'acik_uclu'
export type TestTuru = 'mini_test' | 'deneme' | 'yazili'
export type SecenekHarfi = 'A' | 'B' | 'C' | 'D' | 'E'

export const SECENEK_HARFLERI: readonly SecenekHarfi[] = ['A', 'B', 'C', 'D', 'E']

export interface Ders {
  id: string
  kod: string
  ad: string
  sira: number
}

export interface Seviye {
  id: string
  kod: string
  ad: string
  sira: number
}

export interface Unite {
  id: string
  ders_id: string
  seviye_id: string
  no: number
  ad: string
}

export interface Kazanim {
  id: string
  unite_id: string
  kod: string
  metin: string
  sira: number
}

export interface Secenek {
  harf: SecenekHarfi
  metin: string
  /** Bu şık neden yanlış (tahtada "Neden B değil?" ile açılır). Doğru şıkta boş. */
  gerekce?: string
}

export interface CozumAdimi {
  metin: string
}

export interface Soru {
  id: string
  tur: SoruTuru
  govde: string
  sekil_svg: string | null
  secenekler: Secenek[] | null
  dogru_cevap: string
  cozum_adimlari: CozumAdimi[]
  zorluk: 1 | 2 | 3 | 4 | 5
  baglam_temelli: boolean
  kaynak_notu: string | null
  ornek: boolean
  kazanim_idleri: string[]
  /** Ölçülen beceri, ör. "Veriden çıkarım". */
  beceri?: string | null
  /** Sorunun yokladığı yaygın kavram yanılgısı (yalnızca öğretmene görünür). */
  kavram_yanilgisi?: string | null
  /** Gerekçeli ya da açık uçlu cevap için puanlama ölçütü. */
  puanlama_olcutu?: string | null
}

export interface Icerik {
  id: string
  tur: IcerikTuru
  baslik: string
  aciklama: string | null
  unite_id: string | null
  hafta: number | null
  sira: number
  /** '/' ile başlıyorsa uygulamayla yayınlanan dosya; 'yerel:' ile başlıyorsa bu tarayıcıya
   *  içe aktarılmış kit; aksi halde Supabase Storage 'icerik' kovasındaki yol. */
  html_yolu: string | null
  meb_baglanti: string | null
  ornek: boolean
  kazanim_idleri: string[]
  /** HTML dosyası yerine yapılandırılmış içerik (konu anlatımı). */
  veri?: KonuVerisi | null
}

export interface KonuBolumu {
  baslik: string
  /** Güvenli HTML (KaTeX için $...$). */
  metin: string
  sekil_svg?: string | null
}

export interface DersAkisiAdimi {
  time: string
  title: string
  body: string
}

export interface KonuVerisi {
  bolumler: KonuBolumu[]
  /** Ders süresine (dakika) göre öğretmen akışı, ör. { "40": [...], "80": [...] }. */
  planlar?: Record<string, DersAkisiAdimi[]>
}

export interface Katalog {
  dersler: Ders[]
  seviyeler: Seviye[]
  uniteler: Unite[]
  kazanimlar: Kazanim[]
}

export interface Kurum {
  id: string
  ad: string
  kod: string | null
  logo_yolu: string | null
  lisans_baslangic: string
  lisans_bitis: string
  ogretmen_limiti: number
  ogrenci_limiti: number
  aktif: boolean
  demo: boolean
}

export interface Kullanici {
  id: string
  kurum_id: string | null
  rol: Rol
  ad_soyad: string
  kullanici_adi: string | null
  eposta: string | null
  aktif: boolean
}

export interface SinifGrubu {
  id: string
  kurum_id: string
  ad: string
  seviye_id: string | null
  katilim_kodu: string | null
  arsiv: boolean
}

export interface TestAyarlari {
  /** Sayfa düzeni: tek ya da iki sütun. */
  duzen?: 'tek' | 'iki'
  /** Her sorunun altında bırakılan işlem alanı. */
  islemAlani?: 'yok' | 'kisa' | 'genis'
  /** Sayfalara kurum adıyla soluk filigran. */
  filigran?: boolean
}

export interface Test {
  id: string
  kurum_id: string
  olusturan_id: string | null
  tur: TestTuru
  baslik: string
  aciklama: string | null
  sure_dk: number | null
  yanlis_dogru_orani: number
  ayarlar: TestAyarlari
  olusturma: string
}

export interface Atama {
  id: string
  kurum_id: string
  test_id: string
  sinif_grubu_id: string
  baslangic: string
  bitis: string | null
  cozumler_acik: boolean
}

export interface Sonuc {
  atama_id: string
  ogrenci_id: string
  dogru: number
  yanlis: number
  bos: number
  net: number
  kaynak: 'online' | 'elle'
  tamamlandi: string
}
