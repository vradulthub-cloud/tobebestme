import { defineConfig } from '@playwright/test'

// desktop: every view of the mod drawn as a page and checked in Chromium (layout, hover cards,
// type sizes, names, contrast). terminal: real Claude Code sessions with the mod loaded, driven
// through a pseudo-terminal. live: a real workflow on Sonnet, run only with E2E_LIVE=1.
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  globalSetup: './lib/global-setup.mjs',
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: './.out/report', open: 'never' }]],
  timeout: 60_000,
  projects: [
    { name: 'desktop', testMatch: /desktop\.spec\.ts/, use: { browserName: 'chromium' } },
    // after the desktop checks, so real sessions don't compete with Chromium for the CPU
    { name: 'terminal', testMatch: /terminal\.spec\.ts/, fullyParallel: false, timeout: 180_000, dependencies: ['desktop'] },
    { name: 'live', testMatch: /live-workflow\.spec\.ts/, timeout: 600_000 },
  ],
})
