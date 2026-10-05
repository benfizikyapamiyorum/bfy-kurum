import type { SoruTuru, TestTuru } from './tipler'

export const SORU_TURU_ADI: Record<SoruTuru, string> = {
  coktan_secmeli: 'Çoktan seçmeli',
  dogru_yanlis: 'Doğru / yanlış',
  acik_uclu: 'Açık uçlu',
}

export const TEST_TURU_ADI: Record<TestTuru, string> = {
  mini_test: 'Mini test',
  deneme: 'Deneme',
  yazili: 'Yazılı',
}

export const ZORLUK_ADI: Record<number, string> = {
  1: 'Çok kolay',
  2: 'Kolay',
  3: 'Orta',
  4: 'Zor',
  5: 'Çok zor',
}
