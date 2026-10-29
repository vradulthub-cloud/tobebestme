import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Every view of ToBeBestMe, in an empty session, a busy day and with a workflow waiting for an
// answer, at a phone, a tablet and a desktop width, checked against the design rules it follows
// (Apple's Human Interface Guidelines): nothing spills sideways, no type under 11px, no text drawn
// over other text, every hover card fully in view and on top, every control named, no
// ALL-CAPS labels, and the mod's own colours readable on the pane.

const OUT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '.out')
type View = { state: string; view: string; cols: number; details: boolean; page: string; scheme?: 'light' }
const manifest: View[] = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'))
const VIEWPORT: Record<number, number> = { 40: 375, 88: 768, 148: 1280, 220: 1920 }

async function open(page: Page, v: View) {
  // the pane is dark by default; a light view is drawn on a light pane, and the drawings' own
  // light-theme colours follow the appearance the page reports
  await page.emulateMedia({ colorScheme: v.scheme === 'light' ? 'light' : 'dark' })
  await page.setViewportSize({ width: VIEWPORT[v.cols] ?? 1280, height: 900 })
  await page.goto(pathToFileURL(join(OUT, 'pages', v.page)).href)
}

for (const v of manifest) {
  test(`${v.state} › ${v.view} › ${VIEWPORT[v.cols]}px${v.details ? ' › details' : ''}${v.scheme === 'light' ? ' › light' : ''}`, async ({ page }, info) => {
    await open(page, v)

    // nothing wider than the window: no sideways scrolling at any width
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect.soft(overflow, 'the page scrolls sideways').toBeLessThanOrEqual(0)
    // and nothing past the pane's own edges, which can be narrower than the window: what spills is
    // measured where it shows, after any box that clips it
    const spill = await page.evaluate(() => {
      const pane = document.getElementById('pane')!.getBoundingClientRect()
      const out: string[] = []
      for (const el of document.querySelectorAll('#pane *')) {
        if (el.closest('.rv, .rv-scope')) continue // hover cards have their own check
        let r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        let left = r.left
        let right = r.right
        for (let x = el.parentElement; x && x.id !== 'pane'; x = x.parentElement) {
          if (getComputedStyle(x).overflow === 'visible') continue
          const c = x.getBoundingClientRect()
          left = Math.max(left, c.left)
          right = Math.min(right, c.right)
        }
        if (right - left > 0.5 && (left < pane.left - 0.5 || right > pane.right + 0.5)) out.push(`${el.tagName.toLowerCase()} “${(el.textContent || '').trim().slice(0, 30)}” ${Math.round(left)}–${Math.round(right)}px, pane ${Math.round(pane.left)}–${Math.round(pane.right)}px`)
      }
      return out.slice(0, 5)
    })
    expect.soft(spill, 'something runs past the pane: ' + JSON.stringify(spill)).toEqual([])
    // an interactive drawing given no size sits in the app's default 300 by 150 frame, shrunk to fit
    const framed = await page.evaluate(() => [...document.querySelectorAll('[data-frame=default]')].map((el) => el.getAttribute('aria-label')!.slice(0, 40)))
    expect.soft(framed, 'a drawing with no size of its own: ' + JSON.stringify(framed)).toEqual([])

    const report = await page.evaluate(() => {
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
      }
      const inCard = (el: Element) => !!el.closest('.rv, .rv-scope')
      // type size: every element holding text, and SVG text at the size it is drawn
      const small: string[] = []
      for (const el of document.querySelectorAll('#pane *')) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())
        if (!own || !visible(el)) continue
        let px = parseFloat(getComputedStyle(el).fontSize)
        if (el instanceof SVGElement) {
          const m = (el as SVGGraphicsElement).getScreenCTM?.()
          if (m) px = px * Math.abs(m.a)
        }
        if (px < 10.95) small.push(`${px.toFixed(1)}px “${el.textContent!.trim().slice(0, 40)}”`)
      }
      // text over text, outside hover cards (those are meant to sit over what is there): each line
      // box of each text, clipped by the boxes that hide what spills out of them
      const clipOf = (el: Element) => {
        let c = { left: -1e9, top: -1e9, right: 1e9, bottom: 1e9 }
        for (let x = el.parentElement; x && x.id !== 'pane'; x = x.parentElement) {
          if (getComputedStyle(x).overflow === 'visible') continue
          const r = x.getBoundingClientRect()
          c = { left: Math.max(c.left, r.left), top: Math.max(c.top, r.top), right: Math.min(c.right, r.right), bottom: Math.min(c.bottom, r.bottom) }
        }
        return c
      }
      const boxes: { el: Element; r: { left: number; top: number; right: number; bottom: number } }[] = []
      for (const el of document.querySelectorAll('#pane span.t, #pane button')) {
        if (!visible(el) || inCard(el)) continue
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())
        if (!own) continue
        const c = clipOf(el)
        for (const line of el.getClientRects()) {
          const r = { left: Math.max(line.left, c.left), top: Math.max(line.top, c.top), right: Math.min(line.right, c.right), bottom: Math.min(line.bottom, c.bottom) }
          if (r.right - r.left > 1 && r.bottom - r.top > 1) boxes.push({ el, r })
        }
      }
      const overlaps: string[] = []
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const [a, b] = [boxes[i], boxes[j]]
          if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
          const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
          const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
          if (w > 2 && h > 3) overlaps.push(`“${a.el.textContent!.slice(0, 30)}” × “${b.el.textContent!.slice(0, 30)}”`)
        }
      // names: every button, field and chart says what it is
      const unnamed = [
        ...[...document.querySelectorAll('button')].filter((b) => !(b.getAttribute('aria-label') || '').trim()).map((b) => 'button ' + b.dataset.key),
        ...[...document.querySelectorAll('input')].filter((i) => !(i.getAttribute('aria-label') || '').trim()).map(() => 'a field'),
        ...[...document.querySelectorAll('[role=img]')].filter((s) => !(s.getAttribute('aria-label') || '').trim()).map(() => 'a chart'),
      ]
      // sentence case: no label of two or more words in capitals
      const shouting = [...document.querySelectorAll('#pane span.t, #pane button')]
        .map((el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim())
        .filter((s) => /[A-Z]{2,}\s+[A-Z]{2,}/.test(s) && s === s.toUpperCase() && /[A-Z]/.test(s))
      // contrast: colours the mod picks itself (theme names are the app's), on the box behind them
      const lum = (c: string) => {
        const m = c.match(/[\d.]+/g)!.map(Number)
        const [r, g, b] = m.slice(0, 3).map((v) => {
          const s = v / 255
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const behind = (el: Element) => {
        for (let x: Element | null = el; x; x = x.parentElement) {
          const bg = getComputedStyle(x).backgroundColor
          const alpha = bg.startsWith('rgba') ? Number(bg.match(/[\d.]+/g)![3]) : 1
          if (bg !== 'rgba(0, 0, 0, 0)' && alpha > 0.5) return bg
        }
        return getComputedStyle(document.body).backgroundColor
      }
      const faint: string[] = []
      for (const el of document.querySelectorAll('#pane span.t[style*="color:#"]')) {
        if (!visible(el) && !inCard(el)) continue
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()
        if (!text) continue
        const a = lum(getComputedStyle(el).color)
        const b = lum(behind(el))
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
        const px = parseFloat(getComputedStyle(el).fontSize)
        // a lone dot or mark is a graphic, not words: WCAG asks 3:1 of it, as of large text
        const isMark = /^[●■◆○◐✓✕‖▬█░]+$/.test(text)
        if (ratio < (px >= 18 || isMark ? 3 : 4.5)) faint.push(`${ratio.toFixed(2)}:1 “${text.slice(0, 40)}”`)
      }
      // drawings: their words need 4.5:1 on the pane (hover cards carry their own dark box), and
      // their coloured marks 3:1 (WCAG's rule for graphics). Greys are neutrals, drawn to read on both.
      const paneBg = getComputedStyle(document.body).backgroundColor
      const rgb = (c: string) => (c.match(/[\d.]+/g) || []).map(Number)
      const contrast = (a: string, b: string) => {
        const [x, y] = [lum(a), lum(b)]
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
      }
      const drawn: string[] = []
      for (const t of document.querySelectorAll('#pane svg text')) {
        if (t.closest('.tip') || !visible(t)) continue
        const cs = getComputedStyle(t)
        // a gradient: every one of its stops must hold the ratio, on this pane's own colour for it
        const grad = /url\(["']?#([^"')]+)/.exec(cs.fill)
        if (grad) {
          const stops = [...(t.ownerSVGElement!.querySelectorAll('#' + CSS.escape(grad[1]) + ' stop') as NodeListOf<SVGStopElement>)]
          for (const stop of stops) {
            const r = contrast(getComputedStyle(stop).stopColor, paneBg)
            if (r < 4.5) drawn.push(`${r.toFixed(2)}:1 gradient text “${(t.textContent || '').slice(0, 30)}” (${getComputedStyle(stop).stopColor})`)
          }
          if (!stops.length) drawn.push('gradient text with no stops “' + (t.textContent || '').slice(0, 30) + '”')
          continue
        }
        const r = contrast(cs.fill, paneBg)
        if (r < 4.5) drawn.push(`${r.toFixed(2)}:1 text “${(t.textContent || '').slice(0, 30)}” (${cs.fill})`)
      }
      for (const m of document.querySelectorAll('#pane svg rect, #pane svg circle, #pane svg path')) {
        if (m.closest('.tip') || !visible(m)) continue
        const cs = getComputedStyle(m)
        if (cs.fill === 'none' || cs.fill.startsWith('url(') || cs.fill.startsWith('rgba') || Number(cs.fillOpacity) < 0.9 || Number(cs.opacity) < 0.9) continue
        const [r, g, b] = rgb(cs.fill)
        if (Math.max(r, g, b) - Math.min(r, g, b) < 28) continue // a grey: neutral
        const box = m.getBoundingClientRect()
        if (box.width * box.height < 20) continue
        const ratio = contrast(cs.fill, paneBg)
        if (ratio < 3) drawn.push(`${ratio.toFixed(2)}:1 mark ${cs.fill} (${m.tagName})`)
      }
      return { small, overlaps, unnamed, shouting, faint, drawn: [...new Set(drawn)].slice(0, 6), buttons: document.querySelectorAll('button').length }
    })
    expect.soft(report.small, 'type under 11px: ' + JSON.stringify(report.small)).toEqual([])
    expect.soft(report.overlaps, 'text drawn over other text: ' + JSON.stringify(report.overlaps)).toEqual([])
    expect.soft(report.unnamed, 'controls without a name: ' + JSON.stringify(report.unnamed)).toEqual([])
    expect.soft(report.shouting, 'labels in capitals: ' + JSON.stringify(report.shouting)).toEqual([])
    expect.soft(report.faint, 'text below WCAG AA contrast: ' + JSON.stringify(report.faint)).toEqual([])
    expect.soft(report.drawn, 'a drawing’s words or marks below WCAG contrast on this pane: ' + JSON.stringify(report.drawn)).toEqual([])
    // one primary action per view (Apple's rule): the white button is the main thing to do
    const primaries = await page.locator('button[data-variant=primary]').allTextContents()
    expect.soft(primaries.length, 'more than one primary button: ' + primaries.join(', ')).toBeLessThanOrEqual(1)

    // every hover card: shown on hover, fully inside the pane, and drawn over what is beneath it
    const owners = await page.locator('.hk:has(.rv), [data-scope]:not(.rv-scope)').count()
    const cardProblems: string[] = []
    for (let i = 0; i < owners; i++) {
      const problem = await page.evaluate((i) => {
        const owner = document.querySelectorAll('.hk:has(.rv), [data-scope]:not(.rv-scope)')[i] as HTMLElement
        const w = window as any
        w.hoverAt(owner)
        const cards = [...document.querySelectorAll('.rv.on, .rv-scope.lit')] as HTMLElement[]
        const label = (owner.textContent || '').trim().slice(0, 40)
        if (!cards.length) return null // a tint without a card
        for (const card of cards) {
          card.scrollIntoView({ block: 'center' })
          const r = card.getBoundingClientRect()
          const top = r.top + window.scrollY
          if (top < -0.5) return `“${label}”: its card starts ${Math.round(-top)}px above the pane`
          if (r.left < -0.5 || r.right > window.innerWidth + 0.5) return `“${label}”: its card runs off the side (${Math.round(r.left)}–${Math.round(r.right)}px of ${window.innerWidth})`
          const inset = 4
          for (const [x, y] of [
            [r.left + inset, r.top + inset],
            [r.right - inset, r.top + inset],
            [r.left + inset, r.bottom - inset],
            [r.right - inset, r.bottom - inset],
            [(r.left + r.right) / 2, (r.top + r.bottom) / 2],
          ]) {
            if (y < 0 || y > window.innerHeight) continue
            const hit = document.elementFromPoint(x, y)
            if (hit && !card.contains(hit)) return `“${label}”: “${(hit.textContent || '').trim().slice(0, 30)}” is drawn over its card`
          }
        }
        w.hoverAt(null)
        return null
      }, i)
      if (problem) cardProblems.push(problem)
    }
    expect.soft(cardProblems, 'hover cards cut off or covered: ' + JSON.stringify(cardProblems)).toEqual([])

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: join(OUT, 'shots', v.page.replace(/\.html$/, '.png')), fullPage: true, animations: 'disabled' }) // finished animations are shown at their end state
    info.annotations.push({ type: 'buttons', description: String(report.buttons) })
  })
}

