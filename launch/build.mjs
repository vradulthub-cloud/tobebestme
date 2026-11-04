// The launch assets, laid out as pages at their exact sizes and photographed. They share the landing
// page's type, colours and components (site/index.html): the week drawing and the mod's own rendered views
// from site/img (run site/tools/shots.mjs first) and launch/shots (launch/shots.mjs).
// Out: out/social-card.png, out/launch-hero.png, out/carousel/01-07.png, out/demo-frame-0..2.png.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
// Playwright comes from the main checkout's e2e/node_modules (TBBM_MAIN), as in shots.mjs
const { chromium } = await import(pathToFileURL(join(process.env.TBBM_MAIN || join(HERE, '..'), 'e2e', 'node_modules', 'playwright-core', 'index.mjs')).href)
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
--p1:#BF5AF2;--p2:#64D2FF;--p3:#00C7BE;--p4:#5E5CE6;--p5:#AC8E68;--p6:#7C8DB5;
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
.em.amber{background-image:linear-gradient(100deg,#FFD27A,#FFB020 45%,#FF6A3D)}
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

// The week as one drawing, as Home draws it: each day stacked by project on the window's hour axis, the line of use,
// the dashed pace to the run-out, and the hatched stretch without Claude. s scales every size.
const HRS = DAYS.map((d) => d[1]), STARTS = HRS.map((_, i) => HRS.slice(0, i).reduce((a, b) => a + b, 0))
const CUM = (() => { const pts = [[0, 0]]; let c = 0; WEEK.forEach((v, i) => { if (v && i < 5) { c += sum(v); pts.push([STARTS[i] + HRS[i], c]) } }); pts.push([NOW, 82]); return pts })()
function drawing(s = 1, { height = 300, figure = true, sentence = true, chips = false, readout = false } = {}) {
  const px = (n) => Math.round(n * s) + 'px'
  const X = (h) => ((h / TOTAL) * 1000).toFixed(1), Y = (p) => (100 - p).toFixed(2)
  const line = CUM.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ')
  const lbl = 38 * s, plotH = height * s
  const avail = plotH - lbl - 34 * s
  const cols = WEEK.map((v, i) => {
    const t = v ? sum(v) : 0
    const stack = v ? `<div class="stack" style="width:62%;margin:0 auto;height:${(t / 100) * 2.3 * avail}px">${P.filter(([k]) => v[k]).map(([k, c]) => `<i style="flex:${v[k]} 0 0;background:var(--${c})"></i>`).join('')}</div>` : ''
    const pc = v ? `<span class="num" style="font-weight:600;font-size:${px(17)};text-align:center;height:${px(26)}">${t >= 10 ? Math.round(t) : Math.round(t * 10) / 10}%</span>` : ''
    return `<div style="position:absolute;top:0;bottom:0;left:${pct(STARTS[i])}%;width:${pct(HRS[i])}%;display:flex;flex-direction:column;justify-content:flex-end;gap:${px(8)};white-space:nowrap">${pc}${stack}<span style="height:${px(30)};line-height:${px(30)};text-align:center;font-size:${px(16)};color:${DAYS[i][0] === 'Today' ? 'var(--fg)' : 'var(--fg-2)'};font-weight:${DAYS[i][0] === 'Today' ? 700 : 400}">${DAYS[i][0]}</span></div>`
  }).join('')
  const vls = STARTS.slice(1).map((h) => `<i style="position:absolute;top:0;bottom:0;left:${pct(h)}%;width:1px;background:rgba(255,255,255,.07)"></i>`).join('')
  return `<div class="inst" style="padding:${px(40)};gap:${px(24)}">
  ${figure ? `<div class="fig" style="margin-bottom:${px(-6)}"><span class="big num" style="font-size:${px(104)};background:linear-gradient(100deg,#FFC866,#FF9F0A 70%,#FF7A00);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 ${px(26)} rgba(255,159,10,.35))">82%</span><span class="lab" style="font-size:${px(21)}">of your weekly limit${sentence ? ', with two days to go' : ''}</span></div>` : ''}
  ${sentence ? `<p class="fc" style="font-size:${px(32)}">At this pace it runs out <b class="num">Sat 5:21 AM</b>, about 33 hours before it resets.</p>` : ''}
  ${chips ? `<div class="chips">${P.map(([k, c]) => `<span class="chip" style="font-size:${px(17)};padding:${px(9)} ${px(16)}"><span class="dot" style="background:var(--${c})"></span>${k} <span class="num">${TOT[k]}</span></span>`).join('')}</div>` : ''}
  <div style="position:relative;height:${plotH}px;margin-top:${px(36)}">
    <span class="ml" style="top:${px(-34)};left:${pct(NOW)}%;transform:translateX(-50%);font-size:${px(16)}">Now</span>
    <span class="ml" style="top:${px(-34)};right:0;color:var(--fg-2);font-weight:500;font-size:${px(16)}">Resets Sun 2:00 PM</span>
    <div style="position:absolute;left:0;right:0;top:0;bottom:${lbl}px;border-top:1.5px solid var(--line-2)">
      <span style="position:absolute;left:0;top:${px(6)};font-size:${px(14)};color:var(--fg-3)">100% of the limit</span>${vls}
      <div style="position:absolute;top:0;bottom:0;right:0;left:${pct(RUN)}%;border-left:2px dashed var(--warn);background:repeating-linear-gradient(135deg,rgba(255,159,10,.46) 0 2px,transparent 2px 9px);display:flex;align-items:flex-end;justify-content:center;padding-bottom:${px(12)}"><div class="num" style="background:#0A0B0D;border:1.5px solid var(--warn);color:var(--warn-text);border-radius:${px(10)};padding:${px(5)} ${px(10)};font-size:${px(14)};font-weight:700;text-align:center;line-height:1.2;white-space:pre">about 33 hours\nwithout Claude</div></div>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9F0A" stop-opacity=".4"/><stop offset="1" stop-color="#FF9F0A" stop-opacity="0"/></linearGradient></defs>
        <path d="${line} L${X(NOW)} 100 L0 100 Z" fill="url(#g)"/><path d="${line}" fill="none" stroke="#FF9F0A" stroke-width="${Math.max(2.5, 3.5 * s)}" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <path d="M${X(NOW)} ${Y(82)} L${X(RUN)} 0" fill="none" stroke="#FF9F0A" stroke-width="${Math.max(2.5, 3.5 * s)}" stroke-dasharray="${Math.round(10 * s) + 3} ${Math.round(8 * s) + 3}" vector-effect="non-scaling-stroke"/></svg>
      <i style="position:absolute;left:${pct(NOW)}%;top:${px(-8)};bottom:${px(-14)};width:${px(3)};margin-left:${px(-1.5)};background:#fff;border-radius:2px"></i>
      <i style="position:absolute;left:${pct(RUN)}%;top:0;width:${px(18)};height:${px(18)};margin:${px(-9)} 0 0 ${px(-9)};border-radius:50%;background:var(--warn);box-shadow:0 0 0 ${px(5)} rgba(255,159,10,.28)"></i>
    </div>
    ${cols}
  </div>
  ${readout ? `<p style="font-size:${px(24)};line-height:1.35"><b class="num">82%</b> of the weekly limit so far, across 6 projects. <b>storefront</b> did more than half of it.</p>` : ''}
</div>`
}
const instrument = (s = 1) => drawing(s, { figure: true, sentence: true, height: 250 })
const week = (s = 1, { height = 300 } = {}) => drawing(s, { figure: false, sentence: false, chips: true, readout: true, height })

const brand = (size = 28) => `<div class="brand" style="font-size:${size}px"><img src="${img('icon.svg')}" width="${Math.round(size * 1.7)}" height="${Math.round(size * 1.7)}" alt="">ToBeBestMe</div>`
const win = (src, extra = '') => `<div class="shot"><div class="titlebar"><i></i><i></i><i></i><span>ToBeBestMe</span></div><img src="${src}" alt="" style="${extra}"></div>`
const frame = (src) => `<div class="shot"><img src="${src}" alt=""></div>`

const assets = []
// GitHub social card, 1280 × 640 (also the landing page's og:image, saved there as social-card-v6.png)
assets.push({ out: 'social-card.png', w: 1280, h: 640, dpr: 2, html: `
<div style="padding:56px 64px 48px;display:grid;grid-template-columns:540px 1fr;gap:44px;height:100%;align-items:center">
  <div style="display:flex;flex-direction:column;gap:26px">${brand(26)}<h1 style="font-size:58px">A mod inside Claude Code. <span class="em amber" style="display:block;white-space:nowrap;font-size:46px;margin-top:8px">Know where things stand.</span></h1><p class="sub" style="font-size:23px"><b>Not a separate app, service or account.</b> No server, no sign-up, no API key. Limits, waiting chats, workflow costs and skill fixes, in one pane beside the chat.</p></div>
  <div>${week(0.56, { height: 340 })}<p class="foot" style="font-size:15px;margin-top:12px;text-align:right">Sample data</p></div>
</div>` })
// launch hero, 1600 × 900: the claim, then the real pane rising from the bottom
assets.push({ out: 'launch-hero.png', w: 1600, h: 900, dpr: 2, html: `
<div style="padding:88px 120px 0;display:flex;flex-direction:column;gap:22px;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(26)}<span class="foot" style="font-size:20px">A mod that runs inside Claude Code itself</span></div>
  <h1 style="font-size:92px;margin-top:12px">A mod inside Claude Code. <span class="em amber" style="display:block;white-space:nowrap">Know where things stand.</span></h1>
  <p class="sub" style="font-size:30px;max-width:30em">Your <b>limits</b>, <b>every chat waiting on you</b>, <b>what your workflows cost</b> and <b>your skills</b>, in one pane beside the chat.</p>
  <div style="margin-top:30px">${win(img('pane-v6.png'))}</div>
</div>` })
// the carousel, 1080 × 1350 each
const slide = (n, title, sub, visual, align = 'end') => ({ out: `carousel/0${n}.png`, w: 1080, h: 1350, dpr: 2, html: `
<div style="padding:84px 88px 72px;display:flex;flex-direction:column;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(24)}<span class="foot num" style="font-size:22px">${n} / 7</span></div>
  <h2 style="font-size:88px;margin-top:84px">${title}</h2>
  <p class="sub" style="font-size:31px;margin-top:28px">${sub}</p>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:${align};margin-top:48px;min-height:0">${visual}</div>
  <p class="foot" style="font-size:21px;margin-top:48px">${FOOT}</p>
</div>` })
assets.push(slide(1, 'See where your <span class="em">week</span> went.', 'One drawing: each day stacked by project, the line of use so far, and where your pace runs out.', week(0.95, { height: 330 })))
assets.push(slide(2, 'Know before you <span class="em warm">run out.</span>', 'Days ahead, while there’s still time to change course. The hatched stretch is the time you’d spend without Claude.', instrument(0.95)))
assets.push(slide(3, 'The chat that needs you <span class="em">most, first.</span>', 'The most urgent is a card of its own. The rest follow, with the buttons the chat offered.', `<div class="shot" style="height:566px"><img src="${img('needs-v6.png')}" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top"></div>`))
assets.push(slide(4, 'One line, always <span class="em">in view.</span>', 'Context, the weekly limit and a model’s own above where you type. Amber when one runs low, red when it’s nearly gone.', `<div class="inst" style="padding:28px 28px 32px;gap:22px">${frame(img('band-v6.png'))}<div style="display:flex;align-items:center;gap:14px;border:1.5px solid var(--line-2);border-radius:16px;padding:22px 24px;font-size:24px;color:var(--fg-3)"><span style="color:var(--fg-2);font-family:var(--mono)">›</span>Ask Claude to keep going</div></div>`, 'center'))
assets.push(slide(5, 'Know what a change would <span class="em cool">save.</span>', 'The week as you ran it, against the week with the idea applied, and the points it gives back.', `<div style="display:flex;flex-direction:column;gap:36px">${frame(img('savings.png'))}<div class="inst" style="padding:36px 40px;gap:14px;font-size:27px;line-height:1.35"><p style="color:var(--fg-2)">Half the Opus work on Sonnet moves the run-out from</p><p style="font-size:44px;font-weight:700;letter-spacing:-.02em" class="num"><span style="color:var(--warn-text)">Sat 5:21 AM</span> <span style="color:var(--fg-3)">to</span> Sat 1:15 PM</p></div></div>`, 'center'))
assets.push(slide(6, 'Fix it in the pane, <span class="em">not the chat.</span>', 'The pane shows what’s there now and what it becomes. Nothing is written until you press Save change.', `<div class="shot" style="overflow:hidden"><img src="${img('fix-v6.png')}" alt="" style="width:142%;max-width:none"></div>`, 'center'))
assets.push(slide(7, 'Free, open source, <span class="em">one line</span> to install.', 'A mod that runs inside Claude Code itself. No server, no sign-up, no API key. Works in the terminal and the Claude desktop app.', `<div style="display:flex;flex-direction:column;gap:30px">
  <div class="cmd" style="padding:26px 22px 26px 30px;font-size:24px;line-height:1.45;flex-wrap:wrap"><span>/plugin install tobebestme<br>--marketplace vradulthub-cloud/tobebestme</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;font-size:24px">${[['Every project at once', 'It reads every chat on this computer.'], ['Keyboard first', 'Six tabs, full keyboard control.'], ['Tested where it draws', 'Every button pressed, every view checked.'], ['MIT licensed', 'Free to use and change.']].map(([a, b]) => `<div class="inst" style="padding:26px 28px;gap:8px"><b style="font-weight:600">${a}</b><span style="color:var(--fg-2);font-size:21px;line-height:1.35">${b}</span></div>`).join('')}</div>
  <p style="font-size:24px;color:var(--fg-2)">github.com/vradulthub-cloud/tobebestme</p></div>`, 'center'))
// demo frames, 1920 × 1080: the real pane's week, a day pressed, a project picked
const CAP = [['Your week, in one drawing', 'Each day by project, the line of use, and the pace to the run-out.'], ['Press a day', 'See what that day used, project by project.'], ['Pick a project', 'Follow it through the week. The rest step back.']]
CAP.forEach(([t, s], i) => assets.push({ out: `demo-frame-${i}.png`, w: 1920, h: 1080, dpr: 1, html: `
<div style="padding:96px 120px;display:flex;flex-direction:column;gap:20px;height:100%">
  <div style="display:flex;align-items:center;justify-content:space-between">${brand(26)}<span class="foot num" style="font-size:22px">${i + 1} / 3</span></div>
  <h2 style="font-size:88px;margin-top:48px">${t}</h2><p class="sub" style="font-size:32px">${s}</p>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:24px"><div style="width:1440px">${frame(shot('frame-' + i))}</div></div>
</div>` }))

const b = await chromium.launch()
// ONLY=carousel/07.png renders just the assets whose file name contains it
for (const a of assets.filter((x) => !process.env.ONLY || x.out.includes(process.env.ONLY))) {
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
