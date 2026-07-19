/**
 * Brand logo as a board piece.
 * side: 'you' uses default logo; 'opponent' uses light logo (Other Cursor).
 */
export function BrandPiece({ side = 'you', label, size = 36, frozen = false }) {
  const isOpponent = side === 'opponent';
  const src = isOpponent ? '/brand/logo-icon-light.svg' : '/brand/logo-icon.svg';
  const alt = label || (frozen ? 'Frozen Other Cursor' : isOpponent ? 'Other Cursor' : 'Cursor');

  return (
    <span
      className={[
        'games-piece',
        `games-piece--${isOpponent ? 'opponent' : 'you'}`,
        frozen ? 'games-piece--frozen' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={alt}
    >
      <img src={src} alt="" width={size} height={size} draggable={false} decoding="async" />
    </span>
  );
}