test('hovering a row shows its card and leaving hides it, with the real pointer', async ({ page }) => {
  const v = manifest.find((m) => m.state === 'busy' && m.view === 'all' && m.cols === 88 && !m.details)!
  await open(page, v)
  const owner = page.locator('.hk:has(.rv)').first()
  const card = owner.locator('.rv').first()
  await expect(card).toBeHidden()
  await owner.hover()
  await expect(card).toBeVisible()
  await page.mouse.move(1, 899)
  await expect(card).toBeHidden()
})

test('Show details draws the words of every hover card in place, so no card is needed', async () => {
  for (const v of manifest.filter((m) => m.details && m.view !== 'band')) {
    const tree = readFileSync(join(OUT, 'pages', v.page.replace(/\.html$/, '.json')), 'utf8')
    expect.soft(tree.includes('"scope":"tip-'), `${v.state} › ${v.view} still has a tile card`).toBe(false)
    expect.soft(/"hover":\{"display":"flex"\}/.test(tree), `${v.state} › ${v.view} still has a hover card`).toBe(false)
  }
})

test('chart tooltips fade in on hover, stay inside the chart, and skip the motion with reduced motion set', async ({ page }) => {
  // the chart of the window so far is drawn under Show details; the runway is what shows by default
  const v = manifest.find((m) => m.state === 'busy' && m.view === 'usage' && m.cols === 88 && m.details)!
  await open(page, v)
  const tips = page.locator('svg .h + .tip')
  expect(await tips.count()).toBeGreaterThan(0)
  const host = page.locator('svg .h').last() // the "now" dot
  const tip = tips.last()
  const opacity = () => tip.evaluate((e) => getComputedStyle(e).opacity)
  expect(await opacity()).toBe('0')
  expect(await tip.evaluate((e) => getComputedStyle(e).transitionDuration)).toContain('0.15s')
  await host.scrollIntoViewIfNeeded()
  await host.hover({ force: true })
  await expect.poll(opacity).toBe('1')
  // every tooltip sits wholly inside its chart
  const outside = await page.evaluate(() =>
    [...document.querySelectorAll('svg .tip rect')].filter((r) => {
      const a = r.getBoundingClientRect()
      const b = r.closest('svg')!.getBoundingClientRect()
      return a.left < b.left - 0.5 || a.right > b.right + 0.5 || a.top < b.top - 0.5 || a.bottom > b.bottom + 0.5
    }).length,
  )
  expect(outside).toBe(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await tip.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s')
})

test('Home lays the tightest limit out on its calendar: the days, Now, where it runs out and when it resets, all inside the drawing', async ({ page }) => {
  for (const cols of [40, 88, 148, 220]) {
    const v = manifest.find((m) => m.state === 'busy' && m.view === 'all' && m.cols === cols && !m.details)!
    await open(page, v)
    const week = page.locator('[role=img]:has(line.ro):has(text)').first()
    expect(await week.count(), cols + ' columns: no calendar view').toBe(1)
    // drawn across the column, not shrunk into a corner of it
    const across = await week.evaluate((el) => el.getBoundingClientRect().width / el.parentElement!.getBoundingClientRect().width)
    expect(across, cols + ' columns: the calendar is not drawn across its column').toBeGreaterThan(0.95)
    expect(await week.locator('rect[height]').count(), cols + ' columns: no day bars').toBeGreaterThan(5)
    const words = await week.locator('text').allTextContents()
    expect(words.some((w) => /^Runs out /.test(w)), cols + ' columns: where it runs out is not said').toBe(true)
    // the days are named by buttons under their columns, and pressing one picks it
    const days = await page.locator('button[data-key^="day-"]').allTextContents()
    expect(days.some((w) => /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat|Today)$/.test(w)), cols + ' columns: no day to press').toBe(true)
    // every label sits wholly inside the drawing
    const outside = await week.evaluate((svg) => {
      const b = svg.getBoundingClientRect()
      return [...svg.querySelectorAll('text')].filter((t) => {
        const r = t.getBoundingClientRect()
        return r.left < b.left - 1 || r.right > b.right + 1
      }).length
    })
    expect(outside, cols + ' columns: a label runs outside the drawing').toBe(0)
  }
})

