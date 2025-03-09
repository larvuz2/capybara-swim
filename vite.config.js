import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['three', '@dimforge/rapier3d-compat']
  }
});

// Capybara Swim