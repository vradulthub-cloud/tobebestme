// The launch assets, laid out as pages at their exact sizes and photographed. They share the landing
// page's type, colours and components (site/index.html): the forecast instrument, the week by project,
// and the mod's own rendered views from site/img (run site/tools/shots.mjs first).
// Out: out/social-card.png, out/launch-hero.png, out/carousel/01-06.png, out/demo-frame-0..2.png.
import { chromium } from '../e2e/node_modules/playwright-core/index.mjs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'out')
mkdirSync(join(OUT, 'carousel'), { recursive: true })
mkdirSync(join(HERE, '.pages'), { recursive: true })
const img = (n) => pathToFileURL(join(HERE, '..', 'site', 'img', n)).href
const shot = (n) => pathToFileURL(join(HERE, 'shots', n + '.png')).href
export const INSTALL = '/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme'
const FOOT = 'A free mod for Claude Code · open source · not affiliated with Anthropic'

const CSS = `
:root{--bg:#0A0B0D;--raised:#141619;--inset:#1D2024;--line:rgba(255,255,255,.09);--line-2:rgba(255,255,255,.16);--fg:#F5F5F7;--fg-2:#A3A3AB;--fg-3:#8A8A92;
--accent:#0A84FF;--warn:#FF9F0A;--warn-text:#FFB340;--warn-dim:rgba(255,159,10,.30);--ok:#30D158;--bad:#FF453A;--idle:#98989D;--track:rgba(255,255,255,.10);--past:rgba(255,255,255,.62);
--p1:#BF5AF2;--p2:#64D2FF;--p3:#00C7BE;--p4:#5E5CE6;--p5:#AC8E68;--p6:#FF375F;
--font:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Segoe UI",Roboto,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,monospace}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg)}
body{font-family:var(--font);color:var(--fg);-webkit-font-smoothing:antialiased;overflow:hidden}
.asset{position:relative;overflow:hidden;background:#050608;display:flex;flex-direction:column}
.asset::before{content:"";position:absolute;inset:0;z-index:0;background:radial-gradient(60% 55% at 12% 8%,rgba(100,210,255,.22),transparent 70%),radial-gradient(55% 60% at 92% 30%,rgba(191,90,242,.22),transparent 70%),radial-gradient(70% 50% at 50% 110%,rgba(94,92,230,.20),transparent 70%)}
.asset::after{content:"";position:absolute;inset:0;z-index:0;background-image:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1.5px);background-size:32px 32px;-webkit-mask-image:radial-gradient(80% 80% at 50% 40%,#000,transparent)}
.asset>*{position:relative;z-index:1}
.em{background:linear-gradient(100deg,#64D2FF,#BF5AF2 60%,#FF375F);-webkit-background-clip:text;background-clip:text;color:transparent}
.em.warm{background-image:linear-gradient(100deg,#FFB340,#FF375F)}
.em.cool{background-image:linear-gradient(100deg,#30D158,#64D2FF)}
.brand{display:flex;align-items:center;gap:14px;font-weight:600}
.brand img{border-radius:22%}
.num{font-variant-numeric:tabular-nums}
h1,h2{font-weight:700;letter-spacing:-.035em;line-height:1.02;text-wrap:balance}
.sub{color:var(--fg-2);line-height:1.35;text-wrap:balance}
.sub b{color:var(--fg);font-weight:600}
.foot{color:var(--fg-3)}
.dot{width:12px;height:12px;border-radius:50%;display:inline-block;flex:none}
.tag{margin-left:auto;font-weight:600;color:var(--fg-2);border:1.5px solid var(--line-2);border-radius:980px;padding:4px 14px}
.inst{background:var(--raised);border:1px solid var(--line);border-radius:28px;display:flex;flex-direction:column}
.inst .head{display:flex;align-items:center;gap:12px;color:var(--fg-2)}
.inst .fig{display:flex;align-items:baseline;gap:20px;flex-wrap:wrap}
.inst .big{font-weight:700;letter-spacing:-.04em;line-height:1;color:var(--warn-text)}
.inst .lab{color:var(--fg-2)}
.inst .fc{font-weight:600;letter-spacing:-.015em;line-height:1.28;text-wrap:balance}
.inst .fc b{color:var(--warn-text);white-space:nowrap}
.runway{position:relative}
.track{position:relative;border-radius:999px;background:var(--track);overflow:hidden}
.track i{position:absolute;top:0;bottom:0}
.mk{position:absolute;width:3px;transform:translateX(-1.5px)}
.ml{position:absolute;font-weight:600;white-space:nowrap}
.days{display:flex;color:var(--fg-3)}
.days span{text-align:center}
.days .t{color:var(--fg);font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{display:inline-flex;align-items:center;gap:10px;border:1.5px solid var(--line-2);border-radius:980px;font-weight:500}
.chip .num{color:var(--fg-2)}
.bars{display:grid;grid-template-columns:repeat(8,1fr);align-items:end}
.bar{display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch}
.stack{display:flex;flex-direction:column-reverse;gap:3px;border-radius:8px;overflow:hidden}
.stack i{display:block}
.bar .p,.bar .l{text-align:center}
.bar .p{font-weight:600}
.bar .l{color:var(--fg-2)}
.bar.f .stack{border:2px dashed var(--line-2)}
.shot{border-radius:20px;border:1px solid var(--line-2);overflow:hidden;background:#1E1E1E;box-shadow:0 40px 100px -40px rgba(0,0,0,.8)}
.shot img{display:block;width:100%}
.titlebar{display:flex;align-items:center;gap:9px;height:44px;padding:0 18px;background:#2A2A2C;border-bottom:1px solid rgba(255,255,255,.08)}
.titlebar i{width:13px;height:13px;border-radius:50%;background:#5A5A5E;display:block}
.titlebar span{margin:0 auto;transform:translateX(-34px);font-size:15px;color:#B8B8BE;font-weight:500}
.cmd{display:flex;align-items:center;gap:14px;background:var(--raised);border:1.5px solid var(--line-2);border-radius:18px;font-family:var(--mono)}
.cmd .btn{margin-left:auto;font-family:var(--font);background:var(--accent);color:#fff;border-radius:980px;font-weight:600}
`

