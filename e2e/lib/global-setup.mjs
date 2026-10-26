import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { exportPages, OUT } from './export.mjs'

// Draws every view once before the desktop checks. E2E_SKIP_EXPORT=1 reuses the last drawing.
export default async function globalSetup() {
  if (process.env.E2E_SKIP_EXPORT && existsSync(join(OUT, 'manifest.json'))) return
  const manifest = exportPages()
  if (!manifest.length) throw new Error('The export drew no views')
}
