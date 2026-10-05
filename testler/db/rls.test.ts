// RLS politikaları ve bütünlük kuralları için veritabanı testleri.
// Çalıştırmak için: bash scripts/yerel-db.sh && DATABASE_URL=postgresql://postgres@localhost:54329/postgres npm run test:db

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import pg from 'pg'

const URL = process.env.DATABASE_URL
const d = describe.skipIf(!URL)

const id = (n: number) => `00000000-0000-4000-a000-${String(n).padStart(12, '0')}`

// Kurumlar
const KA = id(1) // lisansı geçerli
const KB = id(2) // lisansı geçerli, başka kurum
const KC = id(3) // lisansı bitmiş

// Kullanıcılar
const SUPER = id(100)
const YON_A = id(101)
const OGT_A = id(102)
const OGR_A1 = id(103)
const OGR_A2 = id(104)
const YON_B = id(201)
const OGT_B = id(202)
const OGR_B = id(203)
const OGT_C = id(302)
const PASIF_A = id(105)
const YENI_1 = id(110)

// Sınıf, test, soru
const GRP_A = id(1001)
const GRP_A_BOS = id(1002)
const GRP_B = id(2001)
const TEST_A = id(3001)
const TEST_A_ATANMAMIS = id(3002)
const TEST_B = id(4001)
const ATAMA_A = id(5001)
const ATAMA_B = id(6001)
const SORU_ORNEK = id(7001)
const SORU_GERCEK = id(7002)
const SORU_YAYINDA_DEGIL = id(7003)

let havuz: pg.Pool

/** Verilen kullanıcı olarak (null: giriş yapmamış ziyaretçi) bir işlem içinde çalıştırır ve geri alır. */
async function olarak<T>(kullanici: string | null, is: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await havuz.connect()
  try {
    await c.query('begin')
    await c.query(`set local role ${kullanici ? 'authenticated' : 'anon'}`)
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify(kullanici ? { sub: kullanici, role: 'authenticated' } : { role: 'anon' }),
    ])
    return await is(c)
  } finally {
    await c.query('rollback')
    c.release()
  }
}

const say = async (c: pg.PoolClient, sql: string, p: unknown[] = []) =>
  Number((await c.query(`select count(*)::int as n from (${sql}) x`, p)).rows[0].n)

// Test verisi 00000000-0000-4000-a000-... kimliklerini kullanır; örnek içerik gibi başka satırlar yok sayılır.
const kimlikler = async (c: pg.PoolClient, tablo: string) =>
  (
    await c.query(`select id from public.${tablo} where id::text like '00000000-0000-4000-a000-%' order by id`)
  ).rows.map((r) => r.id as string)

