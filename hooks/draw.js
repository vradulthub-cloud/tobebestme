// tobebestme: the dashboard. Drawn from plain data (d) and actions (act) that
// hooks/register.js hands in; nothing here keeps state or calls $.
//
// Layout rules: the answer first (one headline and its one best action). Every section is a
// card with an icon in its colour, a title and, where it helps, a line saying what it is for.
// Figures explain themselves on hover; the controls sit beside the figures they change;
// sections show only when they have something to show. Plain words throughout; colour for
// status and identity only, always with words beside it. Spacing comes from the parent
// (gap), in the surface's own steps, so the desktop breathes and the terminal stays compact.

import {
  SETTINGS,
  HANDOFF_PATH,
  REPORT_DIR,
  HEX,
  CATEGORY_HEX,
  TINT,
  RING_HEX,
  WINDOW_MS,
  MODES,
  fmtTokens,
  fmtUsd,
  plural,
  fmtSpan,
  fmtTurnTime,
  fmtClock,
  shortModel,
  toolName,
  titleCase,
  limitLabel,
  settingSpec,
  settingWords,
  isEarly,
  paceSentence,
  mcpServers,
  categoryInfo,
  avg,
  svgMeter,
  svgBars,
  svgRunway,
  runwayOf,
  textRunway,
  svgForecast,
  svgWindow,
  habitIdeas,
  sparkline,
  modelHex,
  dayKey,
  dailyShare,
  shareSentence,
  modelAdvice,
  MODEL_ROLES,
  runFit,
  SCAN_DAYS,
  dayLabel,
  modelName,
  usageInsights,
  textMeter,
  settingSpec as specOf,
  stageModel,
  svgStages,
  svgTimeline,
  FAMILY_HEX,
  shareWords,
  costShare,
  fmtShare,
  stopRequest,
  projectHues,
  OTHER_HEX,
  svgLive,
  svgContext,
  contextPace,
  limitOutlook,
  limitLevel,
  paceWords,
  midHex,
  svgFigure,
  settleMotion,
  FLUID_PX,
} from './lib.js'

// Costs as dollars, or as a share of the weekly limit when that is what runs out (costShare): set
// at the start of each drawing, so every figure in it speaks the same unit.
let SHARE = null
function cost(usd) {
  return SHARE ? fmtShare((usd || 0) * SHARE.pctPerUsd) : fmtUsd(usd)
}

// "of your weekly limit" after a share, unless the share already says it ("1.5 weeks’ worth").
function ofLimit(text) {
  return SHARE && !/worth$/.test(text) ? text + ' of your weekly limit' : text
}

export const TABS = [
  { id: 'all', label: 'Home', hotkey: '1' },
  { id: 'workflows', label: 'Workflows', hotkey: '2' },
  { id: 'overview', label: 'This session', hotkey: '3' },
  { id: 'usage', label: 'Usage', hotkey: '4' },
  { id: 'skills', label: 'Skills', hotkey: '5' },
  { id: 'settings', label: 'Settings', hotkey: '6' },
]
// Spending and Usage limits were tabs of their own before 1.0, and Context was one until 1.5; a link
// to any of them opens the tab that took its place.
const OLD_TABS = { spending: 'usage', limits: 'usage', context: 'overview' }

const CHART_SLOTS = 24
// From this many columns a tab is two columns: the work on the left, the figures and controls it
// concerns beside it. Narrower, it is one column in the order a day goes.
const SPLIT_AT = 116
// Hover cards are dark in either theme, like the system's own tooltips, so they read the same
// over light and dark panes; rows under the pointer take a faint tint that suits both.
const TIP = { bg: '#2C2C2E', border: '#545458', text: '#F2F2F7', dim: '#D1D1D6', good: '#30D158' }
const ROW_HOVER = '#8E8E931F'
// A section's body sits on a faint grey fill, the system grey at 8%, which reads on a dark and on a
// light pane alike: the page has depth without every section boxed in its own colour.
const GROUP_BG = '#8E8E931F'

// Drops undefined props: a drawn tree carries only what it sets.
function clean(props) {
  const out = {}
  for (const key of Object.keys(props)) if (props[key] !== undefined) out[key] = props[key]
  return out
}

function quiet(level) {
  return level === 'success' || level === 'info' ? undefined : level
}

// The colour a limit, context or budget is drawn in: its own while all is well, amber once it is
// past its alert, red when it is nearly out, so the colour that says trouble is the same everywhere.
function tint(hex, level) {
  return level === 'warning' || level === 'error' ? HEX[level] : hex
}

// The surface's elements and the shapes the dashboard is built from.
export function kit(el, e, primary = { isTaken: false }) {
  const { Text, Button, Markdown, Input, Link } = el
  // A box may shrink below its longest unbreakable line, as the terminal's do: in the app a long
  // session title or branch name would otherwise hold its column open and push the next one past
  // the pane's edge. Long text truncates or wraps inside the room it is given instead.
  const Box = (p) => el.Box(p && p.minWidth === undefined ? { minWidth: 0, ...p } : p)
  const isTerminal = e.surface === 'terminal'
  const columns = e.props.bodyColumns || 60
  // about how many pixels the column is: the pane's own padding is taken off, and a sub-kit is given its own
  const px = Math.round(columns * 8.4) - 28
  const hasSvg = !isTerminal && !!el.Svg
  // Every drawing goes through here, so each is sized the way the app sizes it: the app draws a still
  // drawing as an image and an interactive one in a frame of its own, and a frame given no width is
  // the browser's 300px. A drawing stretched to its slot (preserveAspectRatio none) is given a width
  // wider than any slot, which the app caps at the slot; any other keeps the size it was made at.
  // Its motion is settled to how long its tab has been open (settleMotion), so a redraw carries an
  // animation on instead of playing it again from the start.
  const Svg = (p) => {
    const source = settleMotion(p.source, e.motionAge)
    const root = (/<svg\b[^>]*>/.exec(source) || [''])[0]
    const own = (name) => {
      const m = new RegExp('\\s' + name + '="([\\d.]+)"').exec(root)
      return m ? Number(m[1]) : undefined
    }
    const box = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(root)
    const isFluid = /preserveAspectRatio="none"/.test(root)
    const width = p.width ?? (isFluid ? FLUID_PX : own('width') ?? (box ? Number(box[1]) : undefined))
    const height = p.height ?? own('height') ?? (box && width && !isFluid ? Math.round((width * Number(box[2])) / Number(box[1])) : undefined)
    return el.Svg(clean({ ...p, source, width, height }))
  }
  const text = (s, props = {}) => Text(clean({ ...props, children: [s] }))
  const footnote = (s, props = {}) => text(s, { size: 'footnote', dimColor: true, wrap: 'wrap', ...props })
  // guidance a person acts on is body size in a quiet colour; the small footnote size is for captions and labels
  const guide = (s, props = {}) => text(s, { dimColor: true, wrap: 'wrap', ...props })
  const tipWidth = Math.max(28, Math.min(46, columns - 12))

  // A hover card: hidden until the pointer is over the keyed Box it belongs to, then drawn
  // above that Box's top edge, over what is there, so nothing below it moves. A placed card is
  // painted over what comes before it and never over what follows, so it always grows upward.
  // `scope` ties it to a hover group instead (see k.tile), so it can sit outside its owner.
  const tipCard = (t, scope) => {
    const lines = [
      ...(t.title ? [Text({ color: TIP.text, weight: 'semibold', wrap: 'wrap', children: [t.title] })] : []),
      ...(t.lines || []).filter(Boolean).map((l) => Text({ color: TIP.dim, size: 'footnote', wrap: 'wrap', children: [l] })),
      ...(t.good ? [Text({ color: TIP.good, size: 'footnote', wrap: 'wrap', children: ['↓ ' + t.good] })] : []),
      ...(t.el ? [Box({ paddingY: 'xs', children: [t.el] })] : []),
    ]
    return Box(clean({
      position: 'absolute',
      bottom: 0,
      left: t.align === 'left' ? 0 : undefined,
      right: t.align === 'left' ? undefined : 0,
      width: tipWidth,
      display: 'none',
      hover: scope ? { scope, display: 'flex' } : { display: 'flex' },
      flexDirection: 'column',
      backgroundColor: TIP.bg,
      borderStyle: 'round',
      borderColor: TIP.border,
      paddingX: 1,
      children: lines,
    }))
  }
  const tipLayer = (t) => (t ? [Box({ position: 'absolute', top: 0, left: 0, right: 0, height: 0, children: [tipCard(t)] })] : [])
  // With Show details on, what a hover card says is drawn in place under its row or tile, for a
  // keyboard, a screen reader, a touch screen, or anyone who'd rather read it all at once.
  const inlineDetails = (t) => {
    const lines = t ? [...(t.lines || []).filter(Boolean), ...(t.good ? ['↓ ' + t.good] : [])] : []
    return lines.length || (t && t.el) ? [Box({ flexDirection: 'column', rowGap: 'xs', paddingLeft: isTerminal ? 2 : 'md', children: [...lines.map((l) => footnote(l)), ...(t.el ? [t.el] : [])] })] : []
  }

  const k = {
    Box, Text, Button, Markdown, Input, Link, Svg, isTerminal, hasSvg, columns, px, text, footnote, guide,
    isRoomy: columns >= 90,
    // the look of a grouped body, for a row of tiles that is one group
    groupProps: isTerminal ? {} : { paddingX: 'md', paddingY: 'md', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true },
    // Keyboard shortcuts show as chips on desktop buttons; there they're noise, so only the terminal gets them.
    hotkey: (key) => (isTerminal ? key : undefined),
    // A Box that explains itself on hover: a faint tint under the pointer and a card above it.
    showDetails: false,
    hoverBox: (key, props, children, t) => {
      // with Show details on, a row's words go under the row, never beside it in a sliver
      if (k.showDetails && t && props.flexDirection !== 'column') {
        const details = inlineDetails(t)
        if (details.length) return Box({ key, flexDirection: 'column', width: props.width, children: [Box(clean({ ...props, width: '100%', children })), ...details] })
      }
      return Box(clean({ key, ...props, hover: isTerminal ? undefined : { backgroundColor: ROW_HOVER }, children: [...children, ...(k.showDetails ? inlineDetails(t) : tipLayer(t))] }))
    },
    // A tile at the top of a tab, and its hover card. A card drawn above a tile there would run
    // past the pane's top, where it is cut off, and one drawn inside the tile would sit under the
    // tiles after it. So the card joins the tile's hover group and k.tileRow draws it after the
    // whole row, against the row's bottom edge: over every tile, rising only a little above.
    tile: (key, props, children, t) => ({
      tile: Box(clean({ key, ...props, hover: t || !isTerminal ? clean({ scope: t && !k.showDetails ? 'tip-' + key : undefined, backgroundColor: isTerminal ? undefined : ROW_HOVER }) : undefined, children: k.showDetails ? [...children, ...inlineDetails(t)] : children })),
      card: t && !k.showDetails ? tipCard(t, 'tip-' + key) : null,
    }),
    tileRow: (items, props = {}) => Box({ flexDirection: 'row', flexWrap: 'wrap', width: '100%', ...props, children: [...items.map((x) => x.tile), ...items.map((x) => x.card).filter(Boolean)] }),
    // A section: a heading (with an optional line saying what it is for, and an `accessory` at its
    // trailing end) above its body, which sits on a faint fill. `extra.isPlain` leaves the fill off
    // for a body that is only words. The terminal draws it flat and compact.
    card: (title, subtitleIn, children, extra = {}) => {
      // a heading says what a section is; the line under it is for Show details, so the page stays quiet
      const subtitle = extra.keepCaption || k.showDetails ? subtitleIn : null
      const head = title
        ? [
            Box({
              flexDirection: 'row',
              columnGap: 'sm',
              alignItems: subtitle ? 'flex-start' : 'center',
              paddingX: isTerminal ? 0 : 'xs',
              children: [
                Box({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, children: [text(title, { size: 'heading', weight: 'semibold', wrap: 'wrap' }), ...(subtitle ? [footnote(subtitle)] : [])] }),
                ...(extra.accessory ? [extra.accessory] : []),
              ],
            }),
          ]
        : []
      const body = Box({ flexDirection: 'column', rowGap: extra.gap || 'sm', children })
      if (isTerminal) return Box({ flexDirection: 'column', width: '100%', paddingX: 1, rowGap: 'md', children: [...head, body] })
      return Box({
        flexDirection: 'column',
        width: '100%',
        rowGap: 'sm',
        children: [
          ...head,
          extra.isPlain ? Box({ paddingX: 'xs', flexDirection: 'column', children: [body] }) : Box({ flexDirection: 'column', paddingX: 'md', paddingY: 'md', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true, children: [body] }),
        ],
      })
    },
    // The kit for a narrower column of this one, so rows, bars and tiles size themselves to it.
    sub: (widthPx) => {
      const kk = kit(el, { ...e, props: { ...e.props, bodyColumns: Math.floor((widthPx + 28) / 8.4) } }, primary)
      kk.px = widthPx
      kk.showDetails = k.showDetails
      return kk
    },
    // The kits of a main column and a side column that share this one's width.
    split: () => {
      const main = Math.floor(px * 0.58)
      return [k.sub(main), k.sub(px - main - 16)]
    },
    // Two columns side by side: `main` beside `aside`, each stacked with the same gap as a page.
    layout: (main, aside) =>
      Box({
        flexDirection: 'row',
        columnGap: 'lg',
        alignItems: 'flex-start',
        width: '100%',
        children: [
          Box({ flexDirection: 'column', rowGap: 'lg', width: '58%', flexShrink: 0, children: main.filter(Boolean) }),
          Box({ flexDirection: 'column', rowGap: 'lg', flexGrow: 1, flexShrink: 1, children: aside.filter(Boolean) }),
        ],
      }),
    // A table row: the first cell takes the room left, the others are right-aligned at their
    // width. With `extra.key` the row explains itself on hover (`extra.tip`).
    // A cell may hold an element (`el`, such as a bar) in place of text.
    row: (cells, props = {}, extra = {}) => {
      const children = k.fit(cells).map((c, i) =>
        Box(clean({
          // a one-column gutter before each column after the first, outside its width, so right-aligned
          // neighbours never run together and a bar of the column's width still fits
          width: i === 0 ? undefined : k.cellWidth(c) + 1,
          flexGrow: i === 0 ? 1 : 0,
          flexShrink: i === 0 ? 1 : 0,
          justifyContent: i === 0 || c.el ? 'flex-start' : 'flex-end',
          paddingLeft: i > 0 ? 1 : undefined,
          children: [c.el || Text(clean({ tabular: true, wrap: 'truncate-end', color: c.color, ...props, ...(c.props || {}), children: c.parts || [c.text] }))],
        })),
      )
      const box = { flexDirection: 'row', width: '100%', alignItems: 'center' }
      if (extra.key && k.showDetails && extra.tip) return Box({ key: extra.key, flexDirection: 'column', width: '100%', children: [Box({ ...box, children }), ...inlineDetails(extra.tip)] })
      return extra.key ? k.hoverBox(extra.key, box, children, extra.tip) : Box({ ...box, children })
    },
    // The cells of a row that fit the pane: on a narrow pane the last columns go, so the first
    // keeps room to be read and nothing runs off the side; headings drop the same ones.
    fit: (cells) => {
      const room = k.columns - 8
      let shown = cells
      // a bar is the first thing a narrow table gives up: its figure says the same in less room, so the numbers stay
      const isBar = (c, i) => i > 0 && (!!c.el || !!c.isBar || (c.text === '' && !c.parts && c.width > 0))
      while (shown.length > 2 && shown.slice(1).reduce((n, c) => n + k.cellWidth(c) + 1, 0) + 12 > room) {
        const bar = shown.findIndex(isBar)
        shown = bar > 0 ? shown.filter((_, i) => i !== bar) : shown.slice(0, -1)
      }
      return shown
    },
    // A column's width in cells, kept clear of the first column: on a narrow pane a wide figure may not take it all.
    cellWidth: (c) => Math.min(c.width || 0, Math.max(8, columns - 18)),
    // A slim bar in a table cell: `value` of `max`, in a colour that names what it measures.
    bar: (value, max, hex, alt) => {
      if (hasSvg) return Box({ width: '100%', children: [Svg({ source: svgMeter([{ value, hex }], max, [], true), alt, height: 6 })] })
      const cells = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((value / max) * 10)) : 0
      return Text({ children: [Text({ color: 'suggestion', children: ['▬'.repeat(cells)] }), Text({ dimColor: true, children: ['·'.repeat(10 - cells)] })] })
    },
    // A table's column headings, in the same widths as its rows. A heading over two of a row's
    // columns (a bar and its figure) is as wide as both and the gutter between them, so the columns a
    // narrow pane drops are the same in the headings as in the rows.
    heads: (cells) => k.row(cells, { size: 'footnote', dimColor: true }),
    // Something working right now: a softly pulsing dot on desktop (still with reduced motion), a
    // coloured dot on the terminal. `words` names it for a reader that cannot see it.
    live: (hex, color, words) => (hasSvg ? Box({ flexShrink: 0, width: 2, alignItems: 'center', children: [Svg({ source: svgLive(hex), alt: words, width: 14, height: 14 })] }) : text('●', { color })),
    // A drawing made at a fixed size, laid out at that size (Svg passes on the size it was made at).
    drawing: (source, alt, extra = {}) => Svg(clean({ source, alt, ...extra })),
    // A meter: an SVG where the surface draws one, block characters on the terminal.
    meter: (parts, total, markers, alt, thin = false) => {
      if (hasSvg) return Svg({ source: svgMeter(parts, total, markers, thin), alt, height: thin ? 6 : 14, isInteractive: parts.some((p) => p.title) ? true : undefined })
      const width = thin ? 14 : Math.max(10, Math.min(60, columns - 6))
      let used = 0
      const runs = parts.map((p) => {
        const cells = total > 0 ? Math.max(0, Math.min(width - used, Math.round((p.value / total) * width))) : 0
        used += cells
        return Text(clean({ color: p.color, dimColor: p.dim, children: [(p.glyph || '█').repeat(cells)] }))
      })
      return Text({ children: [...runs, Text({ dimColor: true, children: ['░'.repeat(Math.max(0, width - used))] })] })
    },
    // Bars over time, oldest on the left; with `titles`, a bar says what it was on hover.
    bars: (values, slots, alt, height = 56, extra = {}) =>
      hasSvg ? Svg(clean({ source: svgBars(values, slots, extra), alt, height, isInteractive: extra.titles ? true : undefined })) : text(sparkline(values, slots), { color: 'suggestion' }),
    // A view has one primary button, the first one drawn: a later one asking for it is drawn as the others are.
    // `isTab` marks the open tab on the terminal, which is not the view's action.
    button: (key, label, onPress, props = {}) => {
      const { isTab, ...rest } = props
      if (rest.variant === 'primary' && !isTab) {
        if (primary.isTaken) rest.variant = undefined
        primary.isTaken = true
      }
      return Button(clean({ key, label, onPress, ...rest }))
    },
    buttons: (children) => Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'sm', children }),
    // A segmented control: one Button per option; the one in force is checked and drawn at full
    // strength, the others dim until the pointer or the focus is on them.
    segmented: (prefix, options, current, onPick) =>
      Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 'sm',
        rowGap: 'sm',
        children: options.map((o) => Button(clean({ key: prefix + '-' + o.value, label: (o.value === current ? '✓ ' : '') + o.label, dimColor: o.value === current ? undefined : true, onPress: () => onPick(o.value) }))),
      }),
    dot: (level) => text('● ', level === 'info' || level === 'success' ? { dimColor: true } : { color: level }),
    // A line with a hanging glyph: the glyph in its own column, the words wrapping beside it.
    hang: (glyph, words, trailing) =>
      Box({
        flexDirection: 'row',
        alignItems: 'flex-start',
        columnGap: 1,
        children: [Box({ width: 2, flexShrink: 0, children: [glyph] }), Box({ flexGrow: 1, flexShrink: 1, children: [words] }), ...(trailing ? [Box({ flexShrink: 0, children: [trailing] })] : [])],
      }),
  }
  return k
}

// ---- the frame ------------------------------------------------------------------------------

export function drawDashboard(k, d, act) {
  // today includes this session: the ledger can lag the session's own count by a turn
  if (d.today < d.usd) d = { ...d, today: d.usd }
  SHARE = costShare(d)
  k.showDetails = !!d.view.showDetails
  const wanted = OLD_TABS[d.view.tab] || d.view.tab
  const tab = TABS.some((t) => t.id === wanted) ? wanted : 'all'
  k.hues = TAB_HUES[tab]
  const body =
    tab === 'all' ? allTab(k, d, act)
    : tab === 'usage' ? usageTab(k, d, act)
    : tab === 'skills' ? skillsTab(k, d, act)
    : tab === 'workflows' ? workflowsTab(k, d, act)
    : tab === 'settings' ? settingsTab(k, d, act)
    : overviewTab(k, d, act)
  // A desktop button draws its label and nothing else, so a tab's name is all it says; the
  // headline says what needs you.
  // On desktop the tabs read as a segmented control: the open one filled, the rest quiet text, so
  // the white primary button stays the one main action of the view. The terminal marks the open tab.
  const tabs = TABS.map((t) =>
    k.button('tab-' + t.id, t.label, () => act.setView({ tab: t.id, confirm: '', editing: '' }), {
      hotkey: k.hotkey(t.hotkey),
      variant: k.isTerminal && t.id === tab ? 'primary' : undefined,
      isTab: true,
      plain: !k.isTerminal && t.id !== tab ? true : undefined,
      dimColor: !k.isTerminal && t.id !== tab ? true : undefined,
    }),
  )
  // what hover cards say, drawn in place instead: for keyboards, screen readers and touch
  const details = k.button('details', d.view.showDetails ? '✓ Show details' : 'Show details', () => act.setView({ showDetails: !d.view.showDetails }), { hotkey: k.hotkey('d'), dimColor: d.view.showDetails ? undefined : true })
  // on desktop the tabs sit in one rounded track, the open one filled; the terminal marks the open one
  const track = k.isTerminal ? k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', children: tabs }) : k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'xs', paddingX: 'xs', paddingY: 'xs', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true, children: tabs })
  return k.Box({
    flexDirection: 'column',
    paddingX: k.isTerminal ? 0 : 'md',
    paddingY: k.isTerminal ? 0 : 'sm',
    rowGap: k.isTerminal ? 'md' : 'lg',
    children: [k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'sm', alignItems: 'center', children: [track, k.Box({ flexGrow: 1 }), details] }), changeCard(k, d, act, tab), ...body.filter(Boolean)],
  })
}

// A change the pane is making itself, on the tab it belongs to: worked out in the background, shown
// as what is there now and what it becomes, and written only when Save is pressed.
function changeCard(k, d, act, tab) {
  const c = d.change
  if (!c || !c.status || c.tab !== tab) return null
  const block = (label, words, props = {}) => k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text(label, { size: 'footnote', weight: 'semibold', dimColor: true }), ...String(words).split('\n').map((line) => k.text(line, { wrap: 'wrap', ...props }))] })
  const body =
    c.status === 'working'
      ? [k.hang(k.live(HEX.bar, 'suggestion', 'Working'), k.text('Working it out with the helper model. Nothing is written until you save it.', { wrap: 'wrap' }))]
      : c.status === 'error'
        ? [k.hang(k.dot('warning'), k.text(c.error, { wrap: 'wrap' })), k.buttons([k.button('change-redo', 'Work it out again', act.redoChange), k.button('change-cancel', 'Close', act.cancelChange, { dimColor: true })])]
        : [
            block('Now', c.before, { dimColor: true }),
            block('After', c.after),
            ...(c.note ? [k.footnote(c.note)] : []),
            k.buttons([k.button('change-save', 'Save change', act.saveChange, { variant: 'primary' }), k.button('change-cancel', 'Cancel', act.cancelChange, { dimColor: true })]),
          ]
  // the working state has its Cancel too, so a slow answer never holds the pane
  if (c.status === 'working') body.push(k.buttons([k.button('change-cancel', 'Cancel', act.cancelChange, { dimColor: true })]))
  // the file it changes is always said, not left to Show details
  return k.card(c.title, c.shown, body, { gap: 'md', keepCaption: true })
}

// A runway for one item: an SVG on desktop, block characters on the terminal. Its words say the
// same thing, so it never rests on colour alone.
// Each tab has its own two colours, used for the gradient of its big figure and its bloom: identity only. Amber and red are left to status, and take over a figure that has passed an alert.
const TAB_HUES = {
  all: ['#0A84FF', '#BF5AF2'],
  workflows: ['#BF5AF2', '#FF375F'],
  overview: ['#64D2FF', '#00C7BE'],
  usage: ['#0A84FF', '#00C7BE'],
  skills: ['#5E5CE6', '#BF5AF2'],
  settings: ['#64D2FF', '#8E8E93'],
}
const STATUS_HUES = { warning: ['#FFB340', '#FF9F0A'], error: ['#FF6961', '#FF453A'] }

// The big figure of a head, drawn in a gradient on desktop: a limit past its alert is amber and one nearly
// out is red, every other figure takes its tab's colours. Null on the terminal, and where the value would
// not fit its half of the row (the plain text figure truncates there instead).
function heroFigure(k, value, { size = 34, level, hues, align } = {}) {
  if (!k.hasSvg) return null
  const room = Math.floor(k.px * (k.columns >= 90 ? 0.5 : 0.9))
  const fit = Math.min(size, Math.floor(room / Math.max(1, String(value).length * 0.62)))
  if (fit < 20) return null
  const status = level === 'warning' || level === 'error' ? STATUS_HUES[level] : null
  const src = svgFigure(value, { size: fit, align: align || (k.columns >= 90 ? 'end' : 'start'), hexes: status || hues || k.hues || TAB_HUES.all })
  return k.drawing(src, String(value))
}

function runwayBar(k, it, where, widthPx) {
  const r = it.runway
  const words = it.label + ' ' + it.valueText + (r.runOut !== null && r.runOut !== undefined ? ', runs out before it resets' : r.projected !== null && r.projected !== undefined ? ', on pace for about ' + Math.round(r.projected) + '% by the reset' : r.elapsed !== null && r.elapsed !== undefined ? ', ' + Math.round(r.elapsed) + '% of the window gone' : '')
  // the calendar is drawn at the column's reckoned width, at exactly the size it was made
  if (k.hasSvg && it.window && widthPx && widthPx >= 280) return k.Box({ width: '100%', children: [k.drawing(svgWindow({ ...r, hex: it.hex, ...it.window, days: it.days }, { width: Math.round(widthPx) }), words + (it.daysAlt || ''), { isInteractive: it.days ? true : undefined })] })
  // a runway has no words in it, so it is made wide and drawn at whatever width its slot has
  if (k.hasSvg) return k.Box({ width: '100%', children: [k.Svg({ source: svgRunway({ ...r, hex: it.hex }, { width: widthPx || 4000, height: 14, isFluid: true }), alt: words, height: 14, ...(widthPx ? { width: widthPx } : {}) })] })
  return k.Text({ children: textRunway(r, where === 'band' ? 10 : 20).map(([t, c]) => k.text(t, c ? { color: c } : {})) })
}

function levelAt(d, pct) {
  return pct >= d.opts.cheaperModelAt ? 'error' : pct >= d.opts.contextWarnAt ? 'warning' : 'success'
}

function ctxLevel(d) {
  return levelAt(d, d.pct)
}

function compactAt(d) {
  const b = d.breakdown
  return b && b.isAutoCompactEnabled && typeof b.autoCompactThreshold === 'number' ? b.autoCompactThreshold : null
}

// The head of a tab, drawn as Home's hero is: the one answer the tab gives as a headline with its
// glyph, a line of facts under it, one big figure at the far end (under it on a narrow pane), and
// below, the drawing that shows it. A tab has one of these and nothing above it but its tab bar.
//   o: { eyebrow?, glyph, headline, facts?, factsTip?, figure?: { value, caption, level, tip? }, visual: node[] }
function lead(k, o) {
  const isWide = k.columns >= 90
  const factsText = o.facts && o.facts !== '.' ? k.text(o.facts, { dimColor: true, wrap: 'wrap' }) : null
  const words = k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    flexGrow: 1,
    flexShrink: 1,
    children: [
      ...(o.eyebrow ? [k.footnote(o.eyebrow, { wrap: 'truncate-end' })] : []),
      k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [...(o.glyph ? [o.glyph] : []), k.text(o.headline, { size: 'title', weight: 'semibold', wrap: 'wrap' })] }),
      ...(factsText ? [o.factsTip ? k.hoverBox('lead-facts', { flexDirection: 'column' }, [factsText], o.factsTip) : factsText] : []),
    ],
  })
  const f = o.figure
  const figureLevel = f && f.level && f.level !== 'success' && f.level !== 'info' ? f.level : undefined
  const big = f ? heroFigure(k, f.value, { size: 36, level: figureLevel }) : null
  const figureBody = f
    ? [
        big || k.text(f.value, { size: 'title', weight: 'semibold', tabular: true, color: figureLevel, wrap: 'truncate-end' }),
        k.footnote(f.caption, { wrap: 'truncate-end', ...(figureLevel ? { color: figureLevel, dimColor: undefined } : {}) }),
        ...(f.sub ? [k.footnote(f.sub, { wrap: 'truncate-end', tabular: true })] : []),
      ]
    : []
  const figure = f
    ? k.Box({
        flexDirection: 'column',
        alignItems: isWide ? 'flex-end' : 'flex-start',
        flexShrink: 0,
        ...(isWide ? { paddingLeft: 'lg' } : { paddingTop: 'xs' }),
        children: f.tip ? [k.hoverBox('lead-figure', { flexDirection: 'column', alignItems: isWide ? 'flex-end' : 'flex-start' }, figureBody, f.tip)] : figureBody,
      })
    : null
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    paddingX: k.isTerminal ? 1 : 'xs',
    children: [
      isWide ? k.Box({ flexDirection: 'row', alignItems: 'flex-end', width: '100%', children: [words, ...(figure ? [figure] : [])] }) : k.Box({ flexDirection: 'column', children: [words, ...(figure ? [figure] : [])] }),
      ...(o.visual && o.visual.length ? [k.Box({ flexDirection: 'column', rowGap: 'sm', marginTop: 'sm', children: o.visual })] : []),
    ],
  })
}

function tile(k, key, label, value, detail, extra = {}) {
  return k.tile(
    key,
    { flexDirection: 'column', width: k.columns >= 72 ? '25%' : '50%', paddingRight: 'md' },
    [
      k.footnote(label, { wrap: 'truncate-end' }),
      k.text(value, { size: 'title', weight: 'semibold', tabular: true, color: extra.color }),
      ...(extra.meter ? [k.meter([{ value: extra.meter.value, hex: extra.meter.level === 'success' ? HEX.bar : HEX[extra.meter.level], color: extra.meter.level === 'success' ? 'suggestion' : extra.meter.level }], 100, [], label + ' ' + Math.round(extra.meter.value) + '%', true)] : []),
      k.footnote(detail, { tabular: true }),
    ],
    extra.tip ? { align: extra.align || 'right', ...extra.tip } : null, // a left tile's card opens on the right
  )
}

function tiles(k, list) {
  return k.tileRow(list, { rowGap: 'md' })
}

const CONFIRMS = {
  compact: ['Shrink this conversation to a summary? A handoff note is written first.', 'Compact conversation', 'compact'],
  fresh: ['Start a fresh conversation? A handoff note is written, the conversation is cleared, and the prompt box asks Claude to carry on from the note.', 'Start fresh', 'fresh'],
  reset: ["Clear this session's numbers? Spending history across days is kept.", 'Reset numbers', 'reset'],
  defaults: ['Put every setting back to its default?', 'Restore defaults', 'restoreDefaults'],
}

