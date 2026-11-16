import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Draws a mod's element tree (what `ui.drawn()` returns for the desktop surface) as an HTML page,
// close enough to the Claude desktop app for layout checks in Chromium: flex boxes in the surface's
// spacing steps, its type sizes, absolutely placed boxes against their parent, hover cards revealed
// by their keyed Box or their hover `scope` group, and Buttons as real buttons with their names.
// It is an approximation of the app, not the app: checks here catch layout and paint-order bugs
// (a card cut off at the top, text drawn over another), not the app's exact pixels. Where the mod
// types state a rule, this follows it, otherwise it is an approximation: a
// drawing with no words is dropped, a still drawing is sized as an image and an interactive one as a
// frame (300 by 150 where not told), and a box is a positioning parent only when it holds an
// absolutely placed box, with no stacking order beyond that.

const CELL_X = 8.4 // one `ch`: what the mod assumes a cell is wide
const LINE = 20 // one `lh`: the comfortable body leading
// The app's spacing steps at its comfortable density. A gap and a padding are different scales.
const GAP = { xs: 8, sm: 12, md: 16, lg: 28, xl: 40 }
const PAD = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 }
// The app's colours on a dark pane and on a light one. Theme names resolve to one or the other; the
// mod's own #hex, rgb() and hsl() colours are drawn as they are, and any other string is no colour.
const SCHEMES = {
  dark: {
    theme: { text: '#f0efec', inactive: '#898781', subtle: '#6b6a66', success: '#0ca30c', warning: '#db9300', error: '#ec7e7e', suggestion: '#6da7ec', claude: '#e0866a', promptBorder: '#f0efec47', userMessageBackground: '#20201f', userMessageBackgroundHover: '#292927', bashMessageBackgroundColor: '#20201f', background: '#1c1f24', selectionBg: '#6da7ec1a' },
    dim: '#c3c2b7', text: '#f0efec', bg: '#1a1a19', ink: '#f0efec', button: '#f0efec1a', buttonHover: '#f0efec29', primary: '#ffffff', primaryText: '#0b0b0b', border: '#f0efec1a', field: '#151515', fieldBorder: '#f0efec33', link: '#6da7ec', focus: '#6da7ec',
  },
  light: {
    theme: { text: '#0b0b0b', inactive: '#898781', subtle: '#a9a8a3', success: '#006300', warning: '#734500', error: '#8e2626', suggestion: '#184f95', claude: '#b3512f', promptBorder: '#0b0b0b47', userMessageBackground: '#f9f9f7', userMessageBackgroundHover: '#f0f0ed', bashMessageBackgroundColor: '#f9f9f7', background: '#f4f7fb', selectionBg: '#184f951a' },
    dim: '#52514e', text: '#0b0b0b', bg: '#ffffff', ink: '#0b0b0b', button: '#0b0b0b1a', buttonHover: '#0b0b0b29', primary: '#0b0b0b', primaryText: '#ffffff', border: '#0b0b0b1a', field: '#ffffff', fieldBorder: '#0b0b0b33', link: '#184f95', focus: '#184f95',
  },
}
let S = SCHEMES.dark
// With `frames`, an interactive drawing is a real <iframe srcdoc>, as the app draws it (the markup goes
// through a sanitiser into a sandboxed frame). A still drawing is an inline image either way. Off by
// default: the layout and paint checks read a drawing's own text and shapes, which a frame hides
// from the page; the checks of what a redraw rebuilds turn it on.
let FRAMES = false
// Type at comfortable density: size, leading
const SIZE = { caption: 12, footnote: 13, body: 14, heading: 15, title: 22 }
const LEAD = { caption: 16, footnote: 18, body: 20, heading: 22, title: 28 }
const WEIGHT = { regular: 400, medium: 500, semibold: 580, bold: 600 }
// The app's own fonts, where this machine has them; otherwise the system's.
const FONT_DIR = '/Applications/Claude.app/Contents/Resources/fonts/'
const SANS_FILE = FONT_DIR + 'AnthropicSans-Romans-Variable-25x258.ttf'
const HAS_SANS = existsSync(SANS_FILE)
const SYSTEM = '-apple-system, BlinkMacSystemFont, system-ui, sans-serif'
const HOST_FONT = (HAS_SANS ? "'Anthropic Sans', " : '') + SYSTEM
// the host's display face is a sans ("anthropic-sans-display"), falling back to its sans: a title is set in the same family as the rest
const DISPLAY_FONT = HOST_FONT
const FONT_CSS =
  (HAS_SANS ? "@font-face{font-family:'Anthropic Sans';src:url('" + pathToFileURL(SANS_FILE).href + "') format('truetype');font-weight:100 900;font-style:normal}\n" : '') +
