import { FEED_CATEGORIES } from '../config/feedCategories.js';

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
          <button
            key={cat.id}
            type="button"
            className={selectedCategory === cat.id ? 'chip chip-active' : 'chip'}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </nav>
      <div className="official-filter">
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
      </div>
    </div>
  );
}
