export const OrnekRozeti = () => (
  <span className="rozet ornek" title="Sistemi göstermek için hazırlanmış örnek içerik.">
    ÖRNEK
  </span>
)

export function ZorlukGostergesi({ zorluk }: { zorluk: number }) {
  return (
    <span className="zorluk" aria-label={`Zorluk ${zorluk} / 5`} title={`Zorluk ${zorluk} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= zorluk ? 'dolu' : ''} />
      ))}
    </span>
  )
}
