# Renders the press kit from copy.md and the built assets: python3 kit-page.py <out.html>
# A full HTML document. Images and video are referenced as out/... and published beside the page.
# Sizes (dimensions and MB) are read from the files themselves; the icon and trademark note come from ../assets and ../TRADEMARKS.md.
import sys, re, html, os, struct, subprocess, shutil
src = open('copy.md').read()
secs = re.split(r'\n## ', src)
get = lambda name: next(s.split('\n', 1)[1] for s in secs if s.startswith(name))
def esc(t): return html.escape(t.strip())
def plain(t):  # paste-ready text: no markdown markers or image notes
    t = re.sub(r'^\[[^\]]+\]\s*$', '', t, flags=re.M)
    t = t.replace('**', '')
    return re.sub(r'\n{3,}', '\n\n', t).strip()

REPO = 'https://github.com/vradulthub-cloud/tobebestme'
SITE = 'https://vradulthub-cloud.github.io/tobebestme/'
INSTALL = '/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme'

# ---- file facts ----
def mb(path):
    n = os.path.getsize(path) / 1e6
    return '<0.1 MB' if n < 0.05 else f'{n:.1f} MB'
def dims(path):
    with open(path, 'rb') as f: head = f.read(32)
    if head[:8] == b'\x89PNG\r\n\x1a\n': return struct.unpack('>II', head[16:24])
    if head[:3] == b'GIF': return struct.unpack('<HH', head[6:10])
    if shutil.which('ffprobe'):
        try:
            o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip().split(',')
            return int(o[0]), int(o[1])
        except Exception: pass
    return None
def facts(path):
    if not os.path.exists(path): return ''
    d = dims(path)
    return (f'{d[0]} × {d[1]} · ' if d else '') + mb(path)

# ---- posts ----
card_n = 0
def card(title, text, note='', label=None):
    global card_n
    card_n += 1; i = card_n
    label = label or f'Copy {title.lower()}'
    return (f'<section class="post" data-card><div class="ph"><h3>{html.escape(title)}</h3>{f"<span class=note>{html.escape(note)}</span>" if note else ""}'
            f'<span class="st" role="status" aria-live="polite"></span>'
            f'<button type="button" class="btn" data-copy="t{i}" aria-label="{html.escape(label)}">Copy</button></div><pre id="t{i}">{esc(plain(text))}</pre></section>')
thread = get('X / Bluesky thread').split('\n---')[0]
posts = re.split(r'\n\*\*(\d)/\*\*\n', '\n' + thread)
tcards = ''.join(card(f'Post {posts[k]} of 5', posts[k + 1], (re.findall(r'\[([^\]]+)\]', posts[k + 1]) or [''])[-1], f'Copy post {posts[k]} of 5') for k in range(1, len(posts), 2))
li = get('LinkedIn').split('\n---')[0]
hn = get('Show HN').split('\n---')[0]
hn_title = re.search(r'\*\*Title:\*\* (.+)', hn).group(1)
hn_body = hn.split('**Maker comment (post it straight away):**', 1)[1]
rd = get('r/ClaudeAI').split('\n---')[0]
rd_title = re.search(r'\*\*Title:\*\* (.+)', rd).group(1)
rd_body = rd.split('**Body:**', 1)[1]
alts = get('Alt text').split('\n## ')[0]
alt = dict(re.findall(r'- \*\*([^*]+):\*\* (.+)', alts))

# ---- assets ----
def fig(path, key, cap):
    p = f'out/{path}'
    return (f'<figure class="asset"><a href="{p}" target="_blank" rel="noopener"><img src="{p}" loading="lazy" alt="{html.escape(alt.get(key, cap))}"></a>'
            f'<figcaption><b>{cap}</b><span>{facts(p)}</span><a href="{p}" target="_blank" rel="noopener" aria-label="Open {html.escape(cap)} full size">Open full size</a></figcaption></figure>')
