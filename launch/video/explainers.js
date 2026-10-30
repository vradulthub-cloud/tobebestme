// ToBeBestMe explainer videos. Every frame is drawn from one time value: window.seek(t).
// window.load(name) builds a video; window.DURATION and window.CAPTIONS describe it.
'use strict'
const W = 1920, H = 1080
const IMG = '../../site/img/', SHOTS = '../shots/'
const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const prog = (t, a, b) => clamp((t - a) / (b - a))
const lerp = (a, b, x) => a + (b - a) * x
const eo = (x) => 1 - Math.pow(1 - x, 3)
const eo5 = (x) => 1 - Math.pow(1 - x, 5)
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const back = (x) => { const c1 = 1.9, c3 = c1 + 1; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2) }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mix = (a, b, x) => a.map((v, i) => Math.round(lerp(v, b[i], x)))

// ---- the sample week, the same as the landing page's and the real pane's ----
const START = new Date(2026, 9, 18, 14, 0), TOTAL = 168, NOW = 123, USED = 82, RATE = 18 / 12.361
const pos = (h) => (h / TOTAL) * 100
const RUN = NOW + 18 / RATE, AFTER = 143.25 // Sat 5:21 AM (32 h 38 min before the reset); Sat 1:15 PM (24 h 45 min) with half the Opus work on Sonnet
const DAYS = [['Sun', 10], ['Mon', 24], ['Tue', 24], ['Wed', 24], ['Thu', 24], ['Today', 24], ['Sat', 24], ['Sun', 14]]
const P = [['storefront', '#BF5AF2'], ['ledger-api', '#64D2FF'], ['reports', '#00C7BE'], ['docs-site', '#5E5CE6'], ['notes', '#AC8E68'], ['wiki', '#FF375F']]
const WEEK = [{ 'docs-site': 2.3 }, { storefront: 6.4, 'ledger-api': 4 }, { storefront: 8.8, reports: 4, notes: 1.2 }, { storefront: 12, 'ledger-api': 5.6, 'docs-site': 3.3 },
  { storefront: 6.4, 'ledger-api': 4.2, reports: 5.2, notes: 2.2 }, { storefront: 15.4, 'ledger-api': 0.2, notes: 0.2, wiki: 0.1 }, null, null]
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Today', 'Saturday', 'Sunday']
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)
const TOT = {}; P.forEach(([k]) => (TOT[k] = WEEK.reduce((a, d) => a + ((d && d[k]) || 0), 0)))
const MAXD = Math.max(...WEEK.filter(Boolean).map(sum))
const r1 = (x) => (x >= 10 ? Math.round(x) + '%' : Math.round(x * 10) / 10 + '%')
const at = (h) => { const d = new Date(START.getTime() + h * 3600e3); return d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
const dur = (h) => { const m = Math.floor(h * 60 + 1e-6); return Math.floor(m / 60) + ' h ' + (m % 60) + ' min' }

// ---- light: drifting glows in each scene's colours, mixed as scenes cross ----
const MOODS = {
  blue: ['#0A84FF', '#5E5CE6', '#64D2FF'], projects: ['#BF5AF2', '#64D2FF', '#00C7BE'], purple: ['#BF5AF2', '#5E5CE6', '#FF375F'],
  amber: ['#FF9F0A', '#FF375F', '#BF5AF2'], red: ['#FF453A', '#FF375F', '#5E5CE6'], cyan: ['#64D2FF', '#0A84FF', '#00C7BE'], green: ['#30D158', '#00C7BE', '#0A84FF'],
}
const bg = document.getElementById('bg').getContext('2d'), fx = document.getElementById('fx').getContext('2d')
function drawLight(t, mood, glow = 1) {
  bg.globalCompositeOperation = 'source-over'
  bg.fillStyle = '#050608'; bg.fillRect(0, 0, W, H)
  bg.globalCompositeOperation = 'lighter'
  const spots = [[0.18, 0.2, 900, 0.055, 0.0], [0.85, 0.35, 1000, 0.045, 2.1], [0.5, 1.05, 1100, 0.035, 4.2]]
  spots.forEach(([x, y, r, sp, ph], i) => {
    const cx = W * x + Math.sin(t * sp * 6 + ph) * 160, cy = H * y + Math.cos(t * sp * 5 + ph) * 110
    const c = mood[i]
    const g = bg.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.30 * glow})`); g.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},${0.10 * glow})`); g.addColorStop(1, 'rgba(0,0,0,0)')
    bg.fillStyle = g; bg.fillRect(0, 0, W, H)
  })
  bg.globalCompositeOperation = 'source-over'
  // a faint dot field, drifting slowly for depth
  bg.fillStyle = 'rgba(255,255,255,0.045)'
  const off = (t * 9) % 48
  for (let y = -48 + off; y < H; y += 48) for (let x = 0; x < W; x += 48) bg.fillRect(x, y, 2, 2)
  const v = bg.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)')
  bg.fillStyle = v; bg.fillRect(0, 0, W, H)
}

// ---- kinetic type: words resolve out of a blur, *starred* words take the scene's gradient ----
function words(el, text) {
  el.innerHTML = ''
  const out = []
  let em = false
  text.split(/(\s+)/).forEach((tok) => {
    if (!tok) return
    if (/^\s+$/.test(tok)) { if (tok.includes('\n')) el.appendChild(document.createElement('br')); else el.appendChild(document.createTextNode(' ')); return }
    if (tok.startsWith('*')) em = true
    const ends = /\*[.,?!]?$/.test(tok) && tok.lastIndexOf('*') > 0
    const clean = tok.replace(/\*/g, '')
    const w = $('span', 'w' + (em ? ' em' : ''), clean.replace(/&/g, '&amp;').replace(/</g, '&lt;'))
    el.appendChild(w); out.push(w)
    if (ends) em = false
  })
  return out
}
function kin(ws, p, { stagger = 0.06, span = 0.55, dist = 46, blur = 16, out = 0 } = {}) {
  ws.forEach((w, i) => {
    const q = eo5(clamp((p - i * stagger) / span))
    const o = eo(out)
    w.style.opacity = q * (1 - o)
    w.style.transform = `translateY(${(1 - q) * dist - o * 80}px) scale(${lerp(0.94, 1, q)})`
    w.style.filter = `blur(${(1 - q) * blur + o * 10}px)`
  })
}
const rise = (el, p, d = 40, b = 12) => { const q = eo5(clamp(p)); el.style.opacity = q; el.style.transform = `translateY(${(1 - q) * d}px)`; el.style.filter = q < 1 ? `blur(${(1 - q) * b}px)` : 'none' }

// ---- pieces ----
const XF = 0.35
const esc = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ---- the week drawing: day bars on the hour axis, the line of use, the dashed pace to the run-out, and the hatched stretch without Claude ----
const HRS = DAYS.map((d) => d[1]), STARTS = HRS.map((_, i) => HRS.slice(0, i).reduce((a, b) => a + b, 0))
const CUM = (() => { const pts = [[0, 0]]; let c = 0; WEEK.forEach((d, i) => { if (d && i < 5) { c += sum(d); pts.push([STARTS[i] + HRS[i], c]) } }); pts.push([NOW, USED]); return pts })()
const yAt = (h) => { for (let i = 1; i < CUM.length; i++) if (h <= CUM[i][0]) { const a = CUM[i - 1], b = CUM[i]; return lerp(a[1], b[1], (h - a[0]) / (b[0] - a[0])) } return USED }
const AMBER = '#FF9F0A', GREEN = '#30D158'
let PLN = 0
function plot({ h = null, faint = 1 } = {}) {
  const id = 'plg' + PLN++
  const X = (hr) => ((hr / TOTAL) * 1000).toFixed(1), Y = (p) => (100 - p).toFixed(2)
  const el = $('div', 'pl'); if (h) el.style.height = h + 'px'
  const area = $('div', 'pl-a')
  area.innerHTML = `<span class="cap">100% of the limit</span><div class="vls"></div><span class="tl now">Now</span><span class="tl rst" style="right:0;color:var(--fg-2);font-weight:500">Resets Sun 2:00 PM</span>
    <div class="dryz"><div class="pill num"></div></div>
    <svg class="pl-svg a" viewBox="0 0 1000 100" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9F0A" stop-opacity=".40"/><stop offset="1" stop-color="#FF9F0A" stop-opacity="0"/></linearGradient></defs><path fill="url(#${id})"/><path class="ln"/></svg>
    <svg class="pl-svg b" viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="pj"/></svg>
    <i class="nowl"></i><i class="hd"></i><i class="ed"><b></b></i>`
  const q = (s) => area.querySelector(s)
  const vls = q('.vls'); STARTS.slice(1).forEach((hr) => { const v = $('i', 'vl'); v.style.left = pos(hr) + '%'; vls.appendChild(v) })
  const line = CUM.map((p, i) => (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1])).join(' ')
  area.querySelector('.pl-svg.a path').setAttribute('d', line + ' L' + X(NOW) + ' 100 L0 100 Z'); q('.ln').setAttribute('d', line)
  q('.tl.now').style.left = pos(NOW) + '%'; q('.tl.now').style.transform = 'translateX(-50%)'
  q('.nowl').style.left = pos(NOW) + '%'
  const barsEl = $('div', 'pl-b')
  el.append(area, barsEl)
  const cols = WEEK.map((v, i) => {
    const col = $('div', 'pcol'), pc = $('span', 'p num'), st = $('div', 'stack'), lb = $('span', 'l', DAYS[i][0]), segs = {}
    col.style.left = pos(STARTS[i]) + '%'; col.style.width = pos(HRS[i]) + '%'
    if (v) P.forEach(([k, c]) => { if (v[k]) { const s = $('i'); s.style.background = c; s.style.flex = `${v[k]} 0 0`; st.appendChild(s); segs[k] = s } })
    col.append(pc, st, lb); barsEl.appendChild(col)
    return { col, pc, st, lb, segs, v }
  })
  return {
    el, cols, area,
    // one call draws everything: bars (grow, perDay, day, project), then the marks in order (line, proj, dot, dry, pill)
    set({ grow = 1, perDay = null, day = -1, dayP = 0, project = '', projP = 0, barOp = 1, pcts = true, daysP = 1, nowP = 1, line: lp = 0, proj = 0, pe = [RUN, 100], dot = 0, dry = 0, pill = 0, pillText = '', ok = 0, t = 0, resetP = 1 } = {}) {
      const avail = (h || el.clientHeight || 300) - 40 - 36
      cols.forEach((c, i) => {
        c.lb.style.opacity = daysP; c.lb.classList.toggle('on', day === i && dayP > 0.3)
        if (!c.v) { c.st.style.display = 'none'; c.pc.textContent = ''; return }
        const g = perDay ? perDay[i] : back(clamp((grow - i * 0.11) / 0.42)), tot = sum(c.v)
        c.st.style.height = Math.max(0, (tot / 100) * 2.3 * avail * g) + 'px'
        c.pc.style.opacity = pcts ? clamp(g * 1.4 - 0.3) * barOp : 0
        c.pc.textContent = project && projP > 0.5 ? (c.v[project] ? r1(c.v[project]) : '') : r1(tot)
        c.st.style.opacity = (day >= 0 && day !== i ? lerp(1, 0.2, dayP) : 1) * barOp
        for (const k in c.segs) c.segs[k].style.opacity = project && k !== project ? lerp(1, 0.18, projP) : 1
      })
      q('.vls').style.opacity = daysP
      // the line of use, drawn left to right up to Now
      const le = pos(NOW) * eo(lp)
      area.querySelector('.pl-svg.a').style.clipPath = `inset(-40px ${100 - le}% -40px 0)`
      area.querySelector('.pl-svg.a').style.opacity = lp > 0 ? 1 : 0
      const hd = q('.hd'); hd.style.left = le + '%'; hd.style.top = (100 - yAt((le / 100) * TOTAL)) + '%'; hd.style.opacity = lp > 0 && lp < 1 ? 1 : 0
      const nowOp = nowP * clamp(lp * 4 - 3 + (lp >= 1 ? 1 : 0)); q('.nowl').style.opacity = nowOp; q('.tl.now').style.opacity = nowOp
      q('.tl.rst').style.opacity = resetP
      // the dashed pace from Now to where it ends
      const pj = q('.pj'), ex = pos(pe[0]), col = `rgb(${mix(hex(AMBER), hex(GREEN), ok)})`
      pj.setAttribute('d', 'M' + X(NOW) + ' ' + Y(USED) + ' L' + X(pe[0]) + ' ' + Y(pe[1]))
      pj.style.stroke = col
      const sv = area.querySelector('.pl-svg.b'); sv.style.clipPath = `inset(-40px ${100 - (pos(NOW) + (ex - pos(NOW)) * eo(proj))}% -40px 0)`; sv.style.opacity = proj > 0 ? 1 : 0
      const ed = q('.ed'); ed.style.left = ex + '%'; ed.style.top = (100 - pe[1]) + '%'; ed.style.color = col; ed.style.background = col
      const pu = (t * 0.9) % 1; ed.style.opacity = dot; ed.style.transform = `scale(${lerp(0.5, 1, back(clamp(dot * 1.3)))})`
      const ring = ed.firstChild; ring.style.transform = `scale(${1 + pu * 1.6})`; ring.style.opacity = (1 - pu) * 0.9 * dot
      // the hatched stretch without Claude, after the run-out
      const dz = q('.dryz'), runs = pe[1] >= 99.9
      dz.style.left = ex + '%'; dz.style.opacity = runs ? dry : 0
      const pl = q('.pill'); pl.textContent = pillText.replace(' without', '\nwithout'); pl.style.opacity = runs ? pill * clamp((90 - ex) / 4) : 0; pl.style.transform = `translateY(${(1 - eo(pill)) * 14}px)`
    },
  }
}