// The confirmation for whichever of `kinds` is waiting, if any.
function confirmRows(k, d, act, kinds) {
  const c = d.view.confirm
  if (!c || !kinds.includes(c) || !CONFIRMS[c]) return []
  const cancel = k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })
  if ((c === 'compact' || c === 'fresh') && d.isTurnRunning) {
    return [k.Box({ flexDirection: 'column', rowGap: 'sm', children: [k.text('Claude is working. Try again once the turn finishes.', { color: 'warning', wrap: 'wrap' }), k.buttons([cancel])] })]
  }
  const [question, label, action] = CONFIRMS[c]
  return [k.Box({ flexDirection: 'column', rowGap: 'sm', children: [k.text(question, { weight: 'medium', wrap: 'wrap' }), k.buttons([k.button('confirm-go', label, (ev) => act[action](ev && ev.surface)), cancel])] })]
}

function noteStatus(d) {
  const at = d.note.at ? Date.parse(d.note.at) : NaN
  if (Number.isNaN(at)) return 'No handoff note yet. One is written before every compaction.'
  return 'Handoff note written ' + fmtSpan(d.now - at) + ' ago' + (d.note.reason ? ', ' + d.note.reason : '') + '.'
}

// Write a note, start fresh, compact: the three ways to carry on with less, wherever they show.
function shrinkBody(k, d, act, skipConfirm) {
  return [
    k.text(noteStatus(d), { wrap: 'wrap' }),
    k.buttons([
      k.button('handoff', 'Write handoff note', act.writeNote, { hotkey: k.hotkey('n') }),
      k.button('fresh', 'Start fresh…', () => act.setView({ confirm: 'fresh' }), { hotkey: k.hotkey('f') }),
      k.button('compact', 'Compact now…', () => act.setView({ confirm: 'compact' }), { hotkey: k.hotkey('c') }),
      ...(d.note.text ? [k.button('note', d.view.showNote ? 'Hide note' : 'Show note', act.toggleNote, { hotkey: k.hotkey('s'), dimColor: true })] : []),
    ]),
    ...(skipConfirm ? [] : confirmRows(k, d, act, ['compact', 'fresh'])),
    ...(d.note.text && d.view.showNote ? [k.Box({ borderStyle: k.isTerminal ? undefined : 'round', borderDimColor: k.isTerminal ? undefined : true, paddingX: k.isTerminal ? 0 : 'md', children: [k.Markdown({ key: 'note-text', text: d.note.text })] })] : []),
  ]
}

function gainLine(k, gain) {
  return k.text('↓ ' + gain, { size: 'footnote', color: 'success', wrap: 'wrap' })
}

// ---- This session ---------------------------------------------------------------------------
// Opens on its one answer: what the session has cost, how full the window compaction works to is,
// and whether the conversation will make it: bars climbing towards the line where Claude Code
// compacts, and the ghosts the next turns add at the recent pace.

// The first thing to run out, as a sentence: "Weekly limit runs out around Sat 5:21 AM".
function rowVerdict(r) {
  const turns = /^about (.+) away$/.exec(r.value)
  if (r.label === 'Auto-compaction') return turns ? 'Claude Code compacts this conversation in about ' + turns[1] : 'Claude Code is likely to compact this conversation within a turn'
  if (r.label === 'Context' && turns) return 'The window fills in about ' + turns[1]
  if (/^(runs out|reached)/.test(r.value)) return r.label + ' ' + r.value
  if (/^(about|likely)/.test(r.value)) return r.label + ' is ' + r.value
  return r.label + ': ' + r.value
}

// The context window as a drawing across the column: on desktop the runway over its turns, on the
// terminal its blocks. Null until the window is measured.
function contextVisual(k, d, pace, level) {
  if (!(d.window > 0)) return null
  const cAt = compactAt(d)
  const hex = tint(RING_HEX.context, level)
  const words = 'Context window, ' + d.pct + '% full: ' + fmtTokens(d.tokens) + ' of ' + fmtTokens(d.window) + ' tokens' + (cAt ? '. Claude Code compacts at ' + fmtTokens(cAt) : '') + (pace && pace.turns !== null ? ', about ' + plural(pace.turns, 'turn', 'turns') + ' away at this pace' : '') + '.'
  if (k.hasSvg) {
    const series = d.turns.filter((t) => t.context > 0).slice(-CHART_SLOTS)
    const src = svgContext(
      {
        used: d.tokens,
        total: d.window,
        compactAt: cAt,
        warnAt: d.opts.contextWarnAt,
        cheaperAt: d.opts.cheaperModelAt,
        hex,
        early: level !== 'success' || (!!pace && pace.turns !== null && pace.turns <= 3),
        per: pace ? pace.per : null,
        ahead: 6,
        // each turn's bar takes the colour its own fullness had: cyan, then amber and red as it crossed the alerts
        turns: series.map((t) => ({ context: t.context, hex: tint(RING_HEX.context, levelAt(d, (t.context / d.window) * 100)), title: fmtClock(t.at, d.now) + ': ' + fmtTokens(t.context) + ' tokens (' + Math.round((t.context / d.window) * 100) + '%)' })),
        labels: { now: 'Now ' + fmtTokens(d.tokens), compact: cAt ? 'Compacts at ' + fmtTokens(cAt) : '', end: fmtTokens(d.window) },
      },
      { width: Math.round(k.px - 8) },
    )
    return k.Box({ width: '100%', children: [k.drawing(src, words, { isInteractive: true })] })
  }
  return k.Text({ children: textRunway({ used: d.pct, elapsed: null, runOut: null, ticks: [d.opts.contextWarnAt, cAt ? Math.round((cAt / d.window) * 100) : d.opts.cheaperModelAt] }, 30).map(([t, c]) => k.text(t, c ? { color: c } : {})) })
}

function overviewTab(k, d, act) {
  const h = d.health
  const hc = homeContext(d)
  const heroConfirms = h.action ? confirmRows(k, d, act, [h.action.key]) : []
  const pace = contextPace(d)
  const first = d.outlook.find((r) => r.isFirst)
  const level = ctxLevel(d)

  // the verdict: whichever of the context window, a limit or a budget is first to run out, else room
  const verdict = first ? rowVerdict(first) : pace && pace.turns !== null && pace.turns > 3 ? 'Room for about ' + plural(pace.turns, 'more turn', 'more turns') : pace && pace.free > 0 ? 'Room to keep going' : d.window > 0 ? 'The window is full' : 'Waiting for the first answer'
  const vLevel = first ? first.level : level === 'success' ? 'success' : level
  const since = d.startedAt > 0 ? d.now - d.startedAt : 0
  const last = d.turns[d.turns.length - 1]
  const facts = [
    d.window > 0 ? fmtTokens(d.tokens) + ' of ' + fmtTokens(d.window) + ' tokens (' + d.pct + '%)' : '',
    compactAt(d) ? 'compacts at ' + fmtTokens(compactAt(d)) : '',
    since >= 2 * 60_000 ? cost(d.usd / (since / 3_600_000)) + ' an hour' : '',
  ].filter(Boolean)
  const budgetLevel = d.opts.sessionBudget > 0 && d.usd >= d.opts.sessionBudget ? 'error' : d.opts.sessionBudget > 0 && d.usd >= d.opts.sessionBudget * 0.8 ? 'warning' : 'success'
  const head = lead(k, {
    glyph: vLevel === 'success' || vLevel === 'info' ? k.text('✓ ', { color: 'success' }) : k.text('● ', { color: vLevel }),
    headline: verdict,
    facts: facts.join(' · ') + '.',
    factsTip: { title: 'Context, ' + d.pct + '% full', lines: ['Everything Claude re-reads on each turn: the fuller it is, the more a turn costs.', 'The cost is Claude Code’s own count, as /cost shows it: on a subscription the API-price equivalent, not a bill.', d.modelWindow && d.window && d.window < d.modelWindow ? 'Measured against the ' + fmtTokens(d.window) + ' window compaction works to, not the model’s ' + fmtTokens(d.modelWindow) + '.' : '', pace && pace.per ? 'Recent turns added about ' + fmtTokens(pace.per) + ' tokens each.' : 'A turn count shows after a few turns.'], align: 'left' },
    figure: { value: cost(d.usd), caption: (SHARE ? 'of your weekly limit · ' : '') + 'this session' + (last ? ' · +' + cost(last.usd || 0) + ' last turn' : ''), sub: Math.abs(d.today - d.usd) >= 0.005 ? 'Today ' + cost(d.today) : '', level: budgetLevel },
    visual: [
      contextVisual(k, d, pace, level),
      ...hc.windows.map((x, i) => limitRow(k, d, hc, x, i)),
      // what to do about it: the advice with the most to gain, and its one button
      k.hang(
        k.dot(h.level),
        k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.text(h.title, { weight: 'semibold', wrap: 'wrap' }),
            k.guide(h.detail),
            ...(h.item && h.item.gain ? [gainLine(k, h.item.gain)] : []),
            ...shareLines(k, d),
            ...(h.action ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('hero-action', h.action.label, () => act.run(h.action.key), { variant: 'primary' })])] })] : []),
            ...heroConfirms,
          ],
        }),
      ),
    ].filter(Boolean),
  })

  // each section is drawn by a function of the kit, so a wide pane can draw it for its own column
  const ways = (kk) => {
    const more = d.advice.filter((a) => a !== h.item)
    if (!more.length) return null
    const shown = d.view.showMore ? more : more.slice(0, 3)
    return kk.card('More ways to save', null, [
      ...shown.map((a, i) =>
        kk.hang(
          kk.dot(a.level),
          kk.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              kk.text(a.title, { weight: 'semibold', wrap: 'wrap' }),
              kk.guide(a.detail),
              ...(a.gain ? [gainLine(kk, a.gain)] : []),
              ...(a.action ? [kk.Box({ marginTop: 'xs', children: [kk.buttons([kk.button('advice-' + i, a.action.label, () => act.run(a.action.key))])] })] : []),
            ],
          }),
        ),
      ),
      ...(more.length > 3 ? [kk.buttons([kk.button('advice-more', d.view.showMore ? 'Show fewer' : 'Show all ' + more.length, act.toggleMore, { dimColor: true })])] : []),
    ], { gap: 'md' })
  }
  const howLong = (kk) =>
    d.outlook.length < 2 ? null : kk.card(
      'How long you can keep going',
      d.outlook.some((r) => r.isFirst) ? 'The first thing to run out is in bold.' : null,
      d.outlook.length
        ? d.outlook.map((r, i) =>
            kk.hoverBox('outlook-' + i, { flexDirection: 'column', width: '100%' }, kk.columns < 60
              // a narrow pane stacks the value under its label, in words, instead of cutting it short
              ? [kk.text(r.label, { weight: r.isFirst ? 'semibold' : 'medium', wrap: 'wrap' }), kk.text(r.value, { wrap: 'wrap', color: quiet(r.level), weight: r.isFirst ? 'semibold' : undefined }), ...(r.sub ? [kk.footnote(r.sub)] : [])]
              : [
              kk.row([{ text: r.label }, { text: r.value, width: 34, color: quiet(r.level) }], r.isFirst ? { weight: 'semibold' } : {}),
              ...(r.sub ? [kk.row([{ text: '' }, { text: r.sub, width: Math.min(46, kk.columns - 22) }], { size: 'footnote', dimColor: true })] : []),
            ], r.tip),
          )
        : [kk.footnote('Shows once Claude Code reports how full the context is.')],
    )
  const winsCard = (kk) => {
    const won = wins(d)
    return won.length ? kk.card('Wins this session', 'What ToBeBestMe has saved you so far.', won.map((w) => kk.hang(kk.text('✓', { color: 'success' }), kk.text(w, { wrap: 'wrap' })))) : null
  }
  const shrink = (kk) => kk.card('Make the conversation smaller', 'A handoff note keeps the goal and next steps, so a smaller conversation picks up where you left off.', shrinkBody(kk, d, act, heroConfirms.length > 0))
  const recent = (kk) => {
    if (!d.activity.length) return null
    const all = [...d.activity].reverse()
    const shown = d.view.showAllActivity ? all : all.slice(0, 4)
    return kk.card('Recent activity', 'What happened this session, with each figure as it was at the time.', [
      ...shown.map((a) => kk.hang(kk.dot(a.level), kk.text(a.text, { wrap: 'wrap' }), kk.footnote(fmtClock(a.at, d.now), { tabular: true, wrap: 'truncate-end' }))),
      kk.buttons([...(all.length > 4 ? [kk.button('activity-more', d.view.showAllActivity ? 'Show fewer' : 'Show all ' + all.length, act.toggleActivity, { dimColor: true })] : []), kk.button('activity-clear', 'Clear activity', act.clearActivity, { dimColor: true })]),
    ], { keepCaption: true })
  }

  // what fills the window sits on this tab too, below the things to act on
  if (k.isTerminal || k.columns < SPLIT_AT) {
    const c = contextBlocks(k, d, act)
    return [head, ways(k), modelCard(k, d, act), longRunCard(k, d, act), howLong(k), c.context, c.per, c.loaded, winsCard(k), shrink(k), recent(k)].filter(Boolean)
  }
  const [km, ka] = k.split()
  const cm = contextBlocks(km, d, act)
  const ca = contextBlocks(ka, d, act)
  return [head, km.layout([ways(km), modelCard(km, d, act), longRunCard(km, d, act), cm.context, cm.loaded], [howLong(ka), ca.per, winsCard(ka), shrink(ka), recent(ka)])]
}

// Today's share of the weekly limit, said calmly: the pace that lasts, and where today stands.
function shareLines(k, d) {
  const l = d.limits.find((x) => x.r.kind === 'seven_day') || d.limits.find((x) => /seven_day/.test(x.r.kind))
  const s = l ? dailyShare(l, (d.limitHistory && d.limitHistory[l.r.kind]) || [], d.now) : null
  if (!s) return []
  return [k.Text({ wrap: 'wrap', children: [k.text(s.isOver ? '● ' : '✓ ', s.isOver ? { color: 'warning' } : { color: 'success' }), k.text('Weekly limit: ' + shareSentence(s), { size: 'footnote' })] })]
}

// What tobebestme has actually saved this session, in its own words.
function wins(d) {
  const out = []
  if (d.wins.compactions) out.push(plural(d.wins.compactions, 'compaction', 'compactions') + (d.wins.tokensFreed ? ' freed ' + fmtTokens(d.wins.tokensFreed) + ' tokens from every later turn' : ' kept the conversation lean'))
  if (d.routing.spawnsForced) out.push(plural(d.routing.spawnsForced, 'helper', 'helpers') + ' ran on ' + titleCase(d.opts.cheapModel) + ' instead of a pricier model')
  if (d.routing.rerouted) out.push(plural(d.routing.rerouted, 'main request', 'main requests') + ' went to ' + titleCase(d.opts.cheapModel))
  if (d.routing.effortLowered) out.push(plural(d.routing.effortLowered, 'request', 'requests') + ' thought less once context got large')
  const totals = Object.values(d.models).reduce((t, r) => ({ requests: t.requests + r.requests, input: t.input + r.input + r.cacheRead + r.cacheWrite, cacheRead: t.cacheRead + r.cacheRead }), { requests: 0, input: 0, cacheRead: 0 })
  if (totals.requests >= 3 && totals.input > 0 && totals.cacheRead / totals.input >= 0.6) out.push(Math.round((totals.cacheRead / totals.input) * 100) + '% of input came from the cache, at about a tenth of the price')
  // counted as they happen, not from the activity list, which can be cleared
  if (d.wins.notes) out.push(plural(d.wins.notes, 'handoff note', 'handoff notes') + ' saved, so nothing is lost when the conversation shrinks')
  if (d.wins.skills) out.push(plural(d.wins.skills, 'skill', 'skills') + ' saved for work you repeat')
  return out
}

// ---- Context: what fills the window, drawn on This session ---------------------------------

function contextParts(d) {
  const b = d.breakdown
  if (b && Array.isArray(b.categories) && b.rawMaxTokens > 0) {
    const used = b.categories.filter((c) => c.kind === 'used' && c.tokens > 0).sort((a, z) => z.tokens - a.tokens)
    const buffer = b.categories.find((c) => c.kind === 'buffer')
    return { total: b.rawMaxTokens, rows: used.map((c, i) => ({ name: c.name, tokens: c.tokens, hex: CATEGORY_HEX[i % CATEGORY_HEX.length], color: c.color })), buffer: buffer ? buffer.tokens : 0, isMeasured: true }
  }
  return { total: d.window || 0, rows: d.tokens > 0 ? [{ name: 'In use', tokens: d.tokens, hex: RING_HEX.context, color: 'suggestion' }] : [], buffer: 0, isMeasured: false }
}

// More about one category than its row can hold: what it is, its share, what fills it, how to shrink it.
function categoryTip(d, r, total) {
  const info = categoryInfo(r.name)
  const share = total > 0 ? Math.max(r.tokens / total < 0.01 ? 0 : 1, Math.round((r.tokens / total) * 100)) : 0
  const lines = [info.what, fmtTokens(r.tokens) + ' tokens, ' + (share ? share + '%' : 'under 1%') + ' of the window.']
  const b = d.breakdown
  if (/^messages/i.test(r.name)) {
    const big = Object.keys(d.tools).map((n) => ({ n, t: d.tools[n].chars / 4 })).sort((a, z) => z.t - a.t).slice(0, 3)
    if (big.length) lines.push('Biggest tool output: ' + big.map((x) => toolName(x.n) + ' ~' + fmtTokens(x.t)).join(', ') + '.')
  } else if (/^mcp tools/i.test(r.name) && b) {
    const servers = mcpServers(b)
    if (servers.length) lines.push('Biggest: ' + servers.slice(0, 3).map((s) => s.label + ' ' + fmtTokens(s.tokens)).join(', ') + '.')
  } else if (/memory/i.test(r.name) && b && Array.isArray(b.memoryFiles) && b.memoryFiles.length) {
    lines.push(b.memoryFiles.map((m) => (m.path.split('/').pop() || m.path) + ' ' + fmtTokens(m.tokens)).join(', ') + '.')
  } else if (/skills/i.test(r.name) && b && b.skills) {
    const used = Object.keys(d.skillUse || {}).length
    lines.push(plural(b.skills.includedSkills, 'skill', 'skills') + ' listed, ' + plural(used, 'skill', 'skills') + ' used this session.')
  }
  if (info.how) lines.push(info.how)
  return { title: r.name, lines }
}

function contextBlocks(k, d, act) {
  const o = d.opts
  const parts = contextParts(d)
  const used = parts.rows.reduce((s, r) => s + r.tokens, 0)
  // free space is everything not in use, the part kept back for compaction included, so it reads the same here as in Claude Code's own count
  const free = Math.max(0, parts.total - used)
  const share = (n) => (parts.total > 0 ? Math.round((n / parts.total) * 100) + '%' : '')
  const b = d.breakdown
  const cAt = compactAt(d)
  const swatch = (hex, color) => k.text(hex ? '■ ' : '□ ', hex ? { color: k.isTerminal ? color : midHex(hex) } : { dimColor: true })
  const biggest = Math.max(1, ...parts.rows.map((r) => r.tokens))
  const barW = k.columns >= 72 ? 18 : 10
  const legend = [k.heads([{ text: 'What fills it' }, { text: '', width: barW }, { text: 'Tokens', width: 9 }, { text: 'Share', width: 7 }])]
  parts.rows.forEach((r, i) => legend.push(k.row([{ parts: [swatch(r.hex, r.color), r.name] }, { el: k.bar(r.tokens, biggest, r.hex, r.name + ' ' + fmtTokens(r.tokens)), width: barW }, { text: fmtTokens(r.tokens), width: 9 }, { text: share(r.tokens), width: 7 }], {}, { key: 'cat-' + i, tip: categoryTip(d, r, parts.total) })))
  if (parts.rows.length) legend.push(k.row([{ parts: [swatch(null), 'Free space'] }, { text: '', width: barW }, { text: fmtTokens(free), width: 9 }, { text: share(free), width: 7 }], { dimColor: true }, { key: 'cat-free', tip: { title: 'Free space', lines: [categoryInfo('Free space').what, cAt && cAt > d.tokens ? 'Claude Code compacts after another ' + fmtTokens(cAt - d.tokens) + ' tokens.' : ''] } }))
  if (parts.buffer) legend.push(k.row([{ parts: [swatch(null), k.columns >= 60 ? 'Of that, kept for compaction' : 'Kept for compaction'] }, { text: '', width: barW }, { text: fmtTokens(parts.buffer), width: 9 }, { text: share(parts.buffer), width: 7 }], { dimColor: true }, { key: 'cat-buffer', tip: { title: 'Kept free for compaction', lines: [categoryInfo('Autocompact buffer').what] } }))

  const markers = [
    { at: o.contextWarnAt, title: 'Warning at ' + o.contextWarnAt + '%' },
    { at: o.cheaperModelAt, title: 'Helpers switch to ' + titleCase(o.cheapModel) + ' at ' + o.cheaperModelAt + '%' },
    ...(cAt && parts.total ? [{ at: (cAt / parts.total) * 100, title: 'Claude Code compacts at ' + fmtTokens(cAt) }] : []),
  ]
  const out = {}
  const put = (name, node) => {
    out[name] = node
  }
  put('context',
    k.card('What fills the context', 'Everything Claude re-reads on each turn. The fuller it is, the more each turn costs.', [
      k.meter(
        [...parts.rows.map((r) => ({ value: r.tokens, hex: r.hex, color: r.color, title: r.name + ': ' + fmtTokens(r.tokens) + ' tokens (' + share(r.tokens) + ')' })), ...(parts.buffer ? [{ value: parts.buffer, hex: HEX.buffer, color: 'inactive', glyph: '▒', dim: true, title: 'Kept free for compaction: ' + fmtTokens(parts.buffer) }] : [])],
        parts.total,
        markers,
        'Context ' + d.pct + '% full: ' + parts.rows.map((r) => r.name + ' ' + fmtTokens(r.tokens)).join(', '),
      ),
      k.footnote('Marks: warning at ' + o.contextWarnAt + '% · cheaper model at ' + o.cheaperModelAt + '%' + (cAt ? ' · auto-compaction at ' + fmtTokens(cAt) : '') + (k.isTerminal ? '' : '. Point at a part or a row for more.')),
      k.Box({ flexDirection: 'column', marginTop: 'sm', children: legend }),
      ...(parts.isMeasured ? [] : [k.footnote('The breakdown by category appears once Claude Code has measured it.')]),
    ]),
  )

  const withSize = d.turns.filter((t) => t.context > 0)
  const last = d.turns[d.turns.length - 1]
  const lastInput = last ? (last.input || 0) + (last.cacheRead || 0) + (last.cacheWrite || 0) : 0
  const reuse = last && lastInput > 0 && typeof last.cacheRead === 'number' ? Math.round((last.cacheRead / lastInput) * 100) : null
  const shownSize = withSize.slice(-CHART_SLOTS)
  put('per',
    !(reuse !== null || shownSize.length >= 4) ? null : k.card('Per request', 'About ' + fmtTokens(d.tokens) + ' tokens go with every request now.', [
      ...(reuse !== null ? [k.footnote(reuse + "% of the last turn's input came from the cache, which costs about a tenth as much.")] : []),
      // on a surface that draws, the turns' history is the lead's own drawing; the terminal keeps its sparkline here
      ...(shownSize.length >= 4 && !k.hasSvg
        ? [
            k.bars(shownSize.map((t) => t.context), Math.max(16, shownSize.length), 'Context size over the last ' + plural(shownSize.length, 'turn', 'turns') + ', now ' + fmtTokens(d.tokens) + ' tokens.', 44, { colors: shownSize.map(() => RING_HEX.context), titles: shownSize.map((t) => fmtClock(t.at, d.now) + ': ' + fmtTokens(t.context) + ' tokens') }),
            k.footnote('Context size after each of the last ' + plural(shownSize.length, 'turn', 'turns') + ', oldest on the left.'),
          ]
        : []),
    ]),
  )

  if (b) {
    const groups = []
    const servers = mcpServers(b)
    // One scale for every bar in this card, so a server, a memory file and the skill list compare.
    const agentTokens = Array.isArray(b.agents) ? b.agents.reduce((n, a) => n + a.tokens, 0) : 0
    const scale = Math.max(1, ...servers.map((x) => x.tokens), ...(b.memoryFiles || []).map((m) => m.tokens), b.skills ? b.skills.tokens : 0, b.slashCommands ? b.slashCommands.tokens : 0, agentTokens)
    const loadedBar = (n, alt) => ({ el: k.bar(n, scale, RING_HEX.context, alt), width: barW })
    if (servers.length) {
      groups.push(
        group(k, 'MCP servers', servers.slice(0, 8).map((s, i) => k.row([{ text: s.label }, loadedBar(s.tokens, s.label + ' ' + fmtTokens(s.tokens)), { text: fmtTokens(s.tokens), width: 9 }], {}, { key: 'mcp-' + i, tip: { title: s.label, lines: [s.label !== s.name ? 'A connector: ' + s.name + '.' : '', plural(s.tools.length, 'tool', 'tools') + ', ' + fmtTokens(s.tokens) + ' tokens on every request.', s.tools.slice(0, 5).join(', ') + (s.tools.length > 5 ? ', and ' + (s.tools.length - 5) + ' more' : '') + '.'] } })), [k.button('manage-mcp', 'Manage MCP servers', () => act.run('mcp'))]),
      )
    }
    const memory = Array.isArray(b.memoryFiles) ? [...b.memoryFiles].sort((a, z) => z.tokens - a.tokens).slice(0, 5) : []
    if (memory.length) {
      groups.push(group(k, 'Memory files', memory.map((m, i) => k.row([{ text: (m.path.split('/').pop() || m.path) + ' (' + m.type + ')' }, loadedBar(m.tokens, m.path), { text: fmtTokens(m.tokens), width: 9 }], {}, { key: 'memory-' + i, tip: { title: m.path.split('/').pop() || m.path, lines: [m.path, fmtTokens(m.tokens) + ' tokens, read at the start of every session.'] } })), [k.button('edit-memory', 'Edit memory', () => act.run('memory'))]))
    }
    const listed = []
    if (b.skills) listed.push(k.row([{ text: plural(b.skills.includedSkills, 'skill', 'skills') }, loadedBar(b.skills.tokens, 'Skills'), { text: fmtTokens(b.skills.tokens), width: 9 }], {}, { key: 'listed-skills', tip: { title: 'Skills', lines: [categoryInfo('Skills').what, 'The Skills tab shows which cost the most.'] } }))
    if (Array.isArray(b.agents) && b.agents.length) listed.push(k.row([{ text: plural(b.agents.length, 'custom agent', 'custom agents') }, loadedBar(agentTokens, 'Custom agents'), { text: fmtTokens(agentTokens), width: 9 }], {}, { key: 'listed-agents', tip: { title: 'Custom agents', lines: [b.agents.slice(0, 6).map((a) => a.agentType).join(', ') + '.'] } }))
    if (b.slashCommands) listed.push(k.row([{ text: plural(b.slashCommands.includedCommands, 'slash command', 'slash commands') }, loadedBar(b.slashCommands.tokens, 'Slash commands'), { text: fmtTokens(b.slashCommands.tokens), width: 9 }], {}, { key: 'listed-commands', tip: { title: 'Slash commands', lines: ['Listed so Claude can run them for you.'] } }))
    if (listed.length) groups.push(group(k, 'Listed for Claude', listed, b.skills ? [k.button('review-skills', 'Review skills', () => act.run('skills'))] : []))
    if (groups.length) put('loaded', k.card('Always loaded', 'Sent with every request, before you type anything.', groups, { gap: 'lg' }))
  }

  return out
}

// A titled group of rows inside a card, with its own buttons.
function group(k, title, rows, buttons = []) {
  return k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text(title, { size: 'footnote', weight: 'semibold', dimColor: true }), ...rows, ...(buttons.length ? [k.Box({ marginTop: 'xs', children: [k.buttons(buttons)] })] : [])] })
}

// ---- Usage: what can run out, then what this session spent ----------------------------------
// One tab for both questions people ask together, "how long can I keep going?" and "what did
// that cost?": the plan's limits and their forecast first, then turns, budgets and models.

// The limits as one list: this session's own readings, else the plan's windows as another session
// or the desktop app read them, so the tab has a forecast whichever way it was told.
function limitList(d, h) {
  if (d.limits.length) return d.limits
  return h.windows.map((w) => {
    const kind = /5|hour/i.test(w.label) ? 'five_hour' : /opus/i.test(w.label) ? 'seven_day_opus' : 'seven_day'
    const r = { kind, percentUsed: w.pct, resetsAt: w.resetsAt ? new Date(w.resetsAt).toISOString() : undefined }
    const o = limitOutlook(r, null, d.now)
    return { r, o, level: limitLevel(r, o, d.opts) }
  })
}

// The one that matters most: the soonest to run out early, else the fullest.
function leadLimit(limits) {
  const early = limits.filter((l) => isEarly(l.r, l.o)).sort((a, z) => a.o.fullAt - z.o.fullAt)[0]
  return early || [...limits].sort((a, z) => z.r.percentUsed - a.r.percentUsed)[0] || null
}

// A bar split into parts with its legend under it, for "where it went": each part says what it is on
// hover, and the legend says it in words with the share.
function splitBar(k, title, parts, alt) {
  const total = parts.reduce((n, p) => n + p.value, 0)
  if (!(total > 0)) return null
  const glyphs = ['█', '▓', '▒', '░', '▪']
  const pct = (v) => (v / total < 0.01 ? '<1' : String(Math.round((v / total) * 100))) + '%'
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    children: [
      k.footnote(title),
      k.meter(parts.map((p, i) => ({ value: p.value, hex: p.hex, color: 'suggestion', glyph: glyphs[i % glyphs.length], dim: i > 0 ? true : undefined, title: p.name + ': ' + pct(p.value) })), total, [], alt),
      k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', rowGap: 'xs', children: parts.map((p) => k.Text({ children: [k.text(k.isTerminal ? '' : '● ', k.isTerminal ? {} : { color: midHex(p.hex) }), k.text(p.name + ' ' + pct(p.value), { size: 'footnote', dimColor: true, tabular: true })] })) }),
    ],
  })
}

// Where the last seven days went: each day stacked by project in its colour (as Home's calendar is),
// then the same days by model.
function usageWhere(k, d, h) {
  if (!h.has) return []
  const { u, now } = h
  const days = u.days.slice(-7)
  const keys = u.keys.slice(-7)
  const from = u.days.length - 7
  const stacks = keys.map((_, i) => {
    let other = 0
    const parts = []
    for (const p of u.projects) {
      const v = p.days[from + i] || 0
      if (!(v > 0)) continue
      if (h.hues[p.key]) parts.push({ value: v, hex: h.hues[p.key] })
      else other += v
    }
    return other > 0 ? [...parts, { value: other, hex: OTHER_HEX }] : parts
  })
  const mean = avg(days)
  const out = []
  if (days.some((v) => v > 0)) {
    out.push(
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          k.footnote('Each of the past 7 days, by project'),
          k.bars(days, 7, 'Use each day over the past 7 days: ' + keys.map((key, i) => dayWords(key, now) + ' ' + cost(days[i])).join(', ') + '.', 64, { stacks, titles: keys.map((key, i) => dayWords(key, now) + ': ' + cost(days[i])), average: true, averageTitle: 'Average: ' + cost(mean) + ' a day' }),
          k.Box({
            flexDirection: 'row',
            width: '100%',
            children: keys.map((key, i) => k.Box({ width: 0, flexGrow: 1, flexShrink: 1, justifyContent: 'center', children: [k.footnote(i === keys.length - 1 ? 'Today' : weekdayOf(key), { wrap: 'truncate-end', ...(i === keys.length - 1 ? { dimColor: undefined, weight: 'semibold' } : {}) })] })),
          }),
        ],
      }),
    )
  }
  const byProject = u.projects.filter((p) => p.week > 0)
  const shownProjects = byProject.slice(0, 5)
  const rest = byProject.slice(5).reduce((n, p) => n + p.week, 0)
  const projects = splitBar(k, 'Projects, past 7 days', [...shownProjects.map((p) => ({ name: p.name, value: p.week, hex: hueOf(h, p.key) })), ...(rest > 0 ? [{ name: 'other projects', value: rest, hex: OTHER_HEX }] : [])], 'Past 7 days by project: ' + shownProjects.map((p) => p.name + ' ' + cost(p.week)).join(', '))
  const families = {}
  for (const [m, usd] of u.models) {
    const name = modelName(m).replace(/ [\d.]+$/, '')
    families[name] = families[name] || { name, value: 0, hex: modelHex(m) }
    families[name].value += usd
  }
  const helped = u.kinds.helpers + u.kinds.workflows
  const models = splitBar(k, 'Models, past 7 days', Object.values(families).sort((a, z) => z.value - a.value), 'Past 7 days by model: ' + Object.values(families).map((f) => f.name + ' ' + cost(f.value)).join(', '))
  if (projects) out.push(projects)
  if (models) out.push(models)
  if (helped > 0) out.push(k.footnote('Helpers and workflow agents did ' + Math.round((helped / Math.max(0.0001, u.kinds.main + helped)) * 100) + '% of the week’s work.'))
  return out
}

