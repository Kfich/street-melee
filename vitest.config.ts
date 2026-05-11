import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/main.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Redirect all `import Phaser from 'phaser'` in source files to a
      // lightweight stub. The real Phaser loads WebGL/canvas code at module
      // init time which crashes in the jsdom test environment.
      'phaser': path.resolve(__dirname, './tests/__mocks__/phaser.ts'),
    }
  }
});

