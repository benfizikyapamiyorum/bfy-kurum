-- =====================================================================
-- 0001: Temel şema.
-- Veri modeli dersten bağımsızdır: ders → seviye → ünite → kazanım → içerik/soru.
-- Kurum verisi (kullanıcı, sınıf, test, sonuç) kurum_id ile ayrılır; erişim RLS ile
-- 20261003000300_rls_politikalari.sql dosyasında zorunlu kılınır.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Sabit değer kümeleri
-- ---------------------------------------------------------------------
create type public.rol as enum ('superadmin', 'kurum_yonetici', 'ogretmen', 'ogrenci');
create type public.icerik_turu as enum ('hafta_kiti', 'konu_anlatimi', 'sunum');
create type public.soru_turu as enum ('coktan_secmeli', 'dogru_yanlis', 'acik_uclu');
create type public.test_turu as enum ('mini_test', 'deneme', 'yazili');
create type public.cevap_kaynagi as enum ('online', 'elle');

-- ---------------------------------------------------------------------
-- Kurum ve kullanıcılar
-- ---------------------------------------------------------------------
create table public.kurum (
  id               uuid primary key default gen_random_uuid(),
  ad               text not null check (length(trim(ad)) between 2 and 160),
  -- Storage içindeki yol: "logolar/<kurum_id>/logo.png" gibi.
  logo_yolu        text,
  lisans_baslangic date not null default current_date,
  lisans_bitis     date not null,
  ogretmen_limiti  integer not null default 5 check (ogretmen_limiti >= 0),
  ogrenci_limiti   integer not null default 100 check (ogrenci_limiti >= 0),
  aktif            boolean not null default true,
  -- Herkese açık demo kurumu (M6).
  demo             boolean not null default false,
  olusturma        timestamptz not null default now(),
  guncelleme       timestamptz not null default now(),
  check (lisans_bitis >= lisans_baslangic)
);

-- Uygulama kullanıcısı. Kimlik doğrulama Supabase Auth (auth.users) ile yapılır.
-- KVKK: öğrenciden yalnızca ad soyad ve kullanıcı adı tutulur. TC kimlik no, telefon,
-- adres gibi veriler için sütun yoktur ve eklenmemelidir.
create table public.kullanici (
  id            uuid primary key references auth.users (id) on delete cascade,
  kurum_id      uuid references public.kurum (id) on delete cascade,
  rol           public.rol not null,
  ad_soyad      text not null check (length(trim(ad_soyad)) between 2 and 120),
  -- Öğrenci girişi için kullanıcı adı (kurum içinde tekil). Öğretmen ve yöneticide e-posta kullanılabilir.
  kullanici_adi text check (kullanici_adi ~ '^[a-z0-9._-]{3,40}$'),
  eposta        text,
  aktif         boolean not null default true,
  olusturma     timestamptz not null default now(),
  guncelleme    timestamptz not null default now(),
  -- Süper admin hiçbir kuruma bağlı değildir; diğer herkes bir kuruma bağlıdır.
  check ((rol = 'superadmin') = (kurum_id is null))
);
create unique index kullanici_kurum_kullanici_adi_tekil
  on public.kullanici (kurum_id, kullanici_adi) where kullanici_adi is not null;
create index kullanici_kurum_rol on public.kullanici (kurum_id, rol);

-- Ders kataloğu (dersten bağımsız model)
create table public.ders (
  id   uuid primary key default gen_random_uuid(),
  kod  text not null unique,           -- 'FIZ'
  ad   text not null,                  -- 'Fizik'
  sira integer not null default 0
);

create table public.seviye (
  id   uuid primary key default gen_random_uuid(),
  kod  text not null unique,           -- '9', '10', '11', '12', 'TYT', 'AYT'
  ad   text not null,                  -- '9. sınıf'
  sira integer not null
);

create table public.unite (
  id        uuid primary key default gen_random_uuid(),
  ders_id   uuid not null references public.ders (id) on delete restrict,
  seviye_id uuid not null references public.seviye (id) on delete restrict,
  no        integer not null check (no > 0),
  ad        text not null,
  unique (ders_id, seviye_id, no)
);

