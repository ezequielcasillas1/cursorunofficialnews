import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadProjectEnv } from '../../env/load-env.js';

export default defineConfig(({ mode }) => {
  loadProjectEnv('server');

  const adminSecret =
    process.env.VITE_LOCAL_ADMIN_SECRET ||
    process.env.LOCAL_ADMIN_SECRET ||
    process.env.VITE_INGEST_SECRET ||
    process.env.INGEST_SECRET ||
    '';

  return {
    define: {
      'import.meta.env.VITE_LOCAL_ADMIN_SECRET': JSON.stringify(adminSecret),
    },
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
  };
});
