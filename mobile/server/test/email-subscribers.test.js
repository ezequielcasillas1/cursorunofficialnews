import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SUBSCRIBER_STORE_PATH = fileURLToPath(
  new URL('../src/store/email-subscribers.js', import.meta.url),
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

test('newsletter subscribe requires email verification before digests', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cain-email-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await withEnv(
    {
      DATA_DIR: tempDir,
      EMAIL_VERIFY_TTL_MINUTES: '60',
    },
    async () => {
      const moduleUrl = `${pathToFileURL(SUBSCRIBER_STORE_PATH).href}?t=${Date.now()}`;
      const store = await import(moduleUrl);

      const pending = store.subscribeEmail({
        email: 'reader@example.com',
        categories: ['changelog'],
        enabled: true,
      });
      assert.equal(pending.needsVerification, true);
      assert.ok(pending.verificationToken);
      assert.equal(store.isSubscriberVerified(pending.record), false);
      assert.equal(store.getSubscribedEmails().length, 0);

      const verified = store.verifySubscriberByToken(pending.verificationToken);
      assert.equal(verified.email, 'reader@example.com');
      assert.equal(store.isSubscriberVerified(verified), true);
      assert.equal(store.getSubscribedEmails().length, 1);
      assert.equal(store.verifySubscriberByToken(pending.verificationToken), null);
    },
  );
});

test('verified subscribers can update topics without another verification email', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cain-email-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await withEnv({ DATA_DIR: tempDir }, async () => {
    const moduleUrl = `${pathToFileURL(SUBSCRIBER_STORE_PATH).href}?t=${Date.now()}-2`;
    const store = await import(moduleUrl);

    const pending = store.subscribeEmail({
      email: 'reader@example.com',
      categories: ['changelog'],
      enabled: true,
    });
    store.verifySubscriberByToken(pending.verificationToken);

    const updated = store.subscribeEmail({
      email: 'reader@example.com',
      categories: ['changelog', 'blog'],
      enabled: true,
    });
    assert.equal(updated.needsVerification, false);
    assert.equal(updated.record.categories.length, 2);
    assert.equal(store.isSubscriberVerified(updated.record), true);
  });
});

test('categoryLimits persist and clamp to 1–3 per enabled category', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cain-email-limits-'));
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  await withEnv({ DATA_DIR: tempDir }, async () => {
    const moduleUrl = `${pathToFileURL(SUBSCRIBER_STORE_PATH).href}?t=${Date.now()}-limits`;
    const store = await import(moduleUrl);

    const pending = store.subscribeEmail({
      email: 'reader@example.com',
      categories: ['changelog', 'blog'],
      categoryLimits: { changelog: 9, blog: 0 },
      enabled: true,
    });
    store.verifySubscriberByToken(pending.verificationToken);

    const client = store.buildSubscriberForClient(store.getSubscriber('reader@example.com'));
    assert.deepEqual(client.categoryLimits, { changelog: 3, blog: 1 });
  });
});
