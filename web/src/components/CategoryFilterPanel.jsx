import {
  countActiveCategoryFilters,
  getSourcesForCategoryTab,
  isCategoryFilterActive,
  normalizeCategoryFilter,
  summarizeCategoryFilter,
  toggleSourceFilter,
} from '../feed/categoryFilterPrefs.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OFFICIAL_ONLY_TOOLTIP } from '../config/feedCategories.js';
import { CollapsiblePanel } from './ui/CollapsiblePanel.jsx';
import { Tooltip } from './Tooltip.jsx';
import { HorizontalScrollRail } from './HorizontalScrollRail.jsx';

export function CategoryFilterPanel({
  selectedCategory,
  categoryFilter,
  sources = [],
  onCategoryFilterChange,
}) {
  const normalized = normalizeCategoryFilter(categoryFilter);
  const tabSources = getSourcesForCategoryTab(sources, selectedCategory);
  const activeCount = countActiveCategoryFilters(normalized);
  const summary = isCategoryFilterActive(normalized)
    ? summarizeCategoryFilter(normalized, tabSources)
    : 'All sources';

  function updateFilter(nextFilter) {
    onCategoryFilterChange(normalizeCategoryFilter(nextFilter));
  }

  function handleOfficialToggle() {
    updateFilter({ ...normalized, officialOnly: !normalized.officialOnly });
  }

  function handleSourceToggle(sourceId) {
    updateFilter(toggleSourceFilter(normalized, sourceId));
  }

  function handleReset() {
    updateFilter({ officialOnly: false, sourceIds: null });
  }

  return (
    <CollapsiblePanel
      className="category-filter-panel"
      eyebrow="Preferences"
      title="Section filters"
      subtitle="Applies to the selected tab only"
      summary={summary}
      defaultExpanded={activeCount > 0}
    >
      <div className="category-filter-groups">
        <div className="category-filter-group">
          <span className="category-filter-group-label">Source type</span>
          <HorizontalScrollRail>
            <div className="catalog-chip-row category-filter-chips flex flex-wrap gap-2 md:flex-wrap">
              <Tooltip text={OFFICIAL_ONLY_TOOLTIP}>
                <Button
                  type="button"
                  variant={normalized.officialOnly ? 'default' : 'outline'}
                  size="sm"
                  className="catalog-filter-chip h-auto min-h-11 shrink-0 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:px-3.5 sm:py-0"
                  aria-pressed={normalized.officialOnly}
                  onClick={handleOfficialToggle}
                >
                  Official only
                </Button>
              </Tooltip>
            </div>
          </HorizontalScrollRail>
        </div>

        {tabSources.length > 0 ? (
          <div className="category-filter-group">
            <span className="category-filter-group-label">Sources</span>
            <p className="category-filter-hint">
              Select one or more sources, or leave all unselected to show everything in
              this section.
            </p>
            <HorizontalScrollRail>
              <div
                className="catalog-chip-row category-filter-chips flex flex-wrap gap-2 md:flex-wrap"
                role="group"
                aria-label="Filter by source"
              >
                {tabSources.map((source) => {
                  const selected = normalized.sourceIds?.includes(source.id);
                  return (
                    <Button
                      key={source.id}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className="catalog-filter-chip inline-flex h-auto min-h-11 max-w-[min(100%,18rem)] shrink-0 items-center gap-1 rounded-full px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:max-w-none sm:px-3.5 sm:py-0"
                      aria-pressed={Boolean(selected)}
                      onClick={() => handleSourceToggle(source.id)}
                    >
                      <span className="min-w-0 whitespace-normal break-words text-left leading-snug sm:whitespace-nowrap sm:break-normal">
                        {source.name}
                      </span>
                      {source.isOfficial ? (
                        <Badge
                          variant={selected ? 'secondary' : 'outline'}
                          className="ml-1 h-4 shrink-0 rounded-sm px-1 text-[9px] uppercase"
                        >
                          Official
                        </Badge>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </HorizontalScrollRail>
          </div>
        ) : null}

        {activeCount > 0 ? (
          <div className="category-filter-actions">
            <Button type="button" variant="link" className="h-auto px-0 text-[11px] uppercase tracking-widest" onClick={handleReset}>
              Reset filters
            </Button>
          </div>
        ) : null}
      </div>
    </CollapsiblePanel>
  );
}
