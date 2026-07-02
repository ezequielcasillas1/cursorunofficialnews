import { renderPageShell, renderMessageParagraph } from './components/page-shell.js';
import { renderResubscribeForm } from './components/resubscribe-form.js';
import { buildTopicRowsHtml } from './services/topic-options.js';
import { buildResubscribeClientScript } from './services/resubscribe-client-script.js';
import { resolveDefaultCategories } from './services/topic-defaults.js';

export function buildUnsubscribeHtmlPage({
  success,
  message,
  token = '',
  previousCategories = [],
  previousCategoryLimits = {},
} = {}) {
  const title = success ? 'Unsubscribed' : 'Unsubscribe';
  const showResubscribe = success && token;
  const defaultCategories = resolveDefaultCategories(previousCategories);

  const bodyContent = showResubscribe
    ? renderResubscribeForm({
        topicRowsHtml: buildTopicRowsHtml(defaultCategories, previousCategoryLimits),
        clientScript: buildResubscribeClientScript(token),
      })
    : renderMessageParagraph(message);

  return renderPageShell({ title, bodyContent });
}