// the sample week, the same as the landing page's
const NOW = 123, RUN = 123 + 12.361, TOTAL = 168
const pct = (h) => (h / TOTAL) * 100
const DAYS = [['Sun', 10], ['Mon', 24], ['Tue', 24], ['Wed', 24], ['Thu', 24], ['Today', 24], ['Sat', 24], ['Sun', 14]]
const P = [['storefront', 'p1'], ['ledger-api', 'p2'], ['reports', 'p3'], ['docs-site', 'p4'], ['notes', 'p5'], ['wiki', 'p6']]
const TOT = { storefront: '49%', 'ledger-api': '14%', reports: '9.2%', 'docs-site': '5.6%', notes: '3.6%', wiki: '0.1%' }
const WEEK = [{ 'docs-site': 2.3 }, { storefront: 6.4, 'ledger-api': 4 }, { storefront: 8.8, reports: 4, notes: 1.2 }, { storefront: 12, 'ledger-api': 5.6, 'docs-site': 3.3 },
  { storefront: 6.4, 'ledger-api': 4.2, reports: 5.2, notes: 2.2 }, { storefront: 15.4, 'ledger-api': 0.2, notes: 0.2, wiki: 0.1 }, null, null]
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

// the forecast instrument; s scales every size
function instrument(s = 1, { head = true, days = true } = {}) {
  const px = (n) => Math.round(n * s) + 'px'
  const top = 34 * s, th = 16 * s
  return `<div class="inst" style="padding:${px(40)};gap:${px(30)}">
  ${head ? `<div class="head" style="font-size:${px(18)}"><span class="dot" style="background:var(--accent);width:${px(12)};height:${px(12)}"></span>Weekly limit<span class="tag" style="font-size:${px(15)}">Sample week</span></div>` : ''}
  <div class="fig"><span class="big num" style="font-size:${px(104)}">82%</span><span class="lab" style="font-size:${px(21)}">of your weekly limit, with two days to go</span></div>
  <p class="fc" style="font-size:${px(34)}">At this pace it runs out <b class="num">Sat 5:21 AM</b>, 32 h 38 min before it resets.</p>
  <div class="runway" style="padding-top:${px(34)};padding-bottom:${px(days ? 0 : 6)}">
    <span class="ml" style="top:0;left:${pct(NOW)}%;transform:translateX(-50%);font-size:${px(16)}">Now</span>
    <span class="ml" style="top:0;right:0;color:var(--fg-2);font-weight:500;font-size:${px(16)}">Resets Sun 2:00 PM</span>
    <div class="track" style="height:${px(16)}"><i style="left:0;width:${pct(NOW)}%;background:var(--warn)"></i><i style="left:${pct(NOW)}%;width:${pct(RUN) - pct(NOW)}%;background:var(--warn-dim)"></i></div>
    <div style="position:absolute;left:0;top:${top + th + 6 * s}px;width:${pct(NOW)}%;height:${px(3)};background:var(--past);border-radius:2px"></div>
    <div class="mk" style="left:${pct(NOW)}%;top:${top - 8 * s}px;height:${th + 16 * s}px;background:var(--fg)"></div>
    <div class="mk" style="left:${pct(RUN)}%;top:${top - 8 * s}px;height:${th + 16 * s}px;background:var(--warn)"></div>
    <div class="mk" style="left:calc(100% - 1.5px);top:${top - 8 * s}px;height:${th + 16 * s}px;background:var(--fg-2)"></div>
    ${days ? `<div class="days" style="margin-top:${px(16)};font-size:${px(15)}">${DAYS.map(([d, h]) => `<span class="${d === 'Today' ? 't' : ''}" style="width:${pct(h)}%">${d}</span>`).join('')}</div>` : ''}
    <div style="position:relative;height:${px(30)};margin-top:${px(10)}"><span class="ml num" style="left:${pct(RUN)}%;transform:translateX(-50%);color:var(--warn-text);font-size:${px(17)}">Runs out Sat 5:21 AM</span></div>
  </div>
</div>`
}

