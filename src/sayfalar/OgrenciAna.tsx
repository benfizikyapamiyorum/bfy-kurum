import { useOturum } from '../oturum/Oturum'

export function OgrenciAna() {
  const { profil, kurum } = useOturum()
  return (
    <div className="sayfa">
      <h1>Merhaba, {profil?.ad_soyad}.</h1>
      <p className="soluk">{kurum?.ad}</p>
      <section className="kart">
        <h2>Testlerim</h2>
        <p className="soluk">Sana atanan testler burada görünecek.</p>
      </section>
    </div>
  )
}
