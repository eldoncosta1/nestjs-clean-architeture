/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    exclude: ['src/**/*.e2e-spec.ts'],
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
