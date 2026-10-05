-- =====================================================================
-- 0007 (M2): Giriş ve kurum yönetimi.
--  - kurum.kod: öğrencinin giriş ekranında yazdığı kısa kurum kodu (ör. ATLAS).
--  - giris_kurumu_bul: kurum kodu ya da sınıf koduyla kurumu bulur (giriş yapmadan çağrılır).
--  - Öğrencinin Supabase Auth e-postası görünmeyen bir iç adrestir; gerçek e-posta alınmaz.
-- =====================================================================

alter table public.kurum
  add column kod text unique check (kod ~ '^[A-Z0-9]{3,12}$');

comment on column public.kurum.kod is
  'Öğrenci girişinde kullanılan kısa kurum kodu. Büyük harf ve rakam, 3-12 karakter.';

-- Öğrencinin iç e-posta adresi: <kullanıcı adı>@<kurum kimliği>.ogrenci.invalid
-- (.invalid alan adı RFC 2606 gereği hiçbir zaman gerçek bir adrese gitmez.)
create or replace function public.ogrenci_eposta(p_kullanici_adi text, p_kurum uuid)
returns text
language sql immutable set search_path = ''
as $$
  select lower(p_kullanici_adi) || '@' || p_kurum::text || '.ogrenci.invalid'
$$;

-- Giriş ekranı için: kurum kodu ya da sınıf koduyla aktif kurumun kimliğini döndürür.
-- Yalnızca kimlik döner; kurum adı, kullanıcı listesi gibi bilgi vermez.
create or replace function public.giris_kurumu_bul(p_kod text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select k.id
  from public.kurum k
  where k.aktif
    and (
      k.kod = upper(trim(p_kod))
      or k.id = (select g.kurum_id from public.sinif_grubu g
                 where g.katilim_kodu = upper(trim(p_kod)) and not g.arsiv)
    )
  limit 1
$$;

revoke all on function public.giris_kurumu_bul(text) from public;
grant execute on function public.giris_kurumu_bul(text) to anon, authenticated;
grant execute on function public.ogrenci_eposta(text, uuid) to anon, authenticated, service_role;

-- Kurum yöneticisi sınıf kodu üretirken çakışmayı önceden görebilsin.
create or replace function public.katilim_kodu_uret()
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  -- Karışmasın diye 0/O, 1/I harfleri yok.
  harfler constant text := 'ABCDEFGHJKLMNPRSTUVYZ23456789';
  v_kod text;
begin
  loop
    v_kod := '';
    for i in 1..6 loop
      v_kod := v_kod || substr(harfler, 1 + floor(random() * length(harfler))::int, 1);
    end loop;
    exit when not exists (select 1 from public.sinif_grubu g where g.katilim_kodu = v_kod)
          and not exists (select 1 from public.kurum k where k.kod = v_kod);
  end loop;
  return v_kod;
end $$;

revoke all on function public.katilim_kodu_uret() from public;
grant execute on function public.katilim_kodu_uret() to authenticated;
