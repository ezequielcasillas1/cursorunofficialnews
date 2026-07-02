import { buildDigestSections } from '../../../../../mobile/shared/notifications/category-limits.js';
import { getSourceMeta } from '../../sources/registry.js';

function filterOfficialItems(items) {
  return (items || []).filter((item) => Boolean(getSourceMeta(item.sourceId)?.isOfficial));
}

/** Build digest sections for a subscriber, honoring officialOnly like the feed nav filter. */
export function buildSubscriberDigestSections(items, subscriber) {
  const sourceItems = subscriber?.officialOnly ? filterOfficialItems(items) : items || [];
  return buildDigestSections(sourceItems, subscriber);
}
