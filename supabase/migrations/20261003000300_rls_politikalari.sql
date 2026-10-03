-- =====================================================================
-- 0003: Row Level Security politikaları.
--
-- İlkeler:
--  1. Her tabloda RLS açıktır. Politikası olmayan işlem reddedilir.
--  2. Kurum verisi yalnızca o kurumun üyelerine görünür. Süper admin her şeyi görür.
--  3. Yazma işlemleri ve soru bankası erişimi lisansı geçerli kurum gerektirir.
--     Lisans bitince kurum kendi geçmiş verisini okumaya devam eder.
--  4. Katalog (ders, seviye, ünite, kazanım) herkese açıktır: TYMM kazanım kodları kamuya açık bilgidir.
--  5. ornek = true işaretli soru ve içerikler giriş yapmadan da okunur (tahta modu denemesi ve demo).
--  6. Öğrenci soru tablosunu doğrudan okuyamaz (cevap anahtarı sızmasın). Online çözüm M3'te
--     cevapsız soru döndüren ve puanlamayı sunucuda yapan RPC fonksiyonlarıyla gelir.
--
-- Politikalarda fonksiyonlar (select ...) içine alınır; Postgres bunları sorgu başına bir kez çalıştırır.
-- =====================================================================

alter table public.kurum               enable row level security;
alter table public.kullanici           enable row level security;
alter table public.ders                enable row level security;
alter table public.seviye              enable row level security;
alter table public.unite               enable row level security;
alter table public.kazanim             enable row level security;
alter table public.sinif_grubu         enable row level security;
alter table public.sinif_grubu_ogrenci enable row level security;
alter table public.icerik              enable row level security;
alter table public.icerik_kazanim      enable row level security;
alter table public.soru                enable row level security;
alter table public.soru_kazanim        enable row level security;
alter table public.test                enable row level security;
alter table public.test_soru           enable row level security;
alter table public.atama               enable row level security;
alter table public.cevap               enable row level security;
alter table public.sonuc               enable row level security;

-- Supabase'in varsayılan yetkileri projeye göre değişebildiği için açıkça veriyoruz.
-- Satır düzeyindeki asıl kısıtlama aşağıdaki politikalardadır.
grant usage on schema public to anon, authenticated;
grant select on public.ders, public.seviye, public.unite, public.kazanim,
               public.icerik, public.icerik_kazanim, public.soru, public.soru_kazanim
  to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- ---------------------------------------------------------------------
-- kurum
-- ---------------------------------------------------------------------
create policy kurum_okuma on public.kurum for select to authenticated
  using ((select ozel.superadmin_mi()) or id = (select ozel.benim_kurumum()));

create policy kurum_ekleme on public.kurum for insert to authenticated
  with check ((select ozel.superadmin_mi()));

-- Yönetici de kendi kurumunu günceller; lisans alanlarını ozel.kurum_koruma tetikleyicisi korur.
create policy kurum_guncelleme on public.kurum for update to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_yoneticisi_mi(id)))
  with check ((select ozel.superadmin_mi()) or (select ozel.kurum_yoneticisi_mi(id)));

create policy kurum_silme on public.kurum for delete to authenticated
  using ((select ozel.superadmin_mi()));

-- ---------------------------------------------------------------------
-- kullanici
-- ---------------------------------------------------------------------
create policy kullanici_okuma on public.kullanici for select to authenticated
  using (
    id = (select auth.uid())
    or (select ozel.superadmin_mi())
    or (kurum_id is not null and (select ozel.kurum_personeli_mi(kurum_id)))
  );

create policy kullanici_ekleme on public.kullanici for insert to authenticated
  with check (
    (select ozel.superadmin_mi())
    or (kurum_id is not null
        and (select ozel.kurum_yoneticisi_mi(kurum_id))
        and (select ozel.kurum_lisansi_aktif(kurum_id)))
  );

create policy kullanici_guncelleme on public.kullanici for update to authenticated
  using (
    (select ozel.superadmin_mi())
    or (kurum_id is not null and (select ozel.kurum_yoneticisi_mi(kurum_id)))
  )
  with check (
    (select ozel.superadmin_mi())
    or (kurum_id is not null
        and (select ozel.kurum_yoneticisi_mi(kurum_id))
        and (select ozel.kurum_lisansi_aktif(kurum_id)))
  );

create policy kullanici_silme on public.kullanici for delete to authenticated
  using (
    (select ozel.superadmin_mi())
    or (rol in ('ogretmen', 'ogrenci') and kurum_id is not null
        and (select ozel.kurum_yoneticisi_mi(kurum_id)))
  );

-- ---------------------------------------------------------------------
-- Katalog: herkes okur, süper admin yazar.
-- ---------------------------------------------------------------------
create policy ders_okuma on public.ders for select to anon, authenticated using (true);
create policy ders_yazma on public.ders for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

create policy seviye_okuma on public.seviye for select to anon, authenticated using (true);
create policy seviye_yazma on public.seviye for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

create policy unite_okuma on public.unite for select to anon, authenticated using (true);
create policy unite_yazma on public.unite for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

create policy kazanim_okuma on public.kazanim for select to anon, authenticated using (true);
create policy kazanim_yazma on public.kazanim for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

