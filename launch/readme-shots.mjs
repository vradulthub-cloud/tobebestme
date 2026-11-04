// The pictures in the README on main: crops of the mod's own rendered views (the e2e pages, drawn from its real
// output on the tests' sample data) at twice their size, and the demo GIF. Run it after `cd e2e && node lib/export.mjs`
// in the main checkout, and write straight into main's assets folder:
//   TBBM_MAIN=<main checkout> [TBBM_PAGES=<copy of main's e2e/.out/pages>] node launch/readme-shots.mjs [out dir]
// The crops end at a heading that is in the page (not at a fixed height), so a change to a tab that moves things
// keeps them whole. Playwright comes from main's e2e/node_modules.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
const MAIN = process.env.TBBM_MAIN || join(HERE, '..')
const { chromium } = await import(pathToFileURL(join(MAIN, 'e2e', 'node_modules', 'playwright-core', 'index.mjs')).href)
const PAGES = process.env.TBBM_PAGES || join(MAIN, 'e2e', '.out', 'pages')
const OUT = process.argv[2] || join(MAIN, 'assets')
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch()
async function open(name, dpr = 2) {
  const p = await b.newPage({ viewport: { width: 1280, height: 3600 }, deviceScaleFactor: dpr, colorScheme: 'dark' })
  await p.goto(pathToFileURL(join(PAGES, name + '.html')).href)
  await p.waitForTimeout(3200) // entrances play once; wait them out
  return p
}
// bottom of the lowest visible span whose text matches `re`
const bottomOf = (p, re) => p.evaluate(([src]) => {
  const r = new RegExp(src)
  const l = [...document.querySelectorAll('#pane span.t')].filter((s) => r.test(s.textContent) && s.getBoundingClientRect().height > 0)
  return l.length ? Math.max(...l.map((s) => s.getBoundingClientRect().bottom)) : null
}, [re.source])
const topOf = (p, text) => p.evaluate((t) => { const s = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === t); return s ? s.getBoundingClientRect().top : null }, text)
const sectionBox = (p, title) => p.evaluate((title) => {
  const head = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === title)
  let el = head
  for (let i = 0; i < 8 && el; i++) { el = el.parentElement; if (el.getBoundingClientRect().height > 140 && el.querySelector('[style*="background"] button')) break }
  const r = el.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }
}, title)
const W = 1271 // the pane's width in CSS pixels at 148 columns
const top = (h) => ({ x: 0, y: 0, width: W, height: h })
const need = (v, what) => { if (v === null || v === undefined) throw new Error('not in the page: ' + what); return v }

let p = await open('busy-all-148')
await p.screenshot({ path: join(OUT, 'home-week.png'), clip: top(Math.round(need(await bottomOf(p, /resets in/), 'the limit rows') + 16)) })
await p.screenshot({ path: join(OUT, 'home-needs-you.png'), clip: await sectionBox(p, 'Needs you') })
await p.screenshot({ path: join(OUT, 'home-saves.png'), clip: await sectionBox(p, 'What stands out') })
await p.close()

p = await open('busy-workflows-148')
// the run card ends cleanly on the left; the next section's heading sits just under it
await p.screenshot({ path: join(OUT, 'workflows.png'), clip: top(Math.round(need(await topOf(p, 'Ways to spend less'), 'Ways to spend less') - 8)) })
const ways = await sectionBox(p, 'Ways to spend less')
ways.height = 326 // the two bars, their words and the first idea
await p.screenshot({ path: join(OUT, 'workflows-savings.png'), clip: ways })
await p.close()

for (const [view, file, heading] of [['overview', 'session.png', 'Make the chat smaller'], ['usage', 'usage.png', 'Weekly limit'], ['skills', 'skills.png', 'Where the listing goes']]) {
  p = await open('busy-' + view + '-148')
  await p.screenshot({ path: join(OUT, file), clip: top(Math.round(need(await topOf(p, heading), heading) - 8)) })
  await p.close()
}

// the demo: the top of Home with the week drawn by project, then a day picked out, then a project
const frames = mkdtempSync(join(tmpdir(), 'tbbm-demo-'))
for (const [i, name] of ['busy', 'picked', 'focused'].entries()) {
  p = await open(name + '-all-148', 1)
  await p.screenshot({ path: join(frames, 'g' + i + '.png'), clip: { x: 0, y: 0, width: 1280, height: 550 } })
  await p.close()
}
await b.close()
const F = 0.45
const ff = (...args) => execFileSync(process.env.FFMPEG || 'ffmpeg', ['-loglevel', 'error', '-y', ...args], { cwd: frames })
ff('-loop', '1', '-t', '2.6', '-i', 'g0.png', '-loop', '1', '-t', '2.6', '-i', 'g1.png', '-loop', '1', '-t', '2.6', '-i', 'g2.png', '-loop', '1', '-t', '2.6', '-i', 'g0.png',
  '-filter_complex', `[0][1]xfade=transition=fade:duration=${F}:offset=2.15[a];[a][2]xfade=transition=fade:duration=${F}:offset=4.3[b];[b][3]xfade=transition=fade:duration=${F}:offset=6.45,format=yuv420p,fps=30`,
  '-c:v', 'libx264', '-crf', '18', 'demo.mp4')
ff('-i', 'demo.mp4', '-vf', 'fps=15,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle', '-loop', '0', join(OUT, 'demo.gif'))
console.log('README pictures written to', OUT)
