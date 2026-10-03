// KVKK metinleri için yer tutucu sayfalar. Hukuki metin hazırlandığında buraya konacak.

function YerTutucu({ baslik }: { baslik: string }) {
  return (
    <div className="sayfa">
      <h1>{baslik}</h1>
      <p className="yer-tutucu">[METİN GELECEK]</p>
      <p className="soluk">
        Sistem öğrenciden yalnızca ad soyad ve kullanıcı adı tutar. TC kimlik numarası, telefon ve adres
        istenmez. Veriler Avrupa Birliği bölgesindeki sunucularda saklanır.
      </p>
    </div>
  )
}

export const AydinlatmaMetni = () => <YerTutucu baslik="Kişisel verilerin korunması aydınlatma metni" />
export const GizlilikPolitikasi = () => <YerTutucu baslik="Gizlilik politikası" />
