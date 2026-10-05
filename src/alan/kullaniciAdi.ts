// Öğrenci kullanıcı adı önerisi: "Ayşe Gül Yılmaz" → "ayse.yilmaz". Çakışırsa sonuna sayı eklenir.

const TR_ASCII: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }

/** Türkçe metni kullanıcı adına uygun küçük ASCII harflere çevirir. */
export function asciiyeCevir(metin: string): string {
  return metin
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıiöşüâîû]/g, (h) => TR_ASCII[h] ?? h)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export const KULLANICI_ADI_KURALI = /^[a-z0-9._-]{3,40}$/

export function kullaniciAdiOner(adSoyad: string, kullanilanlar: ReadonlySet<string> = new Set()): string {
  const parcalar = asciiyeCevir(adSoyad).split(' ').filter(Boolean)
  let temel = parcalar.length >= 2 ? `${parcalar[0]}.${parcalar[parcalar.length - 1]}` : (parcalar[0] ?? 'ogrenci')
  temel = temel.slice(0, 34)
  if (temel.length < 3) temel = `${temel}.ogr`
  if (!kullanilanlar.has(temel)) return temel
  for (let i = 2; ; i++) {
    const aday = `${temel}${i}`
    if (!kullanilanlar.has(aday)) return aday
  }
}
