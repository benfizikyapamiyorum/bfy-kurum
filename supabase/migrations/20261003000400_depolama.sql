-- =====================================================================
-- 0004: Dosya depolama (Supabase Storage).
--  logolar : Kurum logoları. Herkese açık okunur (tahta köşesi ve PDF'ler için).
--            Yol biçimi: <kurum_id>/logo.<uzantı>. Kurum yöneticisi yalnızca kendi klasörüne yazar.
--  icerik  : Tek dosyalık HTML kitler ve içerik ekleri. Özel kova.
--            Lisanslı öğretmen ve yönetici okur, süper admin yazar.
--            Yol biçimi: kitler/<seviye>/<dosya>.html
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logolar', 'logolar', true, 1048576,
   array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('icerik', 'icerik', false, 26214400,
   array['text/html', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do nothing;

create policy logolar_yazma on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logolar'
    and ((select ozel.superadmin_mi())
         or ((select ozel.benim_rolum()) = 'kurum_yonetici'
             and (storage.foldername(name))[1] = (select ozel.benim_kurumum())::text))
  );

create policy logolar_guncelleme on storage.objects for update to authenticated
  using (
    bucket_id = 'logolar'
    and ((select ozel.superadmin_mi())
         or ((select ozel.benim_rolum()) = 'kurum_yonetici'
             and (storage.foldername(name))[1] = (select ozel.benim_kurumum())::text))
  );

create policy logolar_silme on storage.objects for delete to authenticated
  using (
    bucket_id = 'logolar'
    and ((select ozel.superadmin_mi())
         or ((select ozel.benim_rolum()) = 'kurum_yonetici'
             and (storage.foldername(name))[1] = (select ozel.benim_kurumum())::text))
  );

create policy icerik_dosya_okuma on storage.objects for select to authenticated
  using (bucket_id = 'icerik' and (select ozel.icerik_erisimi_var_mi()));

create policy icerik_dosya_yazma on storage.objects for insert to authenticated
  with check (bucket_id = 'icerik' and (select ozel.superadmin_mi()));

create policy icerik_dosya_guncelleme on storage.objects for update to authenticated
  using (bucket_id = 'icerik' and (select ozel.superadmin_mi()));

create policy icerik_dosya_silme on storage.objects for delete to authenticated
  using (bucket_id = 'icerik' and (select ozel.superadmin_mi()));
