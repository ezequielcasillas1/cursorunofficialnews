import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  healthPayload,
  isHealthPath,
  isSiteOffline,
  OFFLINE_MESSAGE,
  offlineResponse,
} from './site-offline.js';

describe('isSiteOffline', () => {
  it('is off when unset', () => {
    assert.equal(isSiteOffline({ ENVIRONMENT: 'production' }), false);
    assert.equal(isSiteOffline(undefined), false);
  });

  it('is on in production when SITE_OFFLINE is true', () => {
    assert.equal(isSiteOffline({ ENVIRONMENT: 'production', SITE_OFFLINE: 'true' }), true);
    assert.equal(isSiteOffline({ SITE_OFFLINE: '1' }), true);
  });

  it('skips local wrangler when ENVIRONMENT=development', () => {
    assert.equal(
      isSiteOffline({ ENVIRONMENT: 'development', SITE_OFFLINE: 'true' }),
      false,
    );
  });
});

describe('isHealthPath', () => {
  it('allows root and API health', () => {
    assert.equal(isHealthPath('/health'), true);
    assert.equal(isHealthPath('/api/health'), true);
    assert.equal(isHealthPath('/api/health/'), true);
    assert.equal(isHealthPath('/api/v1/news'), false);
  });
});

describe('healthPayload', () => {
  it('reports offline when the kill switch is on', () => {
    assert.deepEqual(healthPayload({ SITE_OFFLINE: 'true' }), { ok: true, offline: true });
    assert.deepEqual(healthPayload({ ENVIRONMENT: 'development', SITE_OFFLINE: 'true' }), {
      ok: true,
      offline: false,
    });
  });
});

describe('offlineResponse', () => {
  it('returns 503 plain text by default', () => {
    const res = offlineResponse(new Request('https://example.com/'));
    assert.equal(res.status, 503);
    assert.match(res.headers.get('Content-Type') || '', /text\/plain/);
  });

  it('returns short HTML when Accept prefers it', async () => {
    const res = offlineResponse(
      new Request('https://example.com/', { headers: { Accept: 'text/html' } }),
    );
    assert.equal(res.status, 503);
    assert.match(await res.text(), new RegExp(OFFLINE_MESSAGE));
  });
});