-- ---------------------------------------------------------------------
-- sinif_grubu ve üyelikleri
-- ---------------------------------------------------------------------
create policy sinif_grubu_okuma on public.sinif_grubu for select to authenticated
  using (
    (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
    or id in (select ozel.ogrencinin_gruplari())
  );

create policy sinif_grubu_yazma on public.sinif_grubu for all to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_yoneticisi_mi(kurum_id)))
  with check (
    (select ozel.superadmin_mi())
    or ((select ozel.kurum_yoneticisi_mi(kurum_id)) and (select ozel.kurum_lisansi_aktif(kurum_id)))
  );

create policy sinif_grubu_ogrenci_okuma on public.sinif_grubu_ogrenci for select to authenticated
  using (
    ogrenci_id = (select auth.uid())
    or (select ozel.superadmin_mi())
    or exists (select 1 from public.sinif_grubu g
               where g.id = sinif_grubu_id and (select ozel.kurum_personeli_mi(g.kurum_id)))
  );

create policy sinif_grubu_ogrenci_yazma on public.sinif_grubu_ogrenci for all to authenticated
  using (
    (select ozel.superadmin_mi())
    or exists (select 1 from public.sinif_grubu g
               where g.id = sinif_grubu_id and (select ozel.kurum_yoneticisi_mi(g.kurum_id)))
  )
  with check (
    (select ozel.superadmin_mi())
    or exists (select 1 from public.sinif_grubu g
               where g.id = sinif_grubu_id
                 and (select ozel.kurum_yoneticisi_mi(g.kurum_id))
                 and (select ozel.kurum_lisansi_aktif(g.kurum_id)))
  );

-- ---------------------------------------------------------------------
-- İçerik ve soru bankası
-- ---------------------------------------------------------------------
create policy icerik_okuma on public.icerik for select to anon, authenticated
  using (
    (ornek and yayinda)
    or (select ozel.superadmin_mi())
    or (yayinda and (select ozel.icerik_erisimi_var_mi()))
  );
create policy icerik_yazma on public.icerik for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

create policy soru_okuma on public.soru for select to anon, authenticated
  using (
    (ornek and yayinda)
    or (select ozel.superadmin_mi())
    or (yayinda and (select ozel.icerik_erisimi_var_mi()))
  );
create policy soru_yazma on public.soru for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

-- Etiket tabloları: bağlı olduğu içerik/soru görünüyorsa görünür.
create policy icerik_kazanim_okuma on public.icerik_kazanim for select to anon, authenticated
  using (exists (select 1 from public.icerik i where i.id = icerik_id));
create policy icerik_kazanim_yazma on public.icerik_kazanim for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

create policy soru_kazanim_okuma on public.soru_kazanim for select to anon, authenticated
  using (exists (select 1 from public.soru s where s.id = soru_id));
create policy soru_kazanim_yazma on public.soru_kazanim for all to authenticated
  using ((select ozel.superadmin_mi())) with check ((select ozel.superadmin_mi()));

-- ---------------------------------------------------------------------
-- test ve test_soru: kurumun öğretmen ve yöneticileri.
-- Öğrenci, kendi sınıfına atanmış testin başlığını ve süresini görür.
-- ---------------------------------------------------------------------
create policy test_okuma on public.test for select to authenticated
  using (
    (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
    or exists (select 1 from public.atama a
               where a.test_id = test.id and a.sinif_grubu_id in (select ozel.ogrencinin_gruplari()))
  );
create policy test_yazma on public.test for all to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(kurum_id)))
  with check ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(kurum_id)));

create policy test_soru_okuma on public.test_soru for select to authenticated
  using (exists (select 1 from public.test t
                 where t.id = test_id
                   and ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(t.kurum_id)))));
create policy test_soru_yazma on public.test_soru for all to authenticated
  using (exists (select 1 from public.test t
                 where t.id = test_id
                   and ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(t.kurum_id)))))
  with check (exists (select 1 from public.test t
                      where t.id = test_id
                        and ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(t.kurum_id)))));

-- ---------------------------------------------------------------------
-- atama
-- ---------------------------------------------------------------------
create policy atama_okuma on public.atama for select to authenticated
  using (
    (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
    or sinif_grubu_id in (select ozel.ogrencinin_gruplari())
  );
create policy atama_yazma on public.atama for all to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(kurum_id)))
  with check ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(kurum_id)));

-- ---------------------------------------------------------------------
-- cevap ve sonuc
-- Öğrenci yalnızca kendi kayıtlarını okur; yazamaz (doğru mu alanını kendisi belirleyemesin).
-- Öğrencinin online cevapları M3'te sunucuda puanlayan RPC ile kaydedilir.
-- Öğretmen elle sonuç girişini doğrudan yapabilir.
-- ---------------------------------------------------------------------
create policy cevap_okuma on public.cevap for select to authenticated
  using (
    ogrenci_id = (select auth.uid())
    or (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
  );
create policy cevap_yazma on public.cevap for all to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(kurum_id)))
  with check ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(kurum_id)));

create policy sonuc_okuma on public.sonuc for select to authenticated
  using (
    ogrenci_id = (select auth.uid())
    or (select ozel.superadmin_mi())
    or (select ozel.kurum_personeli_mi(kurum_id))
  );
create policy sonuc_yazma on public.sonuc for all to authenticated
  using ((select ozel.superadmin_mi()) or (select ozel.kurum_personeli_mi(kurum_id)))
  with check ((select ozel.superadmin_mi()) or (select ozel.lisansli_personel_mi(kurum_id)));
