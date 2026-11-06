import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OFFICIAL_ONLY_TOOLTIP } from '../config/feedCategories.js';
import { Tooltip } from './Tooltip.jsx';

function formatRegistryCategoryLabel(key) {
  if (!key || key === 'other') return 'Other';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function groupSourcesByRegistryCategory(sources) {
  const groups = new Map();
  for (const source of sources) {
    const key = source.category || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(source);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Official-only toggle + per-source chips, optionally grouped by registry category.
 */
export function SourceFilterForm({
  normalized,
  tabSources,
  onOfficialToggle,
  onSourceToggle,
  idPrefix = 'sf',
}) {
  const grouped = groupSourcesByRegistryCategory(tabSources);

  return (
    <div className="source-filter-form space-y-6">
      <div>
        <span className="category-filter-group-label">Source type</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Tooltip text={OFFICIAL_ONLY_TOOLTIP}>
            <Button
              type="button"
              variant={normalized.officialOnly ? 'default' : 'outline'}
              size="sm"
              className="catalog-filter-chip-tap min-h-11 rounded-full px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:py-0"
              aria-pressed={normalized.officialOnly}
              id={`${idPrefix}-official`}
              onClick={onOfficialToggle}
            >
              Official only
            </Button>
          </Tooltip>
        </div>
      </div>

      {tabSources.length > 0 ? (
        <div className="space-y-5">
          <div>
            <span className="category-filter-group-label">Sources</span>
            <p className="category-filter-hint mt-1">
              Pick one or more feeds, or leave all off to include every source in this section.
            </p>
          </div>
          {grouped.map(([registryCategory, sources]) => (
            <div key={registryCategory} className="source-filter-registry-group">
              <h4 className="source-filter-registry-heading">{formatRegistryCategoryLabel(registryCategory)}</h4>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Sources: ${registryCategory}`}>
                {sources.map((source) => {
                  const selected = normalized.sourceIds?.includes(source.id);
                  return (
                    <Button
                      key={source.id}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className="catalog-filter-chip-tap inline-flex h-auto min-h-11 max-w-full items-center gap-1 rounded-full px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.1em] sm:min-h-8 sm:py-0"
                      aria-pressed={Boolean(selected)}
                      id={`${idPrefix}-src-${source.id}`}
                      onClick={() => onSourceToggle(source.id)}
                    >
                      <span className="min-w-0 text-left leading-snug [overflow-wrap:anywhere]">{source.name}</span>
                      {source.isOfficial ? (
                        <Badge variant={selected ? 'secondary' : 'outline'} className="h-4 shrink-0 rounded-sm px-1 text-[9px] uppercase">
                          Official
                        </Badge>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
