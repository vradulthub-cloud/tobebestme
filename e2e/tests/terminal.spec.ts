import { test, expect, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Session, modCopy } from '../lib/pty.mjs'

// A real Claude Code session in a real terminal, with ToBeBestMe loaded from this folder: the pane
// opens from its command, every tab answers its key, Show details toggles, Esc closes the pane and
// the line above the prompt stays. Nothing here sends a prompt to a model.
//
// It reads this computer's own Claude Code records, so the screenshots it saves under .out/shots
// show your projects: they stay on this computer (.out is ignored by git).

const E2E = join(dirname(fileURLToPath(import.meta.url)), '..')
const MOD = join(E2E, '..')
const CWD = join(MOD, '..')
const SHOTS = join(E2E, '.out', 'shots')
const TABS = ['Home', 'Workflows', 'This session', 'Usage', 'Skills', 'Settings']

function open(cols: number, rows: number, args: string[] = ['/tobebestme']) {
  return new Session({ args, cwd: CWD, cols, rows, env: { CLAUDE_CODE_PLUGIN_DIRS: modCopy() } })
}

async function shot(page: Page, s: Session, name: string) {
  mkdirSync(SHOTS, { recursive: true })
  const html = '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1e1e1e;color:#e6e6e6;font:13px/1.25 Menlo,monospace">' + s.html() + '</body>'
  writeFileSync(join(SHOTS, name + '.html'), html)
  await page.setContent(html)
  await page.screenshot({ path: join(SHOTS, name + '.png'), fullPage: true })
}

test.describe.configure({ mode: 'serial' })

test.describe('a wide terminal', () => {
  let s: Session
  test.beforeAll(async () => {
    s = open(160, 50)
    await s.waitFor('[ Settings ]', { timeout: 60_000, what: 'the pane' })
    await s.settle(1500)
  })
  test.afterAll(async () => s?.close())

  test('/tobebestme opens the pane on Home, with its tabs and Show details', async ({ page }) => {
    const screen = s.screen()
    for (const tab of TABS) expect(screen).toContain('[ ' + tab + ' ]')
    expect(screen).toContain('[ Show details ]')
    expect(s.highlighted(TABS.map((t) => '[ ' + t + ' ]'))).toEqual(['[ Home ]'])
    expect(screen).toMatch(/Needs you|Nothing is waiting for you/)
    await shot(page, s, 'terminal-home')
  })

  for (const [i, tab] of TABS.entries()) {
    test(`key ${i + 1} opens ${tab} at once`, async ({ page }) => {
      const t0 = Date.now()
      s.send(String(i + 1))
      await expect.poll(() => s.highlighted(TABS.map((t) => '[ ' + t + ' ]')), { timeout: 3000 }).toEqual(['[ ' + tab + ' ]'])
      expect(Date.now() - t0, 'the tab took too long to open').toBeLessThan(2000)
      const screen = await s.settle(500)
      if (tab === 'This session') expect(screen).toContain('How long you can keep going')
      if (tab === 'Settings') expect(screen).toContain('On autopilot')
      if (tab === 'Workflows') expect(screen).toMatch(/workflows? running|Running now/)
      await shot(page, s, 'terminal-' + tab.toLowerCase().replace(/ /g, '-'))
    })
  }

  test('d lays the hover cards out in place, and d again puts them back, ending on Home', async () => {
    // This session's Context tile says what context is only in its hover card, which a terminal
    // draws in place under Show details
    const WHAT = 'Everything Claude re-reads on' // the card's first words; a narrow column wraps the rest
    // after the tabs before it, This session opens at its top, where the tile is: a new tab never
    // keeps the last one's place on the page
    s.send('3')
    await expect.poll(() => s.highlighted(TABS.map((t) => '[ ' + t + ' ]')), { timeout: 3000 }).toEqual(['[ This session ]'])
    await s.settle(400)
    expect(s.screen()).not.toContain(WHAT)
    s.send('d')
    await s.waitFor('[ ✓ Show details ]', { timeout: 3000 })
    await s.waitFor(WHAT, { timeout: 3000, what: 'the Context tile’s card laid out in place' })
    s.send('d')
    await s.waitFor(/\[ Show details \]/, { timeout: 3000 })
    await expect.poll(() => s.screen().includes(WHAT), { timeout: 3000 }).toBe(false)
    s.send('1')
    await expect.poll(() => s.highlighted(TABS.map((t) => '[ ' + t + ' ]')), { timeout: 3000 }).toEqual(['[ Home ]'])
  })

  test('Esc closes the pane; the line above the prompt stays and says where things stand', async ({ page }) => {
    s.send('\x1b')
    await expect.poll(() => s.screen().includes('[ Settings ]'), { timeout: 3000 }).toBe(false)
    const screen = await s.settle(500)
    expect(screen).toMatch(/Context\s+\d+%/)
    await shot(page, s, 'terminal-band')
  })

  test('/tobebestme workflows opens straight on Workflows', async () => {
    s.send('/tobebestme workflows')
    await new Promise((go) => setTimeout(go, 300))
    s.send('\r')
    await s.waitFor('[ Settings ]', { timeout: 10_000, what: 'the pane' })
    await expect.poll(() => s.highlighted(TABS.map((t) => '[ ' + t + ' ]')), { timeout: 3000 }).toEqual(['[ Workflows ]'])
    s.send('\x1b')
  })
})

test.describe('a narrow terminal', () => {
  test('at 80 columns the pane still opens with every tab reachable', async ({ page }) => {
    const s = open(80, 40)
    try {
      await s.waitFor('[ Home ]', { timeout: 60_000, what: 'the pane' })
      await s.settle(1500)
      for (const [i, tab] of TABS.entries()) {
        s.send(String(i + 1))
        await expect.poll(() => s.highlighted(TABS.map((t) => '[ ' + t + ' ]')), { timeout: 3000 }).toEqual(['[ ' + tab + ' ]'])
      }
      await shot(page, s, 'terminal-narrow-settings')
    } finally {
      await s.close()
    }
  })
})
