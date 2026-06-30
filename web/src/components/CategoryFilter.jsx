import { FEED_CATEGORIES, OFFICIAL_ONLY_TOOLTIP } from '../config/feedCategories.js';
import { Tooltip } from './Tooltip.jsx';

export function CategoryFilter({
  selectedCategory,
  officialOnly,
  onCategoryChange,
  onOfficialOnlyChange,
}) {
  return (
    <div className="filter-section">
      <span className="filter-label">Sections</span>
      <nav className="category-filter" aria-label="Filter by section">
        {FEED_CATEGORIES.map((cat) => (
          <Tooltip key={cat.id} text={cat.tooltip}>
            <button
              type="button"
              className={selectedCategory === cat.id ? 'chip chip-active' : 'chip'}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          </Tooltip>
        ))}
      </nav>
      <div className="official-filter">
        <Tooltip text={OFFICIAL_ONLY_TOOLTIP}>
          <button
            type="button"
            className={
              officialOnly ? 'chip chip-official chip-active' : 'chip chip-official'
            }
            aria-pressed={officialOnly}
            onClick={() => onOfficialOnlyChange(!officialOnly)}
          >
            Official only
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
