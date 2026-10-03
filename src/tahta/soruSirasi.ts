import type { Kazanim, Soru } from '../alan/tipler'

export interface KazanimGrubu {
  kazanim: Kazanim
  sorular: Soru[]
}

/** Soruları ünitedeki kazanım sırasına göre gruplar; birden çok kazanımlı soru ilk kazanımında görünür.
 *  Grup içinde kolaydan zora sıralanır. */
export function kazanimaGoreGrupla(sorular: Soru[], kazanimlar: Kazanim[]): KazanimGrubu[] {
  const yerlesen = new Set<string>()
  return kazanimlar
    .map((kazanim) => {
      const grup = sorular
        .filter((s) => !yerlesen.has(s.id) && s.kazanim_idleri.includes(kazanim.id))
        .sort((a, b) => a.zorluk - b.zorluk)
      grup.forEach((s) => yerlesen.add(s.id))
      return { kazanim, sorular: grup }
    })
    .filter((g) => g.sorular.length > 0)
}

export const duzSira = (gruplar: KazanimGrubu[]): Soru[] => gruplar.flatMap((g) => g.sorular)