imgs = fig('launch-hero.png', 'launch-hero.png', 'Launch image') + fig('social-card.png', 'social-card.png', 'GitHub social card')
car = ''.join(fig(f'carousel/0{i}.png', f'carousel/0{i}.png', f'Carousel slide {i} of 6') for i in range(1, 7))
demo = (f'<figure class="asset wide"><video src="out/demo.mp4" poster="out/demo-frame-0.png" controls muted loop playsinline preload="none" aria-label="{html.escape(alt.get("demo", "Demo"))}"></video>'
        f'<figcaption><b>Demo loop, 9 seconds</b><span>{facts("out/demo.mp4")} · GIF {facts("out/demo.gif")}</span>'
        '<span>launch/out/demo.mp4 · demo.gif</span></figcaption></figure>')
VIDS = [('overview', 'ToBeBestMe in 80 seconds', 'The launch video: the problem, the week by project, the forecast, waiting chats, the line above the prompt, savings and install.'),
  ('week', '1 · Your week, by project', 'Tokens flow from each project into the day that used them; press a day, pick a project, then the real pane.'),
  ('runway', '2 · Know before you run out', 'How to read the forecast: the window, the week so far, where your pace lands, the wait, and changing the pace.'),
  ('waiting', '3 · Every waiting chat', 'Sessions gather into one list; red, amber and grey explained on the real list.'),
  ('band', '4 · The line above the prompt', 'Where it sits, what its gauges say, and what needs you.'),
  ('savings', '5 · What a change would save', 'Which models did the work, and what moving some of it does to the week.'),
  ('privacy', '6 · What it reads and sends', 'Every source it reads, everything it sends, and what it never opens.'),
  ('install', '7 · Install in a minute', 'Check the version, install, open it.')]
vids = ''.join(
  f'<figure class="asset"><video src="out/video/{k}-web.mp4" poster="out/video/{k}-poster.png" controls muted playsinline preload="none" aria-label="{html.escape(t)}"></video>'
  f'<figcaption><b>{html.escape(t)}</b><span>{facts(f"out/video/{k}.mp4")} full · {facts(f"out/video/{k}-web.mp4")} web</span>'
  f'<span>Full quality and captions: launch/out/video/{k}.mp4 · {k}.srt</span></figcaption>'
  f'<p class="muted small">{html.escape(d)}</p></figure>'
  for k, t, d in VIDS if os.path.exists(f'out/video/{k}-web.mp4'))

# ---- brand ----
try: icon = re.sub(r'<title>.*?</title>', '', open('../assets/icon.svg').read(), flags=re.S).replace('width="1024" height="1024"', '')
except OSError: icon = ''
tm = ''
if os.path.exists('../TRADEMARKS.md'):
    body = open('../TRADEMARKS.md').read().split('\n', 1)[1].strip().split('\n\n')
    out = []
    for blk in body:
        if blk.lstrip().startswith('- '): out.append('<ul>' + ''.join(f'<li>{esc(l.lstrip()[2:])}</li>' for l in blk.split('\n') if l.strip().startswith('- ')) + '</ul>')
        else: out.append(f'<p>{esc(blk)}</p>')
    tm = ''.join(out)
SW = [('Ink', '#0A0B0D'), ('Paper', '#F5F5F7'), ('Blue', '#0A84FF'), ('Amber', '#FF9F0A'), ('Violet', '#BF5AF2'), ('Sky', '#64D2FF'), ('Teal', '#00C7BE'), ('Indigo', '#5E5CE6'), ('Sand', '#AC8E68'), ('Rose', '#FF375F')]
def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
swatches = ''.join(f'<li style="background:{h};color:{"#0A0B0D" if lum(h) > .25 else "#FFFFFF"}"><b>{n}</b><code>{h}</code></li>' for n, h in SW)