// Opens on the forecast: where the limit that matters most is heading, drawn with its history, and
// under it where the week's work went. With no plan limits it opens on the spending instead.
function usageLead(k, d, act, h, limits, main) {
  const u = h.has ? h.u : null
  let glyph
  let headline
  let facts = []
  let level = 'success'
  let chart = null
  if (main) {
    const { r, o } = main
    const p = Math.round(r.percentUsed)
    const what = r.kind === 'five_hour' ? 'window' : 'week'
    level = main.level
    if (isEarly(r, o)) {
      headline = limitLabel(r.kind) + ' runs out ' + fmtClock(o.fullAt, d.now)
      facts = [o.resetAt !== null ? fmtSpan(o.resetAt - o.fullAt) + ' before it resets' : '', o.resetAt !== null ? 'resets ' + fmtClock(o.resetAt, d.now) : '']
    } else if (o.atReset !== null) {
      headline = 'On pace to end the ' + what + ' at about ' + Math.min(100, Math.round(o.atReset)) + '%'
      facts = [limitLabel(r.kind) + ' is ' + p + '% used', o.resetAt !== null ? 'resets ' + fmtClock(o.resetAt, d.now) : '']
    } else {
      headline = limitLabel(r.kind) + ' is ' + p + '% used'
      facts = ['The pace shows once the window has run a quarter of an hour']
    }
    glyph = level === 'success' || level === 'info' ? k.text('✓ ', { color: 'success' }) : k.text('● ', { color: level })
    chart = limitChart(k, d, main)
  } else {
    const budget = d.opts.dailyBudget > 0 ? { label: 'Daily budget', cap: d.opts.dailyBudget, spent: d.today } : d.opts.sessionBudget > 0 ? { label: 'Session budget', cap: d.opts.sessionBudget, spent: d.usd } : null
    level = budget ? (budget.spent >= budget.cap ? 'error' : budget.spent >= budget.cap * 0.8 ? 'warning' : 'success') : 'success'
    headline = budget ? (budget.spent >= budget.cap ? budget.label + ' reached' : fmtUsd(budget.cap - budget.spent) + ' left of the ' + budget.label.toLowerCase()) : d.today > 0 ? cost(d.today) + ' today' : 'No spending yet today'
    facts = [budget ? fmtUsd(budget.spent) + ' of ' + fmtUsd(budget.cap) : '', 'No plan limits reported yet']
    glyph = level === 'success' ? k.text('✓ ', { color: 'success' }) : k.text('● ', { color: level })
  }
  const factsLine = facts.filter(Boolean).join(' · ')
  const where = usageWhere(k, d, h)
  return lead(k, {
    glyph,
    headline,
    facts: factsLine ? factsLine + '.' : '',
    factsTip: u ? { title: 'The past 7 days, in every project', lines: ['What the week’s answers would cost at list prices, helpers and workflow agents included.', 'On a plan the limits are what you spend; this shows how heavy the work was.'], align: 'left' } : undefined,
    figure: u ? { value: cost(u.week.usd), caption: SHARE ? 'of your weekly limit · past 7 days' : 'of work in the past 7 days', sub: u.today.usd > 0 ? 'Today ' + cost(u.today.usd) : '' } : { value: cost(d.today), caption: 'today on this machine', sub: 'This session ' + cost(d.usd) },
    visual: [chart, ...where].filter(Boolean),
  })
}

function usageTab(k, d, act) {
  const h = homeContext(d)
  const limits = limitList(d, h)
  const main = leadLimit(limits)
  const head = usageLead(k, d, act, h, limits, main)
  if (k.isTerminal || k.columns < SPLIT_AT) {
    const spent = spendingTab(k, d, act, h)
    return [head, ...(limits.length ? limitsTab(k, d, act, limits, main) : []), ...(limits.length ? [limitsSettings(k, d, act)] : []), spent.glance, spent.turns, spent.budgets, spent.models, spent.tools, spent.week, spent.share].filter(Boolean)
  }
  // wide: the record of what was spent on the left, the controls and the glance beside them
  const [km, ka] = k.split()
  const spentMain = spendingTab(km, d, act, h)
  const spentSide = spendingTab(ka, d, act, h)
  return [
    head,
    km.layout(
      [...(limits.length ? limitsTab(km, d, act, limits, main) : []), spentMain.turns, spentMain.models, spentMain.tools, spentMain.week].filter(Boolean),
      [spentSide.glance, ...(limits.length ? [limitsSettings(ka, d, act)] : []), spentSide.budgets, spentSide.share].filter(Boolean),
    ),
  ]
}

// Dollars or a share of the weekly limit, beside the figures it changes, with what the share is
// worth now or why it can't show yet.
function costUnitRow(k, d, act) {
  const unit = d.opts.costUnit || 'auto'
  const isPlan = d.limits.length > 0 || !!(d.plan && d.plan.windows && d.plan.windows.length)
  const note = SHARE
    ? 'A share is an estimate: this week’s work in every project at list prices, against how far your weekly limit has moved. Now about ' + fmtShare(SHARE.pctPerUsd) + ' a dollar.'
    : unit === 'usd' ? ''
    : !isPlan ? (unit === 'limit' ? 'This account reports no plan limits, so costs stay in dollars.' : '')
    : 'Shares show once this week has had enough use to measure (about $20 of work and 5% of your weekly limit). Until then, dollars.'
  return k.Box({ flexDirection: 'column', rowGap: 'xs', children: [settingRow(k, d, act, settingSpec('costUnit')), ...(note ? [k.footnote(note)] : [])] })
}

function spendingTab(k, d, act, h) {
  const t = d.turns
  const o = d.opts
  const last = t[t.length - 1]
  const since = d.startedAt > 0 ? d.now - d.startedAt : 0
  // Four tiles, never the same figure twice: on the first day, today and the week equal the session.
  const list = [tile(k, 'tile-session', 'This session', cost(d.usd), since > 0 ? 'since ' + fmtClock(d.startedAt, d.now) : plural(t.length, 'turn', 'turns') + ' recorded', { tip: { title: 'This session', lines: ["Claude Code's own count, as /cost shows it.", 'On a subscription it is the API-price equivalent, not a bill.', plural(t.length, 'turn', 'turns') + ' recorded since tobebestme started watching.'] } })]
  if (last) list.push(tile(k, 'tile-last', 'Last turn', last ? cost(last.usd || 0) : '–', last ? fmtTurnTime(last.ms) + ' · ' + modelName(last.model) : 'none yet', { tip: last ? { title: 'Last turn', lines: ['Ended ' + fmtClock(last.at, d.now) + ' after ' + fmtTurnTime(last.ms) + '.', fmtTokens(last.output || 0) + ' tokens of output.'] } : null }))
  if (since >= 2 * 60_000) list.push(tile(k, 'tile-rate', 'Spending rate', cost(d.usd / (since / 3_600_000)) + '/h', 'since the session started', { tip: { title: 'Spending rate', lines: ['This session’s cost over the time it has run.'] }, align: 'left' }))
  const average = () => tile(k, 'tile-avg', 'Average turn', cost(avg(t.map((x) => x.usd || 0))), 'over ' + plural(t.length, 'turn', 'turns') + ' recorded', { tip: { title: 'Average turn', lines: ['What a turn has cost on average since tobebestme started watching.'] }, align: 'left' })
  const hasAverage = since < 2 * 60_000 && t.length > 0
  if (hasAverage) list.push(average())
  if (Math.abs(d.today - d.usd) >= 0.005 || o.dailyBudget > 0) list.push(tile(k, 'tile-today', 'Today', cost(d.today), o.dailyBudget > 0 ? 'of ' + fmtUsd(o.dailyBudget) + ' budget' : plural(Math.max(1, d.ledger.sessionsToday), 'session', 'sessions'), { tip: { title: 'Today', lines: ['Every session on this machine that runs tobebestme.'] }, align: 'left' }))
  if (list.length < 4 && d.ledger.week - d.today >= 0.005) list.push(tile(k, 'tile-week', 'Past 7 days', cost(d.ledger.week), 'on this machine', { tip: { title: 'Past 7 days', lines: ['Every session on this machine that runs tobebestme.'] }, align: 'left' }))
  if (list.length < 4 && t.length && !hasAverage) list.push(average())

  const out = {}
  const put = (name, node) => {
    out[name] = node
  }
  put('glance', k.card('This session at a glance', null, [tiles(k, list.slice(0, 4)), costUnitRow(k, d, act), ...(t.length === 0 ? [k.footnote("Turns appear here after Claude's next answer.")] : []), ...(d.limits.length ? [] : [k.footnote('No usage limits reported yet. On a Claude plan they show here after the first reply; with an API key you pay per request instead.')])]))

  // Every turn as a row with a bar for its cost, in its model's colour: it reads at one turn
  // and at sixty. Past eight turns a chart of the trend joins it.
  if (t.length === 0) {
    // no card of its own for nothing: the line goes under the tiles
  } else {
    const shown = t.slice(-CHART_SLOTS)
    const values = shown.map((x) => x.usd || 0)
    const recentRows = [...t].slice(-10).reverse()
    const most = Math.max(0.0001, ...recentRows.map((x) => x.usd || 0))
    const priciest = t.reduce((a, x) => ((x.usd || 0) > (a.usd || 0) ? x : a), t[0])
    const families = [...new Set(shown.map((x) => modelName(x.model)))]
    const recent = t.slice(-8)
    const span = recent.length >= 3 ? recent[recent.length - 1].at - recent[0].at : 0
    const facts = [['Most expensive', cost(priciest.usd || 0) + ' at ' + fmtClock(priciest.at, d.now)]]
    if (span >= 2 * 60_000) facts.push(['Recent pace', cost(recent.slice(1).reduce((n, x) => n + (x.usd || 0), 0) / (span / 3_600_000)) + ' an hour over the last ' + plural(recent.length, 'turn', 'turns')])
    const barW = k.columns >= 72 ? 18 : 10
    put('turns',
      k.card('Turns', t.length > recentRows.length ? 'The last ' + recentRows.length + ' of ' + t.length + ', newest first.' : 'Newest first.', [
        ...(values.length >= 8
          ? [
              k.bars(values, Math.max(16, values.length), 'Cost of the last ' + plural(values.length, 'turn', 'turns') + ', up to ' + cost(Math.max(...values)) + '; the latest ' + cost(last.usd || 0) + '.', 56, {
                colors: shown.map((x) => modelHex(x.model)),
                titles: shown.map((x) => fmtClock(x.at, d.now) + ' · ' + cost(x.usd || 0) + ' · ' + fmtTurnTime(x.ms) + ' · ' + modelName(x.model)),
                average: true,
                averageTitle: 'Average ' + cost(avg(values)) + ' a turn',
              }),
            ]
          : []),
        k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.heads([{ text: 'Ended' }, { text: '', width: barW }, { text: 'Cost', width: 9 }, { text: 'Took', width: 9 }, { text: 'Output', width: 8 }]),
            ...recentRows.map((x, i) => k.row([{ text: fmtClock(x.at, d.now) }, { el: k.bar(x.usd || 0, most, modelHex(x.model), cost(x.usd || 0)), width: barW }, { text: cost(x.usd || 0), width: 9 }, { text: fmtTurnTime(x.ms), width: 9 }, { text: fmtTokens(x.output || 0), width: 8 }], {}, { key: 'turn-' + i, tip: turnTip(x, d.now) })),
          ],
        }),
        k.Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 'md',
          children: [...families.map((f) => k.Text({ children: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(f)) }), k.text(f, { size: 'footnote', dimColor: true })] })), ...(k.isTerminal ? [] : [k.footnote('Point at a turn for its tokens and cache.')])],
        }),
        k.Box({ flexDirection: 'column', rowGap: 'xs', children: facts.map(([a, b]) => k.row([{ text: a, props: { dimColor: true } }, { text: b, width: 46 }])) }),
      ], { gap: 'md' }),
    )
  }

  // The budgets, set right where the spending is.
  const budgetRows = []
  const progress = (label, spent, cap) => {
    const level = spent >= cap ? 'error' : spent >= cap * 0.8 ? 'warning' : 'success'
    return k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.row([{ text: label }, { text: fmtUsd(spent) + ' of ' + fmtUsd(cap) + (spent < cap ? ' · ' + fmtUsd(cap - spent) + ' left' : ' · reached'), width: 34, color: quiet(level) }]), k.meter([{ value: Math.min(cap, spent), hex: level === 'success' ? RING_HEX.spending : HEX[level], color: level === 'success' ? 'success' : level }], cap, [80], label + ': ' + fmtUsd(spent) + ' of ' + fmtUsd(cap))] })
  }
  if (o.sessionBudget > 0) budgetRows.push(progress('This session', d.usd, o.sessionBudget))
  if (o.dailyBudget > 0) budgetRows.push(progress('Today', d.today, o.dailyBudget))
  budgetRows.push(...['sessionBudget', 'dailyBudget', 'atBudget'].map((f) => settingRow(k, d, act, settingSpec(f))))
  put('budgets',k.card('Budgets', 'A limit for this session or the day, and what happens when it is reached.', budgetRows, { gap: 'md' }))

  const names = Object.keys(d.models).sort((a, z) => d.models[z].requests - d.models[a].requests)
  if (names.length) {
    let all = 0
    let byHelpers = 0
    const rows = names.map((m, i) => {
      const r = d.models[m]
      all += r.requests
      byHelpers += r.subagent || 0
      const input = r.input + r.cacheRead + r.cacheWrite
      return k.row([{ parts: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(m)) }), modelName(m)] }, { text: String(r.requests), width: 10 }, { text: fmtTokens(input), width: 9 }, { text: fmtTokens(r.output), width: 9 }, { text: input ? Math.round((r.cacheRead / input) * 100) + '%' : '–', width: 11 }], {}, { key: 'model-' + i, tip: { title: modelName(m), lines: [plural(r.requests, 'request', 'requests') + (r.subagent ? ', ' + r.subagent + ' from helpers' : '') + '.', fmtTokens(input) + ' tokens in, ' + fmtTokens(r.cacheRead) + ' of them from the cache.', fmtTokens(r.output) + ' tokens out.'] } })
    })
    put('models',
      k.card('By model', null, [
        k.heads([{ text: 'Model' }, { text: 'Requests', width: 10 }, { text: 'Input', width: 9 }, { text: 'Output', width: 9 }, { text: 'From cache', width: 11 }]),
        ...rows,
        k.footnote((byHelpers ? byHelpers + ' of ' + all + ' requests came from helpers. ' : '') + 'Input from the cache costs about a tenth as much.'),
      ], { gap: 'xs' }),
    )
  }

  const helpers = Object.values(d.agents).sort((a, z) => z.requests - a.requests)
  const toolNames = Object.keys(d.tools).sort((a, z) => d.tools[z].chars - d.tools[a].chars)
  if (helpers.length || toolNames.length) {
    const sections = []
    if (helpers.length) {
      sections.push(
        k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.heads([{ text: 'Helpers (subagents)' }, { text: 'Model', width: 14 }, { text: 'Requests', width: 10 }, { text: 'Output', width: 9 }]),
            ...helpers.slice(0, 8).map((a, i) => k.row([{ text: a.label || a.type || 'Helper' }, { text: modelName(a.model), width: 14 }, { text: String(a.requests), width: 10 }, { text: fmtTokens(a.output), width: 9 }], {}, { key: 'helper-' + i, tip: { title: a.label || a.type || 'Helper', lines: [(a.type ? 'A ' + a.type + ' helper on ' : 'On ') + modelName(a.model) + '.', fmtTokens(a.input) + ' tokens in, ' + fmtTokens(a.output) + ' out.'] } })),
          ],
        }),
      )
    }
    if (toolNames.length) {
      sections.push(
        k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.heads([{ text: 'Tools' }, { text: '', width: k.columns >= 72 ? 14 : 8 }, { text: 'Calls', width: 14 }, { text: 'Time', width: 9 }, { text: 'Output', width: 9 }]),
            ...toolNames.slice(0, 10).map((n, i) => {
              const r = d.tools[n]
              return k.row([{ text: toolName(n) }, { el: k.bar(r.chars, d.tools[toolNames[0]].chars, TINT.gray, toolName(n) + ' output'), width: k.columns >= 72 ? 14 : 8 }, { text: r.calls + (r.errors ? ' (' + r.errors + ' failed)' : ''), width: 14 }, { text: fmtTurnTime(r.ms), width: 9 }, { text: '~' + fmtTokens(r.chars / 4), width: 9 }], {}, { key: 'tool-' + i, tip: { title: toolName(n), lines: [plural(r.calls, 'call', 'calls') + (r.errors ? ', ' + r.errors + ' failed' : '') + ', ' + fmtTurnTime(r.calls ? r.ms / r.calls : 0) + ' each on average.', 'About ' + fmtTokens(r.chars / 4) + ' tokens of output, which stays in the conversation.'] } })
            }),
            k.footnote('Tool output stays in the conversation and is re-read every turn. Sizes are estimates.'),
          ],
        }),
      )
    }
    put('tools',k.card('Helpers and tools', null, sections, { gap: 'md' }))
  }

  const days = d.ledger.days
  // with every project read, the lead above draws the week; this is the record of this machine's own sessions without it
  if (!(h && h.has) && days.filter((x) => x.usd > 0).length >= 2) {
    put('week',
      k.card('Past 7 days', 'All sessions on this machine that run tobebestme.', [
        k.bars(days.map((x) => x.usd), 7, 'Spending over the past 7 days: ' + days.map((x) => x.label + ' ' + cost(x.usd)).join(', ') + '.', 40, { colors: days.map(() => RING_HEX.spending), titles: days.map((x) => x.label + ': ' + cost(x.usd)) }),
        k.Box({ flexDirection: 'column', rowGap: 'xs', children: days.filter((x) => x.usd > 0).reverse().map((x) => k.row([{ text: x.label }, { text: cost(x.usd), width: 10 }], x.label === 'Today' ? { weight: 'semibold' } : {})) }),
        ...(d.ledger.projects.length > 1 ? [k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Today by project', { size: 'footnote', weight: 'semibold', dimColor: true }), ...d.ledger.projects.map((p) => k.row([{ text: p.project }, { text: cost(p.usd), width: 10 }]))] })] : []),
      ]),
    )
  }

  put('share',
    k.card('Share', null, [
      k.buttons([k.button('copy', 'Copy summary', (ev) => act.copySummary(ev && ev.surface), { hotkey: k.hotkey('y') }), k.button('report', 'Save report', act.saveReport, { hotkey: k.hotkey('r') })]),
      k.footnote('The summary is a few lines to paste anywhere. Reports are Markdown files in ~/' + REPORT_DIR + '/reports.'),
    ]),
  )
  return out
}

function turnTip(x, now) {
  const input = (x.input || 0) + (x.cacheRead || 0) + (x.cacheWrite || 0)
  return {
    title: 'Turn ended ' + fmtClock(x.at, now),
    lines: [
      cost(x.usd || 0) + ' · took ' + fmtTurnTime(x.ms) + ' · ' + modelName(x.model),
      input ? fmtTokens(input) + ' tokens in' + (x.cacheRead ? ', ' + Math.round((x.cacheRead / input) * 100) + '% from the cache' : '') + '; ' + fmtTokens(x.output || 0) + ' out.' : fmtTokens(x.output || 0) + ' tokens out.',
      x.context ? 'Context afterwards: ' + fmtTokens(x.context) + ' tokens.' : '',
      (x.idleMs || 0) >= 5 * 60_000 ? 'Started after ' + fmtSpan(x.idleMs) + ' away, so the cache had to be rebuilt.' : '',
    ],
  }
}

// ---- the plan's limits ------------------------------------------------------------------------

// A limit's forecast: its use so far, the line it is on and where that ends, with each reading taken
// on the way. Drawn at about the pane's width, so its labels keep their size on a narrow pane. Without
// a clock or a drawing surface, a meter.
function limitChart(k, d, l) {
  const r = l.r
  const o = l.o
  const p = Math.round(r.percentUsed)
  const span = WINDOW_MS[r.kind]
  const hex = RING_HEX[r.kind] || RING_HEX.seven_day_opus
  const early = isEarly(r, o)
  const day = (t) => {
    try {
      return new Date(t).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    } catch {
      return fmtClock(t, d.now)
    }
  }
  if (k.hasSvg && o.resetAt !== null && span) {
    return k.drawing(
      svgForecast({
        width: k.px - 24,
        start: o.resetAt - span,
        end: o.resetAt,
        now: d.now,
        pct: r.percentUsed,
        atReset: o.atReset,
        fullAt: o.fullAt,
        samples: (d.limitHistory && d.limitHistory[r.kind]) || [],
        alertAt: d.opts.limitAlertAt,
        hex: tint(hex, l.level),
        warnHex: early ? HEX.warning : HEX.marker,
        labels: {
          start: r.kind === 'five_hour' ? fmtClock(o.resetAt - span, d.now) : day(o.resetAt - span),
          end: 'resets ' + (r.kind === 'five_hour' ? fmtClock(o.resetAt, d.now) : day(o.resetAt)),
          full: 'runs out ' + fmtClock(o.fullAt || o.resetAt, d.now),
          fullTitle: 'At this pace it runs out around ' + fmtClock(o.fullAt || o.resetAt, d.now),
          now: 'Now: ' + p + '% used',
          area: 'Your use so far this ' + (r.kind === 'five_hour' ? 'window' : 'week'),
          projection: o.atReset !== null ? 'At this pace: about ' + Math.min(100, Math.round(o.atReset)) + '% by the reset' : '',
          sample: (s) => fmtClock(s.at, d.now) + ': ' + Math.round(s.pct) + '%',
        },
      }),
      limitLabel(r.kind) + ': ' + p + '% used. ' + paceSentence(l, d.now),
      { isInteractive: true },
    )
  }
  const runway = runwayOf(r.kind, r.percentUsed, o.resetAt, d.now)
  if (k.hasSvg && runway) return runwayBar(k, { label: limitLabel(r.kind), valueText: p + '% used', hex: tint(hex, l.level), runway, window: windowOf(r.kind, runway, o.resetAt, d.now) }, 'tile', k.px - 24)
  return k.meter([{ value: r.percentUsed, hex: l.level === 'success' ? hex : HEX[l.level], color: l.level === 'success' ? 'suggestion' : l.level }], 100, [d.opts.limitAlertAt], limitLabel(r.kind) + ' ' + p + '% used, alert at ' + d.opts.limitAlertAt + '%')
}

// Each limit's figures: how much is used, the pace, and what lasting until the reset takes. The one the
// tab opens on is drawn above, so its card carries the figures alone; Show details draws the others'
// history here.
function limitsTab(k, d, act, limits, main) {
  return limits.map((l) => {
    const r = l.r
    const o = l.o
    const p = Math.round(r.percentUsed)
    const hex = RING_HEX[r.kind] || RING_HEX.seven_day_opus
    const early = isEarly(r, o)
    // the same runway as Home and the line above the prompt; the history chart is for Show details
    const runway = runwayOf(r.kind, r.percentUsed, o.resetAt, d.now)
    const drawn = l === main ? null : k.showDetails ? limitChart(k, d, l) : runway ? runwayBar(k, { label: limitLabel(r.kind), valueText: p + '% used', hex: tint(hex, l.level), runway, window: windowOf(r.kind, runway, o.resetAt, d.now) }, 'tile', k.hasSvg ? k.px - 24 : undefined) : limitChart(k, d, l)
    const facts = []
    if (o.resetAt !== null) facts.push(['Resets', 'in ' + fmtSpan(o.resetAt - d.now)])
    if (o.recentPerHour !== null) facts.push(['Lately', 'about ' + (o.recentPerHour >= 10 ? Math.round(o.recentPerHour) : Math.round(o.recentPerHour * 10) / 10) + '% an hour while you work'])
    if (o.resetAt !== null && p < 100) {
      const hours = (o.resetAt - d.now) / 3_600_000
      if (r.kind === 'five_hour' && hours >= 0.5) facts.push(['To last until the reset', 'about ' + Math.max(1, Math.floor((100 - p) / hours)) + '% an hour'])
      else if (hours >= 24) facts.push(['To last until the reset', 'about ' + Math.max(1, Math.floor((100 - p) / (hours / 24))) + '% a day'])
    }
    const share = dailyShare(l, (d.limitHistory && d.limitHistory[r.kind]) || [], d.now)
    if (share && share.usedToday !== null) facts.push(['Today so far', Math.round(share.usedToday) + '% of about ' + Math.max(1, Math.round(share.share)) + '%' + (share.isOver ? ', over today’s share' : ', on track')])
    return k.card(limitLabel(r.kind), r.kind === 'five_hour' ? 'Resets five hours after the window starts.' : r.kind === 'seven_day' ? 'Your use across the week.' : null, [
      k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', alignItems: 'flex-end', children: [k.text(p + '% used', { size: 'title', weight: 'semibold', tabular: true, color: quiet(l.level) }), ...(l.level !== 'success' ? [k.footnote(l.level === 'error' ? 'nearly out' : early ? 'runs out early' : 'past your alert')] : [])] }),
      ...(drawn ? [drawn] : []),
      k.hang(k.dot(early ? 'warning' : 'info'), k.text(paceSentence(l, d.now), { wrap: 'wrap', weight: early ? 'medium' : undefined })),
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: facts.map(([a, b]) => k.row([{ text: a, props: { dimColor: true } }, { text: b, width: 40 }])) }),
    ], { accessory: o.resetAt !== null ? k.footnote('resets ' + fmtClock(o.resetAt, d.now), { wrap: 'truncate-end' }) : undefined })
  })
}

// The settings that make a limit last longer, beside the limits they stretch.
function limitsSettings(k, d, act) {
  return k.card('Making limits last', 'Opus uses them fastest, then Sonnet, then Haiku. A smaller conversation uses less on every turn.', [
    ...['mode', 'helpersAlwaysCheap', 'limitAlertAt'].map((f) => settingRow(k, d, act, settingSpec(f))),
    k.buttons([k.button('limits-shrink', 'Make the conversation smaller', () => act.run('context'), { dimColor: true })]),
  ], { gap: 'md' })
}

// ---- Skills -------------------------------------------------------------------------------

const EXAMPLES = [
  ['Run the tests and fix failures', 'Run the test suite, fix failures one at a time, then summarize what changed and what still fails.'],
  ['Write a commit message', 'Read the staged diff and write a clear commit message: a short subject line, then why the change was made.'],
  ['Review my changes', 'Review the current diff for bugs, missing tests and unclear names, and list findings by severity.'],
  ['Explain a file', 'Explain what a file does, how it fits into the project, and anything surprising in it, in plain words.'],
]

