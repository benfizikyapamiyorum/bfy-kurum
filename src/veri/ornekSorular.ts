// Sistemi göstermek için yazılmış ÖRNEK sorular (en fazla 10).
// Hepsi ornek = true işaretlidir ve arayüzde "ÖRNEK" rozetiyle görünür. Gerçek içerik sonradan aktarılır.
// Sorular özgündür; MEB ders kitabından metin, soru, şekil ya da sayısal veri alınmamıştır.
// Sayısal sonuçlar src/veri/ornekSorular.test.ts içinde kodla yeniden hesaplanır.
// Serbest düşme ve atış sorularında g = 10 m/s² alınır ve hava direnci önemsenmez (soru metninde yazar).

import type { Soru } from '../alan/tipler'
import { kazanimIdKoddan, sabitKimlik } from './katalog'
import { RENK, alt, anim, eksenler, kesikCizgi, ok, olcu, svg, vektorAdi, yazi } from './sekilYardimci'

const kimlik = (n: number) => sabitKimlik('50', n)
const kz = (...kodlar: string[]) => kodlar.map(kazanimIdKoddan)

// ---------------------------------------------------------------------------
// 1. Aynı doğrultudaki vektörler (9. sınıf)
// ---------------------------------------------------------------------------
const birim = 36
const gx = (i: number) => 26 + i * birim
const gy = (j: number) => 20 + j * birim

const izgara = (() => {
  let t = `<rect x="${gx(0)}" y="${gy(0)}" width="${13 * birim}" height="${5 * birim}" fill="#fbfcfe"/>`
  for (let i = 0; i <= 13; i++)
    t += `<line x1="${gx(i)}" y1="${gy(0)}" x2="${gx(i)}" y2="${gy(5)}" stroke="${RENK.izgara}" stroke-width="1"/>`
  for (let j = 0; j <= 5; j++)
    t += `<line x1="${gx(0)}" y1="${gy(j)}" x2="${gx(13)}" y2="${gy(j)}" stroke="${RENK.izgara}" stroke-width="1"/>`
  return t
})()

const sekilVektor = svg(
  520,
  222,
  izgara +
    ok(gx(1), gy(1), gx(5), gy(1), RENK.mavi, { adim: 0, sure: 700 }) +
    vektorAdi(gx(3), gy(1) - 10, 'K', RENK.mavi) +
    ok(gx(10), gy(2), gx(4), gy(2), RENK.kirmizi, { adim: 0, sure: 900, gecikme: 500 }) +
    vektorAdi(gx(7), gy(2) - 10, 'L', RENK.kirmizi) +
    // 2. adım: K + L bileşkesi (2 birim sola)
    ok(gx(4), gy(4), gx(2), gy(4), RENK.mor, { adim: 2, sure: 700 }, 3.5, 13, true) +
    yazi(gx(3), gy(4) - 12, 'K + L', { renk: RENK.mor, kalin: true }, { adim: 2, gecikme: 500 }) +
    // 3. adım: M vektörü (2 birim sağa)
    ok(gx(9), gy(4), gx(11), gy(4), RENK.yesil, { adim: 3, sure: 700 }) +
    vektorAdi(gx(10), gy(4) - 10, 'M', RENK.yesil, { adim: 3, gecikme: 500 }) +
    yazi(gx(12) + 2, gy(5) + 17, '1 birim', { renk: RENK.soluk, boyut: 13, hiza: 'middle' }) +
    `<line x1="${gx(12)}" y1="${gy(5) + 4}" x2="${gx(13)}" y2="${gy(5) + 4}" stroke="${RENK.soluk}" stroke-width="1.4"/>`,
  'Birim karelere çizilmiş K ve L vektörleri.',
)

// ---------------------------------------------------------------------------
// 2. Koşu pisti: yol ve yer değiştirme (9. sınıf)
// ---------------------------------------------------------------------------
const pistYolu = 'M260 200 H167 A80 80 0 0 1 167 40 H353 A80 80 0 0 1 353 200 Z'
const sekilPist = svg(
  520,
  250,
  `<defs>
    <radialGradient id="q2-kosucu" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffb37a"/><stop offset="1" stop-color="#c2410c"/></radialGradient>
    <linearGradient id="q2-cim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fbf73"/><stop offset="1" stop-color="#3f8f4a"/></linearGradient>
  </defs>` +
    `<path d="${pistYolu}" fill="none" stroke="#b5532f" stroke-width="44" stroke-linejoin="round"/>` +
    `<path d="${pistYolu}" fill="none" stroke="#c9653f" stroke-width="40" stroke-linejoin="round"/>` +
    `<path d="M167 62 H353 A58 58 0 0 1 353 178 H167 A58 58 0 0 1 167 62 Z" fill="url(#q2-cim)" stroke="#ffffff" stroke-width="2"/>` +
    `<path d="${pistYolu}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.8"/>` +
    `<path d="M167 18 H353 A102 102 0 0 1 353 222 H167 A102 102 0 0 1 167 18 Z" fill="none" stroke="#ffffff" stroke-width="2"/>` +
    `<line x1="260" y1="178" x2="260" y2="222" stroke="#ffffff" stroke-width="5"/>` +
    yazi(260, 244, 'Başlangıç ve bitiş çizgisi', { boyut: 14 }) +
    `<path id="q2-yol" d="${pistYolu}" fill="none" stroke="none"/>` +
    `<circle cx="0" cy="0" r="10" fill="url(#q2-kosucu)" stroke="#7c2d12" stroke-width="1.5" transform="translate(260 200)" data-ciz-adim="1" data-ciz-tur="hareket" data-ciz-yol="q2-yol" data-ciz-sure="2600"/>` +
    yazi(260, 125, 'Alınan yol: 400 m', { kalin: true, boyut: 17 }, { adim: 1, gecikme: 2600 }) +
    yazi(260, 150, 'Yer değiştirme: 0 m', { kalin: true, boyut: 17, renk: RENK.kirmizi }, { adim: 2 }),
  'Kapalı koşu pisti ve başlangıç çizgisi.',
)

