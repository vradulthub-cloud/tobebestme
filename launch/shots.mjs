// Product shots for the launch assets: crops of the mod's own rendered views (the e2e pages, drawn
// from the mod's real output with the tests' sample data), at twice their size for sharp images.
// Run `node lib/export.mjs` in e2e first.
import { chromium } from '../e2e/node_modules/playwright-core/index.mjs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const PAGES = join(HERE, '..', 'e2e', '.out', 'pages')
const OUT = join(HERE, 'shots')

const b = await chromium.launch()
async function open(name, width = 1280) {
  const p = await b.newPage({ viewport: { width, height: 3200 }, deviceScaleFactor: 2, colorScheme: 'dark' })
  await p.goto(pathToFileURL(join(PAGES, name + '.html')).href)
  return p
}
// the box of the section headed `title`: climb from its heading until the box holds the body
async function sectionBox(p, title) {
  return p.evaluate((title) => {
    const head = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === title)
    let el = head
    for (let i = 0; i < 8 && el; i++) {
      el = el.parentElement
      // the section: the heading's box once it holds the grouped body (a fill) and its controls
      if (el.getBoundingClientRect().height > 140 && el.querySelector('[style*="background"] button')) break
    }
    const r = el.getBoundingClientRect()
    return { x: r.left, y: r.top, width: r.width, height: r.height }
  }, title)
}
// the hero: from the date to the bottom of the last limit row
async function heroBox(p) {
  return p.evaluate(() => {
    const spans = [...document.querySelectorAll('#pane span.t')]
    const top = spans.find((s) => /^[A-Z][a-z]+day, /.test(s.textContent.trim()))
    const last = spans.filter((s) => /resets in/.test(s.textContent)).map((s) => s.getBoundingClientRect().bottom)
    const pane = document.getElementById('pane').getBoundingClientRect()
    const y = top.getBoundingClientRect().top - 14
    return { x: pane.left + 8, y, width: pane.width - 16, height: Math.max(...last) + 16 - y }
  })
}
const pad = (r, n = 0) => ({ x: r.x - n, y: r.y - n, width: r.width + 2 * n, height: r.height + 2 * n })

let p = await open('busy-all-148')
await p.screenshot({ path: join(OUT, 'hero.png'), clip: await heroBox(p) })
await p.screenshot({ path: join(OUT, 'needs.png'), clip: pad(await sectionBox(p, 'Needs you'), 4) })
await p.screenshot({ path: join(OUT, 'standout.png'), clip: pad(await sectionBox(p, 'What stands out'), 4) })
await p.screenshot({ path: join(OUT, 'projects.png'), clip: pad(await sectionBox(p, 'Projects'), 4) })
await p.close()

// the demo's frames share one clip, tall enough for the picked state's extra line
const frames = ['busy-all-148', 'picked-all-148', 'focused-all-148']
const boxes = []
for (const f of frames) {
  p = await open(f)
  boxes.push(await heroBox(p))
  await p.close()
}
const clip = { ...boxes[0], height: Math.max(...boxes.map((x) => x.height)) }
for (const [i, f] of frames.entries()) {
  p = await open(f)
  // each frame its own height: the card grows when the picked day's line appears, as in the app
  await p.screenshot({ path: join(OUT, 'frame-' + i + '.png'), clip: { ...clip, height: (await heroBox(p)).height } })
  if (i) await p.screenshot({ path: join(OUT, f.split('-')[0] + '.png'), clip: await heroBox(p) })
  await p.close()
}

p = await open('busy-band-148')
await p.screenshot({ path: join(OUT, 'band.png'), clip: pad(await p.locator('#pane').boundingBox(), 6) })
await p.close()
await b.close()
console.log('shots written to', OUT)
