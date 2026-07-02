export const RESUBSCRIBE_EMPTY_TOPICS_ERROR =
  'Select at least one topic for email digest.';

export function validateResubscribeCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return { ok: false, error: RESUBSCRIBE_EMPTY_TOPICS_ERROR };
  }
  return { ok: true, categories };
}

export function buildResubscribePayload({ token, categories, categoryLimits, defaultLimit }) {
  const validation = validateResubscribeCategories(categories);
  if (!validation.ok) {
    return validation;
  }

  const limits = {};
  for (const categoryId of validation.categories) {
    limits[categoryId] = categoryLimits?.[categoryId] ?? defaultLimit;
  }

  return {
    ok: true,
    payload: {
      token,
      categories: validation.categories,
      categoryLimits: limits,
    },
  };
}
