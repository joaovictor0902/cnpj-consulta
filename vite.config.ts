import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sefazA1Plugin } from './vite-sefaz-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), sefazA1Plugin()],
  server: {
    proxy: {
      '/auth-nuvemfiscal': {
        target: 'https://auth.nuvemfiscal.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth-nuvemfiscal/, ''),
      },
      '/api-nuvemfiscal': {
        target: 'https://api.nuvemfiscal.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-nuvemfiscal/, ''),
      },
    },
  },
});
