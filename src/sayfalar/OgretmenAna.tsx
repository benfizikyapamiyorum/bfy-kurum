import { Link } from 'react-router-dom'
import { Simge } from '../bilesenler/Simge'
import { useOturum } from '../oturum/Oturum'

export function OgretmenAna() {
  const { profil, kurum, lisans } = useOturum()
  return (
    <div className="sayfa">
      <h1>Merhaba, {profil?.ad_soyad}.</h1>
      <p className="soluk">{kurum?.ad}</p>
      {lisans && !lisans.gecerli && <p className="bilgi-kutusu uyari">{lisans.mesaj} İçeriğe erişim kapalı.</p>}
      <div className="izgara ana-kutular">
        <Link to="/tahta" className="kart kutu-baglanti">
          <Simge ad="tahta" boyut={36} />
          <h2>Tahta modu</h2>
          <p className="soluk">Haftalar ve sorularla ders anlatın.</p>
        </Link>
        <Link to="/testler" className="kart kutu-baglanti">
          <Simge ad="belge" boyut={36} />
          <h2>Test ve deneme</h2>
          <p className="soluk">Test hazırlayın, sınıfa atayın, sonuç girin.</p>
        </Link>
        <Link to="/raporlar" className="kart kutu-baglanti">
          <Simge ad="sekil" boyut={36} />
          <h2>Raporlar</h2>
          <p className="soluk">Sınıfın zayıf kazanımları ve öğrenci gelişimi.</p>
        </Link>
      </div>
    </div>
  )
}
