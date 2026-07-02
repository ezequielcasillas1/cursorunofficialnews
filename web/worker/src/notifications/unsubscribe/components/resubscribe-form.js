import { renderTopicList } from './topic-list.js';

export function renderResubscribeForm({ topicRowsHtml, clientScript }) {
  return `
    <p class="lead">You have been unsubscribed from Unofficial Cursor News email digests.</p>
    <p class="hint">Changed your mind? Choose the topics you want and resubscribe below.</p>
    <form id="resubscribe-form" class="resubscribe-form">
      ${renderTopicList(topicRowsHtml)}
      <p id="form-error" class="form-message form-error" hidden></p>
      <p id="form-success" class="form-message form-success" hidden></p>
      <button type="submit" class="btn" id="resubscribe-btn">Resubscribe</button>
    </form>
    <script>
${clientScript}
    </script>`;
}
