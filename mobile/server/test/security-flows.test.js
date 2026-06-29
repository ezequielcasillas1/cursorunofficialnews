import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  createCorsOptions,
  isAllowedCorsOrigin,
} from '../src/security/cors-options.js';
import {
  isSafeExternalUrl,
  sanitizeExternalUrl,
} from '../../shared/url/safe-external-url.js';

const CLAIM_STORE_PATH = fileURLToPath(
  new URL('../src/store/membership-claim-requests.js', import.meta.url),
);

async function withEnv(overrides, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('sanitizeExternalUrl only keeps safe web URLs', () => {
  assert.equal(
    sanitizeExternalUrl('https://cursor.com/blog/post/#section'),
    'https://cursor.com/blog/post',
  );
  assert.equal(
    sanitizeExternalUrl('https://user:pass@example.com/private'),
    '',
  );
  assert.equal(sanitizeExternalUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeExternalUrl('data:text/html,boom'), '');
  assert.equal(isSafeExternalUrl('http://127.0.0.1:8787/v1/news'), true);
});

test('production CORS rejects unknown origins', async () => {
  await withEnv({ NODE_ENV: 'production', PUBLIC_WEB_BASE: undefined }, async () => {
    assert.equal(isAllowedCorsOrigin('https://cursorunofficial.news'), true);
    assert.equal(isAllowedCorsOrigin('https://www.cursorunofficial.news'), true);
    assert.equal(isAllowedCorsOrigin('https://evil.example'), false);
    assert.equal(isAllowedCorsOrigin(undefined), false);
  });
});

test('development CORS allows local preview origins only', async () => {
  await withEnv({ NODE_ENV: 'development' }, async () => {
    assert.equal(isAllowedCorsOrigin('http://127.0.0.1:5173'), true);
    assert.equal(isAllowedCorsOrigin('http://localhost:4173'), true);
    assert.equal(isAllowedCorsOrigin('https://evil.example'), false);
  });
});

test('CORS options omit headers when request has no origin', () => {
  const options = createCorsOptions();
  let allowed = null;
  options.origin(undefined, (_err, value) => {
    allowed = value;
  });
  assert.equal(allowed, false);
});

test('membership claim tokens are one-time use', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cain-claim-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await withEnv(
    {
      DATA_DIR: tempDir,
      MEMBERSHIP_CLAIM_TTL_MINUTES: '30',
    },
    async () => {
      const moduleUrl = `${pathToFileURL(CLAIM_STORE_PATH).href}?t=${Date.now()}`;
      const claims = await import(moduleUrl);

      const record = claims.createMembershipClaimRequest('User@Example.com');
      assert.equal(record.email, 'user@example.com');
      assert.ok(record.token);

      const consumed = claims.consumeMembershipClaimRequest(record.token);
      assert.equal(consumed.email, 'user@example.com');
      assert.equal(claims.consumeMembershipClaimRequest(record.token), null);
    },
  );
});
