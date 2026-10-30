// Product shots for the launch assets and the videos: crops of the mod's own rendered views (the e2e pages,
// drawn from the mod's real output with the tests' sample data), at twice their size for sharp images.
// The mod lives on main: run `cd e2e && node lib/export.mjs` there, `node site/tools/export-fix.mjs` here, then
//   TBBM_MAIN=<main checkout> [TBBM_PAGES=<copy of main's e2e/.out/pages>] node launch/shots.mjs
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const MAIN = process.env.TBBM_MAIN || join(HERE, '..')
const { chromium } = await import(pathToFileURL(join(MAIN, 'e2e', 'node_modules', 'playwright-core', 'index.mjs')).href)
const PAGES = process.env.TBBM_PAGES || join(MAIN, 'e2e', '.out', 'pages')
const FIX = process.env.TBBM_FIX_OUT ? join(process.env.TBBM_FIX_OUT, 'pages') : join(MAIN, 'e2e', '.out', 'fix', 'pages')
const OUT = join(HERE, 'shots')

const b = await chromium.launch()
async function open(name, width = 1280, dir = PAGES) {
  const p = await b.newPage({ viewport: { width, height: 3600 }, deviceScaleFactor: 2, colorScheme: 'dark' })
  await p.goto(pathToFileURL(join(dir, name + '.html')).href)
  await p.waitForTimeout(3200) // entrances play once; wait them out
  return p
}
// the box of the section headed `title`: climb from its heading until the box holds the body
const sectionBox = (p, title) => p.evaluate((title) => {
  const head = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === title)
  let el = head
  for (let i = 0; i < 8 && el; i++) { el = el.parentElement; if (el.getBoundingClientRect().height > 140 && el.querySelector('[style*="background"] button')) break }
  const r = el.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }
}, title)
// the hero: from the date to the bottom of the 5-hour limit row (the headline, the week drawing)
const heroBox = (p) => p.evaluate(() => {
  const spans = [...document.querySelectorAll('#pane span.t')]
  const top = spans.find((s) => /^[A-Z][a-z]+day, /.test(s.textContent.trim()))
  const last = spans.filter((s) => /resets in/.test(s.textContent)).map((s) => s.getBoundingClientRect().bottom)
  const pane = document.getElementById('pane').getBoundingClientRect()
  const y = top.getBoundingClientRect().top - 14
  return { x: pane.left + 8, y, width: pane.width - 16, height: Math.max(...last) + 16 - y }
})
const cardOf = (p, label, min = 100) => p.evaluate(([label, min]) => {
  const el = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === label)
  let n = el
  while (n && n.id !== 'pane') {
    n = n.parentElement
    const cs = getComputedStyle(n), r = n.getBoundingClientRect()
    if (r.height > min && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }
  }
  throw new Error('no card for ' + label)
}, [label, min])

let p = await open('busy-all-148')
await p.screenshot({ path: join(OUT, 'hero.png'), clip: await heroBox(p) })
await p.screenshot({ path: join(OUT, 'needs.png'), clip: await sectionBox(p, 'Needs you') })
await p.screenshot({ path: join(OUT, 'now.png'), clip: await cardOf(p, 'Needs your permission') })
await p.screenshot({ path: join(OUT, 'standout.png'), clip: await sectionBox(p, 'What stands out') })
await p.screenshot({ path: join(OUT, 'projects.png'), clip: await sectionBox(p, 'Projects') })
await p.close()

// the demo's frames share one width; each is as tall as its own state (the picked day adds a line)
const frames = ['busy-all-148', 'picked-all-148', 'focused-all-148']
for (const [i, f] of frames.entries()) {
  p = await open(f)
  const box = await heroBox(p)
  await p.screenshot({ path: join(OUT, 'frame-' + i + '.png'), clip: box })
  if (i) await p.screenshot({ path: join(OUT, f.split('-')[0] + '.png'), clip: box })
  console.log('frame-' + i, Math.round(box.width) + ' x ' + Math.round(box.height))
  await p.close()
}

p = await open('busy-band-148')
await p.screenshot({ path: join(OUT, 'band.png'), clip: await p.locator('#pane').boundingBox() })
await p.close()

// the fix made in the pane: the card alone
p = await open('fix-skills-148', 1280, FIX)
const fix = await p.evaluate(() => {
  const head = [...document.querySelectorAll('#pane span.t')].find((s) => /A new description for/.test(s.textContent))
  const btn = [...document.querySelectorAll('#pane button')].find((x) => x.textContent.trim() === 'Save change')
  let card = btn
  while (card && getComputedStyle(card).backgroundColor === 'rgba(0, 0, 0, 0)') card = card.parentElement
  while (card && card.getBoundingClientRect().height < 120) card = card.parentElement
  const pane = document.getElementById('pane').getBoundingClientRect(), r = card.getBoundingClientRect(), h = head.getBoundingClientRect()
  return { x: pane.left + 8, y: h.top - 10, width: pane.width - 16, height: r.bottom + 10 - (h.top - 10) }
})
await p.screenshot({ path: join(OUT, 'fix.png'), clip: fix })
await p.close()
await b.close()
console.log('shots written to', OUT)
