import { useEffect } from 'react';
import { MonetizationSection } from '../components/monetization/MonetizationSection.jsx';
import { NewsletterSettings } from '../components/newsletter/NewsletterSettings.jsx';
import { PageMeta } from '../components/PageMeta.jsx';
import { useMembership } from '../monetization/useMembership.js';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';

export function NewsletterPage() {
  const pageMeta = getStaticPageMeta('newsletter');
  const membership = useMembership();

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
        <section className="static-page-intro">
          <h1>Email newsletter</h1>
          <p>
            Get a curated digest of Cursor changelog entries, releases, and community highlights.
            The email newsletter is a membership benefit — join below to subscribe.
          </p>
        </section>
        <MonetizationSection membership={membership} />
        <NewsletterSettings membership={membership} />
      </main>
    </AppShell>
  );
}
