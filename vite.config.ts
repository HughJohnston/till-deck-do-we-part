import { defineConfig } from 'vite';

export default defineConfig({
  base: '/till-deck-do-we-part/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173,
    open: true,
  },
});
