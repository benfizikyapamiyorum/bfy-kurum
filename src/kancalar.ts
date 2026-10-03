// Ortak React kancaları.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export interface VeriDurumu<T> {
  veri: T | null
  hata: Error | null
  yukleniyor: boolean
  yenile: () => void
}

/** Asenkron veri yükler. deps değişince yeniden yükler. */
export function useVeri<T>(getir: () => Promise<T>, deps: readonly unknown[]): VeriDurumu<T> {
  const [durum, setDurum] = useState<{ veri: T | null; hata: Error | null; yukleniyor: boolean }>({
    veri: null,
    hata: null,
    yukleniyor: true,
  })
  const [sayac, setSayac] = useState(0)
  useEffect(() => {
    let iptal = false
    // Bağımlılık değişince yükleniyor durumuna dönmek bilinçli bir tercih.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDurum((d) => ({ ...d, yukleniyor: true, hata: null }))
    getir().then(
      (veri) => !iptal && setDurum({ veri, hata: null, yukleniyor: false }),
      (hata: unknown) =>
        !iptal &&
        setDurum({ veri: null, hata: hata instanceof Error ? hata : new Error(String(hata)), yukleniyor: false }),
    )
    return () => {
      iptal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, sayac])
  const yenile = useCallback(() => setSayac((n) => n + 1), [])
  return { ...durum, yenile }
}

const cevrimiciAbone = (bildir: () => void) => {
  window.addEventListener('online', bildir)
  window.addEventListener('offline', bildir)
  return () => {
    window.removeEventListener('online', bildir)
    window.removeEventListener('offline', bildir)
  }
}

export const useCevrimici = (): boolean =>
  useSyncExternalStore(cevrimiciAbone, () => navigator.onLine, () => true)

const tamEkranAbone = (bildir: () => void) => {
  document.addEventListener('fullscreenchange', bildir)
  document.addEventListener('webkitfullscreenchange', bildir)
  return () => {
    document.removeEventListener('fullscreenchange', bildir)
    document.removeEventListener('webkitfullscreenchange', bildir)
  }
}

type WebkitBelge = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void }
type WebkitOge = HTMLElement & { webkitRequestFullscreen?: () => void }

const tamEkranOgesi = () => document.fullscreenElement ?? (document as WebkitBelge).webkitFullscreenElement ?? null

export function useTamEkran(): [boolean, () => void] {
  const acik = useSyncExternalStore(tamEkranAbone, () => tamEkranOgesi() !== null, () => false)
  const degistir = useCallback(() => {
    if (tamEkranOgesi()) {
      if (document.exitFullscreen) void document.exitFullscreen()
      else (document as WebkitBelge).webkitExitFullscreen?.()
    } else {
      const kok = document.documentElement as WebkitOge
      if (kok.requestFullscreen) void kok.requestFullscreen().catch(() => {})
      else kok.webkitRequestFullscreen?.()
    }
  }, [])
  return [acik, degistir]
}