function weekChart() {
  const el = $('div', 'week card')
  const chips = $('div', 'chips')
  P.forEach(([k, c]) => { const ch = $('span', 'chip', `<i class="dot" style="background:${c}"></i>${k} <b class="num">${r1(TOT[k])}</b>`); ch.dataset.k = k; chips.appendChild(ch) })
  const pl = plot()
  const read = $('p', 'readout')
  el.append(chips, pl.el, read)
  return {
    el, cols: pl.cols, chips, bars: pl.el, plot: pl,
    // bars and marks as in plot.set; the chips and the readout line follow the picked day or project
    set(o = {}) {
      pl.set(o)
      const { project = '', projP = 0, text = '', textP = 1 } = o
      ;[...chips.children].forEach((ch) => { ch.classList.toggle('on', !!project && ch.dataset.k === project && projP > 0.4); ch.style.opacity = project && ch.dataset.k !== project ? lerp(1, 0.4, projP) : 1 })
      read.innerHTML = text; rise(read, textP, 20, 8)
    },
  }
}

// the weekly limit as the drawing: the same marks, with the figure above and the run-out words below
function calendar({ figure = true, brk = false, pill = false } = {}) {
  const el = $('div', 'inst card')
  el.innerHTML = `${figure ? '<div class="fig"><span class="n num">0%</span><span class="lb">of your weekly limit, with two days to go</span></div>' : ''}<div class="rw"><div class="runlab"><span class="num"></span><span class="num"></span></div></div>`
  const pl = plot({ h: figure ? 220 : 190 })
  const rw = el.querySelector('.rw'); rw.insertBefore(pl.el, rw.firstChild)
  const q = (s) => el.querySelector(s)
  return {
    el, plot: pl,
    // fill 0..1 of the way to Now; ghostTo in hours and run (hours, null hides) place the pace's end; endPct is where it ends when it doesn't run out
    set({ fig = 0, fill = 0, ghostTo = NOW, ghostP = 0, run = null, runP = 0, runText = '', runText2 = '', swapP = 0, dry = 0, ok = 0, labels = 1, t = 0, resetP = 1, daysP = 1, brk: bp = 0, brkText = '', endPct = 100, bars = 1 } = {}) {
      if (figure) { q('.n').textContent = Math.round(USED * eo(fig)) + '%'; q('.fig').style.opacity = clamp(fig * 3) }
      const runs = run != null && run < TOTAL - 0.05
      const end = runs ? [run, 100] : [Math.min(TOTAL, ghostTo), endPct]
      const showPill = brk ? bp : pill ? dry : 0
      const ptext = brk ? brkText : dur(TOTAL - (run == null ? RUN : run)) + ' without Claude'
      pl.set({ grow: bars, barOp: 0.5 * bars, pcts: false, daysP, nowP: labels, resetP, line: fill, proj: ghostP, pe: end, dot: runP, dry, pill: showPill, pillText: ptext, ok, t })
      const [l1, l2] = el.querySelectorAll('.runlab span')
      if (run == null) { l1.style.opacity = l2.style.opacity = 0 } else {
        const lp = Math.min(Math.max(pos(run), 14), 86) + '%'
        l1.style.left = l2.style.left = lp
        l1.textContent = runText; l2.textContent = runText2
        l1.style.color = l2.style.color = ok > 0.5 ? 'var(--ok)' : 'var(--warn-text)'
        l1.style.opacity = clamp(runP * 2 - 0.4) * (1 - swapP); l1.style.transform = `translateX(-50%) translateY(${-swapP * 30}px)`; l1.style.filter = `blur(${swapP * 8}px)`
        l2.style.opacity = swapP; l2.style.transform = `translateX(-50%) translateY(${(1 - swapP) * 30}px)`; l2.style.filter = `blur(${(1 - swapP) * 8}px)`
      }
    },
  }
}

// A product image in a tilting 3D frame. rects: [x, y, w, h] spotlights (dim the rest), or [x, y, w, h, 'ring', colour] rings.
function shot(src, iw, ih, dw, dh, rects = [], wide = false) {
  const wrap = $('div', 'p3d'); wrap.style.width = dw + 'px'; wrap.style.height = dh + 'px'
  const el = $('div', 'shotv'); el.style.width = dw + 'px'; el.style.height = dh + 'px'
  const inner = $('div', 'inner'); inner.style.width = iw + 'px'; inner.style.height = ih + 'px'
  const img = $('img'); img.src = src; img.style.width = iw + 'px'; img.style.height = ih + 'px'
  inner.appendChild(img)
  const hls = rects.map(([x, y, w, h, kind, colour]) => { const r = $('div', 'hl' + (kind === 'ring' ? ' ring' : '')); Object.assign(r.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); if (colour) r.style.setProperty('--rc', colour); inner.appendChild(r); return r })
  const refl = $('div', 'reflect')
  el.append(inner, refl); wrap.appendChild(el)
  return {
    el: wrap, box: el,
    set({ s = 1, cx = iw / 2, cy = ih / 2, rx = 0, ry = 0, z = 0, op = 1, h = [], sheen = 0 } = {}) {
      const k = (wide ? dw / iw : Math.min(dw / iw, dh / ih)) * s
      inner.style.setProperty('--k', k)
      inner.style.transform = `translate(${dw / 2 - cx * k}px,${dh / 2 - cy * k}px) scale(${k})`
      el.style.transform = `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`
      el.style.opacity = op
      hls.forEach((r, i) => (r.style.opacity = h[i] || 0))
      refl.style.transform = `translateX(${lerp(-120, 120, sheen)}%)`; refl.style.opacity = sheen > 0 && sheen < 1 ? 1 : 0
    },
  }
}

// a pointer with a press ripple, in the coordinates of the element it is appended to
function pointer(host) {
  const rip = $('div', 'rip'), el = $('div', 'ptr', '<svg viewBox="0 0 40 40" width="44" height="44"><path d="M4 3 L4 30 L11 23 L16 35 L21 33 L16 21 L26 21 Z" fill="#fff" stroke="#000" stroke-width="2.2" stroke-linejoin="round"/></svg>')
  host.append(rip, el)
  return {
    set(x, y, a = 1, down = 0, ripple = 0) {
      el.style.opacity = a; el.style.transform = `translate(${x - 4}px,${y - 3}px) scale(${1 - 0.12 * down})`
      const sz = lerp(14, 130, eo(ripple))
      rip.style.width = rip.style.height = sz + 'px'; rip.style.transform = `translate(${x - sz / 2}px,${y - sz / 2}px)`; rip.style.opacity = ripple > 0 && ripple < 1 ? (1 - ripple) * 0.9 : 0
    },
  }
}

