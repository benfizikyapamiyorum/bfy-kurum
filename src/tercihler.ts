// Tarayıcıda saklanan kişisel tercihler (tema, kontrast, kalem rengi...).
// Gizli pencerede veya engellenmiş depolamada sessizce varsayılana döner.

export function tercihOku<T>(anahtar: string, varsayilan: T): T {
  try {
    const ham = localStorage.getItem(`tercih:${anahtar}`)
    return ham === null ? varsayilan : (JSON.parse(ham) as T)
  } catch {
    return varsayilan
  }
}

export function tercihYaz<T>(anahtar: string, deger: T): void {
  try {
    localStorage.setItem(`tercih:${anahtar}`, JSON.stringify(deger))
  } catch {
    // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
  }
}
