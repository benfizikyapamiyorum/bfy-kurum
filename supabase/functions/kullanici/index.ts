// Kullanıcı hesabı işlemleri (Supabase Edge Function, Deno).
// Hesap açmak service_role yetkisi ister; bu yetki yalnızca burada, sunucuda kullanılır.
//
// İstek gövdesi:
//   { islem: 'olustur', kurum_id, kullanicilar: [{ rol, ad_soyad, kullanici_adi?, eposta?, sifre? }] }
//   { islem: 'sifre_sifirla', kullanici_id, sifre? }
//   { islem: 'durum', kullanici_id, aktif }
//   { islem: 'sil', kullanici_id }
//
// Yetki:
//   superadmin       : her kurumda her rol (kurum_yonetici dahil).
//   kurum_yonetici   : yalnızca kendi kurumunda, lisansı geçerliyse, ogretmen ve ogrenci.
// Kontenjan ve kurum tutarlılığı ayrıca veritabanı tetikleyicileriyle zorlanır.

// Dış paket kullanılmaz: Supabase Auth ve REST uç noktaları doğrudan çağrılır.
// Böylece işlev her ortamda ek indirme olmadan açılır.

const URL = Deno.env.get('SUPABASE_URL')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVIS = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** service_role ile çalışan küçük yönetici istemcisi (Auth admin + PostgREST). */
class Yonetici {
  private baslik = { apikey: SERVIS, Authorization: `Bearer ${SERVIS}`, 'Content-Type': 'application/json' }

  private async istek(yol: string, init: RequestInit = {}) {
    const r = await fetch(`${URL}${yol}`, { ...init, headers: { ...this.baslik, ...(init.headers ?? {}) } })
    const metin = await r.text()
    const veri = metin ? JSON.parse(metin) : null
    if (!r.ok) throw new Error(veri?.msg ?? veri?.message ?? veri?.error_description ?? `HTTP ${r.status}`)
    return veri
  }

  /** Tek satır ya da null. */
  async satir<T>(tablo: string, sorgu: string): Promise<T | null> {
    const veri = (await this.istek(`/rest/v1/${tablo}?${sorgu}&limit=1`)) as T[]
    return veri[0] ?? null
  }

  ekle(tablo: string, govde: unknown) {
    return this.istek(`/rest/v1/${tablo}`, { method: 'POST', body: JSON.stringify(govde), headers: { Prefer: 'return=minimal' } })
  }

  guncelle(tablo: string, sorgu: string, govde: unknown) {
    return this.istek(`/rest/v1/${tablo}?${sorgu}`, {
      method: 'PATCH',
      body: JSON.stringify(govde),
      headers: { Prefer: 'return=minimal' },
    })
  }

