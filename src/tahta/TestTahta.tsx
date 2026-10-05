// Kayıtlı bir testi tahtada soru soru anlatmak için: /tahta/test/:test/:no
import { useParams } from 'react-router-dom'
import { testGetir } from '../depo/testDeposu'
import { useVeri } from '../kancalar'
import { useKatalog } from '../katalogBaglami'
import { HataGoster, Yukleniyor } from './Durumlar'
import { SoruGorunumu } from './SoruEkrani'
import { TahtaCercevesi } from './TahtaCercevesi'

export function TestTahta() {
  const { test = '', no = '1' } = useParams()
  const { yardimci } = useKatalog()
  const v = useVeri(() => testGetir(test), [test])
  const i = Math.max(1, Number.parseInt(no, 10) || 1)
  const soru = v.veri?.sorular[i - 1]
  if (v.hata || !v.veri || !yardimci || !soru) {
    return (
      <TahtaCercevesi baslik={v.veri?.test.baslik ?? 'Test'} geri={`/testler/${test}`}>
        {v.hata ? <HataGoster hata={v.hata} /> : v.veri && !soru ? <HataGoster hata={new Error('Soru bulunamadı.')} /> : <Yukleniyor />}
      </TahtaCercevesi>
    )
  }
  const n = v.veri.sorular.length
  return (
    <SoruGorunumu
      key={soru.id}
      soru={soru}
      no={i}
      toplam={n}
      oncekiAdres={i > 1 ? `/tahta/test/${test}/${i - 1}` : undefined}
      sonrakiAdres={i < n ? `/tahta/test/${test}/${i + 1}` : undefined}
      geri={`/testler/${test}`}
      yardimci={yardimci}
    />
  )
}