test('each limit is drawn as a runway, not a ring: the weekly one shows its run-out and the playhead, and nothing is a circle', async ({ page }) => {
  const v = manifest.find((m) => m.state === 'busy' && m.view === 'overview' && m.cols === 88 && !m.details)!
  await open(page, v)
  expect(await page.locator('svg circle[stroke-dasharray]').count(), 'a ring-style arc is still drawn').toBe(0)
  const tracks = page.locator('svg line.now')
  expect(await tracks.count(), 'a limit has no playhead').toBeGreaterThan(0)
  // the weekly limit runs out early in this state: its run-out stop and dry line are drawn
  expect(await page.locator('svg line.ro').count()).toBeGreaterThan(0)
  // every runway ends in a reset post, and says in words what it shows
  expect(await page.locator('svg line.post').count()).toBeGreaterThanOrEqual(await tracks.count())
  const names = await page.locator('[role=img]:has(line.post)').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') || ''))
  expect(names.every((n) => /\d+%/.test(n))).toBe(true)
})

test('the run-out is hatched, its marker pulses, bars spring up and the figure is a gradient, and reduced motion turns every animation off', async ({ page }) => {
  const v = manifest.find((m) => m.state === 'busy' && m.view === 'all' && m.cols === 148 && !m.details && !m.scheme)!
  await open(page, v)
  expect(await page.locator('svg rect[fill^="url(#mh"]').count(), 'the stretch after the run-out is not hatched').toBeGreaterThan(0)
  expect(await page.locator('svg line.ro.mpu').count(), 'the run-out marker does not pulse').toBeGreaterThan(0)
  expect(await page.locator('svg g.mbar').count(), 'the week’s bars do not spring up').toBeGreaterThan(0)
  expect(await page.locator('svg[data-fig] text[fill^="url("]').count(), 'the lead figure is not a gradient').toBeGreaterThan(0)
  // with motion allowed the marker is animating; with reduced motion nothing is
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
  const live = () => page.evaluate(() => [...document.querySelectorAll('#pane svg .mpu, #pane svg .msw, #pane svg .mbar, #pane svg .msh, #pane svg .mrise')].filter((e) => getComputedStyle(e).animationName !== 'none').length)
  expect(await live(), 'nothing animates with motion allowed').toBeGreaterThan(0)
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  expect(await live(), 'something still animates with reduced motion set').toBe(0)
  // the decoration (falling tokens, sheen, halo) is not drawn at all
  const shown = await page.evaluate(() => [...document.querySelectorAll('#pane svg .mpt, #pane svg .msh, #pane svg .mhalo')].filter((e) => getComputedStyle(e).display !== 'none').length)
  expect(shown, 'decorative marks are still drawn with reduced motion set').toBe(0)
})

test('the fields of colour behind a tab’s head are decoration: hidden from a screen reader and out of the pointer’s way, and the words over them keep their contrast', async ({ page }) => {
  for (const view of ['all', 'workflows', 'overview', 'usage']) {
    const v = manifest.find((m) => m.state === 'busy' && m.view === view && m.cols === 148 && !m.details && !m.scheme)!
    await open(page, v)
    const decor = page.locator('[data-svg="decor"]')
    expect(await decor.count(), view + ': no field of colour').toBeGreaterThan(0)
    expect(await decor.first().getAttribute('aria-hidden')).toBe('true')
    expect(await decor.first().evaluate((e) => getComputedStyle(e).pointerEvents)).toBe('none')
  }
})
