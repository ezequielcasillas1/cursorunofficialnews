import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadProjectEnv } from '../env/load-env.js';

export default defineConfig(({ mode }) => {
  loadProjectEnv('web');

  const viteEnvDefines = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VITE_') && value !== undefined) {
      viteEnvDefines[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }

  const plugins = [react()];

  // Optional Google Search Console HTML-tag verification (VITE_GOOGLE_SITE_VERIFICATION).
  plugins.push({
    name: 'inject-google-site-verification',
    transformIndexHtml(html) {
      const code = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
      if (!code) return html;
      const safe = code.replace(/"/g, '&quot;');
      const meta = `<meta name="google-site-verification" content="${safe}" />`;
      return html.replace('</head>', `    ${meta}\n  </head>`);
    },
  });

  return {
    define: viteEnvDefines,
    plugins,
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        // Proxies to `wrangler dev` (npm run dev:api), which now serves the
        // full API under /api/* — no path rewrite needed since the Worker's
        // Hono app is mounted at basePath('/api') itself.
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
  };
});
