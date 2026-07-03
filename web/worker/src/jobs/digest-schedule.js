export const DEFAULT_DIGEST_TIMEZONE = 'America/Chicago';
export const DEFAULT_DIGEST_HOURS = [10, 17, 22];

export function getDigestScheduleConfig(env) {
  const timezone = env?.DIGEST_TIMEZONE?.trim() || DEFAULT_DIGEST_TIMEZONE;
  const hoursRaw = env?.DIGEST_HOURS?.trim();
  let hours = DEFAULT_DIGEST_HOURS;

  if (hoursRaw) {
    const parsed = hoursRaw
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value >= 0 && value <= 23);
    if (parsed.length) hours = parsed;
  }

  return { timezone, hours };
}

export function getLocalDateTimeParts(date, timezone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      hour12: false,
      minute: 'numeric',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Stable slot id for idempotency — e.g. 2026-07-03-10 in America/Chicago. */
export function getCurrentDigestSlot(env, now = new Date()) {
  const { timezone, hours } = getDigestScheduleConfig(env);
  const { dateKey, hour } = getLocalDateTimeParts(now, timezone);
  if (!hours.includes(hour)) return null;
  return `${dateKey}-${hour}`;
}

export function isScheduledDigestHour(env, now = new Date()) {
  return getCurrentDigestSlot(env, now) !== null;
}
