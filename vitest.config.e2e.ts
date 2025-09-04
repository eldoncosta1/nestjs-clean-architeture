/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'
import path from 'path'

export default defineConfig({
  test: {
    include: ['src/**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    environment: 'node',
    setupFiles: ['./test/setup-e2e.ts'],
    hookTimeout: 60000, // 60s timeout para setup do banco
    testTimeout: 30000, // 30s timeout para cada teste
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
      },
    }),
  ],
})
