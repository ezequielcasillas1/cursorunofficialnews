import { useEffect, useState } from 'react';
import { fetchOnlineCount, sendPresenceHeartbeat } from '../services/siteViewsApi.js';

const HEARTBEAT_MS = 45_000;
/** Must stay below server PRESENCE_HEARTBEAT_RATE_MS window for same session/IP. */
const MIN_HEARTBEAT_GAP_MS = 30_000;
const STORAGE_KEY = 'cain_presence_last_hb';

let heartbeatInFlight = null;
let lastHeartbeatAt = 0;

function readStoredHeartbeatAt() {
  try {
    return Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
}

function markHeartbeatSent(at = Date.now()) {
  lastHeartbeatAt = at;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(at));
  } catch {
    // sessionStorage unavailable — in-memory guard still applies this tab
  }
}

function shouldSkipHeartbeat() {
  const last = Math.max(lastHeartbeatAt, readStoredHeartbeatAt());
  return Date.now() - last < MIN_HEARTBEAT_GAP_MS;
}

function throttledPresenceHeartbeat() {
  if (shouldSkipHeartbeat()) {
    return heartbeatInFlight;
  }

  if (heartbeatInFlight) {
    return heartbeatInFlight;
  }

  markHeartbeatSent();

  heartbeatInFlight = sendPresenceHeartbeat().finally(() => {
    heartbeatInFlight = null;
  });

  return heartbeatInFlight;
}

export function useSiteViews() {
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId;
    let hasCount = false;

    const applyOnlineCount = (data) => {
      if (!cancelled && typeof data?.online === 'number') {
        hasCount = true;
        setOnlineCount(data.online);
      }
    };

    const syncPresence = () => {
      const request = throttledPresenceHeartbeat();
      if (!request) {
        if (!hasCount) {
          fetchOnlineCount().then(applyOnlineCount).catch(() => {});
        }
        return;
      }

      request.then(applyOnlineCount).catch(() => {
        fetchOnlineCount().then(applyOnlineCount).catch(() => {});
      });
    };

    syncPresence();
    intervalId = setInterval(syncPresence, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return onlineCount;
}