// The Skills tab answers four questions in order: can Claude see my skills, which ones earn
// their place, which of mine are written so they'll run when they should, and what is worth
// turning into a skill next. Changes to settings go through Claude, as a request you read and
// send; nothing is changed behind your back.
function skillsTab(k, d, act) {
  const s = d.skill
  const busy = d.view.busy
  const sk = d.skills || { runs: {}, listing: null, own: [], checkup: [], overrides: {}, promptIdeas: [] }
  const L = sk.listing
  const runs = sk.runs || {}
  const now = d.now
  const known = L ? L.byName : Object.create(null)
  const ranNames = Object.keys(runs).filter((n) => known[n] || sk.own.some((x) => x.name === n) || n.includes(':'))
  const ranCount = ranNames.reduce((n, x) => n + runs[x].runs, 0)
  const listed = L ? Object.values(known) : []
  const neverRun = listed.filter((x) => !runs[x.name] && sk.overrides[x.name] !== 'name-only')
  const neverTokens = neverRun.reduce((n, x) => n + (x.tokens || 0), 0)
  const isFull = !!L && (L.cut.length > 0 || L.tokens >= L.budget * 0.95)
  const isCounting = sk.pending > 0 && !ranNames.length // runs from before 1.0 are still being read
  const mine = new Set(sk.own.map((x) => x.name))
  const switchedOff = sk.own.filter((x) => sk.overrides[x.name] === 'off').length // put away on purpose
  const checked = sk.own.length - switchedOff
  const sec = {}
  const put = (name, node) => {
    sec[name] = node
  }

  // the answer first
  const problems = sk.checkup.filter((x) => x.issues.some((i) => i.level !== 'info'))
  const headline = !L
    ? 'Your skills'
    : L.cut.length
      ? L.cut.length === 1 ? 'Claude sees only the name of one skill' : 'Claude sees only the names of ' + L.cut.length + ' skills'
      : isFull
        ? 'The skill listing is full'
        : problems.length
          ? plural(problems.length, 'of your skills needs', 'of your skills need') + ' a look'
          : L.listed === 1 ? 'Claude can see your one skill' : 'Claude can see all ' + L.listed + ' skills'
  const level = L && (isFull || problems.length) ? 'warning' : 'success'
  const facts = []
  if (L) facts.push('The listing takes ' + fmtTokens(L.tokens) + ' of its ' + fmtTokens(L.budget) + '-token room on every request')
  if (ranNames.length) facts.push(plural(ranNames.length, 'skill', 'skills') + ' ran ' + plural(ranCount, 'time', 'times') + ' in the last ' + SCAN_DAYS + ' days')
  else if (isCounting) facts.push('Counting runs in every project…')
  else if (d.opts.scanProjects) facts.push('No skill ran in the last ' + SCAN_DAYS + ' days')
  // the listing is a thing that can run out, so it is drawn as a runway: the fill is how much of its room
  // the skills take, and a description that did not fit says so in words under it
  const fill = L ? Math.min(100, (L.tokens / Math.max(1, L.budget)) * 100) : 0
  const bySource = { yours: 0, plugins: 0, builtin: 0 }
  for (const x of listed) {
    if (x.pluginName) bySource.plugins += 1
    else if (mine.has(x.name) || x.source === 'userSettings' || x.source === 'projectSettings') bySource.yours += 1
    else bySource.builtin += 1
  }
  const listingItem = L ? { label: 'Skill listing', valueText: Math.round(fill) + '%', hex: tint(TINT.brown, isFull ? 'warning' : 'success'), runway: { used: fill, elapsed: null, runOut: null, ticks: [] } } : null
  const sources = [bySource.yours ? bySource.yours + ' yours' : '', bySource.plugins ? bySource.plugins + ' from plugins' : '', bySource.builtin ? bySource.builtin + ' built in' : ''].filter(Boolean).join(' · ')
  const idle = isCounting ? 0 : neverRun.length
  put(
    'lead',
    lead(k, {
      glyph: L || level !== 'success' ? k.text(level === 'success' ? '✓ ' : '● ', { color: level }) : null,
      headline,
      facts: facts.join(' · ') + '.',
      factsTip: L ? { title: 'The skill listing', lines: ['Names and descriptions, sent with every request so Claude can pick a skill.', 'Its room is ' + Math.round(L.fraction * 100) + '% of the context window: about ' + fmtTokens(L.budget) + ' tokens here' + (L.isCustomBudget ? ', set by you.' : '.'), 'Past it, skills go by name alone.'], align: 'left' } : undefined,
      figure: L ? { value: Math.round(fill) + '%', caption: 'of the listing’s room', sub: sources, level: isFull ? 'warning' : 'success' } : ranNames.length ? { value: String(ranNames.length), caption: 'skills ran in ' + SCAN_DAYS + ' days' } : null,
      visual: [
        ...(listingItem ? [k.hoverBox('skill-listing', { flexDirection: 'column', width: '100%' }, [runwayBar(k, listingItem, 'hero', k.hasSvg ? k.px - 8 : undefined)], { title: 'The skill listing, ' + Math.round(fill) + '% full', lines: [fmtTokens(L.tokens) + ' of about ' + fmtTokens(L.budget) + ' tokens, sent with every request.', idle ? plural(idle, 'skill', 'skills') + ' never ran in ' + SCAN_DAYS + ' days, together ' + fmtTokens(neverTokens) + ' tokens a request.' : '', sources ? 'Skills: ' + sources + '.' : ''], align: 'left' })] : []),
        ...(L && L.cut.length ? [k.footnote((L.cut.length === 1 ? 'Its description' : 'Their descriptions') + ' didn’t fit in the listing Claude reads, so it can’t match ' + (L.cut.length === 1 ? 'it' : 'them') + ' to what you ask. Typing /name still runs ' + (L.cut.length === 1 ? 'it' : 'them') + '.')] : L && isFull ? [k.footnote('One more skill and descriptions start going missing. Making room below keeps the ones you use visible.')] : []),
        // nothing to measure yet: say what a skill is, and offer the one thing to do
        ...(!L ? [k.footnote('A skill is a saved prompt: Claude runs it when you type its name, in any project, the same way each time. Ones you repeat are worth saving.'), k.buttons([k.button('skill-start', 'Build your first skill', () => act.setView({ focus: 'skill-describe' }), { variant: 'primary' })])] : []),
        ...(L && idle && idle < L.listed ? [k.footnote(plural(idle, 'skill', 'skills') + ' never ran in ' + SCAN_DAYS + ' days and ' + (idle === 1 ? 'takes' : 'take') + ' ' + fmtTokens(neverTokens) + ' tokens of it on every request.')] : []),
      ],
    }),
  )

  // making room: the three ways, each a request you read before it goes
  if (L && isFull) {
    const candidates = isCounting ? [] : neverRun.filter((x) => x.tokens > Math.ceil(x.name.length / 3) + 4).sort((a, z) => z.tokens - a.tokens)
    const byPlugin = {}
    for (const x of listed) if (x.pluginName) (byPlugin[x.pluginName] = byPlugin[x.pluginName] || []).push(x)
    const idlePlugins = isCounting ? [] : Object.entries(byPlugin).filter(([, xs]) => !xs.some((x) => runs[x.name])).sort((a, z) => z[1].length - a[1].length)
    const options = []
    if (candidates.length) {
      options.push(
        k.hang(
          k.text('1', { weight: 'semibold', dimColor: true }),
          k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.text('Make ' + plural(candidates.length, 'skill', 'skills') + ' you never run manual-only', { weight: 'semibold', wrap: 'wrap' }),
              k.footnote('They leave the listing and /name still runs them, freeing about ' + fmtTokens(candidates.reduce((n, x) => n + x.tokens, 0)) + ' tokens a request for the skills you use. For example: ' + candidates.slice(0, 4).map((x) => x.name).join(', ') + (candidates.length > 4 ? ', and ' + (candidates.length - 4) + ' more.' : '.')),
              k.Box({ marginTop: 'xs', children: [k.buttons([k.button('skills-manual', 'Make skills manual-only…', () => act.makeManual(candidates.map((x) => x.name)), { variant: s.draft ? undefined : 'primary' })])] }),
            ],
          }),
        ),
      )
    }
    if (idlePlugins.length) {
      options.push(
        k.hang(
          k.text(String(options.length + 1), { weight: 'semibold', dimColor: true }),
          k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.text('Turn off plugins you don’t use', { weight: 'semibold', wrap: 'wrap' }),
              k.footnote(idlePlugins.slice(0, 4).map(([name, xs]) => name + ' (' + plural(xs.length, 'skill', 'skills') + ')').join(', ') + (idlePlugins.length > 4 ? ', and ' + (idlePlugins.length - 4) + ' more' : '') + ': none of their skills ran in ' + SCAN_DAYS + ' days.'),
              k.Box({ marginTop: 'xs', children: [k.buttons([k.button('skills-plugins', 'Manage plugins', () => act.run('plugins'))])] }),
            ],
          }),
        ),
      )
    }
    options.push(
      k.hang(
        k.text(String(options.length + 1), { weight: 'semibold', dimColor: true }),
        k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.text('Give the listing more room', { weight: 'semibold', wrap: 'wrap' }),
            k.footnote('Twice the room holds about twice the descriptions, and every request carries them.'),
            k.Box({ marginTop: 'xs', children: [k.buttons([k.button('skills-budget', 'Give skills more room…', () => act.raiseBudget(L.fraction))])] }),
          ],
        }),
      ),
    )
    put('room', 
      k.card('Make room in the listing', 'Claude picks a skill from a listing of names and descriptions sent with every request. It has room for about ' + fmtTokens(L.budget) + ' tokens; what doesn’t fit goes by name alone. Each button puts a request in the prompt box for you to read and send.', options, { gap: 'md' }),
    )
  }

  // what earns its place: with nothing run, the lead already says so
  if (d.opts.scanProjects && (ranNames.length || isCounting || k.showDetails)) {
    const top = ranNames.map((n) => runs[n]).sort((a, z) => z.runs - a.runs || z.lastAt - a.lastAt)
    const most = Math.max(1, ...top.map((x) => x.runs))
    const barW = k.columns >= 72 ? 14 : 8
    put('used', 
      k.card('Most used', 'Skills that ran in the last ' + SCAN_DAYS + ' days, in every project: typed as /name, or picked by Claude.', top.length
        ? [
            k.heads([{ text: 'Skill' }, { text: '', width: barW }, { text: 'Runs', width: 6 }, { text: 'By you', width: 8 }, { text: 'By Claude', width: 10 }, { text: 'Last run', width: 12 }]),
            ...top.slice(0, d.view.showAllUsed ? 30 : 8).map((x, i) =>
              k.row(
                [
                  { parts: [k.text('/' + x.name, { weight: 'medium' })] },
                  { el: k.bar(x.runs, most, TINT.purple, x.name + ': ' + x.runs + ' runs'), width: barW },
                  { text: String(x.runs), width: 6 },
                  { text: x.typed ? String(x.typed) : '–', width: 8, props: { dimColor: true } },
                  { text: x.byClaude ? String(x.byClaude) : '–', width: 10, props: { dimColor: true } },
                  { text: ago(now - x.lastAt), width: 12, props: { dimColor: true } },
                ],
                {},
                { key: 'used-' + i, tip: { title: '/' + x.name, lines: [plural(x.runs, 'run', 'runs') + ' in ' + plural(x.sessions, 'session', 'sessions') + ': ' + (x.typed ? x.typed + ' typed by you' : '') + (x.typed && x.byClaude ? ', ' : '') + (x.byClaude ? x.byClaude + ' picked by Claude' : '') + '.', 'In ' + x.projects.slice(0, 4).join(', ') + (x.projects.length > 4 ? ' and ' + (x.projects.length - 4) + ' more' : '') + '.', known[x.name] ? fmtTokens(known[x.name].tokens) + ' tokens in the listing.' : ''] } },
              ),
            ),
            ...(top.length > 8 ? [k.buttons([k.button('used-more', d.view.showAllUsed ? 'Show fewer' : 'Show all ' + top.length, () => act.setView({ showAllUsed: !d.view.showAllUsed }), { dimColor: true })])] : []),
          ]
        : isCounting
          ? [k.text('Counting runs in every project…', { weight: 'medium' }), k.footnote('A one-time read of the last ' + SCAN_DAYS + ' days of transcripts, newest first. ' + plural(sk.pending, 'transcript', 'transcripts') + ' to go.')]
          : [k.text('No skill ran in the last ' + SCAN_DAYS + ' days.', { weight: 'medium' }), k.footnote('A skill runs when you type /name, or when Claude picks one whose description fits what you asked.')], { gap: 'xs' }),
    )
  }

  // are mine written to run when they should
  if (sk.own.length) {
    const showAll = !!d.view.showCheckup
    const list = showAll ? sk.checkup : sk.checkup.slice(0, 4)
    const words = { error: 'error', warning: 'warning', info: 'info' }
    put('check', 
      k.card('Check-up', 'Your own skills and commands, checked against what makes a skill run when it should.', [
        sk.checkup.length
          ? k.text(plural(sk.checkup.length, 'of your ' + checked + ' skills has', 'of your ' + checked + ' skills have') + ' something to fix or tidy.', { weight: 'medium', wrap: 'wrap' })
          : k.Box({ flexDirection: 'row', columnGap: 'sm', children: [k.text('✓', { color: 'success' }), k.text(checked ? (checked === 1 ? 'Your skill looks right' : 'All ' + checked + ' skills look right') + ': each says what it does and when to use it.' : 'Every one of your skills is switched off.', { wrap: 'wrap' })] }),
        ...(switchedOff ? [k.footnote(plural(switchedOff, 'skill is', 'skills are') + ' switched off in skillOverrides, so the check-up leaves ' + (switchedOff === 1 ? 'it' : 'them') + ' out.')] : []),
        ...list.map((x, i) =>
          k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.Text({ wrap: 'truncate-end', children: [k.text('/' + x.name, { weight: 'semibold' }), k.text('  ·  ' + [x.scope === 'project' ? 'this project' : 'yours', x.kind === 'command' ? 'command' : '', x.runs ? plural(x.runs, 'run', 'runs') + ' in ' + SCAN_DAYS + ' days' : ''].filter(Boolean).join(' · '), { size: 'footnote', dimColor: true })] }),
              ...x.issues.map((iss) => k.hang(k.dot(words[iss.level] === 'info' ? 'info' : iss.level), k.Box({ flexDirection: 'column', children: [k.text(iss.title, { weight: 'medium', wrap: 'wrap' }), k.footnote(iss.detail)] }))),
              k.Box({ marginTop: 'xs', children: [k.buttons([k.button('fix-' + i, 'Fix description…', () => act.fixSkill(x)), k.button('try-' + i, 'Try /' + x.name, () => act.trySkill(x.name), { dimColor: true }), k.button('path-' + i, 'Copy path', (ev) => act.copyText(x.path, ev && ev.surface, 'The path'), { dimColor: true })])] }),
            ],
          }),
        ),
        ...(sk.checkup.length > 4 ? [k.buttons([k.button('checkup-more', showAll ? 'Show fewer' : 'Show all ' + sk.checkup.length, () => act.setView({ showCheckup: !showAll }), { dimColor: true })])] : []),
      ], { gap: 'lg' }),
    )
  }

  // where the listing goes
  if (L) {
    const show = ['plugins', 'all', 'unused', 'cut'].includes(d.view.skillShow) ? d.view.skillShow : 'plugins'
    const filter = (d.view.skillFilter || '').trim().toLowerCase()
    const match = (x) => !filter || x.name.toLowerCase().includes(filter) || String(x.pluginName || '').toLowerCase().includes(filter)
    const barW = k.columns >= 72 ? 12 : 6
    let rows = []
    if (show === 'plugins') {
      const groups = {}
      for (const x of listed.filter(match)) {
        const key = x.pluginName || sourceWords(x.source)
        const g = (groups[key] = groups[key] || { name: key, isPlugin: !!x.pluginName, skills: 0, tokens: 0, runs: 0, cut: 0 })
        g.skills += 1
        g.tokens += x.tokens || 0
        g.runs += runs[x.name] ? runs[x.name].runs : 0
        if (L.cut.includes(x.name)) g.cut += 1
      }
      const list = Object.values(groups).sort((a, z) => z.tokens - a.tokens)
      const most = Math.max(1, ...list.map((g) => g.tokens))
      rows = [
        k.heads([{ text: 'From' }, { text: 'Skills', width: 8 }, { text: '', width: barW }, { text: 'Tokens', width: 8 }, { text: 'Runs', width: 7 }, { text: 'Name only', width: 10 }]),
        ...list.slice(0, 24).map((g, i) =>
          k.row(
            [
              { parts: [k.text(g.name, { weight: 'medium' })] },
              { text: String(g.skills), width: 8, props: { dimColor: true } },
              { el: k.bar(g.tokens, most, TINT.brown, g.name + ': ' + fmtTokens(g.tokens) + ' tokens'), width: barW },
              { text: fmtTokens(g.tokens), width: 8 },
              { text: g.runs ? String(g.runs) : '–', width: 7, props: g.runs ? {} : { dimColor: true } },
              { text: g.cut ? String(g.cut) : '–', width: 10, props: { dimColor: true } },
            ],
            {},
            { key: 'group-' + i, tip: { title: g.name, lines: [plural(g.skills, 'skill', 'skills') + ', ' + fmtTokens(g.tokens) + ' tokens on every request.', g.runs ? plural(g.runs, 'run', 'runs') + ' in ' + SCAN_DAYS + ' days.' : 'None of them ran in ' + SCAN_DAYS + ' days.', g.cut ? plural(g.cut, 'goes', 'go') + ' to Claude by name alone.' : '', g.isPlugin ? 'Turn the plugin off with /plugin.' : ''] } },
          ),
        ),
      ]
    } else {
      let list = listed.filter(match)
      if (show === 'unused') list = list.filter((x) => !runs[x.name])
      if (show === 'cut') list = list.filter((x) => L.cut.includes(x.name))
      list = list.sort((a, z) => (runs[z.name] ? runs[z.name].runs : 0) - (runs[a.name] ? runs[a.name].runs : 0) || z.tokens - a.tokens)
      const most = Math.max(1, ...list.map((x) => x.tokens))
      rows = [
        k.heads([{ text: 'Skill' }, { text: 'From', width: 16 }, { text: '', width: barW }, { text: 'Tokens', width: 7 }, { text: 'Runs', width: 6 }]),
        ...(list.length
          ? list.slice(0, 40).map((x, i) =>
              k.row(
                [
                  { parts: [k.text(x.name), ...(L.cut.includes(x.name) ? [k.text('  name only', { size: 'footnote', dimColor: true })] : [])] },
                  { text: x.pluginName || sourceWords(x.source), width: 16, props: { dimColor: true } },
                  { el: k.bar(x.tokens, most, TINT.brown, x.name), width: barW },
                  { text: fmtTokens(x.tokens), width: 7 },
                  { text: runs[x.name] ? String(runs[x.name].runs) : '–', width: 6, props: runs[x.name] ? {} : { dimColor: true } },
                ],
                {},
                { key: 'skill-' + i, tip: skillTip(x, runs[x.name], L.cut.includes(x.name), now) },
              ),
            )
          : [k.footnote(filter ? 'No skill matches “' + d.view.skillFilter + '”.' : show === 'cut' ? 'Every skill goes to Claude with its description.' : 'Every listed skill ran in the last ' + SCAN_DAYS + ' days.')]),
        ...(list.length > 40 ? [k.footnote('Showing 40 of ' + list.length + '. Type in Find a skill to narrow it.')] : []),
      ]
    }
    put('where', 
      k.card('Where the listing goes', 'Every skill Claude is told about, what it costs on every request, and how often it ran. Point at a row for where it comes from and how to turn it off.', [
        k.segmented('skill-show', [{ value: 'plugins', label: 'By source' }, { value: 'all', label: 'Every skill' }, { value: 'unused', label: 'Never ran' }, { value: 'cut', label: 'Name only' }], show, act.setSkillShow),
        ...(k.Input ? [k.Box({ width: '100%', children: [k.Input({ key: 'skill-filter', placeholder: 'Find a skill or plugin', value: d.view.skillFilter || '', submitLabel: 'Find', onInput: (value) => act.setSkillFilter(value), onSubmit: (value) => act.setSkillFilter(value) })] })] : []),
        k.Box({ flexDirection: 'column', rowGap: 'xs', children: rows }),
        k.buttons([k.button('manage-skills', 'Manage skills', () => act.run('skills-screen')), k.button('manage-plugins', 'Manage plugins', () => act.run('plugins'))]),
        k.footnote('Manage skills opens Claude Code’s own /skills screen, where each skill can be on, manual-only or off.'),
      ], { gap: 'md' }),
    )
  }

  // what is worth turning into a skill
  const ideas = [
    ...(sk.promptIdeas || []).map((x) => ({ id: x.id, title: 'You asked this ' + plural(x.times, 'time', 'times'), detail: '“' + (x.text.length > 160 ? x.text.slice(0, 157).replace(/\s+\S*$/, '') + '…' : x.text) + '”', where: x.projects.length ? 'In ' + x.projects.slice(0, 3).join(', ') + (x.projects.length > 3 ? ' and ' + (x.projects.length - 3) + ' more' : '') : '', seed: x.text })),
    ...d.skillIdeas,
    ...s.ideas,
  ].slice(0, 12)
  // the first three are drawn, as Needs you draws its first five; the rest are one press away
  const shownIdeas = d.view.showAllIdeas ? ideas : ideas.slice(0, 3)
  put('ideas',
    k.card('Skill ideas', 'What you keep asking for, in every project. A skill does it the same way each time, without the re-explaining.', [
      ...(ideas.length
        ? shownIdeas.map((idea, i) =>
            k.hang(
              k.text('✦', { color: k.isTerminal ? 'suggestion' : TINT.purple }),
              k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text(idea.title, { weight: 'semibold', wrap: 'wrap' }), k.footnote(idea.detail), ...(idea.where ? [k.footnote(idea.where)] : []), k.Box({ marginTop: 'xs', children: [k.buttons([k.button('idea-' + i, 'Draft this skill', () => act.draftIdea(idea))])] })] }),
            ),
          )
        : [k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text(sk.isSearching ? 'Looking through every project…' : 'Nothing repeated yet.', { weight: 'medium' }), k.footnote('Ideas come from prompts you type more than once, in any project, and commands run again and again.')] })]),
      ...(ideas.length > 3 ? [k.buttons([k.button('ideas-more', d.view.showAllIdeas ? 'Show fewer' : 'Show all ' + ideas.length, () => act.setView({ showAllIdeas: !d.view.showAllIdeas }), { dimColor: true })])] : []),
      busy === 'ideas'
        ? k.text('Looking for ideas…', { dimColor: true })
        : k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.buttons([k.button('skill-ideas', 'Suggest more with ' + titleCase(d.cheapMissing ? 'sonnet' : d.opts.cheapModel), act.findSkillIdeas), ...(sk.isSearching ? [] : [k.button('ideas-search', 'Search every project again', act.findIdeasEverywhere, { plain: true, dimColor: true })])]),
              k.footnote((sk.ideasAt ? 'Every project searched ' + ago(now - sk.ideasAt) + '. ' : '') + 'Suggest more sends your recent prompts to ' + (d.cheapMissing ? 'Sonnet' : titleCase(d.opts.cheapModel)) + ' in one small request.'),
            ],
          }),
    ], { gap: 'md' }),
  )

  // build one
  const builder = []
  if (s.saved && !s.draft && busy !== 'draft') {
    builder.push(k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.Box({ flexDirection: 'row', columnGap: 'sm', children: [k.text('✓', { color: 'success' }), k.text('/' + s.saved + ' is saved. New sessions list it.', { weight: 'medium', wrap: 'wrap' })] }), k.buttons([k.button('skill-try', 'Try /' + s.saved, () => act.trySkill(s.saved))])] }))
  }
  if (k.Input) {
    builder.push(k.Input({ key: 'skill-describe', placeholder: 'What should it do? For example: push, wait for the checks, then merge and deploy.', value: s.describe, rows: 3, submitLabel: 'Draft skill', onSubmit: (value) => act.draftSkill(value) }))
    if (!s.draft && busy !== 'draft') {
      builder.push(k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Or start from one of these, then press Return in the field to draft it:'), k.buttons(EXAMPLES.map(([label, describe], i) => k.button('example-' + i, label, () => act.setDescribe(describe), { dimColor: true })))] }))
    }
  } else {
    builder.push(k.footnote('Drafting needs a surface with text fields: the terminal, desktop or VS Code.'))
  }
  if (busy === 'draft') builder.push(k.text('Drafting with Sonnet…', { dimColor: true }))
  if (busy === 'improve') builder.push(k.text('Improving the draft with Sonnet…', { dimColor: true }))
  if (s.draft) {
    const checks = draftChecks(s.draft)
    builder.push(
      k.Box({
        flexDirection: 'column',
        rowGap: 'sm',
        children: [
          k.Box({ flexDirection: 'column', children: [k.text('Draft: /' + s.draft.name, { weight: 'semibold' }), ...(s.draft.description ? [k.footnote(s.draft.description)] : [])] }),
          k.Box({ flexDirection: 'column', rowGap: 'xs', children: checks.map(([ok, words]) => k.Box({ flexDirection: 'row', columnGap: 'sm', children: [k.text(ok ? '✓' : '●', ok ? { color: 'success' } : { color: 'warning' }), k.text(words, { size: 'footnote', wrap: 'wrap' })] })) }),
          k.Box({ borderStyle: k.isTerminal ? undefined : 'round', borderDimColor: k.isTerminal ? undefined : true, paddingX: k.isTerminal ? 0 : 'md', children: [k.Markdown({ key: 'skill-draft', text: s.draft.text })] }),
          k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Save it for', { size: 'footnote', weight: 'semibold', dimColor: true }), k.segmented('skill-scope', [{ value: 'project', label: 'This project' }, { value: 'user', label: 'All my projects' }], s.scope, act.setSkillScope), k.footnote('Saves to ' + d.skillPath)] }),
          k.buttons([k.button('skill-save', 'Save skill', act.saveSkill, { variant: 'primary' }), ...(s.previous ? [k.button('skill-undo', 'Undo improvement', act.undoImprove, { dimColor: true })] : []), k.button('skill-improve', 'Improve it', act.improveDraft), k.button('skill-discard', 'Discard draft', act.discardSkill, { dimColor: true })]),
        ],
      }),
    )
  }
  put('build', k.card('Build a skill', 'Describe what it should do. You see the draft, checked, before anything is saved.', builder, { gap: 'md' }))
  // what needs a look comes first, then what ran, what the listing holds, and what to make next
  return [sec.lead, sec.room, sec.check, sec.used, sec.where, sec.ideas, sec.build].filter(Boolean)
}

// What a draft gets right, against what makes a skill run when it should.
function draftChecks(draft) {
  const desc = String(draft.description || '')
  return [
    [desc.length >= 60, desc.length >= 60 ? 'Its description says enough to be matched.' : 'Its description is short: say what it does and when to use it.'],
    [/\b(use (it |this )?(when|for|to|if|whenever)|when (the user|you|someone|asked)|whenever)\b/i.test(desc), /\b(use (it |this )?(when|for|to|if|whenever)|when (the user|you|someone|asked)|whenever)\b/i.test(desc) ? 'It says when to use it.' : 'It doesn’t say when to use it. Ask Claude to improve it, or edit the draft.'],
    [desc.length <= 1536, desc.length <= 1536 ? 'It fits within the 1,536 characters Claude reads.' : 'Its description runs past the 1,536 characters Claude reads.'],
    [String(draft.text).split('\n').length <= 500, String(draft.text).split('\n').length <= 500 ? 'It’s short enough to load quickly.' : 'It’s long: move detail into reference files.'],
  ]
}

function sourceWords(source) {
  return { userSettings: 'You', projectSettings: 'This project', localSettings: 'Local', policySettings: 'Your organization', plugin: 'Plugin', bundled: 'Built in', 'built-in': 'Built in', mcp: 'MCP' }[source] || String(source || '')
}

function skillTip(x, run, isCut, now) {
  const where =
    x.pluginName ? 'From the ' + x.pluginName + ' plugin. Turn the plugin off with /plugin.'
    : x.source === 'userSettings' ? 'One of yours, in ~/.claude/skills/' + x.name + '.'
    : x.source === 'projectSettings' ? "This project's, in .claude/skills/" + x.name + '.'
    : /built/.test(String(x.source)) || x.source === 'bundled' ? 'Built into Claude Code.'
    : 'From ' + sourceWords(x.source) + '.'
  return {
    title: '/' + x.name,
    lines: [
      where,
      fmtTokens(x.tokens) + ' tokens in the listing on every request.',
      isCut ? 'Claude gets its name alone: the listing ran out of room for its description.' : '',
      run ? plural(run.runs, 'run', 'runs') + ' in ' + SCAN_DAYS + ' days, the last ' + ago(now - run.lastAt) + '.' : 'Not run in ' + SCAN_DAYS + ' days.',
    ],
  }
}

// ---- Settings ------------------------------------------------------------------------------

function control(k, d, act, s) {
  const v = d.opts[s.field]
  if (s.kind === 'boolean') {
    return k.segmented('opt-' + s.field, [{ value: true, label: 'On' }, { value: false, label: 'Off' }], v, (value) => act.setOption(s.field, value))
  }
  if (s.kind === 'choice') return k.segmented('opt-' + s.field, s.options, v, (value) => act.setOption(s.field, value))
  const presets = s.kind === 'model' ? s.presets.map((p) => ({ value: p, label: titleCase(p) })) : s.presets.map((p) => ({ value: p, label: settingWords(s, p) }))
  if (!presets.some((p) => p.value === v)) presets.push({ value: v, label: settingWords(s, v) })
  const isEditing = d.view.editing === s.field
  const options = k.Box({
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 'sm',
    rowGap: 'sm',
    children: [
      ...presets.map((o) => k.button('opt-' + s.field + '-' + o.value, (o.value === v ? '✓ ' : '') + o.label, () => act.setOption(s.field, o.value), { dimColor: o.value === v ? undefined : true })),
      ...(k.Input ? [k.button('opt-' + s.field + '-other', isEditing ? 'Cancel' : 'Other…', () => act.setView({ editing: isEditing ? '' : s.field }), { dimColor: true })] : []),
    ],
  })
  if (!isEditing || !k.Input) return options
  const field = k.Input({
    key: 'opt-' + s.field,
    placeholder: s.kind === 'model' ? 'a model id, such as claude-haiku-5-5' : s.unit === '$' ? 'dollars, such as 15' : 'a percentage, such as 65',
    value: s.kind === 'model' ? '' : String(v),
    submitLabel: 'Save',
    autoFocus: true,
    onSubmit: (value) => (s.kind === 'model' ? act.saveText(s, value) : act.saveNumber(s, value)),
  })
  return k.Box({ flexDirection: 'column', rowGap: 'sm', children: [options, k.Box({ width: 36, children: [field] })] })
}

function settingRow(k, d, act, s) {
  const words = [k.text(s.label, { weight: 'medium', wrap: 'wrap' }), k.footnote(s.help)]
  if (k.isRoomy) {
    return k.Box({
      flexDirection: 'row',
      columnGap: 'lg',
      children: [k.Box({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, width: '38%', children: words }), k.Box({ flexDirection: 'column', flexGrow: 0, flexShrink: 0, width: '62%', children: [control(k, d, act, s)] })],
    })
  }
  return k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.Box({ flexDirection: 'column', children: words }), control(k, d, act, s)] })
}


// What ToBeBestMe could read, source by source: Claude Code's own files change between versions,
// and a change should show here as a plain message, not as sections that are quietly empty.
const SOURCE_WORDS = [
  ['transcripts', 'Claude Code’s records', 'Every project’s transcripts, for Home, Usage and Skills'],
  ['runs', 'Workflow records', 'Finished runs and what each agent cost'],
  ['launch', 'Workflow starts', 'Following a run as it starts, for its controls'],
  ['agents', 'Running sessions', 'Which sessions are working or waiting now'],
  ['desk', 'Desktop sessions', 'Open sessions in the Claude app, for replies'],
  ['git', 'Folders’ git state', 'Work left uncommitted or unpushed'],
  ['skills', 'Your skills', 'Skill and command files, for the check-up'],
  ['integrity', 'This copy of ToBeBestMe', 'Its own files, checked against the release they came from'],
]

function sourcesCard(k, d) {
  const src = d.sources || {}
  const rows = SOURCE_WORDS.filter(([key]) => src[key]).map(([key, label, what], i) => {
    const x = src[key]
    // nothing found is not a success: a neutral dot, not a check
    const isZero = x.ok === true && /^0 /.test(String(x.detail || ''))
    const [glyph, color, word] = isZero ? ['○', undefined, ''] : x.ok === true ? ['✓', 'success', ''] : x.ok === false ? ['●', 'error', 'Couldn’t read'] : ['–', undefined, 'Not here']
    return k.hoverBox('source-' + i, { flexDirection: 'column', width: '100%' }, [
      k.Text({ wrap: 'wrap', children: [k.text(glyph + ' ', color ? { color } : { dimColor: true }), k.text(label, { weight: 'medium' }), k.text('  ' + (word ? word + (x.detail ? ': ' : '') : '') + (x.detail || ''), { dimColor: x.ok !== false ? true : undefined, color: x.ok === false ? 'error' : undefined })] }),
    ], { title: label, lines: [what + '.', 'Checked ' + ago(d.now - x.at) + '.'] })
  })
  if (!rows.length) return null
  const bad = SOURCE_WORDS.filter(([key]) => src[key] && src[key].ok === false).length
  return k.card('What ToBeBestMe reads', (d.version ? 'Claude Code ' + d.version + '. ' : '') + (bad ? 'Something couldn’t be read; an update to Claude Code may have changed it. The sections that use it say less until it can.' : 'Everything it uses was read. If an update changes these files, it shows here.'), rows)
}

function settingsTab(k, d, act) {
  const showAll = d.view.advanced
  const hidden = SETTINGS.reduce((n, g) => n + g.fields.filter((s) => s.advanced).length, 0)
  // each block is drawn by a function of the kit, with a rough weight, so a wide pane can balance two columns
  const blocks = [{ weight: 9, draw: (kk) => notifyCard(kk, d, act) }]
  for (const g of SETTINGS) {
    // Budgets and how costs show are set on Usage, the workflow check on Workflows, beside what they govern: one place each
    const fields = g.fields.filter((s) => (showAll || !s.advanced) && !s.inCard && !['sessionBudget', 'dailyBudget', 'atBudget', 'workflowCheck', 'costUnit'].includes(s.field))
    if (fields.length) blocks.push({ weight: fields.length * 2 + 1, draw: (kk) => kk.card(g.group, null, fields.map((s) => settingRow(kk, d, act, s)), { gap: 'lg' }) })
  }
  blocks.push({ weight: 1, draw: (kk) => kk.Box({ paddingX: kk.isTerminal ? 1 : 'lg', children: [kk.buttons([kk.button('advanced', showAll ? 'Hide advanced settings' : 'Show ' + hidden + ' advanced settings', act.toggleAdvanced)])] }) })
  blocks.push({
    weight: 4,
    draw: (kk) =>
      kk.card('Reset', "Settings save straight away to Claude Code's settings and appear in /config too.", [
        kk.buttons([kk.button('defaults', 'Restore defaults…', () => act.setView({ confirm: 'defaults' })), kk.button('reset', "Reset this session's numbers…", () => act.setView({ confirm: 'reset' }))]),
        ...confirmRows(kk, d, act, ['defaults', 'reset']),
        kk.footnote('The handoff note is at ' + HANDOFF_PATH + '.'),
      ], { gap: 'md' }),
  })
  blocks.push({ weight: 8, draw: (kk) => sourcesCard(kk, d) })
  const head = settingsLead(k, d, act)
  if (k.isTerminal || k.columns < SPLIT_AT) return [head, ...blocks.map((x) => x.draw(k))]
  // wide: each block goes to the lighter column, in order, so neither runs far past the other
  const [km, ka] = k.split()
  const main = []
  const side = []
  let load = [0, 0]
  for (const x of blocks) {
    const i = load[0] <= load[1] ? 0 : 1
    load[i] += x.weight
    ;(i === 0 ? main : side).push(x.draw(i === 0 ? km : ka))
  }
  return [head, km.layout(main, side)]
}

