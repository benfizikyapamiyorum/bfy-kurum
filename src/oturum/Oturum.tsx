// Oturum bağlamı: Supabase oturumu, kullanıcının profili ve kurumu.

import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { lisansDurumu, type LisansDurumu } from '../alan/lisans'
import type { Kullanici, Kurum, Rol } from '../alan/tipler'
import { supabase } from '../depo/supabaseIstemci'

export interface OturumDurumu {
  /** Supabase bağlı değilse false: giriş özellikleri kapalı, yerel deneme modu. */
  sunucuVar: boolean
  hazir: boolean
  oturum: Session | null
  profil: Kullanici | null
  kurum: Kurum | null
  lisans: LisansDurumu | null
  /** Profil bulunamadı ya da yüklenemedi. */
  hata: string | null
  cikis: () => Promise<void>
  yenile: () => void
}

const Baglam = createContext<OturumDurumu | null>(null)

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const db = supabase()
  const [oturum, setOturum] = useState<Session | null>(null)
  const [hazir, setHazir] = useState(!db)
  const [profil, setProfil] = useState<Kullanici | null>(null)
  const [kurum, setKurum] = useState<Kurum | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [sayac, setSayac] = useState(0)

  useEffect(() => {
    if (!db) return
    void db.auth.getSession().then(({ data }) => {
      setOturum(data.session)
      if (!data.session) setHazir(true)
    })
    const { data } = db.auth.onAuthStateChange((_olay, s) => {
      setOturum(s)
      if (!s) {
        setProfil(null)
        setKurum(null)
        setHazir(true)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [db])

  const kullaniciId = oturum?.user.id
  useEffect(() => {
    if (!db || !kullaniciId) return
    let iptal = false
    void (async () => {
      const { data: p, error } = await db
        .from('kullanici')
        .select('id, kurum_id, rol, ad_soyad, kullanici_adi, eposta, aktif')
        .eq('id', kullaniciId)
        .maybeSingle()
      if (iptal) return
      if (error || !p) {
        setHata(error ? error.message : 'Bu hesap için kullanıcı kaydı bulunamadı. Kurum yöneticinize başvurun.')
        setProfil(null)
        setKurum(null)
        setHazir(true)
        return
      }
      setProfil(p as Kullanici)
      setHata(null)
      if (p.kurum_id) {
        const { data: k } = await db
          .from('kurum')
          .select('id, ad, kod, logo_yolu, lisans_baslangic, lisans_bitis, ogretmen_limiti, ogrenci_limiti, aktif, demo')
          .eq('id', p.kurum_id)
          .maybeSingle()
        if (!iptal) setKurum((k as Kurum) ?? null)
      } else setKurum(null)
      if (!iptal) setHazir(true)
    })()
    return () => {
      iptal = true
    }
  }, [db, kullaniciId, sayac])

  const cikis = useCallback(async () => {
    await db?.auth.signOut()
  }, [db])
  const yenile = useCallback(() => setSayac((n) => n + 1), [])

  const deger = useMemo<OturumDurumu>(
    () => ({
      sunucuVar: !!db,
      hazir: hazir && (!oturum || profil !== null || hata !== null),
      oturum,
      profil,
      kurum,
      lisans: kurum ? lisansDurumu(kurum) : null,
      hata,
      cikis,
      yenile,
    }),
    [db, hazir, oturum, profil, kurum, hata, cikis, yenile],
  )
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOturum(): OturumDurumu {
  const o = useContext(Baglam)
  if (!o) throw new Error('useOturum yalnızca OturumSaglayici içinde kullanılabilir.')
  return o
}

/** Rolün ana sayfası. */
// eslint-disable-next-line react-refresh/only-export-components
export const rolAnaSayfasi = (rol: Rol | undefined): string =>
  rol === 'superadmin' ? '/yonetim' : rol === 'kurum_yonetici' ? '/kurum' : rol === 'ogretmen' ? '/ogretmen' : rol === 'ogrenci' ? '/ogrenci' : '/'
