import { useEffect, useState } from 'react';
import { fetchVisitorStats } from '../services/visitorStatsApi.js';

const REFRESH_MS = 120_000;

export function useVisitorStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let intervalId;

    const load = () => {
      fetchVisitorStats()
        .then((data) => {
          if (!cancelled) {
            setStats(data);
            setError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    };

    load();
    intervalId = setInterval(load, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return { stats, error };
}
