// Sunucu testleri için hazırlık: her testte yeni bir kurum ve yönetici hesabı.

import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVIS =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

export const admin = createClient(SUPABASE_URL, SERVIS, { auth: { persistSession: false } })

export const SIFRE = 'deneme123'

const rastgele = () => Math.random().toString(36).slice(2, 8)

export interface DenemeKurumu {
  id: string
  kod: string
  ad: string
  yoneticiEposta: string
}

export async function kullaniciAc(eposta: string, rol: string, ad: string, kurumId: string | null, kullaniciAdi?: string) {
  const { data, error } = await admin.auth.admin.createUser({ email: eposta, password: SIFRE, email_confirm: true })
  if (error) throw error
  const { error: e2 } = await admin
    .from('kullanici')
    .insert({ id: data.user!.id, kurum_id: kurumId, rol, ad_soyad: ad, eposta, kullanici_adi: kullaniciAdi ?? null })
  if (e2) throw e2
  return data.user!.id
}

export async function kurumAc(ek: { lisansBitti?: boolean; ogrenciLimiti?: number } = {}): Promise<DenemeKurumu> {
  const r = rastgele()
  const kod = `T${r.toUpperCase()}`.slice(0, 8)
  const bugun = new Date()
  const gun = (n: number) => new Date(bugun.getTime() + n * 864e5).toISOString().slice(0, 10)
  const { data, error } = await admin
    .from('kurum')
    .insert({
      ad: `Deneme Kursu ${r}`,
      kod,
      lisans_baslangic: gun(-30),
      lisans_bitis: ek.lisansBitti ? gun(-1) : gun(300),
      ogretmen_limiti: 3,
      ogrenci_limiti: ek.ogrenciLimiti ?? 50,
    })
    .select('id, ad')
    .single()
  if (error) throw error
  const yoneticiEposta = `yonetici-${r}@deneme.test`
  await kullaniciAc(yoneticiEposta, 'kurum_yonetici', 'Deneme Yönetici', data.id)
  return { id: data.id, kod, ad: data.ad, yoneticiEposta }
}
