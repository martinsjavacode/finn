import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/hooks/**', 'src/services/**', 'src/utils/**', 'src/lib/**'],
      exclude: ['src/hooks/index.ts', 'src/hooks/useModal.ts', 'src/hooks/useFocusTrap.ts', 'src/hooks/useOnlineStatus.ts', 'src/lib/supabase.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 95,
      },
    },
  },
})
