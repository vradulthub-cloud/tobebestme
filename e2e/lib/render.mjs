// Draws a mod's element tree (what `ui.drawn()` returns for the desktop surface) as an HTML page,
// close enough to the Claude desktop app for layout checks in Chromium: flex boxes in the surface's
// spacing steps, its type sizes, absolutely placed boxes against their parent, hover cards revealed
// by their keyed Box or their hover `scope` group, and Buttons as real buttons with their names.
// It is an approximation of the app, not the app: checks here catch layout and paint-order bugs
// (a card cut off at the top, text drawn over another), not the app's exact pixels.

const STEP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 }
const CELL_X = 8.4
const CELL_Y = 18
const THEME = { success: '#4CC38A', warning: '#E8A33D', error: '#F2555A', suggestion: '#5AA9FF', inactive: '#8a8a8a', subtle: '#555', text: '#ececec' }
const SIZE = { caption: 11, footnote: 12, body: 14, heading: 15, title: 22 }
const WEIGHT = { regular: 400, medium: 500, semibold: 600, bold: 700 }

const sp = (v, axis) => (v === undefined ? undefined : typeof v === 'number' ? v * (axis === 'x' ? CELL_X : CELL_Y) : STEP[v])
const col = (c) => (c ? THEME[c] || c : undefined)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const textOf = (n) => (typeof n === 'string' ? n : (n.children || []).map(textOf).join(''))

