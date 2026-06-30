import { useCallback, useEffect, useState } from 'react';
import { TACO_GATED_FEATURES } from '../../../mobile/shared/taco-unlock/config.js';
import { loadSourcesHidden, saveSourcesHidden } from '../sources/storage.js';
import { loadTacoUnlocked, saveTacoUnlocked } from './storage.js';

export function useTacoUnlock() {
  const [tacoUnlocked, setTacoUnlocked] = useState(false);
  const [sourcesHidden, setSourcesHidden] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTacoUnlocked(loadTacoUnlocked());
    setSourcesHidden(loadSourcesHidden());
    setLoaded(true);
  }, []);

  const hideSources = useCallback(() => {
    setSourcesHidden(true);
    saveSourcesHidden(true);
  }, []);

  const unlockFeatures = useCallback(() => {
    setTacoUnlocked(true);
    setSourcesHidden(false);
    saveTacoUnlocked(true);
    saveSourcesHidden(false);
  }, []);

  const isFeatureUnlocked = useCallback(
    (feature) => {
      if (feature === TACO_GATED_FEATURES.search) return tacoUnlocked;
      if (feature === TACO_GATED_FEATURES.sources) return tacoUnlocked || !sourcesHidden;
      return tacoUnlocked;
    },
    [tacoUnlocked, sourcesHidden],
  );

  return {
    tacoUnlocked,
    sourcesHidden,
    loaded,
    hideSources,
    unlockFeatures,
    unlockSources: unlockFeatures,
    isFeatureUnlocked,
  };
}