// the week by project
function week(s = 1, { chips = true, height = 300 } = {}) {
  const px = (n) => Math.round(n * s) + 'px'
  const max = Math.max(...WEEK.filter(Boolean).map(sum))
  return `<div class="inst" style="padding:${px(40)};gap:${px(34)}">
  ${chips ? `<div class="chips">${P.map(([k, c]) => `<span class="chip" style="font-size:${px(17)};padding:${px(9)} ${px(16)}"><span class="dot" style="background:var(--${c})"></span>${k} <span class="num">${TOT[k]}</span></span>`).join('')}</div>` : ''}
  <div class="bars" style="gap:${px(18)};height:${px(height)}">${WEEK.map((v, i) => {
    const d = DAYS[i][0]
    if (!v) return `<div class="bar f" style="gap:${px(10)}"><div class="stack" style="height:${px(56)}"></div><span class="l" style="font-size:${px(15)}">${d}</span></div>`
    const t = sum(v)
    return `<div class="bar" style="gap:${px(10)}"><span class="p num" style="font-size:${px(16)}">${t >= 10 ? Math.round(t) : Math.round(t * 10) / 10}%</span><div class="stack" style="height:${(t / max) * (height - 70) * s}px">${P.filter(([k]) => v[k]).map(([k, c]) => `<i style="flex:${v[k]} 0 0;background:var(--${c})"></i>`).join('')}</div><span class="l" style="font-size:${px(15)}${d === 'Today' ? ';color:var(--fg);font-weight:700' : ''}">${d}</span></div>`
  }).join('')}</div>
  <p style="font-size:${px(24)};line-height:1.35"><b class="num">82%</b> of the weekly limit so far, across 6 projects. <b>storefront</b> did more than half of it.</p>
</div>`
}

