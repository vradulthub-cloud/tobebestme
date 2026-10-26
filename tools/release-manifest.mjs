// Writes .claude-plugin/integrity.json: the SHA-256 of every file a ToBeBestMe release ships, which
// the mod checks itself against once a day (Settings › What ToBeBestMe reads), and SHA256SUMS, the
// same list in the format `shasum -a 256 -c` reads, for the release page. Run it as the last step
// before tagging a release: node tools/release-manifest.mjs

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'))
const shipped = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/marketplace.json',
  ...readdirSync(join(ROOT, 'hooks'))
    .filter((n) => /\.(js|json)$/.test(n) && !n.startsWith('._'))
    .sort()
    .map((n) => 'hooks/' + n),
  'types/index.d.ts',
  'LICENSE',
  'TRADEMARKS.md',
  'README.md',
  'SECURITY.md',
]
const files = {}
for (const rel of shipped) files[rel] = createHash('sha256').update(readFileSync(join(ROOT, rel))).digest('hex')
writeFileSync(join(ROOT, '.claude-plugin', 'integrity.json'), JSON.stringify({ name: plugin.name, version: plugin.version, files }, null, 2) + '\n')
writeFileSync(join(ROOT, 'SHA256SUMS'), Object.entries(files).map(([rel, hash]) => hash + '  ' + rel).join('\n') + '\n')
console.log('ToBeBestMe ' + plugin.version + ': ' + shipped.length + ' files hashed into .claude-plugin/integrity.json and SHA256SUMS')
