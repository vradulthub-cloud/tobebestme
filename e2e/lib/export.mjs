// Draws every view of ToBeBestMe in the states a person meets it in, through Claude Code's own
// mod test runner, and writes each drawing as a page Chromium can open.
//
// The runner holds no browser, so a copy of the mod gets one extra test file: the kit's own test
// file with its tests switched off (its stubs and fixtures stay) and three that mount the pane and
// the band in each state and print what they draw. Nothing here changes the mod itself.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderPage } from './render.mjs'

const E2E = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOD = join(E2E, '..')
export const OUT = join(E2E, '.out')
export const PAGES = join(OUT, 'pages')
const COPY = join(OUT, 'mod')

// Pane widths in cells: a phone, a tablet or a narrow dock, and a wide desktop pane.
export const COLS = [40, 88, 148]
export const CELL_X = 8.4
export const VIEWS = ['all', 'workflows', 'overview', 'usage', 'skills', 'settings', 'band']

const EXPORT_TESTS = `

// ---- e2e: every view, drawn in each state, printed for the Playwright checks -------------------

const E2E_COLS = ${JSON.stringify(COLS)}
const E2E_TABS = ${JSON.stringify(VIEWS.filter((v) => v !== 'band'))}
const e2ePrint = (meta: any, tree: any) => console.log('@@TREE\\t' + JSON.stringify(meta) + '\\t' + JSON.stringify(tree))

async function e2eDump($: any, state: string) {
  for (const cols of E2E_COLS) {
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: cols } } as any)
    for (const details of cols === 88 ? [false, true] : [false]) {
      if (details) await ui.press({ key: 'details' })
      for (const view of E2E_TABS) {
        await ui.press({ key: 'tab-' + view })
        e2ePrint({ state, view, cols, details }, await ui.drawn())
      }
      if (details) await ui.press({ key: 'details' })
    }
    await ui.unmount()
    const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'desktop', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: cols, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
    e2ePrint({ state, view: 'band', cols, details: false }, await band.drawn())
    await band.unmount()
  }
}

kitTest('e2e: an empty session', { timeoutMs: 120_000 }, async ($: any, on: any) => {
  stubs(on)
  effects(on)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  await e2eDump($, 'empty')
})

kitTest('e2e: a busy day', { timeoutMs: 180_000, options: { notifications: true } }, async ($: any, on: any) => {
  const { store } = stubs(on, { ...HIGH(), rateLimits: [...HIGH().rateLimits, { kind: 'seven_day', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }] })
  effects(on)
  waitingDesk(on, [])
  transcripts(on, [...WAITING, ...WEEK], true, [{ pid: 9, sessionId: 'perm', cwd: '/Users/me/Projects/api', kind: 'interactive', name: 'Release', status: 'waiting', waitingFor: 'permission to run npm publish' }])
  store['runs:v1'] = { wf_1: digest(), wf_2: digest({ runId: 'wf_2', name: 'docs-check', startedAt: NOW - 86_400_000, status: 'killed' }) }
  on('tool.call', (_$: unknown, e: any) => {
    if (e.tool === 'TaskStop') return { result: {}, text: 'stopped' }
    if (e.tool !== 'Workflow') return { result: {}, text: '' }
    return { result: { status: 'async_launched', taskId: 'task9', workflowName: 'review-changes', runId: RUN_ID, summary: 'Review', transcriptDir: '/Users/me/.claude/projects/-p/s1/subagents/workflows/' + RUN_ID }, text: '' }
  })
  workflowSpawns(on)
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'verify:a.ts')
  await spawnAgent($, 2, 'verify:b.ts')
  await $.prompt.submit({ text: 'Please review all the changes on this branch before I open the pull request tomorrow' } as any).catch(() => {})
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const warm = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await warm.press({ key: 'usage-refresh' })
  await warm.unmount()
  await e2eDump($, 'busy')
})

kitTest('e2e: a workflow waiting for an answer', { timeoutMs: 120_000, options: { workflowCheck: 'ask' } }, async ($: any, on: any) => {
  stubs(on)
  effects(on)
  // the question waits in the chat; the pane shows it read-only until it is answered
  const asks: Asks = { questions: [], answers: ['Don’t run'] }
  let answerNow: () => void = () => {}
  asks.gate = new Promise<void>((go) => (answerNow = go))
  workflowTool(on, [], asks)
  workflowSpawns(on)
  const call = $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await settle()
  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  await e2eDump($, 'approval')
  answerNow()
  await call
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

export const pageName = (m) => [m.state, m.view, m.cols].join('-') + (m.details ? '-details' : '') + '.html'

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
  }
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))
  return manifest
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = exportPages()
  console.log('drew ' + manifest.length + ' views into ' + PAGES)
}
