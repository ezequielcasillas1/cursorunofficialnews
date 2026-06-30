import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptCookieConsent,
  hasConsentCookie,
  hasCookieConsent,
} from './storage.js';
import { COOKIE_CONSENT_COOKIE, COOKIE_CONSENT_KEY, CONSENT_ACCEPTED } from './config.js';

const storage = new Map();

test('cookie consent requires localStorage and cookie', () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalDocument = globalThis.document;

  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.document = { cookie: '' };

  try {
    assert.equal(hasCookieConsent(), false);

    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_ACCEPTED);
    assert.equal(hasCookieConsent(), false);

    document.cookie = `${COOKIE_CONSENT_COOKIE}=1`;
    assert.equal(hasCookieConsent(), true);
    assert.equal(hasConsentCookie(), true);

    acceptCookieConsent();
    assert.equal(hasCookieConsent(), true);
  } finally {
    globalThis.localStorage = originalLocalStorage;
    globalThis.document = originalDocument;
    storage.clear();
  }
});
