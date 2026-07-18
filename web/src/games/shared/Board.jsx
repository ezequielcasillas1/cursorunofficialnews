/**
 * Presentational grid. Cells are objects with { key, row, col, content, className, onClick, disabled, ariaLabel }.
 */
export function Board({ size, cells, className = '' }) {
  return (
    <div
      className={`games-board ${className}`.trim()}
      style={{ '--games-board-size': size }}
      role="grid"
      aria-rowcount={size}
      aria-colcount={size}
    >
      {cells.map((cell) => (
        <button
          key={cell.key}
          type="button"
          className={`games-cell ${cell.className || ''}`.trim()}
          style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
          onClick={cell.onClick}
          disabled={cell.disabled}
          aria-label={cell.ariaLabel}
          role="gridcell"
        >
          {cell.content}
        </button>
      ))}
    </div>
  );
}