TEMPLATE = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<title>ToBeBestMe press kit</title>
<style>
/* Layout: a dark hero with the one-liner and the install line, then assets with their sizes, the brand, and copy you can paste post by post. */
:root { --bg: #F5F5F7; --paper: #FFFFFF; --line: rgba(0,0,0,.09); --fg: #1D1D1F; --fg-2: #56565E; --accent: #0071E3; --link: #0058B8; --ok: #1A8D3A;
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #0A0B0D; --paper: #141619; --line: rgba(255,255,255,.10); --fg: #F5F5F7; --fg-2: #A3A3AB; --accent: #0A84FF; --link: #4DA3FF; --ok: #30D158; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #0A0B0D; --paper: #141619; --line: rgba(255,255,255,.10); --fg: #F5F5F7; --fg-2: #A3A3AB; --accent: #0A84FF; --link: #4DA3FF; --ok: #30D158; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.5 var(--font); -webkit-font-smoothing: antialiased; }
.wrap { max-width: 1080px; margin: 0 auto; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); }
h1 { margin: 0; font-size: clamp(38px, 7vw, 72px); line-height: 1.03; letter-spacing: -.035em; }
h2 { margin: 0 0 18px; font-size: 30px; letter-spacing: -.02em; }
h3 { margin: 0; font-size: 17px; font-weight: 600; }
p { margin: 0; max-width: 68ch; }
a { color: var(--link); text-decoration: none; } a:hover { text-decoration: underline; }
code { font-family: var(--mono); }
.muted { color: var(--fg-2); } .small { font-size: 14px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 6px; }
.kit-hero { background: #0A0B0D; color: #F5F5F7; padding-block: max(56px, env(safe-area-inset-top, 0px)) 64px; }
.kit-hero .wrap { display: grid; gap: 22px; }
.kit-hero .eyebrow { margin: 0; font-weight: 600; color: #A3A3AB; }
.kit-hero .one { font-size: clamp(20px, 2.6vw, 26px); line-height: 1.35; color: #C7C7CC; max-width: 30em; }
.kit-hero a { color: #4DA3FF; }
.install { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; background: #141619; border: 1px solid rgba(255,255,255,.16); border-radius: 18px; padding: 14px 14px 14px 22px; width: fit-content; max-width: 100%; }
.install code { font-size: 15px; overflow-wrap: anywhere; min-width: 0; }
.big { min-height: 52px; padding: 0 26px; border-radius: 980px; border: 0; background: #0A84FF; color: #fff; font: 600 17px var(--font); cursor: pointer; }
.big:hover { background: #3396FF; }
.links { display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 15px; }
main { display: grid; gap: 72px; padding-block: 64px 96px; }
section[aria-labelledby] { display: grid; align-content: start; }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
@media (max-width: 760px) { .grid2 { grid-template-columns: minmax(0, 1fr); } .grid3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
figure { margin: 0; }
.asset { display: grid; gap: 10px; align-content: start; }
.asset.wide { margin-top: 24px; }
.asset img, .asset video { width: 100%; height: auto; display: block; border-radius: 12px; border: 1px solid var(--line); background: #0A0B0D; }
figcaption { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 14px; font-size: 14px; }
figcaption span { color: var(--fg-2); font-family: var(--mono); font-size: 13px; font-variant-numeric: tabular-nums; margin-right: auto; }
.sub { margin: 40px 0 16px; }
.brand { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 32px; align-items: start; background: var(--paper); border: 1px solid var(--line); border-radius: 20px; padding: 28px; }
@media (max-width: 640px) { .brand { grid-template-columns: minmax(0, 1fr); } }
.icon { width: 160px; } .icon svg { width: 100%; height: auto; display: block; border-radius: 36px; }
.brand-text { display: grid; gap: 14px; }
.brand-text ul { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--fg-2); }
.brand-name { font-size: 28px; font-weight: 700; letter-spacing: -.02em; }
.swatches { list-style: none; margin: 24px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; grid-column: 1 / -1; }
@media (max-width: 760px) { .swatches { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.swatches li { border-radius: 14px; padding: 14px; min-height: 84px; display: grid; align-content: end; border: 1px solid var(--line); }
.swatches code { font-size: 13px; }
.posts { display: grid; gap: 16px; }
.post { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
.ph { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; padding: 10px 12px 10px 20px; border-bottom: 1px solid var(--line); }
.ph .note { font-size: 13px; color: var(--fg-2); font-family: var(--mono); overflow-wrap: anywhere; min-width: 0; }
.st { margin-left: auto; font-size: 14px; color: var(--ok); }
.btn { min-height: 44px; min-width: 76px; padding: 0 18px; border-radius: 980px; border: 0; background: var(--accent); color: #fff; font: 600 15px var(--font); cursor: pointer; flex: none; }
.ph .st + .btn { margin-left: 0; }
pre { margin: 0; padding: 18px 20px 20px; white-space: pre-wrap; overflow-wrap: anywhere; font: 15px/1.55 var(--font); }
footer { padding-block: 0 56px; }
footer p { font-size: 13px; color: var(--fg-2); }
</style>
</head>
<body>
<header class="kit-hero">
  <div class="wrap">
    <p class="eyebrow">ToBeBestMe · press kit</p>
    <h1>See where your week went.</h1>
    <p class="one">A free, open-source mod for Claude Code: your week by project, whether you&rsquo;ll make it to the reset, and every chat waiting on you, beside the chat.</p>
    <div class="install" data-card><code id="install">@@INSTALL@@</code><button type="button" class="big" data-copy="install" aria-label="Copy the install command">Copy install command</button><span class="st" role="status" aria-live="polite"></span></div>
    <p class="links"><a href="@@REPO@@">Source on GitHub</a><a href="@@SITE@@">Landing page</a><span class="muted">Everything below is built from the mod&rsquo;s real output on the test suite&rsquo;s sample data.</span></p>
  </div>
</header>
<main class="wrap">
<section aria-labelledby="img"><h2 id="img">Images and video</h2>
<div class="grid2">@@IMGS@@</div>
@@DEMO@@
<h3 class="sub">Carousel, six slides</h3>
<div class="grid3">@@CAR@@</div></section>
<section aria-labelledby="vid"><h2 id="vid">Explainer videos</h2><p class="muted" style="margin-bottom:20px">1920 × 1080 at 30 frames a second, captions burned in for muted autoplay, with a subtitle file beside each one. Upload the .srt where a platform takes captions.</p><div class="grid2">@@VIDS@@</div></section>
<section aria-labelledby="brand"><h2 id="brand">Brand</h2>
<div class="brand">
  <div class="icon" role="img" aria-label="The ToBeBestMe icon: three bars on a dark rounded square">@@ICON@@</div>
  <div class="brand-text"><span class="brand-name">ToBeBestMe</span>
    <p>ToBeBestMe is an independent open-source project, not affiliated with or endorsed by Anthropic. Claude and Claude Code are trademarks of Anthropic, PBC.</p>
    @@TM@@
  </div>
  <ul class="swatches" aria-label="Colours">@@SW@@</ul>
</div></section>
<section aria-labelledby="x"><h2 id="x">X and Bluesky thread</h2><div class="posts">@@TCARDS@@</div></section>
<section aria-labelledby="li"><h2 id="li">LinkedIn</h2><div class="posts">@@LI@@</div></section>
<section aria-labelledby="hn"><h2 id="hn">Show HN</h2><div class="posts">@@HN@@</div></section>
<section aria-labelledby="rd"><h2 id="rd">r/ClaudeAI</h2><div class="posts">@@RD@@</div></section>
</main>
<footer><div class="wrap"><p>ToBeBestMe is an independent open-source project, not affiliated with or endorsed by Anthropic.</p></div></footer>
<script>
document.querySelectorAll('[data-copy]').forEach(function (b) {
  b.addEventListener('click', function () {
    var el = document.getElementById(b.dataset.copy), card = b.closest('[data-card]'), st = card.querySelector('.st'), label = b.textContent;
    var ok = function () { b.textContent = 'Copied'; st.textContent = 'Copied'; setTimeout(function () { b.textContent = label; st.textContent = '' }, 2000) };
    var sel = function () { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); st.textContent = 'Selected. Press Command-C to copy it.' };
    try { navigator.clipboard.writeText(el.textContent).then(ok, sel) } catch (e) { sel() }
  });
});
</script>
</body>
</html>
'''
rep = {'INSTALL': INSTALL, 'REPO': REPO, 'SITE': SITE, 'IMGS': imgs, 'DEMO': demo, 'CAR': car, 'VIDS': vids, 'ICON': icon, 'TM': tm, 'SW': swatches,
  'TCARDS': tcards, 'LI': card('LinkedIn post', li, 'carousel as a document, or demo.mp4', 'Copy LinkedIn post'),
  'HN': card('Title', hn_title, '', 'Copy Show HN title') + card('Link', REPO, '', 'Copy Show HN link') + card('Maker comment, post it straight away', hn_body, '', 'Copy Show HN maker comment'),
  'RD': card('Title', rd_title, '', 'Copy Reddit title') + card('Body', rd_body, 'demo.gif', 'Copy Reddit body')}
page = TEMPLATE
for k, v in rep.items(): page = page.replace(f'@@{k}@@', v)
open(sys.argv[1], 'w').write(page)
