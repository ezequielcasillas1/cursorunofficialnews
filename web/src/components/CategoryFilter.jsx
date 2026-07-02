import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { Tooltip } from './Tooltip.jsx';
import { CategoryFilterPanel } from './CategoryFilterPanel.jsx';

export function CategoryFilter({
  selectedCategory,
  categoryFilter,
  sources,
  onCategoryChange,
  onCategoryFilterChange,
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
      <CategoryFilterPanel
        selectedCategory={selectedCategory}
        categoryFilter={categoryFilter}
        sources={sources}
        onCategoryFilterChange={onCategoryFilterChange}
      />
    </div>
  );
}
