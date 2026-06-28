import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID, ADSENSE_SLOT_ID, isAdSenseConfigured } from '../../monetization/config.js';

let adsenseScriptPromise;

function isAdSenseScriptPresent() {
  return Boolean(
    document.querySelector('script[data-adsense-client]') ||
      document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'),
  );
}

function loadAdSenseScript(clientId) {
  if (adsenseScriptPromise) return adsenseScriptPromise;

  adsenseScriptPromise = new Promise((resolve, reject) => {
    if (isAdSenseScriptPresent()) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = 'anonymous';
    script.dataset.adsenseClient = clientId;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('AdSense script failed to load'));
    document.head.appendChild(script);
  });

  return adsenseScriptPromise;
}

export function AdSenseSlot({ className = '' }) {
  const slotRef = useRef(null);
  const pushedRef = useRef(false);
  const clientId = ADSENSE_CLIENT_ID || 'ca-pub-5184491334740169';
  const adsEnabled = isAdSenseConfigured() || isAdSenseScriptPresent();

  useEffect(() => {
    if (!adsEnabled || pushedRef.current) return;

    let cancelled = false;

    loadAdSenseScript(clientId)
      .then(() => {
        if (cancelled || !slotRef.current || pushedRef.current) return;
        pushedRef.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          pushedRef.current = false;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [adsEnabled, clientId]);

  if (!adsEnabled) return null;

  return (
    <aside className={`adsense-slot ${className}`.trim()} aria-label="Advertisement">
      <p className="adsense-label">Advertisement</p>
      <ins
        ref={slotRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        {...(ADSENSE_SLOT_ID ? { 'data-ad-slot': ADSENSE_SLOT_ID } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
