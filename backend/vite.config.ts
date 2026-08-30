import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/notes/**', '**/dist/**', '**/.biunote/**']
    }
  },
  build: {
    ssr: 'server.ts',
    outDir: 'dist',
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'server.js',
        format: 'esm'
      }
    }
  }
});
