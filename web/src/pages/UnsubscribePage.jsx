import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';
import {
  fetchNewsletterStatus,
  unsubscribeNewsletter,
  unsubscribeNewsletterByEmail,
} from '../newsletter/services/newsletterApi.js';

const SUCCESS_MESSAGE =
  'You have been unsubscribed from Unofficial Cursor News email digests.';

const EMAIL_SUCCESS_MESSAGE =
  'If that address was subscribed, you will no longer receive Unofficial Cursor News email digests.';

function normalizeEmailInput(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export function UnsubscribePage() {
  const pageMeta = getStaticPageMeta('newsletterUnsubscribe');
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get('token') || '').trim(), [searchParams]);
  const initialEmail = useMemo(
    () => normalizeEmailInput(searchParams.get('email')),
    [searchParams],
  );

  const [email, setEmail] = useState(initialEmail);
  const [resolvedEmail, setResolvedEmail] = useState(initialEmail);
  const [loadingToken, setLoadingToken] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  useEffect(() => {
    setEmail(initialEmail);
    setResolvedEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!token) {
      setLoadingToken(false);
      setTokenValid(null);
      return undefined;
    }

    let cancelled = false;
    setLoadingToken(true);
    setTokenValid(null);
    setErrorMessage('');

    fetchNewsletterStatus(token)
      .then((status) => {
        if (cancelled) return;
        const subscriberEmail = normalizeEmailInput(status?.subscriber?.email);
        if (subscriberEmail) {
          setResolvedEmail(subscriberEmail);
          setEmail(subscriberEmail);
        }
        setTokenValid(Boolean(status?.subscriber));
      })
      .catch(() => {
        if (cancelled) return;
        setTokenValid(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingToken(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitting(true);
      setErrorMessage('');

      try {
        if (token) {
          const result = await unsubscribeNewsletter(token);
          if (!result.removed) {
            throw new Error('This unsubscribe link is invalid or has already been used.');
          }
          setSuccess(true);
          return;
        }

        const normalizedEmail = normalizeEmailInput(email);
        if (!normalizedEmail || !normalizedEmail.includes('@')) {
          throw new Error('Enter a valid email address.');
        }

        await unsubscribeNewsletterByEmail(normalizedEmail);
        setResolvedEmail(normalizedEmail);
        setSuccess(true);
      } catch (err) {
        setErrorMessage(err.message || 'Unsubscribe failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [email, token],
  );

  const showEmailForm = !token || tokenValid === false;
  const confirmLabel = token ? 'Confirm unsubscribe' : 'Unsubscribe';

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
          <h1>Unsubscribe from email digests</h1>
          <p>
            Stop receiving the Unofficial Cursor News email newsletter — curated Cursor
            changelog entries, releases, and community highlights sent to your inbox.
          </p>
        </section>

        <section className="unsubscribe-panel" aria-live="polite">
          {loadingToken ? (
            <p className="hint">Loading your subscription…</p>
          ) : success ? (
            <div className="unsubscribe-success">
              <p className="newsletter-status newsletter-status-success" role="status">
                {token ? SUCCESS_MESSAGE : EMAIL_SUCCESS_MESSAGE}
              </p>
              {resolvedEmail ? (
                <p className="hint">
                  Address: <strong>{resolvedEmail}</strong>
                </p>
              ) : null}
              <p className="hint">
                Changed your mind?{' '}
                <Link to="/newsletter">Manage newsletter settings</Link> on the newsletter page.
              </p>
            </div>
          ) : token && tokenValid === false ? (
            <p className="newsletter-status newsletter-status-error" role="alert">
              This unsubscribe link is invalid or has already been used. Enter your email below
              to unsubscribe, or visit the{' '}
              <Link to="/newsletter">newsletter page</Link>.
            </p>
          ) : null}

          {!success && !loadingToken ? (
            <form className="unsubscribe-form" onSubmit={handleSubmit}>
              {token && tokenValid ? (
                <p className="hint">
                  Confirm you want to stop digest emails
                  {resolvedEmail ? (
                    <>
                      {' '}
                      for <strong>{resolvedEmail}</strong>
                    </>
                  ) : null}
                  .
                </p>
              ) : (
                <>
                  <label className="newsletter-field" htmlFor="unsubscribe-email">
                    <span className="newsletter-field-label">Email address</span>
                    <input
                      id="unsubscribe-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required={showEmailForm}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      disabled={submitting}
                    />
                  </label>
                  <p className="hint">
                    Enter the address that receives our digests. We will remove it from future
                    sends.
                  </p>
                </>
              )}

              {errorMessage ? (
                <p className="newsletter-status newsletter-status-error" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <div className="newsletter-actions">
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? 'Unsubscribing…' : confirmLabel}
                </button>
                <Link className="btn btn-ghost" to="/newsletter">
                  Newsletter settings
                </Link>
              </div>
            </form>
          ) : null}
        </section>
      </main>
    </AppShell>
  );
}
