// M5: toplu içe aktarım ve süper admin özetleri.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

const URL = process.env.DATABASE_URL
const d = describe.skipIf(!URL)
const SUPER = '00000000-0000-4000-d000-000000000001'
const OGT = '00000000-0000-4000-d000-000000000002'
const KURUM = '00000000-0000-4000-d000-000000000010'
const paket = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../icerik-paketleri/kaldirma-kuvveti.json'), 'utf8'))

let havuz: pg.Pool

async function olarak<T>(k: string, is: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await havuz.connect()
  try {
    await c.query('begin')
    await c.query('set local role authenticated')
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: k })])
    return await is(c)
  } finally {
    await c.query('rollback')
    c.release()
  }
}

d('toplu içe aktarım', () => {
  beforeAll(async () => {
    havuz = new pg.Pool({ connectionString: URL, max: 3 })
    await havuz.query(`delete from public.soru where dis_kimlik like 'fizik-atolye/%'`)
    await havuz.query(`delete from public.icerik where dis_kimlik like 'fizik-atolye/%'`)
    await havuz.query(`delete from public.kurum where id = $1`, [KURUM])
    await havuz.query(`delete from public.kullanici where id = $1`, [SUPER])
    await havuz.query(`delete from auth.users where id = any($1)`, [[SUPER, OGT]])
    await havuz.query(`insert into public.kurum (id, ad, lisans_bitis) values ($1, 'İçe Aktarım Kursu', current_date + 10)`, [KURUM])
    await havuz.query(`insert into auth.users (id) values ($1), ($2)`, [SUPER, OGT])
    await havuz.query(`insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, null, 'superadmin', 'Süper'), ($2, $3, 'ogretmen', 'Öğretmen')`, [SUPER, OGT, KURUM])
  })
  afterAll(async () => {
    await havuz?.end()
  })

  it('süper admin paketi aktarır; tekrar yüklemede kopya oluşmaz, güncellenir', () =>
    olarak(SUPER, async (c) => {
      const ilk = (await c.query('select public.toplu_ice_aktar($1) as r', [paket])).rows[0].r
      expect(ilk).toEqual({ uniteler: 1, kazanimlar: 2, sorular_yeni: 12, sorular_guncellenen: 0, icerikler: 1 })
      const ikinci = (await c.query('select public.toplu_ice_aktar($1) as r', [paket])).rows[0].r
      expect(ikinci).toMatchObject({ sorular_yeni: 0, sorular_guncellenen: 12 })
      const n = await c.query(`select count(*)::int as n from public.soru where dis_kimlik like 'fizik-atolye/kaldirma-kuvveti/%'`)
      expect(n.rows[0].n).toBe(12)
      const s6 = await c.query(
        `select s.dogru_cevap, s.yayinda, s.beceri, jsonb_array_length(s.cozum_adimlari) as adim,
                (select array_agg(k.kod) from public.soru_kazanim sk join public.kazanim k on k.id = sk.kazanim_id where sk.soru_id = s.id) as kodlar
         from public.soru s where dis_kimlik = 'fizik-atolye/kaldirma-kuvveti/S6'`,
      )
      expect(s6.rows[0]).toEqual({ dogru_cevap: 'D', yayinda: true, beceri: 'Ölçümü yorumlama', adim: 3, kodlar: ['FİZ.9.3.6'] })
      const u = await c.query(`select un.ad from public.unite un join public.seviye sv on sv.id = un.seviye_id where sv.kod = '9' and un.no = 3`)
      expect(u.rows[0].ad).toBe('Akışkanlar')
    }))

  it('açık hakem bulgusu olan sorular öğretmene görünmez', async () => {
    await olarak(SUPER, (c) => c.query('select public.toplu_ice_aktar($1)', [paket]).then(() => c.query('commit')))
    await olarak(OGT, async (c) => {
      const n = await c.query(`select dis_kimlik from public.soru where dis_kimlik like 'fizik-atolye/%' order by 1`)
      expect(n.rows).toHaveLength(9)
      expect(n.rows.map((r) => r.dis_kimlik)).not.toContain('fizik-atolye/kaldirma-kuvveti/S5')
    })
  })

  it('süper admin dışındaki kullanıcı aktaramaz', () =>
    olarak(OGT, async (c) => {
      await expect(c.query('select public.toplu_ice_aktar($1)', [paket])).rejects.toThrow(/yalnızca süper admin/)
    }))

  it('hatalı satırda hiçbir şey yazılmaz', () =>
    olarak(SUPER, async (c) => {
      const bozuk = {
        surum: 1,
        sorular: [
          { ...paket.sorular[0], dis_kimlik: 'deneme/bir' },
          { ...paket.sorular[1], dis_kimlik: 'deneme/iki', kazanimlar: ['FİZ.99.9.9'] },
        ],
      }
      await c.query('savepoint s')
      await expect(c.query('select public.toplu_ice_aktar($1)', [bozuk])).rejects.toThrow(/kazanım bulunamadı/)
      await c.query('rollback to savepoint s')
      const n = await c.query(`select count(*)::int as n from public.soru where dis_kimlik like 'deneme/%'`)
      expect(n.rows[0].n).toBe(0)
    }))

  it('kurum özetleri yalnızca süper admine döner', async () => {
    const s = await olarak(SUPER, (c) => c.query('select * from public.kurum_ozetleri() where id = $1', [KURUM]))
    expect(s.rows[0]).toMatchObject({ ad: 'İçe Aktarım Kursu', ogretmen_sayisi: 1, ogrenci_sayisi: 0 })
    const o = await olarak(OGT, (c) => c.query('select * from public.kurum_ozetleri()'))
    expect(o.rows).toEqual([])
  })
})
