// Çevrimdışı yazma kuyruğu. Yazma işlemi önce IndexedDB'ye eklenir, internet varsa hemen,
// yoksa bağlantı gelince sırayla gönderilir. İşlem kimliği sunucuda upsert anahtarıdır;
// aynı işlem iki kez gönderilse de tek kayıt oluşur.
// Kullanım (M3'te online çözüm cevapları için):
//   kuyrukIsleyicisiKaydet('cevap', async (veri) => { await db.from('cevap').upsert(veri) })
//   await kuyrugaEkle('cevap', { ... })

import { yerelDb, type KuyrukIslemi } from './yerelVeritabani'

export type KuyrukIsleyicisi = (veri: unknown, islem: KuyrukIslemi) => Promise<void>

const isleyiciler = new Map<string, KuyrukIsleyicisi>()
let calisiyor: Promise<SenkronSonucu> | null = null

export interface SenkronSonucu {
  gonderilen: number
  kalan: number
}

export function kuyrukIsleyicisiKaydet(tur: string, isleyici: KuyrukIsleyicisi): void {
  isleyiciler.set(tur, isleyici)
}

export async function kuyrugaEkle(tur: string, veri: unknown, id: string = crypto.randomUUID()): Promise<string> {
  const db = await yerelDb()
  await db.put('kuyruk', { id, tur, veri, olusturma: new Date().toISOString(), deneme: 0 })
  if (typeof navigator === 'undefined' || navigator.onLine) void senkronizeEt()
  return id
}

export async function bekleyenIslemSayisi(): Promise<number> {
  return (await yerelDb()).count('kuyruk')
}

/** Kuyruktaki işlemleri eklenme sırasıyla gönderir. Bir işlem başarısız olursa sonrakiler beklemede kalır. */
export function senkronizeEt(): Promise<SenkronSonucu> {
  calisiyor ??= (async () => {
    const db = await yerelDb()
    let gonderilen = 0
    try {
      const islemler = await db.getAllFromIndex('kuyruk', 'olusturma')
      for (const islem of islemler) {
        const isleyici = isleyiciler.get(islem.tur)
        if (!isleyici) continue
        try {
          await isleyici(islem.veri, islem)
          await db.delete('kuyruk', islem.id)
          gonderilen++
        } catch (e) {
          await db.put('kuyruk', {
            ...islem,
            deneme: islem.deneme + 1,
            sonHata: e instanceof Error ? e.message : String(e),
          })
          break
        }
      }
      return { gonderilen, kalan: await db.count('kuyruk') }
    } finally {
      calisiyor = null
    }
  })()
  return calisiyor
}

/** İnternet gelince kuyruğu otomatik gönderir. */
export function senkronuBaslat(): () => void {
  const dinle = () => void senkronizeEt()
  window.addEventListener('online', dinle)
  if (navigator.onLine) dinle()
  return () => window.removeEventListener('online', dinle)
}