// ---------------------------------------------------------------------------
// 4. Konum-zaman grafiği (10. sınıf)
// ---------------------------------------------------------------------------
// Ölçek: 1 s = 60 px, 1 m = 10/3 px; orijin (70, 270).
const kt = (t: number) => 70 + 60 * t
const kx = (x: number) => 270 - (10 / 3) * x
const sekilKonum = svg(
  520,
  310,
  kesikCizgi(kt(3), kx(0), kt(3), kx(30)) +
    kesikCizgi(kt(6), kx(0), kt(6), kx(60)) +
    kesikCizgi(kt(0), kx(30), kt(6), kx(30)) +
    kesikCizgi(kt(0), kx(60), kt(6), kx(60)) +
    eksenler(kt(0), kx(0), 470, 34, 'x (m)', 't (s)') +
    yazi(kt(3), kx(0) + 20, '3', { boyut: 14 }) +
    yazi(kt(6), kx(0) + 20, '6', { boyut: 14 }) +
    yazi(kt(0) - 8, kx(30) + 5, '30', { boyut: 14, hiza: 'end' }) +
    yazi(kt(0) - 8, kx(60) + 5, '60', { boyut: 14, hiza: 'end' }) +
    `<line x1="${kt(0)}" y1="${kx(0)}" x2="${kt(6)}" y2="${kx(60)}" stroke="${RENK.mavi}" stroke-width="4" stroke-linecap="round"${anim({ adim: 0, sure: 900 })}/>` +
    `<line x1="${kt(0)}" y1="${kx(60)}" x2="${kt(6)}" y2="${kx(30)}" stroke="${RENK.kirmizi}" stroke-width="4" stroke-linecap="round"${anim({ adim: 0, sure: 900, gecikme: 400 })}/>` +
    yazi(kt(6) + 12, kx(60) + 6, 'K', { renk: RENK.mavi, kalin: true, hiza: 'start', boyut: 18 }) +
    yazi(kt(6) + 12, kx(30) + 6, 'L', { renk: RENK.kirmizi, kalin: true, hiza: 'start', boyut: 18 }) +
    // 3. adım: karşılaşma noktası
    `<g${anim({ adim: 3 })}>` +
    kesikCizgi(kt(4), kx(0), kt(4), kx(40), RENK.yesil) +
    kesikCizgi(kt(0), kx(40), kt(4), kx(40), RENK.yesil) +
    `<circle cx="${kt(4)}" cy="${kx(40)}" r="7" fill="${RENK.yesil}" stroke="#fff" stroke-width="2"/>` +
    yazi(kt(4), kx(0) + 20, '4', { boyut: 14, renk: RENK.yesil, kalin: true }) +
    yazi(kt(0) - 8, kx(40) + 5, '40', { boyut: 14, renk: RENK.yesil, kalin: true, hiza: 'end' }) +
    `</g>`,
  'K ve L araçlarının konum-zaman grafiği.',
)

