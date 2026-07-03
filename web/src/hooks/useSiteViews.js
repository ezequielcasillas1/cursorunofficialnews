import { useEffect, useState } from 'react';
import { fetchViewCount, recordSiteView } from '../services/siteViewsApi.js';

export function useSiteViews() {
  const [viewCount, setViewCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    recordSiteView()
      .then((data) => {
        if (!cancelled && typeof data?.views === 'number') {
          setViewCount(data.views);
        }
      })
      .catch(() => {
        fetchViewCount()
          .then((data) => {
            if (!cancelled && typeof data?.views === 'number') {
              setViewCount(data.views);
            }
          })
          .catch(() => {});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return viewCount;
}
