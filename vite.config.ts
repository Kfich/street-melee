import { defineConfig, Plugin } from 'vite';
import { cpSync } from 'fs';
import { resolve } from 'path';

// Copies the `assets/` folder into `dist/assets/` after each production build
// so sprites, audio, and other static files are available at the same relative
// paths used by Phaser's load manager in both dev and production.
function copyAssetsPlugin(): Plugin {
  return {
    name: 'copy-assets',
    apply: 'build',
    closeBundle() {
      cpSync(resolve(__dirname, 'assets'), resolve(__dirname, 'dist/assets'), {
        recursive: true,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [copyAssetsPlugin()],
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Phaser is ~1.5 MB minified; raise the warning threshold so CI stays clean.
    chunkSizeWarningLimit: 1600,
    // Don't ship source maps to end users — they expose full source and add ~11 MB.
    // Set to 'hidden' if you need them for error monitoring (Sentry etc.) without
    // serving them publicly.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split Phaser (~1.5 MB) into its own chunk so the game code chunk stays
        // small and both can be cached independently by the browser.
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  }
});

