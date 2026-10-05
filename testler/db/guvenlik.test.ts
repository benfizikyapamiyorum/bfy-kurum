// @vitest-environment jsdom
// M6 güvenlik incelemesinin bulguları için gerileme testleri. jsdom ortamı, sunucudaki katman
// ayıklayıcıyı tarayıcıdaki DOMParser/DOMPurify sürümüyle karşılaştırmak için.

import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ornekSorular } from '../../src/veri/ornekSorular'

const URL = process.env.DATABASE_URL
const d = describe.skipIf(!URL)
const id = (n: number) => `00000000-0000-4000-e000-${String(n).padStart(12, '0')}`
const KA = id(1)
const KB = id(2)
const YON_A = id(10)
const OGT_A = id(11)
const OGR_A = id(20)
const GRP_A = id(30)
const TEST = id(40)
const ATAMA = id(50)
const S_SEKILLI = id(60)
const S_KAPALI = id(61)
const KAZ = '40000000-0000-4000-8000-000000110104'

const KATMANLI = `<svg viewBox="0 0 100 50"><rect x="0" y="0" width="10" height="10"/><g data-ciz-adim="1"><text>Cevap C</text><g><line/></g></g><path data-ciz-adim="2" d="M0 0"/><circle data-ciz-adim="1" data-ciz-tur="hareket" r="3"/><text data-ciz-adim="0">K</text></svg>`

let havuz: pg.Pool

async function olarak<T>(k: string | null, is: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await havuz.connect()
  try {
    await c.query('begin')
    await c.query(`set local role ${k ? 'authenticated' : 'anon'}`)
    await c.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(k ? { sub: k } : {})])
    return await is(c)
  } finally {
    await c.query('rollback')
    c.release()
  }
}

