import { defineConfig } from 'vite';

// base relativa: l'app funziona da qualsiasi sottocartella (es. GitHub Pages)
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