// icon with a glow and a slow 3D tilt
function iconBlock(host, size, top) {
  const box = $('div', 'ic'); box.style.cssText = `position:absolute;left:50%;top:${top}px;width:${size}px;height:${size}px;margin-left:${-size / 2}px;perspective:900px;z-index:3`
  const glow = $('div'); glow.style.cssText = `position:absolute;left:50%;top:50%;width:${size * 3.4}px;height:${size * 3.4}px;margin:${-size * 1.7}px 0 0 ${-size * 1.7}px;border-radius:50%;background:radial-gradient(circle,rgba(10,132,255,.55),rgba(94,92,230,.28) 40%,rgba(191,90,242,.08) 62%,transparent 72%)`
  const img = $('img'); img.src = IMG + 'icon.svg'; img.alt = ''; img.style.cssText = `position:relative;width:${size}px;height:${size}px;border-radius:22%;box-shadow:0 30px 80px -20px rgba(0,0,0,.8),0 0 60px rgba(10,132,255,.35);transform-style:preserve-3d`
  box.append(glow, img); host.appendChild(box)
  return (t, a = 1) => {
    box.style.opacity = a
    img.style.transform = `rotateY(${Math.sin(t * 0.9) * 26}deg) rotateX(${Math.cos(t * 0.65) * 11}deg) scale(${lerp(0.7, 1, back(clamp(t / 0.9)))})`
    glow.style.opacity = (0.75 + 0.25 * Math.sin(t * 1.6)) * clamp(t * 2)
  }
}

