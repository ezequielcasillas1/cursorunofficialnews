import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurrentDigestSlot,
  getDigestScheduleConfig,
  isScheduledDigestHour,
} from './digest-schedule.js';

test('getDigestScheduleConfig defaults to America/Chicago at 13 (1pm)', () => {
  const config = getDigestScheduleConfig({});
  assert.equal(config.timezone, 'America/Chicago');
  assert.deepEqual(config.hours, [13]);
});

test('getCurrentDigestSlot returns null outside digest hours', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '13' };
  const noonCt = new Date('2026-07-03T17:00:00.000Z'); // 12:00 CDT
  assert.equal(getCurrentDigestSlot(env, noonCt), null);
  assert.equal(isScheduledDigestHour(env, noonCt), false);
});

test('getCurrentDigestSlot returns null at former 10am slot', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '13' };
  const tenAmCt = new Date('2026-07-03T15:00:00.000Z'); // 10:00 CDT
  assert.equal(getCurrentDigestSlot(env, tenAmCt), null);
  assert.equal(isScheduledDigestHour(env, tenAmCt), false);
});

test('getCurrentDigestSlot matches 1pm Central', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '13' };
  const onePmCt = new Date('2026-07-03T18:00:00.000Z'); // 13:00 CDT
  assert.equal(getCurrentDigestSlot(env, onePmCt), '2026-07-03-13');
  assert.equal(isScheduledDigestHour(env, onePmCt), true);
});

test('getCurrentDigestSlot returns null at former 10pm slot', () => {
  const env = { DIGEST_TIMEZONE: 'America/Chicago', DIGEST_HOURS: '13' };
  const tenPmCt = new Date('2026-07-04T03:00:00.000Z'); // 22:00 CDT
  assert.equal(getCurrentDigestSlot(env, tenPmCt), null);
  assert.equal(isScheduledDigestHour(env, tenPmCt), false);
});
