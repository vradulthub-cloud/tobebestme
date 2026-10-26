import { test, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Session, modCopy } from '../lib/pty.mjs'

// A real workflow, end to end: a Claude Code session on Sonnet is asked to run a two-agent
// workflow on Haiku, and ToBeBestMe has to see it start, show its agents, and list it finished.
// It spends real usage (a few cents), so it runs only with E2E_LIVE=1: npm run test:live. It is a
// real session, saved like any other, so its run and its cost show in your own records afterwards.

const E2E = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOD = join(E2E, '..')
const SHOTS = join(E2E, '.out', 'shots')
// a name of this run's own, so a run left in the records by an earlier test can't pass for this one
const NAME = 'e2e-check-' + Date.now().toString(36)
const SCRIPT = `export const meta = { name: '${NAME}', description: 'Two tiny agents that each answer one word', phases: [{ title: 'Answer' }] }
await parallel([1, 2].map((i) => () => agent('Reply with the single word ok' + i + ' and nothing else. Use no tools.', { label: 'answer-' + i, phase: 'Answer', model: 'haiku' })))`

test.skip(!process.env.E2E_LIVE, 'spends real usage; set E2E_LIVE=1 to run it')

test('a real workflow is seen starting, its agents counted, and listed finished', async ({ page }) => {
  // a session of its own, saved like any other, so the run leaves the records a person's would
  const s = new Session({ args: ['--model', 'sonnet', '--allowedTools', 'Workflow'], cwd: join(MOD, '..'), cols: 160, rows: 50, env: { CLAUDE_CODE_PLUGIN_DIRS: modCopy() }, unset: ['CLAUDE_CODE_CHILD_SESSION'] })
  try {
    await s.waitFor('❯', { timeout: 60_000, what: 'the prompt' })
    await s.settle(1500)
    s.paste('Run a workflow with exactly this script, unchanged, then tell me it finished:\n' + SCRIPT)
    // long input arrives as a paste; Return goes once the box has taken it all
    await s.settle(1200)
    s.send('\r')
    await expect.poll(() => /❯ (Run a workflow|\[Pasted text)/.test(s.screen()), { timeout: 15_000, message: 'the prompt was sent' }).toBe(false)
    // the line above the prompt says the run started, in ToBeBestMe's own words
    await s.waitFor(new RegExp(NAME + ' is running|' + NAME + ' is paused|One workflow is running'), { timeout: 180_000, what: 'ToBeBestMe to show the run' })
    // once it ends, the Workflows tab lists it finished with its two agents
    // ToBeBestMe hears the end by itself, with the pane closed, and says so
    await s.waitFor('Workflow ' + NAME + ' finished', { timeout: 300_000, what: 'ToBeBestMe to say the run finished' })
    await s.settle(1500)
    s.send('/tobebestme workflows')
    await s.settle(800)
    s.send('\r')
    await s.waitFor('[ Settings ]', { timeout: 15_000, what: 'the pane' })
    const screen = await s.waitFor(new RegExp(NAME + '[\\s\\S]*(2 agents|2 of 2)'), { timeout: 60_000, what: 'the run and its agents on the Workflows tab' })
    // the pane (the right-hand side) lists it finished, not running
    const pane = screen.split('\n').map((l) => l.slice(90)).join('\n')
    writeFileSync(join(E2E, '.out', 'live-pane.txt'), pane)
    expect(pane).toMatch(new RegExp(NAME + '[^\\n]*Finished|Finished[^\\n]*' + NAME + '|✓ ' + NAME))
    expect(pane).not.toContain(NAME + ' is running')
    mkdirSync(SHOTS, { recursive: true })
    const html = '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1e1e1e;color:#e6e6e6;font:13px/1.25 Menlo,monospace">' + s.html() + '</body>'
    writeFileSync(join(SHOTS, 'live-workflow.html'), html)
    await page.setContent(html)
    await page.screenshot({ path: join(SHOTS, 'live-workflow.png'), fullPage: true })
  } finally {
    await s.close()
  }
})
