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

  return {
    define: viteEnvDefines,
    plugins: [react()],
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
