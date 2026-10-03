-- =====================================================================
-- 0005: Katalog (ders, seviye, ünite, TYMM kazanımları).
-- Bu dosya scripts/ornek-veri-sql-uret.ts ile üretildi. Elle düzenlemeyin.
-- =====================================================================


insert into public.ders (id, kod, ad, sira) values ('10000000-0000-4000-8000-000000000001', 'FIZ', 'Fizik', 1)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;

insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000001', '9', '9. sınıf', 1)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;
insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000002', '10', '10. sınıf', 2)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;
insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000003', '11', '11. sınıf', 3)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;
insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000004', '12', '12. sınıf', 4)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;
insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000005', 'TYT', 'TYT', 5)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;
insert into public.seviye (id, kod, ad, sira) values ('20000000-0000-4000-8000-000000000006', 'AYT', 'AYT', 6)
  on conflict (id) do update set kod = excluded.kod, ad = excluded.ad, sira = excluded.sira;

insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 1, 'Fizik Bilimi ve Kariyer Keşfi')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;
insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 2, 'Kuvvet ve Hareket')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;
insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 1, 'Kuvvet ve Hareket')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;
insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 2, 'Enerji')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;
insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 1, 'Kuvvet ve Hareket')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;
insert into public.unite (id, ders_id, seviye_id, no, ad) values ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 2, 'Elektrik ve Manyetizma')
  on conflict (id) do update set no = excluded.no, ad = excluded.ad;

insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090101', '30000000-0000-4000-8000-000000000001', 'FİZ.9.1.1', 'Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090102', '30000000-0000-4000-8000-000000000001', 'FİZ.9.1.2', 'Fizik biliminin alt dallarını sınıflandırabilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090103', '30000000-0000-4000-8000-000000000001', 'FİZ.9.1.3', 'Fizik bilimine katkıda bulunmuş bilim insanlarının deneyimlerini yansıtabilme', 3)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090104', '30000000-0000-4000-8000-000000000001', 'FİZ.9.1.4', 'Bilim ve teknoloji alanında faaliyet gösteren kurum veya kuruluşlarda fizik bilimi ile ilişkili kariyer olanaklarını sorgulayabilme', 4)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090201', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.1', 'Birimleri SI birim sisteminde verilen temel ve türetilmiş nicelikleri sınıflandırabilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090202', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.2', 'Skaler ve vektörel nicelikleri karşılaştırabilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090203', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.3', 'Aynı doğrultu üzerinde yer alan farklı vektörlerin yön ve büyüklüklerine yönelik bilimsel çıkarım yapabilme', 3)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090204', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.4', 'Vektörlerin toplanmasında kullanılan uç uca ekleme ve paralelkenar yöntemi ile bileşenlerine ayırma işlemine ilişkin tümevarımsal akıl yürütebilme', 4)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090205', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.5', 'Doğadaki temel kuvvetleri karşılaştırabilme', 5)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090206', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.6', 'Hareketin temel kavramlarının tanımlarına yönelik tümevarımsal akıl yürütebilme', 6)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000090207', '30000000-0000-4000-8000-000000000002', 'FİZ.9.2.7', 'Hareket türlerini sınıflandırabilme', 7)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100101', '30000000-0000-4000-8000-000000000003', 'FİZ.10.1.1', 'Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100102', '30000000-0000-4000-8000-000000000003', 'FİZ.10.1.2', 'İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100103', '30000000-0000-4000-8000-000000000003', 'FİZ.10.1.3', 'Yatay doğrultuda sabit ivmeyle hareket eden cisimlerin hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme', 3)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100201', '30000000-0000-4000-8000-000000000004', 'FİZ.10.2.1', 'Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100202', '30000000-0000-4000-8000-000000000004', 'FİZ.10.2.2', 'İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100203', '30000000-0000-4000-8000-000000000004', 'FİZ.10.2.3', 'Enerji biçimlerini karşılaştırabilme', 3)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100204', '30000000-0000-4000-8000-000000000004', 'FİZ.10.2.4', 'Mekanik enerjiyi çözümleyebilme', 4)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000100205', '30000000-0000-4000-8000-000000000004', 'FİZ.10.2.5', 'Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme', 5)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110101', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.1', 'Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110102', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.2', 'Serbest düşme hareketi ile ilgili kanıt kullanabilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110103', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.3', 'İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme', 3)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110104', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.4', 'Newton''ın Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme', 4)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110105', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.5', 'Newton''ın Hareket Yasalarını serbest cisim diyagramını kullanarak yorumlayabilme', 5)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110106', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.6', 'Statik ve kinetik sürtünme kuvvetlerini karşılaştırabilme', 6)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110107', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.7', 'Sürtünme kuvvetinin matematiksel modeline ilişkin tümevarımsal akıl yürütebilme', 7)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110108', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.8', 'Limit hızı etkileyen değişkenler ile ilgili bilimsel çıkarım yapabilme', 8)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110109', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.9', 'Düzgün çembersel hareket yapan cisimlerin yörüngeleri ve hız vektörleri hakkında analojik akıl yürütebilme', 9)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110110', '30000000-0000-4000-8000-000000000005', 'FİZ.11.1.10', 'Düzgün çembersel hareketin değişkenler arasındaki ilişkilerin matematiksel olarak modellemesine ilişkin tümevarımsal akıl yürütebilme', 10)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110201', '30000000-0000-4000-8000-000000000006', 'FİZ.11.2.1', 'Elektrik yükleri arasındaki elektriksel kuvvetin matematiksel modeline yönelik tümevarımsal akıl yürütebilme', 1)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
insert into public.kazanim (id, unite_id, kod, metin, sira) values ('40000000-0000-4000-8000-000000110202', '30000000-0000-4000-8000-000000000006', 'FİZ.11.2.2', 'Elektriksel alanın matematiksel modeline yönelik tümevarımsal akıl yürütebilme', 2)
  on conflict (id) do update set kod = excluded.kod, metin = excluded.metin, sira = excluded.sira;