// How notifications reach you, whether the last one did, a test, and a way to reach your phone.
function notifyCard(k, d, act) {
  const n = d.notify || { at: 0, results: {} }
  const o = d.opts
  const NAMES = { claude: 'Claude Code', system: 'System', sound: 'Sound', phone: 'Phone' }
  const WORDS = { sent: 'Sent', bell: 'Bell only: this terminal shows no words', played: 'Played', unavailable: 'Not on this computer', failed: 'Failed', 'no-channel': 'No channel set in Claude Code', 'no-surface': 'Nothing to show it on', disabled: 'Turned off in Claude Code', refused: 'Refused' }
  const rows = Object.entries(n.results || {}).map(([key, v]) => {
    const isGood = v === 'sent' || v === 'played'
    return k.Text({ wrap: 'wrap', children: [k.text(isGood ? '✓ ' : '● ', isGood ? { color: 'success' } : { color: 'warning' }), k.text(NAMES[key] + '  ', { weight: 'medium' }), k.text(WORDS[v] || v, { size: 'footnote', dimColor: isGood ? true : undefined })] })
  })
  const isEditing = d.view.editing === 'notifyUrl'
  return k.card(
    'Notifications',
    'Claude Code’s own notifications show words only in iTerm2, Kitty and Ghostty; other terminals ring a bell and the desktop app shows none. ToBeBestMe also uses your computer’s notification centre, a sound, and, if you like, your phone.',
    [
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Notifications', { weight: 'medium' }), k.footnote('When a chat waits for you, a workflow needs your go-ahead or ends, or a limit gets close.'), k.segmented('opt-notifications', [{ value: true, label: 'On' }, { value: false, label: 'Off' }], o.notifications, (v) => act.setOption('notifications', v))] }),
      ...(o.notifications
        ? [
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Notify through', { weight: 'medium' }), k.segmented('opt-notifyVia', specOf('notifyVia').options, o.notifyVia, (v) => act.setOption('notifyVia', v))] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [
              k.text('Send to your phone too', { weight: 'medium' }),
              k.footnote(n.url && n.url !== 'invalid' ? 'Also sent to ' + n.url + '.' : 'Paste an ntfy topic address (https://ntfy.sh/your-topic) or any web hook that takes a POST; install the ntfy app and subscribe to the topic. Only the notification’s words are sent.'),
              ...(isEditing && k.Input
                ? [k.Box({ width: 48, children: [k.Input({ key: 'notify-url', placeholder: 'https://ntfy.sh/your-topic', value: o.notifyUrl || '', submitLabel: 'Save', autoFocus: true, onSubmit: (v) => act.saveNotifyUrl(v) })] }), k.buttons([k.button('notify-url-cancel', 'Cancel', () => act.setView({ editing: '' }))])]
                : [k.buttons([k.button('notify-url-edit', n.url ? 'Change address…' : 'Add an address…', () => act.setView({ editing: 'notifyUrl' }), { plain: true }), ...(n.url ? [k.button('notify-url-clear', 'Remove address', () => act.saveNotifyUrl(''), { dimColor: true })] : [])])]),
            ] }),
            k.buttons([k.button('notify-test', 'Send a test notification', act.testNotify)]),
            ...(rows.length ? [k.footnote('The last one, ' + ago(d.now - n.at) + ':'), ...rows] : []),
            ...(n.results && n.results.system === 'sent' && /mac|darwin/i.test(String(d.platform || 'mac')) ? [k.footnote('On a Mac, system notifications come from Script Editor; if none appears, allow Script Editor in System Settings › Notifications.')] : []),
          ]
        : []),
    ],
    { gap: 'md', keepCaption: true },
  )
}

// ---- All projects -----------------------------------------------------------------------------
// Every project on this computer, from Claude Code's own transcripts: what each used today and this
// week, the last 14 days, the plan limits they share, and what stands out. It works on every surface
// and covers sessions that never ran tobebestme; in the desktop app the open sessions follow.

function planHex(label) {
  if (/5-hour/i.test(label)) return RING_HEX.five_hour
  if (/all models|^weekly( limit)?$/i.test(label)) return RING_HEX.seven_day
  return RING_HEX.seven_day_opus
}

// How long ago, as a table says it: "just now", "12 min ago", "3 h ago", "yesterday", "4 days ago".
function ago(ms) {
  const min = Math.round(Math.max(0, ms) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return min + ' min ago'
  const h = Math.round(min / 60)
  if (h < 24) return h + ' h ago'
  const days = Math.round(h / 24)
  return days === 1 ? 'yesterday' : days + ' days ago'
}

function fmtCount(n) {
  try {
    return Number(n || 0).toLocaleString()
  } catch {
    return String(n || 0)
  }
}

function share(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

// "Today", "Yesterday", or the weekday and date further back: "Tue 14 Oct".
function dayWords(key, now) {
  const label = dayLabel(key, now)
  if (label === 'Today' || label === 'Yesterday') return label
  const [y, m, day] = key.split('-').map(Number)
  try {
    return label + ' ' + new Date(y, m - 1, day).toLocaleDateString([], { day: 'numeric', month: 'short' })
  } catch {
    return label + ' ' + day
  }
}

// A tile like a widget: a glyph in its colour, a name, the figure, what it means.
function widgetTile(k, key, w, i, count) {
  const perRow = k.columns >= 72 ? Math.min(4, count) : 2
  return k.tile(
    key,
    clean({
      flexDirection: 'column',
      rowGap: 'xs',
      width: perRow === 4 ? '24%' : perRow === 3 ? '32%' : '49%',
      paddingY: k.isTerminal ? undefined : 'xs',
    }),
    [
      k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [...(w.glyph ? [w.glyph] : []), w.onPress ? k.Button({ key: w.buttonKey, plain: true, onPress: w.onPress, children: [w.label + ' ›'] }) : k.text(w.label, { size: 'footnote', weight: 'medium' })] }),
      k.text(w.value, { size: 'title', weight: 'semibold', tabular: true, color: quiet(w.level), wrap: 'truncate-end' }),
      ...(w.runwayItem ? [runwayBar(k, w.runwayItem, 'tile')] : []),
      k.footnote(w.sub),
      ...(w.note ? [k.text(w.note, { size: 'footnote', weight: 'medium', color: quiet(w.level) })] : []),
    ],
    w.tip ? { ...w.tip, align: i < count / 2 ? 'right' : 'left' } : null, // on the far side, so this tile stays in view
  )
}

// What a project's row says on hover: where it is, its days, sessions, models and helpers.
function projectTip(p, now) {
  const read = p.tokens.input + p.tokens.cacheRead + p.tokens.cacheWrite
  const models = p.models
    .slice(0, 3)
    .map(([m, usd]) => modelName(m) + ' ' + share(usd, p.week) + '%')
    .join(', ')
  return {
    title: p.name,
    lines: [
      p.path ? p.path.replace(/^\/Users\/[^/]+/, '~') : '',
      'Today ' + cost(p.today) + ' · past 7 days ' + cost(p.week) + (SHARE ? '' : ' · 14 days ' + cost(p.total)) + '.',
      plural(p.sessionsWeek, 'session', 'sessions') + ' this week' + (p.worktrees ? ', ' + plural(p.worktrees, 'worktree', 'worktrees') + ' included' : '') + '. Last answer ' + ago(now - p.lastAt) + '.',
      models ? 'Models this week: ' + models + '.' : '',
      p.helpers + p.workflows > 0 ? 'Helpers and workflow agents: ' + share(p.helpers + p.workflows, p.week) + '% of it.' : '',
      read ? 'Reused from cache: ' + share(p.tokens.cacheRead, read) + '% of what was read.' : '',
    ],
  }
}

// ---- Home: what waits for you, and where each project got to ---------------------------------
// The day's first question across several projects is "which of them needs me?", then "where
// was I?". Waiting chats come first, each with its own answer buttons; then the latest session
// of each recent project, with what it last said; the figures follow.

const NEED_WORDS = {
  permission: ['Needs your permission', 'error'],
  ask: ['Waiting for your answer', 'warning'],
  question: ['Asked you a question', 'warning'],
  plan: ['Plan to approve', 'warning'],
  error: ['Stopped', 'error'],
  pr: ['Pull request open', 'info'],
}

function needWords(x) {
  if (x.kind === 'error' && x.hasReset) return ['Ready to carry on', 'info']
  if (x.kind === 'error' && x.resetsAt) return ['Stopped at a usage limit', 'error']
  return NEED_WORDS[x.kind] || ['Waiting', 'info']
}

function whereRan(entry) {
  return entry === 'desktop' ? 'Claude app' : entry === 'terminal' ? 'Terminal' : entry === 'editor' ? 'Editor' : ''
}

// The runway of the tightest limit, as the item the runway drawing takes.
function tightestItem(d, tightest, h) {
  const kind = /5|hour/i.test(tightest.label) ? 'five_hour' : 'seven_day'
  const runway = runwayOf(kind, tightest.pct, tightest.resetsAt, d.now)
  const window = windowOf(kind, runway, tightest.resetsAt, d.now)
  const focus = (d.view && d.view.project) || ''
  const days = h ? weekDays(h, window, focus) : null
  return {
    // the same days with every project in its colour, for the legend and the picked day's words
    plainDays: focus && h ? weekDays(h, window) : days,
    runway,
    hex: tint(planHex(tightest.label), h ? h.levelOf(tightest.pct) : 'success'),
    label: tightest.label,
    valueText: Math.round(tightest.pct) + '%',
    window,
    days,
    // what the bars say, for a reader that cannot see them
    daysAlt: days ? '. Use by day: ' + days.filter((x) => x.total > 0).map((x) => x.name + ' ' + cost(x.total)).join(', ') + '.' : '',
  }
}

// What the calendar view of a runway needs beyond the runway itself: the window's ends and the words
// over its posts.
function windowOf(kind, runway, resetsAt, now) {
  if (!resetsAt) return null
  const span = WINDOW_MS[kind]
  const start = resetsAt - span
  return {
    startMs: start,
    endMs: resetsAt,
    unit: kind === 'five_hour' ? 'hour' : 'day',
    nowLabel: 'Now',
    runLabel: runway.runOut !== null && runway.runOut !== undefined ? 'Runs out ' + fmtClock(start + (runway.runOut / 100) * span, now) : '',
    endLabel: 'Resets ' + fmtClock(resetsAt, now),
  }
}

// The day's answer: the date, how many chats wait for you, and how much room is left, with the
// tightest limit drawn full width beneath, so where you stand reads at a glance.
function homeHero(k, d, h, act) {
  const { w, tightest } = h
  const chats = w.needs.filter((x) => x.kind !== 'pr').length
  const prs = w.needs.length - chats
  let date = ''
  try {
    date = new Date(d.now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    date = dayKey(d.now)
  }
  const headline = chats ? (chats === 1 ? 'One chat is waiting for you' : chats + ' chats are waiting for you') : prs ? (prs === 1 ? 'One pull request is waiting for review' : prs + ' pull requests are waiting for review') : 'Nothing is waiting for you'
  const u = d.usage
  const facts = []
  if (u && !u.isEmpty) facts.push('Today, in every session: ' + (SHARE ? ofLimit(cost(u.today.usd)) : fmtUsd(u.today.usd) + ' of work') + ', across ' + plural(u.today.projects, 'project', 'projects') + ' and ' + plural(u.today.sessions, 'session', 'sessions'))
  if (!chats && w.pickup.length) facts.push('Pick up where you left off below')
  const factsTip = u && !u.isEmpty ? { title: 'Today, in every project', lines: ['What today’s answers would cost at list prices, helpers and workflow agents included.', 'On a plan the limits are what you spend; this shows how heavy the work was.'] } : null
  const item = h.item
  const early = !!item && item.runway.runOut !== null && item.runway.runOut !== undefined
  // the projects the bars are made of, most used first, each in its colour; each one picks itself out
  const made = {}
  for (const day of (k.hasSvg && item && item.plainDays) || []) for (const p of day.parts) made[p.key] = { name: p.name, hex: p.hex, value: ((made[p.key] && made[p.key].value) || 0) + p.value }
  const legend = Object.entries(made).sort((a, z) => (a[0] === '') - (z[0] === '') || z[1].value - a[1].value)
  const picked = d.view.project || ''
  const legendItem = ([key, x]) =>
    k.Box({
      flexDirection: 'row',
      columnGap: 'xs',
      alignItems: 'center',
      children: [
        k.text('●', { color: midHex(x.hex) }),
        // other projects together are not one project to pick
        key ? k.button('legend-' + key, (key === picked ? '✓ ' : '') + x.name, () => act.setView({ project: key === picked ? '' : key }), key === picked ? {} : { plain: true, dimColor: true }) : k.footnote(x.name),
      ],
    })
  const level = tightest ? (tightest.pct >= Math.max(90, d.opts.limitAlertAt) ? 'error' : tightest.pct >= d.opts.limitAlertAt ? 'warning' : 'success') : 'success'
  const kind = tightest ? (/5|hour/i.test(tightest.label) ? 'five_hour' : 'seven_day') : 'seven_day'
  const pace = item ? paceWords(kind, item.runway, tightest.resetsAt, d.now) : ''
  const isWide = k.columns >= 90
  // what needs you, and beside it (under it, on a narrow pane) where you stand: one big figure
  const words = k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    flexGrow: 1,
    flexShrink: 1,
    children: [
      k.footnote(date, { wrap: 'truncate-end' }),
      k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [k.text(chats ? '● ' : '✓ ', chats ? { color: 'warning' } : { color: 'success' }), k.text(headline, { size: 'title', weight: 'semibold', wrap: 'wrap' })] }),
      ...(facts.length ? [factsTip ? k.hoverBox('all-facts', { flexDirection: 'column' }, [k.text(facts.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })], { ...factsTip, align: 'left' }) : k.text(facts.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })] : []),
    ],
  })
  const figure = item
    ? k.Box({
        flexDirection: 'column',
        alignItems: isWide ? 'flex-end' : 'flex-start',
        flexShrink: 0,
        ...(isWide ? { paddingLeft: 'lg' } : { paddingTop: 'xs' }),
        children: [
          heroFigure(k, Math.round(tightest.pct) + '%', { size: 52, level, hues: TAB_HUES.all }) || k.text(Math.round(tightest.pct) + '%', { size: 'title', weight: 'semibold', tabular: true, color: quiet(level) }),
          k.footnote('of your ' + limitPhrase(tightest.label) + (level === 'error' ? ' · nearly out' : level === 'warning' ? ' · past your alert' : ''), { wrap: 'truncate-end', ...(level === 'success' ? {} : { color: level, dimColor: undefined }) }),
        ],
      })
    : null
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    paddingX: k.isTerminal ? 1 : 'xs',
    children: [
      isWide ? k.Box({ flexDirection: 'row', alignItems: 'flex-end', width: '100%', children: [words, ...(figure ? [figure] : [])] }) : k.Box({ flexDirection: 'column', children: [words, ...(figure ? [figure] : [])] }),
      ...(item
        ? [
            k.Box({
              flexDirection: 'column',
              rowGap: 'xs',
              marginTop: 'sm',
              children: [
                ...(item.days && k.hasSvg ? heroCalendar(k, d, h, act) : [runwayBar(k, item, 'hero', k.px - 8)]),
                // the limit's name, how much is used and the projects in the bars: one row, whose card
                // rises above it, so the legend, wrapped on a narrow pane, never covers it
                k.hoverBox(
                  'all-limit-name',
                  { flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', rowGap: 'xs', alignItems: 'center' },
                  [
                    k.Button({ key: 'all-limits', plain: true, onPress: () => act.setView({ tab: 'usage', confirm: '' }), children: [tightest.label + ' ›'] }),
                    ...(pace ? [k.Box({ flexShrink: 1, children: [k.text(pace, { size: 'footnote', wrap: 'wrap', ...(early ? { color: 'warning' } : { dimColor: true }) })] })] : []),
                    k.Box({ flexGrow: 1 }),
                    ...(k.hasSvg && item.window ? [] : [k.footnote(tightest.resetsAt ? 'resets in ' + fmtSpan(tightest.resetsAt - d.now) : '', { tabular: true, wrap: 'truncate-end' })]),
                    ...(legend.length ? [k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'xs', flexShrink: 1, children: legend.map(legendItem) })] : []),
                  ],
                  { title: tightest.label, lines: [tightest.resetsAt ? 'Resets ' + fmtClock(tightest.resetsAt, d.now) + '.' : '', (h.plan.source === 'app' ? (h.plan.plan ? h.plan.plan + ' plan. ' : '') : h.plan.source === 'session' ? 'From this session’s latest reading. ' : 'As read ' + ago(d.now - h.plan.at) + ' by another session. ') + 'Every project draws on the same limits.', legend.length ? 'The bars under it are each day’s work, by project.' : '', 'Press its name for every limit on Usage.'], align: 'left' },
                ),
                ...heroDetail(k, d, h, act),
                // the other limits get their own space under the legend, so they never run into its line
                ...h.windows.filter((x) => x !== tightest).map((x, i) => k.Box({ width: '100%', marginTop: i === 0 ? 'md' : undefined, children: [limitRow(k, d, h, x, i)] })),
                ...(h.plan.source === 'app' && h.f.plan && h.f.plan.extraUsage ? [k.footnote('Extra usage is ' + (h.f.plan.extraUsage.enabled ? 'on, so work carries on past a limit and is billed.' : 'off, so work pauses at a limit until it resets.'))] : []),
              ],
            }),
          ]
        : []),
    ],
  })
}

// The hero's calendar on desktop: the drawing at its column's own width, and under it a button per
// A limit's name as a phrase: "Weekly · all models" reads "weekly limit, all models", "Weekly · Fable"
// reads "Fable weekly limit", and "5-hour limit" stays as it is.
function limitPhrase(label) {
  const m = /^(.*?) · (.*)$/.exec(String(label || ''))
  if (!m) return String(label || '').toLowerCase()
  const base = m[1].toLowerCase().replace(/ limit$/, '') + ' limit'
  return /^all models$/i.test(m[2]) ? base + ', all models' : m[2] + ' ' + base
}

// day, laid out by the same fractions of the window so each sits under its column. A day pressed is
// picked out (the others step back), its words show below, and Projects shows that day. Days to
// come, and a sliver of a day too narrow for its name, are not pressable.
function heroCalendar(k, d, h, act) {
  const it = h.item
  const r = it.runway
  // the app draws an interactive drawing at the width it is given in pixels (none means the browser's
  // 300px default), so the calendar names its width and the day buttons share one box with it
  const W = Math.round(k.px - 8)
  const picked = it.days.findIndex((x) => x.key === d.view.day)
  const src = svgWindow({ ...r, hex: it.hex, ...it.window, days: it.days, picked }, { width: W, isFluid: true })
  const H = Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(src)[1])
  const words = it.label + ' ' + it.valueText + (r.runOut !== null && r.runOut !== undefined ? ', runs out before it resets' : '') + (it.daysAlt || '')
  const span = Math.max(1, it.window.endMs - it.window.startMs)
  const columns = it.days.map((x) => {
    const frac = (x.endMs - x.startMs) / span
    const room = frac * W
    const isPicked = x.key === d.view.day
    const label = x.isToday && room >= 56 ? 'Today' : x.short
    const kid =
      room < 34 ? []
      : x.total > 0 ? [k.button('day-' + x.key, label, () => act.setView({ day: isPicked ? '' : x.key }), isPicked ? {} : { plain: true, dimColor: x.isToday ? undefined : true })]
      : [k.footnote(label, { wrap: 'truncate-end' })]
    // from no width, each column grows by its day's share of the window: exactly its share of the row
    return k.Box({ width: 0, flexGrow: Math.round(frac * 100000) / 1000, flexShrink: 0, justifyContent: 'center', alignItems: 'center', children: kid })
  })
  return [k.Box({ flexDirection: 'column', alignSelf: 'flex-start', children: [k.Svg({ source: src, alt: words, width: W, height: H, isInteractive: true }), k.Box({ flexDirection: 'row', width: '100%', alignItems: 'center', children: columns })] })]
}

// What a picked day or project held: its share (or cost), the projects in it, and the way back.
function heroDetail(k, d, h, act) {
  const it = h.item
  if (!it || !it.days || !k.hasSvg) return []
  const day = it.plainDays.find((x) => x.key === d.view.day && x.total > 0) || null
  const p = d.view.project ? h.u.projects.find((x) => x.key === d.view.project) : null
  if (!day && !p) return []
  const at = Object.create(null)
  h.u.keys.forEach((key, i) => (at[key] = i))
  // a project's use on a day, from the hour the window opened on its first day
  const of = (x, key) => {
    if (at[key] === undefined) return 0
    const first = it.plainDays.find((y) => y.key === key)
    return (x.days[at[key]] || 0) * (first && first.clip ? first.clip(x) : 1)
  }
  const kids = []
  if (day && p) {
    kids.push(k.text(p.name + ' on ' + day.name, { weight: 'semibold' }), k.text(ofLimit(cost(of(p, day.key))), { tabular: true }))
  } else if (day) {
    kids.push(k.text(day.name, { weight: 'semibold' }), k.text(ofLimit(cost(day.total)), { tabular: true }))
    for (const x of [...day.parts].sort((a, z) => z.value - a.value).slice(0, 4)) kids.push(k.Text({ children: [k.text('● ', { color: midHex(x.hex) }), k.text(x.name + ' ' + cost(x.value), { size: 'footnote', dimColor: true, tabular: true })] }))
  } else {
    const per = it.plainDays.map((x) => ({ x, v: of(p, x.key) }))
    const total = per.reduce((n, y) => n + y.v, 0)
    const best = per.reduce((a, z) => (z.v > a.v ? z : a), per[0])
    kids.push(k.text(p.name + ' this week', { weight: 'semibold' }), k.text(ofLimit(cost(total)), { tabular: true }))
    if (best && best.v > 0) kids.push(k.footnote('most on ' + best.x.name + ', ' + cost(best.v), { tabular: true }))
  }
  const back = [
    ...(day ? [k.button('pick-week', 'Show the whole week', () => act.setView({ day: '' }), { dimColor: true })] : []),
    ...(p ? [k.button('pick-all', 'Show every project', () => act.setView({ project: '' }), { dimColor: true })] : []),
  ]
  return [k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', rowGap: 'xs', alignItems: 'center', paddingY: 'xs', children: [...kids, k.Box({ flexGrow: 1 }), k.buttons(back)] })]
}

// Another limit under the hero's calendar: its name, its runway, how much is used and when it resets.
// Each limit keeps its own colour; amber or red take over when it runs low.
function limitRow(k, d, h, x, i) {
  const { now, plan, levelOf } = h
  const level = levelOf(x.pct)
  const kind = /5|hour/i.test(x.label) ? 'five_hour' : 'seven_day'
  const runway = runwayOf(kind, x.pct, x.resetsAt, now)
  const hex = level === 'success' ? planHex(x.label) : HEX[level]
  const where = plan.source === 'app' ? (plan.plan ? plan.plan + ' plan. ' : '') : plan.source === 'session' ? 'From this session’s latest reading. ' : 'As read ' + ago(now - plan.at) + ' by another session. '
  const isRoomy = k.columns >= 64
  // where it runs out when that is early enough to matter, else when it resets
  const runOutAt = x.resetsAt && runway.runOut !== null && runway.runOut !== undefined ? x.resetsAt - WINDOW_MS[kind] + (runway.runOut / 100) * WINDOW_MS[kind] : 0
  return k.hoverBox('plan-' + i, { flexDirection: 'row', columnGap: 'md', alignItems: 'center', width: '100%' }, [
    k.Box({ width: isRoomy ? 24 : 16, flexShrink: 0, children: [k.Text({ wrap: 'truncate-end', children: [k.text('● ', { color: k.isTerminal ? (level === 'success' ? 'suggestion' : level) : midHex(hex) }), k.text(x.label)] })] }),
    k.Box({ flexGrow: 1, flexShrink: 1, children: [runwayBar(k, { runway, hex, label: x.label, valueText: Math.round(x.pct) + '%' }, 'tile')] }),
    k.Box({ width: 5, flexShrink: 0, justifyContent: 'flex-end', children: [k.text(Math.round(x.pct) + '%', { tabular: true, weight: 'semibold', color: quiet(level) })] }),
    ...(isRoomy ? [k.Box({ width: 22, flexShrink: 0, justifyContent: 'flex-end', children: [k.footnote(runOutAt ? 'runs out ' + fmtClock(runOutAt, now) : x.resetsAt ? 'resets in ' + fmtSpan(x.resetsAt - now) : '', { tabular: true, wrap: 'truncate-end', ...(runOutAt ? { color: 'warning', dimColor: undefined } : {}) })] })] : []),
  ], { title: x.label + ', ' + Math.round(x.pct) + '% used', lines: [x.resetsAt ? 'Resets ' + fmtClock(x.resetsAt, now) + '.' : '', where + 'Every project draws on the same limits.'] })
}

function canAnswer(w, x) {
  return w.canReply && !!x.deskId && x.kind !== 'pr' && x.kind !== 'permission'
}

// One waiting chat: what it is, its words, and the ways to answer it. The first chat you can
// answer from here carries the view's one primary button.
function needRow(k, d, act, w, x, i, isFirst, isOpen = true) {
  const [label, level] = needWords(x)
  const c = d.view.confirm || ''
  const asking = c.startsWith('reply:' + x.key + ':') ? Number(c.slice(('reply:' + x.key + ':').length)) : -1
  const pending = asking >= 0 ? (asking < x.replies.length ? x.replies[asking].message || x.replies[asking].label : 'Carry on where you left off.') : ''
  const isTyping = d.view.replying === x.key
  const canSend = canAnswer(w, x)
  const where = whereRan(x.entry)
  const meta = [x.project, x.branch ? x.branch.replace(/^claude\//, '') : '', where, ago(d.now - x.at)].filter(Boolean).join(' · ')
  const buttons = []
  if (canSend && asking < 0 && !isTyping) {
    x.replies.forEach((r, j) => buttons.push(k.button('need-' + i + '-r' + j, r.label, () => act.setView({ confirm: 'reply:' + x.key + ':' + j, replying: '' }), { variant: isFirst && j === 0 ? 'primary' : undefined })))
    if (x.kind === 'error' && x.hasReset) buttons.push(k.button('need-' + i + '-go', 'Tell it to carry on', () => act.setView({ confirm: 'reply:' + x.key + ':' + x.replies.length, replying: '' }), { variant: isFirst ? 'primary' : undefined }))
    buttons.push(k.button('need-' + i + '-type', x.kind === 'plan' ? 'Answer…' : 'Reply…', () => act.setView({ replying: x.key, confirm: '' }), { variant: isFirst && !x.replies.length && !(x.kind === 'error' && x.hasReset) ? 'primary' : undefined }))
  }
  if (x.prUrl && k.Link) buttons.push(k.Link({ href: x.prUrl, label: 'Open pull request #' + x.prNumber }))
  // a session running now, or one whose work is a pull request, isn't carried on from a terminal
  if (x.sid && !x.isLive && x.kind !== 'pr' && asking < 0 && !isTyping) buttons.push(k.button('need-' + i + '-copy', 'Copy resume command', (ev) => act.copyResume(x, ev && ev.surface), { plain: true, dimColor: true }))
  if (asking < 0 && !isTyping) buttons.push(k.button('need-' + i + '-later', 'Set aside', () => act.dismissNeed(x), { plain: true, dimColor: true }))
  if (asking < 0 && !isTyping && i > 0 && !isFirst) buttons.push(k.button('need-' + i + '-close', 'Hide options', () => act.setView({ openNeed: '' }), { plain: true, dimColor: true }))
  const how = canSend ? '' : x.kind === 'permission' ? 'Switch to that session to allow or deny it.' : x.kind === 'pr' ? '' : x.entry === 'terminal' || !w.canReply ? 'Carry it on in a terminal with the resume command.' : 'Open it from the sidebar to answer.'
  const isWide = k.columns >= 64
  // the label already says "permission"; its words start at what is being asked
  const needText = x.kind === 'permission' && x.text ? x.text.replace(/^(needs )?(your )?permission to /i, '').replace(/^./, (c) => c.toUpperCase()) : x.text || ''
  const dotLevel = level === 'info' ? { dimColor: true } : { color: level }
  const column = [
    // who it is, with where and when beside it; on a narrow pane the where and when drop below
    k.Box({
      flexDirection: 'row',
      columnGap: 'md',
      alignItems: 'center',
      children: [k.Box({ flexGrow: 1, flexShrink: 1, children: [k.text(x.title, { weight: 'semibold', wrap: 'truncate-end' })] }), ...(isWide && meta ? [k.Box({ flexShrink: 1, children: [k.footnote(meta, { wrap: 'truncate-end' })] })] : [])],
    }),
    ...(!isWide && meta ? [k.footnote(meta, { wrap: 'truncate-end' })] : []),
    // what it is waiting for, the kind first and in its colour
    ...(isWide || !needText
      ? [k.Text({ wrap: 'wrap', children: [k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) }), ...(needText ? [k.text('   ' + needText)] : [])] })]
      : [k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) }), k.text(needText, { wrap: 'wrap' })]),
    ...(x.hasReset && x.said ? [k.footnote('It said: ' + x.said)] : []),
    ...(x.recap ? [k.footnote('Last: ' + x.recap)] : []),
    ...(how ? [k.guide(how)] : []),
    ...(asking >= 0
      ? [
          k.Box({
            flexDirection: 'column',
            rowGap: 'sm',
            marginTop: 'xs',
            children: [
              k.text('Send this to “' + x.title + '”?', { weight: 'medium', wrap: 'wrap' }),
              k.Box({ paddingX: k.isTerminal ? 1 : 'md', paddingY: k.isTerminal ? undefined : 'sm', borderStyle: 'round', borderDimColor: true, children: [k.text(pending, { wrap: 'wrap' })] }),
              k.buttons([k.button('reply-go', 'Send reply', () => act.sendReply(x, pending), { variant: 'primary' }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })]),
            ],
          }),
        ]
      : []),
    ...(isTyping && k.Input
      ? [
          k.Box({
            flexDirection: 'column',
            rowGap: 'sm',
            marginTop: 'xs',
            children: [
              k.Input({ key: 'need-' + i + '-input', placeholder: 'Your answer to “' + x.title + '”', submitLabel: 'Send', rows: 2, autoFocus: true, onSubmit: (value) => act.sendReply(x, value) }),
              k.Box({ flexDirection: 'row', columnGap: 'md', alignItems: 'center', flexWrap: 'wrap', children: [k.buttons([k.button('reply-cancel', 'Cancel', () => act.setView({ replying: '' }))]), k.footnote('Return sends it to that session.')] }),
            ],
          }),
        ]
      : []),
    ...(buttons.length ? [k.Box({ marginTop: 'xs', children: [k.buttons(buttons)] })] : []),
  ]
  // the most pressing chat is drawn whole; the others are one line each until opened
  if (!isOpen && asking < 0 && !isTyping) {
    const brief = [column[0], ...(!isWide && meta ? [column[1]] : []), k.Text({ wrap: isWide ? 'truncate-end' : 'wrap', children: [k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) }), ...(needText ? [k.text('   ' + needText, { dimColor: true })] : [])] })]
    return k.hoverBox('need-' + i, { flexDirection: 'column', width: '100%' }, [k.hang(k.text('●', dotLevel), k.Box({ flexDirection: 'column', rowGap: 'xs', flexGrow: 1, flexShrink: 1, children: [...brief, k.Box({ children: [k.button('need-' + i + '-open', 'Show options', () => act.setView({ openNeed: x.key }), { plain: true, dimColor: true })] })] }))], { title: x.title, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : ''] })
  }
  return k.hoverBox(
    'need-' + i,
    { flexDirection: 'column', width: '100%' },
    [k.hang(k.text('●', dotLevel), k.Box({ flexDirection: 'column', rowGap: 'xs', flexGrow: 1, flexShrink: 1, children: column }))],
    { title: x.title, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '', x.sid ? 'Copy resume command carries it on in any terminal, from its own folder.' : ''] },
  )
}

