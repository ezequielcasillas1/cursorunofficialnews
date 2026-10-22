import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isKnownBotUserAgent, isAutomatedVisitorRequest } from './visitor-bot.js';

function mockContext({ userAgent, cf } = {}) {
  return {
    req: {
      header(name) {
        if (name.toLowerCase() === 'user-agent') return userAgent;
        return undefined;
      },
      raw: { cf },
    },
  };
}

describe('visitor-bot', () => {
  it('flags common crawler user agents', () => {
    assert.equal(isKnownBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
    assert.equal(isKnownBotUserAgent('curl/8.0.0'), true);
    assert.equal(
      isKnownBotUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      ),
      false,
    );
  });

  it('uses Cloudflare bot management signals when present', () => {
    assert.equal(
      isAutomatedVisitorRequest(
        mockContext({
          userAgent: 'Mozilla/5.0',
          cf: { botManagement: { verifiedBot: true, score: 99 } },
        }),
      ),
      true,
    );
    assert.equal(
      isAutomatedVisitorRequest(
        mockContext({
          userAgent: 'Mozilla/5.0',
          cf: { botManagement: { score: 10 } },
        }),
      ),
      true,
    );
  });
});
