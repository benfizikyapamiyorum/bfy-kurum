import { useState } from 'react'
import { tarihYaz } from '../alan/lisans'
import { KurumLogosu } from '../bilesenler/KurumLogosu'
import { kurumAdiGuncelle, logoKaldir, logoYukle } from '../depo/kurumDeposu'
import { useOturum } from '../oturum/Oturum'
import { useKurumVerisi } from './kurumVerisi'

function Kontenjan({ ad, sayi, limit }: { ad: string; sayi: number; limit: number }) {
  const oran = limit > 0 ? Math.min(1, sayi / limit) : 1
  return (
    <div className="kontenjan">
      <div className="kontenjan-ust">
        <span>{ad}</span>
        <strong>
          {sayi} / {limit}
        </strong>
      </div>
      <div className="cubuk" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={sayi} aria-label={ad}>
        <span style={{ width: `${oran * 100}%` }} className={oran >= 1 ? 'dolu' : oran >= 0.9 ? 'az' : ''} />
      </div>
    </div>
  )
}

export function KurumGenel() {
  const { kurum, kullanicilar } = useKurumVerisi()
  const { lisans, yenile } = useOturum()
  const [ad, setAd] = useState(kurum.ad)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const aktif = (rol: string) => kullanicilar.filter((k) => k.rol === rol && k.aktif).length
  const calistir = async (is: () => Promise<unknown>, basari: string) => {
    setHata(null)
    setMesaj(null)
    try {
      await is()
      setMesaj(basari)
      yenile()
    } catch (e) {
      setHata(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="panel-izgara">
      <section className="kart">
        <h2>Lisans</h2>
        <p className={`lisans-durumu ${lisans?.gecerli ? 'gecerli' : 'gecersiz'}`}>{lisans?.mesaj}</p>
        <dl className="bilgi-listesi">
          <dt>Başlangıç</dt>
          <dd>{tarihYaz(kurum.lisans_baslangic)}</dd>
          <dt>Bitiş</dt>
          <dd>{tarihYaz(kurum.lisans_bitis)}</dd>
        </dl>
        <Kontenjan ad="Öğretmen" sayi={aktif('ogretmen')} limit={kurum.ogretmen_limiti} />
        <Kontenjan ad="Öğrenci" sayi={aktif('ogrenci')} limit={kurum.ogrenci_limiti} />
        <p className="soluk kucuk">Lisans süresi ve kontenjan için hizmet sağlayıcınızla görüşün.</p>
      </section>

      <section className="kart">
        <h2>Öğrenci girişi</h2>
        <p>Öğrenciler giriş ekranında bu kurum kodunu, kendi kullanıcı adlarını ve şifrelerini yazar.</p>
        <p className="kurum-kodu">{kurum.kod ?? 'Kod tanımlanmamış'}</p>
        <p className="soluk kucuk">Her sınıfın ayrıca kendi kodu vardır; öğrenci ikisinden birini kullanabilir.</p>
      </section>

      <section className="kart">
        <h2>Kurum adı ve logosu</h2>
        <form
          className="satir-form"
          onSubmit={(e) => {
            e.preventDefault()
            void calistir(() => kurumAdiGuncelle(kurum.id, ad), 'Kurum adı kaydedildi.')
          }}
        >
          <label className="alan genis">
            Kurum adı
            <input value={ad} onChange={(e) => setAd(e.target.value)} minLength={2} maxLength={160} required />
          </label>
          <button type="submit" className="dugme" disabled={ad.trim() === kurum.ad}>
            Kaydet
          </button>
        </form>
        <div className="logo-onizleme">
          <KurumLogosu />
        </div>
        <p className="soluk kucuk">Logo tahta ekranının köşesinde ve PDF çıktılarında görünür. PNG, JPEG ya da WebP, en çok 1 MB.</p>
        <div className="secim-grubu">
          <label className="dugme">
            Logo yükle
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="gizli-erisilebilir"
              onChange={(e) => {
                const d = e.target.files?.[0]
                if (d) void calistir(() => logoYukle(kurum.id, d), 'Logo yüklendi.')
                e.target.value = ''
              }}
            />
          </label>
          {kurum.logo_yolu && (
            <button type="button" className="dugme sade" onClick={() => void calistir(() => logoKaldir(kurum.id), 'Logo kaldırıldı.')}>
              Logoyu kaldır
            </button>
          )}
        </div>
        {mesaj && <p className="basari-metni">{mesaj}</p>}
        {hata && <p className="hata-metni">{hata}</p>}
      </section>
    </div>
  )
}
