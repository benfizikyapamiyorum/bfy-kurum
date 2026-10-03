/** Ürünün nötr işareti. Gerçek logo marka kararından sonra public/ altına konur. */
export function UrunIsareti({ boyut = 32 }: { boyut?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={boyut} height={boyut} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--ana)" />
      <path d="M8 22 L16 8 L24 22" fill="none" stroke="var(--ana-yazi)" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="16" cy="18" r="2.6" fill="var(--ana-yazi)" />
    </svg>
  )
}
