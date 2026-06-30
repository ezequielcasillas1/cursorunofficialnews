/** Shared storage key suffix — mobile prepends @ in AsyncStorage wrapper. */
export const TACO_UNLOCKED_STORAGE_KEY = 'cursor_news_taco_unlocked';

/** Features gated behind the taco unlock flow. */
export const TACO_GATED_FEATURES = Object.freeze({
  sources: 'sources',
  search: 'search',
});

export const TACO_UNLOCK_BODY =
  'Source names can go into witness protection, and search stays off the menu until you chip in. A taco (or a kind tip on Buy Me a Coffee) unlocks hidden sources and feed search.';

export const TACO_UNLOCK_CONFIRM_LABEL = 'I bought a taco — unlock features';

export const TACO_SOURCES_HIDDEN_TEASER =
  'Source names are in witness protection. Buy a taco to peek at the full list and unlock search 🌮';
