// Giriş ve çıkış. Öğretmen ve yönetici e-postayla, öğrenci kurum (ya da sınıf) koduyla girer.

import type { SupabaseClient } from '@supabase/supabase-js'

const hataCevir = (m: string) =>
  /invalid login credentials/i.test(m)
    ? 'Bilgiler hatalı. Kullanıcı adınızı ve şifrenizi kontrol edin.'
    : /email not confirmed/i.test(m)
      ? 'Hesap henüz onaylanmamış.'
      : /banned|user is banned/i.test(m)
        ? 'Hesabınız kurum tarafından kapatılmış.'
        : /fetch|network/i.test(m)
          ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
          : m

export async function personelGirisi(db: SupabaseClient, eposta: string, sifre: string): Promise<void> {
  const { error } = await db.auth.signInWithPassword({ email: eposta.trim().toLowerCase(), password: sifre })
  if (error) throw new Error(hataCevir(error.message))
}

export async function ogrenciGirisi(db: SupabaseClient, kod: string, kullaniciAdi: string, sifre: string): Promise<void> {
  const { data: kurumId, error } = await db.rpc('giris_kurumu_bul', { p_kod: kod })
  if (error) throw new Error(hataCevir(error.message))
  if (!kurumId) throw new Error('Bu kurum ya da sınıf kodu bulunamadı.')
  const eposta = `${kullaniciAdi.trim().toLowerCase()}@${kurumId}.ogrenci.invalid`
  const { error: g } = await db.auth.signInWithPassword({ email: eposta, password: sifre })
  if (g) throw new Error(hataCevir(g.message))
}
