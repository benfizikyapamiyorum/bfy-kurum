// Ortam değişkenleri (.env). Supabase bilgileri girilmemişse uygulama "yerel deneme" modunda çalışır.

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const anahtar = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

export const ortam = {
  supabaseUrl: url,
  supabaseAnonAnahtar: anahtar,
  /** Supabase bağlantısı tanımlı mı? */
  supabaseVar: url !== '' && anahtar !== '',
  /** Tanıtım sürümü: kaldırma kuvveti paketi demo içeriğine eklenir. */
  tanitim: import.meta.env.VITE_TANITIM === '1',
  /** Tek dosya (flash bellek) sürümü: adresler # ile, service worker yok. */
  tekDosya: import.meta.env.VITE_TEK_DOSYA === '1',
} as const
