// Küçük, bağımlılıksız SVG grafikler. Tek seri: lejant yok, başlık neyin çizildiğini söyler.
// Her grafiğin yanında aynı veriyi veren tablo vardır (erişilebilirlik).

import { useId, useState } from 'react'
import { trSayi } from '../alan/turkce'

export interface Nokta {
  etiket: string
  ayrinti?: string
  deger: number
}

/** Zaman içinde tek seri (ör. net gelişimi). Üzerine gelince ya da dokununca değer görünür. */
export function CizgiGrafik({ noktalar, birim = 'net', yukseklik = 220 }: { noktalar: Nokta[]; birim?: string; yukseklik?: number }) {
  const [secili, setSecili] = useState<number | null>(null)
  const kimlik = useId()
  const G = 640
  const ic = { sol: 44, sag: 16, ust: 16, alt: 30 }
  const w = G - ic.sol - ic.sag
  const h = yukseklik - ic.ust - ic.alt
  if (noktalar.length === 0) return <p className="soluk">Henüz sonuç yok.</p>

  const degerler = noktalar.map((n) => n.deger)
  const enAz = Math.min(0, ...degerler)
  const enCok = Math.max(1, ...degerler)
  const adim = guzelAdim((enCok - enAz) / 4)
  const ust = Math.ceil(enCok / adim) * adim
  const alt = Math.floor(enAz / adim) * adim
  const y = (v: number) => ic.ust + h - ((v - alt) / (ust - alt)) * h
  const x = (i: number) => ic.sol + (noktalar.length === 1 ? w / 2 : (i / (noktalar.length - 1)) * w)
  const cizgiler: number[] = []
  for (let v = alt; v <= ust + 1e-9; v += adim) cizgiler.push(Math.round(v * 100) / 100)
  const yol = noktalar.map((n, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(n.deger).toFixed(1)}`).join(' ')
  const s = secili === null ? null : noktalar[secili]

  return (
    <div className="grafik">
      <svg viewBox={`0 0 ${G} ${yukseklik}`} role="img" aria-labelledby={`${kimlik}-t`} onMouseLeave={() => setSecili(null)}>
        <title id={`${kimlik}-t`}>
          {birim} değerleri: {noktalar.map((n) => `${n.etiket} ${trSayi(n.deger)}`).join(', ')}.
        </title>
        {cizgiler.map((v) => (
          <g key={v}>
            <line x1={ic.sol} x2={G - ic.sag} y1={y(v)} y2={y(v)} className={v === 0 ? 'grafik-sifir' : 'grafik-izgara'} />
            <text x={ic.sol - 8} y={y(v) + 4} textAnchor="end" className="grafik-eksen">
              {trSayi(v)}
            </text>
          </g>
        ))}
        <path d={`${yol} L${x(noktalar.length - 1)},${y(Math.max(0, alt))} L${x(0)},${y(Math.max(0, alt))} Z`} className="grafik-alan" />
        <path d={yol} className="grafik-cizgi" />
        {noktalar.map((n, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(n.deger)} r={secili === i ? 6 : 4.5} className="grafik-nokta" />
            {/* Dokunma hedefi işaretten büyük. */}
            <rect
              x={x(i) - Math.max(14, w / noktalar.length / 2)}
              y={ic.ust}
              width={Math.max(28, w / noktalar.length)}
              height={h}
              fill="transparent"
              onMouseEnter={() => setSecili(i)}
              onClick={() => setSecili(i)}
            />
          </g>
        ))}
        {/* Zaman ekseni: en çok 8 etiket. */}
        {noktalar.map((n, i) =>
          noktalar.length <= 8 || i % Math.ceil(noktalar.length / 8) === 0 ? (
            <text key={`x${i}`} x={x(i)} y={yukseklik - 8} textAnchor="middle" className="grafik-eksen">
              {n.ayrinti ?? i + 1}
            </text>
          ) : null,
        )}
        {/* Yalnızca son değer etiketli. */}
        <text x={x(noktalar.length - 1)} y={y(degerler[degerler.length - 1]!) - 12} textAnchor="middle" className="grafik-deger">
          {trSayi(degerler[degerler.length - 1]!)}
        </text>
        {s && secili !== null && (
          <line x1={x(secili)} x2={x(secili)} y1={ic.ust} y2={ic.ust + h} className="grafik-imlec" />
        )}
      </svg>
      <div className="grafik-ipucu" aria-live="polite">
        {s ? (
          <>
            <strong>{s.etiket}</strong>
            {s.ayrinti && <span> {s.ayrinti}</span>}: {trSayi(s.deger)} {birim}.
          </>
        ) : (
          <span className="soluk">Bir noktaya dokunun.</span>
        )}
      </div>
    </div>
  )
}

function guzelAdim(ham: number): number {
  if (ham <= 0) return 1
  const us = 10 ** Math.floor(Math.log10(ham))
  const k = ham / us
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 5 ? 5 : 10) * us
}

export interface Cubuk {
  anahtar: string
  etiket: string
  aciklama?: string
  deger: number
  zayif?: boolean
  ayrinti?: string
}

/** Yatay yüzde çubukları; %50 başvuru çizgisi; zayıflar simge ve "Zayıf" yazısıyla işaretli. */
export function YuzdeCubuklari({ cubuklar }: { cubuklar: Cubuk[] }) {
  return (
    <ul className="yuzde-cubuklari">
      {cubuklar.map((c) => (
        <li key={c.anahtar} className={c.zayif ? 'zayif' : ''} title={c.aciklama}>
          <div className="yc-etiket">
            <strong>{c.etiket}</strong>
            {c.zayif && (
              <span className="zayif-rozet">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M8 1.5 15 14H1z" fill="currentColor" />
                  <path d="M8 6v4M8 11.6v.4" stroke="var(--yuzey)" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Zayıf
              </span>
            )}
            {c.aciklama && <span className="yc-aciklama">{c.aciklama}</span>}
          </div>
          <div className="yc-cubuk" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={c.deger} aria-label={c.etiket}>
            <span style={{ width: `${Math.max(0, Math.min(100, c.deger))}%` }} />
            <i className="yc-esik" aria-hidden="true" />
          </div>
          <div className="yc-deger">
            %{trSayi(c.deger, 0)}
            {c.ayrinti && <span className="soluk kucuk"> {c.ayrinti}</span>}
          </div>
        </li>
      ))}
    </ul>
  )
}
