import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise;

function loadTurnstileScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function TurnstileWidget({ siteKey, action = 'membership-claim', onToken }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey) return undefined;
    let cancelled = false;

    async function renderWidget() {
      try {
        await loadTurnstileScript();
      } catch {
        return;
      }
      if (cancelled || !containerRef.current || !window.turnstile) return;

      const theme =
        document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme,
        callback: (token) => onTokenRef.current?.(token),
        'expired-callback': () => onTokenRef.current?.(''),
        'error-callback': () => onTokenRef.current?.(''),
      });
    }

    renderWidget();

    return () => {
      cancelled = true;
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="taco-turnstile" />;
}
