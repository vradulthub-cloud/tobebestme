// Rewrites the script-src hash in vercel.json's Content-Security-Policy to match the inline <script> in index.html.
// Run after every edit to that script:  node site/tools/hash-csp.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
const dir = join(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(join(dir, 'index.html'), 'utf8')
const m = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
if (m.length !== 1) throw new Error('expected exactly one inline <script>, found ' + m.length)
const hash = "'sha256-" + createHash('sha256').update(m[0][1]).digest('base64') + "'"
const path = join(dir, 'vercel.json')
const cfg = JSON.parse(readFileSync(path, 'utf8'))
for (const rule of cfg.headers) for (const h of rule.headers) if (h.key === 'Content-Security-Policy') h.value = h.value.replace(/script-src [^;]*/, 'script-src ' + hash)
writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n')
console.log('script-src', hash)
