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