function needsCard(k, d, act, w) {
  if (!w.needs.length) return null
  const shown = d.view.showAllNeeds ? w.needs : w.needs.slice(0, 5)
  const more = w.needs.length - shown.length
  const first = shown.find((x) => canAnswer(w, x))
  return k.card(
    'Needs you',
    'Chats that stopped for you, the most pressing first.' + (w.canReply ? ' Answers go straight to that session.' : ''),
    [
      ...shown.map((x, i) => needRow(k, d, act, w, x, i, x === first, i === 0 || x === first || d.view.openNeed === x.key)),
      ...(w.needs.length > 5 ? [k.buttons([k.button('needs-more', more > 0 ? 'Show ' + more + ' more' : 'Show fewer', act.toggleNeeds, { dimColor: true })])] : []),
    ],
    { gap: 'lg' },
  )
}

// What a session last said, short enough to take in at a glance: code and pasted scripts are left
// out, since a prompt that pastes a script reads as noise here, and the rest is cut at a word.
function brief(said, max = 180) {
  let t = String(said || '').replace(/```[\s\S]*?(```|$)/g, ' ').replace(/\s+/g, ' ').trim()
  const code = t.search(/(\bexport |\bconst |\bimport |\bfunction |=>|\{\s*["'\w]+\s*:|<\/?[a-z][\w-]*>)/)
  if (code > 24) t = t.slice(0, code).replace(/[\s:;,.-]+$/, '') + '…'
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
  return t
}

// Where each recent project got to: its last session's title, what it last said, and how to carry on.
function pickupCard(k, d, act, w, h) {
  if (!w.pickup.length) return null
  const byName = Object.create(null)
  for (const p of (h && h.has && h.u.projects) || []) byName[p.name] = p.key
  const rows = w.pickup.map((x, i) => {
    const isTyping = d.view.replying === 'pick:' + x.key
    const canSend = w.canReply && !!x.deskId
    const said = x.recap || (x.asked ? 'You asked: ' + x.asked : '')
    const meta = [x.branch ? x.branch.replace(/^claude\//, '') : '', x.prNumber ? 'PR #' + x.prNumber : '', whereRan(x.entry)].filter(Boolean).join(' · ')
    const loose = x.git ? [x.git.changed ? plural(x.git.changed, 'file', 'files') + ' changed, not committed' : '', x.git.ahead ? plural(x.git.ahead, 'commit', 'commits') + ' not pushed' : ''].filter(Boolean).join(' · ') : ''
    // the latest session is drawn whole; the others are a line each until opened, as Needs you does
    const isOpen = i === 0 || isTyping || d.view.openPick === x.key
    if (!isOpen) {
      return k.hoverBox(
        'pick-' + i,
        { flexDirection: 'column', rowGap: 'xs', width: '100%' },
        [
          k.Box({
            flexDirection: 'row',
            columnGap: 'sm',
            alignItems: 'center',
            children: [
              k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Text({ wrap: 'truncate-end', children: [...(k.isTerminal || !h ? [] : [k.text('● ', { color: midHex(hueOf(h, byName[x.project])) })]), k.text(x.project, { weight: 'semibold' }), ...(x.title ? [k.text('  ' + x.title, { dimColor: true })] : [])] })] }),
              x.isRunning ? k.footnote('working now', { color: 'success', dimColor: undefined, wrap: 'truncate-end' }) : k.footnote(ago(d.now - x.at), { wrap: 'truncate-end' }),
              k.button('pick-' + i + '-open', 'Show details', () => act.setView({ openPick: x.key }), { plain: true, dimColor: true }),
            ],
          }),
          ...(loose ? [k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [k.text('● ', { color: 'warning' }), k.text(loose, { size: 'footnote', weight: 'medium', wrap: 'truncate-end' })] })] : []),
        ],
        { title: x.title || x.project, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Last answer ' + ago(d.now - x.at) + '.'] },
      )
    }
    const buttons = []
    if (!isTyping) {
      if (canSend) buttons.push(k.button('pick-' + i + '-type', 'Tell it what’s next…', () => act.setView({ replying: 'pick:' + x.key, confirm: '' })))
      // a session working now carries on by itself; a second copy of it in a terminal would compete
      if (!x.isRunning) buttons.push(k.button('pick-' + i + '-copy', 'Copy resume command', (ev) => act.copyResume(x, ev && ev.surface), { plain: true, dimColor: true }))
      if (i > 0) buttons.push(k.button('pick-' + i + '-close', 'Hide details', () => act.setView({ openPick: '' }), { plain: true, dimColor: true }))
    }
    return k.hoverBox(
      'pick-' + i,
      { flexDirection: 'column', rowGap: 'xs', width: '100%' },
      [
        k.Box({
          flexDirection: 'row',
          columnGap: 'sm',
          alignItems: 'center',
          children: [
            k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Text({ wrap: 'truncate-end', children: [...(k.isTerminal || !h ? [] : [k.text('● ', { color: midHex(hueOf(h, byName[x.project])) })]), k.text(x.project, { weight: 'semibold' })] })] }),
            x.isRunning
              ? k.Box({ flexDirection: 'row', columnGap: 'xs', alignItems: 'center', flexShrink: 0, children: [k.live(HEX.success, 'success', 'Working now'), k.footnote('working now', { color: 'success', dimColor: undefined })] })
              : k.footnote(ago(d.now - x.at), { wrap: 'truncate-end' }),
          ],
        }),
        ...(x.title ? [k.text(x.title, { weight: 'medium', wrap: 'truncate-end' })] : []),
        ...(said ? [k.footnote(brief(said))] : []),
        ...(meta ? [k.footnote(meta, { wrap: 'truncate-end' })] : []),
        ...(loose ? [k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [k.text('● ', { color: 'warning' }), k.text(loose, { size: 'footnote', weight: 'medium', wrap: 'wrap' })] })] : []),
        ...(isTyping && k.Input
          ? [
              k.Box({
                flexDirection: 'column',
                rowGap: 'sm',
                children: [
                  k.Input({ key: 'pick-' + i + '-input', placeholder: 'What should “' + (x.title || x.project) + '” do next?', submitLabel: 'Send', rows: 2, autoFocus: true, onSubmit: (value) => act.sendReply({ ...x, title: x.title || x.project, key: 'pick:' + x.key }, value) }),
                  k.Box({ flexDirection: 'row', columnGap: 'md', alignItems: 'center', flexWrap: 'wrap', children: [k.buttons([k.button('reply-cancel', 'Cancel', () => act.setView({ replying: '' }))]), k.footnote('Return sends it to that session.')] }),
                ],
              }),
            ]
          : []),
        ...(buttons.length ? [k.buttons(buttons)] : []),
      ],
      { title: x.title || x.project, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Last answer ' + ago(d.now - x.at) + '.'] },
    )
  })
  return k.card('Pick up where you left off', 'The latest session in each project you worked on this week, with the last thing it told you.', rows, { gap: 'lg' })
}

// ---- workflows: the orchestrator --------------------------------------------------------------

const AGENT_STATE = {
  running: ['●', 'suggestion', 'Working'],
  queued: ['○', undefined, 'Starting'],
  held: ['‖', 'warning', 'Waiting'],
  done: ['✓', 'success', 'Done'],
  failed: ['✕', 'error', 'Failed'],
  stopped: ['■', undefined, 'Stopped'],
}

const RUN_END = { completed: ['✓', 'success', 'Finished'], killed: ['■', 'warning', 'Stopped'], failed: ['✕', 'error', 'Failed'], stopping: ['■', 'warning', 'Stopping'] }

function modelWords(m) {
  return m ? modelName(m) : ''
}

// The stages of a run in order, each with how far it got: ✓ done, ● under way, ○ not started.
function stageLine(k, p) {
  if (!p.phases.length) return null
  const parts = []
  p.phases.forEach((ph, i) => {
    const isDone = ph.total > 0 && ph.done + ph.failed === ph.total && !ph.running
    const isNow = !isDone && (ph.running > 0 || (p.current && p.current.title === ph.title))
    const glyph = isDone ? '✓ ' : isNow ? '● ' : '○ '
    if (i) parts.push(k.text('  →  ', { dimColor: true }))
    parts.push(k.text(glyph, isDone ? { color: 'success' } : isNow ? { color: 'suggestion' } : { dimColor: true }))
    parts.push(k.text(ph.title, { weight: isNow ? 'semibold' : undefined, dimColor: !isDone && !isNow ? true : undefined }))
    if (ph.total) parts.push(k.text(' ' + ph.done + '/' + ph.total, { tabular: true, dimColor: true }))
  })
  return k.Text({ wrap: 'wrap', children: parts })
}

// One agent: what state it is in and why, what it is doing this moment, its model, time and cost.
function agentRow(k, d, a, key) {
  const [glyph, color, word] = AGENT_STATE[a.state] || AGENT_STATE.queued
  const why = a.state === 'held' ? (a.heldFor === 'paused' ? 'waiting: the run is paused' : a.heldFor === 'budget' ? 'waiting: the run reached its spending limit' : 'waiting: at the run’s limit') : a.state === 'failed' && a.error ? a.error : a.doing || ''
  const since = a.state === 'running' && a.startedAt ? fmtSpan(d.now - a.startedAt) : a.ms ? fmtSpan(a.ms) : ''
  const tip = {
    title: a.label,
    lines: [
      word + (a.phase ? ' · ' + a.phase : '') + (a.model ? ' · ' + modelWords(a.model) : ''),
      a.requests ? plural(a.requests, 'step', 'steps') + ', ' + fmtTokens(a.input) + ' tokens read, ' + fmtTokens(a.output) + ' written' : '',
      a.state === 'held' ? 'It starts by itself once the run may start another agent.' : '',
    ],
  }
  return k.row(
    [
      { parts: [k.text(glyph + ' ', color ? { color } : { dimColor: true }), k.text(a.label, { weight: a.state === 'running' ? 'medium' : undefined }), ...(why ? [k.text('  ' + why, { dimColor: true, color: a.state === 'held' ? 'warning' : a.state === 'failed' ? 'error' : undefined })] : [])] },
      ...(k.columns >= 70 ? [{ text: a.model ? modelWords(a.model) : '', width: 12, props: { dimColor: true } }] : []),
      { text: since, width: 15, props: { dimColor: true } },
      { text: a.usd ? cost(a.usd) : '', width: 9 },
    ],
    {},
    { key, tip },
  )
}

// The go-ahead a workflow waits for when Ask me first is on: what it will do, how big it is likely
// to be, what could make it cheaper, and the answer.
function approvalCard(k, d, act, isHome = false) {
  const a = d.flows && d.flows.approval
  if (!a) return null
  const p = a.preview
  const e = a.estimate || {}
  const facts = []
  if (p.phases.length) facts.push(plural(p.phases.length, 'stage', 'stages') + ': ' + p.phases.join(' → '))
  const share = d.flows.share
  if (e.isSameWorkflow) facts.push('About ' + plural(e.agents, 'agent', 'agents') + ', as in its last ' + (e.basis === 1 ? 'run' : e.basis + ' runs'))
  else if (e.agents) facts.push(e.isFanOut ? 'At least ' + plural(e.agents, 'agent', 'agents') + ', and more: one stage starts an agent per item' : 'About ' + plural(e.agents, 'agent', 'agents'))
  if (e.basis && e.high > 0) facts.push('Likely ' + cost(e.low) + '–' + cost(e.high) + (SHARE ? ' of your weekly limit' : share ? ' (' + shareWords(e.high, share) + ' at most)' : '') + (e.isSameWorkflow ? ', going by what it cost before' : ', from what agents cost in ' + plural(e.basis, 'finished run', 'finished runs')))
  if (d.opts.workflowBudget > 0) facts.push('New agents wait once it costs ' + fmtUsd(d.opts.workflowBudget) + ', your limit for every run')
  if (p.models.length) facts.push('Models it names: ' + p.models.map(titleCase).join(', '))
  const tips = a.tips || []
  return k.card(
    'Claude wants to run ' + (p.name ? '“' + p.name + '”' : 'a workflow'),
    p.description || 'A workflow starts several agents, often in stages, each working on one part.',
    [
      ...facts.map((f) => k.hang(k.text('·', { dimColor: true }), k.text(f, { wrap: 'wrap' }))),
      ...tips.map((t) => k.hang(k.text('●', { color: 'warning' }), k.text(t, { wrap: 'wrap' }))),
      k.hang(k.text('›', { dimColor: true }), k.text('Answer in the chat: Run workflow, Run on Sonnet or Don’t run. Run on Sonnet puts every agent on Sonnet, whatever the script names. Closing the question declines it.', { wrap: 'wrap' })),
      ...(isHome ? [k.buttons([k.button('flow-see', 'Open Workflows', act.openWorkflows, { dimColor: true })])] : []),
    ],
  )
}

// A run in this session, as it goes: its stages, every agent, and the controls that steer it.
function liveRunCard(k, d, act, r, i) {
  const p = r.progress
  const isOpen = d.view.openRun === r.runId || p.total <= 8
  const c = d.view.confirm || ''
  const isStopping = r.status === 'stopping'
  const order = { running: 0, held: 1, queued: 2, failed: 3, stopped: 4, done: 5 }
  const agents = [...p.agents].sort((a, z) => (order[a.state] ?? 6) - (order[z.state] ?? 6) || (z.startedAt || 0) - (a.startedAt || 0))
  const shown = isOpen ? agents : agents.slice(0, 6)
  const share = d.flows.share
  const facts = [
    p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' : 'Starting',
    p.running ? p.running + ' working' : '',
    p.held ? p.held + ' waiting' : '',
    p.failed ? p.failed + ' failed' : '',
    p.usd ? cost(p.usd) + ' so far' + (share && !SHARE && p.usd >= 1 ? ' (' + shareWords(p.usd, share) + ')' : '') : '',
    r.startedAt ? fmtSpan(d.now - r.startedAt) : '',
  ].filter(Boolean)
  const atLimit = r.paused && r.pausedFor === 'budget'
  const state = isStopping ? ['■ ', 'warning', 'Stopping'] : atLimit ? ['‖ ', 'warning', 'Paused at its ' + fmtUsd(r.budget) + ' limit'] : r.paused ? ['‖ ', 'warning', 'Paused'] : ['● ', 'suggestion', 'Running']
  const budgets = [{ value: 0, label: 'No limit' }, ...[5, 10, 25, 50].map((v) => ({ value: v, label: fmtUsd(v).replace('.00', '') }))]
  if (r.budget && !budgets.some((b) => b.value === r.budget)) budgets.push({ value: r.budget, label: fmtUsd(r.budget).replace('.00', '') })
  const raiseTo = [5, 10, 25, 50, 100, 250, 500].find((v) => v > Math.max(r.budget || 0, p.usd)) || Math.ceil((p.usd * 2) / 50) * 50
  // the timeline: every agent from start to finish, the newest 24, oldest at the top
  const timed = [...p.agents].filter((a) => a.startedAt || a.queuedAt).sort((a, z) => (a.startedAt || a.queuedAt) - (z.startedAt || z.queuedAt)).slice(-24)
  const caps = [{ value: 0, label: 'No limit' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }]
  const models = [{ value: '', label: 'As written' }, { value: 'sonnet', label: 'Sonnet' }, { value: 'opus', label: 'Opus' }]
  const controls = isStopping
    ? [k.footnote('Agents already working finish their current step; nothing new starts.')]
    : c === 'stop:' + r.runId
      ? [
          k.Box({
            flexDirection: 'column',
            rowGap: 'sm',
            children: [
              k.text('Stop “' + (r.name || 'this workflow') + '”?', { weight: 'medium' }),
              k.footnote('Agents already working finish their current step and nothing new starts. Finished work is kept, and the run can be resumed later in this session.'),
              k.buttons([k.button('flow-stop-go', 'Stop workflow', () => act.stopRun(r.runId), { variant: 'primary' }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })]),
            ],
          }),
        ]
      : [
          ...(atLimit
            ? [
                k.text((r.name || 'This run') + ' has cost ' + fmtUsd(p.usd) + ', past its ' + fmtUsd(r.budget) + ' limit. Agents already working finish their step; new ones wait for you.', { wrap: 'wrap' }),
                k.buttons([
                  k.button('flow-raise-' + i, 'Raise limit to ' + fmtUsd(raiseTo).replace('.00', ''), () => act.setRunBudget(r.runId, raiseTo), { variant: i === 0 ? 'primary' : undefined }),
                  k.button('flow-nolimit-' + i, 'Remove spending limit', () => act.setRunBudget(r.runId, 0)),
                ]),
              ]
            : []),
          k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'lg', rowGap: 'sm', alignItems: 'center', children: [
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Agents at once'), k.segmented('flow-cap-' + i, caps, r.cap || 0, (v) => act.setRunCap(r.runId, v))] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Model for new agents'), k.segmented('flow-model-' + i, models, r.model || '', (v) => act.setRunModel(r.runId, v))] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Spending limit, then hold new agents'), k.segmented('flow-budget-' + i, budgets, r.budget || 0, (v) => act.setRunBudget(r.runId, v))] }),
          ] }),
          k.buttons([
            ...(atLimit ? [] : [k.button('flow-pause-' + i, r.paused ? 'Resume' : 'Pause new agents', () => act.pauseRun(r.runId, !r.paused), { variant: i === 0 && r.paused ? 'primary' : undefined })]),
            k.button('flow-stop-' + i, 'Stop workflow…', () => act.setView({ confirm: 'stop:' + r.runId }), r.taskId ? {} : { dimColor: true }),
            k.button('flow-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true }),
          ]),
          k.footnote(r.paused ? 'Paused: agents already working carry on; new ones wait until you resume.' : r.cap ? 'At most ' + plural(r.cap, 'agent works', 'agents work') + ' at once; the rest wait their turn.' : 'Pausing lets working agents finish and holds new ones; a limit spreads the work out, so it uses your plan more slowly.'),
        ]
  return k.card(
    r.name || 'Workflow',
    r.description || r.summary || '',
    [
      k.Text({ wrap: 'wrap', children: [k.text(state[0], { color: state[1] }), k.text(state[2], { weight: 'semibold', color: state[1] === 'suggestion' ? undefined : state[1] }), k.text('  ' + facts.join(' · '), { dimColor: true, tabular: true })] }),
      ...(k.hasSvg && p.phases.some((ph) => ph.total > 0) ? [k.Svg({ source: svgStages(p.phases), alt: 'Stages: ' + p.phases.map((ph) => ph.title + ' ' + ph.done + ' of ' + ph.total).join(', '), height: 14, isInteractive: true })] : []),
      stageLine(k, p),
      // a timeline of agents that have only just started is two specks: it waits for a minute of history
      ...(k.hasSvg && timed.length >= 2 && d.now - (r.startedAt || timed[0].queuedAt) >= 60_000
        ? [
            k.Box({
              flexDirection: 'column',
              rowGap: 'xs',
              children: [
                k.Svg({ source: svgTimeline(timed, r.startedAt || timed[0].queuedAt, d.now), alt: 'Timeline of ' + plural(timed.length, 'agent', 'agents') + ', each from start to finish', height: timed.length * 12 - 4, isInteractive: true }),
                k.Box({ flexDirection: 'row', children: [k.Box({ flexGrow: 1, children: [k.footnote('Started ' + ago(d.now - (r.startedAt || timed[0].queuedAt)))] }), k.footnote('now')] }),
              ],
            }),
          ]
        : []),
      ...(r.estimate && r.estimate.high > 0 ? [k.footnote('Expected ' + cost(r.estimate.low) + '–' + cost(r.estimate.high) + ' before it started' + (p.usd > r.estimate.high ? '; it has gone past that.' : '.'), p.usd > r.estimate.high ? { color: 'warning', dimColor: undefined } : {})] : []),
      ...(r.tips || []).map((t) => k.hang(k.text('●', { color: 'warning' }), k.footnote(t))),
      ...(shown.length ? [k.Box({ flexDirection: 'column', rowGap: k.isTerminal ? 0 : 'xs', children: shown.map((a, j) => agentRow(k, d, a, 'flow-' + i + '-a' + j)) })] : [k.footnote('No agents have started yet.')]),
      ...(agents.length > 6 && p.total > 8 ? [k.buttons([k.button('flow-more-' + i, isOpen ? 'Show fewer' : 'Show all ' + agents.length + ' agents', () => act.setView({ openRun: isOpen ? '' : r.runId }), { dimColor: true })])] : []),
      ...controls,
    ],
    { gap: 'md' },
  )
}

// What could be better next time, for one finished run or across all of them: what it saw, a
// range for what it would have saved, what has happened since it became a rule, and the choices.
function savingRow(k, act, f, key, runId, share, isLead = false) {
  const range = f.high >= 1 ? (f.high - f.low >= 1 ? fmtUsd(f.low) + '–' + fmtUsd(f.high) : fmtUsd(f.high)) : ''
  // the share of the limit first, dollars second, whenever the plan has a limit to take a share of
  const value = range ? (share ? 'Could have saved up to ' + shareWords(f.high, share).replace(/^about /, '') : 'Would have saved about ' + range) : f.minutes ? 'About ' + fmtSpan(f.minutes * 60_000) + ' less waiting' : ''
  const since = f.since && f.since.text ? f.since : null
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    width: '100%',
    children: [
      k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'flex-start', children: [
        k.Box({ flexGrow: 1, flexShrink: 1, children: [k.text(f.title, { weight: 'semibold', wrap: 'wrap' })] }),
        ...(value ? [k.Box({ flexShrink: 0, children: [k.text(value, { tabular: true, color: range ? 'success' : undefined, size: 'footnote', weight: 'medium' })] })] : []),
      ] }),
      k.text(f.detail, { wrap: 'wrap' }),
      ...(share && f.high >= 1 ? [k.footnote('In dollars, about ' + range + ' at list prices; an estimate.')] : []),
      ...(since ? [k.hang(k.text(since.level === 'good' ? '✓' : since.level === 'warn' ? '●' : '○', since.level === 'good' ? { color: 'success' } : since.level === 'warn' ? { color: 'warning' } : { dimColor: true }), k.text(since.text, { size: 'footnote', wrap: 'wrap', weight: 'medium' }))] : []),
      k.buttons([
        k.button(key + '-rule', f.adoptedAt ? 'Add the rule again…' : 'Make it a rule…', () => act.adoptSaving(f.key, runId), f.adoptedAt ? { plain: true, dimColor: true } : isLead ? { variant: 'primary' } : { plain: true }),
        ...(runId
          ? []
          : f.isHidden
            ? [k.button(key + '-hide', 'Show again', () => act.hideSaving(f.key, false), { dimColor: true })]
            : [k.button(key + '-hide', 'Set aside', () => act.hideSaving(f.key, true), { plain: true, dimColor: true }), k.button(key + '-wrong', 'Not useful', () => act.hideSaving(f.key, true, true), { plain: true, dimColor: true })]),
      ]),
    ],
  })
}