d('RLS ve bütünlük kuralları', () => {
  beforeAll(async () => {
    havuz = new pg.Pool({ connectionString: URL, max: 4 })
    const c = await havuz.connect()
    try {
      await c.query('begin')
      // Önceki çalıştırmadan kalanları temizle.
      await c.query(`delete from public.kurum where id = any($1)`, [[KA, KB, KC]])
      await c.query(`delete from public.kullanici where id = $1`, [SUPER])
      await c.query(`delete from public.soru where id = any($1)`, [[SORU_ORNEK, SORU_GERCEK, SORU_YAYINDA_DEGIL]])
      await c.query(`delete from auth.users where id::text like '00000000-0000-4000-a000-%'`)
      await c.query(`delete from storage.objects where name = 'kitler/9/hafta-01.html'`)

      await c.query(
        `insert into public.kurum (id, ad, lisans_baslangic, lisans_bitis, ogretmen_limiti, ogrenci_limiti) values
          ($1, 'A Kursu', current_date - 30, current_date + 300, 2, 3),
          ($2, 'B Kursu', current_date - 30, current_date + 300, 5, 50),
          ($3, 'C Kursu', current_date - 400, current_date - 1, 5, 50)`,
        [KA, KB, KC],
      )
      const kullanicilar: [string, string | null, string, string, boolean?][] = [
        [SUPER, null, 'superadmin', 'Süper Admin'],
        [YON_A, KA, 'kurum_yonetici', 'A Yönetici'],
        [OGT_A, KA, 'ogretmen', 'A Öğretmen'],
        [OGR_A1, KA, 'ogrenci', 'A Öğrenci Bir'],
        [OGR_A2, KA, 'ogrenci', 'A Öğrenci İki'],
        [PASIF_A, KA, 'ogretmen', 'A Pasif', false],
        [YON_B, KB, 'kurum_yonetici', 'B Yönetici'],
        [OGT_B, KB, 'ogretmen', 'B Öğretmen'],
        [OGR_B, KB, 'ogrenci', 'B Öğrenci'],
        [OGT_C, KC, 'ogretmen', 'C Öğretmen'],
      ]
      for (const [uid, kurum, rol, ad, aktif = true] of kullanicilar) {
        await c.query(`insert into auth.users (id) values ($1)`, [uid])
        await c.query(
          `insert into public.kullanici (id, kurum_id, rol, ad_soyad, aktif) values ($1, $2, $3, $4, $5)`,
          [uid, kurum, rol, ad, aktif],
        )
      }

      await c.query(`insert into auth.users (id) values ($1)`, [YENI_1])

      await c.query(
        `insert into public.sinif_grubu (id, kurum_id, ad) values ($1, $2, '11-A Sayısal'), ($3, $2, '12-B'), ($4, $5, '11-A Sayısal')`,
        [GRP_A, KA, GRP_A_BOS, GRP_B, KB],
      )
      await c.query(`insert into public.sinif_grubu_ogrenci values ($1, $2), ($3, $4)`, [GRP_A, OGR_A1, GRP_B, OGR_B])

      await c.query(
        `insert into public.soru (id, tur, govde, dogru_cevap, zorluk, ornek, yayinda) values
          ($1, 'dogru_yanlis', 'Örnek soru.', 'D', 1, true, true),
          ($2, 'dogru_yanlis', 'Gerçek soru.', 'Y', 2, false, true),
          ($3, 'dogru_yanlis', 'Taslak soru.', 'D', 2, false, false)`,
        [SORU_ORNEK, SORU_GERCEK, SORU_YAYINDA_DEGIL],
      )

      await c.query(
        `insert into public.test (id, kurum_id, tur, baslik) values
          ($1, $2, 'mini_test', 'A testi'), ($3, $2, 'deneme', 'A atanmamış'), ($4, $5, 'mini_test', 'B testi')`,
        [TEST_A, KA, TEST_A_ATANMAMIS, TEST_B, KB],
      )
      await c.query(`insert into public.test_soru values ($1, $2, 1), ($1, $3, 2), ($4, $2, 1)`, [
        TEST_A, SORU_ORNEK, SORU_GERCEK, TEST_B,
      ])
      await c.query(
        `insert into public.atama (id, kurum_id, test_id, sinif_grubu_id) values ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [ATAMA_A, KA, TEST_A, GRP_A, ATAMA_B, KB, TEST_B, GRP_B],
      )
      await c.query(
        `insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen, dogru_mu) values
          ($1, $2, $3, $4, 'D', true), ($1, $5, $6, $4, 'Y', false)`,
        [KA, ATAMA_A, OGR_A1, SORU_ORNEK, ATAMA_B, OGR_B],
      )
      await c.query(
        `insert into public.sonuc (kurum_id, atama_id, ogrenci_id, dogru, yanlis, net) values
          ($1, $2, $3, 1, 0, 1), ($1, $4, $5, 0, 1, -0.25)`,
        [KA, ATAMA_A, OGR_A1, ATAMA_B, OGR_B],
      )
      await c.query(
        `insert into storage.objects (bucket_id, name) values ('icerik', 'kitler/9/hafta-01.html')`,
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

  describe('giriş yapmamış ziyaretçi', () => {
    it('kataloğu ve yalnızca örnek soruları görür', () =>
      olarak(null, async (c) => {
        expect(await say(c, 'select * from public.kazanim')).toBeGreaterThan(0)
        expect(await kimlikler(c, 'soru')).toEqual([SORU_ORNEK])
      }))

    it('tohum dosyasındaki örnek soruları, kitleri ve etiketlerini görür (tahta modu denemesi)', () =>
      olarak(null, async (c) => {
        const ornek = await say(c, 'select * from public.soru where ornek')
        expect(ornek).toBeGreaterThanOrEqual(1)
        expect(await say(c, 'select * from public.soru where not ornek')).toBe(0)
        expect(await say(c, 'select * from public.icerik where ornek')).toBeGreaterThanOrEqual(1)
        expect(await say(c, 'select * from public.soru_kazanim')).toBeGreaterThanOrEqual(ornek)
      }))

    it('kurum ve kullanıcı verisini göremez', () =>
      olarak(null, async (c) => {
        await expect(c.query('select * from public.kurum')).rejects.toThrow(/permission denied/)
        await c.query('rollback')
      }))
  })

  describe('kurumlar birbirinin verisini göremez', () => {
    it('öğretmen yalnızca kendi kurumunu, kullanıcılarını, testlerini ve sonuçlarını görür', () =>
      olarak(OGT_A, async (c) => {
        expect(await kimlikler(c, 'kurum')).toEqual([KA])
        const kullanicilar = await kimlikler(c, 'kullanici')
        expect(kullanicilar).toContain(OGR_A1)
        expect(kullanicilar).not.toContain(OGR_B)
        expect(kullanicilar).not.toContain(SUPER)
        expect(await kimlikler(c, 'sinif_grubu')).toEqual([GRP_A, GRP_A_BOS])
        expect(await kimlikler(c, 'test')).toEqual([TEST_A, TEST_A_ATANMAMIS])
        expect(await kimlikler(c, 'atama')).toEqual([ATAMA_A])
        expect(await say(c, 'select * from public.sonuc')).toBe(1)
        expect(await say(c, 'select * from public.cevap where ogrenci_id = $1', [OGR_B])).toBe(0)
        expect(await say(c, 'select * from public.test_soru where test_id = $1', [TEST_B])).toBe(0)
      }))

    it('başka kurumun testini güncelleyemez ve silemez', () =>
      olarak(OGT_A, async (c) => {
        const g = await c.query(`update public.test set baslik = 'ele geçirildi' where id = $1`, [TEST_B])
        expect(g.rowCount).toBe(0)
        const s = await c.query(`delete from public.test where id = $1`, [TEST_B])
        expect(s.rowCount).toBe(0)
      }))

    it('başka kuruma test ekleyemez', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(`insert into public.test (kurum_id, tur, baslik) values ($1, 'deneme', 'x')`, [KB]),
        ).rejects.toThrow(/row-level security/)
      }))

    it('kendi testini başka kurumun sınıfına atayamaz', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(`insert into public.atama (kurum_id, test_id, sinif_grubu_id) values ($1, $2, $3)`, [
            KA, TEST_A, GRP_B,
          ]),
        ).rejects.toThrow(/aynı kuruma ait/)
      }))

    it('süper admin her kurumu görür', () =>
      olarak(SUPER, async (c) => {
        const kurumlar = await kimlikler(c, 'kurum')
        expect(kurumlar).toEqual(expect.arrayContaining([KA, KB, KC]))
        expect(await say(c, 'select * from public.sonuc where atama_id = any($1)', [[ATAMA_A, ATAMA_B]])).toBe(2)
      }))
  })

  describe('lisans', () => {
    it('lisanslı öğretmen yayındaki tüm soruları görür, taslakları göremez', () =>
      olarak(OGT_A, async (c) => {
        const sorular = await kimlikler(c, 'soru')
        expect(sorular).toEqual(expect.arrayContaining([SORU_ORNEK, SORU_GERCEK]))
        expect(sorular).not.toContain(SORU_YAYINDA_DEGIL)
      }))

    it('lisansı bitmiş kurumun öğretmeni yalnızca örnek soruları görür ve test oluşturamaz', () =>
      olarak(OGT_C, async (c) => {
        expect(await kimlikler(c, 'soru')).toEqual([SORU_ORNEK])
        expect(await kimlikler(c, 'kurum')).toEqual([KC])
        await expect(
          c.query(`insert into public.test (kurum_id, tur, baslik) values ($1, 'deneme', 'x')`, [KC]),
        ).rejects.toThrow(/row-level security/)
      }))

    it('pasif kullanıcı hiçbir kurum verisini göremez', () =>
      olarak(PASIF_A, async (c) => {
        expect(await kimlikler(c, 'kurum')).toEqual([])
        expect(await kimlikler(c, 'test')).toEqual([])
        expect(await kimlikler(c, 'soru')).toEqual([SORU_ORNEK])
      }))
  })

  describe('öğrenci', () => {
    it('yalnızca kendi sonuç ve cevaplarını görür', () =>
      olarak(OGR_A1, async (c) => {
        expect(await say(c, 'select * from public.sonuc')).toBe(1)
        expect(await say(c, 'select * from public.sonuc where ogrenci_id <> $1', [OGR_A1])).toBe(0)
        expect(await say(c, 'select * from public.cevap where ogrenci_id <> $1', [OGR_A1])).toBe(0)
      }))

    it('diğer öğrencileri ve kendi sınıfı dışındaki sınıfları göremez', () =>
      olarak(OGR_A1, async (c) => {
        expect(await kimlikler(c, 'kullanici')).toEqual([OGR_A1])
        expect(await kimlikler(c, 'sinif_grubu')).toEqual([GRP_A])
      }))

    it('yalnızca sınıfına atanmış testi görür, soru listesini ve cevap anahtarını göremez', () =>
      olarak(OGR_A1, async (c) => {
        expect(await kimlikler(c, 'test')).toEqual([TEST_A])
        expect(await say(c, 'select * from public.test_soru')).toBe(0)
        expect(await kimlikler(c, 'soru')).toEqual([SORU_ORNEK])
      }))

    it('cevap ve sonuç yazamaz (doğru mu alanını kendisi belirleyemez)', () =>
      olarak(OGR_A1, async (c) => {
        await expect(
          c.query(
            `insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen, dogru_mu)
             values ($1, $2, $3, $4, 'Y', true)`,
            [KA, ATAMA_A, OGR_A1, SORU_GERCEK],
          ),
        ).rejects.toThrow(/row-level security/)
      }))

    it('kendi sonucunu güncelleyemez', () =>
      olarak(OGR_A1, async (c) => {
        const r = await c.query(`update public.sonuc set net = 99 where ogrenci_id = $1`, [OGR_A1])
        expect(r.rowCount).toBe(0)
      }))
  })

  describe('kurum yöneticisi', () => {
    it('kurum adını değiştirebilir ama lisans bilgisini değiştiremez', () =>
      olarak(YON_A, async (c) => {
        const r = await c.query(`update public.kurum set ad = 'A Kursu Yeni' where id = $1`, [KA])
        expect(r.rowCount).toBe(1)
        await expect(
          c.query(`update public.kurum set lisans_bitis = current_date + 3000 where id = $1`, [KA]),
        ).rejects.toThrow(/yalnızca süper admin/)
      }))

    it('başka kurumu güncelleyemez', () =>
      olarak(YON_A, async (c) => {
        const r = await c.query(`update public.kurum set ad = 'x' where id = $1`, [KB])
        expect(r.rowCount).toBe(0)
      }))

    it('kendi kurumuna öğrenci ekleyebilir', () =>
      olarak(YON_A, async (c) => {
        const r = await c.query(
          `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogrenci', 'Yeni Öğrenci')`,
          [YENI_1, KA],
        )
        expect(r.rowCount).toBe(1)
      }))

    it('başka kuruma kullanıcı ekleyemez', () =>
      olarak(YON_A, async (c) => {
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogrenci', 'Sızma')`,
            [YENI_1, KB],
          ),
        ).rejects.toThrow(/row-level security/)
      }))

    it('yönetici veya süper admin oluşturamaz', async () => {
      await olarak(YON_A, async (c) => {
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'kurum_yonetici', 'İkinci')`,
            [YENI_1, KA],
          ),
        ).rejects.toThrow(/yalnızca öğretmen ve öğrenci/)
      })
      await olarak(YON_A, async (c) => {
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, null, 'superadmin', 'Sahte')`,
            [YENI_1],
          ),
        ).rejects.toThrow(/yalnızca öğretmen ve öğrenci|row-level security/)
      })
    })

    it('kendi rolünü değiştiremez, öğrenciyi süper admin yapamaz', async () => {
      await olarak(YON_A, async (c) => {
        await expect(
          c.query(`update public.kullanici set ad_soyad = 'X' where id = $1`, [YON_A]),
        ).rejects.toThrow(/Kendi rolünüzü/)
      })
      await olarak(YON_A, async (c) => {
        await expect(
          c.query(`update public.kullanici set rol = 'superadmin', kurum_id = null where id = $1`, [OGR_A2]),
        ).rejects.toThrow()
      })
    })

    it('öğretmen kullanıcı ekleyemez', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogrenci', 'Yeni')`,
            [YENI_1, KA],
          ),
        ).rejects.toThrow(/row-level security/)
      }))
  })

  describe('kontenjan', () => {
    it('öğrenci limitini aşan ekleme reddedilir', async () => {
      // A Kursu öğrenci limiti 3; şu an 2 aktif öğrenci var.
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await c.query(`insert into auth.users (id) values ($1), ($2)`, [id(120), id(121)])
        await c.query(
          `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogrenci', 'Üçüncü')`,
          [id(120), KA],
        )
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogrenci', 'Dördüncü')`,
            [id(121), KA],
          ),
        ).rejects.toThrow(/öğrenci kontenjanı dolu/)
      } finally {
        await c.query('rollback')
        c.release()
      }
    })

    it('pasif kullanıcı kontenjana sayılmaz; aktifleştirmek limiti kontrol eder', async () => {
      // A Kursu öğretmen limiti 2; aktif öğretmen 1 (OGT_A), pasif 1 (PASIF_A).
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await c.query(`update public.kullanici set aktif = true where id = $1`, [PASIF_A])
        await c.query(`insert into auth.users (id) values ($1)`, [id(130)])
        await expect(
          c.query(
            `insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, 'ogretmen', 'Fazla')`,
            [id(130), KA],
          ),
        ).rejects.toThrow(/öğretmen kontenjanı dolu/)
      } finally {
        await c.query('rollback')
        c.release()
      }
    })
  })

  describe('soru tekrar etmeme', () => {
    it('aynı test içinde aynı soru iki kez bulunamaz', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(`insert into public.test_soru (test_id, soru_id, sira) values ($1, $2, 3)`, [TEST_A, SORU_ORNEK]),
        ).rejects.toThrow(/duplicate key|test_soru_pkey/)
      }))

    it('aynı sırada iki soru bulunamaz', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(`insert into public.test_soru (test_id, soru_id, sira) values ($1, $2, 1)`, [
            TEST_A_ATANMAMIS, SORU_ORNEK,
          ]).then(() =>
            c.query(`insert into public.test_soru (test_id, soru_id, sira) values ($1, $2, 1)`, [
              TEST_A_ATANMAMIS, SORU_GERCEK,
            ]),
          ),
        ).rejects.toThrow(/duplicate key/)
      }))
  })

  describe('bütünlük', () => {
    it('öğrenci başka kurumun sınıfına eklenemez', async () => {
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await expect(c.query(`insert into public.sinif_grubu_ogrenci values ($1, $2)`, [GRP_B, OGR_A2])).rejects.toThrow(
          /aynı kuruma ait/,
        )
      } finally {
        await c.query('rollback')
        c.release()
      }
    })

    it('cevabın kurumu atamadan alınır ve soru testte olmalıdır', async () => {
      const c = await havuz.connect()
      try {
        await c.query('begin')
        const r = await c.query(
          `insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen) values ($1, $2, $3, $4, 'D')
           returning kurum_id`,
          [KB, ATAMA_A, OGR_A1, SORU_GERCEK],
        )
        expect(r.rows[0].kurum_id).toBe(KA)
        await expect(
          c.query(
            `insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen) values ($1, $2, $3, $4, 'D')`,
            [KA, ATAMA_A, OGR_A1, SORU_YAYINDA_DEGIL],
          ),
        ).rejects.toThrow(/teste ait değil/)
      } finally {
        await c.query('rollback')
        c.release()
      }
    })

    it('çoktan seçmeli soru tam 5 şık ve A-E arası cevap ister', async () => {
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await expect(
          c.query(
            `insert into public.soru (tur, govde, secenekler, dogru_cevap, zorluk)
             values ('coktan_secmeli', 'x', '[{"harf":"A"},{"harf":"B"}]', 'A', 1)`,
          ),
        ).rejects.toThrow(/check constraint/)
      } finally {
        await c.query('rollback')
        c.release()
      }
    })
  })

  describe('öğrenci girişi için kurum bulma', () => {
    it('kurum kodu ve sınıf koduyla kurumu bulur, büyük/küçük harf önemsiz', async () => {
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await c.query(`update public.kurum set kod = 'AKURS' where id = $1`, [KA])
        await c.query(`update public.sinif_grubu set katilim_kodu = 'SNF123' where id = $1`, [GRP_A])
        await c.query(`set local role anon`)
        const bul = async (kod: string) => (await c.query('select public.giris_kurumu_bul($1) as id', [kod])).rows[0].id
        expect(await bul('akurs')).toBe(KA)
        expect(await bul(' snf123 ')).toBe(KA)
        expect(await bul('YOKBOYLE')).toBeNull()
      } finally {
        await c.query('rollback')
        c.release()
      }
    })

    it('pasif kurum bulunmaz', async () => {
      const c = await havuz.connect()
      try {
        await c.query('begin')
        await c.query(`update public.kurum set kod = 'PASIFK', aktif = false where id = $1`, [KB])
        await c.query(`set local role anon`)
        expect((await c.query(`select public.giris_kurumu_bul('PASIFK') as id`)).rows[0].id).toBeNull()
      } finally {
        await c.query('rollback')
        c.release()
      }
    })

    it('sınıf kodu üretici çakışmasız ve okunaklı kod verir', () =>
      olarak(YON_A, async (c) => {
        const kodlar = new Set<string>()
        for (let i = 0; i < 50; i++) kodlar.add((await c.query('select public.katilim_kodu_uret() as k')).rows[0].k)
        expect(kodlar.size).toBe(50)
        for (const k of kodlar) expect(k).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
      }))
  })

  describe('dosya depolama', () => {
    it('yönetici yalnızca kendi kurumunun logo klasörüne yazar', () =>
      olarak(YON_A, async (c) => {
        await c.query(`insert into storage.objects (bucket_id, name) values ('logolar', $1)`, [`${KA}/logo.png`])
        await expect(
          c.query(`insert into storage.objects (bucket_id, name) values ('logolar', $1)`, [`${KB}/logo.png`]),
        ).rejects.toThrow(/row-level security/)
      }))

    it('öğretmen yalnızca logo yükleyemez', () =>
      olarak(OGT_A, async (c) => {
        await expect(
          c.query(`insert into storage.objects (bucket_id, name) values ('logolar', $1)`, [`${KA}/logo.png`]),
        ).rejects.toThrow(/row-level security/)
      }))

    it('HTML kitleri lisanslı öğretmen okur, öğrenci ve lisansı bitmiş öğretmen okuyamaz', async () => {
      const sorgu = `select * from storage.objects where bucket_id = 'icerik'`
      expect(await olarak(OGT_A, (c) => say(c, sorgu))).toBe(1)
      expect(await olarak(OGR_A1, (c) => say(c, sorgu))).toBe(0)
      expect(await olarak(OGT_C, (c) => say(c, sorgu))).toBe(0)
      expect(await olarak(null, (c) => say(c, sorgu))).toBe(0)
    })
  })
})
