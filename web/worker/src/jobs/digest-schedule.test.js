import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurrentDigestSlot,
  getDigestScheduleConfig,
  isScheduledDigestHour,
} from './digest-schedule.js';

test('getDigestScheduleConfig defaults to America/Chicago at 10, 17, 22', () => {
  const config = getDigestScheduleConfig({});
  assert.equal(config.timezone, 'America/Chicago');
  assert.deepEqual(config.hours, [10, 17, 22]);
});

test('getCurrentDigestSlot returns null outside digest hours', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '10,17,22' };
  const noonCt = new Date('2026-07-03T17:00:00.000Z'); // 12:00 CDT
  assert.equal(getCurrentDigestSlot(env, noonCt), null);
  assert.equal(isScheduledDigestHour(env, noonCt), false);
});

test('getCurrentDigestSlot matches 10am Central', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '10,17,22' };
  const tenAmCt = new Date('2026-07-03T15:00:00.000Z'); // 10:00 CDT
  assert.equal(getCurrentDigestSlot(env, tenAmCt), '2026-07-03-10');
  assert.equal(isScheduledDigestHour(env, tenAmCt), true);
});

test('getCurrentDigestSlot matches 5pm and 10pm Central', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '10,17,22' };
  const fivePmCt = new Date('2026-07-03T22:00:00.000Z');
  const tenPmCt = new Date('2026-07-04T03:00:00.000Z');
  assert.equal(getCurrentDigestSlot(env, fivePmCt), '2026-07-03-17');
  assert.equal(getCurrentDigestSlot(env, tenPmCt), '2026-07-03-22');
});
