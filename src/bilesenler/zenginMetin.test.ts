// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { ornekSorular } from '../veri/ornekSorular'
import { sekilSvgTemizle, zenginMetinHtml } from './zenginMetin'

const oznitelikler = (html: string) => {
  const d = new DOMParser().parseFromString(html, 'text/html')
  return [...d.body.querySelectorAll('*')].flatMap((e) =>
    [...e.attributes].map((a) => `${e.tagName.toLowerCase()}@${a.name}=${a.value}`),
  )
}

describe('zengin metin', () => {
  it('formülleri KaTeX ile işler', () => {
    const h = zenginMetinHtml('Hız $\\vartheta = 10$ m/s olur.')
    expect(h).toContain('class="katex"')
    expect(h).toContain('Hız ')
    expect(h).toContain(' m/s olur.')
  })

  it('betik ve olay özniteliklerini temizler', () => {
    const h = zenginMetinHtml('<img src=x onerror="alert(1)"><script>alert(2)</script><b onclick="x()">kalın</b>')
    expect(h).toBe('<b>kalın</b>')
  })

  it('formül içindeki < ve > işaretleri HTML olarak yorumlanmaz', () => {
    const h = zenginMetinHtml('$a < b > c$')
    expect(h).toContain('class="katex"')
    expect(h).not.toContain('<b')
  })

  it('kaçışlı dolar işareti formül başlatmaz', () => {
    expect(zenginMetinHtml('Fiyat \\$5 ve \\$6.')).toBe('Fiyat $5 ve $6.')
  })

  it('örnek soru şekilleri temizlemeden sonra öznitelik kaybetmez', () => {
    for (const s of ornekSorular) {
      if (!s.sekil_svg) continue
      const once = oznitelikler(s.sekil_svg).sort()
      const sonra = oznitelikler(sekilSvgTemizle(s.sekil_svg)).sort()
      expect(sonra).toEqual(once)
    }
  })

  it('şekildeki betik ve dış bağlantıları temizler', () => {
    const kirli =
      '<svg><script>alert(1)</script><circle r="3" onload="alert(2)" data-ciz-adim="1"/><a href="javascript:x"><text>t</text></a><foreignObject><div>x</div></foreignObject></svg>'
    const temiz = sekilSvgTemizle(kirli)
    expect(temiz).not.toMatch(/script|onload|javascript|foreignObject/i)
    expect(temiz).toContain('data-ciz-adim="1"')
  })
})