// ---- particles: tokens from each project into the day that used them, drawn from time alone ----
function flow(chart, srcEls, vis, ctx) {
  const R = rng(7), parts = []
  const weights = []
  WEEK.forEach((v, d) => { if (v) P.forEach(([k], pi) => { if (v[k]) weights.push([d, pi, v[k]]) }) })
  weights.forEach(([d, pi, val]) => {
    const n = Math.max(2, Math.round(val * 5))
    for (let j = 0; j < n; j++) {
      const ts = 0.6 + ((d + R()) / 6) * 6.2
      parts.push({ d, pi, ts, fl: 0.9 + R() * 0.6, bend: (R() - 0.5) * 320, r: 3 + R() * 3, jitter: (R() - 0.5) * 50 })
    }
  })
  const perDay = WEEK.map((v, d) => parts.filter((p) => p.d === d).sort((a, b) => a.ts + a.fl - (b.ts + b.fl)))
  let geo = null
  const measure = () => {
    const keep = [chart.el, ...srcEls].map((e) => [e, e.style.transform, e.style.filter]); keep.forEach(([e]) => { e.style.transform = 'none'; e.style.filter = 'none' })
    const sb = vis.getBoundingClientRect()
    geo = {
      src: srcEls.map((e) => { const r = e.getBoundingClientRect(); return [r.right - sb.left - 10, r.top - sb.top + r.height / 2] }),
      col: chart.cols.map((c) => { const r = c.st.parentElement.getBoundingClientRect(); return [r.left - sb.left + r.width / 2, r.bottom - sb.top - 40] }),
    }
    keep.forEach(([e, tr, fl]) => { e.style.transform = tr; e.style.filter = fl })
  }
  return {
    perDay(t) { return perDay.map((list) => (list.length ? eo(list.filter((p) => t >= p.ts + p.fl).length / list.length) : 0)) },
    draw(t, alpha = 1) {
      ctx.clearRect(0, 0, 1680, 540)
      if (!geo) measure()
      ctx.globalCompositeOperation = 'lighter'
      for (const p of parts) {
        const u = (t - p.ts) / p.fl
        if (u < 0 || u > 1.15) continue
        const [sx, sy] = geo.src[p.pi], [ex, ey0] = geo.col[p.d]
        const ey = ey0 - 30 - p.jitter * 0.6, cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 120 + p.bend
        const col = hex(P[p.pi][1])
        for (let k = 0; k < 5; k++) {
          const uu = clamp(eio(clamp(u)) - k * 0.035)
          const x = (1 - uu) * (1 - uu) * sx + 2 * (1 - uu) * uu * cx + uu * uu * (ex + p.jitter)
          const y = (1 - uu) * (1 - uu) * sy + 2 * (1 - uu) * uu * cy + uu * uu * ey
          const a = (k === 0 ? 0.55 : 0.2 / k) * alpha * (u > 1 ? 1 - (u - 1) / 0.15 : 1)
          const rr = p.r * (k === 0 ? 3 : 2)
          const g = ctx.createRadialGradient(x, y, 0, x, y, rr)
          g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`)
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

// ---- a slow, tilted 3D hero behind or below an intro title ----
function hero(kind, vis) {
  vis.style.top = '570px'; vis.style.height = '590px'
  vis.style.webkitMaskImage = 'linear-gradient(to bottom, transparent 0, #000 150px)'; vis.style.maskImage = vis.style.webkitMaskImage
  const tilt = (t) => { const a = eo(prog(t, 0, 1.5)); return { a, rx: lerp(52, 28, a) - t * 1.4, ry: lerp(-16, -7, a) + Math.sin(t * 0.8) * 3, ty: (1 - a) * 200 - t * 12 } }
  if (kind === 'chart' || kind === 'calendar' || kind === 'sessions') {
    const wrap = $('div', 'p3d'); wrap.style.cssText = 'position:absolute;left:0;top:0;width:1680px;height:560px'
    vis.appendChild(wrap)
    let node, inner
    if (kind === 'chart') { const ch = weekChart(); ch.el.style.height = '540px'; node = ch.el; inner = (t) => ch.set({ t, grow: prog(t, 0.1, 1.6), line: prog(t, 1.2, 2.6), proj: prog(t, 2.5, 3.2), dot: prog(t, 3.0, 3.5), dry: prog(t, 3.2, 3.9), pill: prog(t, 3.5, 4.0), pe: [RUN, 100], pillText: dur(TOTAL - RUN) + ' without Claude' }) }
    else if (kind === 'calendar') { const c = calendar({ pill: true }); node = c.el; inner = (t) => c.set({ t, fig: prog(t, 0.2, 1.6), fill: prog(t, 0.2, 1.8), ghostTo: RUN, ghostP: prog(t, 1.4, 2.6), run: RUN, runP: prog(t, 2.2, 3), runText: 'Runs out ' + at(RUN), dry: prog(t, 2.8, 3.6) }) }
    else {
      node = $('div'); node.style.cssText = 'position:relative;width:900px;height:520px;margin:0 auto'
      SESS.forEach(([a, b, c], i) => { const e = sessCard(a, b, c); e.style.top = i * 98 + 'px'; node.appendChild(e) })
      inner = () => {}
    }
    wrap.appendChild(node)
    return (t, s) => { const k = tilt(t); node.style.transform = `translateY(${k.ty}px) rotateX(${k.rx}deg) rotateY(${k.ry}deg)`; node.style.opacity = (0.25 + 0.75 * k.a) * visOut(t, s); inner(t) }
  }
  const spec = {
    pane: ['pane.png', 1271, 1560, 1680, 560, { s: 1, cy: (t) => 212 + t * 22 }, true],
    needs: ['needs.png', 715, 594, 1680, 560, { s: 2.45, cy: (t) => 136 + t * 12 }],
    standout: ['standout.png', 715, 334, 1680, 450, { s: 1.7, cy: (t) => 100 + t * 10 }],
    band: ['band.png', 767, 83, 1680, 182, { s: 1, cy: () => 42 }],
  }[kind]
  const sh = shot(IMG + spec[0], spec[1], spec[2], spec[3], spec[4], [], !!spec[6]); sh.el.style.position = 'absolute'; sh.el.style.left = '0'; sh.el.style.top = kind === 'band' ? '170px' : '0'
  vis.appendChild(sh.el)
  return (t, s) => { const k = tilt(t); sh.el.style.transform = `translateY(${k.ty}px)`; sh.set({ rx: k.rx, ry: k.ry, s: spec[5].s, cy: spec[5].cy(t), op: (0.25 + 0.75 * k.a) * visOut(t, s), sheen: prog(t, 0.8, 2.6) }) }
}

// ---- scenes ----
// A scene: { dur, mood, big, title, sub, sub2, sub2At, cap, sample, build(vis, sc) -> draw(t, sc) }
function textBlock(sc, s) {
  const box = $('div', 'txt')
  const h = $('div', 'h'), sub = $('div', 's'), a = $('span'), b = $('span')
  sub.append(a, b); box.append(h, sub)
  sc.appendChild(box)
  if (s.ctr) { box.classList.add('ctr'); sc.classList.add('ctr') }
  if (s.hs) h.style.fontSize = s.hs + 'px'
  if (s.top != null) box.style.top = s.top + 'px'
  const hw = words(h, s.title || ''), aw = words(a, s.sub || ''), bw = words(b, s.sub2 || '')
  if (!s.sub && !s.sub2) sub.style.display = 'none'
  if (s.e) { h.style.setProperty('--e1', s.e[0]); h.style.setProperty('--e2', s.e[1]) }
  return (t) => {
    // the title and sub move up and out before the next scene's arrive
    const outP = s.last ? 0 : prog(t, s.dur - XF - 0.4, s.dur - XF)
    kin(hw, prog(t, -0.2, 1.3), { out: outP })
    const swap = s.sub2 ? prog(t, s.sub2At, s.sub2At + 0.7) : 0
    kin(aw, prog(t, 0.3, 1.9), { stagger: 0.025, dist: 24, blur: 10, out: Math.max(outP, swap) })
    if (s.sub2) kin(bw, prog(t, s.sub2At + 0.2, s.sub2At + 1.6), { stagger: 0.025, dist: 24, blur: 10, out: outP })
  }
}
const visOut = (t, s) => (s.last ? 1 : 1 - eo(prog(t, s.dur - 0.45, s.dur)))

const S = {}
S.cold = () => ({
  dur: 5.5, mood: 'red', glow: 0.7, chrome: false, big: true, ctr: true, hs: 128, top: 110, title: 'It always runs out\non a *Saturday.*', e: ['#FF453A', '#FF9F0A'],
  cap: 'It always runs out on a Saturday.\nWeekly limit reached. Resets Sunday at 2:00 PM, 32 h 38 min from now.',
  build(vis, sc) {
    vis.remove()
    const clock = $('div', 'clock num'); sc.appendChild(clock)
    const n = $('div', 'notice card', '<div class="r1"><i class="dot" style="background:var(--bad);width:22px;height:22px"></i>Weekly limit reached</div><div class="r2">Resets Sunday at 2:00 PM, 32 h 38 min from now</div>')
    sc.appendChild(n)
    const R = rng(11)
    const sparks = Array.from({ length: 90 }, () => ({ a: R() * Math.PI * 2, v: 260 + R() * 900, life: 0.7 + R() * 0.9, r: 2 + R() * 4, c: R() < 0.3 ? [255, 255, 255] : R() < 0.6 ? [255, 159, 10] : [255, 69, 58] }))
    const OX = 960, OY = 700, IMPACT = 1.05
    return (t, s) => {
      const vo = visOut(t, s)
      const sec = 30 + Math.floor(t) // the clock keeps ticking, 5:21:30 and on
      clock.textContent = 'Saturday  5:21:' + String(sec % 60).padStart(2, '0') + ' AM'
      clock.style.opacity = clamp(t * 3) * vo
      const p = prog(t, 0.7, 1.05), b = back(p)
      const shake = t > IMPACT && t < 1.9 ? Math.sin(t * 95) * 16 * (1 - prog(t, IMPACT, 1.9)) : 0
      const push = 1 + 0.035 * prog(t, 1.2, 5.5)
      n.style.opacity = clamp(p * 3) * vo
      n.style.transform = `translate(calc(-50% + ${shake}px), -50%) scale(${lerp(1.7, 1, b) * push})`
      const pulse = 0.5 + 0.5 * Math.sin((t - 1.4) * 2.6), hit = clamp(1 - prog(t, IMPACT, 2.4))
      n.style.boxShadow = `0 0 ${lerp(70, 150, pulse) + hit * 120}px rgba(255,69,58,${0.32 + 0.3 * pulse + 0.4 * hit}), 0 60px 140px -60px rgba(0,0,0,.9)`
      n.style.borderColor = `rgba(255,69,58,${0.35 + 0.4 * pulse})`
      sc._glow = 0.75 + 0.5 * pulse * prog(t, 1.2, 1.8) + 0.9 * hit * clamp(p * 4)
      // impact: a bloom, a ring and sparks
      fx.globalCompositeOperation = 'lighter'
      const u = t - IMPACT
      if (u > 0 && u < 1.6) {
        const bl = fx.createRadialGradient(OX, OY, 0, OX, OY, lerp(120, 1000, eo(u / 1.2)))
        bl.addColorStop(0, `rgba(255,220,200,${0.55 * (1 - u / 1.6)})`); bl.addColorStop(0.35, `rgba(255,69,58,${0.28 * (1 - u / 1.6)})`); bl.addColorStop(1, 'rgba(255,69,58,0)')
        fx.fillStyle = bl; fx.fillRect(0, 0, W, H)
        fx.strokeStyle = `rgba(255,140,120,${0.4 * (1 - u / 1.0)})`; fx.lineWidth = 4 * (1 - u / 1.6) + 1
        if (u < 1.0) { fx.beginPath(); fx.ellipse(OX, OY, lerp(80, 760, eo(u / 1.0)), lerp(50, 300, eo(u / 1.0)), 0, 0, Math.PI * 2); fx.stroke() }
      }
      if (u > 0) for (const q of sparks) {
        const k = u / q.life; if (k > 1) continue
        const d = q.v * (1 - Math.pow(1 - k, 2.2)) * 0.55
        const x = OX + Math.cos(q.a) * d * 1.5, y = OY + Math.sin(q.a) * d * 0.8 + 260 * k * k
        const rr = q.r * 3 * (1 - k * 0.6), g = fx.createRadialGradient(x, y, 0, x, y, rr)
        g.addColorStop(0, `rgba(${q.c},${0.8 * (1 - k) * vo})`); g.addColorStop(1, `rgba(${q.c},0)`)
        fx.fillStyle = g; fx.beginPath(); fx.arc(x, y, rr, 0, Math.PI * 2); fx.fill()
      }
      fx.globalCompositeOperation = 'source-over'
    }
  },
})
S.question = (title = 'Where did your *week* go?', sub = 'ToBeBestMe, a free mod for Claude Code, answers that.') => ({ dur: 4.2, mood: 'blue', big: true, sample: true, title, sub, e: ['#64D2FF', '#BF5AF2'], build: (vis) => hero('pane', vis) })
S.intro = (title, sub, mood = 'blue', e, kind = 'chart') => ({ dur: 4, mood, big: true, sample: true, title, sub, e: e || ['#64D2FF', '#BF5AF2'], build: (vis) => hero(kind, vis) })
S.flow = (title, sub, cap) => ({
  dur: 11.8, mood: 'projects', sample: true, title, sub, cap, e: ['#BF5AF2', '#00C7BE'],
  build(vis) {
    const srcs = $('div', 'srcs')
    const els = P.map(([k, c]) => { const e = $('div', 'src card', `<i class="dot" style="background:${c};width:18px;height:18px;box-shadow:0 0 18px ${c}"></i>${k}`); srcs.appendChild(e); return e })
    const ch = weekChart(); ch.el.style.position = 'absolute'; ch.el.style.left = '400px'; ch.el.style.width = '1280px'; ch.el.style.top = '0'; ch.el.style.height = '540px'
    ch.el.querySelector('.chips').style.display = 'none'
    // particles live in a canvas inside the chart card, under the bar labels, so the labels stay readable
    const cv = $('canvas', 'flowcv'); cv.width = 1680; cv.height = 540; cv.style.cssText = 'position:absolute;left:-401px;top:-1px;width:1680px;height:540px;z-index:2;pointer-events:none'
    ch.el.appendChild(cv)
    vis.append(srcs, ch.el)
    const f = flow(ch, els, vis, cv.getContext('2d'))
    return (t, s) => {
      els.forEach((e, i) => rise(e, prog(t, 0.2 + i * 0.08, 1 + i * 0.08), 30))
      rise(ch.el, prog(t, 0.1, 0.9), 40)
      const lt = t - 0.6
      ch.set({ t, perDay: f.perDay(lt), line: prog(t, 8.0, 9.4), proj: prog(t, 9.3, 10.0), dot: prog(t, 9.8, 10.3), dry: prog(t, 10.0, 10.6), pe: [RUN, 100], text: '<b class="num">82%</b> of the weekly limit so far, across 6 projects.', textP: prog(t, 8.4, 9.4) })
      vis.style.opacity = visOut(t, s)
      f.draw(lt, visOut(t, s))
    }
  },
})
S.focus = (title, sub, mode = 'project', cap) => ({
  dur: mode === 'day' ? 7.5 : 6.5, mood: mode === 'day' ? 'projects' : 'purple', sample: true, title, sub, cap, e: ['#BF5AF2', '#FF375F'],
  build(vis) {
    const wrap = $('div', 'p3d'); wrap.style.height = '540px'
    const ch = weekChart(); ch.el.style.height = '540px'
    wrap.appendChild(ch.el); vis.appendChild(wrap)
    const ptr = pointer(vis)
    const tp = mode === 'day' ? 1.5 : 1.15
    let geo = null
    return (t, s) => {
      const tilt = eo(prog(t, 0, 0.9))
      ch.el.style.transform = `rotateX(${lerp(24, 0, tilt)}deg) translateY(${lerp(80, 0, tilt)}px) scale(${lerp(0.9, 1, tilt)})`
      ch.el.style.opacity = clamp(t * 2.5) * visOut(t, s)
      const fp = eo(prog(t, tp + 0.05, tp + 0.8))
      const marks = { t, line: 1, proj: 1, dot: 1, dry: 1, pe: [RUN, 100] }
      if (mode === 'day') ch.set({ ...marks, grow: 1, day: 3, dayP: fp, text: '<b>Wednesday</b> used <b class="num">21%</b> of the weekly limit: storefront 12%, ledger-api 5.6%, docs-site 3.3%.', textP: prog(t, tp + 0.5, tp + 1.3) })
      else ch.set({ ...marks, grow: 1, project: 'storefront', projP: fp, text: '<b>storefront</b> used <b class="num">49%</b> of this week’s limit, most of it on Wednesday.', textP: prog(t, tp + 0.5, tp + 1.3) })
      if (!geo) {
        const keep = ch.el.style.transform; ch.el.style.transform = 'none'
        const vr = vis.getBoundingClientRect(), r = (mode === 'day' ? ch.cols[3].st : ch.chips.children[0]).getBoundingClientRect()
        geo = [r.left - vr.left + r.width / 2, mode === 'day' ? r.top - vr.top + 36 : r.top - vr.top + r.height / 2]
        ch.el.style.transform = keep
      }
      const m = eio(prog(t, 0.2, tp)), x = lerp(geo[0] + 460, geo[0], m), y = lerp(geo[1] + 300, geo[1], m)
      const down = prog(t, tp, tp + 0.1) * (1 - prog(t, tp + 0.1, tp + 0.3))
      ptr.set(x, y, prog(t, 0.2, 0.5) * (1 - prog(t, tp + 1.1, tp + 1.6)) * visOut(t, s), down, prog(t, tp, tp + 0.6))
    }
  },
})
S.forecast = (o = {}) => {
  const fast = !!o.fast
  const T = fast ? { fig: [-1, 0], fill: [-1, 0], ghost: [0.5, 1.7], run: [1.5, 2.2], dry: [2.1, 2.9] } : { fig: [0.5, 1.8], fill: [0.7, 2.2], ghost: [2.4, 3.6], run: [3.4, 4.1], dry: [4.3, 5.1] }
  const END = Math.round(USED + RATE * 0.25 * (TOTAL - NOW))
  return {
    dur: o.dur || 11, mood: 'amber', sample: true, title: o.title || 'Know before you *run out.*', e: ['#FF9F0A', '#FF375F'], cap: o.cap,
    sub: o.sub || 'At this pace it runs out Saturday at 5:21 AM, 32 h 38 min before it resets.', sub2: o.sub2 === undefined ? 'Ease off to a quarter of today’s pace, and it lasts the week.' : o.sub2, sub2At: o.sub2At || 6.0,
    build(vis) {
      const c = calendar({ pill: true }); vis.appendChild(c.el)
      const pace = o.pace === undefined ? [6.3, 8.4] : o.pace
      return (t, s) => {
        rise(c.el, prog(t, 0.05, 0.8), 50); c.el.style.opacity = Math.min(+c.el.style.opacity, visOut(t, s))
        const m = pace ? lerp(1, 0.25, eio(prog(t, pace[0], pace[1]))) : 1
        const runH = 18 / (RATE * m), runs = NOW + runH < TOTAL
        const ok = pace ? eo(prog(t, pace[0] + 1.2, pace[1])) : 0
        const sw = pace ? eo(prog(t, pace[0] + 0.9, pace[0] + 1.6)) : 0
        const P_ = (k) => prog(t, T[k][0], T[k][1])
        c.set({ t, fig: P_('fig'), fill: P_('fill'), ghostTo: runs ? NOW + runH : TOTAL, ghostP: P_('ghost'), run: runs ? NOW + runH : TOTAL - 0.01, runP: P_('run'),
          runText: 'Runs out ' + at(NOW + runH), runText2: 'Lasts the week, ending near ' + END + '%', swapP: runs ? 0 : sw, dry: runs ? eo(P_('dry')) : 0, ok, endPct: USED + RATE * m * (TOTAL - NOW) })
      }
    },
  }
}
// o.done lists what is already drawn when the scene starts; o.at gives [from, to] seconds for what animates in it
S.window = (o) => ({
  dur: o.dur || 7, mood: 'amber', sample: true, title: o.title, sub: o.sub, sub2: o.sub2, sub2At: o.sub2At, cap: o.cap, e: ['#FF9F0A', '#FF375F'],
  build(vis) {
    const c = calendar({ figure: (o.done || []).includes('fig') || !!(o.at && o.at.fig), brk: !!(o.at && o.at.brk) }); vis.appendChild(c.el)
    const v = (t, k) => (o.at && o.at[k] ? prog(t, o.at[k][0], o.at[k][1]) : (o.done || []).includes(k) ? 1 : 0)
    return (t, s) => {
      rise(c.el, prog(t, 0.05, 0.8), 40); c.el.style.opacity = Math.min(+c.el.style.opacity, visOut(t, s))
      const hasRun = v(t, 'ghost') > 0 || v(t, 'run') > 0
      c.set({ t, bars: v(t, 'days'), daysP: v(t, 'days'), resetP: v(t, 'reset'), labels: 1, fig: v(t, 'fig'), fill: v(t, 'fill'), ghostTo: RUN, ghostP: v(t, 'ghost'), run: hasRun ? RUN : null, runP: v(t, 'run'),
        runText: 'Runs out ' + at(RUN), dry: eo(v(t, 'dry')), brk: v(t, 'brk'), brkText: dur(TOTAL - RUN) + ' without Claude' })
    }
  },
})
S.colours = (title, sub) => ({
  dur: 8.6, mood: 'red', title, sub, sample: true, e: ['#FF9F0A', '#FF453A'],
  build(vis) {
    const box = $('div', 'rows card')
    const rows = [['5-hour limit', '#BF5AF2', 40], ['Weekly limit', '#FF9F0A', 82], ['Context', '#FF453A', 85]].map(([n, c, v]) => {
      const r = $('div', 'row', `<span>${n}</span><span class="t"><i style="background:${c};box-shadow:0 0 30px ${c}"></i></span><span class="pc num" style="color:${c === '#BF5AF2' ? 'var(--fg)' : c}">0%</span>`)
      box.appendChild(r); return [r, v]
    })
    const sh = shot(IMG + 'band.png', 767, 83, 1680, 182, [[10, 47, 182, 28, 'ring', '#FF453A'], [388, 47, 184, 28, 'ring', '#FF9F0A']]); sh.el.style.marginTop = '26px'
    vis.append(box, sh.el)
    return (t, s) => {
      rise(box, prog(t, 0.1, 0.9)); box.style.opacity = Math.min(+box.style.opacity, visOut(t, s))
      rows.forEach(([r, v], i) => { const p = eo(prog(t, 0.9 + i * 0.5, 2.4 + i * 0.5)); r.querySelector('i').style.width = v * p + '%'; r.querySelector('.pc').textContent = Math.round(v * p) + '%' })
      // the payoff: the same colours on the line above the prompt
      const q = eo5(prog(t, 4.4, 5.6))
      sh.set({ rx: lerp(40, 0, q), z: lerp(-200, 0, q), op: q * visOut(t, s), sheen: prog(t, 5.2, 6.8), h: [prog(t, 6.0, 6.6), prog(t, 6.6, 7.2)] })
    }
  },
})

// one persistent needs shot serves every needs scene of a video; it lives above the scenes and moves between rows
// the Needs you section as drawn: the Now card (red), then Notes sync and Checkout redesign (amber), then Ledger import and Docs search (grey)
const NEEDS = ['needs.png', 715, 594, [[13, 35, 689, 203], [14, 285, 700, 150], [14, 443, 700, 143]]]
const NROW = { red: 136, amber: 360, grey: 478 }, NIDX = { red: 0, amber: 1, grey: 2 }, NKS = 2.45
S.needs = (title, sub, focus = 'sweep', o = {}) => ({
  dur: o.dur || 9, needs: focus, mood: focus === 'red' ? 'red' : focus === 'amber' ? 'amber' : 'blue', sample: true, title, sub, cap: o.cap, e: focus === 'red' ? ['#FF453A', '#FF375F'] : focus === 'amber' ? ['#FF9F0A', '#FFB340'] : ['#64D2FF', '#0A84FF'],
  build() { return () => {} },
})
function needsState(T, list) {
  let ci = -1
  list.forEach((x, i) => { if (T >= x.start) ci = i })
  if (ci < 0) return null
  const cur = list[ci], t = T - cur.start
  if (t >= cur.s.dur) return null
  const m = cur.s.needs, prev = list[ci - 1], h = [0, 0, 0]
  let cy = 297, s = 1, rx = 0, ry = 0, z = 0, sheen = 0
  if (m === 'sweep') {
    const e = eo(prog(t, 0, 1.7)); rx = lerp(32, 0, e); ry = lerp(-18, 0, e); z = lerp(-300, 0, e); sheen = prog(t, 0.6, 2.2)
    const A = [2.5, 4.3, 6.1]
    A.forEach((a, i) => (h[i] = prog(t, a, a + 0.4) * (1 - prog(t, a + 1.5, a + 1.9))))
    const zm = eio(prog(t, 1.5, 2.4)) * (1 - eio(prog(t, 7.9, 8.7)))
    const row = lerp(lerp(NROW.red, NROW.amber, eio(prog(t, A[1] - 0.4, A[1] + 0.3))), NROW.grey, eio(prog(t, A[2] - 0.4, A[2] + 0.3)))
    s = lerp(1, NKS, zm); cy = lerp(297, row, zm)
  } else if (!prev) {
    const e = eo(prog(t, 0, 1.7)); rx = lerp(32, 0, e); ry = lerp(-18, 0, e); z = lerp(-300, 0, e); sheen = prog(t, 0.6, 2.2)
    const zm = eio(prog(t, 1.3, 2.4)); s = lerp(1, NKS, zm); cy = lerp(297, NROW[m], zm); h[NIDX[m]] = prog(t, 1.8, 2.3)
  } else {
    s = NKS; cy = lerp(NROW[prev.s.needs], NROW[m], eio(prog(t, 0, 1.1)))
    h[NIDX[m]] = prog(t, 0.7, 1.2); h[NIDX[prev.s.needs]] = Math.max(h[NIDX[prev.s.needs]], 1 - prog(t, 0, 0.5))
  }
  ry += Math.sin(T * 0.5) * 1.4 * eo(prog(t, 2, 3)); rx += Math.cos(T * 0.4) * 0.8 * eo(prog(t, 2, 3))
  const last = ci === list.length - 1
  const op = (prev ? 1 : clamp(t * 2.5)) * (last ? visOut(t, cur.s) : 1)
  return { rx, ry, z, s, cy, h, sheen, op }
}

const SESS = [['Release', 'Needs your permission', 'var(--bad)'], ['Notes sync', 'Asked you a question', 'var(--warn)'], ['Checkout redesign', 'Waiting for your answer', 'var(--warn)'], ['Ledger import', 'Ready to carry on', 'var(--idle)'], ['Docs search', 'Pull request open', 'var(--idle)']]
function sessCard(a, b, c) {
  return $('div', 'sess card', `<div class="a"><i class="dot" style="background:${c};box-shadow:0 0 16px ${c};width:16px;height:16px"></i>${a}</div><div class="b" style="color:${c}">${b}</div>`)
}
S.sessions = (title, sub, cap) => ({
  dur: 7, mood: 'blue', title, sub, cap, sample: true, e: ['#64D2FF', '#BF5AF2'],
  build(vis) {
    // five slots spread over the full width, no two touching; the cards fly in at 60% size, then settle into one 900px list
    const SLOT = [[20, 0, -5], [560, 150, 3], [1080, 0, 4], [200, 260, 4], [940, 290, -3]]
    const cards = SESS.map(([a, b, c], i) => { const e = sessCard(a, b, c); vis.appendChild(e); return { e, sx: SLOT[i][0], sy: SLOT[i][1], sr: SLOT[i][2], i } })
    const mk = (txt, top, h, col) => { const l = $('div', 'grp', txt); l.style.cssText = `top:${top}px;height:${h}px;border-color:${col};color:${col}`; vis.appendChild(l); return l }
    const g1 = mk('Waiting on you', -4, 3 * 98 - 12, 'var(--fg)'), g2 = mk('Ready to carry on', 3 * 98 - 4, 2 * 98 - 12, 'var(--fg-2)')
    return (t, s) => {
      cards.forEach((c) => {
        const p = eo5(prog(t, 0.2 + c.i * 0.1, 1.1 + c.i * 0.1)), g = eio(prog(t, 2.6 + c.i * 0.08, 3.9 + c.i * 0.08))
        const x = lerp(c.sx, 390, g), y = lerp(c.sy, c.i * 98, g), r = lerp(c.sr, 0, g), k = lerp(0.58, 1, g)
        c.e.style.opacity = p * visOut(t, s)
        c.e.style.transform = `translate(${x + lerp(0, c.i % 2 ? 80 : -80, 1 - p)}px,${y + (1 - p) * 90}px) rotate(${r}deg) scale(${k * lerp(0.9, 1, p)})`
        c.e.style.filter = `blur(${(1 - p) * 10}px)`
      })
      ;[g1, g2].forEach((e, i) => { const q = eo(prog(t, 4.1 + i * 0.4, 4.9 + i * 0.4)); e.style.opacity = q * visOut(t, s); e.style.transform = `translateX(${(1 - q) * -30}px)` })
    }
  },
})
S.band = (title, sub, focus = 'dock', cap) => ({
  dur: focus === 'dock' ? 6.5 : focus === 'gauges' ? 7.5 : 7.2, mood: 'cyan', sample: true, title, sub, cap, e: ['#64D2FF', '#0A84FF'],
  build(vis) {
    const K = 1760 / 767, ox = -40
    const rects = { dock: [[2, 2, 763, 78, 'ring', '#FFFFFF']], gauges: [[10, 47, 182, 28, 'ring', '#FF453A'], [199, 47, 181, 28, 'ring', '#BF5AF2'], [388, 47, 184, 28, 'ring', '#FF9F0A']], top: [[10, 10, 462, 28, 'ring', '#FFB340'], [622, 15, 135, 31, 'ring', '#FFFFFF']] }[focus]
    const labels = { dock: [], gauges: [[100, 'Context 85%', '#FF453A', 1.4], [290, 'Five-hour 40%', '#BF5AF2', 2.7], [480, 'Weekly 82%', '#FF9F0A', 4.0]], top: [[240, 'The forecast and what’s waiting', '#FFB340', 1.4], [689, 'Opens what’s waiting', '#FFFFFF', 2.8]] }[focus]
    const wrap = $('div'); wrap.style.cssText = `position:absolute;left:${ox}px;top:40px;width:1760px`
    const sh = shot(IMG + 'band.png', 767, 83, 1760, 190, rects)
    const pr = $('div', 'prompt', '<span style="color:var(--fg-2);font-family:var(--mono)">›</span>Ask Claude to keep going'); pr.style.marginTop = '34px'
    sh.el.style.marginTop = '70px'
    wrap.append(sh.el, pr); vis.appendChild(wrap)
    const labs = labels.map(([cx, txt, col, at_]) => { const l = $('div', 'callout', txt); l.style.cssText = `left:${cx * K}px;top:14px;color:${col}`; l.style.setProperty('--c', col); wrap.appendChild(l); return [l, at_] })
    const ptr = focus === 'top' ? pointer(vis) : null
    const bx = ox + 689 * K, by = 40 + 70 + 31 * K
    return (t, s) => {
      const p = eo5(prog(t, 0.2, 1.5)), vo = visOut(t, s)
      pr.style.opacity = clamp(t * 2) * vo
      const h = rects.map((_, i) => (focus === 'dock' ? prog(t, 1.8, 2.4) : focus === 'gauges' ? prog(t, labels[i][3], labels[i][3] + 0.5) : prog(t, labels[i][3], labels[i][3] + 0.5)))
      sh.set({ rx: lerp(42, 0, p), z: lerp(-300, 0, p), op: p * vo, sheen: prog(t, 1, 2.6), h })
      labs.forEach(([l, a]) => { const q = eo(prog(t, a, a + 0.5)); l.style.opacity = q * vo; l.style.transform = `translate(-50%,${(1 - q) * 16}px)` })
      if (ptr) { const m = eio(prog(t, 3.0, 3.9)); ptr.set(lerp(bx + 500, bx, m), lerp(by + 280, by, m), prog(t, 3.0, 3.3) * (1 - prog(t, 5.2, 5.7)) * vo, prog(t, 4.1, 4.2) * (1 - prog(t, 4.2, 4.4)), prog(t, 4.1, 4.8)) }
    }
  },
})
S.savings = (title, sub, cap) => ({
  dur: 7.8, mood: 'green', sample: true, title, sub, cap, e: ['#30D158', '#00C7BE'],
  build(vis) {
    const top = $('div', 'topline')
    const sw = $('div', 'swap num', '<span style="color:var(--warn-text)">Sat 5:21 AM</span><span>Sat 1:15 PM</span>')
    const gain = $('div', 'gain num', '+7 h 54 min')
    top.append(sw, gain)
    const c = calendar({ figure: false, pill: true })
    vis.append(top, c.el)
    return (t, s) => {
      const o = visOut(t, s)
      rise(top, prog(t, 0.1, 0.9)); top.style.opacity = Math.min(+top.style.opacity, o)
      rise(c.el, prog(t, 0.2, 1.0)); c.el.style.opacity = Math.min(+c.el.style.opacity, o)
      const m = eio(prog(t, 2.4, 4.0))
      const [a, b] = sw.children
      a.style.transform = `translateY(${-m * 140}px)`; a.style.opacity = 1 - m; a.style.filter = `blur(${m * 12}px)`
      b.style.transform = `translateY(${(1 - m) * 140}px)`; b.style.opacity = m; b.style.filter = `blur(${(1 - m) * 12}px)`
      // the gain lands as the marker settles on the calendar
      const gp = prog(m, 0.82, 1)
      gain.style.opacity = gp; gain.style.transform = `translateY(${(1 - back(gp)) * 40}px) scale(${lerp(0.7, 1, back(gp))})`
      gain.style.textShadow = `0 0 ${20 + 30 * gp}px rgba(48,209,88,${0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3)) * gp}), 0 0 90px rgba(48,209,88,${0.35 * gp})`
      const run = lerp(RUN, AFTER, m)
      c.set({ t, fill: 1, ghostTo: run, ghostP: 1, run, runP: 1, runText: 'Runs out Sat 5:21 AM', runText2: 'Runs out Sat 1:15 PM', swapP: m, dry: 1, ok: m > 0.6 ? 1 : 0 })
    }
  },
})
S.standout = (title, sub, cap) => ({
  dur: 8.6, mood: 'green', sample: true, title, sub, cap, e: ['#30D158', '#64D2FF'],
  build(vis) {
    // standout.png is 715 × 334: the heading and the what-if sentence on top, the as-run and with-the-idea bars under them
    const sh = shot(IMG + 'standout.png', 715, 334, 1680, 450, [[14, 38, 340, 26, 'ring', '#30D158'], [12, 100, 574, 140, 'ring', '#30D158']]); sh.el.style.margin = '30px auto 0'
    vis.appendChild(sh.el)
    return (t, s) => {
      const e = eo(prog(t, 0, 1.6))
      const z1 = eio(prog(t, 2.0, 3.2)), z2 = eio(prog(t, 5.0, 6.4))
      const cx = lerp(357, 300, z1), cy = lerp(lerp(167, 82, z1), 175, z2), sc = lerp(1, 1.7, z1)
      sh.set({ rx: lerp(-28, 0, e), z: lerp(-260, 0, e), s: sc, cx, cy, op: clamp(t * 2) * visOut(t, s), sheen: prog(t, 0.8, 2.4), h: [prog(t, 3.0, 3.5) * (1 - prog(t, 4.8, 5.2)), prog(t, 6.2, 6.7)] })
    }
  },
})
// a fix made in the pane: now and after on the tab, written only on Save change
S.fix = (title, sub, sub2, cap) => ({
  dur: 10, mood: 'purple', sample: true, title, sub, sub2, sub2At: 5.0, cap, e: ['#BF5AF2', '#64D2FF'],
  build(vis) {
    // fix.png is 1255 × 218: the title, a Now block, an After block, and the Save change and Cancel buttons
    const K = 1680 / 1255, Z = 1.35, CX = 470, top = 70 // zoomed to the left part of the card, where the words are
    const sh = shot(IMG + 'fix.png', 1255, 218, 1680, 400, [[20, 58, 420, 52, 'ring', '#FF9F0A'], [20, 106, 860, 52, 'ring', '#30D158'], [24, 180, 112, 34, 'ring', '#FFFFFF']], true); sh.el.style.marginTop = top + 'px'
    vis.appendChild(sh.el)
    const ptr = pointer(vis)
    const bx = 840 + (79 - CX) * K * Z, by = top + 200 + (197 - 109) * K * Z
    return (t, s) => {
      const e = eo5(prog(t, 0, 1.4)), vo = visOut(t, s)
      sh.set({ s: Z, cx: CX, rx: lerp(36, 0, e), z: lerp(-300, 0, e), op: clamp(t * 2) * vo, sheen: prog(t, 0.8, 2.4), h: [prog(t, 1.8, 2.3) * (1 - prog(t, 3.4, 3.8)), prog(t, 3.8, 4.3) * (1 - prog(t, 5.4, 5.8)), prog(t, 6.4, 6.9)] })
      const m = eio(prog(t, 5.6, 6.7)); ptr.set(lerp(bx + 520, bx, m), lerp(by + 260, by, m), prog(t, 5.6, 5.9) * (1 - prog(t, 8.3, 8.8)) * vo, prog(t, 7.0, 7.1) * (1 - prog(t, 7.1, 7.3)), prog(t, 7.0, 7.7))
    }
  },
})
S.pane = (title, sub, cap) => ({
  dur: 10, mood: 'blue', sample: true, title, sub, cap, e: ['#64D2FF', '#BF5AF2'],
  build(vis) {
    const sh = shot(IMG + 'pane.png', 1271, 1560, 1680, 560, [[24, 60, 700, 160, 'ring', '#FF9F0A'], [24, 215, 1223, 245, 'ring', '#FF9F0A'], [30, 536, 696, 206, 'ring', '#FF453A'], [749, 500, 497, 262, 'ring', '#BF5AF2'], [24, 1212, 715, 336, 'ring', '#30D158']], true); vis.appendChild(sh.el)
    return (t, s) => {
      const e = eo(prog(t, 0, 1.8))
      // the whole pane, top to bottom: the hero, then Needs you and Projects, then the rest of the page
      const cy = 212 + 430 * eio(prog(t, 3.0, 4.4)) + 280 * eio(prog(t, 5.8, 7.2)) + 420 * eio(prog(t, 7.6, 9.0))
      const h = [prog(t, 1.2, 1.7) * (1 - prog(t, 2.0, 2.4)), prog(t, 1.9, 2.4) * (1 - prog(t, 2.9, 3.3)), prog(t, 4.3, 4.8) * (1 - prog(t, 5.7, 6.1)), prog(t, 4.8, 5.3) * (1 - prog(t, 5.7, 6.1)), prog(t, 8.4, 8.9)]
      sh.set({ rx: lerp(36, 3, e), ry: lerp(-8, 0, e), z: lerp(-500, 0, e), s: 1, cy, op: clamp(t * 2) * visOut(t, s), sheen: prog(t, 1, 3), h })
    }
  },
})
S.frame = (title, sub, n, cap) => ({
  dur: 7, mood: 'projects', sample: true, title, sub, cap, e: ['#BF5AF2', '#00C7BE'],
  build(vis) {
    const hgt = [446, 485, 490][n] // the hero crops in shots/, 1255 wide
    const dh = Math.min(520, Math.round((1680 / 1255) * hgt)), dw = Math.round((dh * 1255) / hgt)
    const sh = shot(SHOTS + 'frame-' + n + '.png', 1255, hgt, dw, dh); sh.el.style.margin = '10px auto 0'
    vis.appendChild(sh.el)
    return (t, s) => { const e = eo(prog(t, 0, 1.8)); sh.set({ rx: lerp(30, 0, e), ry: lerp(14, 0, e), z: lerp(-300, 0, e), s: 1, op: clamp(t * 2) * visOut(t, s), sheen: prog(t, 0.8, 2.6) }) }
  },
})
// two columns: what stays on the computer, what goes to Claude. Each scene lights one side.
S.list = (title, sub, both, side = 0, mood = 'blue', cap) => ({
  dur: 7.6, mood, title, sub, cap, e: ['#64D2FF', '#30D158'],
  build(vis) {
    const box = $('div', 'cols')
    const heads = ['On your computer', 'Sent to Claude, through your account']
    const cols = [0, 1].map((ci) => {
      const col = $('div', 'colx card'); col.appendChild($('div', 'colh', heads[ci]))
      const rows = both[ci].map(([c, a, b]) => { const r = $('div', 'li', `<i class="dot" style="background:${c};box-shadow:0 0 14px ${c}"></i><span><b>${a}</b> <span class="d">${b}</span></span>`); col.appendChild(r); return r })
      box.appendChild(col); return { col, rows }
    })
    vis.appendChild(box)
    return (t, s) => {
      rise(box, prog(t, 0.05, 0.8)); box.style.opacity = Math.min(+box.style.opacity, visOut(t, s))
      cols.forEach((c, ci) => {
        const on = ci === side
        c.col.style.opacity = on ? 1 : 0.32
        c.rows.forEach((r, i) => { if (on) rise(r, prog(t, 0.9 + i * 0.7, 1.7 + i * 0.7), 22); else { r.style.opacity = 1; r.style.transform = 'none'; r.style.filter = 'none' } })
      })
    }
  },
})
S.term = (title, sub, lines, o = {}) => ({
  dur: o.dur || 8, mood: 'blue', title, sub, cap: o.cap, e: ['#64D2FF', '#0A84FF'],
  build(vis) {
    vis.style.display = 'flex'; vis.style.alignItems = 'center'; vis.style.justifyContent = 'center'
    const box = $('div', 'term card'); vis.appendChild(box)
    const pane = o.pane ? shot(IMG + 'pane.png', 1271, 1560, 1680, 540, [], true) : null
    if (pane) { pane.el.style.position = 'absolute'; pane.el.style.left = '0'; pane.el.style.top = '0'; vis.appendChild(pane.el) }
    return (t, s) => {
      rise(box, prog(t, 0.1, 0.9)); box.style.opacity = Math.min(+box.style.opacity, visOut(t, s)) * (pane ? 1 - prog(t, o.pane, o.pane + 0.6) : 1)
      let html = '', left = t - 1.0, broke = false
      const cur = (idle) => '<span class="cur"' + (idle ? ' style="opacity:' + (Math.floor(t * 2) % 2) + '"' : '') + '></span>'
      for (const [kind, text, speed] of lines) {
        if (kind === 'in') {
          const sp = speed || 34
          if (left <= 0) { html += '<span class="pr">› </span>' + cur(true); broke = true; break }
          const n = Math.min(text.length, Math.floor(left * sp))
          html += '<span class="pr">› </span>' + esc(text.slice(0, n))
          if (n < text.length) { html += cur(false) + '<span style="visibility:hidden">' + esc(text.slice(n)) + '</span>'; broke = true; break }
          html += '\n'; left -= text.length / sp + 0.5
        } else { if (left <= 0) { broke = true; break } html += '<span class="out">' + esc(text) + '</span>\n'; left -= 0.4 }
      }
      if (!broke) html += '<span class="pr">› </span>' + cur(true)
      box.innerHTML = html
      if (pane) { const e = eo(prog(t, o.pane, o.pane + 1.6)); pane.set({ rx: lerp(40, 4, e), z: lerp(-400, 0, e), s: 1, cy: 212 + (t - o.pane) * 14, op: e * visOut(t, s), sheen: prog(t, o.pane + 0.5, o.pane + 2) }) }
    }
  },
})
// the end card: icon, title, the install command typed out, the URL, and the real pane drifting behind
S.end = (o = {}) => {
  const cmd = o.cmd !== false
  return {
    dur: o.dur || (cmd ? 8 : 6.5), mood: 'blue', chrome: false, big: true, ctr: true, hs: 118, top: 300, title: 'See where\nyour *week* went.', e: ['#64D2FF', '#BF5AF2'],
    cap: 'See where your week went.\n' + (cmd ? '/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme\n' : '') + 'github.com/vradulthub-cloud/tobebestme\nFree and open source. Not affiliated with Anthropic.',
    build(vis, sc) {
      vis.remove()
      const bgp = shot(IMG + 'pane.png', 1271, 1560, 1680, 1000, [], true); bgp.el.style.cssText += ';position:absolute;left:120px;top:40px;z-index:0;filter:blur(2px)'
      sc.insertBefore(bgp.el, sc.firstChild)
      const ic = iconBlock(sc, 160, 70)
      const full = '/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme'
      const pill = $('div', 'cmdp'); pill.innerHTML = '<span class="c"></span><span class="cur"></span>'; pill.style.top = '610px'
      const url = $('div', 'url', 'github.com/vradulthub-cloud/tobebestme'); url.style.top = cmd ? '770px' : '640px'; if (!cmd) url.style.fontSize = '44px'
      const foot = $('div', 'foot', 'Free and open source. Not affiliated with Anthropic.')
      sc.append(url, foot); if (cmd) sc.appendChild(pill)
      const c = pill.querySelector('.c'), cu = pill.querySelector('.cur')
      return (t, s) => {
        bgp.set({ rx: 22 + Math.sin(t * 0.3) * 4, ry: -10 + Math.sin(t * 0.25) * 8, z: -200, s: 1, cy: 380 + t * 55, op: 0.2 * clamp(t * 1.5) })
        ic(t, clamp(t * 3))
        rise(pill, prog(t, 1.0, 1.7), 30)
        const n = Math.floor(clamp((t - 1.5) / 2.2) * full.length)
        c.textContent = full.slice(0, n); cu.style.opacity = n < full.length ? 1 : Math.floor(t * 2) % 2
        rise(url, prog(t, cmd ? 3.9 : 1.2, cmd ? 4.7 : 2.0), 20); rise(foot, prog(t, cmd ? 4.6 : 1.8, cmd ? 5.4 : 2.6), 12)
      }
    },
  }
}
// a 2s lockup to close a feature explainer: icon, name, install address
S.lockup = () => ({
  dur: 3.2, mood: 'blue', chrome: false, big: true, ctr: true, hs: 124, top: 400, title: '*ToBeBestMe*', e: ['#64D2FF', '#BF5AF2'],
  cap: 'ToBeBestMe\ngithub.com/vradulthub-cloud/tobebestme',
  build(vis, sc) {
    vis.remove()
    const ic = iconBlock(sc, 190, 150)
    const url = $('div', 'url', 'github.com/vradulthub-cloud/tobebestme'); url.style.top = '610px'; url.style.fontSize = '42px'
    sc.appendChild(url)
    return (t) => { ic(t, clamp(t * 3)); rise(url, prog(t, 0.7, 1.4), 20) }
  },
})

const LR = [['#64D2FF', 'Your sessions’ records', 'in ~/.claude/projects, for usage, costs and waiting chats.'], ['#0A84FF', 'Session lists', 'from Claude Code and the Claude app, for what’s working or waiting.'], ['#00C7BE', 'git status', 'in recent sessions’ folders, for work left uncommitted.'], ['#5E5CE6', 'Your skill files', 'and two skill settings, for the skills check-up.']]
const LS = [['#30D158', 'Prompts you ask for', 'when you press a button that says so, like Fix description…, which sends that skill’s text.'], ['#30D158', 'A handoff note', 'before a compaction, written by Claude from the conversation.'], ['#30D158', 'A short line on your limits', 'once they run tight, so Claude keeps its steps small.'], ['#FF9F0A', 'Phone notifications', 'to the address you set, only if you set one.']]
const V = {
  overview: { label: 'ToBeBestMe in {n} seconds', scenes: () => [
    S.cold(),
    S.question(),
    S.flow('Every day, stacked by the *project* that used it.', 'Read from Claude Code’s own records on your computer.', 'Every day, stacked by the project that used it. 82% of the weekly limit so far, across 6 projects.'),
    S.focus('*storefront* did more than half of it.', 'Press a project, and the rest of the week steps back.', 'project', 'storefront did more than half of it. It used 49% of this week’s limit.'),
    S.forecast({ cap: undefined }),
    S.needs('The chat that needs you *most, first.*', 'A Now card for the most urgent, then the rest of the waiting chats from every session.', 'sweep', { dur: 9, cap: 'The chat that needs you most comes first, as a Now card. The rest of the waiting chats follow, from every session. The pane counts 4 more waiting.' }),
    S.band('One line, always *in view.*', 'Context and limits above where you type. Amber when one runs low, red when it’s nearly gone.', 'gauges'),
    S.savings('See what a change would *buy back.*', 'Half the Opus work on Sonnet moves the run-out from 5:21 AM to 1:15 PM.', 'See what a change would buy back. Half the Opus work on Sonnet moves the run-out from 5:21 AM to 1:15 PM: 7 h 54 min more.'),
    S.fix('Fix it in the pane, *not in the chat.*', 'The pane works out the change itself and shows what’s there now, and what it becomes after.', 'Nothing is written until you press Save change. Nothing goes through the conversation.'),
    S.pane('All of it, in *one pane* beside the chat.', 'The week, the chat that needs you, savings and fixes, beside your chat.'),
    S.end(),
  ] },
  week: { n: 1, label: 'Your week, by project', scenes: () => [
    S.intro('Your week, *by project.*', 'How the top of Home shows where your weekly limit went.', 'projects', ['#BF5AF2', '#00C7BE'], 'chart'),
    S.flow('Each day is a bar, stacked by *project.*', 'ToBeBestMe reads Claude Code’s records for every session on this computer, helpers and workflow agents included.', 'Each day is a bar, stacked by project. It reads Claude Code’s records for every session on this computer, helpers and workflow agents included. 82% of the weekly limit so far.'),
    S.focus('Press a *day.*', 'See what that day used, project by project.', 'day', 'Press a day. Wednesday used 21% of the weekly limit: storefront 12%, ledger-api 5.6%, docs-site 3.3%.'),
    S.focus('Pick a *project.*', 'Follow storefront through the week while the others step back.', 'project', 'Pick a project. storefront used 49% of this week’s limit, most of it on Wednesday.'),
    S.frame('The same, in the *real pane.*', 'Each project keeps its colour everywhere, so you can follow it down the page.', 2),
    S.lockup(),
  ] },
  runway: { n: 2, label: 'Know before you run out', scenes: () => [
    S.intro('Know before you *run out.*', 'How to read the forecast on every limit.', 'amber', ['#FF9F0A', '#FF375F'], 'calendar'),
    S.window({ dur: 5, title: 'Your weekly limit, on a *calendar.*', sub: 'It opened Sunday at 2:00 PM, and it resets a week later.', at: { days: [0.7, 1.7], reset: [1.4, 2.2] } }),
    S.window({ dur: 9.5, title: 'The line is the week *so far.*', sub: 'You’re at 82%. Each bar is a day’s work, and the orange line is your use climbing to Now.', sub2: 'The dashed line is where your pace leads: it runs out Saturday at 5:21 AM.', sub2At: 4.6, done: ['days', 'reset'], at: { fig: [0.8, 2.4], fill: [0.7, 2.8], ghost: [5.0, 6.4], run: [6.2, 7.0] } }),
    S.window({ dur: 7, title: 'Then you *wait.*', sub: '32 h 38 min with nothing left, the hatched stretch, until it resets Sunday at 2:00 PM.', done: ['days', 'reset', 'fig', 'fill', 'ghost', 'run'], at: { dry: [0.7, 1.8], brk: [1.8, 2.9] } }),
    S.forecast({ fast: true, dur: 8.5, title: 'Change the pace, and the forecast *follows.*', sub: 'At today’s pace it runs out Saturday at 5:21 AM.', sub2: 'At a quarter of today’s pace it lasts the week, ending near 98%.', sub2At: 3.2, pace: [3.4, 5.6] }),
    S.colours('Colour tells you when to *act.*', 'Amber past your alert, red when it’s nearly gone, on every tab and the line above the prompt.'),
    S.lockup(),
  ] },
  waiting: { n: 3, label: 'Every waiting chat', scenes: () => [
    S.intro('Answer every *waiting* chat.', 'From one place, whichever session it’s in.', 'blue', undefined, 'needs'),
    S.sessions('Five sessions. Three are *waiting on you.*', 'ToBeBestMe gathers every chat that stopped for you in the last week.', 'Five sessions. Three are waiting on you: one needs permission, two asked a question. The other two are ready to carry on.'),
    S.needs('*Red* needs your permission.', 'It leads as the Now card: a session running right now, stopped on a prompt. Switch to it to allow or deny.', 'red', { dur: 7 }),
    S.needs('*Amber* is waiting for your answer.', 'A question, a plan to approve or a choice, with the buttons the chat offered, like Ship it and Hold off.', 'amber', { dur: 6.5 }),
    S.needs('*Grey* can carry on when you’re ready.', 'Its limit has reset since, or its pull request is waiting for review.', 'grey', { dur: 6.5 }),
    S.lockup(),
  ] },
  band: { n: 4, label: 'The line above the prompt', scenes: () => [
    S.intro('One line, always *in view.*', 'What the line above the prompt tells you.', 'cyan', ['#64D2FF', '#0A84FF'], 'band'),
    S.band('It sits right above where you *type.*', 'In every session, in the terminal and the Claude desktop app.', 'dock'),
    S.band('Context and both limits, at a *glance.*', 'Here context is red at 85%, the five-hour limit at 40% and the weekly limit amber at 82%.', 'gauges'),
    S.band('And what *needs you.*', 'Waiting chats and the forecast, with a button that opens them.', 'top'),
    S.lockup(),
  ] },
  savings: { n: 5, label: 'What a change would save', scenes: () => [
    S.intro('See what a change would *buy back.*', 'How the savings suggestions work.', 'green', ['#30D158', '#00C7BE'], 'standout'),
    S.standout('It sees which models did the *work.*', 'This week Opus 5.5 did 98% of it. Drawn as run, the week ends near 124%. With half on Sonnet, about 114%.', 'It sees which models did the work. This week Opus 5.5 did 98% of it. As run, the week ends at about 124% of the limit; with half on Sonnet, about 114%. That is about 10 points back.'),
    S.savings('Then it shows the change on your *week.*', 'Half the Opus work on Sonnet moves the run-out from Saturday 5:21 AM to 1:15 PM.', 'Then it shows the change on your week. Saturday 5:21 AM becomes 1:15 PM: 7 h 54 min more.'),
    S.fix('Then make the change *here.*', 'Each idea has a button. The pane shows what’s there now and what it becomes after.', 'It writes the file only when you press Save change, and never over a file you edited meanwhile.'),
    S.intro('Estimates, and it *says so.*', 'From list prices and Claude Code’s own records.', 'green', ['#30D158', '#64D2FF'], 'calendar'),
    S.lockup(),
  ] },
  privacy: { n: 6, label: 'What it reads and sends', scenes: () => [
    S.intro('What it *reads*, and what it *sends.*', 'ToBeBestMe runs inside Claude Code, on your computer.', 'cyan', ['#64D2FF', '#30D158'], 'pane'),
    S.list('It reads Claude Code’s own *records.*', 'All of it on your computer.', [LR, LS], 0, 'cyan'),
    S.list('It sends only to Claude, through *your account.*', 'And to your phone, only if you set that up.', [LR, LS], 1, 'green'),
    S.intro('It never opens *.env* or key files.', 'No analytics, no tracking, no server of ours. SECURITY.md lists everything it reads and writes.', 'cyan', ['#64D2FF', '#30D158'], 'band'),
    S.lockup(),
  ] },
  install: { n: 7, label: 'Install in a minute', scenes: () => [
    S.intro('Running in a *minute.*', 'Three steps, and it works in every project.', 'blue', undefined, 'pane'),
    S.term('Check your *version.*', 'You need Claude Code 2.1.308 or later.', [['in', 'claude --version', 16], ['out', '2.1.310 (Claude Code)']], { dur: 6.5 }),
    S.term('Install the *mod.*', 'At a Claude Code prompt.', [['in', '/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme', 40], ['out', 'Installed tobebestme.']], { dur: 7.5 }),
    S.term('Open *it.*', 'Reopen the app or start a new session, then type /tobebestme.', [['in', '/tobebestme', 10]], { dur: 8.5, pane: 3.2, cap: 'Open it. Reopen the app or start a new session, then type /tobebestme. The pane opens beside your chat.' }),
    S.end({ cmd: false }),
  ] },
}

// ---- engine ----
let SCENES = [], DURATION = 0, VIDEO = null, chromeEl = null, NEEDS_EL = null, NEEDS_LIST = []
function load(name) {
  const stage = document.getElementById('stage')
  stage.querySelectorAll('.scene,.chrome,.nshared').forEach((e) => e.remove())
  VIDEO = V[name]
  SCENES = []
  let t0 = 0
  const list = VIDEO.scenes()
  list[list.length - 1].last = true
  for (const s of list) {
    const sc = $('div', 'scene' + (s.big ? ' big' : ''))
    const vis = $('div', 'vis')
    sc.appendChild(vis)
    const text = textBlock(sc, s)
    const draw = s.build(vis, sc)
    s._text = text
    stage.appendChild(sc)
    SCENES.push({ s, sc, draw, start: t0 })
    t0 += s.dur - XF
  }
  DURATION = t0 + XF
  NEEDS_LIST = SCENES.filter((x) => x.s.needs)
  NEEDS_EL = null
  if (NEEDS_LIST.length) {
    NEEDS_EL = shot(IMG + NEEDS[0], NEEDS[1], NEEDS[2], 1680, 540, NEEDS[3])
    NEEDS_EL.el.classList.add('nshared'); NEEDS_EL.el.style.cssText += ';position:absolute;left:120px;top:470px;z-index:3'
    stage.appendChild(NEEDS_EL.el)
  }
  const label = VIDEO.label.replace('{n}', Math.round(DURATION))
  chromeEl = $('div', 'chrome', `<div class="brand"><img src="${IMG}icon.svg" alt="">ToBeBestMe</div><div class="right"><span class="sample" id="sampletag">Sample data</span><div class="chap">${VIDEO.n ? VIDEO.n + ' of 7 · ' : ''}${label}</div></div>`)
  stage.appendChild(chromeEl)
  window.DURATION = DURATION
  const cues = SCENES.flatMap(({ s, start }) => {
    const clean = (x) => x.replace(/\*/g, '').replace(/\n/g, ' ')
    const ts = start + 0.3
    const out = []
    if (s.sub2) { out.push([ts, start + s.sub2At + 0.3, clean(s.title) + '\n' + clean(s.sub)]); out.push([start + s.sub2At + 0.3, 0, clean(s.title) + '\n' + clean(s.sub2)]) }
    else out.push([ts, 0, s.cap ? s.cap.replace(/\*/g, '') : clean(s.title) + (s.sub ? '\n' + clean(s.sub) : '')])
    return out
  })
  cues[0][0] = 0.3
  // cues run back to back, so no frame is left without a caption
  cues.forEach((c, i) => (c[1] = i + 1 < cues.length ? cues[i + 1][0] : DURATION))
  window.CAPTIONS = cues
  return DURATION
}
function seek(T) {
  fx.clearRect(0, 0, W, H)
  let mood = MOODS.blue.map(hex), glow = 1, sample = 0, chrome = 0
  const live = SCENES.filter(({ s, start }) => T >= start && T < start + s.dur)
  SCENES.forEach(({ sc }) => (sc.style.display = 'none'))
  live.forEach(({ s, sc, draw, start }, i) => {
    const t = T - start
    sc.style.display = 'block'
    const a = clamp(t / XF)
    sc.style.opacity = 1
    s._text(t)
    draw(t, s)
    const m = MOODS[s.mood || 'blue'].map(hex)
    mood = i === 0 ? m : mood.map((c, j) => mix(c, m[j], a))
    const g = sc._glow != null ? sc._glow : s.glow || 1
    glow = i === 0 ? g : lerp(glow, g, a)
    sample = Math.max(sample, s.sample ? clamp(t * 3) * clamp((s.dur - t) * 3) : 0)
    chrome += s.chrome === false ? 0 : clamp(t / XF) * (s.last ? 1 : clamp((s.dur - t) / XF))
  })
  if (NEEDS_EL) {
    const st = needsState(T, NEEDS_LIST)
    NEEDS_EL.el.style.display = st ? 'block' : 'none'
    if (st) NEEDS_EL.set({ rx: st.rx, ry: st.ry, z: st.z, s: st.s, cy: st.cy, op: st.op, h: st.h, sheen: st.sheen })
  }
  drawLight(T, mood, glow)
  chromeEl.style.opacity = Math.min(1, chrome)
  document.getElementById('sampletag').style.opacity = sample
  document.getElementById('fade').style.opacity = prog(T, DURATION - 0.45, DURATION)
}
window.load = load
window.seek = seek
window.VIDEOS = Object.keys(V)
const q = new URLSearchParams(location.search)
load(q.get('v') || 'overview')
seek(Number(q.get('t') || 0))
