export const SOURCES_SECTION_ID = 'sources-section';

export function scrollToSourcesSection() {
  document.getElementById(SOURCES_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
