import { AdSenseSlot } from './monetization/AdSenseSlot.jsx';

/** In-feed ad slot — shares AdSenseSlot loader and env (VITE_ADSENSE_*). */
export function AdSlot() {
  return <AdSenseSlot className="monetization-slot ad-slot" />;
}
