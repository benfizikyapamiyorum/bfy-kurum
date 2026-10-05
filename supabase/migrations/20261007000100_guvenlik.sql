-- =====================================================================
-- Güvenlik düzeltmeleri (M6 bağımsız güvenlik incelemesi).
--  1. Öğrenci test bitmeden cevabının doğru olup olmadığını göremez:
--     dogru_mu online cevapta testi bitirince hesaplanır; öğrenci cevap
--     satırlarını yalnızca sonucu oluştuktan sonra okur.
--  2. Şekillerin çözüm katmanları (data-ciz-adim >= 1) öğrenciye sunucuda
--     ayıklanarak gönderilir; tarayıcıya güvenilmez.
--  3. Kurum kodu ve sınıf kodu tek bir ad alanını paylaşır; bir kurum başka
--     kurumun koduyla sınıf açıp öğrencilerini kendine yönlendiremez.
--     Kurum kodunu yalnızca süper admin değiştirir.
--  4. Örnek sorular (ornek = true) öğrenciye doğrudan tablo okumasıyla
--     görünmez (cevap anahtarı sızmasın).
--  5. Öğretmen teste yalnızca kendisinin görebildiği (yayındaki) soruyu ekler.
--  6. katilim_kodu_uret giriş yapmamış ziyaretçiye kapalı.
--  7. Logo kovasına SVG yüklenmez (betik taşıyabilir).
--  8. Test süresi (sure_dk) sunucuda da uygulanır; cevap uzunluğu sınırlı.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Cevap anahtarı sızıntısı
-- ---------------------------------------------------------------------
alter policy cevap_okuma on public.cevap
  using (
    (ogrenci_id = (select auth.uid())
     and exists (select 1 from public.sonuc s
                 where s.atama_id = cevap.atama_id and s.ogrenci_id = (select auth.uid())))
    or (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
  );

-- Sonuç hesaplanmadan önce online cevaplar puanlanır (kayıt anında dogru_mu yazılmaz).
create or replace function ozel.sonuc_hesapla(p_atama uuid, p_ogrenci uuid, p_kaynak public.cevap_kaynagi)
returns public.sonuc
language plpgsql security definer set search_path = ''
as $$
declare
  v_dogru int;
  v_yanlis int;
  v_bos int;
  v_oran numeric;
  v_net numeric;
  r public.sonuc;
begin
  update public.cevap c
     set dogru_mu = ozel.dogru_mu(c.soru_id, c.verilen)
   where c.atama_id = p_atama and c.ogrenci_id = p_ogrenci;

  select
    count(*) filter (where c.dogru_mu is true),
    count(*) filter (where c.dogru_mu is false),
    count(*) filter (where c.id is null or c.verilen is null or btrim(c.verilen) = '')
  into v_dogru, v_yanlis, v_bos
  from public.atama a
  join public.test_soru ts on ts.test_id = a.test_id
  join public.soru s on s.id = ts.soru_id and s.tur <> 'acik_uclu'
  left join public.cevap c on c.atama_id = a.id and c.ogrenci_id = p_ogrenci and c.soru_id = ts.soru_id
  where a.id = p_atama;

  select t.yanlis_dogru_orani into v_oran
  from public.atama a join public.test t on t.id = a.test_id where a.id = p_atama;

  v_net := case when v_oran = 0 then v_dogru else v_dogru - v_yanlis / v_oran end;

  insert into public.sonuc (kurum_id, atama_id, ogrenci_id, dogru, yanlis, bos, net, kaynak, tamamlandi)
  values ((select kurum_id from public.atama where id = p_atama), p_atama, p_ogrenci,
          v_dogru, v_yanlis, v_bos, round(v_net, 2), p_kaynak, now())
  on conflict (atama_id, ogrenci_id) do update
    set dogru = excluded.dogru, yanlis = excluded.yanlis, bos = excluded.bos,
        net = excluded.net, kaynak = excluded.kaynak, tamamlandi = excluded.tamamlandi
  returning * into r;
  return r;
end $$;
revoke all on function ozel.sonuc_hesapla(uuid, uuid, public.cevap_kaynagi) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Öğrencinin teste başlama anı (sure_dk sunucuda da uygulanır).
-- Yalnızca SECURITY DEFINER fonksiyonlar yazar ve okur; tabloya doğrudan erişim yok.
-- ---------------------------------------------------------------------
create table public.cozum_baslangic (
  atama_id   uuid not null references public.atama (id) on delete cascade,
  ogrenci_id uuid not null references public.kullanici (id) on delete cascade,
  baslangic  timestamptz not null default now(),
  primary key (atama_id, ogrenci_id)
);
alter table public.cozum_baslangic enable row level security;
revoke all on public.cozum_baslangic from anon, authenticated;

create or replace function public.ogrenci_cevap_kaydet(p_atama uuid, p_soru uuid, p_verilen text, p_sure_sn int default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.atama;
  v_sure int;
  v_baslangic timestamptz;
begin
  a := ozel.cozulebilir_atama(p_atama);
  if exists (select 1 from public.sonuc where atama_id = p_atama and ogrenci_id = auth.uid()) then
    raise exception 'Bu testi bitirdiniz; cevaplar değiştirilemez.' using errcode = '42501';
  end if;
  if a.bitis is not null and now() > a.bitis + interval '10 minutes' then
    raise exception 'Testin süresi doldu.' using errcode = '42501';
  end if;
  if length(p_verilen) > 4000 then
    raise exception 'Cevap çok uzun.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.test_soru ts where ts.test_id = a.test_id and ts.soru_id = p_soru) then
    raise exception 'Bu soru bu testte yok.' using errcode = '22023';
  end if;

  -- Süre: ilk açılıştan (ya da ilk cevaptan) itibaren; ağ gecikmesi için 2 dakika pay.
  insert into public.cozum_baslangic (atama_id, ogrenci_id) values (p_atama, auth.uid())
  on conflict do nothing;
  select t.sure_dk into v_sure from public.test t where t.id = a.test_id;
  select b.baslangic into v_baslangic from public.cozum_baslangic b
   where b.atama_id = p_atama and b.ogrenci_id = auth.uid();
  if v_sure is not null and now() > v_baslangic + make_interval(mins => v_sure + 2) then
    raise exception 'Testin süresi doldu.' using errcode = '42501';
  end if;

  insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen, dogru_mu, sure_sn, kaynak)
  values (a.kurum_id, p_atama, auth.uid(), p_soru, nullif(upper(btrim(p_verilen)), ''),
          null, p_sure_sn, 'online')
  on conflict (atama_id, ogrenci_id, soru_id) do update
    set verilen = excluded.verilen, dogru_mu = null,
        sure_sn = coalesce(excluded.sure_sn, public.cevap.sure_sn), olusturma = now();
end $$;

-- ---------------------------------------------------------------------
-- 2. Çözüm katmanlarını sunucuda ayıklama
-- İstemcideki cozumKatmanlariniKaldir ile aynı kural: data-ciz-adim değeri 1 ve üstü olan
-- öğe (alt öğeleriyle) çıkarılır; data-ciz-tur hareket ya da kinematik olanlar kalır.
-- ---------------------------------------------------------------------
create or replace function ozel.cozum_katmanlarini_kaldir(p_svg text)
returns text
language plpgsql immutable set search_path = ''
as $$
declare
  cikti text := '';
  konum int := 1;
  bas int;
  etiket text;
  derinlik int := 0;   -- > 0 iken atlanan bir katmanın içindeyiz
  kapanis boolean;
  kendinden_kapali boolean;
  adim int;
  tur text;
begin
  if p_svg is null or p_svg !~ 'data-ciz-adim' then
    return p_svg;
  end if;
  loop
    bas := regexp_instr(p_svg, '<[^>]*>', konum);
    if bas = 0 then
      if derinlik = 0 then cikti := cikti || substr(p_svg, konum); end if;
      exit;
    end if;
    etiket := substring(p_svg from bas for regexp_instr(p_svg, '<[^>]*>', konum, 1, 1) - bas);
    if derinlik = 0 then cikti := cikti || substr(p_svg, konum, bas - konum); end if;
    konum := bas + length(etiket);

    kapanis := etiket ~ '^</';
    kendinden_kapali := etiket ~ '/\s*>$' or etiket ~ '^<[!?]';

    if derinlik > 0 then
      if kapanis then
        derinlik := derinlik - 1;
      elsif not kendinden_kapali then
        derinlik := derinlik + 1;
      end if;
      continue;
    end if;

    if not kapanis then
      adim := coalesce((regexp_match(etiket, 'data-ciz-adim\s*=\s*["'']?\s*(-?\d+)'))[1]::int, 0);
      tur := (regexp_match(etiket, 'data-ciz-tur\s*=\s*["'']?([a-z]+)'))[1];
      if adim >= 1 and coalesce(tur, '') not in ('hareket', 'kinematik') then
        if not kendinden_kapali then derinlik := 1; end if;
        continue;
      end if;
    end if;
    cikti := cikti || etiket;
  end loop;
  return cikti;
end $$;

-- Çözülecek sorular: cevap anahtarı, çözüm, şık gerekçeleri ve şeklin çözüm katmanları YOK.
-- Artık çağrı başlangıç anını da kaydeder (volatile).
create or replace function public.ogrenci_test_sorulari(p_atama uuid)
returns table (
  soru_id uuid, sira int, tur public.soru_turu, govde text, sekil_svg text, secenekler jsonb,
  verilen text
)
language plpgsql volatile security definer set search_path = ''
as $$
begin
  perform ozel.cozulebilir_atama(p_atama);
  if not exists (select 1 from public.sonuc where atama_id = p_atama and ogrenci_id = auth.uid()) then
    insert into public.cozum_baslangic (atama_id, ogrenci_id) values (p_atama, auth.uid())
    on conflict do nothing;
  end if;
  return query
    select s.id, ts.sira, s.tur, s.govde, ozel.cozum_katmanlarini_kaldir(s.sekil_svg),
           case when s.secenekler is null then null else
             (select jsonb_agg(jsonb_build_object('harf', e->>'harf', 'metin', e->>'metin') order by o)
              from jsonb_array_elements(s.secenekler) with ordinality as x(e, o))
           end,
           c.verilen
    from public.atama a
    join public.test_soru ts on ts.test_id = a.test_id
    join public.soru s on s.id = ts.soru_id
    left join public.cevap c on c.atama_id = a.id and c.soru_id = s.id and c.ogrenci_id = auth.uid()
    where a.id = p_atama
    order by ts.sira;
end $$;

create or replace function public.ogrenci_sonuc_ayrintisi(p_atama uuid)
returns table (
  soru_id uuid, sira int, tur public.soru_turu, govde text, sekil_svg text, secenekler jsonb,
  verilen text, dogru_mu boolean, dogru_cevap text, cozum_adimlari jsonb
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  a public.atama;
begin
  select * into a from public.atama where id = p_atama;
  if a.id is null or a.sinif_grubu_id not in (select ozel.ogrencinin_gruplari())
     or not exists (select 1 from public.sonuc where atama_id = p_atama and ogrenci_id = auth.uid()) then
    raise exception 'Önce testi bitirmelisiniz.' using errcode = '42501';
  end if;
  return query
    select s.id, ts.sira, s.tur, s.govde,
           case when a.cozumler_acik then s.sekil_svg else ozel.cozum_katmanlarini_kaldir(s.sekil_svg) end,
           case when a.cozumler_acik then s.secenekler else
             (select jsonb_agg(jsonb_build_object('harf', e->>'harf', 'metin', e->>'metin') order by o)
              from jsonb_array_elements(s.secenekler) with ordinality as x(e, o))
           end,
           c.verilen, c.dogru_mu,
           case when a.cozumler_acik then s.dogru_cevap end,
           case when a.cozumler_acik then s.cozum_adimlari end
    from public.test_soru ts
    join public.soru s on s.id = ts.soru_id
    left join public.cevap c on c.atama_id = a.id and c.soru_id = s.id and c.ogrenci_id = auth.uid()
    where ts.test_id = a.test_id
    order by ts.sira;
end $$;

-- ---------------------------------------------------------------------
-- 3. Kurum kodu ve sınıf kodu: ortak ad alanı
-- ---------------------------------------------------------------------
create or replace function ozel.kod_cakismasi()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_kod text;
begin
  -- Alanlar tabloya göre ayrı ayrı okunur (kayıtta olmayan alana dokunulmaz).
  if tg_table_name = 'kurum' then
    v_kod := new.kod;
  else
    v_kod := new.katilim_kodu;
  end if;
  if v_kod is null then
    return new;
  end if;
  -- Aynı kod için eşzamanlı iki kaydı sıraya sokar.
  perform pg_advisory_xact_lock(hashtext('giris-kodu:' || v_kod));
  if tg_table_name = 'kurum' then
    if exists (select 1 from public.sinif_grubu g where g.katilim_kodu = v_kod) then
      raise exception 'Bu kod bir sınıf kodu olarak kullanılıyor.' using errcode = '23505';
    end if;
  elsif exists (select 1 from public.kurum k where k.kod = v_kod) then
    raise exception 'Bu kod bir kurum kodu olarak kullanılıyor.' using errcode = '23505';
  end if;
  return new;
end $$;

create trigger kurum_kod_cakismasi before insert or update of kod on public.kurum
  for each row execute function ozel.kod_cakismasi();
create trigger sinif_kod_cakismasi before insert or update of katilim_kodu on public.sinif_grubu
  for each row execute function ozel.kod_cakismasi();

-- Kurum kodu öncelikli: eski bir çakışma kalmışsa bile kurum kodu kazanır.
-- Kodlar ASCII'dir: Türkçe klavyeden gelen i, ı, İ harfleri I sayılır.
create or replace function public.giris_kurumu_bul(p_kod text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  with girilen as (select upper(translate(btrim(p_kod), 'iıİ', 'III')) as kod)
  select id from (
    select k.id, 0 as oncelik
    from public.kurum k
    where k.aktif and k.kod = (select kod from girilen)
    union all
    select g.kurum_id, 1
    from public.sinif_grubu g
    join public.kurum k on k.id = g.kurum_id and k.aktif
    where g.katilim_kodu = (select kod from girilen) and not g.arsiv
  ) x
  order by oncelik
  limit 1
$$;

create or replace function ozel.kurum_koruma()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if ozel.sistem_mi() or ozel.superadmin_mi() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.kod is distinct from old.kod
     or new.lisans_baslangic is distinct from old.lisans_baslangic
     or new.lisans_bitis is distinct from old.lisans_bitis
     or new.ogretmen_limiti is distinct from old.ogretmen_limiti
     or new.ogrenci_limiti is distinct from old.ogrenci_limiti
     or new.aktif is distinct from old.aktif
     or new.demo is distinct from old.demo then
    raise exception 'Kurum kodu, lisans ve kontenjan bilgilerini yalnızca süper admin değiştirebilir.'
      using errcode = '42501';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 4. Örnek sorular öğrenciye doğrudan görünmez.
-- ---------------------------------------------------------------------
alter policy soru_okuma on public.soru
  using (
    (ornek and yayinda and (select ozel.benim_rolum()) is distinct from 'ogrenci')
    or (select ozel.superadmin_mi())
    or (yayinda and (select ozel.icerik_erisimi_var_mi()))
  );

-- ---------------------------------------------------------------------
-- 5. Teste yalnızca görülebilen soru eklenir (alt sorgu çağıranın RLS'iyle çalışır).
-- ---------------------------------------------------------------------
alter policy test_soru_yazma on public.test_soru
  with check (
    exists (select 1 from public.test t
            where t.id = test_id
              and ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(t.kurum_id))))
    and exists (select 1 from public.soru s where s.id = soru_id)
  );

-- ---------------------------------------------------------------------
-- 6. Ziyaretçiye kapalı fonksiyon
-- ---------------------------------------------------------------------
revoke execute on function public.katilim_kodu_uret() from anon;
-- RLS zaten engelliyor, ama ziyaretçinin çağırması için bir neden yok.
revoke execute on function public.test_sorulari_kaydet(uuid, uuid[]) from public, anon;

-- ---------------------------------------------------------------------
-- 7. Logo kovası: SVG yok.
-- ---------------------------------------------------------------------
update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
 where id = 'logolar';
