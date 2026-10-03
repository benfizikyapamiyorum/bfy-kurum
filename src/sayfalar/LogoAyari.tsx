import { useState } from 'react'
import { denemeLogosuOku, denemeLogosuYaz } from '../bilesenler/denemeLogosu'
import { KurumLogosu } from '../bilesenler/KurumLogosu'

const AZAMI = 300 * 1024

/** M2'ye kadar: kurum logosunun tahtada nasıl görüneceğini bu tarayıcıda denemek için. */
export function LogoAyari() {
  const [hata, setHata] = useState<string | null>(null)
  const [var_, setVar] = useState(() => denemeLogosuOku() !== null)

  const sec = (dosya: File | undefined) => {
    setHata(null)
    if (!dosya) return
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(dosya.type)) {
      setHata('Yalnızca PNG, JPEG, WebP ya da SVG dosyası seçin.')
      return
    }
    if (dosya.size > AZAMI) {
      setHata('Logo 300 KB’tan küçük olmalı.')
      return
    }
    const okuyucu = new FileReader()
    okuyucu.onload = () => {
      denemeLogosuYaz(String(okuyucu.result))
      setVar(true)
    }
    okuyucu.readAsDataURL(dosya)
  }

  return (
    <section className="kart ayar-bolumu">
      <h2>Kurum logosu</h2>
      <p className="soluk">
        Logo tahta ekranının sağ üst köşesinde görünür. Şimdilik yalnızca bu tarayıcıda denenir; giriş sistemi gelince kurum
        yöneticisi logoyu kurum panelinden yükleyecek.
      </p>
      <div className="logo-onizleme">
        <KurumLogosu />
      </div>
      <div className="secim-grubu">
        <label className="dugme">
          Logo seç
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="gizli-erisilebilir"
            onChange={(e) => sec(e.target.files?.[0])}
          />
        </label>
        {var_ && (
          <button
            type="button"
            className="dugme sade"
            onClick={() => {
              denemeLogosuYaz(null)
              setVar(false)
            }}
          >
            Logoyu kaldır
          </button>
        )}
      </div>
      {hata && <p className="hata-metni">{hata}</p>}
    </section>
  )
}