function style(o) {
  return Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => k + ':' + (typeof v === 'number' && !/^(flex-grow|flex-shrink|font-weight|z-index)$/.test(k) ? v + 'px' : v))
    .join(';')
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
      const st = {
        display: p.display === 'none' ? 'none' : 'flex',
        'flex-direction': p.flexDirection || 'row',
        'flex-wrap': p.flexWrap,
        'flex-grow': p.flexGrow,
        'flex-shrink': p.flexShrink ?? 1,
        'align-items': p.alignItems,
        'justify-content': p.justifyContent,
        'row-gap': sp(p.rowGap ?? p.gap, 'y'),
        'column-gap': sp(p.columnGap ?? p.gap, 'x'),
        width: typeof p.width === 'number' ? p.width * CELL_X : p.width,
        height: typeof p.height === 'number' ? p.height * CELL_Y : p.height,
        'padding-left': sp(p.paddingLeft ?? p.paddingX ?? p.padding, 'x'),
        'padding-right': sp(p.paddingRight ?? p.paddingX ?? p.padding, 'x'),
        'padding-top': sp(p.paddingTop ?? p.paddingY ?? p.padding, 'y'),
        'padding-bottom': sp(p.paddingBottom ?? p.paddingY ?? p.padding, 'y'),
        'margin-top': sp(p.marginTop ?? p.marginY, 'y'),
        'margin-bottom': sp(p.marginBottom ?? p.marginY, 'y'),
        border: p.borderStyle ? '1px solid ' + (p.borderColor ? col(p.borderColor) : '#3b3b3b') : undefined,
        'border-radius': p.borderStyle ? 10 : undefined,
        background: p.backgroundColor,
        // every box is a positioning parent, as the surface places an absolute box against its parent
        position: p.position || 'relative',
        top: p.top === undefined ? undefined : p.top * CELL_Y,
        bottom: p.bottom === undefined ? undefined : p.bottom * CELL_Y,
        left: p.left === undefined ? undefined : p.left * CELL_X,
        right: p.right === undefined ? undefined : p.right * CELL_X,
        'min-width': 0,
        'box-sizing': 'border-box',
      }
      const attrs = (p.key ? ' data-key="' + esc(p.key) + '"' : '') + (h.scope ? ' data-scope="' + esc(h.scope) + '"' : '') + (h.backgroundColor ? ' data-hover-bg="' + esc(h.backgroundColor) + '"' : '')
      return '<div class="' + classes.join(' ') + '"' + attrs + ' style="' + style(st) + '">' + kids + '</div>'
    }
    case 'Text': {
      const isTruncated = p.wrap && p.wrap.startsWith('truncate')
      const st = {
        color: col(p.color) || (p.dimColor ? '#9b9b9b' : undefined),
        'font-size': SIZE[p.size],
        'font-weight': WEIGHT[p.weight],
        'font-variant-numeric': p.tabular ? 'tabular-nums' : undefined,
        'white-space': isTruncated ? 'nowrap' : 'pre-wrap',
        overflow: isTruncated ? 'hidden' : undefined,
        'text-overflow': isTruncated ? 'ellipsis' : undefined,
        'min-width': 0,
        'overflow-wrap': isTruncated ? undefined : 'anywhere',
      }
      return '<span class="t" style="' + style(st) + '">' + kids + '</span>'
    }
    case 'Button': {
      const label = p.label ?? textOf(n)
      const st = p.plain
        ? { color: p.dimColor ? '#9b9b9b' : '#ececec', 'font-size': 13, background: 'none', border: 0, padding: 0 }
        : { background: p.variant === 'primary' ? '#f2f2f2' : '#353535', color: p.variant === 'primary' ? '#111' : p.dimColor ? '#a0a0a0' : '#ececec', 'border-radius': 7, padding: '3px 10px', 'font-size': 13, 'white-space': 'nowrap', border: 0 }
      return '<button type="button" data-key="' + esc(p.key || '') + '" data-variant="' + esc(p.variant || '') + '" aria-label="' + esc(label) + '" style="' + style(st) + '">' + esc(label) + '</button>'
    }
    case 'Svg': {
      // CSS pixels; with no height the drawing keeps its own proportions at the drawn width, and
      // with no width it takes its own width up to the slot (SvgProps)
      let src = String(p.source || '')
      const own = /<svg[^>]*?\swidth="([\d.]+)"/.exec(src)
      src = src.replace(/<svg ([^>]*?)\swidth="[^"]*"/, '<svg $1').replace(/<svg ([^>]*?)\sheight="[^"]*"/, '<svg $1')
      const width = p.width ?? (own ? Number(own[1]) : undefined)
      src = src.replace('<svg ', '<svg style="display:block;width:100%;height:' + (p.height ? p.height + 'px' : 'auto') + '" ')
      return '<div role="img" aria-label="' + esc(p.alt || '') + '" data-svg="1" style="' + style({ width: width ?? '100%', 'max-width': '100%', height: p.height, 'flex-shrink': 0, display: 'flex' }) + '">' + src + '</div>'
    }
    case 'Input':
      return '<div data-input="' + esc(p.key || '') + '" style="display:flex;gap:8px;align-items:flex-start;width:100%"><input aria-label="' + esc(p.placeholder || p.key || '') + '" placeholder="' + esc(p.placeholder || '') + '" value="' + esc(p.value || '') + '" style="flex:1;min-width:0;border:1px solid #444;border-radius:8px;padding:6px 10px;background:#1e1e1e;color:#ececec;font-size:13px"><button type="button" aria-label="' + esc(p.submitLabel || 'Submit') + '" style="background:#353535;color:#ececec;border:0;border-radius:7px;padding:3px 10px;font-size:13px">' + esc(p.submitLabel || 'Submit') + '</button></div>'
    case 'Link':
      return '<a href="' + esc(p.href || '#') + '" style="color:#5AA9FF;font-size:13px;white-space:nowrap">' + esc(p.label || p.href) + '</a>'
    case 'Markdown':
      return '<pre style="white-space:pre-wrap;font-size:12px">' + esc(p.text) + '</pre>'
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
document.addEventListener('mouseover', (e) => hoverAt(e.target))
document.addEventListener('mouseleave', () => hoverAt(null))
`
const CSS = `
.rv.on, .rv-scope.lit { display: flex !important; }
.hb:hover, .hb.lit { background: #8E8E931F; }
button:focus-visible { outline: 2px solid #5AA9FF; outline-offset: 2px; }
`

export function renderPage(tree, { width = 720, title = 'ToBeBestMe' } = {}) {
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title) + '</title><style>' + CSS + '</style></head>' +
    '<body style="margin:0;background:#1e1e1e;color:#ececec;font:14px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;">' +
    '<main id="pane" style="width:' + width + 'px;max-width:100%;box-sizing:border-box;padding:14px">' + node(tree) + '</main>' +
    '<script>' + SCRIPT + '</script></body></html>'
  )
}