const brand = (size = 28) => `<div class="brand" style="font-size:${size}px"><img src="${img('icon.svg')}" width="${Math.round(size * 1.7)}" height="${Math.round(size * 1.7)}" alt="">ToBeBestMe</div>`
const win = (src, extra = '') => `<div class="shot"><div class="titlebar"><i></i><i></i><i></i><span>ToBeBestMe</span></div><img src="${src}" alt="" style="${extra}"></div>`
const frame = (src) => `<div class="shot"><img src="${src}" alt=""></div>`

const assets = []
// GitHub social card, 1280 × 640
assets.push({ out: 'social-card.png', w: 1280, h: 640, dpr: 2, html: `
<div style="padding:64px 72px 56px;display:grid;grid-template-columns:470px 1fr;gap:56px;height:100%;align-items:center">
  <div style="display:flex;flex-direction:column;gap:28px">${brand(26)}<h1 style="font-size:80px">See where your <span class="em">week</span> went.</h1><p class="sub" style="font-size:24px">A free mod for Claude Code: your week by project, whether you’ll make the reset, and every chat waiting on you.</p></div>
  ${week(0.62, { height: 330 })}
</div>` })
// launch hero, 1600 × 900: the claim, then the real pane rising from the bottom
assets.push({ out: 'launch-hero.png', w: 1600, h: 900, dpr: 2, html: `
<div style="padding:88px 120px 0;display:flex;flex-direction:column;gap:22px;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(26)}<span class="foot" style="font-size:20px">A free mod for Claude Code</span></div>
  <h1 style="font-size:104px;margin-top:20px">See where your <span class="em">week</span> went.</h1>
  <p class="sub" style="font-size:30px;max-width:30em">Your Claude Code week <b>by project</b>, <b>whether you’ll make the reset</b>, and <b>every chat waiting on you</b>, beside the chat.</p>
  <div style="margin-top:34px">${win(img('pane.png'))}</div>
</div>` })
// the carousel, 1080 × 1350 each
const slide = (n, title, sub, visual, align = 'end') => ({ out: `carousel/0${n}.png`, w: 1080, h: 1350, dpr: 2, html: `
<div style="padding:84px 88px 72px;display:flex;flex-direction:column;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(24)}<span class="foot num" style="font-size:22px">${n} / 6</span></div>
  <h2 style="font-size:88px;margin-top:84px">${title}</h2>
  <p class="sub" style="font-size:31px;margin-top:28px">${sub}</p>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:${align};margin-top:48px;min-height:0">${visual}</div>
  <p class="foot" style="font-size:21px;margin-top:48px">${FOOT}</p>
</div>` })
assets.push(slide(1, 'See where your <span class="em">week</span> went.', 'Every day stacked by project, so you know which one spent your limit. Each project keeps its colour everywhere.', week(0.95, { height: 330 })))
assets.push(slide(2, 'Know before you <span class="em warm">run out.</span>', 'It tells you days ahead when your limit will run out, while there’s still time to change course.', instrument(0.95)))
assets.push(slide(3, 'Answer every <span class="em">waiting</span> chat from one place.', 'Permission prompts, questions and plans, most pressing first, with the buttons the chat offered.', frame(img('needs.png'))))
assets.push(slide(4, 'One line, always <span class="em">in view.</span>', 'Context, the 5-hour limit and the weekly limit above where you type. Amber when one runs low, red when it’s nearly gone.', `<div class="inst" style="padding:28px 28px 32px;gap:22px">${frame(img('band.png'))}<div style="display:flex;align-items:center;gap:14px;border:1.5px solid var(--line-2);border-radius:16px;padding:22px 24px;font-size:24px;color:var(--fg-3)"><span style="color:var(--fg-2);font-family:var(--mono)">›</span>Ask Claude to keep going</div></div>`, 'center'))
assets.push(slide(5, 'Know what a change would <span class="em cool">save.</span>', 'It reads which models did the week’s work and tells you what a change would buy back, before you make it.', `<div style="display:flex;flex-direction:column;gap:36px">${frame(img('standout.png'))}<div class="inst" style="padding:36px 40px;gap:14px;font-size:27px;line-height:1.35"><p style="color:var(--fg-2)">Half the Opus work on Sonnet moves the run-out from</p><p style="font-size:44px;font-weight:700;letter-spacing:-.02em" class="num"><span style="color:var(--warn-text)">Sat 5:21 AM</span> <span style="color:var(--fg-3)">to</span> Sat 1:15 PM</p></div></div>`, 'center'))
assets.push(slide(6, 'Free, open source, <span class="em">one line</span> to install.', 'Works in the terminal and the Claude desktop app. No analytics, no tracking, no server of ours.', `<div style="display:flex;flex-direction:column;gap:30px">
  <div class="cmd" style="padding:26px 22px 26px 30px;font-size:24px;line-height:1.45;flex-wrap:wrap"><span>/plugin install tobebestme<br>--marketplace vradulthub-cloud/tobebestme</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;font-size:24px">${[['Every project at once', 'It reads every session on this computer.'], ['Keyboard first', 'Tabs 1 to 7, full keyboard control.'], ['Tested where it draws', '86 behaviour tests, 150 rendering checks.'], ['MIT licensed', 'Checksums for every file.']].map(([a, b]) => `<div class="inst" style="padding:26px 28px;gap:8px"><b style="font-weight:600">${a}</b><span style="color:var(--fg-2);font-size:21px;line-height:1.35">${b}</span></div>`).join('')}</div>
  <p style="font-size:24px;color:var(--fg-2)">github.com/vradulthub-cloud/tobebestme</p></div>`, 'center'))
