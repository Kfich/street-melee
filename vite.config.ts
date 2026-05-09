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
    sourcemap: true
  }
});

