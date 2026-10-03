-- =====================================================================
-- 0002: Yardımcı fonksiyonlar ve bütünlük tetikleyicileri.
-- "ozel" şeması API'ye (PostgREST) açılmaz. Buradaki fonksiyonlar RLS politikalarında
-- kullanılır ve SECURITY DEFINER olduğu için kullanici tablosundaki RLS'ye takılmaz
-- (politika içinde aynı tabloyu sorgulamanın yol açacağı sonsuz döngüyü önler).
-- =====================================================================

create schema if not exists ozel;
grant usage on schema ozel to anon, authenticated, service_role;

-- Oturumdaki kullanıcının aktif kaydı. Pasif kullanıcı hiçbir role sahip sayılmaz.
create or replace function ozel.benim_rolum()
returns public.rol
language sql stable security definer set search_path = ''
as $$
  select k.rol from public.kullanici k where k.id = auth.uid() and k.aktif
$$;

create or replace function ozel.benim_kurumum()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select k.kurum_id from public.kullanici k where k.id = auth.uid() and k.aktif
$$;

create or replace function ozel.superadmin_mi()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(ozel.benim_rolum() = 'superadmin', false)
$$;

-- API rolleri (anon, authenticated) dışında çalışan her şey sistemdir:
-- migration, SQL düzenleyici, service_role ile çalışan Edge Function.
create or replace function ozel.sistem_mi()
returns boolean
language sql stable set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated')
$$;

create or replace function ozel.kurum_lisansi_aktif(p_kurum uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select k.aktif and current_date between k.lisans_baslangic and k.lisans_bitis
    from public.kurum k where k.id = p_kurum
  ), false)
$$;

-- Kurumun öğretmeni veya yöneticisi mi (lisans durumuna bakmaz; okuma için).
create or replace function ozel.kurum_personeli_mi(p_kurum uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    ozel.benim_rolum() in ('ogretmen', 'kurum_yonetici') and ozel.benim_kurumum() = p_kurum,
    false)
$$;

