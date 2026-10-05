// Yerel Supabase (npx supabase start) için deneme hesapları açar. Canlı projede ÇALIŞTIRILMAZ.
// Kullanım: npx tsx scripts/yerel-supabase-tohum.ts
//   Süper admin   : admin@ornek.test / deneme123
//   Kurum yönetici: yonetici@atlas.test / deneme123   (kurum kodu ATLAS)
//   Öğretmen      : ogretmen@atlas.test / deneme123

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVIS =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error('Bu betik yalnızca yerel Supabase için.')

const admin = createClient(URL, SERVIS, { auth: { persistSession: false } })
export const ATLAS = '00000000-0000-4000-b000-000000000001'
const SIFRE = 'deneme123'

async function hesap(eposta: string, rol: string, ad: string, kurum: string | null) {
  const { data: liste } = await admin.auth.admin.listUsers({ perPage: 1000 })
  let u = liste.users.find((x) => x.email === eposta)
  if (!u) {
    const { data, error } = await admin.auth.admin.createUser({ email: eposta, password: SIFRE, email_confirm: true })
    if (error) throw error
    u = data.user!
  }
  const { error } = await admin
    .from('kullanici')
    .upsert({ id: u.id, kurum_id: kurum, rol, ad_soyad: ad, eposta, aktif: true })
  if (error) throw error
  return u.id
}

const bugun = new Date()
const yilSonra = new Date(bugun.getTime() + 365 * 864e5).toISOString().slice(0, 10)
const { error } = await admin.from('kurum').upsert({
  id: ATLAS,
  ad: 'Atlas Eğitim Kursu',
  kod: 'ATLAS',
  lisans_baslangic: bugun.toISOString().slice(0, 10),
  lisans_bitis: yilSonra,
  ogretmen_limiti: 5,
  ogrenci_limiti: 60,
  aktif: true,
})
if (error) throw error
await hesap('admin@ornek.test', 'superadmin', 'Süper Admin', null)
await hesap('yonetici@atlas.test', 'kurum_yonetici', 'Ayşe Kaya', ATLAS)
await hesap('ogretmen@atlas.test', 'ogretmen', 'Mehmet Demir', ATLAS)
console.log('Yerel deneme hesapları hazır.')
