import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['testler/db/**/*.test.ts'],
    fileParallelism: false,
  },
})