create or replace function ozel.kurum_yoneticisi_mi(p_kurum uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(ozel.benim_rolum() = 'kurum_yonetici' and ozel.benim_kurumum() = p_kurum, false)
$$;

-- Lisansı geçerli bir kurumun öğretmeni veya yöneticisi mi (yazma ve içerik erişimi için).
create or replace function ozel.lisansli_personel_mi(p_kurum uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select ozel.kurum_personeli_mi(p_kurum) and ozel.kurum_lisansi_aktif(p_kurum)
$$;

-- Lisansı geçerli herhangi bir kurumda öğretmen veya yönetici mi (genel soru bankası için).
create or replace function ozel.icerik_erisimi_var_mi()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select ozel.superadmin_mi()
      or (ozel.benim_rolum() in ('ogretmen', 'kurum_yonetici')
          and ozel.kurum_lisansi_aktif(ozel.benim_kurumum()))
$$;

-- Öğrencinin üyesi olduğu sınıf grupları.
create or replace function ozel.ogrencinin_gruplari()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select sgo.sinif_grubu_id
  from public.sinif_grubu_ogrenci sgo
  join public.kullanici k on k.id = sgo.ogrenci_id
  where sgo.ogrenci_id = auth.uid() and k.aktif and k.rol = 'ogrenci'
$$;

revoke all on all functions in schema ozel from public;
grant execute on all functions in schema ozel to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Güncelleme zamanı
-- ---------------------------------------------------------------------
create or replace function ozel.guncelleme_zamani()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.guncelleme := now();
  return new;
end $$;

create trigger kurum_guncelleme before update on public.kurum
  for each row execute function ozel.guncelleme_zamani();
create trigger kullanici_guncelleme before update on public.kullanici
  for each row execute function ozel.guncelleme_zamani();
create trigger icerik_guncelleme before update on public.icerik
  for each row execute function ozel.guncelleme_zamani();
create trigger soru_guncelleme before update on public.soru
  for each row execute function ozel.guncelleme_zamani();
create trigger test_guncelleme before update on public.test
  for each row execute function ozel.guncelleme_zamani();

-- ---------------------------------------------------------------------
-- Kurum: lisans ve kontenjan alanlarını yalnızca süper admin değiştirir.
-- Kurum yöneticisi RLS ile kendi kurumunu güncelleyebilir ama yalnızca ad ve logo.
-- ---------------------------------------------------------------------
create or replace function ozel.kurum_koruma()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if ozel.sistem_mi() or ozel.superadmin_mi() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.lisans_baslangic is distinct from old.lisans_baslangic
     or new.lisans_bitis is distinct from old.lisans_bitis
     or new.ogretmen_limiti is distinct from old.ogretmen_limiti
     or new.ogrenci_limiti is distinct from old.ogrenci_limiti
     or new.aktif is distinct from old.aktif
     or new.demo is distinct from old.demo then
    raise exception 'Lisans ve kontenjan bilgilerini yalnızca süper admin değiştirebilir.'
      using errcode = '42501';
  end if;
  return new;
end $$;

create trigger kurum_koruma before update on public.kurum
  for each row execute function ozel.kurum_koruma();

-- ---------------------------------------------------------------------
-- Kullanıcı: rol yükseltmeyi ve kurumlar arası taşımayı engeller.
-- ---------------------------------------------------------------------
create or replace function ozel.kullanici_koruma()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if ozel.sistem_mi() or ozel.superadmin_mi() then
    return new;
  end if;
  -- Buraya yalnızca kurum yöneticisi ulaşabilir (RLS diğerlerini zaten durdurur).
  if tg_op = 'UPDATE' and old.id = auth.uid() then
    raise exception 'Kendi rolünüzü ve kaydınızı buradan değiştiremezsiniz.'
      using errcode = '42501';
  end if;
  if new.rol not in ('ogretmen', 'ogrenci') then
    raise exception 'Kurum yöneticisi yalnızca öğretmen ve öğrenci ekleyebilir.'
      using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if old.rol not in ('ogretmen', 'ogrenci') or new.id <> old.id or new.kurum_id <> old.kurum_id then
      raise exception 'Bu kullanıcıda bu değişiklik yapılamaz.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger kullanici_koruma before insert or update on public.kullanici
  for each row execute function ozel.kullanici_koruma();

-- ---------------------------------------------------------------------
-- Kontenjan: aktif öğretmen ve öğrenci sayısı kurumun limitini aşamaz.
-- ---------------------------------------------------------------------
create or replace function ozel.kontenjan_kontrol()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_limit integer;
  v_sayi  integer;
begin
  if not new.aktif or new.rol not in ('ogretmen', 'ogrenci') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.aktif and old.rol = new.rol and old.kurum_id = new.kurum_id then
    return new;
  end if;

  -- Aynı kuruma eşzamanlı eklemelerde sayımın doğru kalması için kurum satırını kilitle.
  select case when new.rol = 'ogretmen' then k.ogretmen_limiti else k.ogrenci_limiti end
    into v_limit
    from public.kurum k where k.id = new.kurum_id
    for update;

  select count(*) into v_sayi
    from public.kullanici u
    where u.kurum_id = new.kurum_id and u.rol = new.rol and u.aktif and u.id <> new.id;

  if v_sayi >= v_limit then
    raise exception 'Kurumun % kontenjanı dolu (% kişi).',
      case when new.rol = 'ogretmen' then 'öğretmen' else 'öğrenci' end, v_limit
      using errcode = '23514';
  end if;
  return new;
end $$;

create trigger kullanici_kontenjan before insert or update on public.kullanici
  for each row execute function ozel.kontenjan_kontrol();

-- ---------------------------------------------------------------------
-- Kurumlar arası tutarlılık: bir kurumun kaydı başka kurumun kaydına bağlanamaz.
-- ---------------------------------------------------------------------
create or replace function ozel.sinif_ogrenci_tutarlilik()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.sinif_grubu g
    join public.kullanici u on u.kurum_id = g.kurum_id
    where g.id = new.sinif_grubu_id and u.id = new.ogrenci_id and u.rol = 'ogrenci'
  ) then
    raise exception 'Öğrenci ve sınıf aynı kuruma ait olmalı.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger sinif_grubu_ogrenci_tutarlilik before insert or update on public.sinif_grubu_ogrenci
  for each row execute function ozel.sinif_ogrenci_tutarlilik();

create or replace function ozel.atama_tutarlilik()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.test t where t.id = new.test_id and t.kurum_id = new.kurum_id)
     or not exists (select 1 from public.sinif_grubu g where g.id = new.sinif_grubu_id and g.kurum_id = new.kurum_id) then
    raise exception 'Test, sınıf ve atama aynı kuruma ait olmalı.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger atama_tutarlilik before insert or update on public.atama
  for each row execute function ozel.atama_tutarlilik();

-- cevap ve sonuc: kurum_id atamadan alınır, öğrenci o atamanın sınıfında olmalı.
create or replace function ozel.sonuc_tutarlilik()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_kurum uuid;
begin
  select a.kurum_id into v_kurum
  from public.atama a
  join public.sinif_grubu_ogrenci sgo on sgo.sinif_grubu_id = a.sinif_grubu_id
  where a.id = new.atama_id and sgo.ogrenci_id = new.ogrenci_id;

  if v_kurum is null then
    raise exception 'Öğrenci bu atamanın sınıfında değil.' using errcode = '23514';
  end if;
  new.kurum_id := v_kurum;
  return new;
end $$;

create trigger cevap_tutarlilik before insert or update on public.cevap
  for each row execute function ozel.sonuc_tutarlilik();
create trigger sonuc_tutarlilik before insert or update on public.sonuc
  for each row execute function ozel.sonuc_tutarlilik();

-- cevap: soru, atamadaki testin sorusu olmalı.
create or replace function ozel.cevap_soru_tutarlilik()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.atama a
    join public.test_soru ts on ts.test_id = a.test_id
    where a.id = new.atama_id and ts.soru_id = new.soru_id
  ) then
    raise exception 'Soru bu atamadaki teste ait değil.' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger cevap_soru_tutarlilik before insert or update on public.cevap
  for each row execute function ozel.cevap_soru_tutarlilik();
