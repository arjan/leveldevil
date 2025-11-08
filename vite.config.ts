import { defineConfig } from 'vite';

export default defineConfig({
  base: '/leveldevil/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
  },
  server: {
    host: true,
    port: 3000
  }
});

