-- =====================================================================
-- 0008 (M3): Test oluşturma, online çözüm, elle sonuç girişi, net hesabı.
--
-- Öğrenci soru ve test_soru tablolarını okuyamaz (cevap anahtarı sızmasın). Online çözüm
-- aşağıdaki SECURITY DEFINER fonksiyonlarla yürür: soruları cevapsız verir, cevabı sunucuda
-- puanlar, testi bitirince net hesaplar. Öğretmenin elle girişi de aynı puanlamayı kullanır.
-- =====================================================================

-- Soru: Fizik Atölye pilotundan gelen alanlar.
alter table public.soru
  add column beceri text,              -- ör. "Veriden çıkarım"
  add column kavram_yanilgisi text,    -- sorunun yokladığı yaygın yanılgı (öğretmene görünür)
  add column puanlama_olcutu text;     -- açık uçlu ya da gerekçeli cevap için ölçüt
comment on column public.soru.secenekler is
  'Çoktan seçmelide tam 5 şık: [{"harf":"A","metin":"...","gerekce":"Neden bu şık yanlış (isteğe bağlı)"}]';

-- Test ayarları: sayfa düzeni, işlem alanı, filigran.
alter table public.test
  add column aciklama text,
  add column ayarlar jsonb not null default '{}'::jsonb;

-- Atama: çözümler öğrenciye ne zaman açılır.
alter table public.atama
  add column cozumler_acik boolean not null default false;

-- Bir testin sorularını tek işlemde kaydeder (sıra = dizideki konum). RLS geçerlidir.
create or replace function public.test_sorulari_kaydet(p_test uuid, p_sorular uuid[])
returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  if (select count(*) from unnest(p_sorular)) <> (select count(distinct x) from unnest(p_sorular) x) then
    raise exception 'Aynı soru bir testte iki kez kullanılamaz.' using errcode = '23505';
  end if;
  delete from public.test_soru where test_id = p_test;
  insert into public.test_soru (test_id, soru_id, sira)
    select p_test, s, i from unnest(p_sorular) with ordinality as t(s, i);
