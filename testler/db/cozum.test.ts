// M3: online çözüm, puanlama, elle sonuç girişi ve test kaydetme kuralları.

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

const URL = process.env.DATABASE_URL
const d = describe.skipIf(!URL)
const id = (n: number) => `00000000-0000-4000-c000-${String(n).padStart(12, '0')}`

const K1 = id(1)
const K2 = id(2)
const OGT = id(10)
const OGT2 = id(11)
const OGR = id(20)
const OGR_DIS = id(21) // aynı kurum, başka sınıf
const GRP = id(30)
const GRP2 = id(31)
const TEST = id(40)
const ATAMA = id(50)
const ATAMA_GELECEK = id(51)
const S_CS1 = id(60)
const S_CS2 = id(61)
const S_DY = id(62)
const S_ACIK = id(63)

let havuz: pg.Pool

async function olarak<T>(kullanici: string, is: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await havuz.connect()
  try {
    await c.query('begin')
    await c.query('set local role authenticated')
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: kullanici })])
    return await is(c)
  } finally {
    await c.query('rollback')
    c.release()
  }
}

/** Hata beklenen sorguyu bir savepoint içinde çalıştırır; işlem devam edebilir. */
async function reddedilir(c: pg.PoolClient, sql: string, p: unknown[], desen: RegExp) {
  await c.query('savepoint h')
  await expect(c.query(sql, p)).rejects.toThrow(desen)
  await c.query('rollback to savepoint h')
}

const secenekler = (dogru: string) =>
  JSON.stringify(
    ['A', 'B', 'C', 'D', 'E'].map((h) => ({ harf: h, metin: `${h} şıkkı`, ...(h !== dogru ? { gerekce: `${h} yanlış çünkü...` } : {}) })),
  )

