import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { FEED_SECTION_GROUPS } from '../config/feedSectionGroups.js';
import { getPathForCategory } from '../routes/feedRoutes.js';
import { Tooltip } from './Tooltip.jsx';
import { CategoryFilterPanel } from './CategoryFilterPanel.jsx';
import { MobileSourceFiltersSheet } from './MobileSourceFiltersSheet.jsx';

const categoryById = Object.fromEntries(FEED_CATEGORIES.map((c) => [c.id, c]));

export function CategoryFilter({
  selectedCategory,
  categoryFilter,
  sources,
  onCategoryFilterChange,
}) {
  return (
    <div className="filter-section sticky top-16 z-40 bg-[var(--color-paper)]/90 backdrop-blur-xl pb-3">
      <span className="filter-label">Sections</span>
      <nav className="feed-section-catalog space-y-4" aria-label="Browse by section">
        {FEED_SECTION_GROUPS.map((group) => (
          <div key={group.id} className="feed-section-catalog-group">
            <h3 className="feed-section-catalog-heading">{group.label}</h3>
            <div className="flex flex-wrap gap-2">
              {group.categoryIds.map((catId) => {
                const cat = categoryById[catId];
                if (!cat) return null;
                const active = selectedCategory === cat.id;
                return (
                  <Tooltip key={cat.id} text={cat.tooltip}>
                    <Button
                      asChild
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      className="catalog-section-chip h-auto min-h-11 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:px-3.5 sm:py-0"
                    >
                      <NavLink to={getPathForCategory(cat.id)} end={cat.id === 'all'}>
                        {cat.label}
                      </NavLink>
                    </Button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="filter-summary-slot mt-4 md:hidden">
        <MobileSourceFiltersSheet
          selectedCategory={selectedCategory}
          categoryFilter={categoryFilter}
          sources={sources}
          onCategoryFilterChange={onCategoryFilterChange}
        />
      </div>
      <CategoryFilterPanel
        selectedCategory={selectedCategory}
        categoryFilter={categoryFilter}
        sources={sources}
        onCategoryFilterChange={onCategoryFilterChange}
      />
    </div>
  );
}
