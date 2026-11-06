import {
  countActiveCategoryFilters,
  getSourcesForCategoryTab,
  isCategoryFilterActive,
  normalizeCategoryFilter,
  summarizeCategoryFilter,
  toggleSourceFilter,
} from '../feed/categoryFilterPrefs.js';
import { Button } from '@/components/ui/button';
import { CollapsiblePanel } from './ui/CollapsiblePanel.jsx';
import { SourceFilterForm } from './SourceFilterForm.jsx';

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
      className="category-filter-panel hidden md:block"
      eyebrow="Preferences"
      title="Section filters"
      subtitle="Applies to the selected tab only"
      summary={summary}
      defaultExpanded={activeCount > 0}
    >
      <SourceFilterForm
        idPrefix="desktop-src"
        normalized={normalized}
        tabSources={tabSources}
        onOfficialToggle={handleOfficialToggle}
        onSourceToggle={handleSourceToggle}
      />

      {activeCount > 0 ? (
        <div className="category-filter-actions">
          <Button type="button" variant="link" className="h-auto px-0 text-[11px] uppercase tracking-widest" onClick={handleReset}>
            Reset filters
          </Button>
        </div>
      ) : null}
    </CollapsiblePanel>
  );
}
