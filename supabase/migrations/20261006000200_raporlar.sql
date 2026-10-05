-- =====================================================================
-- 0009 (M4): Raporlar.
-- kazanim_basarisi: sınıfın (ya da bir öğrencinin) öğrenme çıktısı bazında başarısı.
-- Yalnızca tamamlanmış (sonucu olan) denemeler sayılır; açık uçlu sorular hariç.
-- Boş bırakılan soru deneme sayılır, doğru sayılmaz.
-- SECURITY DEFINER: lisans bitse de kurum kendi geçmiş raporunu görür.
-- =====================================================================

create or replace function public.kazanim_basarisi(p_sinif uuid, p_ogrenci uuid default null)
returns table (
  kazanim_id uuid, deneme int, dogru int, yanlis int, bos int, yuzde numeric, ogrenci_sayisi int, soru_sayisi int
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_kurum uuid;
begin
  select g.kurum_id into v_kurum from public.sinif_grubu g where g.id = p_sinif;
  if v_kurum is null then
    raise exception 'Sınıf bulunamadı.' using errcode = '42704';
  end if;
  -- coalesce: p_ogrenci boşken karşılaştırma NULL döner; NULL "yetkili" sayılmamalı.
  if not coalesce(
    ozel.superadmin_mi()
    or ozel.kurum_personeli_mi(v_kurum)
    or (p_ogrenci = auth.uid() and p_sinif in (select ozel.ogrencinin_gruplari())),
    false
  ) then
    raise exception 'Bu raporu görme yetkiniz yok.' using errcode = '42501';
  end if;

  return query
  with tamam as (
    select s.atama_id, s.ogrenci_id, a.test_id
    from public.sonuc s
    join public.atama a on a.id = s.atama_id
    where a.sinif_grubu_id = p_sinif
      and (p_ogrenci is null or s.ogrenci_id = p_ogrenci)
  ),
  denemeler as (
    select t.ogrenci_id, ts.soru_id, c.dogru_mu
    from tamam t
    join public.test_soru ts on ts.test_id = t.test_id
    join public.soru so on so.id = ts.soru_id and so.tur <> 'acik_uclu'
    left join public.cevap c
      on c.atama_id = t.atama_id and c.ogrenci_id = t.ogrenci_id and c.soru_id = ts.soru_id
  )
  select sk.kazanim_id,
         count(*)::int,
         (count(*) filter (where d.dogru_mu is true))::int,
         (count(*) filter (where d.dogru_mu is false))::int,
         (count(*) filter (where d.dogru_mu is null))::int,
         round(100.0 * count(*) filter (where d.dogru_mu is true) / count(*), 1),
         count(distinct d.ogrenci_id)::int,
         count(distinct d.soru_id)::int
  from denemeler d
  join public.soru_kazanim sk on sk.soru_id = d.soru_id
  group by sk.kazanim_id
  order by 6 asc;
end $$;

revoke all on function public.kazanim_basarisi(uuid, uuid) from public, anon;
grant execute on function public.kazanim_basarisi(uuid, uuid) to authenticated;