create table public.kazanim (
  id       uuid primary key default gen_random_uuid(),
  unite_id uuid not null references public.unite (id) on delete restrict,
  kod      text not null unique,       -- 'FİZ.9.2.3'
  metin    text not null,
  sira     integer not null default 0
);
create index kazanim_unite on public.kazanim (unite_id, sira);

-- Kurum içindeki sınıf / şube
create table public.sinif_grubu (
  id           uuid primary key default gen_random_uuid(),
  kurum_id     uuid not null references public.kurum (id) on delete cascade,
  ad           text not null check (length(trim(ad)) between 1 and 80),   -- '11-A Sayısal'
  seviye_id    uuid references public.seviye (id) on delete set null,
  -- Öğrencilerin sınıf koduyla girişi için (M2). Tüm sistemde tekil.
  katilim_kodu text unique check (katilim_kodu ~ '^[A-Z0-9]{6,12}$'),
  arsiv        boolean not null default false,
  olusturma    timestamptz not null default now(),
  unique (kurum_id, ad)
);

create table public.sinif_grubu_ogrenci (
  sinif_grubu_id uuid not null references public.sinif_grubu (id) on delete cascade,
  ogrenci_id     uuid not null references public.kullanici (id) on delete cascade,
  primary key (sinif_grubu_id, ogrenci_id)
);
create index sinif_grubu_ogrenci_ogrenci on public.sinif_grubu_ogrenci (ogrenci_id);

-- ---------------------------------------------------------------------
-- İçerik ve soru bankası (genel içerik; süper admin yönetir)
-- ---------------------------------------------------------------------
create table public.icerik (
  id         uuid primary key default gen_random_uuid(),
  tur        public.icerik_turu not null,
  baslik     text not null,
  aciklama   text,
  unite_id   uuid references public.unite (id) on delete set null,
  hafta      integer check (hafta between 1 and 40),
  sira       integer not null default 0,
  -- Tek dosyalık HTML kit: '/' ile başlıyorsa uygulamayla yayınlanan statik dosya,
  -- aksi halde 'icerik' Storage kovasındaki nesne yolu.
  html_yolu  text,
  -- Yapılandırılmış içerik (konu anlatımı, sunum) için serbest JSON.
  veri       jsonb,
  -- İlgili MEB ders kitabının bağlantısı (içerik kopyalanmaz, yalnızca bağlantı verilir).
  meb_baglanti text,
  ornek      boolean not null default false,
  yayinda    boolean not null default true,
  olusturma  timestamptz not null default now(),
  guncelleme timestamptz not null default now(),
  check (html_yolu is not null or veri is not null)
);
create index icerik_unite on public.icerik (unite_id, hafta, sira);

create table public.icerik_kazanim (
  icerik_id  uuid not null references public.icerik (id) on delete cascade,
  kazanim_id uuid not null references public.kazanim (id) on delete restrict,
  primary key (icerik_id, kazanim_id)
);

create table public.soru (
  id              uuid primary key default gen_random_uuid(),
  tur             public.soru_turu not null,
  -- Zengin metin: sınırlı HTML ve $...$ arasında KaTeX formülü. Ekranda temizlenerek gösterilir.
  govde           text not null,
  -- Şekil: tek bir <svg> öğesi. Animasyon için data-ciz-* öznitelikleri (docs/MIMARI.md).
  sekil_svg       text,
  -- Çoktan seçmelide tam 5 şık: [{"harf":"A","metin":"..."}, ...]
  secenekler      jsonb,
  -- Çoktan seçmeli: 'A'..'E'; doğru/yanlış: 'D' veya 'Y'; açık uçlu: örnek cevap metni.
  dogru_cevap     text not null,
  -- Adım adım çözüm: [{"metin":"..."}, ...]; her adım tahtada ayrı açılır.
  cozum_adimlari  jsonb not null default '[]'::jsonb,
  zorluk          smallint not null check (zorluk between 1 and 5),
  baglam_temelli  boolean not null default false,
  kaynak_notu     text,
  ornek           boolean not null default false,
  yayinda         boolean not null default true,
  olusturma       timestamptz not null default now(),
  guncelleme      timestamptz not null default now(),
  check (jsonb_typeof(cozum_adimlari) = 'array'),
  check (
    case tur
      when 'coktan_secmeli' then
        jsonb_typeof(secenekler) = 'array'
        and jsonb_array_length(secenekler) = 5
        and dogru_cevap in ('A', 'B', 'C', 'D', 'E')
      when 'dogru_yanlis' then
        secenekler is null and dogru_cevap in ('D', 'Y')
      else
        secenekler is null and length(trim(dogru_cevap)) > 0
    end
  )
);

