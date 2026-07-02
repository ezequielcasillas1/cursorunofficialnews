import { escapeHtml } from '../services/escape.js';

export const UNSUBSCRIBE_PAGE_STYLES = `
    body { font-family: Georgia, serif; background: #f0ebe3; color: #0a0a0f; margin: 0; padding: 48px 16px; }
    .card { max-width: 560px; margin: 0 auto; background: #fffdf9; border: 1px solid #ddd6c8; border-radius: 8px; padding: 32px; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    h2 { font-family: system-ui, sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #5c5c6a; margin: 0 0 8px; }
    p { line-height: 1.6; color: #5c5c6a; margin: 0 0 12px; }
    p.lead { margin-bottom: 8px; }
    .hint { font-family: system-ui, sans-serif; font-size: 0.875rem; }
    .topics { margin: 24px 0; }
    .topics-hint { margin-bottom: 16px; }
    .topic-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .topic-row { display: flex; gap: 10px; align-items: flex-start; padding: 14px; border: 1px solid #ddd6c8; border-radius: 6px; background: #fff; }
    .topic-check { display: flex; padding-top: 2px; }
    .topic-copy { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .topic-copy strong { font-family: system-ui, sans-serif; font-size: 0.875rem; color: #0a0a0f; }
    .topic-copy small { font-family: system-ui, sans-serif; font-size: 0.76rem; line-height: 1.45; color: #5c5c6a; }
    .topic-limit { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-family: system-ui, sans-serif; font-size: 0.75rem; color: #5c5c6a; }
    .topic-limit select { min-width: 3rem; padding: 4px 6px; border: 1px solid #ddd6c8; border-radius: 4px; background: #fffdf9; font-size: 0.8125rem; }
    .btn { display: inline-block; margin-top: 8px; border: 1px solid #1a2a3e; background: #1a2a3e; color: #fff; padding: 10px 18px; border-radius: 4px; cursor: pointer; font-family: system-ui, sans-serif; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
    .btn:hover:not(:disabled) { background: #243448; border-color: #243448; }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .form-message { font-family: system-ui, sans-serif; font-size: 0.875rem; margin: 12px 0; }
    .form-error { color: #9b1c1c; }
    .form-success { color: #1a5c3a; }`;

export function renderMessageParagraph(message) {
  return `<p>${escapeHtml(message)}</p>`;
}

export function renderPageShell({ title, bodyContent }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} — Unofficial Cursor News</title>
  <style>${UNSUBSCRIBE_PAGE_STYLES}
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    ${bodyContent}
  </div>
</body>
</html>`;
}
