import { useMemo } from 'react'
import 'katex/dist/katex.min.css'
import { zenginMetinHtml } from './zenginMetin'

export function ZenginMetin({ metin, etiket = 'div', sinif }: { metin: string; etiket?: 'div' | 'span'; sinif?: string }) {
  const html = useMemo(() => zenginMetinHtml(metin), [metin])
  const Etiket = etiket
  return <Etiket className={sinif} dangerouslySetInnerHTML={{ __html: html }} />
}