// ---------------------------------------------------------------------------
// 5. Hız-zaman grafiği (10. sınıf)
// ---------------------------------------------------------------------------
// Ölçek: 1 s = 38 px, 1 m/s = 40/3 px; orijin (70, 250).
const vt = (t: number) => 70 + 38 * t
const vv = (v: number) => 250 - (40 / 3) * v
const grafik = `${vt(0)},${vv(0)} ${vt(4)},${vv(12)} ${vt(8)},${vv(12)} ${vt(10)},${vv(0)}`
const sekilHiz = svg(
  520,
  290,
  // 3. adım: alanlar (önce çizilir ki çizginin altında kalsın)
  `<g${anim({ adim: 3, sure: 600 })}>` +
    `<polygon points="${vt(0)},${vv(0)} ${vt(4)},${vv(12)} ${vt(4)},${vv(0)}" fill="${RENK.mavi}" fill-opacity="0.16"/>` +
    `<polygon points="${vt(4)},${vv(0)} ${vt(4)},${vv(12)} ${vt(8)},${vv(12)} ${vt(8)},${vv(0)}" fill="${RENK.yesil}" fill-opacity="0.16"/>` +
    `<polygon points="${vt(8)},${vv(0)} ${vt(8)},${vv(12)} ${vt(10)},${vv(0)}" fill="${RENK.turuncu}" fill-opacity="0.2"/>` +
    yazi((vt(0) + 2 * vt(4)) / 3, vv(3.5), '24 m', { boyut: 15, kalin: true, renk: RENK.mavi }) +
    yazi((vt(4) + vt(8)) / 2, vv(5), '48 m', { boyut: 15, kalin: true, renk: RENK.yesil }) +
    yazi(vt(8) + 25, vv(2.2), '12 m', { boyut: 15, kalin: true, renk: RENK.turuncu }) +
    `</g>` +
    kesikCizgi(vt(4), vv(0), vt(4), vv(12)) +
    kesikCizgi(vt(8), vv(0), vt(8), vv(12)) +
    kesikCizgi(vt(0), vv(12), vt(4), vv(12)) +
    eksenler(vt(0), vv(0), 470, 34, 'ϑ (m/s)', 't (s)') +
    yazi(vt(4), vv(0) + 20, '4', { boyut: 14 }) +
    yazi(vt(8), vv(0) + 20, '8', { boyut: 14 }) +
    yazi(vt(10), vv(0) + 20, '10', { boyut: 14 }) +
    yazi(vt(0) - 8, vv(12) + 5, '12', { boyut: 14, hiza: 'end' }) +
    `<polyline points="${grafik}" fill="none" stroke="${RENK.cizgi}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"${anim({ adim: 0, sure: 1200 })}/>` +
    // 1. adım: ilk bölümün eğimi
    `<line x1="${vt(0)}" y1="${vv(0)}" x2="${vt(4)}" y2="${vv(12)}" stroke="${RENK.mavi}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.85"${anim({ adim: 1, sure: 700 })}/>` +
    // 2. adım: ikinci ve üçüncü bölüm
    `<line x1="${vt(4)}" y1="${vv(12)}" x2="${vt(8)}" y2="${vv(12)}" stroke="${RENK.yesil}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.85"${anim({ adim: 2, sure: 600 })}/>` +
    `<line x1="${vt(8)}" y1="${vv(12)}" x2="${vt(10)}" y2="${vv(0)}" stroke="${RENK.turuncu}" stroke-width="7" stroke-linecap="round" stroke-opacity="0.85"${anim({ adim: 2, sure: 500, gecikme: 600 })}/>`,
  'Otomobilin hız-zaman grafiği.',
)

// ---------------------------------------------------------------------------
// 6. Fren yapan otobüs (10. sınıf)
// ---------------------------------------------------------------------------
const tekerlek = (x: number) =>
  `<circle cx="${x}" cy="152" r="18" fill="#22262b"/><circle cx="${x}" cy="152" r="8" fill="url(#q6-jant)"/>`
const sekilOtobus = svg(
  520,
  215,
  `<defs>
    <linearGradient id="q6-govde" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd76a"/><stop offset="0.55" stop-color="#f5b81f"/><stop offset="1" stop-color="#c98a06"/></linearGradient>
    <linearGradient id="q6-cam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9ecfb"/><stop offset="1" stop-color="#7fb2dc"/></linearGradient>
    <radialGradient id="q6-jant" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#f1f3f5"/><stop offset="1" stop-color="#8a939c"/></radialGradient>
    <linearGradient id="q6-yol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7178"/><stop offset="1" stop-color="#474c52"/></linearGradient>
  </defs>` +
    `<rect x="0" y="160" width="520" height="55" fill="url(#q6-yol)"/>` +
    `<line x1="0" y1="190" x2="428" y2="190" stroke="#f4f4f4" stroke-width="3" stroke-dasharray="26 18"/>` +
    [440, 455, 470, 485, 500].map((x) => `<rect x="${x}" y="163" width="8" height="49" fill="#f4f4f4"/>`).join('') +
    `<ellipse cx="240" cy="171" rx="105" ry="6" fill="#000" opacity="0.25"/>` +
    `<path d="M140 150 V82 Q140 68 154 68 H318 Q336 68 340 86 L346 120 V150 Z" fill="url(#q6-govde)" stroke="#8a5a00" stroke-width="2"/>` +
    [154, 192, 230, 268].map((x) => `<rect x="${x}" y="80" width="32" height="30" rx="4" fill="url(#q6-cam)" stroke="#5e7d96"/>`).join('') +
    `<path d="M306 80 H322 Q330 80 332 88 L337 112 H306 Z" fill="url(#q6-cam)" stroke="#5e7d96"/>` +
    `<rect x="140" y="124" width="206" height="6" fill="#8a5a00" opacity="0.35"/>` +
    `<rect x="340" y="128" width="8" height="10" rx="2" fill="#fff6c9" stroke="#8a5a00"/>` +
    tekerlek(184) +
    tekerlek(298) +
    ok(180, 44, 300, 44, RENK.mavi, { adim: 0, sure: 600 }) +
    yazi(240, 30, 'ϑ = 20 m/s', { renk: RENK.mavi, kalin: true }) +
    // 3. adım: ivme vektörü harekete zıt
    ok(410, 110, 362, 110, RENK.kirmizi, { adim: 3, sure: 500 }) +
    yazi(386, 96, 'a', { renk: RENK.kirmizi, kalin: true, italik: true, boyut: 18 }, { adim: 3, gecikme: 300 }),
  'Yaya geçidine yaklaşırken fren yapan otobüs.',
)

