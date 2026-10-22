import { useEffect } from 'react';
import { SupportPanel } from '../components/support/SupportPanel.jsx';
import { NewsletterSettings } from '../components/newsletter/NewsletterSettings.jsx';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';

export function NewsletterPage() {
  const pageMeta = getStaticPageMeta('newsletter');

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
            Subscribe below with your email — free, with double opt-in confirmation.{' '}
            <a href="/newsletter/unsubscribe/">Unsubscribe</a> anytime. By subscribing you agree to
            our <a href="/terms/">Terms</a> and <a href="/privacy/">Privacy Policy</a>.
          </p>
        </section>
        <SupportPanel />
        <NewsletterSettings />
      </main>
    </AppShell>
  );
}
