import { NavLink } from 'react-router-dom';
import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { getPathForCategory } from '../routes/feedRoutes.js';
import { Tooltip } from './Tooltip.jsx';
import { CategoryFilterPanel } from './CategoryFilterPanel.jsx';

export function CategoryFilter({
  selectedCategory,
  categoryFilter,
  sources,
  onCategoryFilterChange,
}) {
  return (
    <div className="filter-section">
      <span className="filter-label">Sections</span>
      <nav className="category-filter" aria-label="Filter by section">
        {FEED_CATEGORIES.map((cat) => (
          <Tooltip key={cat.id} text={cat.tooltip}>
            <NavLink
              to={getPathForCategory(cat.id)}
              end={cat.id === 'all'}
              className={({ isActive }) =>
                isActive || selectedCategory === cat.id ? 'chip chip-active chip-link' : 'chip chip-link'
              }
            >
              {cat.label}
            </NavLink>
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
