// src/veri altındaki TypeScript verisinden Supabase tohum SQL dosyalarını üretir.
// Kullanım: npm run seed:uret
// Üretilen dosyalar elle düzenlenmez; veri değişince bu betik yeniden çalıştırılır.

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { katalog } from '../src/veri/katalog'

const kok = resolve(import.meta.dirname, '..')
const goc = (ad: string) => resolve(kok, 'supabase/migrations', ad)

/** SQL metin sabiti: tek tırnaklar ikilenir. Dolar tırnağı kullanılmaz; içerik ne olursa olsun güvenlidir. */
export const metin = (s: string | null | undefined): string =>
  s === null || s === undefined ? 'null' : `'${s.replace(/'/g, "''")}'`

export const ust = (aciklama: string) =>
  `-- =====================================================================\n` +
  `-- ${aciklama}\n` +
  `-- Bu dosya scripts/ornek-veri-sql-uret.ts ile üretildi. Elle düzenlemeyin.\n` +
  `-- =====================================================================\n\n`

function katalogSql(): string {
  const satirlar: string[] = [ust('0005: Katalog (ders, seviye, ünite, TYMM kazanımları).')]
  for (const d of katalog.dersler) {
    satirlar.push(
      `insert into public.ders (id, kod, ad, sira) values (${metin(d.id)}, ${metin(d.kod)}, ${metin(d.ad)}, ${d.sira})\n` +
        `  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;`,
    )
  }
  satirlar.push('')
  for (const s of katalog.seviyeler) {
    satirlar.push(
      `insert into public.seviye (id, kod, ad, sira) values (${metin(s.id)}, ${metin(s.kod)}, ${metin(s.ad)}, ${s.sira})\n` +
        `  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;`,
    )
  }
  satirlar.push('')
  for (const u of katalog.uniteler) {
    satirlar.push(
      `insert into public.unite (id, ders_id, seviye_id, no, ad) values (${metin(u.id)}, ${metin(u.ders_id)}, ${metin(u.seviye_id)}, ${u.no}, ${metin(u.ad)})\n` +
        `  on conflict (id) do update set no = excluded.no, ad = excluded.ad;`,
    )
  }
  satirlar.push('')
  for (const k of katalog.kazanimlar) {
    satirlar.push(
      `insert into public.kazanim (id, unite_id, kod, metin, sira) values (${metin(k.id)}, ${metin(k.unite_id)}, ${metin(k.kod)}, ${metin(k.metin)}, ${k.sira})\n` +
        `  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;`,
    )
  }
  return satirlar.join('\n') + '\n'
}

writeFileSync(goc('20261003000500_katalog.sql'), katalogSql())
console.log('Katalog SQL dosyası üretildi.')