// ---------------------------------------------------------------------------
// 7. Binadan serbest bırakılan taş (11. sınıf)
// ---------------------------------------------------------------------------
// Ölçek: 80 m = 260 px (3,25 px/m). Taşın merkezi çatı hizasında y = 33, yerde y = 293.
const ty = (d: number) => 33 + 3.25 * d
const pencereler = (() => {
  // 80 m ≈ 25 kat: her kat yaklaşık 10,4 px.
  let t = ''
  for (let kat = 0; kat < 25; kat++)
    for (const x of [110, 128, 146, 164, 182])
      t += `<rect x="${x}" y="${45 + kat * 10.3}" width="12" height="6" rx="1" fill="url(#q7-cam)"/>`
  return t
})()
const sekilBina = svg(
  520,
  330,
  `<defs>
    <linearGradient id="q7-bina" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9ced6"/><stop offset="0.7" stop-color="#e6e9ee"/><stop offset="1" stop-color="#aab1bb"/></linearGradient>
    <linearGradient id="q7-cam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe5f7"/><stop offset="1" stop-color="#6e9fc8"/></linearGradient>
    <radialGradient id="q7-tas" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#b9b2a6"/><stop offset="1" stop-color="#5d564c"/></radialGradient>
  </defs>` +
    `<rect x="0" y="300" width="520" height="30" fill="#8d7b63"/>` +
    `<rect x="0" y="300" width="520" height="5" fill="#6f8f4e"/>` +
    `<rect x="100" y="40" width="110" height="260" fill="url(#q7-bina)" stroke="#7d8591" stroke-width="1.5"/>` +
    `<rect x="96" y="34" width="118" height="8" rx="2" fill="#7d8591"/>` +
    pencereler +
    olcu(70, 40, 70, 300) +
    yazi(62, 175, '80 m', { hiza: 'end', kalin: true }) +
    // Hayalet konumlar ve zaman etiketleri (3. adım)
    `<g${anim({ adim: 3, sure: 700 })}>` +
    [1, 2, 3].map((t) => `<circle cx="220" cy="${ty(5 * t * t)}" r="6" fill="#7a7266" opacity="0.45"/>`).join('') +
    [0, 1, 2, 3, 4]
      .map((t) =>
        yazi(236, [30, 58, ty(20) + 5, ty(45) + 5, 289][t] as number, `t = ${t} s`, {
          hiza: 'start',
          boyut: 14,
          renk: RENK.soluk,
        }),
      )
      .join('') +
    kesikCizgi(318, ty(45), 352, ty(45), RENK.turuncu) +
    olcu(340, ty(45), 340, ty(80), RENK.turuncu) +
    yazi(350, (ty(45) + ty(80)) / 2 + 5, 'son 1 s', { hiza: 'start', renk: RENK.turuncu, kalin: true }) +
    `</g>` +
    `<circle cx="0" cy="0" r="7" fill="url(#q7-tas)" stroke="#3f3a33" transform="translate(220 ${ty(0)})"` +
    ` data-ciz-adim="1" data-ciz-tur="kinematik" data-ciz-p0="220,${ty(0)}" data-ciz-v="0,0" data-ciz-a="0,32.5" data-ciz-t="4" data-ciz-sure="2000"/>`,
  'Yüksek bir binanın çatısından serbest bırakılan taş.',
)

