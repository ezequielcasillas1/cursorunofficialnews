import { buildLimitOptions } from '../services/limit-options.js';
import { escapeHtml } from '../services/escape.js';

export function renderTopicRow(category, { checked = false, limit = 1 } = {}) {
  const limitOptions = buildLimitOptions(limit);

  return `<div class="topic-row" data-category="${escapeHtml(category.id)}">
  <label class="topic-check">
    <input type="checkbox" name="category" value="${escapeHtml(category.id)}"${checked ? ' checked' : ''} />
  </label>
  <div class="topic-copy">
    <strong>${escapeHtml(category.label)}</strong>
    <small>${escapeHtml(category.description)}</small>
    <label class="topic-limit" data-limit-for="${escapeHtml(category.id)}"${checked ? '' : ' hidden'}>
      <span>Headlines per digest</span>
      <select name="limit-${escapeHtml(category.id)}" aria-label="${escapeHtml(category.label)} headlines per digest">
        ${limitOptions}
      </select>
    </label>
  </div>
</div>`;
}
