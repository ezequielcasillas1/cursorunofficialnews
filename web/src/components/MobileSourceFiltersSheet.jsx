import { useEffect, useState } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';
import { SourceFilterForm } from './SourceFilterForm.jsx';

export function MobileSourceFiltersSheet({
  selectedCategory,
  categoryFilter,
  sources = [],
  onCategoryFilterChange,
}) {
  const tabSources = getSourcesForCategoryTab(sources, selectedCategory);
  const normalizedCommitted = normalizeCategoryFilter(categoryFilter);
  const activeCount = countActiveCategoryFilters(normalizedCommitted);
  const summaryShort = isCategoryFilterActive(normalizedCommitted)
    ? summarizeCategoryFilter(normalizedCommitted, tabSources)
    : 'All sources in this section';

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(normalizedCommitted);

  useEffect(() => {
    if (open) {
      setDraft(normalizeCategoryFilter(categoryFilter));
    }
  }, [open, categoryFilter]);

  useEffect(() => {
    if (!open) {
      setDraft(normalizeCategoryFilter(categoryFilter));
    }
  }, [categoryFilter, open]);

  function updateDraft(next) {
    setDraft(normalizeCategoryFilter(next));
  }

  function handleOfficialToggle() {
    updateDraft({ ...draft, officialOnly: !draft.officialOnly });
  }

  function handleSourceToggle(sourceId) {
    updateDraft(toggleSourceFilter(draft, sourceId));
  }

  function handleClear() {
    updateDraft({ officialOnly: false, sourceIds: null });
  }

  function handleApply() {
    onCategoryFilterChange(draft);
    setOpen(false);
  }

  return (
    <div className="mobile-source-filters md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="mobile-catalog-filters-btn min-h-11 w-full justify-between gap-3 rounded-xl px-4 py-3 text-left sm:min-h-0"
            aria-label="Open source and type filters"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <SlidersHorizontal className="size-4 shrink-0 opacity-70" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sources & types</span>
                <span className="block truncate text-sm font-medium text-foreground">{summaryShort}</span>
              </span>
            </span>
            {activeCount > 0 ? (
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {activeCount}
              </Badge>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Filter</span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton
          className="flex max-h-[88vh] flex-col gap-0 overflow-hidden p-0"
        >
          <SheetHeader className="border-b border-border px-4 pb-3 pt-4 text-left">
            <SheetTitle>Source catalog</SheetTitle>
            <SheetDescription>
              Filters apply to this section only. Use Clear to reset, then Apply to save.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <SourceFilterForm
              idPrefix="mobile-src"
              normalized={draft}
              tabSources={tabSources}
              onOfficialToggle={handleOfficialToggle}
              onSourceToggle={handleSourceToggle}
            />
          </div>
          <SheetFooter className="border-t border-border bg-popover pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full gap-2">
              <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={handleClear}>
                Clear
              </Button>
              <Button type="button" className="min-h-11 flex-1" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {activeCount > 0 ? (
        <p className="mobile-filter-active-hint mt-2 text-xs text-muted-foreground" role="status">
          {activeCount} active {activeCount === 1 ? 'filter' : 'filters'} — open the panel to edit or clear.
        </p>
      ) : null}
    </div>
  );
}
