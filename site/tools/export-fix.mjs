// Draws the one state the main export leaves out: a fix made in the pane (Skills, Fix description…),
// shown as Now and After with Save change. Same method as e2e/lib/export.mjs on main, which this is
// adapted from; it reads the mod from TBBM_MAIN and writes pages to TBBM_FIX_OUT (default MAIN/e2e/.out/fix).
//
// The runner holds no browser, so a copy of the mod gets one extra test file: the kit's own test
// file with its tests switched off (its stubs and fixtures stay) and three that mount the pane and
// the band in each state and print what they draw. Nothing here changes the mod itself.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// The mod lives on main: point TBBM_MAIN at that checkout (default: the repository this file sits in).
const MAIN = process.env.TBBM_MAIN || join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const { renderPage } = await import(pathToFileURL(join(MAIN, 'e2e', 'lib', 'render.mjs')).href)
const E2E = join(MAIN, 'e2e')
const MOD = join(E2E, '..')
export const OUT = process.env.TBBM_FIX_OUT || join(MAIN, 'e2e', '.out', 'fix')
export const PAGES = join(OUT, 'pages')
const COPY = join(OUT, 'mod')

// Pane widths in cells: a phone, a tablet or a narrow dock, a wide desktop pane, and one made full screen.
export const COLS = [40, 88, 148, 220]
export const CELL_X = 8.4
export const VIEWS = ['all', 'workflows', 'overview', 'usage', 'skills', 'settings', 'band']

const EXPORT_TESTS = `

const e2ePrint = (meta: any, tree: any) => console.log('@@TREE\\t' + JSON.stringify(meta) + '\\t' + JSON.stringify(tree))

kitTest('e2e: a fix made in the pane', { timeoutMs: 120_000 }, async ($: any, on: any) => {
  stubs(on, { ...LOW(), context: { ...LOW().context, breakdown: BREAKDOWN } })
  on('prompt.read', () => ({ value: { text: '', cursor: 0 } }))
  on('prompt.fill', () => ({ isFilled: true }))
  const RUNS: Transcript = { path: '-Users-me-Projects-shop/s9.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/shop', answers: [['2026-10-23T11:00:00Z', 'claude-opus-5-5', 0, 1_000, 0, 0]], skills: { deploy: [2, 1, '2026-10-23T11:00:00Z'], pdf: [0, 3, '2026-10-22T09:00:00Z'], model: [4, 0, '2026-10-23T10:00:00Z'] } }
  transcripts(on, [RUNS], true, [], {}, { files: SKILL_FILES, prompts: ['P\\t4\\t2\\t0\\tmerge and deploy once the checks are green'] })
  on('model.complete', () => ({ value: { isAnswered: true, text: '"Keep running notes for a project: decisions, todos and links. Use when the user says note this, add a note or what did we decide."', usage: USAGE } }))
  on('fs.write', () => ({ value: undefined }))
  await $.command.run({ command: 'tobebestme', args: 'skills' })
  for (const cols of [148, 88, 40]) {
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: cols } } as any)
    await $.command.run({ command: 'tobebestme', args: 'home' })
    await ui.press({ key: 'usage-refresh' })
    await ui.press({ key: 'tab-skills' })
    await new Promise((r) => setTimeout(r, 30))
    await ui.press({ key: 'tab-skills' })
    e2ePrint({ state: 'skills', view: 'skills', cols, details: false }, await ui.drawn())
    await ui.press({ key: 'fix-0' })
    await new Promise((r) => setTimeout(r, 30))
    await ui.press({ key: 'tab-skills' }) // a test's invalidate draws nothing; a view change does
    e2ePrint({ state: 'fix', view: 'skills', cols, details: false }, await ui.drawn())
    await ui.press({ key: 'change-cancel' }).catch(() => undefined) // each width starts clean
    await ui.unmount()
  }
})
`

const skipName = (n) => n.startsWith('._') || n === '.DS_Store'

// Copies the mod without its tests, docs or this folder, and adds the export test file.
function prepare() {
  rmSync(COPY, { recursive: true, force: true })
  mkdirSync(join(COPY, 'tests'), { recursive: true })
  for (const part of ['.claude-plugin', 'hooks', 'types', 'tsconfig.json']) {
    if (existsSync(join(MOD, part))) cpSync(join(MOD, part), join(COPY, part), { recursive: true, filter: (src) => !skipName(basename(src)) && !src.includes('/.claude-plugin/types') })
  }
  const kit = readFileSync(join(MOD, 'tests', 'tobebestme.test.ts'), 'utf8')
  const head = "import { expect, test } from 'claude-code/testing'"
  if (!kit.startsWith(head)) throw new Error('tests/tobebestme.test.ts no longer starts with its kit import; update e2e/lib/export.mjs')
  // the kit's own tests are off here (they run under `claude plugin test`); their helpers stay
  const body = kit.replace(head, "import { expect, test as kitTest } from 'claude-code/testing'\nconst test: any = () => {}\nvoid expect")
  writeFileSync(join(COPY, 'tests', 'export.test.ts'), body + EXPORT_TESTS)
  // a disk without Mac metadata support (exFAT) leaves ._ files beside each new one; the runner
  // would try to load ._export.test.ts as a test
  try {
    execFileSync('dot_clean', [COPY], { stdio: 'ignore' })
  } catch {}
}

export const pageName = (m) => [m.state, m.view, m.cols].join('-') + (m.details ? '-details' : '') + (m.scheme === 'light' ? '-light' : '') + '.html'

// The views also drawn on a light pane: the two real states, at a phone and at a wide desktop width.
const isLit = (m) => (m.state === 'busy' || m.state === 'empty') && (m.cols === 40 || m.cols === 148) && !m.details

export function exportPages({ claude = process.env.CLAUDE_BIN || 'claude' } = {}) {
  prepare()
  // the runner prints a test's console output on stderr and its results on stdout
  const run = spawnSync(claude, ['plugin', 'test', COPY], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
  const results = (run.stdout || '') + (run.error ? String(run.error) : '')
  if (run.status !== 0) throw new Error('The export run failed:\n' + results.slice(-4000) + (run.stderr || '').split('\n').filter((l) => !l.includes('@@TREE')).join('\n').slice(-2000))
  const out = (run.stderr || '') + '\n' + (run.stdout || '')
  rmSync(PAGES, { recursive: true, force: true })
  mkdirSync(PAGES, { recursive: true })
  const manifest = []
  for (const line of out.split('\n')) {
    const m = /@@TREE\t(\{.*?\})\t(.*)$/.exec(line)
    if (!m) continue
    const meta = JSON.parse(m[1])
    const tree = JSON.parse(m[2])
    const name = pageName(meta)
    writeFileSync(join(PAGES, name), renderPage(tree, { width: Math.round(meta.cols * CELL_X) + 28, title: name }))
    writeFileSync(join(PAGES, name.replace(/\.html$/, '.json')), JSON.stringify(tree))
    manifest.push({ ...meta, page: name })
    if (isLit(meta)) {
      const lit = { ...meta, scheme: 'light' }
      const litName = pageName(lit)
      writeFileSync(join(PAGES, litName), renderPage(tree, { width: Math.round(meta.cols * CELL_X) + 28, title: litName, scheme: 'light' }))
      manifest.push({ ...lit, page: litName })
    }
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))
  return manifest
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = exportPages()
  console.log('drew ' + manifest.length + ' views into ' + PAGES)
}
