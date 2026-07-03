import { useEffect } from 'react';
import { AboutPanel } from '../components/AboutPanel.jsx';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';

export function AboutPage() {
  const pageMeta = getStaticPageMeta('about');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main static-page">
        <AboutPanel />
      </main>
    </AppShell>
  );
}
