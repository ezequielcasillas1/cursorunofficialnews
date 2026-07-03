import { useEffect } from 'react';
import { LegalDocument } from '../components/legal/LegalDocument.jsx';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { TERMS_OF_USE } from '../legal/termsContent.js';
import { getStaticPageMeta } from '../seo/pageMeta.js';

export function TermsPage() {
  const pageMeta = getStaticPageMeta('terms');

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
        <LegalDocument document={TERMS_OF_USE} />
      </main>
    </AppShell>
  );
}
