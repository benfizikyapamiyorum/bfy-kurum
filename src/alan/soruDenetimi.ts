// Süper admin soru düzenleyicisinde kaydetmeden önceki denetim.

import type { Secenek, SoruTuru } from './tipler'

export interface DenetlenecekSoru {
  tur: SoruTuru
  govde: string
  sekil_svg: string | null
  secenekler: Secenek[] | null
  dogru_cevap: string
  kazanim_idleri: string[]
}

/** Kaydetmeden önce denetim. Boş dizi = geçerli. */
export function soruTaslagiDenetle(t: DenetlenecekSoru): string[] {
  const h: string[] = []
  if (!t.govde.trim()) h.push('Soru metni boş olamaz.')
  if (t.kazanim_idleri.length === 0) h.push('En az bir kazanım seçin.')
  if (t.tur === 'coktan_secmeli') {
    if (!t.secenekler || t.secenekler.some((s) => !s.metin.trim())) h.push('Beş seçeneğin hepsi dolu olmalı.')
    if (!/^[A-E]$/.test(t.dogru_cevap)) h.push('Doğru cevap A-E arası olmalı.')
  }
  if (t.tur === 'dogru_yanlis' && !/^[DY]$/.test(t.dogru_cevap)) h.push('Doğru cevap D ya da Y olmalı.')
  if (t.tur === 'acik_uclu' && !t.dogru_cevap.trim()) h.push('Açık uçlu soru için beklenen cevabı yazın.')
  if (t.sekil_svg && /<script|\son[a-z]+\s*=/i.test(t.sekil_svg)) h.push('Şekil betik ya da olay özniteliği içeremez.')
  return h
}

