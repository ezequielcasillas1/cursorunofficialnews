/**
 * Verify LM Studio OpenAI-compatible API from env.
 * Usage (from mobile/server): node scripts/test-lm-studio.js
 */
import { getLmStudioConfig, isLmStudioConfigured } from '../src/llm/config.js';
import { chatCompletion, pingLmStudio } from '../src/llm/lm-studio-client.js';

async function main() {
  const config = getLmStudioConfig();
  console.log('[lm-studio] baseUrl:', config.baseUrl);
  console.log('[lm-studio] model:', config.model || '(unset)');

  if (!isLmStudioConfigured()) {
    console.error('[lm-studio] Set LM_STUDIO_MODEL to the loaded model id from LM Studio.');
    process.exit(1);
  }

  const status = await pingLmStudio();
  console.log('[lm-studio] ping:', JSON.stringify(status, null, 2));

  if (!status.ok) {
    process.exit(1);
  }

  const { content } = await chatCompletion({
    messages: [{ role: 'user', content: 'Reply with exactly: LM Studio OK' }],
    maxTokens: 32,
  });
  console.log('[lm-studio] chat:', content);
}

main().catch((err) => {
  console.error('[lm-studio]', err.message || err);
  process.exit(1);
});
