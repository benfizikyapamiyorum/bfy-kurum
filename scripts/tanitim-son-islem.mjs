// Tanıtım dosyasının (dist-tanitim/index.html) son işlemi. Amaç: hangi ortamda açılırsa açılsın
// boş beyaz sayfa yerine ya platform ya da ne yapılacağını söyleyen bir yazı görünsün.
//  1. Uygulama betiği <head> içinden <body> sonuna taşınır ve klasik betik olur (modül desteği gerekmez).
//  2. Betik hiç çalışmazsa (telefon dosya önizlemesi, e-posta ya da WhatsApp önizlemesi) görünen yazı.
//  3. Betik çalışır ama açılışta hata olursa (çok eski tarayıcı) görünen yazı.
//  Uygulama açılınca React, #kok içindeki yedek yazının yerine kendi ekranını koyar.

import { readFileSync, writeFileSync } from 'node:fs'

const yol = new URL('../dist-tanitim/index.html', import.meta.url)
let html = readFileSync(yol, 'utf8')

const bas = html.indexOf('<script type="module"')
if (bas < 0) throw new Error('Uygulama betiği bulunamadı.')
const kapanis = html.indexOf('</script>', bas)
// Betik içeriğinde "</script>" metni geçemez (derleyici kaçırır); ilk kapanış betiğin sonudur.
const etiketSonu = html.indexOf('>', bas) + 1
const hamKod = html.slice(etiketSonu, kapanis)
html = html.slice(0, bas) + html.slice(kapanis + '</script>'.length)
// Klasik betikte import.meta yoktur. Gömülü dosyada yalnızca adres çözmek için geçiyor; sayfa adresi aynı işi görür.
const kod = hamKod.replaceAll('import.meta.resolve', 'void 0').replaceAll('import.meta.url', 'document.baseURI')
if (kod.includes('import.meta')) throw new Error('Kodda çevrilemeyen import.meta kaldı.')

const yedek = `<div style="max-width:640px;margin:48px auto;padding:0 20px;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#18202b;line-height:1.55">
<h1 style="font-size:22px;margin:0 0 12px">Fizik Kurs Sistemi</h1>
<p id="yukleniyor-yazisi">Platform açılıyor.</p>
<p style="background:#fff4d9;border-radius:10px;padding:12px 14px">Bu yazı kaybolmuyorsa dosya bir önizleme ekranında açılmış demektir. Telefonun dosya önizlemesi, e-posta ve mesajlaşma uygulamalarının önizlemesi programları çalıştırmaz.</p>
<p><strong>Bilgisayarda:</strong> dosyayı indirin, ardından çift tıklayın ya da Chrome, Edge, Safari veya Firefox ile açın.</p>
<p><strong>Telefonda:</strong> size gönderilen internet bağlantısını kullanın.</p>
</div>`

const hataYakalayici = `<script>
window.__tanitimHata = function (mesaj) {
  var k = document.getElementById('kok');
  // Uygulama açıldıysa yedek yazı gitmiştir; sonradan çıkan önemsiz hatalar sayfayı silmesin.
  if (!k || !document.getElementById('yukleniyor-yazisi')) return;
  k.innerHTML = '<div style="max-width:640px;margin:48px auto;padding:0 20px;font-family:Arial,sans-serif;line-height:1.55">' +
    '<h1 style="font-size:22px">Fizik Kurs Sistemi</h1>' +
    '<p style="background:#fde8e6;border-radius:10px;padding:12px 14px">Bu tarayıcı platformu çalıştıramadı. Lütfen güncel bir Chrome, Edge, Safari ya da Firefox ile açın.</p>' +
    '<p style="color:#5a6676;font-size:13px">Teknik ayrıntı: ' + String(mesaj).replace(/[<>&]/g, '') + '</p></div>';
};
window.addEventListener('error', function (e) { window.__tanitimHata(e.message || 'Bilinmeyen hata'); });
window.addEventListener('unhandledrejection', function (e) { window.__tanitimHata((e.reason && e.reason.message) || 'Bilinmeyen hata'); });
</script>`

// Not: replace ikinci argümanı fonksiyon; metin olsaydı koddaki "$'" gibi diziler özel anlam kazanırdı.
html = html.replace('<div id="kok"></div>', () => `${hataYakalayici}<div id="kok">${yedek}</div><script>(function(){"use strict";\n${kod}\n})();</script>`)
writeFileSync(yol, html)
console.log('Tanıtım dosyası hazır:', Math.round(html.length / 1024), 'KB')
