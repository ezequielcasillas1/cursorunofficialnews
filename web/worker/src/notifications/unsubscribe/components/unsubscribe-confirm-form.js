import { escapeHtml } from '../services/escape.js';

/** GET unsubscribe shows this first — blocks link prefetch / scanner auto-unsubscribe (CSRF-style). */
export function renderUnsubscribeConfirmForm(token) {
  const safeToken = escapeHtml(token);
  return `
    <p class="lead">Confirm you want to stop receiving Unofficial Cursor News email digests.</p>
    <form method="POST" action="/api/v1/email/unsubscribe">
      <input type="hidden" name="token" value="${safeToken}">
      <button type="submit" class="btn">Confirm unsubscribe</button>
    </form>`;
}
