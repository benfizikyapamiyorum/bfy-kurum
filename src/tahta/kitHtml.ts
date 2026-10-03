// Tek dosyalık HTML kitleri güvenli bir iframe içinde açmak için hazırlık.
//
// Kit, sandbox="allow-scripts ..." ile ama allow-same-origin OLMADAN açılır: kitin betikleri çalışır,
// ancak uygulamanın oturumuna, çerezlerine ve IndexedDB'sine erişemez. Bu durumda kitin
// localStorage erişimi tarayıcı tarafından engellenir ve hata fırlatır; kit bozulmasın diye
// başına bellekte çalışan bir localStorage/sessionStorage yerine geçeni eklenir.

const SHIM = `<script>(function(){
  function Bellek(){ var v = {}; return {
    getItem: function(k){ k = String(k); return Object.prototype.hasOwnProperty.call(v, k) ? v[k] : null; },
    setItem: function(k, d){ v[String(k)] = String(d); },
    removeItem: function(k){ delete v[String(k)]; },
    clear: function(){ v = {}; },
    key: function(i){ return Object.keys(v)[i] || null; },
    get length(){ return Object.keys(v).length; }
  }; }
  ['localStorage', 'sessionStorage'].forEach(function(ad){
    try { window[ad].getItem('_'); } catch (e) {
      try { Object.defineProperty(window, ad, { value: Bellek(), configurable: true }); } catch (e2) {}
    }
  });
})();</script>`

/** Kit HTML'inin başına depolama yerine geçenini ekler. */
export function kitSrcdoc(html: string): string {
  const head = /<head[^>]*>/i.exec(html)
  if (head) return html.slice(0, head.index + head[0].length) + SHIM + html.slice(head.index + head[0].length)
  const htmlEtiketi = /<html[^>]*>/i.exec(html)
  if (htmlEtiketi) {
    const i = htmlEtiketi.index + htmlEtiketi[0].length
    return html.slice(0, i) + `<head>${SHIM}</head>` + html.slice(i)
  }
  return SHIM + html
}

/** Kitin <title> etiketinden başlık. */
export function kitBasligi(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  if (!m?.[1]) return null
  const t = document.createElement('textarea')
  t.innerHTML = m[1].trim()
  return t.value.replace(/\s+/g, ' ') || null
}

export const KIT_SANDBOX = 'allow-scripts allow-forms allow-popups allow-modals allow-downloads'

/** Dosya adından hafta numarası tahmini: "hafta-07.html", "9-sinif-hafta7.html", "H07.html". */
export function haftaTahmini(dosyaAdi: string): string {
  const m = /(?:hafta|h)[\s_-]*0*(\d{1,2})/i.exec(dosyaAdi)
  return m?.[1] ?? ''
}