end $$;
grant execute on function public.test_sorulari_kaydet(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------
-- Yardımcı: öğrenci bu atamayı şu an çözebilir mi?
-- ---------------------------------------------------------------------
create or replace function ozel.cozulebilir_atama(p_atama uuid)
returns public.atama
language plpgsql stable security definer set search_path = ''
as $$
declare
  a public.atama;
begin
  select * into a from public.atama where id = p_atama;
  if a.id is null or a.sinif_grubu_id not in (select ozel.ogrencinin_gruplari()) then
    raise exception 'Bu test size atanmamış.' using errcode = '42501';
  end if;
  if not ozel.kurum_lisansi_aktif(a.kurum_id) then
    raise exception 'Kurumun lisansı geçerli değil.' using errcode = '42501';
  end if;
  if now() < a.baslangic then
    raise exception 'Bu test henüz başlamadı.' using errcode = '42501';
  end if;
  return a;
end $$;

-- Puanlama: cevabı anahtarla karşılaştırır. Açık uçluda null (öğretmen değerlendirir).
create or replace function ozel.dogru_mu(p_soru uuid, p_verilen text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when p_verilen is null or btrim(p_verilen) = '' then null
    when s.tur = 'acik_uclu' then null
    else upper(btrim(p_verilen)) = s.dogru_cevap
  end
  from public.soru s where s.id = p_soru
$$;

-- Atama + öğrenci için sonucu yeniden hesaplar ve sonuc tablosuna yazar.
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

-- ---------------------------------------------------------------------
-- Öğrenci RPC'leri
-- ---------------------------------------------------------------------

-- Öğrencinin atamaları.
create or replace function public.ogrenci_atamalari()
returns table (
  atama_id uuid, test_id uuid, baslik text, tur public.test_turu, sure_dk int,
  baslangic timestamptz, bitis timestamptz, soru_sayisi int, cozumler_acik boolean,
  tamamlandi timestamptz, dogru int, yanlis int, bos int, net numeric
)
language sql stable security definer set search_path = ''
as $$
  select a.id, t.id, t.baslik, t.tur, t.sure_dk, a.baslangic, a.bitis,
         (select count(*)::int from public.test_soru ts where ts.test_id = t.id),
         a.cozumler_acik, s.tamamlandi, s.dogru, s.yanlis, s.bos, s.net
  from public.atama a
  join public.test t on t.id = a.test_id
  left join public.sonuc s on s.atama_id = a.id and s.ogrenci_id = auth.uid()
  where a.sinif_grubu_id in (select ozel.ogrencinin_gruplari())
    and a.baslangic <= now() + interval '7 days'
  order by a.baslangic desc
$$;

-- Çözülecek sorular: cevap anahtarı, çözüm ve şık gerekçeleri YOK.
create or replace function public.ogrenci_test_sorulari(p_atama uuid)
returns table (
  soru_id uuid, sira int, tur public.soru_turu, govde text, sekil_svg text, secenekler jsonb,
  verilen text
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform ozel.cozulebilir_atama(p_atama);
  return query
    select s.id, ts.sira, s.tur, s.govde, s.sekil_svg,
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

-- Tek cevabı kaydeder (aynı soruya tekrar cevap öncekinin yerine geçer). İnternet kesikken
-- kuyrukta bekleyen cevaplar sonradan gelir; işlem tekrarlansa da tek kayıt oluşur.
create or replace function public.ogrenci_cevap_kaydet(p_atama uuid, p_soru uuid, p_verilen text, p_sure_sn int default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  a public.atama;
begin
  a := ozel.cozulebilir_atama(p_atama);
  if exists (select 1 from public.sonuc where atama_id = p_atama and ogrenci_id = auth.uid()) then
    raise exception 'Bu testi bitirdiniz; cevaplar değiştirilemez.' using errcode = '42501';
  end if;
  if a.bitis is not null and now() > a.bitis + interval '10 minutes' then
    raise exception 'Testin süresi doldu.' using errcode = '42501';
  end if;
  insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen, dogru_mu, sure_sn, kaynak)
  values (a.kurum_id, p_atama, auth.uid(), p_soru, nullif(upper(btrim(p_verilen)), ''),
          ozel.dogru_mu(p_soru, p_verilen), p_sure_sn, 'online')
  on conflict (atama_id, ogrenci_id, soru_id) do update
    set verilen = excluded.verilen, dogru_mu = excluded.dogru_mu,
        sure_sn = coalesce(excluded.sure_sn, public.cevap.sure_sn), olusturma = now();
end $$;

-- Testi bitirir, neti hesaplar.
create or replace function public.ogrenci_testi_bitir(p_atama uuid)
returns public.sonuc
language plpgsql security definer set search_path = ''
as $$
declare
  r public.sonuc;
begin
  perform ozel.cozulebilir_atama(p_atama);
  select * into r from public.sonuc where atama_id = p_atama and ogrenci_id = auth.uid();
  if r.id is not null then
    return r;
  end if;
  return ozel.sonuc_hesapla(p_atama, auth.uid(), 'online');
end $$;

-- Bitmiş testin ayrıntısı. Doğru cevap ve çözümler yalnızca öğretmen açtıysa gelir.
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
    select s.id, ts.sira, s.tur, s.govde, s.sekil_svg,
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
-- Öğretmen: kâğıt üzerinde yapılan sınavın cevaplarını elle girme.
-- p_cevaplar test sırasına göre; null ya da '' boş demektir.
-- ---------------------------------------------------------------------
create or replace function public.elle_sonuc_kaydet(p_atama uuid, p_ogrenci uuid, p_cevaplar text[])
returns public.sonuc
language plpgsql security definer set search_path = ''
as $$
declare
  a public.atama;
  n int;
begin
  select * into a from public.atama where id = p_atama;
  if a.id is null or not ozel.lisansli_personel_mi(a.kurum_id) then
    raise exception 'Bu işlem için yetkiniz yok ya da kurum lisansı geçerli değil.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.sinif_grubu_ogrenci where sinif_grubu_id = a.sinif_grubu_id and ogrenci_id = p_ogrenci) then
    raise exception 'Öğrenci bu atamanın sınıfında değil.' using errcode = '23514';
  end if;
  select count(*) into n from public.test_soru where test_id = a.test_id;
  if coalesce(array_length(p_cevaplar, 1), 0) <> n then
    raise exception 'Testte % soru var, % cevap girildi.', n, coalesce(array_length(p_cevaplar, 1), 0) using errcode = '22023';
  end if;

  insert into public.cevap (kurum_id, atama_id, ogrenci_id, soru_id, verilen, dogru_mu, kaynak)
  select a.kurum_id, a.id, p_ogrenci, ts.soru_id,
         nullif(upper(btrim(p_cevaplar[ts.sira])), ''),
         ozel.dogru_mu(ts.soru_id, p_cevaplar[ts.sira]), 'elle'
  from public.test_soru ts where ts.test_id = a.test_id
  on conflict (atama_id, ogrenci_id, soru_id) do update
    set verilen = excluded.verilen, dogru_mu = excluded.dogru_mu, kaynak = 'elle', olusturma = now();

  return ozel.sonuc_hesapla(p_atama, p_ogrenci, 'elle');
end $$;

revoke all on function public.ogrenci_atamalari() from public, anon;
revoke all on function public.ogrenci_test_sorulari(uuid) from public, anon;
revoke all on function public.ogrenci_cevap_kaydet(uuid, uuid, text, int) from public, anon;
revoke all on function public.ogrenci_testi_bitir(uuid) from public, anon;
revoke all on function public.ogrenci_sonuc_ayrintisi(uuid) from public, anon;
revoke all on function public.elle_sonuc_kaydet(uuid, uuid, text[]) from public, anon;
grant execute on function public.ogrenci_atamalari() to authenticated;
grant execute on function public.ogrenci_test_sorulari(uuid) to authenticated;
grant execute on function public.ogrenci_cevap_kaydet(uuid, uuid, text, int) to authenticated;
grant execute on function public.ogrenci_testi_bitir(uuid) to authenticated;
grant execute on function public.ogrenci_sonuc_ayrintisi(uuid) to authenticated;
grant execute on function public.elle_sonuc_kaydet(uuid, uuid, text[]) to authenticated;
revoke all on function ozel.sonuc_hesapla(uuid, uuid, public.cevap_kaynagi) from public, anon, authenticated;
revoke all on function ozel.dogru_mu(uuid, text) from public, anon, authenticated;
revoke all on function ozel.cozulebilir_atama(uuid) from public, anon, authenticated;