  kullaniciAc(eposta: string, sifre: string, ad: string): Promise<{ id: string }> {
    return this.istek('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: eposta, password: sifre, email_confirm: true, user_metadata: { ad_soyad: ad } }),
    })
  }

  kullaniciGuncelle(id: string, govde: Record<string, unknown>) {
    return this.istek(`/auth/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(govde) })
  }

  kullaniciSil(id: string) {
    return this.istek(`/auth/v1/admin/users/${id}`, { method: 'DELETE' })
  }

  /** İsteği yapanın JWT'sinden kullanıcıyı bulur. */
  async oturumdakiKullanici(yetki: string): Promise<{ id: string } | null> {
    const r = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: yetki } })
    if (!r.ok) return null
    return r.json()
  }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Rol = 'superadmin' | 'kurum_yonetici' | 'ogretmen' | 'ogrenci'

interface YeniKullanici {
  rol: Rol
  ad_soyad: string
  kullanici_adi?: string | null
  eposta?: string | null
  sifre?: string | null
}

class IstekHatasi extends Error {
  constructor(
    mesaj: string,
    public durum = 400,
  ) {
    super(mesaj)
  }
}

const yanit = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), { status: durum, headers: { ...CORS, 'Content-Type': 'application/json' } })

const KULLANICI_ADI = /^[a-z0-9._-]{3,40}$/
const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Okunaklı geçici şifre: karışan harf ve rakamlar (0/o, 1/l/i) yok. */
function sifreUret(): string {
  const harf = 'abcdefghjkmnprstuvyz'
  const rakam = '23456789'
  const r = crypto.getRandomValues(new Uint32Array(7))
  let s = ''
  for (let i = 0; i < 4; i++) s += harf[r[i]! % harf.length]
  for (let i = 4; i < 7; i++) s += rakam[r[i]! % rakam.length]
  return s
}

const ogrenciEposta = (kullaniciAdi: string, kurumId: string) =>
  `${kullaniciAdi.toLowerCase()}@${kurumId}.ogrenci.invalid`

interface Cagiran {
  id: string
  rol: Rol
  kurum_id: string | null
}

async function cagiraniBul(req: Request, admin: Yonetici): Promise<Cagiran> {
  const yetki = req.headers.get('Authorization')
  if (!yetki) throw new IstekHatasi('Oturum açmanız gerekiyor.', 401)
  const kullanici = await admin.oturumdakiKullanici(yetki)
  if (!kullanici) throw new IstekHatasi('Oturum geçersiz. Yeniden giriş yapın.', 401)
  const profil = await admin.satir<Cagiran & { aktif: boolean }>(
    'kullanici',
    `select=id,rol,kurum_id,aktif&id=eq.${kullanici.id}`,
  )
  if (!profil || !profil.aktif) throw new IstekHatasi('Bu işlem için yetkiniz yok.', 403)
  return profil
}

async function kurumYetkisi(admin: Yonetici, cagiran: Cagiran, kurumId: string, roller: Rol[]) {
  if (cagiran.rol === 'superadmin') return
  if (cagiran.rol !== 'kurum_yonetici' || cagiran.kurum_id !== kurumId) {
    throw new IstekHatasi('Bu kurumda işlem yapma yetkiniz yok.', 403)
  }
  if (roller.some((r) => r !== 'ogretmen' && r !== 'ogrenci')) {
    throw new IstekHatasi('Kurum yöneticisi yalnızca öğretmen ve öğrenci hesabı açabilir.', 403)
  }
  const kurum = await admin.satir<{ aktif: boolean; lisans_baslangic: string; lisans_bitis: string }>(
    'kurum',
    `select=aktif,lisans_baslangic,lisans_bitis&id=eq.${encodeURIComponent(kurumId)}`,
  )
  const bugun = new Date().toISOString().slice(0, 10)
  if (!kurum?.aktif || bugun < kurum.lisans_baslangic || bugun > kurum.lisans_bitis) {
    throw new IstekHatasi('Kurumun lisansı geçerli değil. Lisans yenilenince işlem yapılabilir.', 403)
  }
}

const UUID = /^[0-9a-f-]{36}$/i

async function hedefKullanici(admin: Yonetici, cagiran: Cagiran, kullaniciId: string) {
  if (!UUID.test(String(kullaniciId))) throw new IstekHatasi('Geçersiz kullanıcı.')
  const hedef = await admin.satir<{ id: string; rol: Rol; kurum_id: string }>(
    'kullanici',
    `select=id,rol,kurum_id&id=eq.${kullaniciId}`,
  )
  if (!hedef) throw new IstekHatasi('Kullanıcı bulunamadı.', 404)
  if (hedef.id === cagiran.id) throw new IstekHatasi('Kendi hesabınızda bu işlem yapılamaz.', 403)
  if (cagiran.rol !== 'superadmin') {
    if (hedef.rol === 'superadmin' || hedef.rol === 'kurum_yonetici') {
      throw new IstekHatasi('Bu kullanıcıda işlem yapma yetkiniz yok.', 403)
    }
    await kurumYetkisi(admin, cagiran, hedef.kurum_id, [hedef.rol])
  }
  return hedef
}

/** Veritabanı hata mesajlarını kullanıcıya anlaşılır Türkçeye çevirir. */
function hataMesaji(e: unknown): string {
  const m = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)
  if (/kontenjan/i.test(m)) return m
  if (/kullanici_kurum_kullanici_adi_tekil|already been registered|already registered|duplicate/i.test(m)) {
    return 'Bu kullanıcı adı ya da e-posta zaten kullanılıyor.'
  }
  if (/password/i.test(m)) return 'Şifre en az 6 karakter olmalı.'
  return m
}

async function olustur(admin: Yonetici, cagiran: Cagiran, govde: { kurum_id?: string; kullanicilar?: YeniKullanici[] }) {
  const liste = govde.kullanicilar ?? []
  if (!Array.isArray(liste) || liste.length === 0) throw new IstekHatasi('Eklenecek kullanıcı yok.')
  if (liste.length > 500) throw new IstekHatasi('Tek seferde en çok 500 kullanıcı eklenebilir.')

  const kurumId = govde.kurum_id ?? null
  const kurumsuz = liste.every((k) => k.rol === 'superadmin')
  if (kurumsuz) {
    if (cagiran.rol !== 'superadmin') throw new IstekHatasi('Bu işlem için yetkiniz yok.', 403)
  } else {
    if (!kurumId || !UUID.test(kurumId)) throw new IstekHatasi('Kurum belirtilmedi.')
    await kurumYetkisi(
      admin,
      cagiran,
      kurumId,
      liste.map((k) => k.rol),
    )
  }

  const sonuclar = []
  for (const k of liste) {
    const ad = (k.ad_soyad ?? '').trim().replace(/\s+/g, ' ')
    const kullaniciAdi = k.kullanici_adi?.trim().toLowerCase() || null
    const sifre = k.sifre?.trim() || sifreUret()
    let eposta = k.eposta?.trim().toLowerCase() || null
    try {
      if (ad.length < 2) throw new Error('Ad soyad en az 2 karakter olmalı.')
      if (k.rol === 'ogrenci') {
        if (!kullaniciAdi || !KULLANICI_ADI.test(kullaniciAdi)) {
          throw new Error('Kullanıcı adı 3-40 karakter olmalı; yalnızca küçük harf, rakam, nokta, tire içerebilir.')
        }
        eposta = ogrenciEposta(kullaniciAdi, kurumId!)
      } else if (!eposta || !EPOSTA.test(eposta)) {
        throw new Error('Geçerli bir e-posta adresi gerekli.')
      }
      if (sifre.length < 6) throw new Error('Şifre en az 6 karakter olmalı.')

      const yeni = await admin.kullaniciAc(eposta, sifre, ad)
      try {
        await admin.ekle('kullanici', {
          id: yeni.id,
          kurum_id: k.rol === 'superadmin' ? null : kurumId,
          rol: k.rol,
          ad_soyad: ad,
          kullanici_adi: kullaniciAdi,
          eposta: k.rol === 'ogrenci' ? null : eposta,
        })
      } catch (profilHatasi) {
        // Profil açılamadıysa (ör. kontenjan dolu) yarım kalan hesabı geri al.
        await admin.kullaniciSil(yeni.id)
        throw profilHatasi
      }
      sonuclar.push({ tamam: true, id: yeni.id, ad_soyad: ad, rol: k.rol, kullanici_adi: kullaniciAdi, eposta: k.rol === 'ogrenci' ? null : eposta, sifre })
    } catch (e) {
      sonuclar.push({ tamam: false, ad_soyad: ad, rol: k.rol, kullanici_adi: kullaniciAdi, eposta: k.rol === 'ogrenci' ? null : eposta, hata: hataMesaji(e) })
    }
  }
  return { sonuclar }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return yanit({ hata: 'Yalnızca POST.' }, 405)
  const admin = new Yonetici()
  try {
    const cagiran = await cagiraniBul(req, admin)
    const govde = await req.json()
    switch (govde?.islem) {
      case 'olustur':
        return yanit(await olustur(admin, cagiran, govde))
      case 'sifre_sifirla': {
        await hedefKullanici(admin, cagiran, govde.kullanici_id)
        const sifre = (govde.sifre as string | undefined)?.trim() || sifreUret()
        if (sifre.length < 6) throw new IstekHatasi('Şifre en az 6 karakter olmalı.')
        await admin.kullaniciGuncelle(govde.kullanici_id, { password: sifre }).catch((e) => {
          throw new IstekHatasi(hataMesaji(e))
        })
        return yanit({ sifre })
      }
      case 'durum': {
        await hedefKullanici(admin, cagiran, govde.kullanici_id)
        await admin.guncelle('kullanici', `id=eq.${govde.kullanici_id}`, { aktif: !!govde.aktif }).catch((e) => {
          throw new IstekHatasi(hataMesaji(e))
        })
        // Pasif kullanıcının açık oturumları da kapansın.
        await admin.kullaniciGuncelle(govde.kullanici_id, { ban_duration: govde.aktif ? 'none' : '876000h' })
        return yanit({ tamam: true })
      }
      case 'sil': {
        await hedefKullanici(admin, cagiran, govde.kullanici_id)
        await admin.kullaniciSil(govde.kullanici_id).catch((e) => {
          throw new IstekHatasi(hataMesaji(e))
        })
        return yanit({ tamam: true })
      }
      default:
        throw new IstekHatasi('Bilinmeyen işlem.')
    }
  } catch (e) {
    if (e instanceof IstekHatasi) return yanit({ hata: e.message }, e.durum)
    console.error(e)
    return yanit({ hata: 'Beklenmeyen bir sorun oluştu.' }, 500)
  }
})
