import { useState } from 'react'
import { hesapDurumu, hesapSil, sifreSifirla, type KurumKullanicisi } from '../depo/kurumDeposu'
import { useKurumVerisi } from './kurumVerisi'

/** Bir kullanıcı satırındaki işlemler: şifre sıfırla, pasifleştir/aktifleştir, sil. */
export function KullaniciIslemleri({ k, onSifre }: { k: KurumKullanicisi; onSifre: (sifre: string) => void }) {
  const { yenile } = useKurumVerisi()
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)

  const calistir = async (is: () => Promise<unknown>) => {
    setHata(null)
    setBekliyor(true)
    try {
      await is()
      yenile()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    } finally {
      setBekliyor(false)
    }
  }

  return (
    <div className="satir-islemleri">
      <button
        type="button"
        className="dugme kucuk"
        disabled={bekliyor}
        onClick={() =>
          void calistir(async () => {
            const { sifre } = await sifreSifirla(k.id)
            onSifre(sifre)
          })
        }
      >
        Şifre sıfırla
      </button>
      <button type="button" className="dugme kucuk" disabled={bekliyor} onClick={() => void calistir(() => hesapDurumu(k.id, !k.aktif))}>
        {k.aktif ? 'Pasifleştir' : 'Aktifleştir'}
      </button>
      <button
        type="button"
        className="dugme kucuk tehlike"
        disabled={bekliyor}
        onClick={() => {
          if (window.confirm(`${k.ad_soyad} adlı hesabı ve tüm sonuçlarını silmek istiyor musunuz? Bu işlem geri alınamaz.`))
            void calistir(() => hesapSil(k.id))
        }}
      >
        Sil
      </button>
      {hata && <span className="hata-metni">{hata}</span>}
    </div>
  )
}
