import { flattenDigestSections } from '../shared/notifications/category-limits.js';
import { chatCompletion, isWorkersAiConfigured } from './workers-ai-client.js';

const MAX_SUBJECT_CHARS = 78;

function stripWrappingQuotes(text) {
  return String(text || '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim();
}

/**
 * Polish a single headline for email subject / preview. Falls back to original on failure.
 */
export async function polishEmailHeadline(originalTitle, env) {
  const source = String(originalTitle || '').trim();
  if (!source) return source;
  if (!isWorkersAiConfigured(env)) return source;

  try {
    const { content } = await chatCompletion(
      {
        messages: [
          {
            role: 'system',
            content:
              'Rewrite Cursor news headlines for an editorial email digest. Sound polished and prestigious while staying factual. Output ONLY the rewritten headline — no quotes, labels, or preamble. Maximum 78 characters.',
          },
          {
            role: 'user',
            content: `Headline: ${source}`,
          },
        ],
        temperature: 0.5,
        maxTokens: 120,
      },
      env,
    );

    const rewritten = stripWrappingQuotes(content).slice(0, MAX_SUBJECT_CHARS);
    return rewritten || source;
  } catch (error) {
    console.warn('[email] AI title rewrite failed:', error.message || error);
    return source;
  }
}

/** When digest has exactly one headline, polish it for subject/preview (same as server Resend path). */
export async function polishSingleHeadlineSections(sections, env) {
  const flat = flattenDigestSections(sections);
  if (flat.length !== 1) return sections;

  const polishedTitle = await polishEmailHeadline(flat[0].title, env);
  if (!polishedTitle || polishedTitle === flat[0].title) return sections;

  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.id === flat[0].id ? { ...item, title: polishedTitle } : item,
    ),
  }));
}
