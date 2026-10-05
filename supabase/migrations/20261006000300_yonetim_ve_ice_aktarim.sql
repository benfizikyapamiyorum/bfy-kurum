-- =====================================================================
-- 0010 (M5): Süper admin paneli ve toplu içe aktarım.
--  - dis_kimlik: içe aktarılan soru/içeriğin dış kimliği. Aynı dosya tekrar yüklenince
--    kopya oluşmaz, kayıt güncellenir.
--  - toplu_ice_aktar(jsonb): docs/ICE_AKTARIM.md biçimindeki dosyayı tek işlemde aktarır.
--    Bir satır bile hatalıysa hiçbir şey yazılmaz.
--  - kurum_ozetleri(): süper admin için kurum listesi ve kontenjan kullanımı.
-- =====================================================================

alter table public.soru add column dis_kimlik text unique;
alter table public.icerik add column dis_kimlik text unique;

create or replace function public.toplu_ice_aktar(p_veri jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  u jsonb;
  k jsonb;
  s jsonb;
  c jsonb;
  v_ders uuid;
  v_seviye uuid;
  v_unite uuid;
  v_id uuid;
  v_yeni boolean;
  n_unite int := 0;
  n_kazanim int := 0;
  n_soru_yeni int := 0;
  n_soru_guncel int := 0;
  n_icerik int := 0;
begin
  if not ozel.superadmin_mi() then
    raise exception 'Toplu içe aktarımı yalnızca süper admin yapabilir.' using errcode = '42501';
  end if;
  if (p_veri->>'surum') is distinct from '1' then
    raise exception 'Desteklenmeyen dosya sürümü.' using errcode = '22023';
  end if;

  -- Üniteler
  for u in select * from jsonb_array_elements(coalesce(p_veri->'katalog'->'uniteler', '[]')) loop
    select id into v_ders from public.ders where kod = coalesce(u->>'ders', 'FIZ');
    select id into v_seviye from public.seviye where kod = u->>'seviye';
    if v_ders is null or v_seviye is null then
      raise exception 'Ünite için ders ya da seviye bulunamadı: %', u using errcode = '22023';
    end if;
    insert into public.unite (ders_id, seviye_id, no, ad)
    values (v_ders, v_seviye, (u->>'no')::int, u->>'ad')
    on conflict (ders_id, seviye_id, no) do update set ad = excluded.ad;
    n_unite := n_unite + 1;
  end loop;

  -- Kazanımlar
  for k in select * from jsonb_array_elements(coalesce(p_veri->'katalog'->'kazanimlar', '[]')) loop
    select un.id into v_unite
    from public.unite un
    join public.ders d on d.id = un.ders_id and d.kod = coalesce(k->'unite'->>'ders', 'FIZ')
    join public.seviye sv on sv.id = un.seviye_id and sv.kod = k->'unite'->>'seviye'
    where un.no = (k->'unite'->>'no')::int;
    if v_unite is null then
      raise exception 'Kazanım % için ünite bulunamadı.', k->>'kod' using errcode = '22023';
    end if;
    insert into public.kazanim (unite_id, kod, metin, sira)
    values (v_unite, k->>'kod', k->>'metin', coalesce((k->>'sira')::int, 0))
    on conflict (kod) do update set unite_id = excluded.unite_id, metin = excluded.metin, sira = excluded.sira;
    n_kazanim := n_kazanim + 1;
  end loop;

  -- Sorular
  for s in select * from jsonb_array_elements(coalesce(p_veri->'sorular', '[]')) loop
    select id into v_id from public.soru where dis_kimlik = s->>'dis_kimlik';
    v_yeni := v_id is null;
    insert into public.soru (
      id, dis_kimlik, tur, govde, sekil_svg, secenekler, dogru_cevap, cozum_adimlari, zorluk,
      baglam_temelli, kaynak_notu, beceri, kavram_yanilgisi, puanlama_olcutu, ornek, yayinda
    ) values (
      coalesce(v_id, gen_random_uuid()), s->>'dis_kimlik', (s->>'tur')::public.soru_turu, s->>'govde',
      nullif(s->>'sekil_svg', ''), case when jsonb_typeof(s->'secenekler') = 'array' then s->'secenekler' end,
      s->>'dogru_cevap',
      coalesce((select jsonb_agg(case when jsonb_typeof(a) = 'string' then jsonb_build_object('metin', a #>> '{}') else a end)
                from jsonb_array_elements(coalesce(s->'cozum_adimlari', '[]')) a), '[]'),
      (s->>'zorluk')::smallint, coalesce((s->>'baglam_temelli')::boolean, false),
      s->>'kaynak_notu', s->>'beceri', s->>'kavram_yanilgisi', s->>'puanlama_olcutu',
      coalesce((s->>'ornek')::boolean, false), coalesce((s->>'yayinda')::boolean, true)
    )
    on conflict (dis_kimlik) do update set
      tur = excluded.tur, govde = excluded.govde, sekil_svg = excluded.sekil_svg,
      secenekler = excluded.secenekler, dogru_cevap = excluded.dogru_cevap,
      cozum_adimlari = excluded.cozum_adimlari, zorluk = excluded.zorluk,
      baglam_temelli = excluded.baglam_temelli, kaynak_notu = excluded.kaynak_notu,
      beceri = excluded.beceri, kavram_yanilgisi = excluded.kavram_yanilgisi,
      puanlama_olcutu = excluded.puanlama_olcutu, ornek = excluded.ornek, yayinda = excluded.yayinda
    returning id into v_id;

    delete from public.soru_kazanim where soru_id = v_id;
    insert into public.soru_kazanim (soru_id, kazanim_id)
      select v_id, kz.id from public.kazanim kz
      where kz.kod in (select jsonb_array_elements_text(s->'kazanimlar'));
    if not found then
      raise exception 'Soru % için kazanım bulunamadı.', s->>'dis_kimlik' using errcode = '22023';
    end if;
    if v_yeni then n_soru_yeni := n_soru_yeni + 1; else n_soru_guncel := n_soru_guncel + 1; end if;
  end loop;

  -- İçerikler
  for c in select * from jsonb_array_elements(coalesce(p_veri->'icerikler', '[]')) loop
    v_unite := null;
    if c ? 'unite' and jsonb_typeof(c->'unite') = 'object' then
      select un.id into v_unite
      from public.unite un
      join public.ders d on d.id = un.ders_id and d.kod = coalesce(c->'unite'->>'ders', 'FIZ')
      join public.seviye sv on sv.id = un.seviye_id and sv.kod = c->'unite'->>'seviye'
      where un.no = (c->'unite'->>'no')::int;
    end if;
    insert into public.icerik (dis_kimlik, tur, baslik, aciklama, unite_id, hafta, sira, html_yolu, veri, meb_baglanti, ornek, yayinda)
    values (
      c->>'dis_kimlik', (c->>'tur')::public.icerik_turu, c->>'baslik', c->>'aciklama', v_unite,
      (c->>'hafta')::int, coalesce((c->>'sira')::int, 0), c->>'html_yolu',
      case when c ? 'veri' and jsonb_typeof(c->'veri') <> 'null' then c->'veri' end,
      c->>'meb_baglanti', coalesce((c->>'ornek')::boolean, false), coalesce((c->>'yayinda')::boolean, true)
    )
    on conflict (dis_kimlik) do update set
      tur = excluded.tur, baslik = excluded.baslik, aciklama = excluded.aciklama, unite_id = excluded.unite_id,
      hafta = excluded.hafta, sira = excluded.sira, html_yolu = excluded.html_yolu, veri = excluded.veri,
      meb_baglanti = excluded.meb_baglanti, ornek = excluded.ornek, yayinda = excluded.yayinda
    returning id into v_id;
    delete from public.icerik_kazanim where icerik_id = v_id;
    insert into public.icerik_kazanim (icerik_id, kazanim_id)
      select v_id, kz.id from public.kazanim kz
      where kz.kod in (select jsonb_array_elements_text(coalesce(c->'kazanimlar', '[]')));
    n_icerik := n_icerik + 1;
  end loop;

  return jsonb_build_object(
    'uniteler', n_unite, 'kazanimlar', n_kazanim,
    'sorular_yeni', n_soru_yeni, 'sorular_guncellenen', n_soru_guncel, 'icerikler', n_icerik
  );
end $$;

revoke all on function public.toplu_ice_aktar(jsonb) from public, anon;
grant execute on function public.toplu_ice_aktar(jsonb) to authenticated;

create or replace function public.kurum_ozetleri()
returns table (
  id uuid, ad text, kod text, lisans_baslangic date, lisans_bitis date, aktif boolean, demo boolean,
  ogretmen_limiti int, ogrenci_limiti int, ogretmen_sayisi int, ogrenci_sayisi int, yonetici text
)
language sql stable security definer set search_path = ''
as $$
  select k.id, k.ad, k.kod, k.lisans_baslangic, k.lisans_bitis, k.aktif, k.demo,
         k.ogretmen_limiti, k.ogrenci_limiti,
         (select count(*)::int from public.kullanici u where u.kurum_id = k.id and u.rol = 'ogretmen' and u.aktif),
         (select count(*)::int from public.kullanici u where u.kurum_id = k.id and u.rol = 'ogrenci' and u.aktif),
         (select string_agg(u.ad_soyad || ' <' || coalesce(u.eposta, '') || '>', ', ')
            from public.kullanici u where u.kurum_id = k.id and u.rol = 'kurum_yonetici')
  from public.kurum k
  where ozel.superadmin_mi()
  order by k.lisans_bitis
$$;
revoke all on function public.kurum_ozetleri() from public, anon;
grant execute on function public.kurum_ozetleri() to authenticated;
