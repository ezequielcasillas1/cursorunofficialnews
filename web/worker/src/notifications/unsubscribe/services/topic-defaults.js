export const DEFAULT_RESUBSCRIBE_CATEGORIES = ['changelog', 'release', 'blog'];

export function resolveDefaultCategories(previousCategories = []) {
  return previousCategories.length > 0
    ? previousCategories
    : DEFAULT_RESUBSCRIBE_CATEGORIES;
}