// demo frames, 1920 × 1080: the real pane's week, a day pressed, a project picked
const CAP = [['Your week, by project', 'Each day stacked by the projects that used it.'], ['Press a day', 'See what that day used, project by project.'], ['Pick a project', 'Follow it through the week. The rest step back.']]
CAP.forEach(([t, s], i) => assets.push({ out: `demo-frame-${i}.png`, w: 1920, h: 1080, dpr: 1, html: `
<div style="padding:96px 120px;display:flex;flex-direction:column;gap:20px;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(26)}<span class="foot num" style="font-size:22px">${i + 1} / 3</span></div>
  <h2 style="font-size:88px;margin-top:48px">${t}</h2><p class="sub" style="font-size:32px">${s}</p>
  <div style="flex:1;display:flex;align-items:center;margin-top:24px">${frame(shot('frame-' + i))}</div>
</div>` }))

const b = await chromium.launch()
for (const a of assets) {
  const file = join(HERE, '.pages', a.out.replace(/\//g, '-').replace('.png', '.html'))
  writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="asset" style="width:${a.w}px;height:${a.h}px">${a.html}</div></body></html>`)
  const p = await b.newPage({ viewport: { width: a.w, height: a.h }, deviceScaleFactor: a.dpr })
  await p.goto(pathToFileURL(file).href); await p.waitForLoadState('networkidle')
  const over = await p.evaluate(() => { const el = document.querySelector('.asset'); return [...el.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > el.clientHeight + 1 || r.right > el.clientWidth + 1 }).map((e) => e.className || e.tagName).slice(0, 4) })
  await p.locator('.asset').screenshot({ path: join(OUT, a.out) })
  console.log(a.out, over.length ? 'OVERFLOW ' + over.join(',') : 'ok')
  await p.close()
}
await b.close()