// ---------------------------------------------------------------------------
// 8. Uçurumdan yatay atış (11. sınıf)
// ---------------------------------------------------------------------------
// Ölçek: 4 px/m. Top merkezi başlangıçta (126, 82), yere (366, 262) iner.
// Yatay: 20 m/s = 80 px/s; düşey ivme: 10 m/s² = 40 px/s².
const sekilAtis = svg(
  560,
  320,
  `<defs>
    <linearGradient id="q8-kaya" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c7a63"/><stop offset="1" stop-color="#b59f80"/></linearGradient>
    <radialGradient id="q8-top" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c62828"/></radialGradient>
    <linearGradient id="q8-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef6fd"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
  </defs>` +
    `<rect x="0" y="0" width="560" height="270" fill="url(#q8-gok)"/>` +
    `<rect x="0" y="270" width="560" height="50" fill="#9c8a6c"/>` +
    `<rect x="0" y="270" width="560" height="5" fill="#6f8f4e"/>` +
    `<path d="M0 90 H118 L122 120 L116 160 L124 205 L119 240 L128 270 H0 Z" fill="url(#q8-kaya)" stroke="#6b5b47" stroke-width="1.5"/>` +
    `<rect x="0" y="86" width="120" height="6" fill="#6f8f4e"/>` +
    olcu(150, 90, 150, 270) +
    yazi(158, 185, '45 m', { hiza: 'start', kalin: true }) +
    ok(136, 66, 196, 66, RENK.mavi, { adim: 0, sure: 500 }) +
    yazi(166, 52, `${alt('ϑ', '0')} = 20 m/s`, { renk: RENK.mavi, kalin: true }) +
    // 2. adım: yörünge ve menzil
    `<path d="M126 82 Q246 82 366 262" fill="none" stroke="${RENK.soluk}" stroke-width="2" stroke-dasharray="6 5"${anim({ adim: 2, sure: 900 })}/>` +
    `<g${anim({ adim: 2, gecikme: 900 })}>` +
    olcu(126, 296, 366, 296, RENK.yesil) +
    yazi(246, 290, '60 m', { renk: RENK.yesil, kalin: true }) +
    `</g>` +
    // 3. adım: çarpma anındaki hız bileşenleri (ayrı kutuda)
    `<g${anim({ adim: 3 })}>` +
    `<rect x="408" y="12" width="146" height="160" rx="10" fill="#ffffff" stroke="${RENK.izgara}"/>` +
    yazi(481, 30, 'Yere çarparken', { boyut: 13, renk: RENK.soluk }) +
    ok(428, 66, 488, 66, RENK.mavi, undefined, 3.5, 12) +
    yazi(436, 54, `${alt('ϑ', 'x')} = 20 m/s`, { boyut: 14, renk: RENK.mavi, kalin: true, hiza: 'start' }) +
    ok(428, 66, 428, 156, RENK.kirmizi, undefined, 3.5, 12) +
    yazi(436, 116, `${alt('ϑ', 'y')} = 30 m/s`, { boyut: 14, renk: RENK.kirmizi, kalin: true, hiza: 'start' }) +
    `</g>` +
    `<circle cx="0" cy="0" r="8" fill="url(#q8-top)" stroke="#7f1d1d" transform="translate(126 82)"` +
    ` data-ciz-adim="1" data-ciz-tur="kinematik" data-ciz-p0="126,82" data-ciz-v="80,0" data-ciz-a="0,40" data-ciz-t="3" data-ciz-sure="2100"/>`,
  'Uçurumun kenarından yatay atılan top.',
)

// ---------------------------------------------------------------------------
// 9. İple bağlı bloklar (11. sınıf)
// ---------------------------------------------------------------------------
const blok = (x: number, y: number, g: number, h: number, ad: string, kutle: string, renk: [string, string]) =>
  `<linearGradient id="q9-${ad}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${renk[0]}"/><stop offset="1" stop-color="${renk[1]}"/></linearGradient>` +
  `<rect x="${x}" y="${y}" width="${g}" height="${h}" rx="3" fill="url(#q9-${ad})" stroke="#2b2f36" stroke-width="1.5"/>` +
  `<rect x="${x + 3}" y="${y + 3}" width="${g - 6}" height="5" rx="2" fill="#ffffff" opacity="0.35"/>` +
  yazi(x + g / 2, y + h / 2 - 2, ad, { kalin: true, boyut: 20, renk: '#ffffff' }).replace('stroke="#ffffff"', 'stroke="none"') +
  yazi(x + g / 2, y + h / 2 + 18, kutle, { boyut: 14, renk: '#ffffff' }).replace('stroke="#ffffff"', 'stroke="none"')
