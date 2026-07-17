/**
 * Original “why it matters” commentary for item pages.
 * Soft-fails when Workers AI is unavailable — never blocks ingest.
 */

import { chatCompletion, isWorkersAiConfigured } from './workers-ai-client.js';

export const MAX_COMMENTARY_CHARS = 1200;
/** Cap AI calls per ingest so cron stays within Worker CPU limits. */
export const MAX_COMMENTARY_PER_INGEST = 12;
const CONCURRENCY = 3;

function normalizeCommentary(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_COMMENTARY_CHARS);
}

/**
 * @returns {Promise<string>} Original commentary, or '' on failure / unavailable AI.
 */
export async function generateNewsCommentary({ title, excerpt, category, sourceName }, env) {
  if (!isWorkersAiConfigured(env)) return '';

  try {
    const { content } = await chatCompletion(
      {
        messages: [
          {
            role: 'system',
            content: [
              'You write original editorial notes for Unofficial Cursor News, a fan feed about the Cursor code editor.',
              'Write 2–4 short paragraphs (plain text, no markdown, no bullet lists) explaining why the item matters to Cursor users.',
              'Be factual. Do not invent product claims. Do not copy or closely paraphrase long source passages.',
              'Do not include a title, preamble, or “Summary:” label — output only the commentary body.',
              `Keep the whole response under ${MAX_COMMENTARY_CHARS} characters.`,
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              `Title: ${title || ''}`,
              `Category: ${category || 'news'}`,
              `Source: ${sourceName || 'unknown'}`,
              `Teaser excerpt: ${excerpt || '(none)'}`,
            ].join('\n'),
          },
        ],
        maxTokens: 512,
        temperature: 0.45,
      },
      env,
    );
    return normalizeCommentary(content);
  } catch (err) {
    console.warn('[commentary]', err?.message || err);
    return '';
  }
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(pool);
  return results;
}

/**
 * Preserve existing commentary; generate for items that still lack it (capped per run).
 * @param {object[]} items
 * @param {Map<string, string>} existingById
 * @param {object} env
 */
export async function attachCommentaries(items, existingById, env) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const withExisting = items.map((item) => {
    const prior = existingById?.get?.(item.id);
    const commentary = normalizeCommentary(item.commentary || prior || '');
    return { ...item, commentary };
  });

  if (!isWorkersAiConfigured(env)) {
    return withExisting;
  }

  const needing = withExisting.filter((item) => !item.commentary);
  const batch = needing.slice(0, MAX_COMMENTARY_PER_INGEST);
  if (batch.length === 0) return withExisting;

  const generated = await mapPool(batch, CONCURRENCY, (item) =>
    generateNewsCommentary(
      {
        title: item.title,
        excerpt: item.excerpt,
        category: item.category,
        sourceName: item.sourceName || item.attributionLabel,
      },
      env,
    ),
  );

  const byId = new Map(batch.map((item, i) => [item.id, generated[i] || '']));
  return withExisting.map((item) => {
    if (item.commentary) return item;
    const next = byId.get(item.id);
    return next ? { ...item, commentary: next } : item;
  });
}
