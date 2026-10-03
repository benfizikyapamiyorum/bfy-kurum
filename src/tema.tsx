import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tercihOku, tercihYaz } from './tercihler'

export type TemaSecimi = 'sistem' | 'acik' | 'koyu'

interface TemaDurumu {
  secim: TemaSecimi
  /** Sistem tercihi çözülmüş hâli. */
  etkin: 'acik' | 'koyu'
  yuksekKontrast: boolean
  temaSec: (t: TemaSecimi) => void
  kontrastAyarla: (acik: boolean) => void
}

const TemaBaglami = createContext<TemaDurumu | null>(null)

const sistemKoyuMu = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export function TemaSaglayici({ children }: { children: ReactNode }) {
  const [secim, setSecim] = useState<TemaSecimi>(() => tercihOku<TemaSecimi>('tema', 'sistem'))
  const [yuksekKontrast, setKontrast] = useState(() => tercihOku('yuksekKontrast', false))
  const [sistemKoyu, setSistemKoyu] = useState(sistemKoyuMu)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const dinle = () => setSistemKoyu(mq.matches)
    mq.addEventListener('change', dinle)
    return () => mq.removeEventListener('change', dinle)
  }, [])

  const etkin: 'acik' | 'koyu' = secim === 'sistem' ? (sistemKoyu ? 'koyu' : 'acik') : secim

  useEffect(() => {
    const kok = document.documentElement
    kok.dataset.tema = etkin
    if (yuksekKontrast) kok.dataset.kontrast = 'yuksek'
    else delete kok.dataset.kontrast
  }, [etkin, yuksekKontrast])

  const temaSec = useCallback((t: TemaSecimi) => {
    setSecim(t)
    tercihYaz('tema', t)
  }, [])
  const kontrastAyarla = useCallback((acik: boolean) => {
    setKontrast(acik)
    tercihYaz('yuksekKontrast', acik)
  }, [])

  const deger = useMemo(
    () => ({ secim, etkin, yuksekKontrast, temaSec, kontrastAyarla }),
    [secim, etkin, yuksekKontrast, temaSec, kontrastAyarla],
  )
  return <TemaBaglami.Provider value={deger}>{children}</TemaBaglami.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema(): TemaDurumu {
  const t = useContext(TemaBaglami)
  if (!t) throw new Error('useTema yalnızca TemaSaglayici içinde kullanılabilir.')
  return t
}
