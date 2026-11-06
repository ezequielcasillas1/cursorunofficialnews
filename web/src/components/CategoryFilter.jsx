import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { getPathForCategory } from '../routes/feedRoutes.js';
import { Tooltip } from './Tooltip.jsx';
import { CategoryFilterPanel } from './CategoryFilterPanel.jsx';
import { HorizontalScrollRail } from './HorizontalScrollRail.jsx';

export function CategoryFilter({
  selectedCategory,
  categoryFilter,
  sources,
  onCategoryFilterChange,
}) {
  return (
    <div className="filter-section sticky top-16 z-40 bg-[var(--color-paper)]/90 backdrop-blur-xl pb-3">
      <span className="filter-label">Sections</span>
      <HorizontalScrollRail>
        <nav
          className="catalog-chip-row flex flex-wrap gap-2 md:flex-wrap"
          aria-label="Filter by section"
        >
          {FEED_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <Tooltip key={cat.id} text={cat.tooltip}>
                <Button
                  asChild
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className="catalog-section-chip h-auto min-h-11 shrink-0 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:px-3.5 sm:py-0"
                >
                  <NavLink to={getPathForCategory(cat.id)} end={cat.id === 'all'}>
                    {cat.label}
                  </NavLink>
                </Button>
              </Tooltip>
            );
          })}
        </nav>
      </HorizontalScrollRail>
      <CategoryFilterPanel
        selectedCategory={selectedCategory}
        categoryFilter={categoryFilter}
        sources={sources}
        onCategoryFilterChange={onCategoryFilterChange}
      />
    </div>
  );
}