''

const isColour = (c) => /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c) || /^(rgba?|hsla?)\(/i.test(c)
// A theme key or a raw colour; anything else is no colour (the caller says what that means)
const col = (c) => (typeof c !== 'string' ? undefined : Object.prototype.hasOwnProperty.call(S.theme, c) ? S.theme[c] : isColour(c) ? c : undefined)
// a colour at 60% (dimColor with a colour of its own, borderDimColor)
const dimmed = (c) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)
  if (m) return '#' + (m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1]) + '99'
  const a = /^#([0-9a-f]{6})([0-9a-f]{2})$/i.exec(c)
  if (a) return '#' + a[1] + Math.round(parseInt(a[2], 16) * 0.6).toString(16).padStart(2, '0')
  return 'color-mix(in srgb, ' + c + ' 60%, transparent)'
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const textOf = (n) => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''))

// numbers are cells across and half a line down; words are the steps of the scale given
const space = (v, axis, scale) => (v === undefined ? undefined : typeof v === 'number' ? (axis === 'x' ? v * CELL_X : v * LINE * 0.5) : scale[v])
const gap = (v, axis) => space(v, axis, GAP)
const pad = (v, axis) => space(v, axis, PAD)
const margin = (v, axis) => (typeof v === 'number' ? v * (axis === 'x' ? CELL_X : LINE) : v === undefined ? undefined : GAP[v])
const sized = (v, unit) => (v === undefined ? undefined : typeof v === 'number' ? v * unit : v)

function style(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => k + ':' + (typeof v === 'number' && !/^(flex-grow|flex-shrink|font-weight|z-index)$/.test(k) ? v + 'px' : v))
    .join(';')
}

// What the app adds to a drawing's root when it has none of its own: the pane's text colour and its UI font
const hasOwn = (root, name) => new RegExp('\\s' + name + '\\s*=').test(root) || new RegExp('style="[^"]*\\b' + name + '\\s*:').test(root)
function injectRoot(src) {
  const root = (/<svg\b[^>]*>/.exec(src) || [''])[0]
  if (!root) return src
  let add = ''
  if (!hasOwn(root, 'color')) add += ' color="' + S.text + '"'
  if (!hasOwn(root, 'font-family')) add += ' font-family="' + SYSTEM + '"'
  return add ? src.replace(root, root.replace(/^<svg\b/, '<svg' + add)) : src
}

