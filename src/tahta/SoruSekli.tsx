import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { sekilSvgTemizle } from '../bilesenler/zenginMetin'
import { SekilAnimatoru } from './animasyon'

interface Ozellikler {
  svg: string
  /** Açık olan çözüm adımı sayısı: 0 soru, k k. adım. */
  adim: number
  /** Değişince açık adımlar baştan çizilir. */
  yenidenOynatSayaci?: number
  animasyonlu?: boolean
  onAnimasyonVar?: (var_: boolean) => void
}

export function SoruSekli({ svg, adim, yenidenOynatSayaci = 0, animasyonlu = true, onAnimasyonVar }: Ozellikler) {
  const kap = useRef<HTMLDivElement>(null)
  const animator = useRef<SekilAnimatoru | null>(null)
  const temiz = useMemo(() => sekilSvgTemizle(svg), [svg])

  // Şekil değişince animatörü yeniden kur.
  useLayoutEffect(() => {
    const kok = kap.current?.querySelector('svg')
    if (!kok) return
    const a = new SekilAnimatoru(kok, { animasyonlu })
    animator.current = a
    onAnimasyonVar?.(!a.bosMu)
    return () => {
      a.durdur()
      animator.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temiz, animasyonlu])

  useEffect(() => {
    animator.current?.adimaGit(adim)
  }, [adim, temiz])

  useEffect(() => {
    if (yenidenOynatSayaci > 0) animator.current?.yenidenOynat()
  }, [yenidenOynatSayaci])

  return <div ref={kap} className="soru-sekli" dangerouslySetInnerHTML={{ __html: temiz }} />
}
