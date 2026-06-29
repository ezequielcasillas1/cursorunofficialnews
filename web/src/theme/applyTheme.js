/** @param {'dark' | 'light'} theme */
export function applyTheme(theme) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}

/** @returns {'dark' | 'light'} */
export function readAppliedTheme() {
  const fromDom = document.documentElement.getAttribute('data-theme');
  return fromDom === 'light' ? 'light' : 'dark';
}
