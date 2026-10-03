import { useTema, type TemaSecimi } from '../tema'
import { LogoAyari } from './LogoAyari'

const temalar: [TemaSecimi, string][] = [
  ['sistem', 'Cihaza göre'],
  ['acik', 'Açık'],
  ['koyu', 'Koyu'],
]

export function Ayarlar() {
  const { secim, temaSec, yuksekKontrast, kontrastAyarla } = useTema()
  return (
    <div className="sayfa dar">
      <h1>Ayarlar</h1>
      <section className="kart ayar-bolumu">
        <h2>Görünüm</h2>
        <div className="secim-grubu" role="radiogroup" aria-label="Tema">
          {temalar.map(([deger, ad]) => (
            <button
              key={deger}
              type="button"
              role="radio"
              aria-checked={secim === deger}
              className={`dugme ${secim === deger ? 'secili' : ''}`}
              onClick={() => temaSec(deger)}
            >
              {ad}
            </button>
          ))}
        </div>
        <label className="anahtar-satiri">
          <input type="checkbox" checked={yuksekKontrast} onChange={(e) => kontrastAyarla(e.target.checked)} />
          <span>
            <strong>Yüksek kontrast.</strong> Siyah zemin, beyaz yazı. Işık alan sınıflarda tahtada okunurluğu artırır.
          </span>
        </label>
      </section>
      <LogoAyari />
    </div>
  )
}
