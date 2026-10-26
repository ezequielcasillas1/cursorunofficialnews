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
          <div className="category-filter-chips">
            <Tooltip text={OFFICIAL_ONLY_TOOLTIP}>
              <Button
                type="button"
                variant={normalized.officialOnly ? 'default' : 'outline'}
                size="sm"
                className="min-h-11 h-11 rounded-full px-3.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                aria-pressed={normalized.officialOnly}
                onClick={handleOfficialToggle}
              >
                Official only
              </Button>
            </Tooltip>
          </div>
        </div>

        {tabSources.length > 0 ? (
          <div className="category-filter-group">
            <span className="category-filter-group-label">Sources</span>
            <p className="category-filter-hint">
              Select one or more sources, or leave all unselected to show everything in
              this section.
            </p>
            <div className="category-filter-chips" role="group" aria-label="Filter by source">
              {tabSources.map((source) => {
                const selected = normalized.sourceIds?.includes(source.id);
                return (
                  <Button
                    key={source.id}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    size="sm"
                    className="min-h-11 h-11 rounded-full px-3.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                    aria-pressed={Boolean(selected)}
                    onClick={() => handleSourceToggle(source.id)}
                  >
                    {source.name}
                    {source.isOfficial ? (
                      <Badge
                        variant={selected ? 'secondary' : 'outline'}
                        className="ml-1 h-4 rounded-sm px-1 text-[9px] uppercase"
                      >
                        Official
                      </Badge>
                    ) : null}
                  </Button>
                );
              })}
            </div>
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
