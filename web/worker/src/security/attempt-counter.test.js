import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAttempts,
  peekAttemptCount,
  recordAttempt,
  resetAllAttempts,
} from './attempt-counter.js';

describe('attempt-counter', () => {
  beforeEach(() => {
    resetAllAttempts();
  });

  it('starts at zero and increments without blocking', () => {
    assert.equal(peekAttemptCount('ip:claim:a@b.com'), 0);
    assert.equal(recordAttempt('ip:claim:a@b.com'), 1);
    assert.equal(recordAttempt('ip:claim:a@b.com'), 2);
    assert.equal(peekAttemptCount('ip:claim:a@b.com'), 2);
  });

  it('keeps counting past ten instead of cutting off', () => {
    for (let i = 0; i < 15; i += 1) {
      recordAttempt('burst');
    }
    assert.equal(peekAttemptCount('burst'), 15);
  });

  it('clears a single key', () => {
    recordAttempt('keep');
    recordAttempt('drop');
    clearAttempts('drop');
    assert.equal(peekAttemptCount('keep'), 1);
    assert.equal(peekAttemptCount('drop'), 0);
  });
});
