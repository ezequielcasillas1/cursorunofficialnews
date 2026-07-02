import { MAX_CATEGORY_ITEM_LIMIT } from '../services/topic-options.js';

export function renderTopicList(topicRowsHtml) {
  return `<div class="topics">
  <h2>Email topics</h2>
  <p class="hint topics-hint">Choose which digest topics to receive. For each topic, pick how many headlines (1–${MAX_CATEGORY_ITEM_LIMIT}) to include per email.</p>
  <div class="topic-list">${topicRowsHtml}</div>
</div>`;
}
