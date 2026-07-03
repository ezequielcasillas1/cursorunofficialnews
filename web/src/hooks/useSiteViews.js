import { useEffect, useState } from 'react';
import { fetchOnlineCount, sendPresenceHeartbeat } from '../services/siteViewsApi.js';

const HEARTBEAT_MS = 45_000;

export function useSiteViews() {
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const syncPresence = () => {
      sendPresenceHeartbeat()
        .then((data) => {
          if (!cancelled && typeof data?.online === 'number') {
            setOnlineCount(data.online);
          }
        })
        .catch(() => {
          fetchOnlineCount()
            .then((data) => {
              if (!cancelled && typeof data?.online === 'number') {
                setOnlineCount(data.online);
              }
            })
            .catch(() => {});
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
