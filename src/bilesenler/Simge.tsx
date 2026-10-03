// Uygulama simgeleri. Dış bağımlılık yok; hepsi çizgi tabanlı, currentColor ile boyanır.

const yollar = {
  tahta: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  geri: 'M15 5l-7 7 7 7',
  ileri: 'M9 5l7 7-7 7',
  tamEkran: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
  tamEkrandanCik: 'M9 4v5H4 M15 4v5h5 M9 20v-5H4 M15 20v-5h5',
  kalem: 'M4 20l4-1L19 8l-3-3L5 16l-1 4z M14 7l3 3',
  silgi: 'M8 20h12 M4.5 14.5l8-8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 18H7.5z M8 11l5 5',
  temizle: 'M5 7h14 M10 7V4h4v3 M7 7l1 13h8l1-13',
  sayac: 'M12 8v5l3 2 M9 2h6 M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  goz: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  gozKapali: 'M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.7 M6.5 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1.1 M9.9 9.9a3 3 0 0 0 4.2 4.2',
  adim: 'M5 12h14 M12 5v14',
  indir: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  yukle: 'M12 20V9 M7 14l5-5 5 5 M5 4h14',
  ayarlar:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  kontrast: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 3v18',
  kapat: 'M6 6l12 12 M18 6L6 18',
  belge: 'M14 3H6v18h12V7z M14 3v4h4 M9 12h6 M9 16h6',
  soru: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  bulut: 'M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z',
  bulutYok: 'M3 3l18 18 M7 18a5 5 0 0 1-1-9.9 M10 6.3A6 6 0 0 1 19 10a4 4 0 0 1 1.7 7.4 M17 18H7',
  tamam: 'M5 12l5 5L20 7',
  durdur: 'M8 5v14 M16 5v14',
  oynat: 'M7 4l13 8-13 8z',
  yenile: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  sekil: 'M3 20L12 4l9 16z',
  kapi: 'M10 17l5-5-5-5 M15 12H3 M14 3h6v18h-6',
} as const

export type SimgeAdi = keyof typeof yollar

export function Simge({ ad, boyut }: { ad: SimgeAdi; boyut?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={boyut}
      height={boyut}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={yollar[ad]} />
    </svg>
  )
}
