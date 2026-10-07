// Sunumdan canlı ekrana geçildiğinde hangi slayta dönüleceği.
// Bellekte tutulur; sayfa yenilenirse sessionStorage'dan okunur (erişilemezse sessizce yok sayılır).

const ANAHTAR = 'sunum-adimi'
let adim: number | null = null
const dinleyiciler = new Set<() => void>()

export function sunumAdimi(): number | null {
  if (adim !== null) return adim
  try {
    const v = sessionStorage.getItem(ANAHTAR)
    return v === null ? null : Number(v)
  } catch {
    return null
  }
}

export function sunumAdiminiKaydet(yeni: number | null) {
  adim = yeni
  try {
    if (yeni === null) sessionStorage.removeItem(ANAHTAR)
    else sessionStorage.setItem(ANAHTAR, String(yeni))
  } catch {
    // Depolama kapalıysa bellekteki değer yeterli.
  }
  dinleyiciler.forEach((f) => f())
}

export function sunumDinle(f: () => void) {
  dinleyiciler.add(f)
  return () => {
    dinleyiciler.delete(f)
  }
}
