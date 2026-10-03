import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ortam } from '../yapilandirma/ortam'

let istemci: SupabaseClient | null = null

/** Supabase istemcisi. .env içinde bağlantı bilgisi yoksa null döner (yerel deneme modu). */
export function supabase(): SupabaseClient | null {
  if (!ortam.supabaseVar) return null
  istemci ??= createClient(ortam.supabaseUrl, ortam.supabaseAnonAnahtar, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return istemci
}