d('güvenlik düzeltmeleri', () => {
  beforeAll(async () => {
    havuz = new pg.Pool({ connectionString: URL, max: 3 })
    const c = await havuz.connect()
    try {
      await c.query('begin')
      await c.query(`delete from public.kurum where id = any($1)`, [[KA, KB]])
      await c.query(`delete from public.soru where id = any($1)`, [[S_SEKILLI, S_KAPALI]])
      await c.query(`delete from auth.users where id::text like '00000000-0000-4000-e000-%'`)
      await c.query(
        `insert into public.kurum (id, ad, kod, lisans_baslangic, lisans_bitis) values
          ($1, 'A Kursu', 'AKURSU', current_date - 1, current_date + 100), ($2, 'B Kursu', 'BKURSU', current_date - 1, current_date + 100)`,
        [KA, KB],
      )
      for (const [u, rol] of [
        [YON_A, 'kurum_yonetici'],
        [OGT_A, 'ogretmen'],
        [OGR_A, 'ogrenci'],
      ] as const) {
        await c.query(`insert into auth.users (id) values ($1)`, [u])
        await c.query(`insert into public.kullanici (id, kurum_id, rol, ad_soyad) values ($1, $2, $3, 'Kişi')`, [u, KA, rol])
      }
      await c.query(`insert into public.sinif_grubu (id, kurum_id, ad, katilim_kodu) values ($1, $2, 'A', 'SINIFA1')`, [GRP_A, KA])
      await c.query(`insert into public.sinif_grubu_ogrenci values ($1, $2)`, [GRP_A, OGR_A])
      await c.query(
        `insert into public.soru (id, tur, govde, sekil_svg, secenekler, dogru_cevap, zorluk, yayinda) values
          ($1, 'dogru_yanlis', 'Şekilli', $3, null, 'D', 2, true),
          ($2, 'dogru_yanlis', 'Yayında değil', null, null, 'Y', 2, false)`,
        [S_SEKILLI, S_KAPALI, KATMANLI],
      )
      await c.query(`insert into public.soru_kazanim values ($1, $3), ($2, $3)`, [S_SEKILLI, S_KAPALI, KAZ])
      await c.query(`insert into public.test (id, kurum_id, tur, baslik, sure_dk) values ($1, $2, 'mini_test', 'T', 20)`, [TEST, KA])
      await c.query(`insert into public.test_soru values ($1, $2, 1)`, [TEST, S_SEKILLI])
      await c.query(
        `insert into public.atama (id, kurum_id, test_id, sinif_grubu_id, baslangic) values ($1, $2, $3, $4, now() - interval '1 hour')`,
        [ATAMA, KA, TEST, GRP_A],
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

  it('sunucudaki katman ayıklayıcı tarayıcıdakiyle aynı sonucu verir (tüm örnek şekiller)', async () => {
    const { cozumKatmanlariniKaldir, sekilSvgTemizle } = await import('../../src/bilesenler/zenginMetin')
    const sekiller = [KATMANLI, ...ornekSorular.map((s) => s.sekil_svg).filter((x): x is string => !!x)]
    expect(sekiller.filter((s) => /data-ciz-adim="[1-9]/.test(s)).length).toBeGreaterThan(3)
    for (const svg of sekiller) {
      const sunucu = (await havuz.query('select ozel.cozum_katmanlarini_kaldir($1) as s', [svg])).rows[0].s as string
      expect(sekilSvgTemizle(sunucu)).toBe(cozumKatmanlariniKaldir(sekilSvgTemizle(svg)))
    }
  })

  it('öğrenciye giden şekilde çözüm katmanı yok; çözümler açılınca tam şekil gelir', () =>
    olarak(OGR_A, async (c) => {
      const s = (await c.query('select sekil_svg from public.ogrenci_test_sorulari($1)', [ATAMA])).rows[0].sekil_svg as string
      expect(s).not.toContain('Cevap C')
      expect(s).not.toContain('data-ciz-adim="2"')
      expect(s).toContain('data-ciz-tur="hareket"')
      expect(s).toContain('>K<')
      await c.query(`select public.ogrenci_cevap_kaydet($1, $2, 'D')`, [ATAMA, S_SEKILLI])
      await c.query('select public.ogrenci_testi_bitir($1)', [ATAMA])
      const once = (await c.query('select sekil_svg from public.ogrenci_sonuc_ayrintisi($1)', [ATAMA])).rows[0].sekil_svg
      expect(once).not.toContain('Cevap C')
      await c.query('reset role')
      await c.query('update public.atama set cozumler_acik = true where id = $1', [ATAMA])
      await c.query('set local role authenticated')
      const sonra = (await c.query('select sekil_svg from public.ogrenci_sonuc_ayrintisi($1)', [ATAMA])).rows[0].sekil_svg
      expect(sonra).toContain('Cevap C')
    }))

  it('test süresi sunucuda uygulanır; çok uzun cevap ve testte olmayan soru reddedilir', () =>
    olarak(OGR_A, async (c) => {
      const kaydet = (s: string, v: string) => c.query(`select public.ogrenci_cevap_kaydet($1, $2, $3)`, [ATAMA, s, v])
      await c.query('savepoint a')
      await expect(kaydet(S_KAPALI, 'Y')).rejects.toThrow(/bu testte yok/)
      await c.query('rollback to savepoint a')
      await expect(kaydet(S_SEKILLI, 'x'.repeat(4001))).rejects.toThrow(/çok uzun/)
      await c.query('rollback to savepoint a')
      await kaydet(S_SEKILLI, 'D')
      await c.query('reset role')
      await c.query(`update public.cozum_baslangic set baslangic = now() - interval '23 minutes' where atama_id = $1`, [ATAMA])
      await c.query('set local role authenticated')
      await expect(kaydet(S_SEKILLI, 'Y')).rejects.toThrow(/süresi doldu/)
    }))

  it('kurum kodu ve sınıf kodu çakışamaz; yönetici kurum kodunu değiştiremez', () =>
    olarak(YON_A, async (c) => {
      await c.query('savepoint a')
      await expect(
        c.query(`insert into public.sinif_grubu (kurum_id, ad, katilim_kodu) values ($1, 'X', 'BKURSU')`, [KA]),
      ).rejects.toThrow(/kurum kodu olarak kullanılıyor/)
      await c.query('rollback to savepoint a')
      await expect(c.query(`update public.kurum set kod = 'YENIKOD' where id = $1`, [KA])).rejects.toThrow(/yalnızca süper admin/)
      await c.query('rollback to savepoint a')
      await c.query('reset role')
      await expect(c.query(`update public.kurum set kod = 'SINIFA1' where id = $1`, [KB])).rejects.toThrow(/sınıf kodu olarak/)
    }))

  it('giriş kodu Türkçe klavyeden küçük harfle yazılsa da bulunur', () =>
    olarak(null, async (c) => {
      for (const kod of ['akursu', ' AKURSU ', 'sınıfa1', 'sinifa1', 'SİNİFA1']) {
        expect((await c.query('select public.giris_kurumu_bul($1) as k', [kod])).rows[0].k).toBe(KA)
      }
    }))

  it('öğretmen teste yayında olmayan soruyu ekleyemez', () =>
    olarak(OGT_A, async (c) => {
      await expect(c.query('select public.test_sorulari_kaydet($1, $2)', [TEST, [S_SEKILLI, S_KAPALI]])).rejects.toThrow(
        /row-level security/,
      )
    }))

  it('giriş yapmamış ziyaretçinin çağırabildiği fonksiyonlar yalnızca giriş için gerekenler', async () => {
    const r = await havuz.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
         -- uzantı (pgcrypto vb.) fonksiyonları hariç
         and not exists (select 1 from pg_depend dp where dp.objid = p.oid and dp.deptype = 'e')
       order by 1`,
    )
    expect(r.rows.map((x) => x.proname)).toEqual(['giris_kurumu_bul', 'ogrenci_eposta'])
  })
})
