import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { yerelDb, yerelDbSifirla } from './yerelVeritabani'
import { bekleyenIslemSayisi, kuyrugaEkle, kuyrukIsleyicisiKaydet, senkronizeEt } from './senkronKuyrugu'

beforeEach(async () => {
  const db = await yerelDb()
  await db.clear('kuyruk')
})

describe('senkron kuyruğu', () => {
  it('çevrimdışıyken biriktirir, bağlantı gelince sırayla gönderir', async () => {
    let cevrimici = false
    const sunucu: string[] = []
    kuyrukIsleyicisiKaydet('deneme', async (veri) => {
      if (!cevrimici) throw new Error('Ağ yok.')
      sunucu.push(veri as string)
    })

    await kuyrugaEkle('deneme', 'bir', 'a1')
    await new Promise((r) => setTimeout(r, 5))
    await kuyrugaEkle('deneme', 'iki', 'a2')
    await senkronizeEt()
    expect(sunucu).toEqual([])
    expect(await bekleyenIslemSayisi()).toBe(2)
    const ilk = await (await yerelDb()).get('kuyruk', 'a1')
    expect(ilk?.deneme).toBeGreaterThan(0)
    expect(ilk?.sonHata).toBe('Ağ yok.')

    cevrimici = true
    const sonuc = await senkronizeEt()
    expect(sunucu).toEqual(['bir', 'iki'])
    expect(sonuc).toEqual({ gonderilen: 2, kalan: 0 })
  })

  it('aynı kimlikle eklenen işlem kuyrukta tek kalır', async () => {
    kuyrukIsleyicisiKaydet('tekil', async () => {
      throw new Error('Ağ yok.')
    })
    await kuyrugaEkle('tekil', 1, 'ayni')
    await kuyrugaEkle('tekil', 2, 'ayni')
    expect(await bekleyenIslemSayisi()).toBe(1)
  })

  it('bağlantı kesilirse yeni veritabanı bağlantısı açılabilir', async () => {
    yerelDbSifirla()
    expect(await bekleyenIslemSayisi()).toBeGreaterThanOrEqual(0)
  })
})