const tarama = (() => {
  let t = `<line x1="40" y1="140" x2="490" y2="140" stroke="${RENK.cizgi}" stroke-width="2.5"/>`
  for (let x = 46; x < 490; x += 14)
    t += `<line x1="${x}" y1="142" x2="${x - 10}" y2="154" stroke="${RENK.soluk}" stroke-width="1.2"/>`
  return t
})()
const sekilBloklar = svg(
  520,
  170,
  tarama +
    `<ellipse cx="130" cy="141" rx="42" ry="3" fill="#000" opacity="0.18"/>` +
    `<ellipse cx="300" cy="141" rx="52" ry="3" fill="#000" opacity="0.18"/>` +
    `<line x1="170" y1="112" x2="250" y2="112" stroke="#7a5a2b" stroke-width="3"/>` +
    blok(90, 84, 80, 56, 'K', '2 kg', ['#5b8fd6', '#2a5aa0']) +
    blok(250, 70, 100, 70, 'L', '3 kg', ['#e08a5a', '#b4532a']) +
    ok(350, 105, 450, 105, RENK.cizgi, { adim: 0, sure: 500 }, 3.5, 13) +
    yazi(400, 92, `F = 20 N`, { kalin: true }) +
    // 2. adım: K bloğuna etki eden ip gerilmesi
    ok(170, 112, 222, 112, RENK.kirmizi, { adim: 2, sure: 500 }, 4, 13) +
    yazi(198, 101, 'T', { renk: RENK.kirmizi, kalin: true, italik: true, boyut: 18 }, { adim: 2, gecikme: 300 }) +
    yazi(265, 30, 'Sürtünmesiz yatay düzlem', { renk: RENK.soluk, boyut: 13 }),
  'Sürtünmesiz düzlemde iple bağlı K ve L blokları.',
)

