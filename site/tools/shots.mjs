// Product images for the landing page: the mod's own rendered views (the e2e pages, drawn from
// its real output on the tests' sample data), at three times their size so they stay sharp when shown large.
// Run `node lib/export.mjs` in e2e first.
import { chromium } from '../../e2e/node_modules/playwright-core/index.mjs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
const PAGES = join(HERE, '..', '..', 'e2e', '.out', 'pages')
const OUT = join(HERE, '..', 'img')
const b = await chromium.launch()
async function open(name, width, dpr = 3) {
  const p = await b.newPage({ viewport: { width, height: 3200 }, deviceScaleFactor: dpr, colorScheme: 'dark' })
  await p.goto(pathToFileURL(join(PAGES, name + '.html')).href)
  return p
}
// the box of the section headed `title`: climb from its heading until the box holds the body
const sectionBox = (p, title) => p.evaluate((title) => {
  const head = [...document.querySelectorAll('#pane span.t')].find((s) => s.textContent.trim() === title)
  let el = head
  for (let i = 0; i < 8 && el; i++) { el = el.parentElement; if (el.getBoundingClientRect().height > 140 && el.querySelector('[style*="background"] button')) break }
  const r = el.getBoundingClientRect(); return { x: r.left - 4, y: r.top - 4, width: r.width + 8, height: r.height + 8 }
}, title)
let p = await open('busy-all-148', 1280, 2)
const box = await p.locator('#pane').boundingBox()
await p.screenshot({ path: join(OUT, 'pane.png'), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 1400) } })
p = await open('busy-all-148', 1280)
await p.screenshot({ path: join(OUT, 'needs.png'), clip: await sectionBox(p, 'Needs you') })
await p.screenshot({ path: join(OUT, 'standout.png'), clip: await sectionBox(p, 'What stands out') })
p = await open('busy-band-88', 768)
await p.screenshot({ path: join(OUT, 'band.png'), clip: await p.locator('#pane').boundingBox() })
await b.close()