function node(n) {
  if (typeof n === 'string') return esc(n)
  const p = n.props || {}
  const h = n.hover || p.hover || {}
  const kids = (n.children || []).map(node).join('')
  switch (n.type) {
    case 'Box': {
      const isReveal = h.display === 'flex' && p.display === 'none'
      const classes = [p.key ? 'hk' : '', isReveal ? (h.scope ? 'rv-scope' : 'rv') : '', h.backgroundColor ? 'hb' : ''].filter(Boolean)
      const isBordered = !!p.borderStyle
      // a bordered box pads itself md down and lg across unless it says otherwise
      const side = (own, axis, fallback) => (own !== undefined ? pad(own, axis) : isBordered ? fallback : undefined)
      const ring = p.borderColor ? col(p.borderColor) : undefined
      const edge = ring === undefined ? S.border : p.borderDimColor ? dimmed(ring) : ring
      const st = {
        display: p.display === 'none' ? 'none' : 'flex',
        'flex-direction': p.flexDirection || 'row',
        'flex-wrap': p.flexWrap,
        'flex-grow': p.flexGrow,
        'flex-shrink': p.flexShrink ?? 1,
        'align-items': p.alignItems,
        'justify-content': p.justifyContent,
        'row-gap': gap(p.rowGap ?? p.gap, 'y'),
        'column-gap': gap(p.columnGap ?? p.gap, 'x'),
        width: sized(p.width, CELL_X),
        height: sized(p.height, LINE),
        'padding-left': side(p.paddingLeft ?? p.paddingX ?? p.padding, 'x', PAD.lg),
        'padding-right': side(p.paddingRight ?? p.paddingX ?? p.padding, 'x', PAD.lg),
        'padding-top': side(p.paddingTop ?? p.paddingY ?? p.padding, 'y', PAD.md),
        'padding-bottom': side(p.paddingBottom ?? p.paddingY ?? p.padding, 'y', PAD.md),
        'margin-left': margin(p.marginLeft ?? p.marginX, 'x'),
        'margin-top': margin(p.marginTop ?? p.marginY, 'y'),
        'margin-bottom': margin(p.marginBottom ?? p.marginY, 'y'),
        border: isBordered ? '1px solid ' + edge : undefined,
        'border-radius': isBordered ? (p.borderStyle === 'round' ? 12 : 8) : undefined,
        'background-color': col(p.backgroundColor),
        // as in the app, a box is a positioning parent only when an absolutely placed box sits directly in it
        position: p.position === 'absolute' ? 'absolute' : (n.children || []).some((c) => c && c.type === 'Box' && c.props && c.props.position === 'absolute') ? 'relative' : undefined,
        top: sized(p.top, LINE),
        bottom: sized(p.bottom, LINE),
        left: sized(p.left, CELL_X),
        right: sized(p.right, CELL_X),
        // as in the app, a box is as wide as its widest unbreakable line unless it says otherwise
        'min-width': sized(p.minWidth, CELL_X),
        '--hb': h.backgroundColor ? col(h.backgroundColor) : undefined,
        'box-sizing': 'border-box',
      }
      const attrs = (p.key ? ' data-key="' + esc(p.key) + '"' : '') + (h.scope ? ' data-scope="' + esc(h.scope) + '"' : '') + (h.backgroundColor ? ' data-hover-bg="' + esc(h.backgroundColor) + '"' : '')
      return '<div class="' + classes.join(' ') + '"' + attrs + ' style="' + style(st) + '">' + kids + '</div>'
    }
    case 'Text': {
      const isTruncated = p.wrap && p.wrap.startsWith('truncate')
      const own = p.color ? col(p.color) || 'currentColor' : undefined
      const colour = own ? (p.dimColor ? dimmed(own) : own) : p.dimColor ? S.dim : undefined
      const st = {
        color: colour,
        'font-size': SIZE[p.size],
        'line-height': LEAD[p.size],
        'font-family': p.size === 'title' ? DISPLAY_FONT : undefined,
        'font-weight': WEIGHT[p.weight] ?? (p.bold ? WEIGHT.bold : undefined),
        'font-variant-numeric': p.tabular ? 'tabular-nums' : undefined,
        'white-space': isTruncated ? 'nowrap' : 'pre-wrap',
        display: isTruncated ? 'inline-block' : undefined,
        'max-width': isTruncated ? '100%' : undefined,
        overflow: isTruncated ? 'hidden' : undefined,
        'text-overflow': isTruncated ? 'ellipsis' : undefined,
        'overflow-wrap': isTruncated ? undefined : 'anywhere',
      }
      return '<span class="t" style="' + style(st) + '">' + kids + '</span>'
    }
    case 'Button': {
      // the label names the control; words given as children are what is drawn on it
      const label = p.label ?? textOf(n)
      const shown = textOf(n) || label
      const isPrimary = p.variant === 'primary'
      const look = p.plain
        ? { color: p.dimColor ? S.dim : S.text, background: 'none', padding: PAD.xs, height: 'auto' }
        : { color: isPrimary ? S.primaryText : p.dimColor ? S.dim : S.text, background: isPrimary ? S.primary : S.button, padding: '0 ' + PAD.md + 'px', height: 32, 'border-radius': 8, 'white-space': 'nowrap', 'font-weight': isPrimary ? WEIGHT.medium : WEIGHT.regular }
      const st = { ...look, border: 0, 'font-size': SIZE.body, 'line-height': LEAD.body, 'font-family': 'inherit', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'box-sizing': 'border-box' }
      const kind = p.plain ? 'plain' : isPrimary ? 'primary' : 'regular'
      return '<button type="button" class="btn ' + kind + '" data-key="' + esc(p.key || '') + '" data-variant="' + esc(p.variant || '') + '" aria-label="' + esc(label) + '" style="' + style(st) + '">' + esc(shown) + '</button>'
    }
    case 'Svg': {
      // the app refuses a drawing whose words are blank, and draws nothing in its place
      if (!String(p.alt ?? '').trim()) return ''
      let src = String(p.source || '')
      const root = (/<svg\b[^>]*>/.exec(src) || [''])[0]
      const own = (name) => { const m = new RegExp('\\s' + name + '="([\\d.]+)"').exec(root); return m ? Number(m[1]) : undefined }
      const box = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(root)
      src = src.replace(/<svg ([^>]*?)\swidth="[^"]*"/, '<svg $1').replace(/<svg ([^>]*?)\sheight="[^"]*"/, '<svg $1')
      src = src.replace('<svg ', '<svg style="display:block;width:100%;height:100%" ')
      let width, height
      if (p.isInteractive) {
        // a frame: the size it is given, the browser's 300 by 150 where it is not, the drawing filling it
        width = p.width ?? 300
        height = p.height ?? 150
      } else {
        // an image: the size it is given, or its own; with only a height, as wide as its proportions make it
        width = p.width ?? own('width') ?? (p.height && box ? (p.height * Number(box[1])) / Number(box[2]) : 300)
        height = p.height ?? own('height') ?? (box ? (width * Number(box[2])) / Number(box[1]) : 150)
      }
      if (FRAMES && p.isInteractive) {
        return '<div data-svg="1" data-frame-slot="1" style="' + style({ width, 'max-width': '100%', height, 'flex-shrink': 0, display: 'flex' }) + '"><iframe title="' + esc(p.alt) + '" sandbox="" scrolling="no" srcdoc="' + esc(injectRoot(String(p.source || ''))) + '" style="border:0;width:100%;height:100%;color-scheme:normal"></iframe></div>'
      }
      // the app sets the pane's own ink and UI font on the drawing, so currentColor is the text colour in any theme
      return '<div role="img" aria-label="' + esc(p.alt) + '" data-svg="1"' + (p.isInteractive && p.width === undefined ? ' data-frame="default"' : '') + (/preserveAspectRatio="none"/.test(root) ? ' data-fluid="1"' : '') + ' style="' + style({ width, 'max-width': '100%', height, 'flex-shrink': 0, display: 'flex', color: S.text, 'font-family': SYSTEM }) + '">' + src + '</div>'
    }
    case 'Input': {
      const name = esc(p.submitLabel || 'Submit')
      return '<div data-input="' + esc(p.key || '') + '" style="display:flex;gap:' + GAP.xs + 'px;align-items:flex-start;width:100%"><input aria-label="' + esc(p.placeholder || p.key || '') + '" placeholder="' + esc(p.placeholder || '') + '" value="' + esc(p.value || '') + '" style="flex:1;min-width:0;box-sizing:border-box;height:32px;border:1px solid ' + S.fieldBorder + ';border-radius:8px;padding:0 ' + PAD.md + 'px;background:' + S.field + ';color:' + S.text + ';font:inherit;font-size:14px"><button type="button" class="btn regular" aria-label="' + name + '" style="background:' + S.button + ';color:' + S.text + ';border:0;border-radius:8px;height:32px;padding:0 ' + PAD.md + 'px;font:inherit;font-size:14px;display:inline-flex;align-items:center">' + name + '</button></div>'
    }
    case 'Link':
      return '<a href="' + esc(p.href || '#') + '" style="color:' + S.link + ';font-size:14px;line-height:20px;white-space:nowrap;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px;text-decoration-color:' + dimmed(S.link) + '">' + esc(p.label || p.href) + '</a>'
    case 'Markdown':
      return '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font:inherit;font-size:14px;line-height:20px">' + esc(p.text) + '</pre>'
    default:
      return kids
  }
}