d('online çözüm ve puanlama', () => {
  beforeAll(async () => {
    havuz = new pg.Pool({ connectionString: URL, max: 4 })
    const c = await havuz.connect()
    try {
      await c.query('begin')
      await c.query(`delete from public.kurum where id = any($1)`, [[K1, K2]])
      await c.query(`delete from public.soru where id = any($1)`, [[S_CS1, S_CS2, S_DY, S_ACIK]])
      await c.query(`delete from auth.users where id::text like '00000000-0000-4000-c000-%'`)
      await c.query(
        `insert into public.kurum (id, ad, lisans_baslangic, lisans_bitis) values
          ($1, 'Çözüm Kursu', current_date - 10, current_date + 100), ($2, 'Diğer Kurs', current_date - 10, current_date + 100)`,
        [K1, K2],
      )
      for (const [u, k, rol] of [
        [OGT, K1, 'ogretmen'],
        [OGT2, K2, 'ogretmen'],
        [OGR, K1, 'ogrenci'],
        [OGR_DIS, K1, 'ogrenci'],
      ] as const) {
        await c.query(`insert into auth.users (id) values ($1)`, [u])
        await c.query(`insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, $3, 'Kişi')`, [u, k, rol])
      }
      await c.query(`insert into public.sinif_grubu (id, kurum_id, ad) values ($1, $3, 'A'), ($2, $3, 'B')`, [GRP, GRP2, K1])
      await c.query(`insert into public.sinif_grubu_ogrenci values ($1, $2), ($3, $4)`, [GRP, OGR, GRP2, OGR_DIS])
      await c.query(
        `insert into public.soru (id, tur, govde, secenekler, dogru_cevap, cozum_adimlari, zorluk) values
          ($1, 'coktan_secmeli', 'Soru 1', $5::jsonb, 'B', '[{"metin":"Çözüm 1."}]', 2),
          ($2, 'coktan_secmeli', 'Soru 2', $6::jsonb, 'D', '[{"metin":"Çözüm 2."}]', 3),
          ($3, 'dogru_yanlis', 'Soru 3', null, 'Y', '[]', 1),
          ($4, 'acik_uclu', 'Soru 4', null, 'Örnek cevap.', '[]', 4)`,
        [S_CS1, S_CS2, S_DY, S_ACIK, secenekler('B'), secenekler('D')],
      )
      const K4 = '40000000-0000-4000-8000-000000110104'
      const K5 = '40000000-0000-4000-8000-000000110105'
      await c.query(`insert into public.soru_kazanim values ($1, $5), ($2, $5), ($3, $6), ($4, $6)`, [S_CS1, S_CS2, S_DY, S_ACIK, K4, K5])
      await c.query(`insert into public.test (id, kurum_id, tur, baslik, yanlis_dogru_orani) values ($1, $2, 'mini_test', 'Deneme', 4)`, [TEST, K1])
      await c.query(`insert into public.test_soru values ($1, $2, 1), ($1, $3, 2), ($1, $4, 3), ($1, $5, 4)`, [TEST, S_CS1, S_CS2, S_DY, S_ACIK])
      await c.query(
        `insert into public.atama (id, kurum_id, test_id, sinif_grubu_id, baslangic) values
          ($1, $3, $4, $5, now() - interval '1 hour'), ($2, $3, $4, $5, now() + interval '2 days')`,
        [ATAMA, ATAMA_GELECEK, K1, TEST, GRP],
      )
      await c.query('commit')
    } catch (e) {
      await c.query('rollback')
      throw e
    } finally {
      c.release()
    }
  })

  afterAll(async () => {
    await havuz?.end()
  })

  it('öğrenci soruları cevap anahtarı, çözüm ve şık gerekçesi olmadan alır', () =>
    olarak(OGR, async (c) => {
      const r = await c.query(`select * from public.ogrenci_test_sorulari($1)`, [ATAMA])
      expect(r.rows.map((x) => x.sira)).toEqual([1, 2, 3, 4])
      expect(Object.keys(r.rows[0])).not.toContain('dogru_cevap')
      expect(Object.keys(r.rows[0])).not.toContain('cozum_adimlari')
      expect(JSON.stringify(r.rows[0].secenekler)).not.toContain('gerekce')
      expect(r.rows[0].secenekler).toHaveLength(5)
    }))

  it('başka sınıfın öğrencisi ve başlamamış atama reddedilir', async () => {
    await olarak(OGR_DIS, async (c) => {
      await expect(c.query(`select * from public.ogrenci_test_sorulari($1)`, [ATAMA])).rejects.toThrow(/atanmamış/)
    })
    await olarak(OGR, async (c) => {
      await expect(c.query(`select * from public.ogrenci_test_sorulari($1)`, [ATAMA_GELECEK])).rejects.toThrow(/başlamadı/)
    })
  })

  it('cevaplar sunucuda puanlanır, net hesaplanır, bitince cevap değiştirilemez', () =>
    olarak(OGR, async (c) => {
      const kaydet = (s: string, v: string) => c.query(`select public.ogrenci_cevap_kaydet($1, $2, $3)`, [ATAMA, s, v])
      await kaydet(S_CS1, 'a') // önce yanlış
      await kaydet(S_CS1, 'b') // sonra doğru: öncekinin yerine geçer
      await kaydet(S_CS2, 'C') // yanlış
      await kaydet(S_ACIK, 'Uzun bir cevap.') // net dışı
      // S_DY boş
      const ara = await c.query(`select soru_id, verilen, dogru_mu from public.cevap where ogrenci_id = $1 order by soru_id`, [OGR])
      expect(ara.rows).toEqual([
        { soru_id: S_CS1, verilen: 'B', dogru_mu: true },
        { soru_id: S_CS2, verilen: 'C', dogru_mu: false },
        { soru_id: S_ACIK, verilen: 'UZUN BIR CEVAP.', dogru_mu: null },
      ])
      const s = (await c.query(`select dogru, yanlis, bos, net::float from public.ogrenci_testi_bitir($1)`, [ATAMA])).rows[0]
      expect(s).toEqual({ dogru: 1, yanlis: 1, bos: 1, net: 0.75 })
      // Tekrar bitirmek sonucu değiştirmez; cevap değiştirmek reddedilir.
      expect((await c.query(`select net::float from public.ogrenci_testi_bitir($1)`, [ATAMA])).rows[0].net).toBe(0.75)
      await expect(kaydet(S_DY, 'Y')).rejects.toThrow(/bitirdiniz/)
    }))

  it('sonuç ayrıntısında doğru cevap yalnızca öğretmen çözümleri açınca görünür', async () => {
    const c = await havuz.connect()
    try {
      await c.query('begin')
      await c.query('set local role authenticated')
      await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: OGR })])
      await reddedilir(c, `select * from public.ogrenci_sonuc_ayrintisi($1)`, [ATAMA], /bitirmelisiniz/)
      await c.query(`select public.ogrenci_cevap_kaydet($1, $2, 'B')`, [ATAMA, S_CS1])
      await c.query(`select public.ogrenci_testi_bitir($1)`, [ATAMA])
      let r = await c.query(`select * from public.ogrenci_sonuc_ayrintisi($1)`, [ATAMA])
      expect(r.rows[0].dogru_cevap).toBeNull()
      expect(r.rows[0].dogru_mu).toBe(true)
      expect(JSON.stringify(r.rows[0].secenekler)).not.toContain('gerekce')
      await c.query(`reset role`)
      await c.query(`update public.atama set cozumler_acik = true where id = $1`, [ATAMA])
      await c.query('set local role authenticated')
      r = await c.query(`select * from public.ogrenci_sonuc_ayrintisi($1)`, [ATAMA])
      expect(r.rows[0].dogru_cevap).toBe('B')
      expect(JSON.stringify(r.rows[0].secenekler)).toContain('gerekce')
    } finally {
      await c.query('rollback')
      c.release()
    }
  })

  it('öğretmen kâğıt sonucu elle girer; net aynı kurallarla hesaplanır', () =>
    olarak(OGT, async (c) => {
      const s = (await c.query(`select dogru, yanlis, bos, net::float, kaynak from public.elle_sonuc_kaydet($1, $2, $3)`, [
        ATAMA,
        OGR,
        ['B', 'D', 'D', ''],
      ])).rows[0]
      // S_DY'ye "D" (doğru) yazıldı, cevap Y: yanlış. 2 doğru, 1 yanlış, 0 boş (açık uçlu hariç).
      expect(s).toEqual({ dogru: 2, yanlis: 1, bos: 0, net: 1.75, kaynak: 'elle' })
      await reddedilir(c, `select public.elle_sonuc_kaydet($1, $2, $3)`, [ATAMA, OGR, ['B']], /4 soru var, 1 cevap/)
      await reddedilir(c, `select public.elle_sonuc_kaydet($1, $2, $3)`, [ATAMA, OGR_DIS, ['B', 'D', 'Y', '']], /sınıfında değil/)
    }))

  it('öğrenci ya da başka kurumun öğretmeni elle sonuç giremez', async () => {
    for (const k of [OGR, OGT2]) {
      await olarak(k, async (c) => {
        await expect(c.query(`select public.elle_sonuc_kaydet($1, $2, $3)`, [ATAMA, OGR, ['A', 'A', 'D', '']])).rejects.toThrow(/yetkiniz yok/)
      })
    }
  })

  it('test soruları tek işlemde kaydedilir; tekrar eden soru reddedilir', () =>
    olarak(OGT, async (c) => {
      await c.query(`select public.test_sorulari_kaydet($1, $2)`, [TEST, [S_DY, S_CS1]])
      const r = await c.query(`select soru_id, sira from public.test_soru where test_id = $1 order by sira`, [TEST])
      expect(r.rows).toEqual([
        { soru_id: S_DY, sira: 1 },
        { soru_id: S_CS1, sira: 2 },
      ])
      await expect(c.query(`select public.test_sorulari_kaydet($1, $2)`, [TEST, [S_DY, S_DY]])).rejects.toThrow(/iki kez/)
    }))

  it('başka kurumun öğretmeni testin sorularını değiştiremez', () =>
    olarak(OGT2, async (c) => {
      await c.query(`select public.test_sorulari_kaydet($1, $2)`, [TEST, [S_CS1]]).catch(() => {})
    }).then(async () => {
      const r = await havuz.query(`select count(*)::int as n from public.test_soru where test_id = $1`, [TEST])
      expect(r.rows[0].n).toBe(4)
    }))

  it('kazanım başarısı: tamamlanan denemelerden, açık uçlu hariç', () =>
    olarak(OGT, async (c) => {
      await c.query(`select public.elle_sonuc_kaydet($1, $2, $3)`, [ATAMA, OGR, ['B', 'D', 'D', 'x']])
      const r = await c.query(
        `select kazanim_id, deneme, dogru, yanlis, bos, yuzde::float, ogrenci_sayisi from public.kazanim_basarisi($1)`,
        [GRP],
      )
      expect(r.rows).toEqual([
        { kazanim_id: '40000000-0000-4000-8000-000000110105', deneme: 1, dogru: 0, yanlis: 1, bos: 0, yuzde: 0, ogrenci_sayisi: 1 },
        { kazanim_id: '40000000-0000-4000-8000-000000110104', deneme: 2, dogru: 2, yanlis: 0, bos: 0, yuzde: 100, ogrenci_sayisi: 1 },
      ])
    }))

  it('kazanım raporunu başka kurumun öğretmeni ve başka öğrenci göremez', async () => {
    await olarak(OGT2, async (c) => {
      await expect(c.query(`select * from public.kazanim_basarisi($1)`, [GRP])).rejects.toThrow(/yetkiniz yok/)
    })
    await olarak(OGR, async (c) => {
      await reddedilir(c, `select * from public.kazanim_basarisi($1)`, [GRP], /yetkiniz yok/)
      await reddedilir(c, `select * from public.kazanim_basarisi($1, $2)`, [GRP, OGR_DIS], /yetkiniz yok/)
      const kendi = await c.query(`select * from public.kazanim_basarisi($1, $2)`, [GRP, OGR])
      expect(kendi.rows).toEqual([])
    })
  })
})
