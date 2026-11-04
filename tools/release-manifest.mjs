// Writes .claude-plugin/integrity.json: the SHA-256 of every file a ToBeBestMe release ships, which
// the mod checks itself against once a day (Settings › What ToBeBestMe reads), and SHA256SUMS, the
// same list in the format `shasum -a 256 -c` reads, for the release page. Run it as the last step
// before tagging a release: node tools/release-manifest.mjs
// (`--check` only compares: it writes nothing and exits 1 when the committed files are stale).

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
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
const manifest = JSON.stringify({ name: plugin.name, version: plugin.version, files }, null, 2) + '\n'
const sums = Object.entries(files).map(([rel, hash]) => hash + '  ' + rel).join('\n') + '\n'
const targets = [[join(ROOT, '.claude-plugin', 'integrity.json'), manifest], [join(ROOT, 'SHA256SUMS'), sums]]
if (process.argv.includes('--check')) {
  const stale = targets.filter(([path, text]) => !existsSync(path) || readFileSync(path, 'utf8') !== text)
  if (stale.length) {
    console.error('Stale: ' + stale.map(([path]) => path.slice(ROOT.length + 1)).join(', ') + '. Run node tools/release-manifest.mjs and commit the result.')
    process.exit(1)
  }
  console.log('ToBeBestMe ' + plugin.version + ': integrity.json and SHA256SUMS match the shipped files')
} else {
  for (const [path, text] of targets) writeFileSync(path, text)
  console.log('ToBeBestMe ' + plugin.version + ': ' + shipped.length + ' files hashed into .claude-plugin/integrity.json and SHA256SUMS')
}