// Hover cards: the pointer over a keyed Box reveals the cards inside it (and inside every keyed
// Box it sits in, as the pointer is over those too); a `scope` group lights all its members and
// reveals its cards while any member is hovered. Tests call window.hoverAt(el) for the same.
const SCRIPT = `
function hoverAt(target) {
  document.querySelectorAll('.on, .lit').forEach((x) => x.classList.remove('on', 'lit'))
  if (!target) return
  for (let hk = target.closest('.hk'); hk; hk = hk.parentElement && hk.parentElement.closest('.hk'))
    hk.querySelectorAll('.rv').forEach((rv) => { if (rv.parentElement.closest('.hk') === hk) rv.classList.add('on') })
  const scoped = target.closest('[data-scope]')
  const scope = scoped && scoped.getAttribute('data-scope')
  if (scope) document.querySelectorAll('[data-scope]').forEach((x) => { if (x.getAttribute('data-scope') === scope) x.classList.add('lit') })
}
window.hoverAt = hoverAt
// The app's rebuild, as far as frames go: a redraw hands it the new tree, and a frame whose element
// is equal to the one already there is left alone, while any other has its document replaced (which
// loads it again). \`window.frameLoads\` counts every load, so a check can say how many a redraw cost.
window.frameLoads = 0
document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IFRAME') window.frameLoads++ }, true)
window.applyTree = (html) => {
  const next = new DOMParser().parseFromString(html, 'text/html')
  const old = [...document.querySelectorAll('iframe')]
  const fresh = [...next.querySelectorAll('iframe')]
  if (old.length !== fresh.length) {
    // a different set of frames is a different tree: every frame in it is new
    document.getElementById('pane').innerHTML = next.getElementById('pane').innerHTML
    return
  }
  fresh.forEach((f, i) => { if (!old[i].isEqualNode(f)) old[i].setAttribute('srcdoc', f.getAttribute('srcdoc')) })
}
document.addEventListener('mouseover', (e) => hoverAt(e.target))
document.addEventListener('mouseleave', () => hoverAt(null))
`
const CSS = () => `
${FONT_CSS}.rv.on, .rv-scope.lit { display: flex !important; }
.hb:hover, .hb.lit { background-color: var(--hb, transparent); }
.btn { cursor: default; }
.btn.regular:hover { background-color: ${S.buttonHover} !important; }
.btn.primary:hover { opacity: .88; }
.btn.plain:hover { color: ${S.ink} !important; }
button:focus-visible { outline: 2px solid ${S.focus}; outline-offset: 2px; }
a:focus-visible, input:focus-visible { outline: 2px solid ${S.focus}; outline-offset: 2px; }
input::placeholder { color: ${S.dim}; opacity: .8; }
`

export function renderPage(tree, { width = 720, title = 'ToBeBestMe', scheme = 'dark', frames = false } = {}) {
  S = SCHEMES[scheme] || SCHEMES.dark
  FRAMES = frames
  const body = node(tree)
  FRAMES = false
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="' + scheme + '"><title>' + esc(title) + '</title><style>' + CSS() + '</style></head>' +
    '<body style="margin:0;background:' + S.bg + ';color:' + S.text + ';font:14px/20px ' + HOST_FONT + ';-webkit-font-smoothing:antialiased;">' +
    '<main id="pane" style="position:relative;width:' + width + 'px;max-width:100%;box-sizing:border-box;padding:14px">' + body + '</main>' +
    '<script>' + SCRIPT + '</script></body></html>'
  )
}