function finishedRunRow(k, d, act, r, i) {
  const [glyph, color, word] = RUN_END[r.status] || RUN_END.completed
  const p = r.progress
  const facts = [word, p.total ? plural(p.total, 'agent', 'agents') : '', p.usd ? cost(p.usd) : '', r.endedAt && r.startedAt ? fmtSpan(r.endedAt - r.startedAt) : '', r.endedAt ? ago(d.now - r.endedAt) : ''].filter(Boolean).join(' · ')
  const canResume = r.status === 'killed' || r.status === 'failed'
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    width: '100%',
    children: [
      k.Text({ wrap: 'truncate-end', children: [k.text(glyph + ' ', { color }), k.text(r.name || r.runId, { weight: 'semibold' }), k.text('  ' + facts, { dimColor: true, tabular: true })] }),
      ...(r.summary ? [k.footnote(r.summary)] : []),
      ...(r.error ? [k.footnote(r.error, { color: 'error', dimColor: undefined })] : []),
      ...(r.next || []).map((f, j) => k.Box({ paddingLeft: k.isTerminal ? 2 : 'md', children: [savingRow(k, act, f, 'flow-done-' + i + '-n' + j, r.runId, d.flows.share)] })),
      ...(canResume ? [k.buttons([k.button('flow-resume-' + i, 'Resume workflow…', () => act.resumeRun(r)), k.button('flow-done-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true })])] : []),
    ],
  })
}

// A run in another session, read from its folder: its stages and agents as they write, read-only.
function otherRunRow(k, d, act, r, i, canAsk) {
  const active = r.agents.filter((a) => a.isActive).length
  const phases = [...new Set(r.agents.map((a) => a.phase).filter(Boolean))]
  const now = r.agents.filter((a) => a.isActive).slice(0, 3).map((a) => a.label)
  const c = d.view.confirm || ''
  const isAsking = c === 'askstop:' + r.runId
  const facts = [plural(r.agents.length, 'agent', 'agents') + ' so far', active ? active + ' working now' : 'quiet for ' + fmtSpan(d.now - r.lastAt), r.usd ? cost(r.usd) : ''].filter(Boolean).join(' · ')
  return k.hoverBox(
    'flow-other-' + i,
    { flexDirection: 'column', rowGap: 'xs', width: '100%' },
    [
      k.Text({ wrap: 'truncate-end', children: [k.text('● ', active ? { color: 'suggestion' } : { dimColor: true }), k.text(r.name, { weight: 'semibold' }), k.text('  ' + [r.project, r.title].filter(Boolean).join(' · '), { dimColor: true })] }),
      k.footnote(facts),
      ...(phases.length ? [k.footnote('Stages so far: ' + phases.join(' → '))] : []),
      ...(now.length ? [k.footnote('Working on ' + now.join(', '))] : []),
      ...(isAsking
        ? [
            k.text('Ask “' + (r.title || r.project) + '” to stop ' + r.name + '?', { weight: 'medium', wrap: 'wrap' }),
            k.footnote('This message goes to that session:'),
            k.Box({ paddingX: k.isTerminal ? 1 : 'md', paddingY: k.isTerminal ? undefined : 'sm', borderStyle: 'round', borderDimColor: true, children: [k.text(stopRequest(r.name, r.runId), { wrap: 'wrap' })] }),
            k.buttons([k.button('flow-ask-go', 'Ask that session to stop', () => act.askStopElsewhere(r), { variant: 'primary' }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })]),
          ]
        : [
            k.buttons([
              ...(canAsk && r.deskId ? [k.button('flow-other-stop-' + i, 'Ask that session to stop…', () => act.setView({ confirm: 'askstop:' + r.runId }))] : []),
              k.button('flow-other-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true }),
            ]),
          ]),
    ],
    { title: r.name, lines: [r.cwd ? String(r.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Read from that session’s folder. Pause, limits and models apply to runs started in this session.'] },
  )
}

// Jobs that would go better as a workflow: the request that looked like one (or a pile of
// uncommitted changes), the shape that keeps it cheap, and what similar runs cost before.
function suggestionsCard(k, d, act, hasPrimary) {
  const list = (d.flows && d.flows.suggestions) || []
  if (!list.length) return null
  return k.card(
    list.length === 1 ? 'A workflow could do this' : 'Workflows that could help',
    'A workflow splits a big job across several agents and checks the results before anything is reported. Starting one puts a request in the prompt box; Claude shows the plan before it runs.',
    list.map((x, i) =>
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        width: '100%',
        children: [
          k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
          k.guide(x.why),
          k.text(x.what, { wrap: 'wrap' }),
          k.Text({ wrap: 'wrap', children: x.stages.flatMap(([title, model, how], j) => [...(j ? [k.text('  →  ', { dimColor: true })] : []), k.text(title, { weight: 'medium' }), k.text(' on ' + model, { color: midHex(FAMILY_HEX[model]) }), k.text(' · ' + how, { size: 'footnote', dimColor: true })]) }),
          ...(x.past ? [k.footnote('Similar runs of yours cost ' + (x.past.high - x.past.low >= 1 ? cost(x.past.low) + '–' + cost(x.past.high) : cost(x.past.high)) + ' (' + plural(x.past.runs, 'run', 'runs') + ')' + (d.flows.share && !SHARE ? ', ' + shareWords(x.past.high, d.flows.share) + ' at most' : '') + '.')] : []),
          k.buttons([
            k.button('suggest-' + i, 'Start this workflow…', () => act.startSuggested(x.key), { variant: i === 0 && !hasPrimary ? 'primary' : undefined }),
            k.button('suggest-' + i + '-skip', 'Not now', () => act.skipSuggested(x.key), { dimColor: true }),
          ]),
        ],
      }),
    ),
    { gap: 'lg' },
  )
}

// One running workflow as a runway: the fill is what it has cost against its spending limit (or what it
// was expected to cost), the strand under it is how much of the work is done, and when the cost is ahead
// of the work enough to pass the limit before it finishes, the run-out shows as a stop, as a limit's does.
function runLine(k, d, r, i) {
  const p = r.progress
  const limit = r.budget || (r.estimate && r.estimate.high) || 0
  const done = p.total ? (p.done / p.total) * 100 : 0
  const used = limit > 0 ? Math.min(100, (p.usd / limit) * 100) : done
  const hasClock = limit > 0 && p.total >= 2 && done > 0
  const would = hasClock && used > 0 ? (used / done) * 100 : 0
  const runOut = hasClock && used > 0 && used < 100 && would > 100 && done < 100 ? Math.min(99, (done / used) * 100) : null
  const runway = { used, elapsed: hasClock ? done : null, runOut, projected: hasClock && done >= 10 ? Math.min(100, would) : null, ticks: [] }
  const name = r.name || 'Workflow'
  const isPaused = r.paused || r.status === 'stopping'
  const words = name + ': ' + cost(p.usd) + (limit ? ' of ' + cost(limit) + (r.budget ? ' limit' : ' expected at most') : '') + ', ' + p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' + (runOut !== null ? ', on course to pass it before it finishes' : '')
  const hex = isPaused ? HEX.warning : RING_HEX.spending
  const draws = k.hasSvg ? k.Box({ width: '100%', children: [k.Svg({ source: svgRunway({ ...runway, hex }, { width: 4000, height: 14, isFluid: true }), alt: words, height: 14 })] }) : k.Text({ children: textRunway(runway, 20).map(([t, c]) => k.text(t, c ? { color: c } : {})) })
  const isRoomy = k.columns >= 64
  return k.hoverBox('flow-lead-' + i, { flexDirection: 'row', columnGap: 'md', alignItems: 'center', width: '100%' }, [
    k.Box({ width: isRoomy ? 24 : 16, flexShrink: 0, flexDirection: 'row', columnGap: 'xs', alignItems: 'center', children: [isPaused ? k.text('‖', { color: 'warning' }) : k.live(HEX.bar, 'suggestion', 'Running'), k.Box({ flexShrink: 1, children: [k.text(name, { wrap: 'truncate-end' })] })] }),
    k.Box({ flexGrow: 1, flexShrink: 1, children: [draws] }),
    k.Box({ width: 12, flexShrink: 0, justifyContent: 'flex-end', children: [k.text(p.done + ' of ' + p.total, { tabular: true, weight: 'semibold', wrap: 'truncate-end' })] }),
    ...(isRoomy ? [k.Box({ width: 22, flexShrink: 0, justifyContent: 'flex-end', children: [k.footnote(cost(p.usd) + (limit ? ' of ' + cost(limit) : ''), { tabular: true, wrap: 'truncate-end', ...(runOut !== null ? { color: 'warning', dimColor: undefined } : {}) })] })] : []),
  ], {
    title: name + (isPaused ? ', paused' : ', running'),
    lines: [p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done, ' + p.running + ' working' + (p.held ? ', ' + p.held + ' waiting' : '') + '.' : 'Starting.', limit ? 'Cost ' + cost(p.usd) + ' against ' + cost(limit) + (r.budget ? ', its spending limit.' : ', the most it was expected to cost.') : 'Cost so far ' + cost(p.usd) + '.', runOut !== null ? 'The cost is ahead of the work: at this rate it passes ' + cost(limit) + ' before it finishes.' : 'The strand under the bar is how much of the work is done.'],
  })
}

// Opens on its one answer: what is running and what it has cost, or what the month of workflows cost and
// how much of it could have been saved; or the run that waits for a go-ahead and what it is likely to cost.
function workflowsLead(k, d, act, { fl, mine, others, sv }) {
  const running = mine.length + others.length
  const approval = fl.approval
  const topIdea = sv.findings.filter((f) => !f.isHidden && f.high >= 1)[0]
  let headline = approval ? 'A workflow is waiting for your go-ahead' : running ? (running === 1 ? 'One workflow is running' : running + ' workflows are running') : 'No workflows running'
  const facts = []
  let figure = null
  if (approval) {
    const e = approval.estimate || {}
    facts.push((approval.preview.name ? '“' + approval.preview.name + '”' : 'A workflow') + ' will not start until you answer in the chat')
    if (e.basis && e.high > 0) figure = { value: cost(e.low) + '–' + cost(e.high), caption: 'likely cost, from your own runs' }
  } else if (running) {
    const first = mine[0]
    if (first) {
      const p = first.progress
      facts.push((first.name || 'Workflow') + ': ' + (p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' : 'starting') + (p.running ? ', ' + p.running + ' working' : ''))
    }
    if (mine.length && others.length) facts.push(others.length + ' more in other sessions')
    else if (!mine.length) facts.push('In other sessions')
    const total = mine.reduce((n, r) => n + r.progress.usd, 0) + others.reduce((n, r) => n + (r.usd || 0), 0)
    figure = { value: cost(total), caption: (SHARE && !/worth$/.test(cost(total)) ? 'of your weekly limit, so far' : 'so far') + ', running now', sub: sv.runs ? 'Last ' + sv.days + ' days: ' + cost(sv.usd) + (SHARE ? ', estimated at list prices' : '') : '' }
  } else if (sv.runs) {
    facts.push(plural(sv.runs, 'run', 'runs') + ' in the last ' + sv.days + ' days, ' + cost(sv.usd / sv.runs) + ' each')
    if (topIdea) facts.push('could have saved up to ' + cost(topIdea.high))
    figure = { value: cost(sv.usd), caption: (SHARE && !/worth$/.test(cost(sv.usd)) ? 'of your weekly limit' : 'on workflows') + ' in ' + sv.days + ' days' + (SHARE ? ', estimated at list prices' : '') }
  } else {
    facts.push('A workflow splits a big job across several agents. Its cost and what could be cheaper show here once one has run')
  }
  if (!approval && fl.share && fl.weekUsd > 0 && !SHARE) facts.push('about ' + Math.max(1, Math.round(fl.weekUsd * fl.share.pctPerUsd)) + '% of this week’s limit went to workflows')
  const level = approval ? 'warning' : 'success'
  const visual = []
  if (!approval && mine.length) mine.slice(0, 3).forEach((r, i) => visual.push(runLine(k, d, r, i)))
  // with nothing running: the month's spend, and the part of it that could have been saved
  if (!approval && !running && sv.runs && topIdea && sv.usd > 0) {
    const save = Math.min(topIdea.high, sv.usd)
    visual.push(
      k.hoverBox('flow-lead-month', { flexDirection: 'column', rowGap: 'xs', width: '100%' }, [
        k.meter([{ value: sv.usd - save, hex: HEX.marker, color: 'inactive', title: 'Everything else: ' + cost(sv.usd - save) }, { value: save, hex: HEX.success, color: 'success', title: 'Could have saved up to ' + cost(save) }], sv.usd, [], 'The last ' + sv.days + ' days of workflows cost ' + cost(sv.usd) + '; up to ' + cost(save) + ' of it could have been saved.'),
        k.Text({ wrap: 'wrap', children: [k.text('● ', { color: 'success' }), k.text('Could have saved up to ' + cost(save) + ': ' + topIdea.title.toLowerCase(), { size: 'footnote', dimColor: true, tabular: true })] }),
      ], { title: 'The last ' + sv.days + ' days', lines: [cost(sv.usd) + ' on ' + plural(sv.runs, 'run', 'runs') + ', in every project.', 'The green part is the most the top idea would have saved on those runs: an estimate.', 'Its details are under Ways to spend less.'], align: 'left' }),
    )
  }
  return lead(k, {
    glyph: approval ? k.text('● ', { color: 'warning' }) : running ? k.live(HEX.bar, 'suggestion', 'Running') : k.text('✓ ', { color: 'success' }),
    headline,
    facts: facts.join(' · ') + '.',
    figure: figure ? { ...figure, level } : null,
    isLive: running > 0 && !approval,
    visual,
  })
}

function workflowsTab(k, d, act) {
  const fl = d.flows || { runs: [], other: { running: [], finished: [] }, savings: null }
  const mine = fl.runs.filter((r) => r.status === 'running' || r.status === 'stopping')
  const done = fl.runs.filter((r) => r.status !== 'running' && r.status !== 'stopping')
  const others = (fl.other && fl.other.running) || []
  const sv = fl.savings || { findings: [], runs: 0, usd: 0, days: 30 }
  const shownSavings = sv.findings.filter((f) => d.view.showSetAside || !f.isHidden)
  const setAside = sv.findings.filter((f) => f.isHidden).length
  const running = mine.length + others.length

  const head = [workflowsLead(k, d, act, { fl, mine, others, sv }), approvalCard(k, d, act)]

  // each block is drawn by a function of the kit, so a wide pane can draw it for its own column
  const live = (k) => {
  const out = [suggestionsCard(k, d, act, !!fl.approval)]
  mine.forEach((r, i) => out.push(liveRunCard(k, d, act, r, i)))

  if (others.length) out.push(k.card('Running in other sessions', 'Read from each session’s folder as its agents write.' + (fl.canAsk ? ' Ask it to stop sends that session a message.' : ''), others.map((r, i) => otherRunRow(k, d, act, r, i, fl.canAsk)), { gap: 'lg' }))

  if (done.length) out.push(k.card('Finished in this session', '', done.slice(0, 8).map((r, i) => finishedRunRow(k, d, act, r, i)), { gap: 'lg' }))

  const finishedElsewhere = ((fl.other && fl.other.finished) || []).slice(0, 6)
  if (finishedElsewhere.length) {
    out.push(k.card('Finished in the last day', 'Runs from your other sessions.', finishedElsewhere.map((r, i) => {
      const [glyph, color, word] = RUN_END[r.status] || RUN_END.completed
      return k.row(
        [
          { parts: [k.text(glyph + ' ', { color }), k.text(r.name || r.runId, { weight: 'medium' }), k.text('  ' + r.project, { dimColor: true })] },
          { text: word, width: 10, props: { dimColor: true } },
          { text: plural(r.agents, 'agent', 'agents'), width: 11, props: { dimColor: true } },
          { text: r.usd ? cost(r.usd) : '', width: 9 },
        ],
        {},
        { key: 'flow-fin-' + i, tip: { title: r.name, lines: [r.summary, r.title ? 'In “' + r.title + '”' : '', r.durationMs ? 'Took ' + fmtSpan(r.durationMs) + ', ' + ago(d.now - r.endedAt) + '.' : ''] } },
      )
    })))
  }

  return out
  }

  const costliest = (k) => {
  const out = []
  const costW = Math.max(9, ...(sv.costliest || []).map((x) => cost(x.usd).length + 1))
  if (sv.costliest && sv.costliest.length) {
    out.push(k.card(
      'Costliest runs',
      'The last ' + sv.days + ' days, in every project.' + (k.isTerminal ? '' : ' Hover over a run for where its money went.'),
      [
        k.heads([{ text: 'Run' }, ...(k.hasSvg && k.isRoomy ? [{ text: 'Where it went', width: 22, isBar: true }] : []), { text: 'Agents', width: 8 }, { text: 'Took', width: 11 }, { text: 'Cost', width: costW }]),
        ...sv.costliest.map((x, i) => {
          const [glyph, color] = RUN_END[x.status] || RUN_END.completed
          const stages = [...x.stages].sort((a, z) => z.usd - a.usd).filter((st) => st.usd > 0).slice(0, 4)
          const stageWords = (st) => (st.title || 'Agents') + ': ' + plural(st.agents, 'agent', 'agents') + ', ' + cost(st.usd) + (stageModel(st) ? ', mostly on ' + stageModel(st) : '')
          const stack = [...x.stages].filter((st) => st.usd > 0).map((st) => ({ value: st.usd, hex: FAMILY_HEX[stageModel(st)] || HEX.marker, title: stageWords(st) }))
          const row = k.row(
            [
              { parts: [k.text(glyph + ' ', { color }), k.text(x.name || x.runId, { weight: 'medium' }), k.text('  ' + [x.project || '', (RUN_END[x.status] || RUN_END.completed)[2]].filter(Boolean).join(' · '), { dimColor: true })] },
              ...(k.hasSvg && k.isRoomy ? [{ el: k.Box({ width: '100%', children: [k.Svg({ source: svgMeter(stack, sv.costliest[0].usd, [], true), alt: 'Cost by stage: ' + stages.map(stageWords).join('; '), height: 6, isInteractive: true })] }), width: 22 }] : []),
              { text: String(x.agents), width: 8, props: { dimColor: true } },
              { text: x.durationMs ? fmtSpan(x.durationMs) : '', width: 11, props: { dimColor: true } },
              { text: cost(x.usd), width: costW },
            ],
            {},
            { key: 'flow-cost-' + i, tip: { title: x.name, lines: ['Ran ' + ago(d.now - x.startedAt) + ' with ' + plural(x.agents, 'agent', 'agents') + '.', ...stages.map(stageWords)] } },
          )
          // the terminal has no hover: where the money went shows under the run
          return k.isTerminal && stages.length ? k.Box({ flexDirection: 'column', children: [row, k.footnote('  ' + stages.slice(0, 2).map(stageWords).join(' · '), { wrap: 'truncate-end' })] }) : row
        }),
        ...(k.hasSvg && k.isRoomy
          ? [k.Text({ wrap: 'wrap', children: [k.text('Bars show each stage’s cost, coloured by the model that did most of it: ', { size: 'footnote', dimColor: true }), ...['Opus', 'Sonnet', 'Fable'].flatMap((m, j) => [k.text((j ? '   ' : '') + '● ', { color: midHex(FAMILY_HEX[m]) }), k.text(m, { size: 'footnote' })])] })]
          : []),
      ],
    ))
  }

  return out
  }

  const savings = (k) => {
  const out = []
  if (sv.runs) {
    out.push(k.card(
      'Ways to spend less',
      'Worked out from ' + plural(sv.runs, 'workflow run', 'workflow runs') + ' in every project over the last ' + sv.days + ' days' + (sv.isPartial ? ', with older runs still being read' : '') + '. Each range is an estimate of what the change would have saved on those runs; where two fit the same stage, they overlap.',
      shownSavings.length
        ? [
            ...shownSavings.map((f, i) => savingRow(k, act, f, 'flow-save-' + i, '', fl.share, i === 0)),
            ...(setAside ? [k.buttons([k.button('flow-save-shown', d.view.showSetAside ? 'Hide set-aside ideas' : 'Show ' + plural(setAside, 'set-aside idea', 'set-aside ideas'), () => act.setView({ showSetAside: !d.view.showSetAside }), { dimColor: true })])] : []),
            k.footnote('Make it a rule… puts a request in the prompt box to add the rule to your CLAUDE.md; Claude shows the change before saving it.'),
          ]
        : [k.footnote(setAside ? 'Nothing new. ' + plural(setAside, 'idea is', 'ideas are') + ' set aside.' : 'Nothing stands out: your runs already pick their models and sizes well.')],
      { gap: 'lg' },
    ))
  }

  return out
  }

  const how = (k, start) => {
  const out = []
  const check = specOf('workflowCheck')
  out.push(k.card(
    'How workflows work',
    '',
    [
      k.text('A workflow is a script Claude writes to split a big job across many agents, usually in stages. Each agent is a separate Claude working on one part; their results feed the next stage.', { wrap: 'wrap' }),
      ...(start ? [start] : []),
      k.footnote('While one runs: the Pause new agents button lets working agents finish and holds the rest. A spending limit does the same once the run costs that much. Agents at once spreads the work out. Model for new agents switches what the rest run on. Stop workflow ends it and keeps what finished.'),
      ...(check
        ? [
            k.Box({ flexDirection: 'column', rowGap: 'xs', marginTop: 'xs', children: [k.text(check.label, { weight: 'medium' }), k.footnote(check.help), k.segmented('opt-workflowCheck', check.options, d.opts.workflowCheck, (v) => act.setOption('workflowCheck', v))] }),
          ]
        : []),
      k.buttons([k.button('flow-refresh', 'Refresh runs', act.refreshFlows, { plain: true, dimColor: true })]),
    ],
  ))
  return out
  }

  // with nothing yet, one column: what a workflow is first, then its one action
  const isEmpty = !fl.approval && !running && !sv.runs && !done.length && !(((fl.other && fl.other.finished) || []).length) && !((fl.suggestions || []).length)
  if (isEmpty) {
    const start = k.buttons([k.button('flow-start', 'Start a workflow', () => act.run('workflow-start'), { variant: 'primary' })])
    return [...head, ...how(k, start)]
  }
  if (k.isTerminal || k.columns < SPLIT_AT) return [...head, ...live(k), ...costliest(k), ...savings(k), ...how(k)]
  const [km, ka] = k.split()
  return [...head, km.layout([...live(km), ...savings(km)], [...costliest(ka), ...how(ka)])]
}

// Home: workflows running now, in this session or another, with where each has got to.
// A name cut to `max` characters at most, with an ellipsis where it was cut.
function shortName(name, max) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name
}

// A table's first cell for something working: its live dot (or a paused mark), then its words,
// truncated in the room the row leaves.
function liveName(k, hex, words) {
  return k.Box({
    flexDirection: 'row',
    columnGap: 1,
    alignItems: 'center',
    flexShrink: 1,
    children: [hex ? k.live(hex, 'suggestion', 'Running') : k.text('‖', { color: 'warning' }), k.Box({ flexShrink: 1, children: [k.Text({ wrap: 'truncate-end', children: words })] })],
  })
}

function runningNowCard(k, d, act) {
  const fl = d.flows
  if (!fl) return null
  const mine = fl.runs.filter((r) => r.status === 'running' || r.status === 'stopping')
  const others = (fl.other && fl.other.running) || []
  if (!mine.length && !others.length) return null
  const rows = [
    ...mine.map((r, i) => {
      const p = r.progress
      return k.row(
        [
          { el: liveName(k, r.paused ? null : HEX.bar, [k.text(r.name || 'Workflow', { weight: 'medium' }), k.text('  this session' + (p.current ? ' · ' + p.current.title : ''), { dimColor: true })]) },
          { text: p.total ? p.done + ' of ' + p.total : '', width: 8, props: { dimColor: true } },
          { text: p.usd ? cost(p.usd) : '', width: 9 },
        ],
        {},
        { key: 'home-run-' + i, tip: { title: r.name, lines: [r.paused ? 'Paused.' : 'Running.', plural(p.done, 'agent', 'agents') + ' done of ' + p.total + '.'] } },
      )
    }),
    ...others.map((r, i) => k.row(
      [
        { el: liveName(k, HEX.bar, [k.text(r.name, { weight: 'medium' }), k.text('  ' + [r.project, r.title].filter(Boolean).join(' · '), { dimColor: true })]) },
        { text: String(r.agents.length), width: 8, props: { dimColor: true } },
        { text: r.usd ? cost(r.usd) : '', width: 9 },
      ],
      {},
      { key: 'home-other-' + i, tip: { title: r.name, lines: [plural(r.agents.filter((a) => a.isActive).length, 'agent', 'agents') + ' working now.'] } },
    )),
  ]
  return k.card('Running now', 'Workflows working through a job, with their agents done so far.', [...rows, k.buttons([k.button('home-flows', 'Open Workflows', act.openWorkflows)])])
}

// What Home is drawn from: this tab's figures and the plan's windows, worked out once.
function homeContext(d) {
  const f = d.fleet || { status: 'unavailable', sessions: [], plan: null, ctx: {} }
  let h = null
  const u = d.usage
  const now = d.now
  const plan = d.plan || { source: 'none', windows: [] }
  // a remembered reading whose window has reset since says nothing about now
  const windows = plan.windows.filter((w) => plan.source !== 'remembered' || !w.resetsAt || w.resetsAt > now)
  h = {
    u,
    sc: d.scan || {},
    f,
    me: d.session || {},
    now,
    has: !!(u && !u.isEmpty),
    plan,
    windows,
    levelOf: (pct) => (pct >= Math.max(90, d.opts.limitAlertAt) ? 'error' : pct >= d.opts.limitAlertAt ? 'warning' : 'success'),
    tightest: [...windows].sort((a, z) => z.pct - a.pct)[0],
    w: d.waiting || { needs: [], pickup: [], canReply: false },
    hues: u && !u.isEmpty ? projectHues(u.projects) : Object.create(null),
  }
  h.item = h.tightest ? tightestItem(d, h.tightest, h) : null
  return h
}

// "Mon": a day's short name, in this computer's language.
function weekdayOf(key) {
  try {
    return new Date(dayKeyMs(key)).toLocaleDateString([], { weekday: 'short' })
  } catch {
    return key.slice(8)
  }
}

// Noon on a day ('YYYY-MM-DD') in this computer's time, for the day's name.
function dayKeyMs(key) {
  const [y, m, n] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, n || 1, 12).getTime()
}

// A project's colour where it is drawn: its own, or grey with the rest.
function hueOf(h, key) {
  return (h.hues && h.hues[key]) || OTHER_HEX
}

// The share of a project's use on one calendar day that came at or after `from`: the window's first
// day opened part way through it, and the hours before that belong to the window before. It comes from
// the hours the records keep; a transcript read before they were kept counts as spread evenly over the day.
function dayClip(p, j, key, from) {
  const day = new Date(from)
  day.setHours(0, 0, 0, 0)
  const start = day.getTime()
  const next = new Date(start)
  next.setDate(next.getDate() + 1)
  const span = Math.max(1, next.getTime() - start)
  const total = p.days[j] || 0
  if (!(total > 0)) return 0
  let after = (p.noHours && p.noHours[key] ? p.noHours[key] : 0) * Math.max(0, Math.min(1, (next.getTime() - from) / span))
  const prof = p.hours && p.hours[key]
  if (prof) for (let hour = 0; hour < 24; hour++) after += prof[hour] * Math.max(0, Math.min(1, (start + (hour + 1) * 3_600_000 - from) / 3_600_000))
  return Math.max(0, Math.min(1, after / total))
}

// The week's work, a day at a time, in the limit window's own columns: each day split by project,
// the most used at the bottom in every day, so the week's fill and the work that made it share one
// calendar. Days still to come are empty. The window's first day opened part way through: only what
// came after it opened is counted, so the bar is the window's, not the calendar day's.
function weekDays(h, win, focus = '') {
  const { u, now } = h
  if (!h.has || !win || win.unit !== 'day') return null
  const bounds = [win.startMs]
  try {
    const d0 = new Date(win.startMs)
    d0.setHours(24, 0, 0, 0)
    for (let t = d0.getTime(); t < win.endMs; ) {
      bounds.push(t)
      const n = new Date(t)
      n.setDate(n.getDate() + 1)
      n.setHours(0, 0, 0, 0)
      t = n.getTime()
    }
  } catch {
    return null
  }
  bounds.push(win.endMs)
  const index = Object.create(null)
  u.keys.forEach((key, i) => (index[key] = i))
  const today = dayKey(now)
  const out = []
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i]
    const b = bounds[i + 1]
    const key = dayKey((a + b) / 2)
    const j = a <= now ? index[key] : undefined
    const parts = []
    let other = 0
    // the window opened part way through this day
    const isPartial = i === 0 && new Date(a).getHours() + new Date(a).getMinutes() + new Date(a).getSeconds() > 0
    const clip = (p) => (isPartial && j !== undefined ? dayClip(p, j, key, a) : 1)
    if (j !== undefined) {
      for (const p of u.projects) {
        const v = (p.days[j] || 0) * clip(p)
        if (!(v > 0)) continue
        if (h.hues[p.key] || p.key === focus) parts.push({ value: v, hex: hueOf(h, p.key), name: p.name, key: p.key })
        else other += v
      }
    }
    if (other > 0) parts.push({ value: other, hex: OTHER_HEX, name: 'other projects', key: '' })
    // a picked project sits on the baseline in its colour, every day, and the rest step back in grey
    if (focus) {
      parts.sort((x, z) => (z.key === focus) - (x.key === focus))
      for (const x of parts) if (x.key !== focus) Object.assign(x, { hex: OTHER_HEX, isDim: true })
    }
    const total = parts.reduce((n, x) => n + x.value, 0)
    let name = key === today ? 'Today' : key
    let short = name
    try {
      if (key !== today) name = new Date((a + b) / 2).toLocaleDateString([], { weekday: 'long' })
      short = new Date((a + b) / 2).toLocaleDateString([], { weekday: 'short' })
    } catch {}
    const most = [...parts].sort((x, z) => z.value - x.value).slice(0, 2).map((x) => x.name)
    out.push({ key, startMs: a, endMs: b, parts, isToday: key === today, clip, total, name, short, tip: total > 0 ? name + ' · ' + cost(total) + ' · ' + most.join(', ') : '' })
  }
  return out.some((x) => x.total > 0) ? out : null
}


// Until the figures are in: turned off, the first read, a folder it can't read, or nothing yet.
function homeStatus(k, d, act, h) {
  const { sc, has } = h
  const out = []
  if (!d.opts.scanProjects) {
    out.push(
      k.card('Every project', null, [
        k.text('Reading every project is off.', { weight: 'medium', wrap: 'wrap' }),
        k.footnote('Turn it on to see what each project used today and this week, from Claude Code’s own records on this computer. Reading them sends nothing anywhere.'),
        k.buttons([k.button('scan-on', 'Read every project', () => act.setOption('scanProjects', true), { variant: 'primary' })]),
      ]),
    )
  } else if (!has && sc.status === 'unavailable') {
    out.push(
      k.card('Every project', null, [
        // a failure, drawn as one: its glyph and colour, and what to do next
        k.hang(k.text('✕', { color: 'error', weight: 'semibold' }), k.Box({ flexDirection: 'column', rowGap: 'xs', children: [
          k.text('Couldn’t read Claude Code’s records on this computer.', { weight: 'semibold', color: 'error', wrap: 'wrap' }),
          k.footnote('tobebestme looks in ~/.claude/projects, or under CLAUDE_CONFIG_DIR when that is set. Check that the folder exists and can be read, then try again. The other tabs still work.'),
        ] })),
        k.buttons([k.button('usage-refresh', 'Read projects again', act.refreshUsage)]),
      ]),
    )
  } else if (!has && sc.status === 'ok' && !sc.isRunning) {
    out.push(k.card('Every project', null, [k.text('Nothing in the last ' + SCAN_DAYS + ' days yet.', { weight: 'medium', wrap: 'wrap' }), k.footnote('Each project shows here once Claude has answered in it.')]))
  } else if (!has) {
    const total = sc.total || 0
    out.push(
      k.card('Reading your history', 'A one-time read of the last ' + SCAN_DAYS + ' days in every project. After this, only what changes is read.', [
        k.meter([{ value: sc.done || 0, hex: HEX.bar, color: 'suggestion' }], Math.max(1, total), [], total ? 'Read ' + sc.done + ' of ' + total + ' transcripts' : 'Looking for transcripts', true),
        k.footnote(total ? 'Read ' + fmtCount(sc.done) + ' of ' + fmtCount(total) + ' transcripts.' : 'Looking for transcripts…'),
      ]),
    )
  }

  return out
}

// What a saving would do to the week: the tightest limit's runway with the pace it would have
// from now on, and the words for before and after. Only for a window of days with a quarter hour in.
function whatIfItem(k, d, h, w) {
  const it = h.item
  if (!it || !it.window || it.window.unit !== 'day' || !w) return null
  const r = it.runway
  if (r.elapsed === null || r.elapsed === undefined || !(r.elapsed > 0) || !(r.used > 0) || r.used >= 100) return null
  const resetsAt = h.tightest.resetsAt
  const pace = (r.used / r.elapsed) * (1 - w.factor)
  const landing = r.used + pace * (100 - r.elapsed)
  // a run-out counts only when it is early enough to matter, as runwayOf decides it (8% of the week)
  const at = landing > 100 ? r.elapsed + (100 - r.used) / pace : null
  const runway = { used: r.used, elapsed: r.elapsed, runOut: at !== null && 100 - at >= 8 ? at : null, projected: Math.min(100, landing) }
  const before = paceWords('seven_day', r, resetsAt, d.now)
  const after = paceWords('seven_day', runway, resetsAt, d.now)
  const item = { runway, hex: tint(it.hex, runway.runOut !== null ? 'warning' : 'success'), label: it.label, valueText: Math.round(r.used) + '%' }
  const drop = Math.round(w.factor * 100)
  return {
    line: w.title + ': ' + after.replace(/^At this pace it/, 'it').replace(/^On pace/, 'on pace').replace(/^Used up/, 'used up'),
    tip: { title: w.title, lines: ['This week’s pace would drop about ' + drop + '%, at list prices.', before ? 'Now: ' + before.charAt(0).toLowerCase() + before.slice(1) : '', after ? 'Then: ' + after.charAt(0).toLowerCase() + after.slice(1) : ''], el: runwayBar(k, item, 'tile'), align: 'left' },
  }
}

function homeInsights(k, d, act, h) {
  const { u, has } = h
  const out = []
  const ideas = has ? usageInsights(u, { ...d.opts, fmt: cost }) : []
  if (ideas.length) {
    out.push(
      k.card('What stands out', null, ideas.map((x, i) => {
        const w = whatIfItem(k, d, h, x.whatIf)
        const body = [
          k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
          k.guide(x.detail),
          // what the saving would do to the week, in a line; point at it for the runway it would have
          ...(w ? [k.text(w.line, { size: 'footnote', weight: 'medium', wrap: 'wrap' })] : []),
          ...(x.action ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('insight-' + i, x.action.label, () => act.run(x.action.key))])] })] : []),
        ]
        return w ? k.hoverBox('insight-' + i + '-row', { flexDirection: 'column', rowGap: 'xs' }, body, w.tip) : k.Box({ flexDirection: 'column', rowGap: 'xs', children: body })
      }), { gap: 'md' }),
    )
  }

  return out
}


function homeProjects(k, d, act, h) {
  const { u, now, has } = h
  const out = []
  if (has) {
    // a day picked on the calendar shows here too, unless it is today, which has its own button
    const dayAt = d.view.day ? u.keys.indexOf(d.view.day) : -1
    const isDay = dayAt >= 0 && dayAt !== u.keys.length - 1
    const by = isDay ? 'day' : d.view.day && dayAt === u.keys.length - 1 ? 'today' : d.view.projectsBy === 'today' ? 'today' : 'week'
    for (const p of u.projects) p.day = isDay ? p.days[dayAt] || 0 : 0
    let dayName = ''
    try {
      dayName = isDay ? new Date(dayKeyMs(d.view.day)).toLocaleDateString([], { weekday: 'long' }) : ''
    } catch {
      dayName = d.view.day
    }
    const list = u.projects.filter((p) => p[by] > 0)
    const rows = d.view.showAllProjects ? list : list.slice(0, 8)
    const max = Math.max(0.0001, ...rows.map((p) => p[by]))
    const total = by === 'today' ? u.today.usd : by === 'day' ? u.days[dayAt] : u.week.usd
    const barW = k.columns >= 72 ? 16 : 8
    out.push(
      k.card('Projects', 'Most used first, with worktrees counted in their repository. Point at one for its sessions, models and folder.', [
        k.segmented('proj', [{ value: 'week', label: 'Past 7 days' }, { value: 'today', label: 'Today' }, ...(isDay ? [{ value: 'day', label: dayName }] : [])], by, (value) => act.setView({ projectsBy: value === 'day' ? d.view.projectsBy : value, day: value === 'day' ? d.view.day : '' })),
        ...(rows.length
          ? [
              k.heads([{ text: 'Project' }, { text: '', width: barW }, { text: by === 'today' ? 'Today' : by === 'day' ? dayName : 'Past 7 days', width: 12 }, { text: 'Sessions', width: 10 }, { text: 'Last answer', width: 14 }]),
              ...rows.map((p, i) =>
                k.row(
                  [
                    { parts: [...(k.isTerminal ? [] : [k.text('● ', { color: midHex(hueOf(h, p.key)) })]), k.text(p.name, d.view.project && d.view.project !== p.key ? { dimColor: true } : { weight: d.view.project === p.key ? 'semibold' : 'medium' }), ...(p.worktrees && k.columns >= 60 ? [k.text('  ' + plural(p.worktrees, 'worktree', 'worktrees'), { dimColor: true })] : [])] },
                    { el: k.bar(p[by], max, k.isTerminal ? HEX.bar : hueOf(h, p.key), p.name + ': ' + cost(p[by]) + ', ' + share(p[by], total) + '%'), width: barW },
                    { text: cost(p[by]), width: 12 },
                    { text: by === 'day' ? '' : String(by === 'today' ? p.sessionsToday : p.sessionsWeek), width: 10, props: { dimColor: true } },
                    { text: ago(now - p.lastAt), width: 14, props: { dimColor: true } },
                  ],
                  {},
                  { key: 'proj-' + i, tip: projectTip(p, now) },
                ),
              ),
            ]
          : [k.footnote('Nothing yet today. Past 7 days shows the week.')]),
        ...(list.length > 8 ? [k.buttons([k.button('proj-more', d.view.showAllProjects ? 'Show fewer' : 'Show all ' + list.length + ' projects', act.toggleProjects, { dimColor: true })])] : []),
      ], { gap: 'sm', accessory: SHARE ? null : k.footnote(cost(total) + (by === 'today' ? ' today' : by === 'day' ? ' on ' + dayName : ' in the past 7 days'), { tabular: true }) }),
    )

  }
  return out
}

function homeChart(k, d, act, h) {
  const { u, now, has } = h
  const out = []
  // the hero's calendar already draws the week by project; this is for a 5-hour window or no plan
  if (has && !(k.hasSvg && h.item && h.item.days)) {
    const stacks = u.days.map((_, i) => {
      let other = 0
      const parts = []
      for (const p of u.projects) {
        const v = p.days[i] || 0
        if (!(v > 0)) continue
        if (h.hues[p.key]) parts.push({ value: v, hex: h.hues[p.key] })
        else other += v
      }
      return other > 0 ? [...parts, { value: other, hex: OTHER_HEX }] : parts
    })
    const mean = avg(u.days)
    let peak = 0
    u.days.forEach((v, i) => {
      if (v > u.days[peak]) peak = i
    })
    out.push(
      k.card('Last ' + SCAN_DAYS + ' days', 'Every project, each day, in its own colour. The dashed line is the average.', [
        k.bars(u.days, SCAN_DAYS, 'Use each day over the last ' + SCAN_DAYS + ' days: today ' + cost(u.today.usd) + ', on average ' + cost(mean) + ' a day', 64, { stacks, titles: u.keys.map((key, i) => dayWords(key, now) + ': ' + cost(u.days[i])), average: true, averageTitle: 'Average: ' + cost(mean) + ' a day' }),
        k.row([{ text: dayWords(u.keys[0], now) }, { text: 'Today', width: 8 }], { size: 'footnote', dimColor: true }),
        k.footnote('On average ' + cost(mean) + ' a day. Busiest: ' + dayWords(u.keys[peak], now) + ', ' + cost(u.days[peak]) + '.'),
      ]),
    )
  }

  return out
}

