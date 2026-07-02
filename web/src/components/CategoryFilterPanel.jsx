import {
  countActiveCategoryFilters,
  getSourcesForCategoryTab,
  isCategoryFilterActive,
  normalizeCategoryFilter,
  summarizeCategoryFilter,
  toggleSourceFilter,
} from '../feed/categoryFilterPrefs.js';
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
              <button
                type="button"
                className={
                  normalized.officialOnly
                    ? 'chip chip-official chip-active'
                    : 'chip chip-official'
                }
                aria-pressed={normalized.officialOnly}
                onClick={handleOfficialToggle}
              >
                Official only
              </button>
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
                  <button
                    key={source.id}
                    type="button"
                    className={selected ? 'chip chip-active' : 'chip'}
                    aria-pressed={Boolean(selected)}
                    onClick={() => handleSourceToggle(source.id)}
                  >
                    {source.name}
                    {source.isOfficial ? (
                      <span className="category-filter-source-badge">Official</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeCount > 0 ? (
          <div className="category-filter-actions">
            <button type="button" className="category-filter-reset" onClick={handleReset}>
              Reset filters
            </button>
          </div>
        ) : null}
      </div>
    </CollapsiblePanel>
  );
}
