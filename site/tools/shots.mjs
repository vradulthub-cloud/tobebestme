// Product images for the landing page: the mod's own rendered views (the e2e pages, drawn from
// its real output on the tests' sample data), at three times their size so they stay sharp when shown large.
//
// The mod lives on main. In that checkout run `cd e2e && node lib/export.mjs`, then here
// `node site/tools/export-fix.mjs` (the one state main leaves out), then:
//   TBBM_MAIN=<main checkout> node site/tools/shots.mjs
// Playwright comes from main's e2e/node_modules.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const MAIN = process.env.TBBM_MAIN || join(HERE, '..', '..')
const { chromium } = await import(pathToFileURL(join(MAIN, 'e2e', 'node_modules', 'playwright-core', 'index.mjs')).href)
const PAGES = process.env.TBBM_PAGES || join(MAIN, 'e2e', '.out', 'pages') // a copy of the exported pages is safest: a new export clears the folder first
const FIX = process.env.TBBM_FIX_OUT ? join(process.env.TBBM_FIX_OUT, 'pages') : join(MAIN, 'e2e', '.out', 'fix', 'pages')
const OUT = join(HERE, '..', 'img')
const b = await chromium.launch()
async function open(dir, name, width, dpr = 3) {
  const p = await b.newPage({ viewport: { width, height: 3600 }, deviceScaleFactor: dpr, colorScheme: 'dark' })
  await p.goto(pathToFileURL(join(dir, name + '.html')).href)
  await p.waitForTimeout(3200) // entrances play once; let them finish before the photograph
  return p
}
// the box of the section headed `title`: climb from its heading until the box holds the body
const sectionBox = (p, title) => p.evaluate((title) => {
  const head = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === title)
  let el = head
  for (let i = 0; i < 8 && el; i++) { el = el.parentElement; if (el.getBoundingClientRect().height > 140 && el.querySelector('[style*="background"] button')) break }
  const r = el.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }
}, title)
// from the date to the bottom of the last limit row: the headline, the week drawing and the 5-hour limit
const heroBox = (p) => p.evaluate(() => {
  const spans = [...document.querySelectorAll('#pane span.t')]
  const top = spans.find((s) => /^[A-Z][a-z]+day, /.test(s.textContent.trim()))
  const last = spans.filter((s) => /resets in/.test(s.textContent)).map((s) => s.getBoundingClientRect().bottom)
  const pane = document.getElementById('pane').getBoundingClientRect()
  const y = top.getBoundingClientRect().top - 14
  return { x: pane.left + 8, y, width: pane.width - 16, height: Math.max(...last) + 16 - y }
})
// the card that holds the text: climb until a box with its own fill is taller than `min`
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
// the savings bars: from the head of the first idea to the green "points back" figure
const savingsBox = (p) => p.evaluate(() => {
  const spans = [...document.querySelectorAll('#pane span.t')]
  const head = spans.find((s) => /did \d+% of this week.s work/.test(s.textContent) && /Opus|Sonnet|Haiku/.test(s.textContent))
  const back = [...document.querySelectorAll('#pane text')].find((s) => /points back/.test(s.textContent))
  const sec = head.closest('[style*="background"]').getBoundingClientRect()
  const y = head.getBoundingClientRect().top - 14
  return { x: sec.left, y, width: sec.width, height: back.getBoundingClientRect().bottom + 8 - y }
})

let p = await open(PAGES, 'busy-all-148', 1280, 2)
const box = await p.locator('#pane').boundingBox()
await p.screenshot({ path: join(OUT, 'pane.png'), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 1560) } })
await p.close()

p = await open(PAGES, 'busy-all-148', 1280)
await p.screenshot({ path: join(OUT, 'week.png'), clip: await heroBox(p) })
await p.screenshot({ path: join(OUT, 'needs.png'), clip: await sectionBox(p, 'Needs you') })
await p.screenshot({ path: join(OUT, 'now.png'), clip: await cardOf(p, 'Needs your permission') })
await p.screenshot({ path: join(OUT, 'standout.png'), clip: await sectionBox(p, 'What stands out') })
await p.screenshot({ path: join(OUT, 'savings.png'), clip: await savingsBox(p) })
await p.close()

p = await open(FIX, 'fix-skills-148', 1280)
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

p = await open(PAGES, 'busy-band-88', 768)
await p.screenshot({ path: join(OUT, 'band.png'), clip: await p.locator('#pane').boundingBox() })
await b.close()
console.log('images written to', OUT)