// The desktop app's own session list: what is open, working, and ready to archive.
function homeSessions(k, d, act, h) {
  const { f, me, now } = h
  const out = []
  if (f.status === 'ok' && f.sessions.length) {
    const today = dayKey(now)
    const spent = {}
    for (const x of d.allLedger || []) if (x.date === today && x.desk) spent[x.desk] = (spent[x.desk] || 0) + x.usd
    const others = f.sessions.filter((x) => x.sessionId !== me.desk)
    const done = others.filter((x) => !x.isRunning && !x.pinned && /merged|closed/i.test(String(x.prState || '')))
    // This session first, then the others by recent activity.
    const rows = [{ sessionId: me.desk || 'self', title: me.title || me.project || 'This session', cwd: me.cwd, isRunning: false, lastActivityAt: null, isSelf: true }, ...others]
    const ctxW = k.columns >= 90 ? 12 : 0
    const sessionRow = (x, i) => {
      const ctx = x.isSelf ? { percentUsed: d.pct, tokensUsed: d.tokens } : f.ctx && f.ctx[x.sessionId]
      const pct = ctx && Number.isFinite(Number(ctx.percentUsed)) ? Math.round(ctx.percentUsed) : null
      const usd = x.isSelf ? (me.desk && spent[me.desk] !== undefined ? spent[me.desk] : d.usd) : spent[x.sessionId]
      const hasUsd = usd !== undefined && usd !== null
      const folder = String(x.cwd || '').split('/').filter(Boolean).pop() || ''
      const pr = x.prNumber ? 'PR #' + x.prNumber + (x.prState ? ' ' + String(x.prState).toLowerCase() : '') : ''
      // the project's name here; the branch (often a long slug) and the full path are in its hover card
      const sub = [x.isSelf ? 'this session' : '', folder, pr].filter(Boolean).join(' · ')
      const when = x.isSelf ? 'open here' : x.isRunning ? 'working now' : x.lastActivityAt ? ago(now - Date.parse(x.lastActivityAt)) : ''
      const ctxHex = pct === null ? null : pct >= d.opts.cheaperModelAt ? HEX.error : pct >= d.opts.contextWarnAt ? HEX.warning : RING_HEX.context
      return k.hoverBox('sess-' + i, { flexDirection: 'column', width: '100%' }, [
        k.row([
          { el: k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', minWidth: 0, flexShrink: 1, children: [x.isRunning ? k.live(HEX.success, 'success', 'Working now') : k.text('●', { dimColor: true }), k.Box({ flexShrink: 1, minWidth: 0, children: [k.text(x.title || 'Untitled session', { wrap: k.columns >= 90 ? 'truncate-end' : 'wrap', ...(x.isSelf ? { weight: 'semibold' } : {}) })] })] }) },
          ...(ctxW ? [{ el: pct !== null ? k.bar(pct, 100, ctxHex, 'Context ' + pct + '%') : k.text(' ', {}), width: ctxW }] : []),
          { text: pct !== null ? pct + '%' : '–', width: 7, props: pct === null ? { dimColor: true } : ctxHex !== RING_HEX.context && ctxW === 0 ? { color: pct >= d.opts.cheaperModelAt ? 'error' : 'warning' } : {} },
          { text: hasUsd ? cost(usd) : '–', width: 9, props: hasUsd ? {} : { dimColor: true } },
          { text: when, width: 14, props: x.isRunning ? { color: 'success' } : { dimColor: true } },
        ]),
        k.row([{ text: '   ' + sub, props: { size: 'footnote', dimColor: true, wrap: 'wrap' } }]),
      ], {
        title: x.title || 'Untitled session',
        lines: [
          x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '',
          x.branch ? 'Branch ' + x.branch + '.' : '',
          x.isRunning ? 'Working now.' : x.lastActivityAt ? 'Last active ' + ago(now - Date.parse(x.lastActivityAt)) + '.' : '',
          ctx ? 'Context ' + pct + '% full' + (ctx.tokensUsed ? ', ' + fmtTokens(ctx.tokensUsed) + ' tokens' : '') + '.' : 'Context shows while a session is working.',
          hasUsd ? cost(usd) + ' today.' : 'Spending shows for sessions that run tobebestme.',
          x.isSelf ? '' : 'Open it from the sidebar.',
        ],
      })
    }
    out.push(
      k.card('Open sessions', 'In the desktop app, newest activity first. Point at one for its folder, context and spending.', [
        k.heads([{ text: 'Session' }, ...(ctxW ? [{ text: '', width: ctxW }] : []), { text: 'Context', width: ctxW ? 7 : 7 }, { text: 'Today', width: 9 }, { text: 'Active', width: 14 }]),
        ...rows.map(sessionRow),
      ], { gap: 'sm' }),
    )

    if (done.length) {
      const c = d.view.confirm || ''
      out.push(
        k.card('Ready to archive', 'Idle sessions whose pull request is done. Archiving stops them and frees their worktrees; Archived in the sidebar brings one back.', done.slice(0, 8).map((x, i) => {
          const asking = c === 'archive:' + x.sessionId
          return k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.Box({
                flexDirection: 'row',
                columnGap: 'md',
                alignItems: 'center',
                children: [
                  k.Box({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, children: [k.text(x.title || 'Untitled session', { weight: 'medium', wrap: 'truncate-end' }), k.footnote('PR #' + x.prNumber + ' ' + String(x.prState || '').toLowerCase() + (x.lastActivityAt ? ' · last active ' + ago(now - Date.parse(x.lastActivityAt)) : ''), { wrap: 'truncate-end' })] }),
                  ...(asking ? [] : [k.button('archive-' + i, 'Archive session…', () => act.setView({ confirm: 'archive:' + x.sessionId }))]),
                ],
              }),
              ...(asking ? [k.Box({ flexDirection: 'column', rowGap: 'sm', children: [k.text('Archive “' + (x.title || 'this session') + '”? It stops, and its worktree is cleaned up.', { weight: 'medium', wrap: 'wrap' }), k.buttons([k.button('archive-go', 'Archive session', () => act.archiveSession(x.sessionId)), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })])] })] : []),
            ],
          })
        }), { gap: 'md' }),
      )
    }
  }

  return out
}

// One Refresh for the whole tab: every project's figures and, in the desktop app, its sessions.
function homeFooter(k, d, act, h) {
  const { sc, f, now, has } = h
  const out = []
  const isRetryShown = d.opts.scanProjects && !has && sc.status === 'unavailable' // its Try again refreshes it all
  if (!isRetryShown && (f.status === 'ok' || (d.opts.scanProjects && (has || sc.status === 'ok')))) {
    const notes = []
    if (sc.isRunning && sc.total) notes.push('Reading ' + fmtCount(sc.done) + ' of ' + fmtCount(sc.total) + ' changed transcripts…')
    else if (sc.at || f.at) notes.push('Updated ' + ago(now - Math.max(sc.at || 0, f.at || 0)) + '.')
    if (sc.skipped) notes.push(plural(sc.skipped, 'long transcript', 'long transcripts') + ' over 4 MB left out: reading them in parts needs a shell, and none runs here.')
    out.push(
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        paddingX: k.isTerminal ? 1 : 'xs',
        children: [
          ...(has ? [k.footnote((SHARE ? 'Shares of your weekly limit, estimated from this week’s work at list prices' : 'Estimates at list prices') + ', from Claude Code’s own records on this computer (~/.claude/projects), helpers and workflow agents included. Reading them sends nothing anywhere.')] : []),
          k.Box({ flexDirection: 'row', columnGap: 'md', alignItems: 'center', flexWrap: 'wrap', children: [k.buttons([k.button('usage-refresh', 'Refresh', act.refreshUsage, { dimColor: true }), k.button('home-copy', 'Copy summary', (ev) => act.copySummary(ev && ev.surface), { dimColor: true })]), ...notes.map((n) => k.footnote(n))] }),
        ],
      }),
    )
  }
  return out
}

// Habits that make Claude go further: what the person's own settings and records say matters most
// now, three at a time, each one press away and each put off for a month with Not now. The card goes
// away once there is nothing left to suggest.
function homeNext(k, d, act) {
  const { ideas, open, have, total } = habitIdeas(d)
  if (!ideas.length) return []
  const run = (todo) =>
    todo.kind === 'option' ? () => act.setOption(todo.field, todo.value)
    : todo.kind === 'tab' ? () => act.setView({ tab: todo.tab, confirm: '', editing: '' })
    : () => act.run(todo.key)
  return [
    // the count beside the title is what is shown; the habits in place, and why more can be open than
    // habits are missing (what your records show costing you counts as a suggestion too), go under it
    k.card('Get more from Claude', have + ' of ' + total + ' habits in place' + (open > ideas.length ? '. ' + (open - ideas.length) + ' more to come once these are done' : '') + '.', ideas.map((x) =>
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
          k.guide(x.detail),
          k.Box({ marginTop: 'xs', children: [k.buttons([k.button('next-' + x.key, x.button, run(x.todo)), k.button('next-' + x.key + '-later', 'Not now', () => act.dismissHabit(x.key), { dimColor: true })])] }),
        ],
      }),
    ), { gap: 'md', keepCaption: true, accessory: k.footnote(ideas.length + (open > ideas.length ? ' of ' + open : '') + ' suggested', { tabular: true }) }),
  ]
}

// A short welcome the first time, four steps that show the real thing and not a picture of it: the
// line above the prompt as it is now, what waits for you, the person's own limit laid out on its
// calendar, and the habits. It waits while something needs an answer, and `/tobebestme tour` brings
// it back.
function homeTour(k, d, act, h) {
  if (d.habits && d.habits.isTourDone) return []
  if (h.w.needs.length) return []
  const last = 3
  const step = Math.max(0, Math.min(last, d.view.tourStep || 0))
  const set = (n) => () => act.setView({ tourStep: n })
  let title = ''
  let words = ''
  let preview = null
  if (step === 0) {
    title = 'The line above your prompt'
    words = 'It is in every session and shows what is about to run out: this conversation’s context, your plan’s limits and what you have spent. Its button opens this pane. This is it, live.'
    preview = k.Box({ flexDirection: 'column', paddingY: 'sm', children: [drawBand(k, { ...d, bandRows: 2, isPreview: true }, act)] })
  } else if (step === 1) {
    const n = h.w.needs.length
    title = 'Chats that need you'
    words = 'When a chat in another session stops for a permission, a question or a decision, it shows on Home, and you can answer it from here without switching. ' + (d.opts.scanProjects ? 'Nothing is waiting for you now.' : 'Turn on Read every project in Settings to see them.')
  } else if (step === 2) {
    title = 'Your limits, on a calendar'
    words = 'The bar is your plan’s window. The fill is what you have used, the thin line under it is how much of the window has passed, and the white mark is now. When the fill is ahead of the mark, you will run out early: it turns amber and says when.'
    if (h.tightest) preview = k.Box({ flexDirection: 'column', paddingY: 'sm', children: [runwayBar(k, h.item, 'hero', Math.max(280, k.px - 56))] })
  } else {
    const { have, total } = habitIdeas(d)
    title = 'Habits that help most'
    words = 'ToBeBestMe looks at your own setup and records and suggests up to three things at a time. ' + have + ' of ' + total + ' are in place now. Not now puts a suggestion off for a month.'
  }
  return [
    k.card('Welcome to ToBeBestMe', null, [
      k.text(title, { size: 'title', weight: 'semibold', wrap: 'wrap' }),
      k.text(words, { wrap: 'wrap' }),
      ...(preview ? [preview] : []),
      k.buttons([
        ...(step > 0 ? [k.button('tour-back', 'Back', set(step - 1), { dimColor: true })] : []),
        step < last ? k.button('tour-next', 'Next', set(step + 1), { variant: 'primary' }) : k.button('tour-done', 'Done', act.finishTour, { variant: 'primary' }),
        ...(step < last ? [k.button('tour-skip', 'Skip tour', act.finishTour, { dimColor: true })] : []),
      ]),
    ], { gap: 'md', accessory: k.footnote('Step ' + (step + 1) + ' of ' + (last + 1), { tabular: true }), keepCaption: true }),
  ]
}

function allTab(k, d, act) {
  const h = homeContext(d)
  const { w, tightest } = h
  const hero = [homeHero(k, d, h, act), ...homeTour(k, d, act, h), approvalCard(k, d, act, true)]
  if (k.isTerminal || k.columns < SPLIT_AT) {
    return [...hero, needsCard(k, d, act, w), runningNowCard(k, d, act), pickupCard(k, d, act, w, h), ...homeStatus(k, d, act, h), ...homeInsights(k, d, act, h), ...homeNext(k, d, act), ...homeProjects(k, d, act, h), ...homeChart(k, d, act, h), ...homeSessions(k, d, act, h), ...homeFooter(k, d, act, h)]
  }
  // the hero holds the limits and the week; the left column is what to do, the right where things
  // are. With nothing for the right (no records read, no desktop sessions) the left takes the width.
  const [km, ka] = k.split()
  const aside = [...homeProjects(ka, d, act, h), ...homeChart(ka, d, act, h), ...homeSessions(ka, d, act, h)]
  if (!aside.length) return [...hero, needsCard(k, d, act, w), runningNowCard(k, d, act), pickupCard(k, d, act, w, h), ...homeStatus(k, d, act, h), ...homeInsights(k, d, act, h), ...homeNext(k, d, act), ...homeFooter(k, d, act, h)]
  return [
    ...hero,
    km.layout(
      [needsCard(km, d, act, w), runningNowCard(km, d, act), pickupCard(km, d, act, w, h), ...homeStatus(km, d, act, h), ...homeInsights(km, d, act, h), ...homeNext(km, d, act)],
      aside,
    ),
    ...homeFooter(k, d, act, h),
  ]
}

// ---- the line above the prompt ------------------------------------------------------------------
// One row in every session: what needs you (or that all is well), then context, limits and cost,
// and a button to the dashboard.
export function drawBand(k, d, act) {
  SHARE = costShare(d)
  const h = d.health
  const needs = (d.waiting && d.waiting.needs) || []
  const chats = needs.filter((x) => x.kind !== 'pr')
  // the headline: a chat waiting for you elsewhere comes first unless something here needs acting on
  let glyph = ['✓ ', { color: 'success' }]
  let title = 'All clear'
  let detail = ''
  const fl = d.flows || { runs: [] }
  const mine = fl.runs.filter((r) => r.status === 'running' || r.status === 'stopping')
  const isCalm = h.level === 'success' || h.level === 'info'
  if (fl.approval) {
    // a run waiting for your go-ahead holds up this session's work, so it comes first
    glyph = ['● ', { color: 'warning' }]
    title = 'Claude wants to run a workflow'
    detail = fl.approval.preview.name || ''
  } else if (isCalm && !chats.length && !mine.length && (fl.suggestions || []).some((x) => x.isFresh)) {
    const x = fl.suggestions.find((y) => y.isFresh)
    glyph = ['● ', { color: 'suggestion' }]
    title = 'This could be a workflow: ' + x.title.toLowerCase()
    detail = x.stages.map(([t, m]) => t + ' on ' + m).join(' → ')
  } else if (mine.length && isCalm && !chats.length) {
    const r = mine[0]
    const p = r.progress
    glyph = ['● ', { color: r.paused || r.status === 'stopping' ? 'warning' : 'suggestion' }, !r.paused && r.status !== 'stopping']
    title = (r.name || 'A workflow') + (r.status === 'stopping' ? ' is stopping' : r.paused ? ' is paused' : ' is running')
    detail = [p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' : '', p.current ? p.current.title : '', p.usd ? cost(p.usd) + ' so far' : ''].filter(Boolean).join(' · ')
  } else if (chats.length && isCalm) {
    glyph = ['● ', { color: 'warning' }]
    title = chats.length === 1 ? 'One chat is waiting for you' : chats.length + ' chats are waiting for you'
    detail = chats[0].title + (chats[0].text ? ': ' + chats[0].text : '')
  } else if (h.level !== 'success') {
    glyph = ['● ', h.level === 'info' ? { dimColor: true } : { color: h.level }]
    title = h.title
    detail = chats.length ? (chats.length === 1 ? 'a chat is waiting for you' : chats.length + ' chats are waiting for you') : ''
  }
  // the gauges: everything that can run out, each with a small meter
  const levelOf = (pct, warn, err) => (pct >= err ? 'error' : pct >= warn ? 'warning' : 'success')
  const gauges = [{ key: 'context', label: 'Context', pct: d.pct, hex: RING_HEX.context, level: levelOf(d.pct, d.opts.contextWarnAt, d.opts.cheaperModelAt) }]
  for (const l of d.limits.slice(0, 2)) gauges.push({ key: l.r.kind, label: l.r.kind === 'five_hour' ? '5-hour' : l.r.kind === 'seven_day' ? 'Weekly' : limitLabel(l.r.kind).replace(/ limit$/i, ''), pct: l.r.percentUsed, hex: RING_HEX[l.r.kind] || RING_HEX.seven_day_opus, level: l.level === 'info' ? 'success' : l.level, resetsAt: l.o.resetAt, runway: runwayOf(l.r.kind, l.r.percentUsed, l.o.resetAt, d.now) })
  // On desktop each figure takes an equal share of the row, its runway filling the room between its
  // name and its percentage, so pace reads at a glance; on a phone-width band, two to a row.
  const isNarrow = k.columns < 72
  const cellProps = isNarrow ? { width: '50%', paddingRight: 'md' } : { width: 0, flexGrow: 1 }
  const wideGauge = (g) => {
    const shown = Math.round(g.pct) + '%'
    const item = { runway: g.runway || { used: g.pct, elapsed: null, runOut: null, ticks: g.key === 'context' ? [d.opts.contextWarnAt] : [] }, hex: tint(g.hex, g.level), label: g.label, valueText: shown }
    return k.Box({
      ...cellProps,
      flexDirection: 'row',
      columnGap: 'sm',
      alignItems: 'center',
      children: [
        k.Box({ flexShrink: 0, children: [k.text(g.label, { size: 'footnote', dimColor: true })] }),
        k.Box({ flexGrow: 1, flexShrink: 1, children: [runwayBar(k, item, 'band')] }),
        k.Box({ flexShrink: 0, children: [k.text(shown, { tabular: true, weight: 'semibold', color: g.level === 'success' ? undefined : g.level })] }),
      ],
    })
  }
  const gauge = (g) => {
    if (k.hasSvg) return wideGauge(g)
    const shown = Math.round(g.pct) + '%'
    const meter = k.hasSvg
      ? k.Box({ width: 5, flexShrink: 0, children: [k.Svg({ source: svgRunway(g.runway ? { ...g.runway, hex: tint(g.hex, g.level) } : { used: g.pct, elapsed: null, runOut: null, ticks: g.key === 'context' ? [d.opts.contextWarnAt] : [], hex: tint(g.hex, g.level) }, { width: 40, height: 14 }), alt: g.label + ' ' + shown, width: 40, height: 14 })] })
      : k.text(textMeter(g.pct, 5), g.level === 'success' ? { color: 'suggestion' } : { color: g.level })
    return k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', flexShrink: 0, children: [meter, k.text(g.label + ' ', { dimColor: true }), k.text(shown, { tabular: true, weight: g.level === 'success' ? undefined : 'semibold', color: g.level === 'success' ? undefined : g.level })] })
  }
  // a workflow running here: how far it got, at a glance, its dot pulsing while it works
  const flowChip = mine.length
    ? (() => {
        const r = mine[0]
        const p = r.progress
        const pct = p.total ? (p.done / p.total) * 100 : 0
        if (k.hasSvg)
          return k.Box({
            ...cellProps,
            flexDirection: 'row',
            columnGap: 'sm',
            alignItems: 'center',
            children: [
              r.paused ? k.text('‖', { color: 'warning' }) : k.live(HEX.bar, 'suggestion', 'Running'),
              // the name keeps its room (a long one is cut short), and the meter takes what is left
              k.Box({ flexShrink: 0, children: [k.text(shortName(r.name || 'Workflow', 22), { size: 'footnote', dimColor: true })] }),
              k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Svg({ source: svgMeter([{ value: pct, hex: r.paused ? HEX.warning : HEX.bar }], 100, [], true), alt: (r.name || 'Workflow') + ' ' + p.done + ' of ' + p.total + ' agents done', height: 6 })] }),
              k.Box({ flexShrink: 0, children: [k.text(p.done + ' of ' + p.total, { tabular: true, weight: 'semibold' })] }),
            ],
          })
        const meter = k.hasSvg ? k.Box({ width: 8, flexShrink: 0, children: [k.Svg({ source: svgMeter([{ value: pct, hex: r.paused ? HEX.warning : HEX.success }], 100, [], true), alt: (r.name || 'Workflow') + ' ' + p.done + ' of ' + p.total + ' agents done', height: 6 })] }) : k.text(textMeter(pct, 5), { color: r.paused ? 'warning' : 'suggestion' })
        return k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', flexShrink: 0, children: [meter, k.text((r.name || 'Workflow') + ' ', { dimColor: true }), k.text(p.done + '/' + p.total, { tabular: true })] })
      })()
    : null
  const u = d.usage && !d.usage.isEmpty ? d.usage : null
  // two different figures, named apart: this session's own, and today across every session
  const money = u && !flowChip ? 'Today, all sessions: ' + cost(u.today.usd) + (k.columns >= 100 ? ' in ' + plural(u.today.projects, 'project', 'projects') : '') : ''
  // a phone-width band keeps the headline and its button; the rest is on the line below and on Home
  const isTiny = k.columns < 56
  const hasTip = isCalm && !chats.length && !mine.length && (fl.suggestions || []).some((x) => x.isFresh)
  const button = fl.approval ? k.button('band-open', 'Review workflow', act.openWorkflows || act.openPane)
    : hasTip ? k.button('band-open', 'See suggested workflow', act.openWorkflows || act.openPane)
    : mine.length && isCalm && !chats.length ? k.button('band-open', 'Follow it', act.openWorkflows || act.openPane)
    : chats.length ? k.button('band-open', 'See what’s waiting', act.openHome || act.openPane)
    : k.button('band-open', 'Open Orchestrator', act.openPane)
  const head = k.Box({
    flexDirection: 'row',
    columnGap: 1,
    alignItems: 'center',
    width: '100%',
    children: [
      ...(glyph[2] ? [k.live(HEX.bar, 'suggestion', 'Running')] : []),
      k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Text({ wrap: 'truncate-end', children: [...(glyph[2] ? [] : [k.text(glyph[0], glyph[1])]), k.text(title, { weight: 'semibold' }), ...(detail && !isTiny ? [k.text('  ' + detail, { dimColor: true })] : []), ...(isTiny ? [] : [k.text('  ·  This session ' + cost(d.usd) + (SHARE ? ' of the weekly limit' : '') + (k.hasSvg && money ? ' · ' + money : ''), { dimColor: true, tabular: true })])] })] }),
      ...(d.isPreview ? [] : [button]),
    ],
  })
  // one row when the band has room for one
  if ((d.bandRows || 3) < 2) return head
  return k.Box({
    flexDirection: 'column',
    width: '100%',
    rowGap: k.isTerminal ? 0 : 'xs',
    children: [
      head,
      k.Box({
        flexDirection: 'row',
        flexWrap: k.columns < 72 ? 'wrap' : 'nowrap', // a phone-width band has no room for one row of figures
        rowGap: k.isTerminal ? 0 : 'xs',
        // two half-width cells to a row on a phone: their own padding spaces them, not a gap
        columnGap: k.isTerminal ? 3 : k.columns < 72 ? 0 : 'lg',
        alignItems: 'center',
        width: '100%',
        // two lines in all: the headline and its cost, then the figures on one row (on desktop the
        // day's figure joins the headline's line, so the row is the gauges alone)
        children: [...gauges.map(gauge), ...(flowChip ? [flowChip] : []), ...(money && !k.hasSvg ? [k.Box({ flexShrink: 1, minWidth: 0, children: [k.text(money, { dimColor: true, tabular: true, wrap: 'truncate-end' })] })] : [])],
      }),
    ],
  })
}

// ---- calm: what runs on its own, the right model, and long runs ---------------------------------

// What tobebestme does without being asked, so nothing needs watching: [on?, what it does].
function autopilotItems(d) {
  const o = d.opts
  const cheap = titleCase(o.cheapModel)
  const items = [
    o.mode === 'always' ? [true, 'Every request uses ' + cheap + '.'] : o.mode === 'off' ? [false, 'Switching to a cheaper model is off.'] : [true, 'Helpers move to ' + cheap + ' when context, a limit or a budget gets tight.'],
    [o.handoffBeforeCompact, o.handoffBeforeCompact ? 'A handoff note is written before every compaction, so nothing is lost.' : 'No handoff note before compaction.'],
    [o.tellClaude, o.tellClaude ? 'Claude is told where the budget stands once things get tight, and keeps its steps small.' : 'Claude isn’t told about the budget.'],
    [o.paceAlert, 'Alerts come only when a limit will run out early or passes ' + o.limitAlertAt + '%, once each.'],
    [o.autoCompactAt > 0, o.autoCompactAt > 0 ? 'The conversation compacts by itself at ' + o.autoCompactAt + '%, between turns.' : 'Claude Code compacts on its own when the window fills.'],
  ]
  if (o.sessionBudget > 0 || o.dailyBudget > 0) items.push([true, 'Budgets: ' + [o.sessionBudget > 0 ? fmtUsd(o.sessionBudget) + ' a session' : '', o.dailyBudget > 0 ? fmtUsd(o.dailyBudget) + ' a day' : ''].filter(Boolean).join(', ') + '. ' + (o.atBudget === 'hold' ? 'New prompts wait once one is reached.' : o.atBudget === 'cheaper' ? 'Work moves to ' + cheap + ' once one is reached.' : 'You’re warned once one is reached.')])
  return items
}

// Opens on the one thing to know about the setup: how much ToBeBestMe does by itself, and whether
// everything it reads could be read. What it does is the list; the settings that change it follow.
function settingsLead(k, d, act) {
  const items = autopilotItems(d)
  const on = items.filter(([isOn]) => isOn).length
  const src = d.sources || {}
  const bad = SOURCE_WORDS.filter(([key]) => src[key] && src[key].ok === false)
  const read = SOURCE_WORDS.filter(([key]) => src[key] && src[key].ok === true).length
  const headline = bad.length ? (bad.length === 1 ? 'One thing couldn’t be read' : bad.length + ' things couldn’t be read') : on === items.length ? 'Everything is on autopilot' : plural(on, 'thing is', 'things are') + ' on autopilot'
  const level = bad.length ? 'warning' : 'success'
  const facts = bad.length ? bad.map(([, label]) => label).join(', ') + '. An update to Claude Code may have changed it; the sections that use it say less until it can be read.' : (d.version ? 'Claude Code ' + d.version + '. ' : '') + (read ? 'Everything ToBeBestMe reads was read.' : 'Nothing has been read yet.')
  return lead(k, {
    glyph: k.text(level === 'success' ? '✓ ' : '● ', { color: level }),
    headline,
    facts,
    figure: { value: on + ' of ' + items.length, caption: 'on autopilot', level: 'success' },
    visual: [
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: items.map(([isOn, words]) => k.hang(k.text(isOn ? '✓' : '○', isOn ? { color: 'success' } : { dimColor: true }), k.text(words, { wrap: 'wrap', dimColor: isOn ? undefined : true }))),
      }),
    ],
  })
}

// The model that fits the work in front of you, with one press to use it here.
function modelCard(k, d, act) {
  const m = modelAdvice(d)
  // nothing to say until the first answer, unless there is something to do or Always is on
  if ((!m.main || m.main === 'unknown') && !m.rec.action && d.opts.mode !== 'always') return null
  return k.card('Right model for the job', m.main ? 'Now: ' + m.main + (m.mixWords ? ', ' + m.mixWords : '') + '.' : null, [
    k.Box({
      flexDirection: 'column',
      rowGap: 'xs',
      children: [
        k.text(m.rec.title, { weight: 'semibold', wrap: 'wrap' }),
        k.footnote(m.rec.detail),
        ...(m.rec.action ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('model-advice', m.rec.action.label, () => act.run(m.rec.action.key))])] })] : []),
      ],
    }),
    k.Box({
      flexDirection: 'column',
      rowGap: 'xs',
      children: MODEL_ROLES.map((r, i) =>
        // a narrow pane puts the model under the job instead of cutting the job short
        k.columns < 60 ? k.hoverBox('role-' + i, { flexDirection: 'column', width: '100%' }, [k.Text({ wrap: 'wrap', children: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(r.model)) }), k.text(r.stage)] }), k.footnote(titleCase(r.model) + (m.family === r.model ? ' · in use' : ''), m.family === r.model ? { weight: 'semibold', dimColor: undefined } : {})], { title: titleCase(r.model) + ' for ' + r.stage.toLowerCase(), lines: [titleCase(r.why) + '.'] }) :
        k.row(
          [{ parts: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(r.model)) }), r.stage] }, { text: titleCase(r.model) + (m.family === r.model ? ' · in use' : ''), width: 18, props: m.family === r.model ? { weight: 'semibold' } : { dimColor: true } }],
          {},
          { key: 'role-' + i, tip: { title: titleCase(r.model) + ' for ' + r.stage.toLowerCase(), lines: [titleCase(r.why) + '.', r.model === 'opus' ? 'Uses the limits fastest.' : r.model === 'haiku' ? 'Uses the limits most slowly.' : 'Uses the limits far more slowly than Opus.'] } },
        ),
      ),
    }),
  ], { gap: 'md' })
}

// A long run, planned before it starts: stages on the right models, checks and checkpoints, and a
// clean stop before a limit; then started here, following the /long-run playbook.
function longRunCard(k, d, act) {
  const goal = d.view.runGoal || ''
  const o = d.opts
  const body = []
  if (k.Input) body.push(k.Input({ key: 'run-goal', placeholder: 'What should the run get done? For example: move the API to v2 and update every caller, with tests.', value: goal, rows: 2, submitLabel: 'Plan run', onSubmit: (value) => act.setRunGoal(value) }))
  if (goal) {
    const fit = runFit(d)
    const steps = [
      'Plan on Opus: stages that each end in a check, written to .claude/runs/.',
      'Build on Sonnet, one stage at a time; ' + titleCase(o.cheapModel) + ' searches and reads.',
      'Check each stage before the next, and fix what fails.',
      'Checkpoint after every stage: the handoff note, and a compaction past ' + o.contextWarnAt + '%.',
      'Stop cleanly if a limit would run out early or passes ' + o.limitAlertAt + '%, and say when to resume.',
    ]
    body.push(
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('The plan', { size: 'footnote', weight: 'semibold', dimColor: true }), ...steps.map((s, i) => k.hang(k.text(String(i + 1), { weight: 'semibold', color: k.isTerminal ? 'suggestion' : TINT.purple }), k.text(s, { wrap: 'wrap' })))] }),
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Room in your limits', { size: 'footnote', weight: 'semibold', dimColor: true }), ...(fit.lines.length ? fit.lines.map((l) => k.footnote(l)) : [k.footnote('No usage limits reported; Spending keeps the cost in view.')]), k.text('Best start: ' + fit.start + '.', { weight: 'medium', wrap: 'wrap' })] }),
      k.buttons([k.button('run-start', 'Save /long-run and start here', () => act.startLongRun(goal), { variant: 'primary' }), k.button('run-save', 'Save the playbook as /long-run', act.saveLongRun, { dimColor: true })]),
      k.footnote('Starting saves the playbook as a skill in ~/.claude/skills/long-run (if it isn’t there yet), so any session can follow it, then puts the run in the prompt box for you to send.'),
    )
  } else {
    body.push(k.footnote('Describe the goal and press Return to see the plan and how far your limits stretch.'))
  }
  return k.card('Plan a long run', 'For work that takes hours: each stage on the right model, a check and a checkpoint after each, and a clean stop before a limit runs out.', body, { gap: 'md' })
}
