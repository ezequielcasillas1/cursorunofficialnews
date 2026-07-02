import { FEED_CATEGORIES } from './feedCategories.js';

export const DEFAULT_CATEGORY_FILTER = {
  officialOnly: false,
  /** null = all sources for the tab; non-empty = include only these source ids */
  sourceIds: null,
};

export function createDefaultCategoryFilters() {
  return Object.fromEntries(
    FEED_CATEGORIES.map((cat) => [cat.id, { ...DEFAULT_CATEGORY_FILTER }]),
  );
}

export function normalizeCategoryFilter(filter = {}) {
  const sourceIds = filter.sourceIds;
  return {
    officialOnly: Boolean(filter.officialOnly),
    sourceIds:
      Array.isArray(sourceIds) && sourceIds.length > 0
        ? [...new Set(sourceIds.filter(Boolean))]
        : null,
  };
}

export function normalizeCategoryFilters(categoryFilters = {}) {
  const defaults = createDefaultCategoryFilters();
  const result = { ...defaults };
  for (const cat of FEED_CATEGORIES) {
    if (categoryFilters[cat.id]) {
      result[cat.id] = normalizeCategoryFilter(categoryFilters[cat.id]);
    }
  }
  return result;
}

export function getActiveCategoryFilter(categoryFilters, categoryId) {
  return normalizeCategoryFilter(categoryFilters?.[categoryId] || DEFAULT_CATEGORY_FILTER);
}

export function isCategoryFilterActive(filter) {
  const normalized = normalizeCategoryFilter(filter);
  return normalized.officialOnly || Boolean(normalized.sourceIds?.length);
}

export function countActiveCategoryFilters(filter) {
  const normalized = normalizeCategoryFilter(filter);
  let count = 0;
  if (normalized.officialOnly) count += 1;
  if (normalized.sourceIds?.length) count += 1;
  return count;
}

/** Upgrade legacy `{ category, officialOnly }` prefs to per-tab filters. */
export function migrateFilterPrefs(prefs) {
  if (!prefs || typeof prefs !== 'object') return null;

  const category = FEED_CATEGORIES.some((c) => c.id === prefs.category)
    ? prefs.category
    : 'all';

  if (prefs.categoryFilters) {
    return {
      category,
      categoryFilters: normalizeCategoryFilters(prefs.categoryFilters),
    };
  }

  const categoryFilters = createDefaultCategoryFilters();
  if (typeof prefs.officialOnly === 'boolean') {
    for (const cat of FEED_CATEGORIES) {
      categoryFilters[cat.id] = {
        ...DEFAULT_CATEGORY_FILTER,
        officialOnly: prefs.officialOnly,
      };
    }
  }

  return { category, categoryFilters };
}

export function getSourcesForCategoryTab(sources, categoryId) {
  const enabled = (sources || []).filter((s) => s.enabled !== false);
  const cat = FEED_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat?.apiCategories?.length) return enabled;
  return enabled.filter((s) => cat.apiCategories.includes(s.category));
}

export function buildFeedQueryFilters(activeFilter) {
  const normalized = normalizeCategoryFilter(activeFilter);
  return {
    official: normalized.officialOnly ? true : undefined,
    sources: normalized.sourceIds?.length ? normalized.sourceIds : undefined,
  };
}

export function summarizeCategoryFilter(filter, sourcesForTab = []) {
  const normalized = normalizeCategoryFilter(filter);
  const parts = [];
  if (normalized.officialOnly) parts.push('Official only');
  if (normalized.sourceIds?.length) {
    const names = normalized.sourceIds
      .map((id) => sourcesForTab.find((s) => s.id === id)?.name || id)
      .slice(0, 2);
    const extra = normalized.sourceIds.length - names.length;
    parts.push(
      extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', '),
    );
  }
  return parts.join(' · ');
}

export function toggleSourceFilter(filter, sourceId) {
  const normalized = normalizeCategoryFilter(filter);
  const current = normalized.sourceIds ? [...normalized.sourceIds] : [];
  const index = current.indexOf(sourceId);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(sourceId);
  }
  return normalizeCategoryFilter({
    ...normalized,
    sourceIds: current.length ? current : null,
  });
}
