import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        stats: resolve(__dirname, 'stats/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
