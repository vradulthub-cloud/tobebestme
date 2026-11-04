# Renders STRATEGY.md as a page for reading and sharing: python3 strategy-page.py <out.html>
# The page has no document wrapper; the Artifact publish adds one.
import sys, os, re, json, markdown
src = open('STRATEGY.md').read()
src = src.split('\n', 1)[1]  # the page draws its own title
src = re.sub(r'^\s*Written 28 October[^\n]*\n', '', src, count=1)  # and its own date line
body = markdown.markdown(src, extensions=['tables', 'sane_lists'])
body = body.replace('<table>', '<div class="tw"><table>').replace('</table>', '</table></div>')
body = re.sub(r'<a href="(http[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', body)
body = body.replace('<td><strong>Yes</strong></td>', '<td><span class="yes">Yes</span></td>').replace('<td><strong>Yes, each post</strong></td>', '<td><span class="yes">Yes, each post</span></td>')
# The at-a-glance panel and the line under the title hold dates and links: they live in STRATEGY.glance.json,
# kept beside STRATEGY.md on this computer and never committed (see .gitignore).
extra = json.load(open('STRATEGY.glance.json')) if os.path.exists('STRATEGY.glance.json') else {'glance': [], 'meta': ''}
glance = [tuple(x) for x in extra['glance']]
gl = ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in glance)
page = f'''<title>ToBeBestMe launch plan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Layout: one reading column, a summary panel first, wide tables scroll inside their own frame. */
:root {{
  --bg: #F5F5F7; --paper: #FFFFFF; --line: rgba(0,0,0,.09); --fg: #1D1D1F; --fg-2: #56565E; --accent: #0071E3; --warn: #B04A00; --warn-bg: rgba(255,149,0,.14);
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #0A0B0D; --paper: #141619; --line: rgba(255,255,255,.10); --fg: #F5F5F7; --fg-2: #A3A3AB; --accent: #3396FF; --warn: #FFB340; --warn-bg: rgba(255,159,10,.16); color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #0A0B0D; --paper: #141619; --line: rgba(255,255,255,.10); --fg: #F5F5F7; --fg-2: #A3A3AB; --accent: #3396FF; --warn: #FFB340; --warn-bg: rgba(255,159,10,.16); color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.55 var(--font); -webkit-font-smoothing: antialiased; }}
.page {{ max-width: 820px; margin: 0 auto; padding-block: 56px 96px; padding-left: max(20px, env(safe-area-inset-left, 0px)); padding-right: max(20px, env(safe-area-inset-right, 0px)); }}
header {{ display: grid; gap: 12px; margin-bottom: 36px; }}
.eyebrow {{ margin: 0; font-weight: 600; color: var(--fg-2); }}
h1 {{ margin: 0; font-size: clamp(36px, 6vw, 56px); line-height: 1.05; letter-spacing: -.03em; text-wrap: balance; }}
.meta {{ margin: 0; color: var(--fg-2); font-size: 15px; }}
.meta a, .doc a {{ color: var(--accent); text-decoration: none; }}
.meta a:hover, .doc a:hover {{ text-decoration: underline; }}
.glance {{ background: var(--paper); border: 1px solid var(--line); border-radius: 18px; padding: 8px 24px; margin: 0 0 48px; }}
.glance div {{ display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 16px; padding-block: 14px; border-top: 1px solid var(--line); }}
.glance div:first-child {{ border-top: 0; }}
.glance dt {{ font-weight: 600; }}
.glance dd {{ margin: 0; color: var(--fg-2); }}
@media (max-width: 560px) {{ .glance div {{ grid-template-columns: minmax(0, 1fr); gap: 2px; }} }}
.doc h2 {{ font-size: 28px; line-height: 1.15; letter-spacing: -.02em; margin: 56px 0 14px; padding-top: 28px; border-top: 1px solid var(--line); text-wrap: balance; }}
.doc h2:first-child {{ margin-top: 0; }}
.doc p, .doc li {{ max-width: 68ch; }}
.doc p {{ margin: 0 0 14px; }}
.doc ul {{ margin: 0 0 16px; padding-left: 22px; display: grid; gap: 6px; }}
.doc ol {{ padding-left: 22px; display: grid; gap: 6px; }}
.doc ul, .doc ol {{ grid-template-columns: minmax(0, 1fr); }}
.doc li, .doc p {{ overflow-wrap: break-word; }}
.doc strong {{ font-weight: 600; }}
.doc em {{ color: var(--fg-2); }}
.doc code {{ font: 14px var(--mono); background: var(--paper); border: 1px solid var(--line); border-radius: 6px; padding: 1px 5px; overflow-wrap: anywhere; }}
.tw {{ overflow-x: auto; margin: 8px 0 22px; background: var(--paper); border: 1px solid var(--line); border-radius: 14px; }}
table {{ border-collapse: collapse; width: 100%; font-size: 15px; line-height: 1.4; font-variant-numeric: tabular-nums; }}
th, td {{ text-align: left; vertical-align: top; padding: 10px 14px; border-top: 1px solid var(--line); min-width: 110px; }}
thead th {{ border-top: 0; color: var(--fg-2); font-weight: 600; font-size: 13px; }}
.yes {{ display: inline-block; font-weight: 600; font-size: 13px; color: var(--warn); background: var(--warn-bg); border-radius: 980px; padding: 2px 10px; white-space: nowrap; }}
:focus-visible {{ outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }}
</style>
<div class="page">
<header>
  <p class="eyebrow">ToBeBestMe · launch strategy</p>
  <h1>Launch plan</h1>
  <p class="meta">{extra["meta"]}</p>
</header>
<dl class="glance">{gl}</dl>
<article class="doc">{body}</article>
</div>'''
open(sys.argv[1], 'w').write(page)