create table public.soru_kazanim (
  soru_id    uuid not null references public.soru (id) on delete cascade,
  kazanim_id uuid not null references public.kazanim (id) on delete restrict,
  primary key (soru_id, kazanim_id)
);
create index soru_kazanim_kazanim on public.soru_kazanim (kazanim_id);

-- ---------------------------------------------------------------------
-- Test, atama ve sonuçlar (kurum verisi)
-- ---------------------------------------------------------------------
create table public.test (
  id                  uuid primary key default gen_random_uuid(),
  kurum_id            uuid not null references public.kurum (id) on delete cascade,
  olusturan_id        uuid references public.kullanici (id) on delete set null,
  tur                 public.test_turu not null,
  baslik              text not null check (length(trim(baslik)) between 1 and 160),
  sure_dk             integer check (sure_dk between 1 and 600),
  -- Kaç yanlışın bir doğruyu götürdüğü. 0: yanlışlar doğruyu götürmez.
  yanlis_dogru_orani  numeric(4, 2) not null default 4 check (yanlis_dogru_orani >= 0),
  olusturma           timestamptz not null default now(),
  guncelleme          timestamptz not null default now()
);
create index test_kurum on public.test (kurum_id, olusturma desc);

-- Birincil anahtar (test_id, soru_id): aynı test içinde aynı soru iki kez bulunamaz.
create table public.test_soru (
  test_id uuid not null references public.test (id) on delete cascade,
  soru_id uuid not null references public.soru (id) on delete restrict,
  sira    integer not null check (sira > 0),
  primary key (test_id, soru_id),
  unique (test_id, sira) deferrable initially immediate
);

create table public.atama (
  id             uuid primary key default gen_random_uuid(),
  kurum_id       uuid not null references public.kurum (id) on delete cascade,
  test_id        uuid not null references public.test (id) on delete cascade,
  sinif_grubu_id uuid not null references public.sinif_grubu (id) on delete cascade,
  baslangic      timestamptz not null default now(),
  bitis          timestamptz,
  olusturan_id   uuid references public.kullanici (id) on delete set null,
  olusturma      timestamptz not null default now(),
  check (bitis is null or bitis > baslangic)
);
create index atama_grup on public.atama (sinif_grubu_id, baslangic desc);
create index atama_test on public.atama (test_id);

create table public.cevap (
  id         uuid primary key default gen_random_uuid(),
  kurum_id   uuid not null references public.kurum (id) on delete cascade,
  atama_id   uuid not null references public.atama (id) on delete cascade,
  ogrenci_id uuid not null references public.kullanici (id) on delete cascade,
  soru_id    uuid not null references public.soru (id) on delete restrict,
  verilen    text,               -- boş bırakılan soru için null
  dogru_mu   boolean,            -- açık uçluda öğretmen değerlendirene kadar null
  sure_sn    integer check (sure_sn >= 0),
  kaynak     public.cevap_kaynagi not null default 'online',
  olusturma  timestamptz not null default now(),
  unique (atama_id, ogrenci_id, soru_id)
);
create index cevap_ogrenci on public.cevap (ogrenci_id);

create table public.sonuc (
  id          uuid primary key default gen_random_uuid(),
  kurum_id    uuid not null references public.kurum (id) on delete cascade,
  atama_id    uuid not null references public.atama (id) on delete cascade,
  ogrenci_id  uuid not null references public.kullanici (id) on delete cascade,
  dogru       integer not null default 0 check (dogru >= 0),
  yanlis      integer not null default 0 check (yanlis >= 0),
  bos         integer not null default 0 check (bos >= 0),
  net         numeric(7, 2) not null default 0,
  kaynak      public.cevap_kaynagi not null default 'online',
  tamamlandi  timestamptz not null default now(),
  unique (atama_id, ogrenci_id)
);
create index sonuc_ogrenci on public.sonuc (ogrenci_id, tamamlandi desc);
