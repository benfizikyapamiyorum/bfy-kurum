// Soru gövdesi, şık ve çözüm adımları için zengin metin: sınırlı HTML + $...$ arasında KaTeX formülü.
// Tüm HTML ve SVG, ekrana basılmadan önce DOMPurify ile temizlenir (betik, olay özniteliği, dış bağlantı yok).

import DOMPurify from 'dompurify'
import katex from 'katex'

const METIN_ETIKETLERI = ['b', 'strong', 'i', 'em', 'u', 'br', 'sub', 'sup', 'span', 'p', 'ul', 'ol', 'li', 'small']

/** $...$ formüllerini KaTeX ile işler, geri kalan HTML'i temizler. */
export function zenginMetinHtml(kaynak: string): string {
  const formuller: string[] = []
  // $$ ... $$ (blok) ve $ ... $ (satır içi). Kaçışlı \$ formül başlatmaz.
  const yerTutuculu = kaynak.replace(/(?<!\\)\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$]+?)\$/g, (_, blok, satir) => {
    const ifade = (blok ?? satir) as string
    formuller.push(
      katex.renderToString(ifade, {
        throwOnError: false,
        displayMode: blok !== undefined,
        output: 'htmlAndMathml',
        strict: 'ignore',
      }),
    )
    return `⁣F${formuller.length - 1}⁣`
  })
  const temiz = DOMPurify.sanitize(yerTutuculu.replace(/\\\$/g, '$'), {
    ALLOWED_TAGS: METIN_ETIKETLERI,
    ALLOWED_ATTR: ['class'],
  })
  return temiz.replace(/⁣F(\d+)⁣/g, (_, i) => formuller[Number(i)] ?? '')
}

/** Soru şekli: yalnızca tek bir SVG; data-ciz-* animasyon öznitelikleri korunur. */
export function sekilSvgTemizle(kaynak: string): string {
  return DOMPurify.sanitize(kaynak, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ['paint-order', 'aria-label', 'role'],
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['foreignObject', 'script', 'style', 'a', 'image', 'use'],
  })
}