// ---------------------------------------------------------------------------
// Sorular
// ---------------------------------------------------------------------------
export const ornekSorular: Soru[] = [
  {
    id: kimlik(1),
    tur: 'coktan_secmeli',
    govde:
      'Birim karelere çizilmiş, aynı doğrultudaki $\\vec{K}$ ve $\\vec{L}$ vektörleri şekilde verilmiştir. ' +
      '$\\vec{K} + \\vec{L} + \\vec{M} = 0$ olması için $\\vec{M}$ vektörü nasıl olmalıdır?',
    sekil_svg: sekilVektor,
    secenekler: [
      { harf: 'A', metin: '2 birim, sağa doğru' },
      { harf: 'B', metin: '2 birim, sola doğru' },
      { harf: 'C', metin: '10 birim, sağa doğru' },
      { harf: 'D', metin: '10 birim, sola doğru' },
      { harf: 'E', metin: '6 birim, sağa doğru' },
    ],
    dogru_cevap: 'A',
    cozum_adimlari: [
      { metin: 'Sağ yönü pozitif seçelim. $\\vec{K}$ vektörü +4 birim, $\\vec{L}$ vektörü −6 birimdir.' },
      { metin: '$\\vec{K} + \\vec{L} = (+4) + (-6) = -2$ birim, yani bileşke 2 birim sola doğrudur.' },
      {
        metin:
          'Toplamın sıfır olması için $\\vec{M}$ bu bileşkeyle eşit büyüklükte ve zıt yönde olmalıdır: 2 birim, sağa doğru. Cevap A.',
      },
    ],
    zorluk: 2,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.9.2.3'),
  },
  {
    id: kimlik(2),
    tur: 'dogru_yanlis',
    govde:
      'Bir koşucu, 400 m uzunluğundaki kapalı bir pistte başlangıç çizgisinden koşmaya başlıyor ve bir tur atarak aynı çizgide duruyor. ' +
      'Bu koşucunun yer değiştirmesinin büyüklüğü, aldığı yola eşittir.',
    sekil_svg: sekilPist,
    secenekler: null,
    dogru_cevap: 'Y',
    cozum_adimlari: [
      { metin: 'Alınan yol skaler bir niceliktir ve izlenen yolun uzunluğudur: 400 m.' },
      {
        metin:
          'Yer değiştirme vektörel bir niceliktir; başlangıç noktasından bitiş noktasına çizilen vektördür. Koşucu başladığı yerde durduğu için yer değiştirme sıfırdır.',
      },
      { metin: '400 m ile sıfır eşit olmadığından ifade yanlıştır.' },
    ],
    zorluk: 2,
    baglam_temelli: true,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.9.2.2', 'FİZ.9.2.6'),
  },
  {
    id: kimlik(3),
    tur: 'coktan_secmeli',
    govde:
      'Aşağıdaki nicelik ve birim eşleştirmelerinin hangisinde, SI birim sistemindeki bir temel nicelik kendi SI temel birimiyle doğru eşleştirilmiştir?',
    sekil_svg: null,
    secenekler: [
      { harf: 'A', metin: 'Kütle: gram' },
      { harf: 'B', metin: 'Zaman: dakika' },
      { harf: 'C', metin: 'Işık şiddeti: lümen' },
      { harf: 'D', metin: 'Sıcaklık: kelvin' },
      { harf: 'E', metin: 'Uzunluk: kilometre' },
    ],
    dogru_cevap: 'D',
    cozum_adimlari: [
      { metin: 'Beş seçenekteki niceliklerin hepsi temel niceliktir. Ayırt edici olan birimdir.' },
      {
        metin:
          'SI temel birimleri: kütle için kilogram, zaman için saniye, ışık şiddeti için kandela, sıcaklık için kelvin, uzunluk için metredir.',
      },
      {
        metin:
          'Gram, dakika ve kilometre SI temel birimi değildir; lümen ise ışık akısının birimidir. Doğru eşleştirme D seçeneğidir.',
      },
    ],
    zorluk: 3,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.9.2.1'),
  },
  {
    id: kimlik(4),
    tur: 'coktan_secmeli',
    govde:
      'Düz bir yolda aynı doğrultuda hareket eden K ve L araçlarının konum-zaman grafikleri şekildeki gibidir. ' +
      'Araçlar hangi konumda yan yana gelir?',
    sekil_svg: sekilKonum,
    secenekler: [
      { harf: 'A', metin: '20 m' },
      { harf: 'B', metin: '30 m' },
      { harf: 'C', metin: '40 m' },
      { harf: 'D', metin: '45 m' },
      { harf: 'E', metin: '50 m' },
    ],
    dogru_cevap: 'C',
    cozum_adimlari: [
      {
        metin:
          'Konum-zaman grafiğinin eğimi hızı verir: $\\vartheta_K = \\dfrac{60 - 0}{6} = 10$ m/s, $\\vartheta_L = \\dfrac{30 - 60}{6} = -5$ m/s.',
      },
      { metin: 'Konum denklemleri: $x_K = 10t$ ve $x_L = 60 - 5t$.' },
      {
        metin: 'Yan yana gelmek için konumlar eşit olmalıdır: $10t = 60 - 5t$, buradan $t = 4$ s ve $x = 40$ m. Cevap C.',
      },
    ],
    zorluk: 3,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.10.1.1'),
  },
  {
    id: kimlik(5),
    tur: 'acik_uclu',
    govde:
      'Düz bir yolda durgun hâlden harekete geçen bir otomobilin hız-zaman grafiği şekildeki gibidir.<br>' +
      'a) Otomobilin 0-4 s, 4-8 s ve 8-10 s aralıklarındaki ivmelerini bulunuz.<br>' +
      'b) Otomobilin 10 s boyunca aldığı yolu bulunuz.',
    sekil_svg: sekilHiz,
    secenekler: null,
    dogru_cevap: 'a) 3 m/s², 0 ve −6 m/s². b) 84 m.',
    cozum_adimlari: [
      { metin: 'İvme, hız-zaman grafiğinin eğimidir. 0-4 s: $a = \\dfrac{12 - 0}{4} = 3$ m/s².' },
      {
        metin:
          '4-8 s aralığında hız değişmez, $a = 0$. 8-10 s: $a = \\dfrac{0 - 12}{2} = -6$ m/s²; eksi işaret ivmenin hareket yönüne zıt olduğunu gösterir.',
      },
      {
        metin:
          'Alınan yol, grafiğin altında kalan alandır: $\\dfrac{4 \\times 12}{2} + 4 \\times 12 + \\dfrac{2 \\times 12}{2} = 24 + 48 + 12 = 84$ m.',
      },
    ],
    zorluk: 4,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.10.1.2', 'FİZ.10.1.3'),
  },
  {
    id: kimlik(6),
    tur: 'coktan_secmeli',
    govde:
      'Düz bir yolda 20 m/s hızla giden bir otobüsün sürücüsü, ileride yaya geçidini görünce fren yapıyor. ' +
      'Otobüs aynı yönde ilerlemeye devam ederken hızı 4 s içinde düzgün olarak 8 m/s değerine düşüyor. ' +
      'Bu süre boyunca otobüsün ivmesinin büyüklüğü ve yönü nedir?',
    sekil_svg: sekilOtobus,
    secenekler: [
      { harf: 'A', metin: '3 m/s², hareket yönünde' },
      { harf: 'B', metin: '3 m/s², hareket yönüne zıt' },
      { harf: 'C', metin: '5 m/s², hareket yönüne zıt' },
      { harf: 'D', metin: '7 m/s², hareket yönünde' },
      { harf: 'E', metin: '2 m/s², hareket yönüne zıt' },
    ],
    dogru_cevap: 'B',
    cozum_adimlari: [
      { metin: 'Hareket yönünü pozitif seçelim. Hız değişimi $\\Delta\\vartheta = 8 - 20 = -12$ m/s.' },
      { metin: '$a = \\dfrac{\\Delta\\vartheta}{\\Delta t} = \\dfrac{-12}{4} = -3$ m/s².' },
      {
        metin:
          'İvmenin büyüklüğü 3 m/s²; eksi işaret, ivmenin hareket yönüne zıt olduğunu gösterir. Otobüs bu yüzden yavaşlar. Cevap B.',
      },
    ],
    zorluk: 3,
    baglam_temelli: true,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.10.1.2'),
  },
  {
    id: kimlik(7),
    tur: 'coktan_secmeli',
    govde:
      'Yerden 80 m yükseklikteki bir binanın çatısından bir taş serbest bırakılıyor. ' +
      'Taşın yere çarpmadan önceki son 1 saniyede aldığı yol kaç metredir? ' +
      '(g = 10 m/s² alınız; hava direnci önemsenmiyor.)',
    sekil_svg: sekilBina,
    secenekler: [
      { harf: 'A', metin: '5' },
      { harf: 'B', metin: '20' },
      { harf: 'C', metin: '35' },
      { harf: 'D', metin: '40' },
      { harf: 'E', metin: '45' },
    ],
    dogru_cevap: 'C',
    cozum_adimlari: [
      { metin: 'Düşme süresi: $h = \\dfrac{1}{2} g t^2$ ile $80 = 5t^2$, buradan $t = 4$ s.' },
      { metin: 'İlk 3 saniyede alınan yol: $\\dfrac{1}{2} \\times 10 \\times 3^2 = 45$ m.' },
      { metin: 'Son 1 saniyede alınan yol: $80 - 45 = 35$ m. Cevap C.' },
    ],
    zorluk: 3,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.11.1.1', 'FİZ.11.1.2'),
  },
  {
    id: kimlik(8),
    tur: 'acik_uclu',
    govde:
      'Yerden 45 m yükseklikteki bir uçurumun kenarından bir top, 20 m/s hızla yatay olarak atılıyor. ' +
      '(g = 10 m/s² alınız; hava direnci önemsenmiyor.)<br>' +
      'a) Topun havada kalma süresini bulunuz.<br>' +
      'b) Topun, uçurumun dibinden ne kadar uzağa düştüğünü bulunuz.<br>' +
      'c) Topun yere çarptığı andaki hızının yatay ve düşey bileşenlerini bulunuz.',
    sekil_svg: sekilAtis,
    secenekler: null,
    dogru_cevap: 'a) 3 s. b) 60 m. c) Yatay bileşen 20 m/s, düşey bileşen 30 m/s (aşağı yönde).',
    cozum_adimlari: [
      {
        metin:
          'Düşey doğrultudaki hareket serbest düşmedir: $45 = \\dfrac{1}{2} \\times 10 \\times t^2$, buradan $t = 3$ s.',
      },
      { metin: 'Yatay doğrultuda hız sabittir: $x = 20 \\times 3 = 60$ m.' },
      {
        metin:
          'Yatay bileşen değişmez: $\\vartheta_x = 20$ m/s. Düşey bileşen: $\\vartheta_y = g t = 10 \\times 3 = 30$ m/s, aşağı yönde.',
      },
    ],
    zorluk: 4,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.11.1.3'),
  },
  {
    id: kimlik(9),
    tur: 'coktan_secmeli',
    govde:
      'Sürtünmesiz yatay düzlemde kütleleri sırasıyla 2 kg ve 3 kg olan K ve L blokları, kütlesi önemsenmeyen gergin bir iple birbirine bağlıdır. ' +
      'L bloğuna yatay ve 20 N büyüklüğünde $\\vec{F}$ kuvveti şekildeki gibi uygulanıyor. ' +
      'İpteki gerilme kuvvetinin büyüklüğü kaç N olur?',
    sekil_svg: sekilBloklar,
    secenekler: [
      { harf: 'A', metin: '4' },
      { harf: 'B', metin: '8' },
      { harf: 'C', metin: '10' },
      { harf: 'D', metin: '12' },
      { harf: 'E', metin: '20' },
    ],
    dogru_cevap: 'B',
    cozum_adimlari: [
      {
        metin:
          'Bloklar birlikte hareket eder. Sistemin ivmesi: $a = \\dfrac{F}{m_K + m_L} = \\dfrac{20}{2 + 3} = 4$ m/s².',
      },
      { metin: 'K bloğunun serbest cisim diyagramında yatay doğrultuda yalnızca ip gerilmesi $T$ vardır.' },
      { metin: '$T = m_K a = 2 \\times 4 = 8$ N. Cevap B.' },
    ],
    zorluk: 3,
    baglam_temelli: false,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.11.1.4', 'FİZ.11.1.5'),
  },
  {
    id: kimlik(10),
    tur: 'dogru_yanlis',
    govde: 'Düz bir yolda sabit hızla giden bir otomobile etki eden kuvvetlerin bileşkesi sıfırdır.',
    sekil_svg: null,
    secenekler: null,
    dogru_cevap: 'D',
    cozum_adimlari: [
      { metin: 'Hız sabitse ivme sıfırdır.' },
      {
        metin:
          "Newton'ın ikinci yasasına göre $F_{\\text{net}} = m a$ olduğundan $a = 0$ ise net kuvvet de sıfırdır. Yolun tekerleklere uyguladığı ileri yönlü sürtünme kuvveti ile hava direnci ve yuvarlanma direnci gibi geri yönlü kuvvetler birbirini dengeler.",
      },
      { metin: 'Bu, otomobile hiç kuvvet etki etmediği anlamına gelmez. İfade doğrudur.' },
    ],
    zorluk: 2,
    baglam_temelli: true,
    kaynak_notu: 'Örnek soru.',
    ornek: true,
    kazanim_idleri: kz('FİZ.11.1.4'),
  },
]
