// Kurum logosunu M2'ye kadar bu tarayıcıda denemek için saklar.

const ANAHTAR = 'tercih:denemeLogo'
const dinleyiciler = new Set<() => void>()

export function denemeLogosuOku(): string | null {
  try {
    return localStorage.getItem(ANAHTAR)
  } catch {
    return null
  }
}

export function denemeLogosuYaz(veriUrl: string | null): void {
  try {
    if (veriUrl) localStorage.setItem(ANAHTAR, veriUrl)
    else localStorage.removeItem(ANAHTAR)
  } catch {
    // Depolama kapalı: logo yalnızca bu oturumda görünmez.
  }
  dinleyiciler.forEach((d) => d())
}

export const abone = (d: () => void) => {
  dinleyiciler.add(d)
  return () => dinleyiciler.delete(d)
}

