import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const supabaseUrl = loadEnv(mode, '.', 'VITE_').VITE_SUPABASE_URL
  // Only in the build: the dev server needs inline scripts and websockets for hot reload.
  // GitHub Pages cannot send headers, so the policy goes in a meta tag (frame-ancestors is not possible there).
  const csp = [
    "default-src 'self'",
    `connect-src 'self'${supabaseUrl ? ` ${new URL(supabaseUrl).origin}` : ''}`,
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; ')

  return {
    // GitHub Pages serves the project site under /<repo>/.
    base: '/work-shift-tracker/',
    plugins: [
      react(),
      command === 'build' && {
        name: 'inject-csp',
        transformIndexHtml: () => [
          { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
        ],
      },
    ],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
      exclude: ['e2e/**', 'node_modules/**'],
    },
  }
})
