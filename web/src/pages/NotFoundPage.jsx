import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';

export function NotFoundPage() {
  return (
    <AppShell>
      <PageMeta
        title="Page not found — Unofficial Cursor News"
        description="This page does not exist on Unofficial Cursor News."
        path="/404/"
        breadcrumbLabel="Not found"
        robots="noindex, nofollow"
      />
      <main className="app-main static-page">
        <section className="static-page-intro">
          <h1>Page not found</h1>
          <p>
            We could not find that page. Head back to the{' '}
            <Link to="/">Cursor news feed</Link> or browse sections from the menu.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
