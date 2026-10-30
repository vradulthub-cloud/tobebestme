// Renders videos frame by frame from a page that defines window.load(name), window.seek(t),
// window.DURATION, window.CAPTIONS and window.VIDEOS.
// node render.mjs --page examples/tobebestme/index.html [names...] [--out dir] [--sheet] [--to dir] [--fps 30] [--web]
// Writes <name>.mp4 (full quality), <name>.srt, <name>.vtt (the same captions as WebVTT) and <name>-poster.png; --web adds a lighter <name>-web.mp4.
// --sheet writes sample frames (two per scene) to a scratch folder for review instead.
// playwright-core comes from node_modules; PLAYWRIGHT_CORE (a path or file: URL to its index.mjs) points elsewhere, e.g. at another checkout's copy
const { chromium } = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core')
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
const HERE = dirname(fileURLToPath(import.meta.url))
const pick = (f, d) => (process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : d)
// a copy of this file kept beside its own index.html (ToBeBestMe's launch/video) renders that page to ../out/video
const LOCAL = existsSync(join(HERE, 'index.html'))
const PAGE = pick('--page', LOCAL ? join(HERE, 'index.html') : join(HERE, 'examples', 'tobebestme', 'index.html'))
const OUT = pick('--out', LOCAL ? join(HERE, '..', 'out', 'video') : join(HERE, 'out'))
const FFMPEG = process.env.FFMPEG || (existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg')
const args = process.argv.slice(2)
const sheet = args.includes('--sheet')
const fps = Number(args[args.indexOf('--fps') + 1]) || 30
const sheetDir = args.includes('--to') ? args[args.indexOf('--to') + 1] : join(LOCAL ? HERE : join(HERE, 'out'), LOCAL ? '.sheet' : 'sheet')
let names = args.filter((a, i) => !a.startsWith('--') && !['--fps', '--to', '--page', '--out'].includes(args[i - 1]))
mkdirSync(OUT, { recursive: true }); mkdirSync(sheetDir, { recursive: true })
const b = await chromium.launch({ args: ['--force-color-profile=srgb'] })
const page = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const errors = []; page.on('pageerror', (e) => errors.push(e.message))
await page.goto(pathToFileURL(PAGE.startsWith('/') ? PAGE : join(process.cwd(), PAGE)).href)
await page.evaluate(() => document.fonts.ready)
if (!names.length) names = await page.evaluate(() => window.VIDEOS)
const srt = (caps) => caps.map(([a, z, text], i) => { const f = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}` }; return `${i + 1}\n${f(a)} --> ${f(z)}\n${text}\n` }).join('\n')
for (const name of names) {
  const { dur, caps, starts } = await page.evaluate(async (n) => {
    window.load(n)
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})))
    return { dur: window.DURATION, caps: window.CAPTIONS, starts: window.CAPTIONS.map((c) => c[0]) }
  }, name)
  if (sheet) {
    const times = []
    caps.forEach(([a, z]) => { times.push(a + 1.2, z - 0.8) })
    let i = 0
    for (const t of times) { await page.evaluate((t) => window.seek(t), t); await page.screenshot({ path: join(sheetDir, `${name}-${String(i++).padStart(2, '0')}.png`) }) }
    console.log(name, 'sheet', times.length, 'frames', dur.toFixed(1) + 's', errors.length ? 'ERRORS ' + errors.join(' | ') : '')
    continue
  }
  const file = join(OUT, name + '.mp4')
  const ff = spawn(FFMPEG, ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] })
  const frames = Math.round(dur * fps)
  const t0 = Date.now()
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / fps)
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 })
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (f % 300 === 0) console.log(name, f + '/' + frames, Math.round((Date.now() - t0) / 1000) + 's')
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r))
  writeFileSync(join(OUT, name + '.srt'), srt(caps))
  writeFileSync(join(OUT, name + '.vtt'), 'WEBVTT\n\n' + srt(caps).replace(/(\d\d:\d\d:\d\d),(\d{3})/g, '$1.$2'))
  await page.evaluate((t) => window.seek(t), Math.min(dur - 1, (caps[2] || caps[0])[0] + 2.5))
  await page.screenshot({ path: join(OUT, name + '-poster.png') })
  if (args.includes('--web')) await new Promise((r) => spawn(FFMPEG, ['-loglevel', 'error', '-y', '-i', file, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(OUT, name + '-web.mp4')], { stdio: 'inherit' }).on('close', r))
  console.log(name, 'done', frames, 'frames', Math.round((Date.now() - t0) / 1000) + 's', errors.length ? 'ERRORS ' + errors.join(' | ') : '')
}
await b.close()
