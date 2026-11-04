// tobebestme: the dashboard. Drawn from plain data (d) and actions (act) that
// hooks/register.js hands in; nothing here keeps state or calls $.
//
// Map of this file, in the order the sections run (search for the banner `// ---- name`):
//   (before any banner)   TABS and `kit`: the rows, cards, buttons and drawings every tab is built from
//   the frame             drawDashboard: the tab bar and which tab is drawn
//   This session          the chat's headline, its one main button, and the handoff, compact and fresh cards
//   Context               what fills the window
//   Usage                 what can run out, then what this chat spent (drawLobby, the phone's view, sits in here);
//                         the plan's limits
//   Skills, Settings      the two tabs that edit things
//   Home (helpers)        small helpers shared by Home's cards
//   Home (needs you)      what waits for you, and where each project got to
//   workflows             live runs, their agents and approvals, finished runs, savings, the Workflows tab
//   Home (the rest)       the week, the projects, the chats, the tour, and allTab, the tab itself
//   the band              the line above the prompt
//   calm                  what runs on its own, the right model and long runs (Settings cards)
//
// Layout rules: the answer first (one headline and its one best action). Every section is a
// card with an icon in its colour, a title and, where it helps, a line saying what it is for.
// Figures explain themselves on hover; the controls sit beside the figures they change;
// sections show only when they have something to show. Plain words throughout; colour for
// status and identity only, always with words beside it. Spacing comes from the parent
// (gap), in the surface's own steps, so the desktop breathes and the terminal stays compact.

import {
  cleanText,
  skillDraftRisks,
  SETTINGS,
  HANDOFF_PATH,
  HEX,
  CATEGORY_HEX,
  TINT,
  RING_HEX,
  WINDOW_MS,
  kindOfLabel,
  fmtTokens,
  fmtUsd,
  plural,
  fmtSpan,
  roughSpan,
  fmtTurnTime,
  fmtClock,
  toolName,
  titleCase,
  limitLabel,
  limitName,
  canRaiseListingBudget,
  nextListingBudget,
  fmtFraction,
  modeWords,
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
  drawTime,
  timelineTime,
  textRunway,
  svgForecast,
  svgWindow,
  svgWeek,
  svgSaving,
  svgMiniBar,
  habitIdeas,
  sparkline,
  modelHex,
  dayKey,
  dailyShare,
  dayShareWords,
  spendRates,
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
  figureHues,
  settleMotion,
  FLUID_PX,
  dayClip,
  pctText,
  pctAbout,
  shownPct,
  meterCells,
  fmtUsdRange,
  holdRange,
  holdSpan,
  noForecastWords,
  waitingCount,
  waitingParts,
  waitingTitle,
  DAY_MS,
  MIN_MS,
} from './lib.js'
import { lobbyData, reportAlt, reportData, svgReportCard } from './extras.js'

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
// Under this many columns a gauge in the line above the prompt is too short for the run-out drawing (the
// hatched stretch, the strand and the stop pile into a clump): it keeps the fill and the playhead alone.
const COMPACT_GAUGE_BELOW = 100
// Hover cards are dark in either theme, like the system's own tooltips, so they read the same
// over light and dark panes; rows under the pointer take a faint tint that suits both.
const TIP = { bg: '#2C2C2E', border: '#545458', text: '#F2F2F7', dim: '#D1D1D6', good: '#30D158' }
const ROW_HOVER = '#8E8E931F'
// A section's body sits on a faint grey fill, the system grey at 12%, which reads on a dark and on a
// light pane alike: the page has depth without every section boxed in its own colour.
const GROUP_BG = '#8E8E931F'
// A segmented control's track inside a section: half that fill, since it is drawn over the section's own, so
// the dim names of the choices not picked keep 4.5:1 against it in a dark pane (12% over 12% falls to 4.3:1).
const SEGMENT_BG = '#8E8E9310'

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

// What each drawing was last handed in a tab visit (the visit's token is `e.motionVisit`), by place in
// the page, so a redraw of an unchanged drawing hands the app the same markup again.
const SHOWN = new Map()
const SHOWN_CAP = 400
function settledOnce(e, p, seen) {
  if (!e.motionVisit) return settleMotion(p.source, e.motionAge)
  // a visit replaces the one before it in the same place (the pane or the band), so nothing piles up
  const place = e.motionVisit.split(/[:@]/)[0]
  for (const [key, v] of SHOWN) if (v.place === place && v.visit !== e.motionVisit) SHOWN.delete(key)
  // the same words and width can head more than one drawing: the nth of them is its own slot
  const slot = String(p.alt) + '|' + (p.width || '')
  const n = seen.get(slot) || 0
  seen.set(slot, n + 1)
  const key = e.motionVisit + '|' + slot + '|' + n
  const was = SHOWN.get(key)
  if (was && was.raw === p.source) return was.out
  const out = settleMotion(p.source, e.motionAge)
  if (SHOWN.size >= SHOWN_CAP) SHOWN.clear()
  SHOWN.set(key, { place, visit: e.motionVisit, raw: p.source, out })
  return out
}

// The surface's elements and the shapes the dashboard is built from.
export function kit(el, e, primary = { isTaken: false }) {
  const { Text, Button, Markdown, Code, Input, Link } = el
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
  // animation on instead of playing it again from the start. A drawing whose markup is the same as the
  // last redraw's in this visit is handed the markup it was handed then, byte for byte: settling writes
  // the tab's age into it, so settling it afresh would change a drawing nothing changed in and the app
  // would swap its image or rebuild its frame (a frame blinks and every loop starts over).
  const seen = e.motionSeen || (e.motionSeen = new Map()) // shared with a sub-kit, which copies `e`
  const Svg = (p) => {
    const source = settledOnce(e, p, seen)
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
  // apostrophes inside a word are drawn curly everywhere
  const text = (s, props = {}) => Text(clean({ ...props, children: [typeof s === 'string' ? s.replace(/(\w)'(\w)/g, '$1’$2') : s] }))
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
    // on the desktop they start at the edge of what they explain, never indented past its heading
    return lines.length || (t && t.el) ? [Box(clean({ flexDirection: 'column', rowGap: 'xs', paddingLeft: isTerminal ? 2 : undefined, children: [...lines.map((l) => footnote(l)), ...(t.el ? [t.el] : [])] }))] : []
  }

  const k = {
    Box, Text, Button, Markdown, Code, Input, Link, Svg, isTerminal, hasSvg, columns, px, text, footnote, guide,
    isRoomy: columns >= 90,
    // the look of a grouped body, for a row of tiles that is one group
    groupProps: isTerminal ? {} : { paddingX: 'md', paddingY: 'md', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true },
    // Keyboard shortcuts show as chips on desktop buttons; there they're noise, so only the terminal gets them.
    hotkey: (key) => (isTerminal ? key : undefined),
    // Words that tell a pointer user to point: left out on the terminal, and with Show details on, where what
    // the hover cards say is already in place and nobody needs to point.
    hint: (words) => (isTerminal || k.showDetails ? '' : words),
    // A Box that explains itself on hover: a faint tint under the pointer and a card above it.
    showDetails: false,
    details: inlineDetails,
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
            // the title and its accessory share a row; the line under them has the full width, so a long
            // one never squeezes the accessory into a sliver beside it
            Box({
              flexDirection: 'column',
              paddingX: isTerminal ? 0 : 'xs',
              children: [
                Box({
                  flexDirection: 'row',
                  columnGap: 'sm',
                  alignItems: 'center',
                  children: [
                    Box({ flexGrow: 1, flexShrink: 1, children: [text(title, { size: 'heading', weight: 'semibold', wrap: 'wrap' })] }),
                    ...(extra.accessory ? [extra.accessory] : []),
                  ],
                }),
                ...(subtitle ? [footnote(subtitle)] : []),
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
      // from 160 columns the two are even, so a label stays near its value instead of a hand's breadth from it
      const share = k.columns >= 160 ? 0.5 : 0.58
      const main = Math.floor(px * share)
      const parts = [k.sub(main), k.sub(px - main - 16)]
      for (const kk of parts) kk.mainShare = share
      return parts
    },
    // Two columns side by side: `main` beside `aside`, each stacked with the same gap as a page. With
    // nothing for the main column the aside is the page, in one column of the full width, so a lone card
    // never sits at the right of a blank half (callers that can draw it at the full width do that first).
    layout: (main, aside) => {
      const left = main.filter(Boolean)
      const right = aside.filter(Boolean)
      if (!left.length) return Box({ flexDirection: 'column', rowGap: 'lg', width: '100%', children: right })
      return Box({
        flexDirection: 'row',
        columnGap: 'lg',
        alignItems: 'flex-start',
        width: '100%',
        children: [
          Box({ flexDirection: 'column', rowGap: 'lg', width: Math.round((k.mainShare || 0.58) * 100) + '%', flexShrink: 0, children: left }),
          Box({ flexDirection: 'column', rowGap: 'lg', flexGrow: 1, flexShrink: 1, children: right }),
        ],
      })
    },
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
    // Label and value pairs, one per row: the value at the right on a wide pane, under its label on a narrow one,
    // so the label that says what the number is is never the part cut short.
    facts: (pairs, valueWidth = 40) =>
      Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: pairs.map(([label, value]) => (columns < 60 ? Box({ flexDirection: 'column', children: [text(label, { dimColor: true, wrap: 'wrap' }), text(value, { wrap: 'wrap', tabular: true })] }) : k.row([{ text: label, props: { dimColor: true } }, { text: value, width: valueWidth }]))),
      }),
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
      const cells = meterCells(value, max, 10)
      return Text({ children: [Text({ color: 'suggestion', children: ['▬'.repeat(cells)] }), Text({ dimColor: true, children: ['·'.repeat(Math.max(0, 10 - cells))] })] })
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
      // the cells are all filled only when the parts add up to the whole
      const room = parts.reduce((n, p) => n + p.value, 0) >= total ? width : width - 1
      const runs = parts.map((p) => {
        const cells = Math.max(0, Math.min(room - used, meterCells(p.value, total, width)))
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
    // `about` is the item a repeated button belongs to ("Set aside" on one of several chats), and `name` is the whole
    // name where the item is not what it needs: either is the button's name for a screen reader, while the short
    // words stay what is drawn.
    button: (key, label, onPress, props = {}) => {
      const { isTab, about, name, ...rest } = props
      if (rest.variant === 'primary' && !isTab) {
        if (primary.isTaken) rest.variant = undefined
        primary.isTaken = true
      }
      const named = name || (about ? label.replace(/[…›]$/, '') + ': ' + String(about).slice(0, 80) : '')
      return Button(clean(named && named !== label ? { key, label: named, onPress, children: [label], ...rest } : { key, label, onPress, ...rest }))
    },
    buttons: (children) => Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'sm', children }),
    // The track a segmented control sits in: one rounded group, the open choice filled and the others quiet text. The
    // tab bar and every choice in the pane (On and Off, a preset, a view of a list) are drawn in it, so a choice
    // looks the same wherever it is made.
    track: (children, props = {}) =>
      Box(clean({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'xs', paddingX: 'xs', paddingY: 'xs', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true, ...props, children })),
    // A segmented control: one Button per option. On desktop the one in force is the filled one; the terminal has no
    // fill, so it checks it and dims the others until the pointer or the focus is on them.
    // `group` names what the choice is for ("Send notifications"): on desktop the drawn words stay "On" and
    // "Off", while the button's name for a screen reader is "Send notifications: On, selected".
    segmented: (prefix, options, current, onPick, group = '') => {
      const buttons = options.map((o) => {
        const isOn = o.value === current
        const named = group ? group + ': ' + o.label + (isOn ? ', selected' : '') : isOn ? o.label + ', selected' : o.label
        return Button(clean(isTerminal ? { key: prefix + '-' + o.value, label: (isOn ? '✓ ' : '') + o.label, dimColor: isOn ? undefined : true, onPress: () => onPick(o.value) } : { key: prefix + '-' + o.value, label: named, children: [o.label], plain: isOn ? undefined : true, dimColor: isOn ? undefined : true, onPress: () => onPick(o.value) }))
      })
      // in a row of its own, so the track is as wide as its buttons and not as wide as the column it is in
      if (isTerminal) return Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'sm', children: buttons })
      // four or more choices do not fit one row of a phone: two rows of two, so a name is never split from its control
      if (columns < 60 && buttons.length >= 4) {
        const half = Math.ceil(buttons.length / 2)
        // every cell as wide as the longest choice, in characters, so the two rows line up in columns
        const cellCh = Math.max(...options.map((o) => String(o.label).length)) + 4
        // both rows have the same number of equal cells, the short one padded, so the choices sit in columns
        const line = (cells) => Box({ flexDirection: 'row', columnGap: 'sm', children: [...cells, ...Array(half - cells.length).fill(null)].map((b) => Box({ flexGrow: 1, flexShrink: 1, width: cellCh, alignItems: 'center', justifyContent: 'center', children: b ? [b] : [] })) })
        return Box({ flexDirection: 'row', children: [k.track([Box({ flexDirection: 'column', rowGap: 'xs', flexGrow: 1, children: [line(buttons.slice(0, half)), line(buttons.slice(half))] })], { flexGrow: 1, backgroundColor: SEGMENT_BG })] })
      }
      return Box({ flexDirection: 'row', children: [k.track(buttons, { backgroundColor: SEGMENT_BG })] })
    },
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

// The context's fullness to the fraction: the dashboard's own percent is rounded, and a rounded 100 reads as full.
function withExactPct(d) {
  return d.tokens > 0 && d.window > 0 ? { ...d, pct: Math.min(100, (d.tokens / d.window) * 100) } : d
}

export function drawDashboard(k, d, act) {
  d = withExactPct(d)
  SHARE = costShare(d)
  k.showDetails = !!d.view.showDetails
  const wanted = OLD_TABS[d.view.tab] || d.view.tab
  const tab = TABS.some((t) => t.id === wanted) ? wanted : 'all'
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
      name: !k.isTerminal && t.id === tab ? t.label + ', open' : undefined,
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
  // on a phone six names do not fit one row: they are laid out as two rows of three, in columns, so no name
  // is left alone on a line, and Show details has the row under them to itself
  const isPhone = !k.isTerminal && k.columns < 60
  const track = k.isTerminal
    ? k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', children: tabs })
    : isPhone
      ? k.track(tabs.map((t) => k.Box({ width: '33%', children: [t] })), { width: '100%', columnGap: undefined })
      : k.track(tabs)
  return k.Box({
    flexDirection: 'column',
    paddingX: k.isTerminal ? 0 : 'md',
    paddingY: k.isTerminal ? 0 : 'sm',
    rowGap: k.isTerminal ? 'md' : 'lg',
    children: [
      isPhone ? k.Box({ flexDirection: 'column', rowGap: 'sm', children: [track, k.Box({ flexDirection: 'row', justifyContent: 'flex-end', children: [details] })] }) : k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'sm', alignItems: 'center', children: [track, k.Box({ flexGrow: 1 }), details] }),
      // the terminal marks the open tab by its look alone, so the keys that move between them are said once
      ...(k.isTerminal ? [k.footnote('Keys 1–6 switch tabs, d shows details.')] : []),
      changeCard(k, d, act, tab),
      ...body.filter(Boolean),
    ],
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

// The big figure of a head, drawn on desktop in a gradient, with a glow under the digits while it is live. Its colours are its status's
// (figureHues): amber once what it measures is past its alert, red when it is nearly out, green when all is well,
// the neutral accent when it is information and no status. It is bold and it says something; a colour is never
// chosen for the look of it. Null on the terminal, which stays plain, and where the value would not fit its half of
// the row (the plain text figure truncates there instead).
function heroFigure(k, value, { size = 34, level, align, isLive } = {}) {
  if (!k.hasSvg) return null
  const room = Math.floor(k.px * (k.columns >= 90 ? 0.5 : 0.9))
  const fit = Math.min(size, Math.floor(room / Math.max(1, String(value).length * 0.62)))
  if (fit < 20) return null
  // the glow marks what is live now: something working, or a limit at its critical level; a settled value has the gradient alone
  const src = svgFigure(value, { size: fit, align: align || 'start', hexes: figureHues(level), isGlowing: !!isLive || level === 'error' })
  return k.drawing(src, String(value))
}

function runwayBar(k, it, where, widthPx) {
  const r = it.runway
  const words = it.label + ' ' + it.valueText + (r.runOut !== null && r.runOut !== undefined ? ', runs out before it resets' : r.projected !== null && r.projected !== undefined ? ', on pace for ' + pctAbout(r.projected) + ' by the reset' : r.elapsed !== null && r.elapsed !== undefined ? ', ' + pctText(r.elapsed, true) + ' of the window gone' : '')
  // the calendar is drawn at the column's reckoned width, at exactly the size it was made
  if (k.hasSvg && it.window && widthPx && widthPx >= 280) return k.Box({ width: '100%', children: [k.drawing(svgWindow({ ...r, hex: it.hex, ...it.window, days: it.days }, { width: Math.round(widthPx) }), words + (it.daysAlt || ''), { isInteractive: it.days ? true : undefined })] })
  // a runway has no words in it, so it is made wide and drawn at whatever width its slot has
  if (k.hasSvg) return k.Box({ width: '100%', children: [k.Svg({ source: svgRunway({ ...r, hex: it.hex }, { width: widthPx || 4000, height: 14, isFluid: true, isCompact: where === 'band' && k.columns < COMPACT_GAUGE_BELOW }), alt: words, height: 14, ...(widthPx ? { width: widthPx } : {}) })] })
  return k.Text({ children: textRunway(r, where === 'band' ? 10 : 20).map(([t, c]) => k.text(t, c ? { color: c } : {})) })
}

function levelAt(d, pct) {
  const shown = shownPct(pct)
  return shown >= d.opts.cheaperModelAt ? 'error' : shown >= d.opts.contextWarnAt ? 'warning' : 'success'
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
  // the figure sits under the headline at every width, as on Home, so a tab never moves it
  const isWide = false
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
  // a status colours the plain text figure and its caption too (the terminal's); good and information leave them as they are
  const figureLevel = f && f.level && f.level !== 'success' && f.level !== 'info' ? f.level : undefined
  const big = f ? heroFigure(k, f.value, { size: 36, level: f.level, isLive: f.isLive || o.isLive }) : null
  const figureBody = f
    ? [
        big || k.text(f.value, { size: 'title', weight: 'semibold', tabular: true, color: figureLevel, wrap: 'truncate-end' }),
        k.footnote(f.caption, { wrap: 'truncate-end', ...(figureLevel ? { color: figureLevel, dimColor: undefined } : {}) }),
        ...(f.sub ? [k.footnote(f.sub, { wrap: 'wrap', tabular: true })] : []),
      ]
    : []
  const figure = f
    ? k.Box({
        flexDirection: 'column',
        alignItems: isWide ? 'flex-end' : 'flex-start',
        ...(isWide ? { flexShrink: 0, paddingLeft: 'lg' } : { flexShrink: 1, width: '100%', paddingTop: 'xs' }), // a long line under a figure wraps in the pane's width
        // its card opens on the side the figure sits on: toward the pane's edge on a wide one, from the left under the words on a narrow one
        children: f.tip ? [k.hoverBox('lead-figure', { flexDirection: 'column', alignItems: isWide ? 'flex-end' : 'flex-start' }, figureBody, { ...f.tip, align: isWide ? 'right' : 'left' })] : figureBody,
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
      ...(extra.meter ? [k.meter([{ value: extra.meter.value, hex: extra.meter.level === 'success' ? HEX.bar : HEX[extra.meter.level], color: extra.meter.level === 'success' ? 'suggestion' : extra.meter.level }], 100, [], label + ' ' + pctText(extra.meter.value), true)] : []),
      k.footnote(detail, { tabular: true }),
    ],
    extra.tip ? { align: extra.align || 'right', ...extra.tip } : null, // a left tile's card opens on the right
  )
}

function tiles(k, list) {
  return k.tileRow(list, { rowGap: 'md' })
}

const CONFIRMS = {
  compact: ['Shrink this chat to a summary? A handoff note is written first.', 'Compact chat', 'compact'],
  fresh: ['Start a fresh chat? A handoff note is written, the chat is cleared, and the prompt box asks Claude to carry on from the note.', 'Start fresh', 'fresh'],
  reset: ["Clear this chat's numbers? Spending history across days is kept.", 'Reset numbers', 'reset'],
  defaults: ['Put every setting back to its default? Claude Code reloads ToBeBestMe after each one it changes, so this takes a few seconds and the dashboard may blink.', 'Restore defaults', 'restoreDefaults'],
  forget: ['Forget everything ToBeBestMe stored on this computer? That is spending by chat, excerpts of prompts, recaps and questions read from your projects, and its readings. Your settings and Claude Code’s own files stay.', 'Forget stored data', 'forgetStored'],
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
  if (Number.isNaN(at)) return 'No handoff note yet. One is written before a compaction.'
  return 'Handoff note written ' + fmtSpan(d.now - at) + ' ago' + (d.note.reason ? ', ' + d.note.reason : '') + '.'
}

// Write a note, start fresh, compact: the three ways to carry on with less, in one card on This session and
// nowhere else. `primary` is the one the headline asks for ('fresh', 'compact' or 'handoff'), drawn as the
// view's main button.
const SHRINK_KEYS = ['fresh', 'compact', 'note']
function shrinkBody(k, d, act, primary) {
  const main = (key) => (primary === key ? { variant: 'primary' } : {})
  return [
    k.text(noteStatus(d), { wrap: 'wrap' }),
    k.footnote('It is saved in this project, at ' + HANDOFF_PATH + '.'),
    k.buttons([
      k.button('handoff', 'Write handoff note', act.writeNote, { hotkey: k.hotkey('n'), ...main('handoff') }),
      k.button('fresh', 'Start fresh…', () => act.setView({ confirm: 'fresh' }), { hotkey: k.hotkey('f'), ...main('fresh') }),
      k.button('compact', 'Compact now…', () => act.setView({ confirm: 'compact' }), { hotkey: k.hotkey('c'), ...main('compact') }),
      ...(d.note.text ? [k.button('note', d.view.showNote ? 'Hide note' : 'Show note', act.toggleNote, { hotkey: k.hotkey('s'), dimColor: true })] : []),
    ]),
    ...confirmRows(k, d, act, ['compact', 'fresh']),
    ...(d.note.text && d.view.showNote ? [k.Box({ borderStyle: k.isTerminal ? undefined : 'round', borderDimColor: k.isTerminal ? undefined : true, paddingX: k.isTerminal ? 0 : 'md', children: [k.Markdown({ key: 'note-text', text: d.note.text })] })] : []),
    ...(d.note.text && d.view.showNote && d.note.isCut ? [k.footnote('Preview only. The full note is at ' + HANDOFF_PATH + '.')] : []),
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
  if (r.label === 'Auto-compaction') return turns ? 'Claude Code compacts this chat in about ' + turns[1] : 'Claude Code is likely to compact this chat within a turn'
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
  const words = 'Context window, ' + pctText(d.pct) + ' full: ' + fmtTokens(d.tokens) + ' of ' + fmtTokens(d.window) + ' tokens' + (cAt ? '. Claude Code compacts at ' + fmtTokens(cAt) : '') + (pace && pace.turns !== null ? ', about ' + plural(pace.turns, 'turn', 'turns') + ' away at this pace' : '') + '.'
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
        turns: series.map((t) => ({ context: t.context, hex: tint(RING_HEX.context, levelAt(d, (t.context / d.window) * 100)), title: fmtClock(t.at, d.now) + ': ' + fmtTokens(t.context) + ' tokens (' + pctText((t.context / d.window) * 100) + ')' })),
        labels: { now: 'Now ' + fmtTokens(d.tokens), compact: cAt ? 'Compacts at ' + fmtTokens(cAt) : '', end: fmtTokens(d.window) },
      },
      { width: Math.round(k.px - 8) },
    )
    return k.Box({ width: '100%', children: [k.drawing(src, words, { isInteractive: true })] })
  }
  return k.Text({ children: textRunway({ used: d.pct, elapsed: null, runOut: null, ticks: [d.opts.contextWarnAt, cAt ? Math.round((cAt / d.window) * 100) : d.opts.cheaperModelAt] }, 30).map(([t, c]) => k.text(t, c ? { color: c } : {})) })
}

// What answers the headline: the suggestion about whatever is first to run out (for the context, starting fresh),
// so the view's one main button is the fix for what the headline says. Null when nothing says how to fix it.
function headlineFix(d, first) {
  if (first.label === 'Auto-compaction' || first.label === 'Context') {
    const own = (key) => d.advice.find((a) => a.action && a.action.key === key)
    return (
      own('fresh') ||
      own('compact') || {
        level: first.level,
        title: 'Start fresh from a handoff note',
        detail: 'Every request sends the whole chat again. A fresh start, with a note of the goal and next steps, makes each later turn cheaper, and Claude Code does not have to compact at a moment you did not choose.',
        action: { key: 'fresh', label: 'Start fresh…' },
      }
    )
  }
  return d.advice.find((a) => a.title.startsWith(first.label)) || null
}

// Where a suggestion's button lives when this tab has a control for the same thing: the suggestion says so and links
// to it, so each control has one home. [the card it is in, the key of its button there]
const ADVICE_HOMES = {
  'fresh|Start fresh…': ['Make the chat smaller', 'handoff'],
  'compact|Compact now…': ['Make the chat smaller', 'handoff'],
  'note|Write handoff note': ['Make the chat smaller', 'handoff'],
  'mcp|Manage MCP servers': ['Always loaded', 'manage-mcp'],
  'skills|Review skills': ['Always loaded', 'review-skills'],
}

function overviewTab(k, d, act) {
  const h = d.health
  const hc = homeContext(d)
  const pace = contextPace(d)
  const first = d.outlook.find((r) => r.isFirst)
  const level = ctxLevel(d)
  // a workflow asking for its go-ahead blocks work until it is answered, so it is the headline, as it is on Home
  const approval = d.flows && d.flows.approval

  // the verdict: whichever of the context window, a limit or a budget is first to run out, else room
  // (past the context's own warning with no turn count to give, the window's fullness is what it says: never "room" in a warning colour)
  const verdict = approval ? 'A workflow is waiting for your go-ahead' : first ? rowVerdict(first) : pace && pace.turns !== null && pace.turns > 3 ? 'Room for about ' + plural(pace.turns, 'more turn', 'more turns') : d.window > 0 && level !== 'success' ? 'The window is ' + pctText(d.pct) + ' full' : pace && pace.free > 0 ? 'Room to keep going' : d.window > 0 ? 'The window is full' : 'Waiting for the first answer'
  const vLevel = approval ? 'warning' : first ? first.level : level === 'success' ? 'success' : level
  // what to do about it: the fix for the headline when there is one, else the most pressing suggestion, and no
  // "all good" over a problem the headline names. A headline about the context window (its alert, with or without
  // a row of its own) is fixed by a smaller conversation.
  const about = first || (!approval && d.window > 0 && level !== 'success' && !(pace && pace.turns !== null && pace.turns > 3) ? { label: 'Context', level } : null)
  const fix = !approval && about ? headlineFix(d, about) : null
  const item = approval ? null : fix || h.item
  const isShrink = !!item && !!item.action && SHRINK_KEYS.includes(item.action.key)
  const rates = spendRates(d)
  const last = d.turns[d.turns.length - 1]
  const facts = [
    d.window > 0 ? fmtTokens(d.tokens) + ' of ' + fmtTokens(d.window) + ' tokens (' + pctText(d.pct) + ')' : '',
    compactAt(d) ? 'compacts at ' + fmtTokens(compactAt(d)) : '',
    rates.average !== null ? (SHARE ? 'this chat uses about ' + cost(rates.average) + ' of the weekly limit an hour' : cost(rates.average) + ' an hour on average') : '',
  ].filter(Boolean)
  const budgetLevel = d.opts.sessionBudget > 0 && d.usd >= d.opts.sessionBudget ? 'error' : d.opts.sessionBudget > 0 && d.usd >= d.opts.sessionBudget * 0.8 ? 'warning' : 'success'
  // the suggestion as a line of words: its dot, its title, what it says and what it saves
  const said = (kk, a, more = []) =>
    kk.hang(
      kk.dot(a.level),
      kk.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [kk.text(a.title, { weight: 'semibold', wrap: 'wrap' }), kk.guide(a.detail), ...(a.gain ? [gainLine(kk, a.gain)] : []), ...more],
      }),
    )
  const goAhead = () => k.hang(
    k.dot('warning'),
    k.Box({
      flexDirection: 'column',
      rowGap: 'xs',
      children: [
        k.text('Claude wants to run ' + (approval && approval.preview.name ? '“' + approval.preview.name + '”' : 'a workflow'), { weight: 'semibold', wrap: 'wrap' }),
        k.guide('It will not start until you answer in the chat: Run workflow, Run every agent on Sonnet or Don’t run.'),
        k.Box({ marginTop: 'xs', children: [k.buttons([k.button('flow-answer', 'Go to the chat to answer', act.answerInChat, { variant: 'primary' }), k.button('flow-see', 'Open Workflows', act.openWorkflows, { plain: true, dimColor: true })])] }),
      ],
    }),
  )
  // a button for the headline's fix, or the suggestion's own button: main only when it answers what the headline says
  const fixButton = (a, isMain) => (a.action && !isShrink ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('hero-action', a.action.label, () => act.run(a.action.key), isMain ? { variant: 'primary' } : {})])] })] : [])
  const head = lead(k, {
    glyph: vLevel === 'success' || vLevel === 'info' ? k.text('✓ ', { color: 'success' }) : k.text('● ', { color: vLevel }),
    headline: verdict,
    facts: facts.join(' · ') + '.',
    factsTip: { title: 'Context, ' + pctText(d.pct) + ' full', lines: ['Everything Claude re-reads on each turn: the fuller it is, the more a turn costs.', 'The cost is Claude Code’s own count, as /cost shows it: on a subscription the API-price equivalent, not a bill.', d.modelWindow && d.window && d.window < d.modelWindow ? 'Measured against the ' + fmtTokens(d.window) + ' window compaction works to, not the model’s ' + fmtTokens(d.modelWindow) + '.' : '', pace && pace.per ? 'Recent turns added about ' + fmtTokens(pace.per) + ' tokens each.' : 'A turn count shows after a few turns.'], align: 'left' },
    figure: { value: cost(d.usd), caption: (SHARE && !/worth$/.test(cost(d.usd)) ? 'of your weekly limit · ' : '') + 'this chat' + (last ? ' · +' + cost(last.usd || 0) + ' last turn' : ''), sub: Math.abs(d.today - d.usd) >= 0.005 ? 'Today, ' + todayScope(d).short + ': ' + cost(d.today) : '', level: d.opts.sessionBudget > 0 ? budgetLevel : 'info', isLive: !!d.isTurnRunning },
    visual: [
      contextVisual(k, d, pace, level),
      ...hc.windows.map((x, i) => limitRow(k, d, hc, x, i)),
      ...shareLines(k, d),
      // what to do about it: the one suggestion that answers the headline, with its one main button
      ...(approval ? [goAhead()] : item && !isShrink ? [said(k, item, fixButton(item, !!fix))] : !first && !h.item ? [said(k, { level: h.level, title: h.title, detail: h.detail })] : []),
    ].filter(Boolean),
  })

  // each section is drawn by a function of the kit, so a wide pane can draw it for its own column
  const ways = (kk) => {
    // a note to write is said by the card that writes it (it shows whether there is one), so it is not said twice
    const more = d.advice.filter((a) => a !== item && !(a.action && a.action.key === 'note'))
    if (!more.length) return null
    const shown = d.view.showMore ? more : more.slice(0, 3)
    return kk.card('More ways to save', null, [
      ...shown.map((a, i) => {
        const home = a.action && ADVICE_HOMES[a.action.key + '|' + a.action.label]
        // a control this tab already has is linked to, not drawn twice
        const button = !a.action ? [] : home ? [kk.button('advice-' + i, home[0] + ' ›', () => act.setView({ focus: home[1] }), { plain: true, dimColor: true })] : [kk.button('advice-' + i, a.action.label, () => act.run(a.action.key))]
        return said(kk, a, button.length ? [kk.Box({ marginTop: 'xs', children: [kk.buttons(button)] })] : [])
      }),
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
    return won.length ? kk.card('Wins this chat', 'What ToBeBestMe has saved you so far.', won.map((w) => kk.hang(kk.text('✓', { color: 'success' }), kk.text(w, { wrap: 'wrap' })))) : null
  }
  // the one home of write a note, start fresh and compact. When the headline's fix is one of them it is drawn first,
  // with the reason for it and its button as the view's main one
  const shrink = (kk) =>
    kk.card('Make the chat smaller', 'A handoff note keeps the goal and next steps, so a smaller chat picks up where you left off.', [
      ...(isShrink ? [said(kk, item)] : []),
      ...shrinkBody(kk, d, act, isShrink && fix ? (item.action.key === 'note' ? 'handoff' : item.action.key) : undefined),
    ], { gap: 'md' })
  const recent = (kk) => {
    if (!d.activity.length) return null
    const all = [...d.activity].reverse()
    const shown = d.view.showAllActivity ? all : all.slice(0, 4)
    return kk.card('Recent activity', 'What happened this chat, with each figure as it was at the time.', [
      ...shown.map((a) => kk.hang(kk.dot(a.level), kk.text(a.text, { wrap: 'wrap' }), kk.footnote(fmtClock(a.at, d.now), { tabular: true, wrap: 'truncate-end' }))),
      kk.buttons([...(all.length > 4 ? [kk.button('activity-more', d.view.showAllActivity ? 'Show fewer' : 'Show all ' + all.length, act.toggleActivity, { dimColor: true })] : []), kk.button('activity-clear', 'Clear activity', act.clearActivity, { dimColor: true })]),
    ], { keepCaption: true })
  }

  // what fills the window sits on this tab too, below the things to act on
  if (k.isTerminal || k.columns < SPLIT_AT) {
    const c = contextBlocks(k, d, act)
    return [head, ...(isShrink ? [shrink(k)] : []), ways(k), modelCard(k, d, act), longRunCard(k, d, act), howLong(k), c.context, c.per, c.loaded, winsCard(k), ...(isShrink ? [] : [shrink(k)]), recent(k)].filter(Boolean)
  }
  const [km, ka] = k.split()
  const cm = contextBlocks(km, d, act)
  const ca = contextBlocks(ka, d, act)
  // the two columns end together: the model card and what is always loaded sit beside the long run and the context
  return [head, km.layout([...(isShrink ? [shrink(km)] : []), ways(km), longRunCard(km, d, act), cm.context], [howLong(ka), modelCard(ka, d, act), ca.per, winsCard(ka), ...(isShrink ? [] : [shrink(ka)]), recent(ka), ca.loaded])]
}

// Today's share of the weekly limit, said calmly: the pace that lasts, and where today stands.
function shareLines(k, d) {
  const l = d.limits.find((x) => x.r.kind === 'seven_day') || d.limits.find((x) => /seven_day/.test(x.r.kind))
  const s = l ? dailyShare(l, (d.limitHistory && d.limitHistory[l.r.kind]) || [], d.now) : null
  if (!s) return []
  return [k.Text({ wrap: 'wrap', children: [...(s.isOver ? [k.text('● ', { color: 'warning' })] : []), k.text('Weekly limit: ' + shareSentence(s), { size: 'footnote' })] })]
}

// What tobebestme has actually saved this session, in its own words.
function wins(d) {
  const out = []
  if (d.wins.compactions) out.push(plural(d.wins.compactions, 'compaction', 'compactions') + (d.wins.tokensFreed ? ' freed ' + fmtTokens(d.wins.tokensFreed) + ' tokens from every later turn' : ' kept the chat lean'))
  if (d.routing.spawnsForced) out.push(plural(d.routing.spawnsForced, 'helper', 'helpers') + ' ran on ' + titleCase(d.opts.cheapModel) + ' instead of a pricier model')
  if (d.routing.rerouted) out.push(plural(d.routing.rerouted, 'main request', 'main requests') + ' went to ' + titleCase(d.opts.cheapModel))
  if (d.routing.effortLowered) out.push(plural(d.routing.effortLowered, 'request', 'requests') + ' thought less once context got large')
  const totals = Object.values(d.models).reduce((t, r) => ({ requests: t.requests + r.requests, input: t.input + r.input + r.cacheRead + r.cacheWrite, cacheRead: t.cacheRead + r.cacheRead }), { requests: 0, input: 0, cacheRead: 0 })
  if (totals.requests >= 3 && totals.input > 0 && totals.cacheRead / totals.input >= 0.6) out.push(pctText((totals.cacheRead / totals.input) * 100) + ' of input came from the cache, at a tenth of the price or less')
  // counted as they happen, not from the activity list, which can be cleared
  if (d.wins.notes) out.push(plural(d.wins.notes, 'handoff note', 'handoff notes') + ' saved, so nothing is lost when the chat shrinks')
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
  const lines = [info.what, fmtTokens(r.tokens) + ' tokens, ' + pctText(total > 0 ? (r.tokens / total) * 100 : 0, true) + ' of the window.']
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
    lines.push(plural(b.skills.includedSkills, 'skill', 'skills') + ' listed, ' + plural(used, 'skill', 'skills') + ' used this chat.')
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
  const share = (n) => (parts.total > 0 ? pctText((n / parts.total) * 100) : '')
  const b = d.breakdown
  const cAt = compactAt(d)
  const swatch = (hex, color) => k.text(hex ? '■ ' : '□ ', hex ? { color: k.isTerminal ? color : midHex(hex) } : { dimColor: true })
  const biggest = Math.max(1, ...parts.rows.map((r) => r.tokens))
  const barW = k.columns >= 72 ? 18 : 10
  const legend = [k.heads([{ text: 'What fills it' }, { text: '', width: barW }, { text: 'Tokens', width: 9 }, { text: 'Share', width: 7 }])]
  parts.rows.forEach((r, i) => legend.push(k.row([{ parts: [swatch(r.hex, r.color), r.name] }, { el: k.bar(r.tokens, biggest, r.hex, r.name + ' ' + fmtTokens(r.tokens)), width: barW }, { text: fmtTokens(r.tokens), width: 9 }, { text: share(r.tokens), width: 7 }], {}, { key: 'cat-' + i, tip: categoryTip(d, r, parts.total) })))
  if (parts.rows.length) legend.push(k.row([{ parts: [swatch(null), 'Free space'] }, { text: '', width: barW }, { text: fmtTokens(free), width: 9 }, { text: share(free), width: 7 }], { dimColor: true }, { key: 'cat-free', tip: { title: 'Free space', lines: [categoryInfo('Free space').what, cAt && cAt > d.tokens ? 'Claude Code compacts after another ' + fmtTokens(cAt - d.tokens) + ' tokens.' : ''] } }))
  if (parts.buffer) legend.push(k.row([{ parts: [swatch(null), k.columns >= 60 ? 'Of that, kept for compaction' : 'Held back'] }, { text: '', width: barW }, { text: fmtTokens(parts.buffer), width: 9 }, { text: share(parts.buffer), width: 7 }], { dimColor: true }, { key: 'cat-buffer', tip: { title: 'Kept free for compaction', lines: [categoryInfo('Autocompact buffer').what] } }))

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
        'Context ' + pctText(d.pct) + ' full: ' + parts.rows.map((r) => r.name + ' ' + fmtTokens(r.tokens)).join(', '),
      ),
      k.footnote('Marks: warning at ' + o.contextWarnAt + '% · cheaper model at ' + o.cheaperModelAt + '%' + (cAt ? ' · auto-compaction at ' + fmtTokens(cAt) : '') + k.hint('. Point at a part or a row for more.')),
      k.Box({ flexDirection: 'column', marginTop: 'sm', children: legend }),
      ...(parts.isMeasured ? [] : [k.footnote('The breakdown by category appears once Claude Code has measured it.')]),
    ]),
  )

  const withSize = d.turns.filter((t) => t.context > 0)
  const last = d.turns[d.turns.length - 1]
  const lastInput = last ? (last.input || 0) + (last.cacheRead || 0) + (last.cacheWrite || 0) : 0
  const reuse = last && lastInput > 0 && typeof last.cacheRead === 'number' ? (last.cacheRead / lastInput) * 100 : null
  const shownSize = withSize.slice(-CHART_SLOTS)
  put('per',
    !(reuse !== null || shownSize.length >= 4) ? null : k.card('Per request', 'About ' + fmtTokens(d.tokens) + ' tokens go with every request now.', [
      ...(reuse !== null ? [k.footnote(pctText(reuse) + " of the last turn's input came from the cache, which costs a tenth as much or less.")] : []),
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
      groups.push(group(k, 'Memory files', memory.map((m, i) => k.row([{ text: (m.path.split('/').pop() || m.path) + ' (' + m.type + ')' }, loadedBar(m.tokens, m.path), { text: fmtTokens(m.tokens), width: 9 }], {}, { key: 'memory-' + i, tip: { title: m.path.split('/').pop() || m.path, lines: [m.path, fmtTokens(m.tokens) + ' tokens, read at the start of every chat.'] } })), [k.button('edit-memory', 'Edit memory', () => act.run('memory'))]))
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
    const kind = kindOfLabel(w.label)
    // the window's own label stays on it: two weekly windows (all models, one model) are not one limit
    const r = { kind, label: w.label, percentUsed: w.pct, resetsAt: w.resetsAt ? new Date(w.resetsAt).toISOString() : undefined }
    const o = limitOutlook(r, null, drawTime(d.now))
    return { r, o, level: limitLevel(r, o, d.opts) }
  })
}

// A limit's colour: a plan window by its own label, any other by its kind.
function limitHex(r) {
  return r.label ? planHex(r.label) : RING_HEX[r.kind] || planHex(r.kind)
}

// The one that matters most: the soonest to run out early, else the fullest.
function leadLimit(limits) {
  const early = limits.filter((l) => isEarly(l.r, l.o)).sort((a, z) => a.o.fullAt - z.o.fullAt)[0]
  return early || [...limits].sort((a, z) => z.r.percentUsed - a.r.percentUsed)[0] || null
}

// A bar split into parts with its legend under it, for "where it went": each part says what it is on
// hover, and the legend says it in words with the share. The bar's own name says the same shares, on the
// same basis the title names (the share of the week's work, not of the limit).
function splitBar(k, title, parts) {
  const total = parts.reduce((n, p) => n + p.value, 0)
  if (!(total > 0)) return null
  const glyphs = ['█', '▓', '▒', '░', '▪']
  const pct = (v) => pctText((v / total) * 100)
  const alt = title + ': ' + parts.map((p) => p.name + ' ' + pctText((p.value / total) * 100, true)).join(', ') + '.'
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
function usageWhere(k, d, h, hasWindow = false) {
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
          // the days are a rolling week ending today, not the limit's own window (which begins when it last reset); the dashed line is the mean
          k.footnote('Each of the past 7 days, by project: a rolling week ending today' + (hasWindow ? ', not the limit’s window above' : '') + '. The dashed line is the average, ' + cost(mean) + ' a day.', { wrap: 'wrap' }),
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
  const projects = splitBar(k, 'Share of the past 7 days’ work, by project', [...shownProjects.map((p) => ({ name: p.name, value: p.week, hex: hueOf(h, p.key) })), ...(rest > 0 ? [{ name: 'other projects', value: rest, hex: OTHER_HEX }] : [])])
  const families = {}
  for (const [m, usd] of u.models) {
    const name = modelName(m).replace(/ [\d.]+$/, '')
    families[name] = families[name] || { name, value: 0, hex: modelHex(m) }
    families[name].value += usd
  }
  const helped = u.kinds.helpers + u.kinds.workflows
  const models = splitBar(k, 'Share of the past 7 days’ work, by model', Object.values(families).sort((a, z) => z.value - a.value))
  if (projects) out.push(projects)
  if (models) out.push(models)
  if (helped > 0) out.push(k.footnote('Helpers and workflow agents did ' + pctText((helped / Math.max(0.0001, u.kinds.main + helped)) * 100) + ' of the week’s work.'))
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
    const p = pctText(r.percentUsed)
    const what = 'week'
    level = main.level
    if (o.isUsedUp) {
      headline = limitName(r) + ' is used up until it resets'
      facts = [o.resetAt !== null ? 'resets ' + fmtClock(o.resetAt, d.now) : '']
    } else if (isEarly(r, o)) {
      headline = limitName(r) + ' on pace to run out ' + fmtClock(o.fullAt, d.now)
      facts = [o.resetAt !== null ? roughSpan(o.resetAt - o.fullAt) + ' before it resets' : '', o.resetAt !== null ? 'resets ' + fmtClock(o.resetAt, d.now) : '']
    } else if (o.atReset !== null) {
      headline = 'On pace to end the ' + what + ' at ' + pctAbout(Math.min(100, o.atReset))
      facts = [limitName(r) + ' is ' + p + ' used', o.resetAt !== null ? 'resets ' + fmtClock(o.resetAt, d.now) : '']
    } else {
      headline = limitName(r) + ' is ' + p + ' used'
      facts = [noForecastWords(r, o).replace(/\.$/, '')]
    }
    glyph = level === 'success' || level === 'info' ? k.text('✓ ', { color: 'success' }) : k.text('● ', { color: level })
    chart = limitChart(k, d, main)
  } else {
    const budget = d.opts.dailyBudget > 0 ? { label: 'Daily budget', cap: d.opts.dailyBudget, spent: d.todayBudget, counted: ' counted toward it today' } : d.opts.sessionBudget > 0 ? { label: 'Chat budget', cap: d.opts.sessionBudget, spent: d.usd, counted: '' } : null
    level = budget ? (budget.spent >= budget.cap ? 'error' : budget.spent >= budget.cap * 0.8 ? 'warning' : 'success') : 'success'
    headline = budget ? (budget.spent >= budget.cap ? budget.label + ' reached' : fmtUsd(budget.cap - budget.spent) + ' left of the ' + budget.label.toLowerCase()) : d.today > 0 ? 'Spending today' + (todayScope(d).all ? ', on this computer' : ', in chats running ToBeBestMe') : 'No spending yet today'
    facts = [budget ? fmtUsd(budget.spent) + ' of ' + fmtUsd(budget.cap) + budget.counted : '', 'No plan limits reported yet']
    // a tick that says all is well is not earned while other chats' spending is unread: it is drawn quiet
    const isPartial = !budget && d.today > 0 && !todayScope(d).all
    glyph = level === 'success' ? k.text('✓ ', isPartial ? { dimColor: true } : { color: 'success' }) : k.text('● ', { color: level })
  }
  const factsLine = facts.filter(Boolean).join(' · ')
  const where = usageWhere(k, d, h, !!main)
  return lead(k, {
    glyph,
    headline,
    facts: factsLine ? factsLine + '.' : '',
    factsTip: u ? { title: 'The past 7 days, in every project', lines: ['What the week’s answers would cost at list prices, helpers and workflow agents included.', 'On a plan the limits are what you spend; this shows how heavy the work was.'], align: 'left' } : undefined,
    // the figure answers the headline: how much of the limit it is about is used, in the colour of its status. The past
    // 7 days' work, which is a different measure, is said under it
    figure: main
      ? {
          value: pctText(main.r.percentUsed),
          caption: limitName(main.r) + ' used' + (main.o.isUsedUp ? ' · used up' : main.level === 'error' ? ' · nearly out' : isEarly(main.r, main.o) ? ' · runs out early' : main.level === 'warning' ? ' · past your alert' : ''),
          sub: u ? 'Past 7 days of work, estimated: ' + cost(u.week.usd) + (SHARE ? ' of the limit' : '') + (d.today > 0 ? ' · today ' + cost(d.today) : '') : '',
          level: main.level,
          tip: u && SHARE ? { title: 'Past 7 days of work', lines: ['What the week’s answers would cost at list prices, as a share of your weekly limit: an estimate.', 'The reading above is the limit itself, from Claude Code.'] } : undefined,
        }
      : u ? { value: cost(u.week.usd), caption: SHARE ? 'of a weekly limit, estimated from list prices · past 7 days' : 'of work in the past 7 days', sub: d.today > 0 ? 'Today ' + cost(d.today) : '' } : { value: cost(d.today), caption: 'today, ' + todayScope(d).in, sub: [todayScope(d).why ? '(' + todayScope(d).why + ')' : '', Math.abs(d.today - d.usd) >= 0.005 ? 'This session ' + cost(d.usd) : ''].filter(Boolean).join(' · ') },
    visual: [chart, ...where].filter(Boolean),
  })
}

// The week as one picture to keep and post: saved as an SVG and, where the computer has a converter, a PNG, with a few
// lines to paste. On desktop and VS Code, where a drawing shows, the picture can be looked at first; it is one row
// of buttons until then, so the limits and the spending above are what the tab opens on.
function reportCard(k, d, act) {
  if (!k.hasSvg || !d.usage || d.usage.isEmpty) return null
  const r = reportData(d, { hideNames: !!d.view.cardHide })
  if (!r) return null
  const isOpen = !!d.view.showCard
  const W = Math.max(240, Math.min(720, Math.round(k.px - 44)))
  return k.card('Weekly report card', 'Your week as one picture: saved as an image file, with a few lines to paste beside it.', [
    k.buttons([
      k.button('card-save', 'Save report card', (ev) => act.saveCard(ev && ev.surface)),
      k.button('card-copy', 'Copy text summary', (ev) => act.copyCardText(ev && ev.surface)),
      k.button('card-preview', isOpen ? 'Hide preview' : 'Show preview', () => act.setView({ showCard: !isOpen }), { dimColor: true }),
      k.button('card-names', d.view.cardHide ? '✓ Project names hidden' : 'Hide project names', act.toggleCardNames, { dimColor: d.view.cardHide ? undefined : true }),
    ]),
    ...(isOpen ? [k.Box({ flexDirection: 'column', alignSelf: 'center', children: [k.Svg({ source: svgReportCard(r, { width: W, isAnimated: true }), alt: reportAlt(r) })] })] : []),
    k.footnote('Saves an SVG to ' + d.reportDir + ', and a PNG too when rsvg-convert, ImageMagick, Inkscape or macOS Quick Look is on this computer. Nothing is uploaded.'),
  ], { keepCaption: true })
}

// The phone: a short lobby. What waits for you (with the answers the chat itself suggested), the limit
// that binds first and when it runs out, and what is running. The mobile app draws no field, so a
// reply is one of the suggested buttons, shown whole and confirmed before it is sent.
export function drawLobby(k, d, act) {
  d = withExactPct(d)
  const L = lobbyData(d)
  const w = d.waiting
  const c = d.view.confirm || ''
  // the headline and its notes are Home's: one count, the same words
  const read = waitingRead(d, { has: !!(d.usage && !d.usage.isEmpty), sc: d.scan || {} })
  const [head, glyph] = homeHeadline(L.tally, read)
  const notes = waitNotes(L.tally, read)
  const firstAnswer = L.needs.findIndex((x) => canAnswer(w, x))
  const card = (key, children) => k.Box({ key, flexDirection: 'column', rowGap: 'sm', paddingX: 'md', paddingY: 'md', backgroundColor: GROUP_BG, borderStyle: 'round', borderDimColor: true, children })
  const out = [
    k.Box({
      flexDirection: 'column',
      rowGap: 'xs',
      children: [k.footnote('ToBeBestMe'), k.hang(k.Box({ paddingTop: 'xs', children: [k.text(glyph[0], glyph[1])] }), k.text(head, { size: 'title', weight: 'semibold', wrap: 'wrap' })), ...(notes.length ? [k.text(notes.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })] : [])],
    }),
  ]
  // a workflow asking for its go-ahead in this chat: asked in the chat's own dialog, so it says where to answer
  if (L.approval) {
    out.push(
      card('lobby-approval', [
        k.Text({ wrap: 'wrap', children: [k.text('●  ', { color: 'warning' }), k.text('Waiting for your go-ahead', { size: 'footnote', weight: 'semibold', color: 'warning' })] }),
        k.text('Claude wants to run ' + (L.approval.preview.name ? '“' + L.approval.preview.name + '”' : 'a workflow'), { weight: 'semibold', wrap: 'wrap' }),
        k.guide('Answer in the chat: Run workflow, Run every agent on Sonnet or Don’t run.'),
      ]),
    )
  }
  L.needs.forEach((x, i) => {
    const [label, level] = needWords(x)
    const asking = c.startsWith('reply:' + x.key + ':') ? Number(c.slice(('reply:' + x.key + ':').length)) : -1
    const canSend = canAnswer(w, x)
    const pending = asking >= 0 && asking < x.replies.length ? x.replies[asking].message || x.replies[asking].label : ''
    const said = needAsk(x) || x.recap || ''
    const text = said.length > 180 ? said.slice(0, 179).replace(/\s+\S*$/, '') + '…' : said
    const buttons = []
    if (canSend && asking < 0) x.replies.slice(0, 3).forEach((r, j) => buttons.push(k.button('lobby-' + i + '-r' + j, r.label, () => act.setView({ confirm: 'reply:' + x.key + ':' + j, replying: '' }), { variant: i === firstAnswer && j === 0 ? 'primary' : undefined, about: x.title })))
    if (x.prUrl && k.Link) buttons.push(k.Link({ href: x.prUrl, label: 'Open pull request #' + x.prNumber }))
    // as on the desktop, any of them can be set aside; it comes back if that chat asks again
    if (asking < 0) buttons.push(k.button('lobby-' + i + '-later', 'Set aside', () => act.dismissNeed(x), { plain: true, dimColor: true, about: x.title }))
    const how = needHow(w, x, canSend)
    out.push(
      card('lobby-need-' + i, [
        k.Text({ wrap: 'wrap', children: [k.text('●  ', { color: level === 'success' ? 'success' : level === 'info' ? undefined : level, dimColor: level === 'info' ? true : undefined }), k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) })] }),
        k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
        k.footnote([x.project, ago(d.now - x.at)].filter(Boolean).join(' · '), { wrap: 'wrap' }),
        ...(text ? [k.text(text, { wrap: 'wrap' })] : []),
        ...(how ? [k.guide(how)] : []),
        ...(asking >= 0
          ? [k.text('Send this to “' + x.title + '”?', { weight: 'medium', wrap: 'wrap' }), k.Box({ paddingX: 'md', paddingY: 'sm', borderStyle: 'round', borderDimColor: true, children: [k.text(pending, { wrap: 'wrap' })] }), k.buttons([k.button('reply-go', 'Send reply', () => act.sendReply(x, pending), { variant: 'primary', autoFocus: true }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }))])]
          : buttons.length
            ? [k.buttons(buttons)]
            : []),
      ]),
    )
  })
  // as the card on Home counts them: this many shown of all the chats and pull requests waiting
  if (L.more) out.push(k.footnote('Showing ' + L.needs.length + ' of ' + w.needs.length + '. The rest are in ToBeBestMe on your computer.', { wrap: 'wrap' }))
  const t = L.tight
  if (t) {
    const level = shownPct(t.pct) >= Math.max(90, d.opts.limitAlertAt) ? 'error' : shownPct(t.pct) >= d.opts.limitAlertAt || t.early ? 'warning' : 'success'
    const hex = level === 'success' ? planHex(t.label) : HEX[level]
    out.push(
      k.Box({
        key: 'lobby-limit',
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [k.Box({ flexGrow: 1, flexShrink: 1, children: [k.text(t.label, { weight: 'semibold', wrap: 'truncate-end' })] }), k.text(pctText(t.pct), { tabular: true, weight: 'semibold', color: quiet(level) })] }),
          k.bar(t.pct, 100, hex, t.label + ' ' + pctText(t.pct) + ' used'),
          k.footnote(t.pct >= 100 && t.resetsAt ? 'Used up until it resets ' + fmtClock(t.resetsAt, d.now) + ', in ' + fmtSpan(t.resetsAt - d.now) + '.' : t.early ? 'Runs out ' + fmtClock(t.fullAt, d.now) + ', ' + roughSpan(t.resetsAt - t.fullAt) + ' before it resets.' : t.resetsAt ? 'Resets ' + fmtClock(t.resetsAt, d.now) + ', in ' + fmtSpan(t.resetsAt - d.now) + '.' : '', { wrap: 'wrap', ...(t.early ? { color: 'warning' } : {}) }),
        ],
      }),
    )
  }
  if (L.runs.length) {
    out.push(
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          k.text('Running now', { weight: 'semibold' }),
          // the dot is the desktop's: blue and pulsing while it works, an amber pause when held
          ...L.runs.map((r) => k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', children: [r.paused ? k.text('‖', { color: 'warning' }) : k.live(HEX.bar, 'suggestion', 'Running'), k.Box({ flexShrink: 1, children: [k.Text({ wrap: 'wrap', children: [k.text(r.name || 'Workflow', { weight: 'medium' }), k.text('  ' + r.progress.done + ' of ' + plural(r.progress.total, 'agent', 'agents') + (r.paused ? ', paused' : ''), { size: 'footnote', dimColor: true })] })] })] }), k.bar(r.progress.done, Math.max(1, r.progress.total), r.paused ? HEX.warning : HEX.bar, (r.name || 'Workflow') + ': ' + r.progress.done + ' of ' + r.progress.total + ' agents done')] })),
        ],
      }),
    )
  }
  out.push(k.footnote('Context in this chat: ' + pctText(d.pct) + '. The full dashboard is in ToBeBestMe on your computer.', { wrap: 'wrap' }))
  return k.Box({ flexDirection: 'column', rowGap: 'lg', width: '100%', paddingX: 'xs', paddingY: 'sm', children: out })
}

function usageTab(k, d, act) {
  const h = homeContext(d)
  const limits = limitList(d, h)
  const main = leadLimit(limits)
  const head = usageLead(k, d, act, h, limits, main)
  const oneColumn = () => {
    const spent = spendingTab(k, d, act, h)
    return [head, ...(limits.length ? limitsTab(k, d, act, limits, main) : []), ...(limits.length ? [limitsSettings(k, d, act)] : []), spent.glance, spent.turns, spent.budgets, spent.models, spent.tools, spent.week, reportCard(k, d, act), spent.share].filter(Boolean)
  }
  if (k.isTerminal || k.columns < SPLIT_AT) return oneColumn()
  // wide: the record of what was spent on the left, the controls and the glance beside them
  const [km, ka] = k.split()
  const spentMain = spendingTab(km, d, act, h)
  const record = [...(limits.length ? limitsTab(km, d, act, limits, main) : []), spentMain.turns, spentMain.models, spentMain.tools, spentMain.week].filter(Boolean)
  // with no record yet (no limits reported, no turns) the controls are the page, so they take the full width
  if (!record.length) return oneColumn()
  const spentSide = spendingTab(ka, d, act, h)
  // the card is a row of buttons in the side column; opened, its picture is as tall as both columns' ends, so it
  // takes a row of its own under them rather than leaving the left column empty beside it
  const isCardOpen = !!d.view.showCard
  const side = [spentSide.glance, ...(limits.length ? [limitsSettings(ka, d, act)] : []), spentSide.budgets, ...(isCardOpen ? [] : [reportCard(ka, d, act)]), spentSide.share].filter(Boolean)
  return [head, km.layout(record, side), ...(isCardOpen ? [reportCard(k, d, act)] : [])].filter(Boolean)
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
  // with no turn yet the tile would repeat the figure above it in a column too narrow for its words: one full-width line instead
  const hasTurns = t.length > 0
  const list = hasTurns ? [tile(k, 'tile-session', 'This session', cost(d.usd), since > 0 ? 'since ' + fmtClock(d.startedAt, d.now) : plural(t.length, 'turn', 'turns') + ' recorded', { tip: { title: 'This session', lines: ["Claude Code's own count, as /cost shows it.", 'On a subscription it is the API-price equivalent, not a bill.', plural(t.length, 'turn', 'turns') + ' recorded since ToBeBestMe started watching.'] } })] : []
  if (last) list.push(tile(k, 'tile-last', 'Last turn', last ? cost(last.usd || 0) : '–', last ? fmtTurnTime(last.ms) + ' · ' + modelName(last.model) : 'none yet', { tip: last ? { title: 'Last turn', lines: ['Ended ' + fmtClock(last.at, d.now) + ' after ' + fmtTurnTime(last.ms) + '.', fmtTokens(last.output || 0) + ' tokens of output.'] } : null }))
  // two rates, named for what they average: the whole session here, the last turns under Turns (spendRates measures both)
  const rates = spendRates(d)
  if (rates.average !== null) list.push(tile(k, 'tile-rate', 'Average rate', cost(rates.average) + ' an hour', SHARE ? 'of the weekly limit, over the whole chat' : 'over the whole chat', { tip: { title: 'Average rate', lines: ['This chat’s cost over the time it has run, an hour at a time.', 'Recent rate, under Turns, is the last few turns on their own.'] }, align: 'left' }))
  const average = () => tile(k, 'tile-avg', 'Average turn', cost(avg(t.map((x) => x.usd || 0))), 'over ' + plural(t.length, 'turn', 'turns') + ' recorded', { tip: { title: 'Average turn', lines: ['What a turn has cost on average since ToBeBestMe started watching.'] }, align: 'left' })
  const hasAverage = since < 2 * MIN_MS && t.length > 0
  if (hasAverage) list.push(average())
  if (Math.abs(d.today - d.usd) >= 0.005) list.push(tile(k, 'tile-today', 'Today', cost(d.today), plural(Math.max(1, h && h.has ? h.u.today.sessions : d.ledger.sessionsToday), 'chat', 'chats'), { tip: { title: 'Today', lines: [h && h.has ? 'Every project on this computer, from Claude Code’s own records.' : 'Every chat on this machine that runs ToBeBestMe.'] }, align: 'left' }))
  if (list.length < 4 && d.ledger.week - d.today >= 0.005) list.push(tile(k, 'tile-week', 'Past 7 days', cost(d.ledger.week), 'on this machine', { tip: { title: 'Past 7 days', lines: ['Every chat on this machine that runs ToBeBestMe.'] }, align: 'left' }))
  if (list.length < 4 && t.length && !hasAverage) list.push(average())

  const out = {}
  const put = (name, node) => {
    out[name] = node
  }
  put('glance', k.card('This session at a glance', null, [...(hasTurns ? [tiles(k, list.slice(0, 4))] : [k.footnote('This session: ' + cost(d.usd) + (since > 0 ? ', since ' + fmtClock(d.startedAt, d.now) : '') + ". Claude Code's own count, as /cost shows it; on a subscription it is the API-price equivalent, not a bill."), ...(list.length ? [tiles(k, list.slice(0, 4))] : [])]), costUnitRow(k, d, act), ...(t.length === 0 ? [k.footnote("No turns recorded yet. They appear here after Claude's next answer.")] : []), ...(d.limits.length ? [] : [k.footnote('No usage limits reported yet. On a Claude plan they show here after the first reply; with an API key you pay per request instead.')])]))

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
    const facts = [['Most expensive', cost(priciest.usd || 0) + ' at ' + fmtClock(priciest.at, d.now)]]
    if (rates.recent !== null) facts.push(['Recent rate', cost(rates.recent) + ' an hour over the last ' + plural(rates.turns, 'turn', 'turns')])
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
            ...recentRows.map((x, i) => k.row([{ text: fmtClock(x.at, d.now) }, { el: k.bar(x.usd || 0, most, modelHex(x.model), 'Turn ' + (t.length - i) + ': ' + cost(x.usd || 0)), width: barW }, { text: cost(x.usd || 0), width: 9 }, { text: fmtTurnTime(x.ms), width: 9 }, { text: fmtTokens(x.output || 0), width: 8 }], {}, { key: 'turn-' + i, tip: turnTip(x, d.now) })),
          ],
        }),
        k.Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 'md',
          children: [...families.map((f) => k.Text({ children: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(f)) }), k.text(f, { size: 'footnote', dimColor: true })] })), ...(k.isTerminal ? [] : [k.footnote((k.hint('Point at a turn for its tokens and cache.') + (values.length >= 8 ? ' The dashed line is the average turn, ' + cost(avg(values)) + '.' : '')).trim())])],
        }),
        k.facts(facts, 46),
      ], { gap: 'md' }),
    )
  }

  // The budgets, set right where the spending is.
  const budgetRows = []
  const progress = (label, spent, cap) => {
    const level = spent >= cap ? 'error' : spent >= cap * 0.8 ? 'warning' : 'success'
    const said = fmtUsd(spent) + ' of ' + fmtUsd(cap) + (spent < cap ? ' · ' + fmtUsd(cap - spent) + ' left' : ' · reached')
    return k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.columns < 60 ? k.Box({ flexDirection: 'column', children: [k.text(label, { wrap: 'wrap' }), k.text(said, { wrap: 'wrap', tabular: true, color: quiet(level) })] }) : k.row([{ text: label }, { text: said, width: 34, color: quiet(level) }]), k.meter([{ value: Math.min(cap, spent), hex: level === 'success' ? RING_HEX.spending : HEX[level], color: level === 'success' ? 'success' : level }], cap, [80], label + ': ' + fmtUsd(spent) + ' of ' + fmtUsd(cap))] })
  }
  if (o.sessionBudget > 0) budgetRows.push(progress('This session', d.usd, o.sessionBudget))
  if (o.dailyBudget > 0) {
    budgetRows.push(progress('Counted toward the daily budget', d.todayBudget, o.dailyBudget))
    if (Math.abs(d.todayBudget - d.today) >= 0.005) budgetRows.push(k.footnote('The daily budget counts what the chats running ToBeBestMe report, so it can differ from Today, which reads every project’s records.'))
  }
  budgetRows.push(...['sessionBudget', 'dailyBudget', 'atBudget'].map((f) => settingRow(k, d, act, settingSpec(f))))
  put('budgets',k.card('Budgets', 'How much one chat or a day may cost, and what happens when it is reached.', budgetRows, { gap: 'md' }))

  const names = Object.keys(d.models).sort((a, z) => d.models[z].requests - d.models[a].requests)
  if (names.length) {
    let all = 0
    let byHelpers = 0
    const rows = names.map((m, i) => {
      const r = d.models[m]
      all += r.requests
      byHelpers += r.subagent || 0
      const input = r.input + r.cacheRead + r.cacheWrite
      return k.row([{ parts: [k.text('● ', { color: k.isTerminal ? 'suggestion' : midHex(modelHex(m)) }), modelName(m)] }, { text: String(r.requests), width: 10 }, { text: fmtTokens(input), width: 9 }, { text: fmtTokens(r.output), width: 9 }, { text: input ? pctText((r.cacheRead / input) * 100) : '–', width: 11 }], {}, { key: 'model-' + i, tip: { title: modelName(m), lines: [plural(r.requests, 'request', 'requests') + (r.subagent ? ', ' + r.subagent + ' from helpers' : '') + '.', fmtTokens(input) + ' tokens in, ' + fmtTokens(r.cacheRead) + ' of them from the cache.', fmtTokens(r.output) + ' tokens out.'] } })
    })
    put('models',
      k.card('By model', null, [
        k.heads([{ text: 'Model' }, { text: 'Requests', width: 10 }, { text: 'Input', width: 9 }, { text: 'Output', width: 9 }, { text: 'From cache', width: 11 }]),
        ...rows,
        k.footnote((byHelpers ? byHelpers + ' of ' + all + ' requests came from helpers. ' : '') + 'Input from the cache costs a tenth as much or less.'),
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
              return k.row([{ text: toolName(n) }, { el: k.bar(r.chars, d.tools[toolNames[0]].chars, TINT.gray, toolName(n) + ' output'), width: k.columns >= 72 ? 14 : 8 }, { text: r.calls + (r.errors ? ' (' + r.errors + ' failed)' : ''), width: 14 }, { text: fmtTurnTime(r.ms), width: 9 }, { text: '~' + fmtTokens(r.chars / 4), width: 9 }], {}, { key: 'tool-' + i, tip: { title: toolName(n), lines: [plural(r.calls, 'call', 'calls') + (r.errors ? ', ' + r.errors + ' failed' : '') + ', ' + fmtTurnTime(r.calls ? r.ms / r.calls : 0) + ' each on average.', 'About ' + fmtTokens(r.chars / 4) + ' tokens of output, which stays in the chat.'] } })
            }),
            k.footnote('Tool output stays in the chat and is re-read every turn. Sizes are estimates.'),
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
      k.card('Past 7 days', 'All chats on this machine that run ToBeBestMe.', [
        k.bars(days.map((x) => x.usd), 7, 'Spending over the past 7 days: ' + days.map((x) => x.label + ' ' + cost(x.usd)).join(', ') + '.', 40, { colors: days.map(() => RING_HEX.spending), titles: days.map((x) => x.label + ': ' + cost(x.usd)) }),
        k.Box({ flexDirection: 'column', rowGap: 'xs', children: days.filter((x) => x.usd > 0).reverse().map((x) => k.row([{ text: x.label }, { text: cost(x.usd), width: 10 }], x.label === 'Today' ? { weight: 'semibold' } : {})) }),
        ...(d.ledger.projects.length > 1 ? [k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Today by project', { size: 'footnote', weight: 'semibold', dimColor: true }), ...d.ledger.projects.map((p) => k.row([{ text: p.project }, { text: cost(p.usd), width: 10 }]))] })] : []),
      ]),
    )
  }

  put('share',
    k.card('This session, to share', null, [
      k.buttons([k.button('copy', 'Copy chat summary', (ev) => act.copySummary(ev && ev.surface), { hotkey: k.hotkey('y') }), k.button('report', 'Save chat report', act.saveReport, { hotkey: k.hotkey('r') })]),
      k.footnote('The summary is a few lines about this chat to paste anywhere. A report is a Markdown file in ' + d.reportDir + '.'),
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
      input ? fmtTokens(input) + ' tokens in' + (x.cacheRead ? ', ' + pctText((x.cacheRead / input) * 100) + ' from the cache' : '') + '; ' + fmtTokens(x.output || 0) + ' out.' : fmtTokens(x.output || 0) + ' tokens out.',
      x.context ? 'Context afterwards: ' + fmtTokens(x.context) + ' tokens.' : '',
      (x.idleMs || 0) >= 5 * MIN_MS ? 'Started after ' + fmtSpan(x.idleMs) + ' away, so the cache had to be rebuilt.' : '',
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
  const p = pctText(r.percentUsed)
  const span = WINDOW_MS[r.kind]
  const hex = limitHex(r)
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
        width: k.px - 4,
        start: o.resetAt - span,
        end: o.resetAt,
        now: drawTime(d.now),
        pct: r.percentUsed,
        atReset: o.atReset,
        fullAt: o.fullAt,
        samples: (d.limitHistory && d.limitHistory[r.kind]) || [],
        alertAt: d.opts.limitAlertAt,
        hex: tint(hex, l.level),
        warnHex: early ? HEX.warning : HEX.marker,
        labels: {
          start: day(o.resetAt - span),
          end: 'resets ' + day(o.resetAt),
          full: 'runs out ' + fmtClock(o.fullAt || o.resetAt, d.now),
          fullTitle: 'At this pace it runs out around ' + fmtClock(o.fullAt || o.resetAt, d.now),
          now: 'Now: ' + p + ' used',
          alert: 'your alert',
          area: 'Your use so far this week',
          projection: o.atReset !== null ? 'At this pace: ' + pctAbout(Math.min(100, o.atReset)) + ' by the reset' : '',
          sample: (s) => fmtClock(s.at, d.now) + ': ' + pctText(s.pct),
        },
      }),
      limitName(r) + ': ' + p + ' used. ' + paceSentence(l, d.now),
      { isInteractive: true },
    )
  }
  const runway = runwayOf(r.kind, r.percentUsed, o.resetAt, d.now)
  if (k.hasSvg && runway) return runwayBar(k, { label: limitName(r), valueText: p + ' used', hex: tint(hex, l.level), runway, window: windowOf(r.kind, runway, o.resetAt, d.now) }, 'tile', k.px - 24)
  return k.meter([{ value: r.percentUsed, hex: l.level === 'success' ? hex : HEX[l.level], color: l.level === 'success' ? 'suggestion' : l.level }], 100, [d.opts.limitAlertAt], limitName(r) + ' ' + p + ' used, alert at ' + d.opts.limitAlertAt + '%')
}

// Each limit's figures: how much is used, the pace, and what lasting until the reset takes. The one the
// tab opens on is drawn above, so its card carries the figures alone; Show details draws the others'
// history here.
function limitsTab(k, d, act, limits, main) {
  return limits.map((l) => {
    const r = l.r
    const o = l.o
    const p = pctText(r.percentUsed)
    const hex = limitHex(r)
    const early = isEarly(r, o)
    // the same runway as Home and the line above the prompt; the history chart is for Show details
    const runway = runwayOf(r.kind, r.percentUsed, o.resetAt, d.now)
    const drawn = l === main ? null : k.showDetails ? limitChart(k, d, l) : runway ? runwayBar(k, { label: limitName(r), valueText: p + ' used', hex: tint(hex, l.level), runway, window: windowOf(r.kind, runway, o.resetAt, d.now) }, 'tile', k.hasSvg ? k.px - 24 : undefined) : limitChart(k, d, l)
    const facts = []
    if (o.resetAt !== null) facts.push(['Resets', 'in ' + fmtSpan(o.resetAt - d.now)])
    if (o.recentPerHour !== null) facts.push(['Lately', (o.recentPerHour < 0.1 ? 'under 0.1%' : 'about ' + (o.recentPerHour >= 10 ? Math.round(o.recentPerHour) : Math.round(o.recentPerHour * 10) / 10) + '%') + ' an hour while you work'])
    // the share a day is one measurement, the same one This session and the advice say (dailyShare)
    const share = dailyShare(l, (d.limitHistory && d.limitHistory[r.kind]) || [], d.now)
    if (share && o.resetAt - d.now >= DAY_MS) facts.push(['To last until the reset', dayShareWords(share.share)])
    if (share && share.usedToday !== null) facts.push(['Today so far', pctText(share.usedToday) + ' of ' + pctAbout(share.share) + (share.isOver ? ', over today’s share' : ', on track')])
    if (l === main && !facts.length) return null
    return k.card(limitName(r), r.kind === 'seven_day' ? 'Your use across the week.' : null, [
      // the one the tab opens on has its figure, its status and its pace in the head above: its card holds the figures alone
      ...(l === main ? [] : [k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', alignItems: 'flex-end', children: [k.text(p + ' used', { size: 'title', weight: 'semibold', tabular: true, color: quiet(l.level) }), ...(l.level !== 'success' ? [k.footnote(o.isUsedUp ? 'used up until it resets' : l.level === 'error' ? 'nearly out' : early ? 'runs out early' : 'past your alert')] : [])] })]),
      ...(drawn ? [drawn] : []),
      // the head says when it runs out, or that it is used up; its card says it again only for a pace the head does not say
      ...(l === main && (early || o.isUsedUp) ? [] : [k.hang(k.dot(early ? 'warning' : 'info'), k.text(paceSentence(l, d.now), { wrap: 'wrap', weight: early ? 'medium' : undefined }))]),
      k.facts(facts),
    ], { accessory: o.resetAt !== null ? k.footnote('resets ' + fmtClock(o.resetAt, d.now), { wrap: 'truncate-end' }) : undefined })
  })
}

// What makes a limit last longer, beside the limits it stretches: where each stands now, and the way to change it. The
// settings themselves are in Settings, their one home.
function limitsSettings(k, d, act) {
  const o = d.opts
  return k.card('Making limits last', 'Opus uses them fastest, then Sonnet, then Haiku. A smaller chat uses less on every turn.', [
    k.facts([
      ['Use the cheaper model', modeWords(o)],
      ['Helpers always use it', o.helpersAlwaysCheap ? 'On' : 'Off'],
      ['Alert at', o.limitAlertAt + '% of a weekly limit'],
    ], 30),
    k.buttons([k.button('limits-settings', 'Change in Settings', () => act.setView({ tab: 'settings', confirm: '', editing: '' }), { dimColor: true }), k.button('limits-shrink', 'Make the chat smaller', () => act.run('context'), { dimColor: true })]),
  ], { gap: 'md' })
}

// ---- Skills -------------------------------------------------------------------------------

const EXAMPLES = [
  ['Run the tests and fix failures', 'Run the test suite, fix failures one at a time, then summarize what changed and what still fails.'],
  ['Write a commit message', 'Read the staged diff and write a clear commit message: a short subject line, then why the change was made.'],
  ['Review my changes', 'Review the current diff for bugs, missing tests and unclear names, and list findings by severity.'],
  ['Explain a file', 'Explain what a file does, how it fits into the project, and anything surprising in it, in plain words.'],
]

// A listed skill that is the person's own: a file of theirs the check-up read, or one Claude Code lists from their
// own or the project's settings. A plugin's is not.
function isOwnSkill(x, mine) {
  return !x.pluginName && (mine.has(x.name) || x.source === 'userSettings' || x.source === 'projectSettings')
}

// How many skills and commands are the person's own: the files the check-up read and what Claude Code lists as
// theirs, counted once by name. Settings (what it reads) says this number, and Skills (its lead) the listed part of it.
function ownSkillCount(sk) {
  const mine = new Set((sk.own || []).map((x) => x.name))
  const L = sk.listing
  if (L) for (const x of Object.values(L.byName)) if (isOwnSkill(x, mine)) mine.add(x.name)
  return mine.size
}

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
  // no skills at all: say that, not that none of them ran
  const noSkills = !L && !sk.own.length
  const headline = !L
    ? noSkills ? 'You have no skills yet' : 'Your skills'
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
  else if (d.opts.scanProjects && !noSkills) facts.push('No skill ran in the last ' + SCAN_DAYS + ' days')
  // the listing is a thing that can run out, so it is drawn as a runway: the fill is how much of its room
  // the skills take, and a description that did not fit says so in words under it
  const fill = L ? Math.min(100, (L.tokens / Math.max(1, L.budget)) * 100) : 0
  const bySource = { yours: 0, plugins: 0, builtin: 0 }
  for (const x of listed) {
    if (x.pluginName) bySource.plugins += 1
    else if (isOwnSkill(x, mine)) bySource.yours += 1
    else bySource.builtin += 1
  }
  const listingItem = L ? { label: 'Skill listing', valueText: pctText(fill), hex: tint(TINT.slate, isFull ? 'warning' : 'success'), runway: { used: fill, elapsed: null, runOut: null, ticks: [] } } : null
  const sources = [bySource.yours ? bySource.yours + ' yours' : '', bySource.plugins ? bySource.plugins + ' from plugins' : '', bySource.builtin ? bySource.builtin + ' built in' : ''].filter(Boolean).join(' · ')
  const idle = isCounting ? 0 : neverRun.length
  put(
    'lead',
    lead(k, {
      glyph: L || level !== 'success' ? k.text(level === 'success' ? '✓ ' : '● ', { color: level }) : noSkills ? k.text('○ ', { dimColor: true }) : null,
      headline,
      facts: facts.length ? facts.join(' · ') + '.' : '',
      factsTip: L ? { title: 'The skill listing', lines: ['Names and descriptions, sent with every request so Claude can pick a skill.', 'Its room is ' + fmtFraction(L.fraction) + ' of the context window: about ' + fmtTokens(L.budget) + ' tokens here' + (L.isCustomBudget ? ', set by you.' : '.'), 'Past it, skills go by name alone.'], align: 'left' } : undefined,
      figure: L ? { value: pctText(fill), caption: 'of the listing’s room', sub: sources, level: isFull ? 'warning' : 'success' } : ranNames.length ? { value: String(ranNames.length), caption: 'skills ran in ' + SCAN_DAYS + ' days' } : null,
      visual: [
        ...(listingItem ? [k.hoverBox('skill-listing', { flexDirection: 'column', width: '100%' }, [runwayBar(k, listingItem, 'hero', k.hasSvg ? k.px - 8 : undefined)], { title: 'The skill listing, ' + pctText(fill) + ' full', lines: [fmtTokens(L.tokens) + ' of about ' + fmtTokens(L.budget) + ' tokens, sent with every request.', idle ? plural(idle, 'skill', 'skills') + ' never ran in ' + SCAN_DAYS + ' days, together ' + fmtTokens(neverTokens) + ' tokens a request.' : '', sources ? 'Skills: ' + sources + '.' : ''], align: 'left' })] : []),
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
    // the button only offers what changes something: a room already at 5% of the window (or set higher) has nowhere to go
    if (canRaiseListingBudget(L.fraction)) {
      options.push(
        k.hang(
          k.text(String(options.length + 1), { weight: 'semibold', dimColor: true }),
          k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              k.text('Give the listing more room', { weight: 'semibold', wrap: 'wrap' }),
              k.footnote('Going from ' + fmtFraction(L.fraction) + ' to ' + fmtFraction(nextListingBudget(L.fraction)) + ' of the context window makes room for more descriptions, and every request carries them.'),
              k.Box({ marginTop: 'xs', children: [k.buttons([k.button('skills-budget', 'Give skills more room…', () => act.raiseBudget(L.fraction))])] }),
            ],
          }),
        ),
      )
    } else if (!options.length) {
      options.push(k.footnote('The listing already has ' + fmtFraction(L.fraction) + ' of the context window, as much as this button gives. To make room, shorten skill descriptions or remove skills you no longer use.'))
    }
    put('room', 
      k.card('Make room in the listing', 'Claude picks a skill from a listing of names and descriptions sent with every request. It has room for about ' + fmtTokens(L.budget) + ' tokens; what doesn’t fit goes by name alone. Each button shows the change here first and saves it only when you press Save change.', options, { gap: 'md' }),
    )
  }

  // what earns its place: with nothing run, the lead already says so
  if (d.opts.scanProjects && (ranNames.length || isCounting || (k.showDetails && !noSkills))) {
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
                { key: 'used-' + i, tip: { title: '/' + x.name, lines: [plural(x.runs, 'run', 'runs') + ' in ' + plural(x.sessions, 'chat', 'chats') + ': ' + (x.typed ? x.typed + ' typed by you' : '') + (x.typed && x.byClaude ? ', ' : '') + (x.byClaude ? x.byClaude + ' picked by Claude' : '') + '.', 'In ' + x.projects.slice(0, 4).join(', ') + (x.projects.length > 4 ? ' and ' + (x.projects.length - 4) + ' more' : '') + '.', known[x.name] ? fmtTokens(known[x.name].tokens) + ' tokens in the listing.' : ''] } },
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
              k.Box({ marginTop: 'xs', children: [k.buttons([k.button('fix-' + i, 'Fix description…', () => act.fixSkill(x), { about: '/' + x.name }), k.button('try-' + i, 'Try /' + x.name, () => act.trySkill(x.name), { dimColor: true }), k.button('path-' + i, 'Copy path', (ev) => act.copyText(x.path, ev && ev.surface, 'The path'), { dimColor: true, about: '/' + x.name })])] }),
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
              { el: k.bar(g.tokens, most, TINT.slate, g.name + ': ' + fmtTokens(g.tokens) + ' tokens'), width: barW },
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
                  { el: k.bar(x.tokens, most, TINT.slate, x.name), width: barW },
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
      k.card('Where the listing goes', 'Every skill Claude is told about, what it costs on every request, and how often it ran. ' + k.hint('Point at a row for where it comes from and how to turn it off.'), [
        k.segmented('skill-show', [{ value: 'plugins', label: 'By source' }, { value: 'all', label: 'Every skill' }, { value: 'unused', label: 'Never ran' }, { value: 'cut', label: 'Name only' }], show, act.setSkillShow, 'Show'),
        ...(k.Input ? [k.Box({ width: '100%', children: [k.Input({ key: 'skill-filter', label: 'Find', placeholder: 'Find a skill or plugin', value: d.view.skillFilter || '', submitLabel: 'Find', onInput: (value) => act.setSkillFilter(value), onSubmit: (value) => act.setSkillFilter(value) })] })] : []),
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
              k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text(idea.title, { weight: 'semibold', wrap: 'wrap' }), k.footnote(idea.detail), ...(idea.where ? [k.footnote(idea.where)] : []), k.Box({ marginTop: 'xs', children: [k.buttons([k.button('idea-' + i, 'Draft this skill', () => act.draftIdea(idea), { about: idea.title })])] })] }),
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
    builder.push(k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.Box({ flexDirection: 'row', columnGap: 'sm', children: [k.text('✓', { color: 'success' }), k.text('/' + s.saved + ' is saved. New chats list it.', { weight: 'medium', wrap: 'wrap' })] }), k.buttons([k.button('skill-try', 'Try /' + s.saved, () => act.trySkill(s.saved))])] }))
  }
  if (k.Input) {
    builder.push(k.Input({ key: 'skill-describe', label: 'Describe', placeholder: k.columns < 60 ? 'What should it do?' : 'What should it do? For example: push, wait for the checks, then merge and deploy.', value: s.describe, rows: 3, submitLabel: 'Draft skill', onSubmit: (value) => act.draftSkill(value) }))
    if (k.columns < 60) builder.push(k.footnote('For example: push, wait for the checks, then merge and deploy.'))
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
          k.Box({ flexDirection: 'column', children: [k.text('Draft: /' + s.draft.name, { weight: 'semibold' }), ...(s.draft.description ? [k.footnote(cleanText(s.draft.description, 300))] : [])] }),
          k.Box({ flexDirection: 'column', rowGap: 'xs', children: checks.map(([ok, words]) => k.Box({ flexDirection: 'row', columnGap: 'sm', children: [k.text(ok ? '✓' : '●', ok ? { color: 'success' } : { color: 'warning' }), k.text(words, { size: 'footnote', wrap: 'wrap' })] })) }),
          k.Box({ borderStyle: k.isTerminal ? undefined : 'round', borderDimColor: k.isTerminal ? undefined : true, paddingX: k.isTerminal ? 0 : 'md', children: [k.Code ? k.Code({ key: 'skill-draft', source: s.draft.text, language: 'markdown' }) : k.Markdown({ key: 'skill-draft', text: s.draft.text })] }),
          k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Save it for', { size: 'footnote', weight: 'semibold', dimColor: true }), k.segmented('skill-scope', [{ value: 'project', label: 'This project' }, { value: 'user', label: 'All my projects' }], s.scope, act.setSkillScope, 'Save it for'), k.footnote('Saves to ' + d.skillPath)] }),
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
    [!skillDraftRisks(draft.text).length, skillDraftRisks(draft.text).length ? 'It holds ' + skillDraftRisks(draft.text).join(', ') + ' that Save skill would keep. Ask Claude to improve it.' : 'It has no tool permissions, hooks or shell commands.'],
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
    return k.segmented('opt-' + s.field, [{ value: true, label: 'On' }, { value: false, label: 'Off' }], v, (value) => act.setOption(s.field, value), s.label)
  }
  if (s.kind === 'choice') return k.segmented('opt-' + s.field, s.options, v, (value) => act.setOption(s.field, value), s.label)
  const presets = s.kind === 'model' ? s.presets.map((p) => ({ value: p, label: titleCase(p) })) : s.presets.map((p) => ({ value: p, label: settingWords(s, p) }))
  if (!presets.some((p) => p.value === v)) presets.push({ value: v, label: settingWords(s, v) })
  const isEditing = d.view.editing === s.field
  const options = k.Box({
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 'sm',
    rowGap: 'sm',
    alignItems: 'center',
    children: [
      k.segmented('opt-' + s.field, presets, v, (value) => act.setOption(s.field, value), s.label),
      ...(k.Input ? [k.button('opt-' + s.field + '-other', isEditing ? 'Cancel' : 'Other…', () => act.setView(isEditing ? { editing: '' } : { editing: s.field, focus: 'opt-' + s.field }), { dimColor: true })] : []),
    ],
  })
  if (!isEditing || !k.Input) return options
  const field = k.Input({
    key: 'opt-' + s.field,
    label: 'New value',
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
  ['agents', 'Running chats', 'Which chats are working or waiting now'],
  ['desk', 'Desktop chats', 'Open chats in the Claude app, for replies'],
  ['git', 'Folders’ git state', 'Work left uncommitted or unpushed, in the folders of chats to pick up'],
  ['gh', 'Pull requests (GitHub CLI)', 'Your open pull requests that need you: review requested, changes requested, checks failing, ready to merge. Read-only gh queries, every few minutes'],
  ['skills', 'Your skills', 'Skill and command files, for the check-up'],
  ['integrity', 'This copy of ToBeBestMe', 'Its own files, checked against the manifest that ships with them'],
]

// A source as the pane shows it: the skills one counts what the Skills tab counts as the person's own, so the
// two tabs never give two numbers.
function sourceOf(d, key) {
  const x = (d.sources || {})[key]
  if (x && key === 'gh' && x.ok === true && d.waiting) {
    // the count Home and Needs you show: set-aside pull requests and ones the desktop app lists are already settled there
    const n = ((d.waiting.needs || []).filter((y) => y.kind === 'pr')).length
    return { ...x, detail: String(x.detail || '').replace(/^\d+ pull requests? needs? you/, plural(n, 'pull request needs', 'pull requests need') + ' you') }
  }
  if (x && key === 'git' && isNothingFound(x)) return { ...x, detail: 'No uncommitted or unpushed work in the folders of chats to pick up' }
  if (!x || key !== 'skills' || x.ok !== true || !d.skills) return x
  return { ...x, detail: plural(ownSkillCount(d.skills), 'skill or command', 'skills and commands') + ' of yours' }
}

// A source that was read and had nothing in it: not a failure, and not a success either.
function isNothingFound(x) {
  return !!x && x.ok === true && /^(0 |No uncommitted or unpushed work)/.test(String(x.detail || ''))
}

// What a source that could not be read says, in a sentence with its next step. What Claude Code or the
// system answered (a missing function, a file error, an exit code) goes to the hover card, for a bug report.
const RAW_ERROR = /no implementation for|^E[A-Z]{3,}\b|is not a function|\bundefined\b|^(Type|Range|Syntax)?Error\b|exit code \d+|answered with nothing/i
function sourceNote(key, x) {
  const detail = String(x.detail || '')
  if (key === 'transcripts') return 'Couldn’t read the records Claude Code keeps of your projects. Check that its projects folder can be read, then press Read projects again on Home.'
  if (key === 'agents') return 'Couldn’t ask Claude Code which chats are running. Update Claude Code or restart it; the list fills in by itself once it answers.'
  if (RAW_ERROR.test(detail) || !detail) return 'Couldn’t read this. Restart Claude Code and open this tab again; if it keeps happening, an update to Claude Code may have changed it.'
  return detail
}

function sourcesCard(k, d) {
  const rows = SOURCE_WORDS.filter(([key]) => sourceOf(d, key)).map(([key, label, what], i) => {
    const x = sourceOf(d, key)
    // nothing found is not a success: a neutral dot, not a check
    const isZero = isNothingFound(x)
    const [glyph, color, word] = isZero ? ['○', undefined, ''] : x.ok === true ? ['✓', 'success', ''] : x.ok === false ? ['●', 'error', 'Couldn’t read'] : ['–', undefined, 'Not here']
    // a source read with nothing in it says so in words, not as a count of zero; what is not here goes on after its colon in lowercase
    const detail = isZero && /^0 /.test(String(x.detail || '')) ? 'None found' : word === 'Not here' && x.detail && !/^No /.test(x.detail) ? x.detail.charAt(0).toLowerCase() + x.detail.slice(1) : x.detail || ''
    const words = x.ok === false ? sourceNote(key, x) : (word && !/^No /.test(detail) ? word + (detail ? ': ' : '') : '') + detail
    return k.hoverBox('source-' + i, { flexDirection: 'column', width: '100%' }, [
      k.Text({ wrap: 'wrap', children: [k.text(glyph + ' ', color ? { color } : { dimColor: true }), k.text(label, { weight: 'medium' }), k.text('  ' + words, { dimColor: x.ok !== false ? true : undefined, color: x.ok === false ? 'error' : undefined })] }),
    ], { title: label, lines: [what + '.', 'Checked ' + ago(d.now - x.at) + '.', x.ok === false && x.detail && sourceNote(key, x) !== x.detail ? 'Technical detail, for a bug report: ' + x.detail : ''] })
  })
  if (!rows.length) return null
  const bad = SOURCE_WORDS.filter(([key]) => (d.sources || {})[key] && d.sources[key].ok === false).length
  const none = SOURCE_WORDS.filter(([key]) => isNothingFound(sourceOf(d, key))).length
  return k.card('What ToBeBestMe reads', (d.version ? 'Claude Code ' + d.version + '. ' : '') + (bad ? 'Something couldn’t be read; an update to Claude Code may have changed it. The sections that use it say less until it can.' : none ? 'A hollow dot means a source was read and had nothing in it, which is not an error. If an update changes these files, it shows here.' : 'Nothing failed. If an update changes these files, it shows here.'), rows)
}

// Settings drawn on another tab, beside what they change: here they are only linked to.
const SET_ELSEWHERE = ['sessionBudget', 'dailyBudget', 'atBudget', 'costUnit', 'workflowCheck']

function settingsTab(k, d, act) {
  const showAll = d.view.advanced
  const hidden = SETTINGS.reduce((n, g) => n + g.fields.filter((s) => s.advanced).length, 0)
  // each block is drawn by a function of the kit, with a rough weight, so a wide pane can balance two columns
  const blocks = [{ weight: 9, draw: (kk) => notifyCard(kk, d, act) }]
  for (const g of SETTINGS) {
    // The settings that sit beside the figures they change (budgets and how costs show on Usage, the workflow check on
    // Workflows) are drawn there and nowhere else: one home each, linked from here
    const fields = g.fields.filter((s) => (showAll || !s.advanced) && !s.inCard && !SET_ELSEWHERE.includes(s.field))
    if (fields.length) blocks.push({ weight: fields.length * 2 + 1, draw: (kk) => kk.card(g.group, null, fields.map((s) => settingRow(kk, d, act, s)), { gap: 'lg' }) })
  }
  blocks.push({
    weight: 4,
    draw: (kk) =>
      kk.card('Set on other tabs', 'These settings sit beside the figures they change, so each one has a single home.', [
        kk.Box({ flexDirection: 'column', rowGap: 'xs', children: [kk.text('Budgets, and how costs show', { weight: 'medium', wrap: 'wrap' }), kk.footnote('Set on Usage, beside your spending, where you see what they change.'), kk.buttons([kk.button('settings-usage', 'Open Usage', () => act.setView({ tab: 'usage', confirm: '', editing: '' }), { dimColor: true })])] }),
        kk.Box({ flexDirection: 'column', rowGap: 'xs', children: [kk.text('Check each workflow before it runs', { weight: 'medium', wrap: 'wrap' }), kk.footnote('Set on Workflows, beside the runs it checks.'), kk.buttons([kk.button('settings-workflows', 'Open Workflows', () => act.setView({ tab: 'workflows', confirm: '', editing: '' }), { dimColor: true })])] }),
      ], { gap: 'md' }),
  })
  blocks.push({ weight: 1, draw: (kk) => kk.Box({ paddingX: kk.isTerminal ? 1 : 'lg', children: [kk.buttons([kk.button('advanced', showAll ? 'Hide advanced settings' : 'Show ' + hidden + ' advanced settings', act.toggleAdvanced)])] }) })
  blocks.push({
    weight: 4,
    draw: (kk) =>
      kk.card('Reset', "Settings save straight away to Claude Code's settings and appear in /config too.", [
        kk.buttons([kk.button('defaults', 'Restore defaults…', () => act.setView({ confirm: 'defaults' })), kk.button('reset', "Reset this chat's numbers…", () => act.setView({ confirm: 'reset' })), kk.button('forget', 'Forget stored data…', () => act.setView({ confirm: 'forget' }))]),
        ...confirmRows(kk, d, act, ['defaults', 'reset', 'forget']),
      ], { gap: 'md' }),
  })
  blocks.push({ weight: 8, draw: (kk) => sourcesCard(kk, d) })
  blocks.push({ weight: 1, draw: (kk) => kk.Box({ paddingX: kk.isTerminal ? 1 : 'xs', children: [kk.footnote('ToBeBestMe is an independent project, not made by Anthropic. Claude and Claude Code are trademarks of Anthropic, PBC.')] }) })
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
  const NAMES = { claude: 'Claude Code', system: 'System', sound: 'Sound', speech: 'Speech', phone: 'Phone' }
  const WORDS = { sent: 'Sent', bell: 'Bell only: this terminal shows no words', played: 'Played', spoken: 'Spoken', unavailable: 'Not on this computer', failed: 'Failed', 'no-channel': 'No channel set in Claude Code', 'no-surface': 'Nothing to show it on', disabled: 'Turned off in Claude Code', refused: 'Refused' }
  const rows = Object.entries(n.results || {}).map(([key, v]) => {
    const isGood = v === 'sent' || v === 'played' || v === 'spoken'
    return k.Text({ wrap: 'wrap', children: [k.text(isGood ? '✓ ' : '● ', isGood ? { color: 'success' } : { color: 'warning' }), k.text(NAMES[key] + '  ', { weight: 'medium' }), k.text(WORDS[v] || v, { size: 'footnote', dimColor: isGood ? true : undefined })] })
  })
  const isEditing = d.view.editing === 'notifyUrl'
  return k.card(
    'Notifications',
    'How ToBeBestMe tells you something needs you, here and on your phone.',
    [
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Send notifications', { weight: 'medium' }), k.footnote('When a chat waits for you, a workflow needs your go-ahead or ends, or a limit gets close.'), k.segmented('opt-notifications', [{ value: true, label: 'On' }, { value: false, label: 'Off' }], o.notifications, (v) => act.setOption('notifications', v), 'Send notifications')] }),
      ...(o.notifications
        ? [
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Notify through', { weight: 'medium' }), k.footnote(specOf('notifyVia').help), k.segmented('opt-notifyVia', specOf('notifyVia').options, o.notifyVia, (v) => act.setOption('notifyVia', v), 'Notify through')] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [
              k.text('Also send to your phone', { weight: 'medium' }),
              k.footnote(n.url && n.url !== 'invalid' ? 'Also sent to ' + n.url + ' (address hidden).' : 'Paste the web address of a phone notification service. The easiest is ntfy: install its app, subscribe to a topic name only you would guess, and paste https://ntfy.sh/that-topic here. What each notification says goes there, so keep the topic secret.'),
              ...(isEditing && k.Input
                ? [k.Box({ width: 48, children: [k.Input({ key: 'notify-url', label: 'Address', placeholder: n.url ? 'Paste a new address to replace the saved one' : 'https://ntfy.sh/a-long-random-topic', value: '', submitLabel: 'Save', autoFocus: true, onSubmit: (v) => act.saveNotifyUrl(v) })] }), k.buttons([k.button('notify-url-cancel', 'Cancel', () => act.setView({ editing: '' }))])]
                : [k.buttons([k.button('notify-url-edit', n.url ? 'Change address…' : 'Add an address…', () => act.setView({ editing: 'notifyUrl', focus: 'notify-url' }), { dimColor: true }), ...(n.url ? [k.button('notify-url-clear', 'Remove address', () => act.saveNotifyUrl(''), { dimColor: true })] : [])])]),
            ] }),
            k.buttons([k.button('notify-test', 'Send a test notification', act.testNotify)]),
            ...(rows.length ? [k.footnote('The last one, ' + ago(d.now - n.at) + ':'), ...rows] : []),
            ...(n.results && n.results.system === 'sent' && /mac|darwin/i.test(String(d.platform || 'mac')) ? [k.footnote('On a Mac, system notifications come from Script Editor; if none appears, allow Script Editor in System Settings › Notifications.')] : []),
          ]
        : []),
    ],
    { gap: 'md' },
  )
}

// ---- Home: small helpers its cards share -----------------------------------------------------
// Every project on this computer, from Claude Code's own transcripts: what each used today and this
// week, the last 14 days, the plan limits they share, and what stands out. It works on every surface
// and covers sessions that never ran tobebestme; in the desktop app the open sessions follow.

function planHex(label) {
  if (/all models|^weekly( limit)?$/i.test(label)) return RING_HEX.seven_day
  // a model's own weekly limit keeps that model's colour, so slate stays the project colour it also is
  if (/opus/i.test(label)) return RING_HEX.seven_day_opus
  if (/sonnet/i.test(label)) return FAMILY_HEX.Sonnet
  if (/haiku/i.test(label)) return FAMILY_HEX.Haiku
  return RING_HEX.seven_day_opus
}

// How long ago, as a table says it: "just now", "12 min ago", "3 h ago", "yesterday", "4 days ago".
function ago(ms) {
  const min = Math.round(Math.max(0, ms) / MIN_MS)
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
  return pctText(whole > 0 ? (part / whole) * 100 : 0)
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

// What a project's row says on hover: where it is, its days, sessions, models and helpers.
function projectTip(p, now) {
  const read = p.tokens.input + p.tokens.cacheRead + p.tokens.cacheWrite
  const models = p.models
    .slice(0, 3)
    .map(([m, usd]) => modelName(m) + ' ' + share(usd, p.week))
    .join(', ')
  return {
    title: p.name,
    lines: [
      p.path ? p.path.replace(/^\/Users\/[^/]+/, '~') : '',
      'Today ' + cost(p.today) + ' · past 7 days ' + (SHARE ? ofLimit(cost(p.week)) : cost(p.week) + ' · 14 days ' + cost(p.total)) + '.',
      plural(p.sessionsWeek, 'chat', 'chats') + ' this week' + (p.worktrees ? ', ' + plural(p.worktrees, 'worktree', 'worktrees') + ' included' : '') + '. Last answer ' + ago(now - p.lastAt) + '.',
      models ? 'Models this week: ' + models + '.' : '',
      p.helpers + p.workflows > 0 ? 'Helpers and workflow agents: ' + share(p.helpers + p.workflows, p.week) + ' of it.' : '',
      read ? 'Reused from cache: ' + share(p.tokens.cacheRead, read) + ' of what was read.' : '',
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
  if (x.pr) return [x.pr.label, x.pr.level]
  if (x.kind === 'error' && x.hasReset) return ['Ready to carry on', 'info']
  if (x.kind === 'error' && x.resetsAt) return ['Stopped at a usage limit', 'error']
  return NEED_WORDS[x.kind] || ['Waiting', 'info']
}

function whereRan(entry) {
  return entry === 'desktop' ? 'Claude app' : entry === 'terminal' ? 'Terminal' : entry === 'editor' ? 'Editor' : ''
}

// The runway of the tightest limit, as the item the runway drawing takes.
function tightestItem(d, tightest, h) {
  const kind = kindOfLabel(tightest.label)
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
    valueText: pctText(tightest.pct),
    window,
    days,
    // what the bars say, for a reader that cannot see them
    daysAlt: days ? ' Use by day: ' + days.filter((x) => x.total > 0).map((x) => x.name + ' ' + cost(x.total)).join(', ') + '.' : '',
  }
}

// What the calendar view of a runway needs beyond the runway itself: the window's ends and the words
// over its posts.
function windowOf(kind, runway, resetsAt, now) {
  const span = WINDOW_MS[kind]
  if (!resetsAt || !span) return null
  const start = resetsAt - span
  return {
    startMs: start,
    endMs: resetsAt,
    unit: 'day',
    nowLabel: 'Now',
    runLabel: runway.runOut !== null && runway.runOut !== undefined ? 'Runs out ' + fmtClock(start + (runway.runOut / 100) * span, now) : '',
    gap: runway.runOut !== null && runway.runOut !== undefined ? roughSpan(resetsAt - (start + (runway.runOut / 100) * span)) : '',
    endLabel: 'Resets ' + fmtClock(resetsAt, now),
  }
}

// Where "today" was counted: every chat on this computer when their records were read; otherwise only the chats
// that report to ToBeBestMe (this one, and any other running it), said so a reader is not told it covers chats
// that could not be read.
function todayScope(d) {
  if (d.usage && !d.usage.isEmpty) return { all: true, in: 'in every chat on this computer', short: 'in every chat' }
  const why = !d.opts.scanProjects ? 'reading every project is off' : (d.scan || {}).status === 'unavailable' ? 'other chats couldn’t be read' : 'other chats not read yet'
  return { all: false, in: 'in chats running ToBeBestMe', short: 'in chats running ToBeBestMe', why }
}

// Whether what waits for the person could be read at all, so "nothing is waiting" is only said when
// it was looked for: the records read (or nothing in them yet) is 'read'; unreadable is 'failed'; the
// reading of every project turned off is 'off'; the first reading still under way is 'reading'.
function waitingRead(d, h) {
  if (!d.opts.scanProjects) return 'off'
  if (h.has) return 'read'
  const sc = h.sc
  if (sc.status === 'unavailable') return 'failed'
  return sc.status === 'ok' && !sc.isRunning ? 'read' : 'reading'
}

// The line under a waiting headline, said the same on Home and the phone: what a count of several things
// is made of, and what could not be read, so more may be waiting than is shown.
function waitNotes(tally, read) {
  const notes = []
  if (tally.total > 1 && tally.chats !== tally.total && tally.prs !== tally.total) notes.push(waitingParts(tally).replace(/^./, (c) => c.toUpperCase()))
  if (read === 'failed') notes.push(tally.total ? 'Claude Code’s records couldn’t be read, so more may be waiting' : 'Claude Code’s records couldn’t be read, so chats and pull requests in other projects are unknown')
  else if (read === 'off' && !tally.total) notes.push('Reading every project is off, so other chats aren’t checked')
  return notes
}

// Home's headline and its glyph: what waits, or why it cannot be said that nothing does. Amber for
// something to do (an answer, or the records to read again), green only for a true all clear.
function homeHeadline(tally, read) {
  if (tally.total) return [waitingTitle(tally), ['●', { color: 'warning' }]]
  if (read === 'failed') return ['Can’t tell what’s waiting', ['●', { color: 'warning' }]]
  if (read === 'off') return ['Nothing is waiting in this chat', ['○', { dimColor: true }]]
  if (read === 'reading') return ['Checking what’s waiting…', ['○', { dimColor: true }]]
  return ['Nothing is waiting for you', ['✓', { color: 'success' }]]
}

// The day's answer: the date, how much waits for you, and how much room is left, with the
// tightest limit drawn full width beneath, so where you stand reads at a glance.
function homeHero(k, d, h, act) {
  const { w, tightest } = h
  const tally = waitingCount(w.needs, d.flows && d.flows.approval)
  let date = ''
  try {
    date = new Date(d.now).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    date = dayKey(d.now)
  }
  const [headline, glyph] = homeHeadline(tally, h.read)
  const u = d.usage
  const waits = waitNotes(tally, h.read)
  const facts = []
  if (u && !u.isEmpty) facts.push('Today, in every chat: ' + (SHARE ? ofLimit(cost(d.today)) : fmtUsd(d.today) + ' of work') + ', across ' + plural(u.today.projects, 'project', 'projects') + ' and ' + plural(u.today.sessions, 'chat', 'chats'))
  if (!tally.total && w.pickup.length) facts.push('Pick up where you left off below')
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
        key ? k.button('legend-' + key, (key === picked ? '✓ ' : '') + x.name, () => act.setView({ project: key === picked ? '' : key }), { name: key === picked ? 'Show every project, not only ' + x.name : 'Show only ' + x.name, ...(key === picked ? {} : { plain: true, dimColor: true }) }) : k.footnote(x.name),
      ],
    })
  const level = tightest ? (shownPct(tightest.pct) >= Math.max(90, d.opts.limitAlertAt) ? 'error' : shownPct(tightest.pct) >= d.opts.limitAlertAt ? 'warning' : 'success') : 'success'
  const kind = tightest ? kindOfLabel(tightest.label) : 'seven_day'
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
      // the status glyph sits beside the headline's first line, however many lines it takes
      k.hang(k.Box({ paddingTop: k.isTerminal ? undefined : 'xs', children: [k.text(glyph[0], glyph[1])] }), k.text(headline, { size: 'title', weight: 'semibold', wrap: 'wrap' })),
      ...(waits.length ? [k.text(waits.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })] : []),
      ...(facts.length ? [factsTip ? k.hoverBox('all-facts', { flexDirection: 'column' }, [k.text(facts.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })], { ...factsTip, align: 'left' }) : k.text(facts.join(' · ') + '.', { dimColor: true, wrap: 'wrap' })] : []),
    ],
  })
  // where the week is drawn whole, the figure and the forecast are in that drawing and not repeated
  const weekDrawn = !!(item && item.days && k.hasSvg)
  const figure = item && !weekDrawn
    ? k.Box({
        flexDirection: 'column',
        alignItems: isWide ? 'flex-end' : 'flex-start',
        flexShrink: 0,
        ...(isWide ? { paddingLeft: 'lg' } : { paddingTop: 'xs' }),
        children: [
          heroFigure(k, pctText(tightest.pct), { size: 52, level, align: isWide ? 'end' : 'start' }) || k.text(pctText(tightest.pct), { size: 'title', weight: 'semibold', tabular: true, color: quiet(level) }),
          k.footnote('of your ' + limitPhrase(tightest.label) + (level === 'error' ? (tightest.pct >= 100 ? ' · used up' : ' · nearly out') : level === 'warning' ? ' · past your alert' : ''), { wrap: 'truncate-end', ...(level === 'success' ? {} : { color: level, dimColor: undefined }) }),
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
                ...(weekDrawn ? heroCalendar(k, d, h, act, { level, pace, early, tightest }) : [runwayBar(k, item, 'hero', k.px - 8)]),
                // the limit's name, how much is used and the projects in the bars: one row, whose card
                // rises above it, so the legend, wrapped on a narrow pane, never covers it
                k.hoverBox(
                  'all-limit-name',
                  { flexDirection: 'row', flexWrap: 'wrap', columnGap: 'md', rowGap: 'xs', alignItems: 'center' },
                  [
                    k.Button({ key: 'all-limits', plain: true, onPress: () => act.setView({ tab: 'usage', confirm: '' }), children: [tightest.label + ' ›'] }),
                    ...(pace && !weekDrawn ? [k.Box({ flexShrink: 1, children: [k.text(pace, { size: 'footnote', wrap: 'wrap', ...(early ? { color: 'warning' } : { dimColor: true }) })] })] : []),
                    k.Box({ flexGrow: 1 }),
                    ...(k.hasSvg && item.window ? [] : [k.footnote(tightest.resetsAt ? 'resets in ' + fmtSpan(tightest.resetsAt - d.now) : '', { tabular: true, wrap: 'truncate-end' })]),
                    ...(legend.length ? [k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'sm', rowGap: 'xs', flexShrink: 1, children: legend.map(legendItem) })] : []),
                  ],
                  { title: tightest.label, lines: [tightest.resetsAt ? 'Resets ' + fmtClock(tightest.resetsAt, d.now) + '.' : '', (h.plan.source === 'app' ? (h.plan.plan ? h.plan.plan + ' plan. ' : '') : h.plan.source === 'session' ? 'From this chat’s latest reading. ' : 'As read ' + ago(d.now - h.plan.at) + ' by another chat. ') + 'Every project draws on the same limits.', legend.length ? 'The bars under it are each day’s work, by project.' : '', 'Press its name for every limit on Usage.'], align: 'left' },
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
// reads "Fable weekly limit".
function limitPhrase(label) {
  const m = /^(.*?) · (.*)$/.exec(String(label || ''))
  if (!m) return String(label || '').toLowerCase()
  const base = m[1].toLowerCase().replace(/ limit$/, '') + ' limit'
  return /^all models$/i.test(m[2]) ? base + ', all models' : m[2] + ' ' + base
}

// day, laid out by the same fractions of the window so each sits under its column. A day pressed is
// picked out (the others step back), its words show below, and Projects shows that day. Days to
// come, and a sliver of a day too narrow for its name, are not pressable.
function heroCalendar(k, d, h, act, say) {
  const it = h.item
  const r = it.runway
  // the app draws an interactive drawing at the width it is given in pixels (none means the browser's
  // 300px default), so the calendar names its width and the day buttons share one box with it
  const W = Math.round(k.px - 8)
  const picked = it.days.findIndex((x) => x.key === d.view.day)
  const { level, pace, early, tightest } = say
  const label = 'of your ' + limitPhrase(tightest.label) + (level === 'error' ? (tightest.pct >= 100 ? ' · used up' : ' · nearly out') : level === 'warning' ? ' · past your alert' : '')
  const src = svgWeek({ ...r, hex: it.hex, ...it.window, days: it.days, picked, label, sentence: pace, level, early, figHexes: figureHues(level) }, { width: W })
  const H = Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(src)[1])
  const words = 'The week: ' + it.valueText + ' ' + label + '. ' + (pace || '') + ' ' + it.window.endLabel + '.' + (it.daysAlt || '') + ' The line is what has been used so far, the dashed line where this pace leads' + (r.runOut !== null && r.runOut !== undefined ? ', and the hatched stretch is the time without Claude' : '') + '.'
  const span = Math.max(1, it.window.endMs - it.window.startMs)
  const columns = it.days.map((x) => {
    const frac = (x.endMs - x.startMs) / span
    const room = frac * W
    const isPicked = x.key === d.view.day
    // "Today" where its column holds it (a quiet button is just its word, a picked one has padding), the weekday where it does not
    const label = x.isToday && room >= (isPicked ? 56 : 42) ? 'Today' : x.short
    const kid =
      room < 34 ? []
      : x.total > 0 ? [k.button('day-' + x.key, label, () => act.setView({ day: isPicked ? '' : x.key }), { name: isPicked ? 'Show the whole week, not only ' + new Date(dayKeyMs(x.key)).toLocaleDateString([], { weekday: 'long' }) : 'Show ' + (x.isToday ? 'today' : new Date(dayKeyMs(x.key)).toLocaleDateString([], { weekday: 'long' })) + '’s work', ...(isPicked ? {} : { plain: true, dimColor: x.isToday ? undefined : true }) })]
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
  const kind = kindOfLabel(x.label)
  const runway = runwayOf(kind, x.pct, x.resetsAt, now)
  const hex = level === 'success' ? planHex(x.label) : HEX[level]
  const where = plan.source === 'app' ? (plan.plan ? plan.plan + ' plan. ' : '') : plan.source === 'session' ? 'From this chat’s latest reading. ' : 'As read ' + ago(now - plan.at) + ' by another chat. '
  const isRoomy = k.columns >= 64
  // where it runs out when that is early enough to matter, else when it resets
  const runOutAt = x.resetsAt && WINDOW_MS[kind] && runway.runOut !== null && runway.runOut !== undefined ? x.resetsAt - WINDOW_MS[kind] + (runway.runOut / 100) * WINDOW_MS[kind] : 0
  return k.hoverBox('plan-' + i, { flexDirection: 'row', columnGap: 'md', alignItems: 'center', width: '100%' }, [
    k.Box({ width: isRoomy ? 24 : 16, flexShrink: 0, children: [k.Text({ wrap: 'truncate-end', children: [k.text('● ', { color: k.isTerminal ? (level === 'success' ? 'suggestion' : level) : quiet(level) || midHex(hex) }), k.text(x.label)] })] }),
    k.Box({ flexGrow: 1, flexShrink: 1, children: [runwayBar(k, { runway, hex, label: x.label, valueText: pctText(x.pct) }, 'tile')] }),
    k.Box({ width: 5, flexShrink: 0, justifyContent: 'flex-end', children: [k.text(pctText(x.pct), { tabular: true, weight: 'semibold', color: quiet(level) })] }),
    ...(isRoomy ? [k.Box({ width: 22, flexShrink: 0, justifyContent: 'flex-end', children: [k.footnote(runOutAt ? 'runs out ' + fmtClock(runOutAt, now) : x.resetsAt ? 'resets in ' + fmtSpan(x.resetsAt - now) : '', { tabular: true, wrap: 'truncate-end', ...(runOutAt ? { color: 'warning', dimColor: undefined } : {}) })] })] : []),
  ], { title: x.label + ', ' + pctText(x.pct) + ' used', lines: [x.resetsAt ? 'Resets ' + fmtClock(x.resetsAt, now) + '.' : '', where + 'Every project draws on the same limits.'] })
}

function canAnswer(w, x) {
  return w.canReply && !!x.deskId && x.kind !== 'pr' && x.kind !== 'permission'
}

// What a waiting chat asks, in the words the desktop and the phone both use: the label already says
// "permission", so a permission's words start at what is being asked.
function needAsk(x) {
  return x.kind === 'permission' && x.text ? x.text.replace(/^(needs )?(your )?permission to /i, '').replace(/^./, (c) => c.toUpperCase()) : x.text || ''
}

// Where a waiting chat's folder is, as a person reads it.
function needFolder(x) {
  return x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : ''
}

// How to get to a permission that is asked in a session that is running: the pane cannot say yes for it, so it says where it is.
function permissionHow(x) {
  const where = whereRan(x.entry)
  const folder = needFolder(x)
  return 'Switch to that chat to allow or deny it' + (where || folder ? ' (' + [where, folder].filter(Boolean).join(', ') + ')' : '') + '.'
}

// The one sentence for a chat that cannot be answered from the pane, the same on the desktop and the phone's lobby.
function needHow(w, x, canSend) {
  if (canSend || x.kind === 'pr') return ''
  if (x.kind === 'permission') return permissionHow(x)
  return x.entry === 'terminal' || !w.canReply ? 'Carry it on in a terminal with the resume command.' : 'Open it from the sidebar to answer.'
}

// One waiting chat: what it is, its words, and the ways to answer it. The first chat you can
// answer from here carries the view's one primary button.
function needRow(k, d, act, w, x, i, isFirst, isOpen = true, isLead = false) {
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
    x.replies.forEach((r, j) => buttons.push(k.button('need-' + i + '-r' + j, r.label, () => act.setView({ confirm: 'reply:' + x.key + ':' + j, replying: '' }), { variant: isFirst && j === 0 ? 'primary' : undefined, about: x.title })))
    if (x.kind === 'error' && x.hasReset) buttons.push(k.button('need-' + i + '-go', 'Tell it to carry on', () => act.setView({ confirm: 'reply:' + x.key + ':' + x.replies.length, replying: '' }), { variant: isFirst ? 'primary' : undefined, about: x.title }))
    buttons.push(k.button('need-' + i + '-type', x.kind === 'plan' ? 'Answer…' : 'Reply…', () => act.setView({ replying: x.key, confirm: '', focus: 'need-' + i + '-input' }), { variant: isFirst && !x.replies.length && !(x.kind === 'error' && x.hasReset) ? 'primary' : undefined, about: x.title }))
  }
  if (x.prUrl && k.Link) buttons.push(k.Link({ href: x.prUrl, label: 'Open pull request #' + x.prNumber }))
  if (x.prUrl && x.pr) buttons.push(k.button('need-' + i + '-copylink', 'Copy link', (ev) => act.copyText(x.prUrl, ev && ev.surface, 'Link'), { plain: true, dimColor: true, about: x.title }))
  // a session running now, or one whose work is a pull request, isn't carried on from a terminal
  const canResume = !!x.sid && !x.isLive && x.kind !== 'pr'
  if (canResume && asking < 0 && !isTyping) buttons.push(k.button('need-' + i + '-copy', 'Copy resume command', (ev) => act.copyResume(x, ev && ev.surface), { plain: true, dimColor: true, about: x.title }))
  // a permission is asked in the session that is running, which only answers there: the pane can't say yes for it, but it can
  // say where it is and take you to its folder
  const folder = needFolder(x)
  if (x.isLive && x.kind === 'permission' && x.cwd && asking < 0 && !isTyping) buttons.push(k.button('need-' + i + '-folder', 'Copy folder path', (ev) => act.copyText(x.cwd, ev && ev.surface, 'Folder path'), { plain: true, dimColor: true, about: x.title }))
  if (asking < 0 && !isTyping) buttons.push(k.button('need-' + i + '-later', 'Set aside', () => act.dismissNeed(x), { plain: true, dimColor: true, about: x.title }))
  if (asking < 0 && !isTyping && i > 0 && !isFirst) buttons.push(k.button('need-' + i + '-close', 'Hide options', () => act.setView({ openNeed: '' }), { plain: true, dimColor: true, about: x.title }))
  const how = needHow(w, x, canSend)
  const isWide = k.columns >= 64
  // the label already says "permission"; its words start at what is being asked
  const needText = needAsk(x)
  const dotLevel = level === 'info' ? { dimColor: true } : { color: level }
  const head = [
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
  ]
  const tail = [
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
              k.buttons([k.button('reply-go', 'Send reply', () => act.sendReply(x, pending), { variant: 'primary', autoFocus: true }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }))]),
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
              k.Input({ key: 'need-' + i + '-input', label: 'Answer', placeholder: 'Your answer to “' + x.title + '”', submitLabel: 'Send', rows: 2, autoFocus: true, onSubmit: (value) => act.sendReply(x, value) }),
              k.Box({ flexDirection: 'row', columnGap: 'md', alignItems: 'center', flexWrap: 'wrap', children: [k.buttons([k.button('reply-cancel', 'Cancel', () => act.setView({ replying: '', focus: 'need-' + i + '-type' }))]), k.footnote('Return sends it to that chat.')] }),
            ],
          }),
        ]
      : []),
    ...(buttons.length ? [k.Box({ marginTop: 'xs', children: [k.buttons(buttons)] })] : []),
  ]
  // the most urgent chat is one large card: a flat tint of its status colour (about a tenth of it, over the
  // group's own grey), its title at heading size, what it asks set apart, and its own answers under it
  if (isLead && !k.isTerminal) {
    const tip = { title: x.title, lines: [folder, canResume ? 'To carry it on in any terminal, from its own folder, press Copy resume command.' : ''] }
    const tintHex = level === 'error' ? HEX.error : level === 'warning' ? HEX.warning : HEX.marker
    return k.hoverBox(
      'need-' + i,
      { flexDirection: 'column', width: '100%' },
      [
        k.Box({
          flexDirection: 'column',
          rowGap: 'sm',
          paddingX: 'md',
          paddingY: 'md',
          backgroundColor: tintHex + '0F', // about 6%: red and grey words on it still hold 4.5:1
          borderStyle: 'round',
          borderDimColor: true,
          children: [
            k.Text({ wrap: 'wrap', children: [k.text('●  ', dotLevel), k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) })] }),
            k.text(x.title, { size: 'title', weight: 'semibold', wrap: 'wrap' }),
            ...(meta ? [k.footnote(meta, { wrap: 'wrap' })] : []),
            ...(needText ? [k.Box({ paddingX: 'md', paddingY: 'sm', borderStyle: 'round', borderDimColor: true, children: [k.text(needText, { weight: 'medium', wrap: 'wrap' })] })] : []),
            ...tail,
            // with Show details on, what the hover card says is in the card it belongs to, not under it
            ...(k.showDetails ? k.details(tip) : []),
          ],
        }),
      ],
      k.showDetails ? undefined : tip,
    )
  }
  const column = [...head, ...tail]
  // the most pressing chat is drawn whole; the others are one line each until opened
  if (!isOpen && asking < 0 && !isTyping) {
    const brief = [column[0], ...(!isWide && meta ? [column[1]] : []), k.Text({ wrap: isWide ? 'truncate-end' : 'wrap', children: [k.text(label, { size: 'footnote', weight: 'semibold', ...(level === 'info' ? { dimColor: true } : { color: level }) }), ...(needText ? [k.text('   ' + needText, { dimColor: true })] : [])] })]
    return k.hoverBox('need-' + i, { flexDirection: 'column', width: '100%' }, [k.hang(k.text('●', dotLevel), k.Box({ flexDirection: 'column', rowGap: 'xs', flexGrow: 1, flexShrink: 1, children: [...brief, k.Box({ children: [k.button('need-' + i + '-open', 'Show options', () => act.setView({ openNeed: x.key }), { plain: true, dimColor: true, about: x.title })] })] }))], { title: x.title, lines: [folder] })
  }
  return k.hoverBox(
    'need-' + i,
    { flexDirection: 'column', width: '100%' },
    [k.hang(k.text('●', dotLevel), k.Box({ flexDirection: 'column', rowGap: 'xs', flexGrow: 1, flexShrink: 1, children: column }))],
    { title: x.title, lines: [folder, canResume ? 'To carry it on in any terminal, from its own folder, press Copy resume command.' : ''] },
  )
}

function needsCard(k, d, act, w) {
  if (!w.needs.length) return null
  const shown = d.view.showAllNeeds ? w.needs : w.needs.slice(0, 5)
  const more = w.needs.length - shown.length
  const first = shown.find((x) => canAnswer(w, x))
  // the most urgent chat is the one large card on desktop: a permission, then a question, then one waiting for an answer
  const rank = (x) => (x.kind === 'permission' ? 0 : x.kind === 'question' ? 1 : x.kind === 'ask' ? 2 : x.kind === 'plan' ? 3 : x.kind === 'error' && !x.hasReset ? 4 : x.kind === 'error' ? 5 : 6)
  const leadAt = k.isTerminal ? -1 : shown.reduce((best, x, i) => (best < 0 || rank(x) < rank(shown[best]) ? i : best), -1)
  // counted as the headline and the phone count them: all of w.needs, the lead included
  const tally = waitingCount(w.needs, null)
  return k.card(
    'Needs you',
    'Chats and pull requests waiting for you, the most pressing first.' + (w.canReply ? ' Answers go straight to that chat.' : ''),
    [
      ...(leadAt >= 0 ? [needRow(k, d, act, w, shown[leadAt], leadAt, shown[leadAt] === first, true, true)] : []),
      ...(leadAt >= 0 && shown.length > 1 ? [k.Box({ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 'sm', paddingTop: 'xs', children: [k.text('Also waiting', { weight: 'semibold' }), k.footnote((more > 0 ? 'Showing ' + shown.length + ' of ' + w.needs.length + ', counting the one above. ' : '') + 'Open a row to answer it.')] })] : []),
      ...shown.map((x, i) => (i === leadAt ? null : needRow(k, d, act, w, x, i, x === first, (leadAt < 0 && i === 0) || x === first || d.view.openNeed === x.key))).filter(Boolean),
      ...(w.needs.length > 5 ? [k.buttons([k.button('needs-more', more > 0 ? 'Show ' + more + ' more' : 'Show fewer', act.toggleNeeds, { dimColor: true })])] : []),
    ],
    { gap: 'lg', accessory: k.footnote(waitingParts(tally), { tabular: true }) },
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
              k.button('pick-' + i + '-open', 'Show details', () => act.setView({ openPick: x.key }), { plain: true, dimColor: true, about: x.title }),
            ],
          }),
          ...(loose ? [k.Box({ flexDirection: 'row', columnGap: 'sm', alignItems: 'center', children: [k.text('● ', { color: 'warning' }), k.text(loose, { size: 'footnote', weight: 'medium', wrap: 'truncate-end' })] })] : []),
        ],
        { title: x.title || x.project, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Last answer ' + ago(d.now - x.at) + '.'] },
      )
    }
    const buttons = []
    if (!isTyping) {
      if (canSend) buttons.push(k.button('pick-' + i + '-type', 'Tell it what’s next…', () => act.setView({ replying: 'pick:' + x.key, confirm: '', focus: 'pick-' + i + '-input' }), { about: x.title }))
      // a session working now carries on by itself; a second copy of it in a terminal would compete
      if (!x.isRunning) buttons.push(k.button('pick-' + i + '-copy', 'Copy resume command', (ev) => act.copyResume(x, ev && ev.surface), { plain: true, dimColor: true, about: x.title }))
      if (i > 0) buttons.push(k.button('pick-' + i + '-close', 'Hide details', () => act.setView({ openPick: '' }), { plain: true, dimColor: true, about: x.title }))
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
                  k.Input({ key: 'pick-' + i + '-input', label: 'Next step', placeholder: 'What should “' + (x.title || x.project) + '” do next?', submitLabel: 'Send', rows: 2, autoFocus: true, onSubmit: (value) => act.sendReply({ ...x, title: x.title || x.project, key: 'pick:' + x.key }, value) }),
                  k.Box({ flexDirection: 'row', columnGap: 'md', alignItems: 'center', flexWrap: 'wrap', children: [k.buttons([k.button('reply-cancel', 'Cancel', () => act.setView({ replying: '', focus: 'pick-' + i + '-type' }))]), k.footnote('Return sends it to that chat.')] }),
                ],
              }),
            ]
          : []),
        ...(buttons.length ? [k.buttons(buttons)] : []),
      ],
      { title: x.title || x.project, lines: [x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Last answer ' + ago(d.now - x.at) + '.'] },
    )
  })
  return k.card('Pick up where you left off', 'The latest chat in each project you worked on this week, with the last thing it told you.', rows, { gap: 'lg' })
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
  const why = a.state === 'held' ? (a.heldFor === 'paused' ? 'waiting: the run is paused' : a.heldFor === 'budget' ? 'waiting: the run reached its budget' : 'waiting: at the run’s budget') : a.state === 'failed' && a.error ? a.error : a.doing || ''
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
  if (e.basis && e.high > 0) facts.push('Likely ' + holdRange(SHARE ? ofLimit(sayRange(e.low, e.high)) : fmtUsdRange(e.low, e.high, cost)) + (!SHARE && share ? ' (' + shareWords(e.high, share) + ' at most)' : '') + (e.isSameWorkflow ? ', going by what it cost before' : ', from what agents cost in ' + plural(e.basis, 'finished run', 'finished runs')))
  if (d.opts.workflowBudget > 0) facts.push('New agents wait once it costs ' + fmtUsd(d.opts.workflowBudget) + ', your budget for every run')
  if (p.models.length) facts.push('Models it names: ' + p.models.map(titleCase).join(', '))
  const tips = a.tips || []
  return k.card(
    'Claude wants to run ' + (p.name ? '“' + p.name + '”' : 'a workflow'),
    p.description || 'A workflow starts several agents, often in stages, each working on one part.',
    [
      ...facts.map((f) => k.hang(k.text('●', { dimColor: true }), k.text(f, { wrap: 'wrap' }))),
      ...tips.map((t) => k.hang(k.text('●', { color: 'warning' }), k.text(t, { wrap: 'wrap' }))),
      k.hang(k.text('●', { dimColor: true }), k.text('Answer in the chat: Run workflow, Run every agent on Sonnet or Don’t run. It puts every agent on Sonnet, including stages the script put on a stronger model. Closing the question declines it.', { wrap: 'wrap' })),
      // the question is the chat's own dialog, which the pane cannot answer: its one action hands the keys back to it
      k.buttons([k.button('flow-answer', 'Go to the chat to answer', act.answerInChat, { variant: 'primary' }), ...(isHome ? [k.button('flow-see', 'Open Workflows', act.openWorkflows, { plain: true, dimColor: true })] : [])]),
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
  const state = isStopping ? ['■ ', 'warning', 'Stopping'] : atLimit ? ['‖ ', 'warning', 'Paused at its ' + fmtUsd(r.budget) + ' budget'] : r.paused ? ['‖ ', 'warning', 'Paused'] : ['● ', 'suggestion', 'Running']
  const budgets = [{ value: 0, label: 'No budget' }, ...[5, 10, 25, 50].map((v) => ({ value: v, label: fmtUsd(v).replace('.00', '') }))]
  if (r.budget && !budgets.some((b) => b.value === r.budget)) budgets.push({ value: r.budget, label: fmtUsd(r.budget).replace('.00', '') })
  const raiseTo = [5, 10, 25, 50, 100, 250, 500].find((v) => v > Math.max(r.budget || 0, p.usd)) || Math.ceil((p.usd * 2) / 50) * 50
  // the timeline: every agent from start to finish, the newest 24, oldest at the top
  const timed = [...p.agents].filter((a) => a.startedAt || a.queuedAt).sort((a, z) => (a.startedAt || a.queuedAt) - (z.startedAt || z.queuedAt)).slice(-24)
  const caps = [{ value: 0, label: 'No cap' }, { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 4, label: '4' }, { value: 8, label: '8' }]
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
              k.footnote('Agents already working finish their current step and nothing new starts. Finished work is kept, and the run can be resumed later in this chat.'),
              k.buttons([k.button('flow-stop-go', 'Stop workflow', () => act.stopRun(r.runId), { variant: 'primary' }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })]),
            ],
          }),
        ]
      : [
          ...(atLimit
            ? [
                k.text((r.name || 'This run') + ' has cost ' + fmtUsd(p.usd) + ', past its ' + fmtUsd(r.budget) + ' budget. Agents already working finish their step; new ones wait for you.', { wrap: 'wrap' }),
                k.buttons([
                  k.button('flow-raise-' + i, 'Raise budget to ' + fmtUsd(raiseTo).replace('.00', ''), () => act.setRunBudget(r.runId, raiseTo), { variant: i === 0 ? 'primary' : undefined, about: r.name || 'this run' }),
                  k.button('flow-nolimit-' + i, 'Remove run budget', () => act.setRunBudget(r.runId, 0), { about: r.name || 'this run' }),
                ]),
              ]
            : []),
          k.Box({ flexDirection: 'row', flexWrap: 'wrap', columnGap: 'lg', rowGap: 'sm', alignItems: 'center', children: [
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Agents at once'), k.segmented('flow-cap-' + i, caps, r.cap || 0, (v) => act.setRunCap(r.runId, v), 'Agents at once')] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Model for new agents'), k.segmented('flow-model-' + i, models, r.model || '', (v) => act.setRunModel(r.runId, v), 'Model for new agents')] }),
            k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.footnote('Run budget'), k.segmented('flow-budget-' + i, budgets, r.budget || 0, (v) => act.setRunBudget(r.runId, v), 'Run budget')] }),
          ] }),
          k.buttons([
            ...(atLimit ? [] : [k.button('flow-pause-' + i, r.paused ? 'Resume' : 'Pause new agents', () => act.pauseRun(r.runId, !r.paused), { variant: i === 0 ? 'primary' : undefined, about: r.name || 'this run' })]),
            // the pane stops a run through its task; with no task known it says so and hands over the request that stops it
            r.taskId
              ? k.button('flow-stop-' + i, 'Stop workflow…', () => act.setView({ confirm: 'stop:' + r.runId }), { about: r.name || 'this run' })
              : k.button('flow-stop-' + i, 'Copy stop request', (ev) => act.copyText(stopRequest(r.name, r.runId), ev && ev.surface, 'Stop request'), { about: r.name || 'this run' }),
            k.button('flow-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true, about: r.name || 'this run' }),
          ]),
          ...(r.taskId ? [] : [k.footnote('This dashboard doesn’t know which task runs this workflow, so it can’t stop it. Send the copied request to Claude and it stops the run.')]),
          k.footnote(r.paused ? 'Paused: agents already working carry on; new ones wait until you resume.' : r.cap ? 'At most ' + plural(r.cap, 'agent works', 'agents work') + ' at once; the rest wait their turn.' : 'Pausing lets working agents finish and holds new ones; a limit spreads the work out, so it uses your plan more slowly.'),
          // what the budget does, said where it is set: the run is not stopped, new agents wait
          k.footnote(r.budget ? 'New agents wait once this run has cost ' + fmtUsd(r.budget) + '.' : 'A run budget holds new agents once the run has cost that much.'),
        ]
  return k.card(
    r.name || 'Workflow',
    r.description || r.summary || '',
    [
      k.Text({ wrap: 'wrap', children: [k.text(state[0], { color: state[1] }), k.text(state[2], { weight: 'semibold', color: state[1] === 'suggestion' ? undefined : state[1] }), k.text('  ' + facts.join(' · '), { dimColor: true, tabular: true })] }),
      ...(k.hasSvg && p.phases.some((ph) => ph.total > 0) ? [k.Svg({ source: svgStages(p.phases), alt: 'Stages: ' + p.phases.map((ph) => ph.title + ' ' + ph.done + ' of ' + ph.total).join(', '), height: 14, isInteractive: true })] : []),
      stageLine(k, p),
      // a timeline of agents that have only just started is two specks: it waits for a minute of history
      ...(k.hasSvg && timed.length >= 2 && d.now - (r.startedAt || timed[0].queuedAt) >= MIN_MS
        ? [
            k.Box({
              flexDirection: 'column',
              rowGap: 'xs',
              children: [
                k.Svg({ source: svgTimeline(timed, r.startedAt || timed[0].queuedAt, timelineTime(timed, r.startedAt || timed[0].queuedAt, d.now)), alt: 'Timeline of ' + plural(timed.length, 'agent', 'agents') + ', each from start to finish', height: timed.length * 12 - 4, isInteractive: true }),
                k.Box({ flexDirection: 'row', children: [k.Box({ flexGrow: 1, children: [k.footnote('Started ' + ago(d.now - (r.startedAt || timed[0].queuedAt)))] }), k.footnote('now')] }),
              ],
            }),
          ]
        : []),
      ...(r.estimate && r.estimate.high > 0 ? [k.footnote('Expected ' + holdRange(fmtUsdRange(r.estimate.low, r.estimate.high, cost)) + ' before it started' + (p.usd > r.estimate.high ? '; it has gone past that.' : '.'), p.usd > r.estimate.high ? { color: 'warning', dimColor: undefined } : {})] : []),
      ...(r.tips || []).map((t) => k.hang(k.text('●', { color: 'warning' }), k.footnote(t))),
      ...(shown.length ? [k.Box({ flexDirection: 'column', rowGap: k.isTerminal ? 0 : 'xs', children: shown.map((a, j) => agentRow(k, d, a, 'flow-' + i + '-a' + j)) })] : [k.footnote('No agents have started yet.')]),
      ...(agents.length > 6 && p.total > 8 ? [k.buttons([k.button('flow-more-' + i, isOpen ? 'Show fewer' : 'Show all ' + agents.length + ' agents', () => act.setView({ openRun: isOpen ? '' : r.runId }), { dimColor: true, about: r.name || 'this run' })])] : []),
      ...controls,
    ],
    { gap: 'md' },
  )
}

// A cost range in the page's one unit: "$14.40–$28.80", or "14%–29%", or "1.2–2.4 weeks’ worth".
function sayRange(low, high) {
  const a = cost(low)
  const b = cost(high)
  if (a === b) return b
  return /worth$/.test(a) && /worth$/.test(b) ? a.replace(/ weeks?’ worth$/, '') + '–' + b : a + '–' + b
}

// A sentence worked out in dollars, said in shares of the weekly limit: each "$3.75" or "$3.75–$4.20" is
// a share of it, and says so ("4% of your weekly limit"), so no figure is left without what it is a share of.
// Each sentence the ideas are told in holds one such figure, so none reads as a share of another.
function dollarsAsShare(text) {
  const num = (x) => Number(String(x).replace(/,/g, ''))
  return String(text).replace(/\$(\d[\d,]*(?:\.\d+)?)(?:–\$(\d[\d,]*(?:\.\d+)?))?/g, (m, a, b) => ofLimit(b ? sayRange(num(a), num(b)) : cost(num(a))))
}

// What could be better next time, for one finished run or across all of them: what it saw, a
// range for what it would have saved, what has happened since it became a rule, and the choices.
function savingRow(k, act, f, key, runId, share, isLead = false, maxHigh = 0) {
  // one unit on the card: the share of the limit when that is what the page speaks in, else dollars
  if (!SHARE) share = null
  const range = f.high >= 1 ? holdRange(f.high - f.low >= 1 ? sayRange(f.low, f.high) : cost(f.high)) : ''
  const detail = holdRange(share ? dollarsAsShare(f.detail) : f.detail)
  // the share of the limit first, dollars second, whenever the plan has a limit to take a share of
  const words = share ? shareWords(f.high, share) : ''
  const value = range ? (share ? (/^under/.test(words) ? 'Could have saved less than ' + words.replace(/^under /, '') : 'Could have saved up to ' + words.replace(/^about /, '')) : 'Would have saved about ' + range) : f.minutes ? 'About ' + fmtSpan(f.minutes * MIN_MS) + ' less waiting' : ''
  const since = f.since && f.since.text ? f.since : null
  const isNarrow = k.columns < 64
  return k.Box({
    flexDirection: 'column',
    rowGap: 'xs',
    width: '100%',
    children: [
      // on a narrow pane the saving goes under the title: beside it, the title would be squeezed under the words
      k.Box({ flexDirection: isNarrow ? 'column' : 'row', columnGap: 'sm', rowGap: 'xs', alignItems: 'flex-start', children: [
        k.Box({ flexGrow: 1, flexShrink: 1, children: [k.text(f.title, { weight: 'semibold', wrap: 'wrap' })] }),
        ...(value ? [k.Box({ flexShrink: 0, flexDirection: 'column', alignItems: isNarrow ? 'flex-start' : 'flex-end', rowGap: 'xs', children: [k.text(value, { tabular: true, size: 'footnote', weight: 'medium' }), ...(k.hasSvg && range && maxHigh > 0 ? [k.drawing(svgMiniBar(f.high / maxHigh), 'This idea’s share of the largest saving: up to ' + range + ' of up to ' + cost(maxHigh) + ', an estimate')] : [])] })] : []),
      ] }),
      k.text(detail, { wrap: 'wrap' }),
      ...(since ? [k.hang(k.text(since.level === 'good' ? '✓' : since.level === 'warn' ? '●' : '○', since.level === 'good' ? { color: 'success' } : since.level === 'warn' ? { color: 'warning' } : { dimColor: true }), k.text(since.text, { size: 'footnote', wrap: 'wrap', weight: 'medium' }))] : []),
      k.buttons([
        k.button(key + '-rule', f.adoptedAt ? 'Add the rule again…' : 'Make it a rule…', () => act.adoptSaving(f.key, runId), f.adoptedAt ? { plain: true, dimColor: true } : isLead ? { variant: 'primary' } : { plain: true }, { about: f.title }),
        ...(runId
          ? []
          : f.isHidden
            ? [k.button(key + '-hide', 'Show again', () => act.hideSaving(f.key, false), { dimColor: true, about: f.title })]
            : [k.button(key + '-hide', 'Set aside', () => act.hideSaving(f.key, true), { plain: true, dimColor: true, about: f.title }), k.button(key + '-wrong', 'Not useful', () => act.hideSaving(f.key, true, true), { plain: true, dimColor: true, about: f.title })]),
      ]),
    ],
  })
}

// The savings as two bars: the workflows as they ran, and with the ideas applied (that less the estimated
// saving), a bracket for what comes back, and the same in plain words under it. In shares of the weekly
// limit when that is the unit and workflows used some this week, else in dollars over the period. Every
// figure is an estimate and says so.
function savingsPicture(k, fl, sv, list) {
  if (!k.hasSvg) return []
  const real = list.filter((f) => f.high >= 1)
  if (!real.length || !(sv.usd > 0)) return []
  // the ideas can overlap on one stage, so the total is the most they could give back, held below the whole
  const back = Math.min(real.reduce((n, f) => n + f.high, 0), sv.usd * 0.9)
  const frac = back / sv.usd
  const W = Math.max(240, Math.min(1000, Math.round(k.px - 24)))
  // more than a week's worth cannot be this week's: the headline's own figure, over the days the ideas were worked out from
  const weekRun = SHARE && fl.weekUsd > 0 ? fl.weekUsd * SHARE.pctPerUsd : 0
  const run = weekRun >= 100 ? sv.usd * SHARE.pctPerUsd : weekRun
  const period = weekRun >= 100 ? 'in the last ' + sv.days + ' days' : 'this week'
  let g
  let words
  // The card speaks in the person's one unit, and the callout is the difference of the two figures as they are
  // read, so what is drawn adds up. The ideas can overlap on a stage, so it says what each saves is not additive.
  const overlap = ' The ideas overlap, so what each saves does not add up to this.'
  if (run >= 1) {
    const after = run - run * frac
    // weeks of the limit once the work is more than a week of it, else a share of it
    const inWeeks = run >= 100
    const num = (pct) => (inWeeks ? Math.round(pct / 10) / 10 : pct < 10 ? Math.round(pct * 10) / 10 : Math.min(99, Math.round(pct)))
    const unit = (n) => (inWeeks ? n + (n === 1 ? ' week’s worth' : ' weeks’ worth') : n + '%')
    const shownRun = num(run)
    const shownAfter = num(after)
    const diff = Math.round((shownRun - shownAfter) * 10) / 10
    // "about" because it is an estimate, though the number itself is exactly the difference of the two above it
    const given = inWeeks ? (diff >= 0.1 ? 'about ' + unit(diff) : 'under 0.1 weeks’ worth') : diff >= 1 ? 'about ' + plural(diff >= 10 ? Math.round(diff) : diff, 'point', 'points') : 'under 1 point'
    g = { a: { label: 'As run: ' + ofLimit(unit(shownRun)), value: run }, b: { label: 'With the ideas applied: about ' + unit(shownAfter), value: after }, back: given + ' back', isGood: after < 100 }
    words = 'Workflows took ' + ofLimit(unit(shownRun)) + ' ' + period + '. With these ideas applied they would take about ' + unit(shownAfter) + ', ' + given + (inWeeks ? '' : ' of the limit') + ' given back. An estimate, worked out from the last ' + sv.days + ' days of runs.' + overlap
  } else {
    const usd = (n) => (n >= 100 ? Math.round(n) : Math.round(n * 100) / 100)
    const left = usd(sv.usd - back)
    const given = usd(usd(sv.usd) - left)
    g = { a: { label: 'As run: ' + fmtUsd(sv.usd) + ' in the last ' + sv.days + ' days', value: sv.usd }, b: { label: 'With the ideas applied: about ' + fmtUsd(left), value: left }, back: 'about ' + fmtUsd(given) + ' back' }
    words = 'Workflows cost ' + fmtUsd(sv.usd) + ' at list prices in the last ' + sv.days + ' days. With these ideas applied they would have cost about ' + fmtUsd(left) + ', about ' + fmtUsd(given) + ' less. An estimate.' + overlap
  }
  return [
    k.Box({ flexDirection: 'column', rowGap: 'xs', width: '100%', children: [k.drawing(svgSaving(g, { width: W }), words), k.guide(words, { size: 'footnote' })] }),
  ]
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
      ...(canResume ? [k.buttons([k.button('flow-resume-' + i, 'Resume workflow…', () => act.resumeRun(r), { about: r.name || 'this run' }), k.button('flow-done-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true, about: r.name || 'this run' })])] : []),
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
            k.footnote('This message goes to that chat:'),
            k.Box({ paddingX: k.isTerminal ? 1 : 'md', paddingY: k.isTerminal ? undefined : 'sm', borderStyle: 'round', borderDimColor: true, children: [k.text(stopRequest(r.name, r.runId), { wrap: 'wrap' })] }),
            k.buttons([k.button('flow-ask-go', 'Ask that chat to stop', () => act.askStopElsewhere(r), { variant: 'primary' }), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })]),
          ]
        : [
            k.buttons([
              ...(canAsk && r.deskId ? [k.button('flow-other-stop-' + i, 'Ask that chat to stop…', () => act.setView({ confirm: 'askstop:' + r.runId }), { about: r.name || 'this run' })] : []),
              k.button('flow-other-id-' + i, 'Copy run ID', (ev) => act.copyText(r.runId, ev && ev.surface, 'Run id'), { plain: true, dimColor: true, about: r.name || 'this run' }),
            ]),
          ]),
    ],
    { title: r.name, lines: [r.cwd ? String(r.cwd).replace(/^\/Users\/[^/]+/, '~') : '', 'Read from that chat’s folder. Pause, limits and models apply to runs started in this chat.'] },
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
          ...(x.past ? [k.footnote('Similar runs of yours cost ' + holdRange(x.past.high - x.past.low >= 1 ? cost(x.past.low) + '–' + cost(x.past.high) : cost(x.past.high)) + ' (' + plural(x.past.runs, 'run', 'runs') + ')' + (d.flows.share && !SHARE ? ', ' + shareWords(x.past.high, d.flows.share) + ' at most' : '') + '.')] : []),
          k.buttons([
            k.button('suggest-' + i, 'Start this workflow…', () => act.startSuggested(x.key), { variant: i === 0 && !hasPrimary ? 'primary' : undefined, about: x.title }),
            k.button('suggest-' + i + '-skip', 'Not now', () => act.skipSuggested(x.key), { dimColor: true, about: x.title }),
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
  const words = name + ': ' + cost(p.usd) + (limit ? ' of ' + cost(limit) + (r.budget ? ' budget' : ' expected at most') : '') + ', ' + p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' + (runOut !== null ? ', on course to pass it before it finishes' : '')
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
    lines: [p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done, ' + p.running + ' working' + (p.held ? ', ' + p.held + ' waiting' : '') + '.' : 'Starting.', limit ? 'Cost ' + cost(p.usd) + ' against ' + cost(limit) + (r.budget ? ', its budget.' : ', the most it was expected to cost.') : 'Cost so far ' + cost(p.usd) + '.', runOut !== null ? 'The cost is ahead of the work: at this rate it passes ' + cost(limit) + ' before it finishes.' : 'The strand under the bar is how much of the work is done.'],
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
  const monthFigure = { value: cost(sv.usd), caption: (SHARE && !/worth$/.test(cost(sv.usd)) ? 'of your weekly limit' : 'on workflows') + ' in ' + sv.days + ' days' + (SHARE ? ', estimated at list prices' : '') }
  if (approval) {
    const e = approval.estimate || {}
    facts.push((approval.preview.name ? '“' + approval.preview.name + '”' : 'A workflow') + ' will not start until you answer in the chat')
    if (e.basis && e.high > 0) figure = { value: holdRange(fmtUsdRange(e.low, e.high, cost)), caption: 'likely cost, from your own runs' }
  } else if (running) {
    const first = mine[0]
    if (first) {
      const p = first.progress
      facts.push((first.name || 'Workflow') + ': ' + (p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done' : 'starting') + (p.running ? ', ' + p.running + ' working' : ''))
    }
    if (mine.length && others.length) facts.push(others.length + ' more in other chats')
    else if (!mine.length) facts.push('In other chats')
    const total = mine.reduce((n, r) => n + r.progress.usd, 0) + others.reduce((n, r) => n + (r.usd || 0), 0)
    // what the running ones have cost is a fact of the line under the headline; the figure is what the tab is about, what
    // workflows cost over the month, at every width. With no month yet there is no figure: the running ones' cost is
    // already said in the line above and in their own row, and a figure that appeared later would change what the tab leads with
    facts.push(ofLimit(cost(total)) + ' so far')
    figure = sv.runs ? monthFigure : null
  } else if (sv.runs) {
    facts.push(plural(sv.runs, 'run', 'runs') + ' in the last ' + sv.days + ' days, ' + cost(sv.usd / sv.runs) + ' each')
    if (topIdea) facts.push('could have saved up to ' + cost(topIdea.high))
    figure = monthFigure
  } else {
    facts.push('A workflow splits a big job across several agents. Its cost and what could be cheaper show here once one has run')
  }
  if (!approval && fl.share && fl.weekUsd > 0 && !SHARE) {
    const said = shareWords(fl.weekUsd, fl.share)
    facts.push(/worth$/.test(said) ? said + ' went to workflows this week' : said.replace(/ of your weekly limit$/, '') + ' of this week’s limit went to workflows')
  }
  const level = approval ? 'warning' : 'info'
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

  if (others.length) out.push(k.card('Running in other chats', 'Read from each chat’s folder as its agents write.' + (fl.canAsk ? ' Ask it to stop sends that chat a message.' : ''), others.map((r, i) => otherRunRow(k, d, act, r, i, fl.canAsk)), { gap: 'lg' }))

  if (done.length) out.push(k.card('Finished in this chat', '', done.slice(0, 8).map((r, i) => finishedRunRow(k, d, act, r, i)), { gap: 'lg' }))

  const finishedElsewhere = ((fl.other && fl.other.finished) || []).slice(0, 6)
  if (finishedElsewhere.length) {
    out.push(k.card('Finished in the last day', 'Runs from your other chats.', finishedElsewhere.map((r, i) => {
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
  const costW = Math.max(SHARE ? 12 : 9, ...(sv.costliest || []).map((x) => cost(x.usd).length + 1))
  // a table with no room for its agents and time columns keeps the cost, the figure it is named for, and
  // stacks the rest under each run's name (the columns on the right are what a narrow table gives up first)
  const isStacked = k.columns - 8 < 9 + 12 + costW + 1 + 12
  if (sv.costliest && sv.costliest.length) {
    out.push(k.card(
      'Costliest runs',
      'The last ' + sv.days + ' days, in every project.' + (SHARE ? ' Costs are shares of your weekly limit.' : '') + k.hint(' Hover over a run for where its money went.'),
      [
        k.heads(isStacked
          ? [{ text: 'Run' }, { text: SHARE ? 'Of the limit' : 'Cost', width: costW }]
          : [{ text: 'Run' }, ...(k.hasSvg && k.isRoomy ? [{ text: 'Where it went', width: 22, isBar: true }] : []), { text: 'Agents', width: 8 }, { text: 'Took', width: 11 }, { text: SHARE ? 'Of the limit' : 'Cost', width: costW }]),
        ...sv.costliest.map((x, i) => {
          const [glyph, color] = RUN_END[x.status] || RUN_END.completed
          const stages = [...x.stages].sort((a, z) => z.usd - a.usd).filter((st) => st.usd > 0).slice(0, 4)
          const stageWords = (st) => (st.title || 'Agents') + ': ' + plural(st.agents, 'agent', 'agents') + ', ' + ofLimit(cost(st.usd)) + (stageModel(st) ? ', mostly on ' + stageModel(st) : '')
          const stack = [...x.stages].filter((st) => st.usd > 0).map((st) => ({ value: st.usd, hex: FAMILY_HEX[stageModel(st)] || HEX.marker, title: stageWords(st) }))
          const endWords = (RUN_END[x.status] || RUN_END.completed)[2]
          const row = k.row(
            isStacked
              ? [
                  { el: k.Box({ flexDirection: 'column', minWidth: 0, children: [
                    k.Text({ wrap: 'truncate-end', children: [k.text(glyph + ' ', { color }), k.text(x.name || x.runId, { weight: 'medium' })] }),
                    k.footnote([x.project || '', endWords, plural(x.agents, 'agent', 'agents'), x.durationMs ? 'took ' + fmtSpan(x.durationMs) : ''].filter(Boolean).join(' · ')),
                  ] }) },
                  { text: cost(x.usd), width: costW },
                ]
              : [
                  { parts: [k.text(glyph + ' ', { color }), k.text(x.name || x.runId, { weight: 'medium' }), k.text('  ' + [x.project || '', endWords].filter(Boolean).join(' · '), { dimColor: true })] },
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
          ? [k.Text({ wrap: 'wrap', children: [k.text('Bars show each stage’s cost, colored by the model that did most of it: ', { size: 'footnote', dimColor: true }), ...['Opus', 'Sonnet', 'Fable'].flatMap((m, j) => [k.text((j ? '   ' : '') + '● ', { color: midHex(FAMILY_HEX[m]) }), k.text(m, { size: 'footnote' })])] })]
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
            ...savingsPicture(k, fl, sv, shownSavings),
            ...shownSavings.map((f, i) => savingRow(k, act, f, 'flow-save-' + i, '', fl.share, i === 0 && !mine.length, Math.max(0, ...shownSavings.map((y) => y.high || 0)))),
            ...(setAside ? [k.buttons([k.button('flow-save-shown', d.view.showSetAside ? 'Hide set-aside ideas' : 'Show ' + plural(setAside, 'set-aside idea', 'set-aside ideas'), () => act.setView({ showSetAside: !d.view.showSetAside }), { dimColor: true })])] : []),
            k.footnote('A rule is shown here first. It is added to your CLAUDE.md only when you save it.'),
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
      k.footnote('While one runs: the Pause new agents button lets working agents finish and holds the rest. A run budget does the same once the run costs that much. Agents at once spreads the work out. Model for new agents switches what the rest run on. Stop workflow ends it and keeps what finished.'),
      ...(check
        ? [
            k.Box({ flexDirection: 'column', rowGap: 'xs', marginTop: 'xs', children: [k.text(check.label, { weight: 'medium' }), k.footnote(check.help), k.segmented('opt-workflowCheck', check.options, d.opts.workflowCheck, (v) => act.setOption('workflowCheck', v), check.label)] }),
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
  const oneColumn = () => [...head, ...live(k), ...costliest(k), ...savings(k), ...how(k)]
  if (k.isTerminal || k.columns < SPLIT_AT) return oneColumn()
  const [km, ka] = k.split()
  const record = [...live(km), ...savings(km)]
  // with no run to show (a go-ahead waiting above, nothing run yet) the rest takes the full width instead of the right half
  if (!record.some(Boolean)) return oneColumn()
  return [...head, km.layout(record, [...costliest(ka), ...how(ka)])]
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
  // the figures at the right edge: the agents (with their unit), and the cost only where some run has one,
  // so no empty column is held open and every row ends at the same edge
  const hasCost = mine.some((r) => r.progress.usd) || others.some((r) => r.usd)
  const rows = [
    ...mine.map((r, i) => {
      const p = r.progress
      return k.row(
        [
          { el: liveName(k, r.paused ? null : HEX.bar, [k.text(r.name || 'Workflow', { weight: 'medium' }), k.text('  this chat' + (p.current ? ' · ' + p.current.title : ''), { dimColor: true })]) },
          { text: p.total ? p.done + ' of ' + plural(p.total, 'agent', 'agents') : '', width: 14, props: { dimColor: true } },
          ...(hasCost ? [{ text: p.usd ? cost(p.usd) : '', width: 9 }] : []),
        ],
        {},
        { key: 'home-run-' + i, tip: { title: r.name, lines: [r.paused ? 'Paused.' : 'Running.', plural(p.done, 'agent', 'agents') + ' done of ' + p.total + '.'] } },
      )
    }),
    ...others.map((r, i) => k.row(
      [
        { el: liveName(k, HEX.bar, [k.text(r.name, { weight: 'medium' }), k.text('  ' + [r.project, r.title].filter(Boolean).join(' · '), { dimColor: true })]) },
        { text: plural(r.agents.length, 'agent', 'agents'), width: 14, props: { dimColor: true } },
        ...(hasCost ? [{ text: r.usd ? cost(r.usd) : '', width: 9 }] : []),
      ],
      {},
      { key: 'home-other-' + i, tip: { title: r.name, lines: [plural(r.agents.filter((a) => a.isActive).length, 'agent', 'agents') + ' working now.'] } },
    )),
  ]
  return k.card('Running now', 'Workflows working through a job, with their agents done so far.', [...rows, k.buttons([k.button('home-flows', 'Open Workflows', act.openWorkflows)])])
}

// ---- Home: the week, the projects, the chats and the tour (and the tab that holds them) -------

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
    levelOf: (pct) => (shownPct(pct) >= Math.max(90, d.opts.limitAlertAt) ? 'error' : shownPct(pct) >= d.opts.limitAlertAt ? 'warning' : 'success'),
    tightest: [...windows].sort((a, z) => Number(kindOfLabel(a.label) === 'five_hour') - Number(kindOfLabel(z.label) === 'five_hour') || z.pct - a.pct)[0],
    w: d.waiting || { needs: [], pickup: [], canReply: false },
    hues: u && !u.isEmpty ? projectHues(u.projects) : Object.create(null),
  }
  h.item = h.tightest ? tightestItem(d, h.tightest, h) : null
  h.read = waitingRead(d, h)
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
    const most = [...parts].sort((x, z) => z.value - x.value).map((x) => x.name) // every project the day held, as the line under the calendar lists them
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
      k.card('Projects', null, [
        k.text('Reading every project is off.', { weight: 'medium', wrap: 'wrap' }),
        k.footnote('Turn it on to see what each project used today and this week, from Claude Code’s own records on this computer. Reading them sends nothing anywhere.'),
        k.buttons([k.button('scan-on', 'Read every project', () => act.setOption('scanProjects', true), { variant: 'primary' })]),
      ]),
    )
  } else if (!has && sc.status === 'unavailable') {
    out.push(
      k.card('Projects', null, [
        // a failure, drawn as one: its glyph and colour, and what to do next
        k.hang(k.text('✕', { color: 'error', weight: 'semibold' }), k.Box({ flexDirection: 'column', rowGap: 'xs', children: [
          k.text('Couldn’t read Claude Code’s records on this computer.', { weight: 'semibold', color: 'error', wrap: 'wrap' }),
          k.footnote('ToBeBestMe looks in ~/.claude/projects, or under CLAUDE_CONFIG_DIR when that is set. Check that the folder exists and can be read, then try again. The other tabs still work.'),
        ] })),
        k.buttons([k.button('usage-refresh', 'Read projects again', act.refreshUsage, { variant: 'primary' })]),
      ]),
    )
  } else if (!has && sc.status === 'ok' && !sc.isRunning) {
    out.push(k.card('Projects', null, [k.text('Nothing in the last ' + SCAN_DAYS + ' days yet.', { weight: 'medium', wrap: 'wrap' }), k.footnote('Each project shows here once Claude has answered in it.')]))
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
  const item = { runway, hex: tint(it.hex, runway.runOut !== null ? 'warning' : 'success'), label: it.label, valueText: pctText(r.used) }
  const drop = Math.round(w.factor * 100)
  // where the week ends, uncapped, at this pace and with the idea: two bars with the points between them
  const endsAt = (r.used / r.elapsed) * 100
  // the two ends as they are read, and the points between them as their difference, so the callout adds up
  const pointsBack = shownPct(endsAt) - shownPct(landing)
  const picture =
    k.hasSvg && pointsBack >= 1
      ? k.Box({
          flexDirection: 'column',
          rowGap: 'xs',
          children: [
            k.drawing(
              svgSaving({ a: { label: 'At this pace: the week ends at ' + pctAbout(endsAt), value: endsAt }, b: { label: w.title + ': ' + pctAbout(landing), value: landing }, mark: 100, back: plural(pointsBack, 'point', 'points') + ' back', isGood: landing < 100 }, { width: Math.max(240, Math.round(k.px - 36)) }), // the bars fill the card they are in
              'At this pace the week ends at ' + pctAbout(endsAt) + ' of your weekly limit. ' + w.title + ', it ends at ' + pctAbout(landing) + ', ' + plural(pointsBack, 'point', 'points') + ' back. An estimate at list prices.',
            ),
          ],
        })
      : null
  const clause = after.replace(/^At this pace it/, 'it').replace(/^On pace/, 'on pace').replace(/^Used up/, 'used up')
  return {
    picture,
    // drawn, the bars already say what the idea is and where the week would end; the line then says what that would mean, with the condition in it (the run-out here is the idea's, not the pace's)
    then: w.title + ', ' + clause,
    line: w.title + ': ' + clause,
    tip: { title: w.title, lines: ['This week’s pace would drop about ' + drop + '%, at list prices.', before ? 'Now: ' + before.charAt(0).toLowerCase() + before.slice(1) : '', after ? 'If so: ' + after.charAt(0).toLowerCase() + after.slice(1) : ''], el: runwayBar(k, item, 'tile'), align: 'left' },
  }
}

function homeInsights(k, d, act, h) {
  const { u, has } = h
  const out = []
  const ideas = has ? usageInsights(u, { ...d.opts, fmt: cost, isShare: !!SHARE }) : []
  if (ideas.length) {
    out.push(
      k.card('What stands out', null, ideas.map((x, i) => {
        const w = whatIfItem(k, d, h, x.whatIf)
        const body = [
          k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
          k.guide(x.detail),
          // what the saving would do to the week, in a line; point at it for the runway it would have
          ...(w ? (w.picture ? [w.picture, k.guide(w.then)] : [k.text(w.line, { size: 'footnote', weight: 'medium', wrap: 'wrap' })]) : []),
          ...(x.action ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('insight-' + i, x.action.label, () => act.run(x.action.key), { about: x.title })])] })] : []),
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
    const total = by === 'today' ? d.today : by === 'day' ? u.days[dayAt] : u.week.usd
    const barW = k.columns >= 72 ? 16 : 8
    out.push(
      k.card('Projects', 'Most used first, with worktrees counted in their repository.' + (SHARE ? ' Figures are shares of your weekly limit.' : '') + k.hint(' Point at one for its chats, models and folder.'), [
        k.segmented('proj', [{ value: 'week', label: 'Past 7 days' }, { value: 'today', label: 'Today' }, ...(isDay ? [{ value: 'day', label: dayName }] : [])], by, (value) => act.setView({ projectsBy: value === 'day' ? d.view.projectsBy : value, day: value === 'day' ? d.view.day : '' }), 'Projects by'),
        ...(rows.length
          ? [
              // a day's figures are its own: sessions and last answers are counted over a week, so a picked day leaves them out
              k.heads([{ text: 'Project' }, { text: '', width: barW }, { text: SHARE ? 'Of the limit' : by === 'today' ? 'Today' : by === 'day' ? dayName : 'Past 7 days', width: 12 }, ...(by === 'day' ? [] : [{ text: 'Chats', width: 10 }, { text: 'Last answer', width: 14 }])]),
              ...rows.map((p, i) =>
                k.row(
                  [
                    { parts: [...(k.isTerminal ? [] : [k.text('● ', { color: midHex(hueOf(h, p.key)) })]), k.text(p.name, d.view.project && d.view.project !== p.key ? { dimColor: true } : { weight: d.view.project === p.key ? 'semibold' : 'medium' }), ...(p.worktrees && k.columns >= 72 ? [k.text('  ' + plural(p.worktrees, 'worktree', 'worktrees').replace(' ', '\u00a0'), { dimColor: true })] : [])] },
                    { el: k.bar(p[by], max, k.isTerminal ? HEX.bar : hueOf(h, p.key), p.name + ': ' + ofLimit(cost(p[by])) + ', ' + share(p[by], total) + ' of ' + (by === 'week' ? 'the week’s' : 'the day’s') + ' work'), width: barW },
                    { text: cost(p[by]), width: 12 },
                    ...(by === 'day' ? [] : [{ text: String(by === 'today' ? p.sessionsToday : p.sessionsWeek), width: 10, props: { dimColor: true } }, { text: ago(now - p.lastAt), width: 14, props: { dimColor: true } }]),
                  ],
                  {},
                  { key: 'proj-' + i, tip: projectTip(p, now) },
                ),
              ),
            ]
          : [k.footnote('Nothing yet today. Past 7 days shows the week.')]),
        ...(SHARE && rows.length ? [k.footnote('Shares are estimated from your chat records at list prices, so together they can differ a little from the weekly figure above.')] : []),
        ...(list.length > 8 ? [k.buttons([k.button('proj-more', d.view.showAllProjects ? 'Show fewer' : 'Show all ' + list.length + ' projects', act.toggleProjects, { dimColor: true })])] : []),
      ], { gap: 'sm', accessory: SHARE ? null : k.footnote(cost(total) + (by === 'today' ? ' today' : by === 'day' ? ' on ' + dayName : ' in the past 7 days'), { tabular: true }) }),
    )

  }
  return out
}

function homeChart(k, d, act, h) {
  const { u, now, has } = h
  const out = []
  // the hero's calendar already draws the week by project; this is for when there is no plan
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
      k.card('Last ' + SCAN_DAYS + ' days', 'Every project, each day, in its own color. The dashed line is the average.', [
        k.bars(u.days, SCAN_DAYS, 'Use each day over the last ' + SCAN_DAYS + ' days: today ' + cost(d.today) + ', on average ' + cost(mean) + ' a day', 64, { stacks, titles: u.keys.map((key, i) => dayWords(key, now) + ': ' + cost(u.days[i])), average: true, averageTitle: 'Average: ' + cost(mean) + ' a day' }),
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
    const ctxW = k.columns >= 90 ? 8 : 0
    const sessionRow = (x, i) => {
      const ctx = x.isSelf ? { percentUsed: d.pct, tokensUsed: d.tokens } : f.ctx && f.ctx[x.sessionId]
      const pct = ctx && Number.isFinite(Number(ctx.percentUsed)) ? Number(ctx.percentUsed) : null
      const usd = x.isSelf ? (me.desk && spent[me.desk] !== undefined ? spent[me.desk] : d.usd) : spent[x.sessionId]
      const hasUsd = usd !== undefined && usd !== null
      const folder = String(x.cwd || '').split('/').filter(Boolean).pop() || ''
      const pr = x.prNumber ? 'PR #' + x.prNumber + (x.prState ? ' ' + String(x.prState).toLowerCase() : '') : ''
      // the project's name here; the branch (often a long slug) and the full path are in its hover card
      const sub = [x.isSelf ? 'this chat' : '', folder, pr].filter(Boolean).join(' · ')
      const when = x.isSelf ? 'open here' : x.isRunning ? 'working now' : x.lastActivityAt ? ago(now - Date.parse(x.lastActivityAt)) : ''
      const ctxHex = pct === null ? null : pct >= d.opts.cheaperModelAt ? HEX.error : pct >= d.opts.contextWarnAt ? HEX.warning : RING_HEX.context
      const cells = [
          { el: k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', minWidth: 0, flexShrink: 1, children: [x.isRunning ? k.live(HEX.success, 'success', 'Working now') : k.hasSvg ? k.Box({ flexShrink: 0, width: 2, alignItems: 'center', children: [k.text('●', { dimColor: true })] }) : k.text('●', { dimColor: true }), k.Box({ flexShrink: 1, minWidth: 0, children: [k.text(x.title || 'Untitled chat', { wrap: 'wrap', ...(x.isSelf ? { weight: 'semibold' } : {}) })] })] }) }, // a long title wraps beside the figures, as it does in Ready to archive, so no chat is cut short
          ...(ctxW ? [{ el: pct !== null ? k.bar(pct, 100, ctxHex, 'Context ' + pctText(pct)) : k.text(' ', {}), width: ctxW }] : []),
          { text: pct !== null ? pctText(pct) : '–', width: 7, props: pct === null ? { dimColor: true } : ctxHex !== RING_HEX.context && ctxW === 0 ? { color: pct >= d.opts.cheaperModelAt ? 'error' : 'warning' } : {} },
          { text: hasUsd ? cost(usd) : '–', width: 8, props: hasUsd ? {} : { dimColor: true } },
          { text: when, width: 12, props: x.isRunning ? { color: 'success' } : { dimColor: true } },
      ]
      // a phone's width gives the title the whole line and sets the figures under it, so the title is never squeezed
      const stacked = [
        k.row([cells[0]]),
        k.row([{ text: '   ' + [sub, pct !== null ? pctText(pct) + ' context' : '', hasUsd ? cost(usd) + ' today' : '', when].filter(Boolean).join(' · '), props: { size: 'footnote', dimColor: true, wrap: 'wrap' } }]),
      ]
      return k.hoverBox('sess-' + i, { flexDirection: 'column', width: '100%' }, k.columns < 60 ? stacked : [
        k.row(cells),
        k.row([{ text: '   ' + sub, props: { size: 'footnote', dimColor: true, wrap: 'wrap' } }]),
      ], {
        title: x.title || 'Untitled chat',
        lines: [
          x.cwd ? String(x.cwd).replace(/^\/Users\/[^/]+/, '~') : '',
          x.branch ? 'Branch ' + x.branch + '.' : '',
          x.isRunning ? 'Working now.' : x.lastActivityAt ? 'Last active ' + ago(now - Date.parse(x.lastActivityAt)) + '.' : '',
          ctx ? 'Context ' + pctText(pct) + ' full' + (ctx.tokensUsed ? ', ' + fmtTokens(ctx.tokensUsed) + ' tokens' : '') + '.' : 'Context shows while a chat is working.',
          hasUsd ? cost(usd) + ' today.' : 'Spending shows for chats that run ToBeBestMe.',
          x.isSelf ? '' : 'Open it from the sidebar.',
        ],
      })
    }
    out.push(
      k.card('Open chats', 'In the desktop app, newest activity first.' + k.hint(' Point at one for its folder, context and spending.'), [
        ...(k.columns < 60 ? [] : [k.heads([{ text: 'Chat' }, ...(ctxW ? [{ text: '', width: ctxW }] : []), { text: 'Context', width: 7 }, { text: 'Today', width: 8 }, { text: 'Active', width: 12 }])]),
        ...rows.map(sessionRow),
      ], { gap: 'sm' }),
    )

    if (done.length) {
      const c = d.view.confirm || ''
      out.push(
        k.card('Ready to archive', 'Idle chats whose pull request is done. Archiving stops them and frees their worktrees; Archived in the sidebar brings one back.', done.slice(0, 8).map((x, i) => {
          const asking = c === 'archive:' + x.sessionId
          return k.Box({
            flexDirection: 'column',
            rowGap: 'xs',
            children: [
              // a phone's width puts the button under its words, which wrap, instead of cutting them short beside it
              k.Box({
                flexDirection: k.columns < 60 ? 'column' : 'row',
                columnGap: 'md',
                rowGap: 'xs',
                alignItems: k.columns < 60 ? 'flex-start' : 'center',
                children: [
                  k.Box({ flexDirection: 'column', flexGrow: 1, flexShrink: 1, children: [k.text(x.title || 'Untitled chat', { weight: 'medium', wrap: 'wrap' }), k.footnote('PR #' + x.prNumber + ' ' + String(x.prState || '').toLowerCase() + (x.lastActivityAt ? ' · last active ' + ago(now - Date.parse(x.lastActivityAt)) : ''), { wrap: k.columns < 60 ? 'wrap' : 'truncate-end' })] }),
                  ...(asking ? [] : [k.button('archive-' + i, 'Archive chat…', () => act.setView({ confirm: 'archive:' + x.sessionId }), { about: x.title || 'Untitled chat' })]),
                ],
              }),
              ...(asking ? [k.Box({ flexDirection: 'column', rowGap: 'sm', children: [k.text('Archive “' + (x.title || 'this chat') + '”? It stops, and its worktree is cleaned up.', { weight: 'medium', wrap: 'wrap' }), k.buttons([k.button('archive-go', 'Archive chat', () => act.archiveSession(x.sessionId)), k.button('confirm-cancel', 'Cancel', () => act.setView({ confirm: '' }), { autoFocus: true })])] })] : []),
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
          ...(has ? [k.footnote((SHARE ? 'Shares of your weekly limit, estimated from this week’s work at list prices' : 'Estimates at list prices') + ' (standard speed, global routing: fast mode and US-only inference cost more)' + ', from Claude Code’s own records on this computer (~/.claude/projects), helpers and workflow agents included. Reading them sends nothing anywhere.')] : []),
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
    // the count under the title is how many of the things worth setting up are done; the figure beside it says how
    // many suggestions are open when more are open than shown (what your records show costing you counts as one too)
    k.card('Worth doing next', have + ' of ' + total + ' set up.', ideas.map((x) =>
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          k.text(x.title, { weight: 'semibold', wrap: 'wrap' }),
          k.guide(x.detail),
          k.Box({ marginTop: 'xs', children: [k.buttons([k.button('next-' + x.key, x.button, run(x.todo), { about: x.title }), k.button('next-' + x.key + '-later', 'Not now', () => act.dismissHabit(x.key), { dimColor: true, about: x.title })])] }),
        ],
      }),
    ), { gap: 'md', keepCaption: true, accessory: open > ideas.length ? k.footnote('Showing ' + ideas.length + ' of ' + open, { tabular: true }) : undefined }),
  ]
}

// A short welcome the first time, four steps that show the real thing and not a picture of it: the
// line above the prompt as it is now, what waits for you, the person's own limit laid out on its
// calendar, and the habits. It waits while something needs an answer, and `/tobebestme tour` brings
// it back.
function homeTour(k, d, act, h) {
  if (d.habits && d.habits.isTourDone) return []
  // it waits while anything needs an answer: a chat, a pull request, a workflow's go-ahead
  if (waitingCount(h.w.needs, d.flows && d.flows.approval).total) return []
  const last = 3
  const step = Math.max(0, Math.min(last, d.view.tourStep || 0))
  const set = (n) => () => act.setView({ tourStep: n })
  // one primary action per view: while records couldn't be read, "Read projects again" is the one
  const lead = h.read === 'failed' ? {} : { variant: 'primary' }
  let title = ''
  let words = ''
  let preview = null
  if (step === 0) {
    title = 'The line above the prompt'
    words = 'It is in every chat and shows what is about to run out: this chat’s context, your plan’s limits and what you have spent. Its button opens this dashboard. This is it, live.'
    preview = k.Box({ flexDirection: 'column', paddingY: 'sm', children: [drawBand(k, { ...d, bandRows: 2, isPreview: true }, act)] })
  } else if (step === 1) {
    title = 'Chats that need you'
    words = 'When another chat stops for a permission, a question or a decision, it shows on Home, and you can answer it from here without switching.' + (h.read === 'off' ? ' Turn on Read every project in Settings to see them.' : h.read === 'read' ? ' Nothing is waiting for you now.' : '')
  } else if (step === 2) {
    title = 'Your limits, on a calendar'
    words = 'The bar is your plan’s window. The fill is what you have used, the thin line under it is how much of the window has passed, and the white mark is now. When the fill is ahead of the mark, you are on pace to run out early: it turns amber and says when.'
    if (h.tightest) preview = k.Box({ flexDirection: 'column', paddingY: 'sm', children: [runwayBar(k, h.item, 'hero', Math.max(280, k.px - 56))] })
  } else {
    const { have, total } = habitIdeas(d)
    title = 'What to set up first'
    words = 'ToBeBestMe looks at your own setup and records and suggests up to three things at a time. ' + have + ' of ' + total + ' are set up now. Not now puts a suggestion off for a month.'
  }
  return [
    k.card('Welcome to ToBeBestMe', null, [
      k.text(title, { size: 'title', weight: 'semibold', wrap: 'wrap' }),
      k.text(words, { wrap: 'wrap' }),
      ...(preview ? [preview] : []),
      k.buttons([
        ...(step > 0 ? [k.button('tour-back', 'Back', set(step - 1), { dimColor: true })] : []),
        step < last ? k.button('tour-next', 'Next', set(step + 1), lead) : k.button('tour-done', 'Done', act.finishTour, lead),
        ...(step < last ? [k.button('tour-skip', 'Skip tour', act.finishTour, { dimColor: true })] : []),
      ]),
    ], { gap: 'md', accessory: k.footnote('Step ' + (step + 1) + ' of ' + (last + 1), { tabular: true }), keepCaption: true }),
  ]
}

function allTab(k, d, act) {
  const h = homeContext(d)
  const { w, tightest } = h
  // what needs an answer comes before anything else: a workflow's go-ahead, then records that could not
  // be read (nothing below can be trusted to say what waits without them)
  const failed = h.read === 'failed'
  const first = [approvalCard(k, d, act, true), ...(failed ? homeStatus(k, d, act, h) : [])]
  const status = (kk) => (failed ? [] : homeStatus(kk, d, act, h))
  const hero = [homeHero(k, d, h, act), ...first, ...homeTour(k, d, act, h)]
  // one column, in the order a day goes: what to do, what is worth doing next, then where things are
  const oneColumn = () => [...hero, needsCard(k, d, act, w), runningNowCard(k, d, act), pickupCard(k, d, act, w, h), ...status(k), ...homeInsights(k, d, act, h), ...homeNext(k, d, act), ...homeProjects(k, d, act, h), ...homeChart(k, d, act, h), ...homeSessions(k, d, act, h), ...homeFooter(k, d, act, h)]
  if (k.isTerminal || k.columns < SPLIT_AT) return oneColumn()
  // the hero holds the limits and the week; the left column is what to do, the right where things
  // are. When either would be empty (no records read, no desktop sessions, nothing waiting) the other
  // takes the width: the suggestions alone are not a column, and a lone card never sits beside a blank half.
  const [km, ka] = k.split()
  const places = [...homeProjects(ka, d, act, h), ...homeChart(ka, d, act, h), ...homeSessions(ka, d, act, h)]
  if (!places.length) return oneColumn()
  const todo = [needsCard(km, d, act, w), runningNowCard(km, d, act), pickupCard(km, d, act, w, h), ...status(km), ...homeInsights(km, d, act, h)]
  if (!todo.some(Boolean)) return oneColumn()
  return [
    ...hero,
    // the suggestions close the right column, so the two end near each other
    km.layout(todo, [...places, ...homeNext(ka, d, act)]),
    ...homeFooter(k, d, act, h),
  ]
}

// ---- the line above the prompt ------------------------------------------------------------------
// One row in every session: what needs you (or that all is well), then context, limits and cost,
// and a button to the dashboard.
export function drawBand(k, d, act) {
  d = withExactPct(d)
  SHARE = costShare(d)
  const h = d.health
  const needs = (d.waiting && d.waiting.needs) || []
  const chats = needs.filter((x) => x.kind !== 'pr')
  // what waits is counted as Home and the phone count it: chats, pull requests and a workflow's go-ahead
  const tally = waitingCount(needs, d.flows && d.flows.approval)
  const waits = tally.chats + tally.prs
  // the headline: something waiting for you elsewhere comes first unless something here needs acting on
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
    detail = [fl.approval.preview.name || '', waits ? waitingParts({ ...tally, flows: 0 }) + ' waiting too' : ''].filter(Boolean).join(' · ')
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
  } else if (waits && isCalm) {
    glyph = ['● ', { color: 'warning' }]
    title = waitingTitle(tally)
    detail = needs[0].title + (needs[0].text ? ': ' + needs[0].text : '')
  } else if (h.level !== 'success') {
    glyph = ['● ', h.level === 'info' ? { dimColor: true } : { color: h.level }]
    title = h.title
    detail = waits ? waitingTitle(tally).replace(/^./, (c) => c.toLowerCase()) : ''
  }
  // an all clear is only said when the records that say what waits were read, as Home says it
  if (title === 'All clear' && waitingRead(d, { has: !!(d.usage && !d.usage.isEmpty), sc: d.scan || {} }) === 'failed') {
    glyph = ['● ', { color: 'warning' }]
    title = 'Can’t tell what’s waiting'
    // what is known stays plain: no reassurance beside a headline that says the records could not be read
    // the context meter below says it, when the band has the room for one
    detail = (d.bandRows || 3) < 2 ? 'Context ' + pctText(d.pct) : ''
  }
  // the gauges: everything that can run out, each with a small meter
  const levelOf = (pct, warn, err) => (shownPct(pct) >= err ? 'error' : shownPct(pct) >= warn ? 'warning' : 'success')
  const gauges = [{ key: 'context', label: 'Context', pct: d.pct, hex: RING_HEX.context, level: levelOf(d.pct, d.opts.contextWarnAt, d.opts.cheaperModelAt) }]
  for (const l of d.limits.slice(0, 2)) gauges.push({ key: l.r.kind, label: l.r.kind === 'seven_day' ? 'Weekly' : limitLabel(l.r.kind).replace(/ limit$/i, ''), pct: l.r.percentUsed, hex: RING_HEX[l.r.kind] || RING_HEX.seven_day_opus, level: l.level === 'info' ? 'success' : l.level, resetsAt: l.o.resetAt, runway: runwayOf(l.r.kind, l.r.percentUsed, l.o.resetAt, d.now) })
  // On desktop each figure takes an equal share of the row, its runway filling the room between its
  // name and its percentage, so pace reads at a glance; on a phone-width band, two to a row.
  const isNarrow = k.columns < 72
  const cellProps = isNarrow ? { width: '50%', paddingRight: 'md' } : { width: 0, flexGrow: 1 }
  const wideGauge = (g) => {
    const shown = pctText(g.pct)
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
    const shown = pctText(g.pct)
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
            // on a phone the workflow has a row of its own, not half of one beside a limit
            ...(isNarrow ? { width: '100%', paddingRight: 'md' } : cellProps),
            flexDirection: 'row',
            columnGap: 'sm',
            alignItems: 'center',
            children: [
              r.paused ? k.text('‖', { color: 'warning' }) : k.live(HEX.bar, 'suggestion', 'Running'),
              // the name keeps its room (a long one is cut short), and the meter takes what is left
              k.Box({ flexShrink: 0, children: [k.text(shortName(r.name || 'Workflow', 22), { size: 'footnote', dimColor: true })] }),
              k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Svg({ source: svgMeter([{ value: pct, hex: r.paused ? HEX.warning : HEX.bar }], 100, [], true), alt: (r.name || 'Workflow') + ' ' + p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done', height: 6 })] }),
              k.Box({ flexShrink: 0, children: [k.text(p.done + ' of ' + p.total, { tabular: true, weight: 'semibold' })] }),
            ],
          })
        const meter = k.hasSvg ? k.Box({ width: 8, flexShrink: 0, children: [k.Svg({ source: svgMeter([{ value: pct, hex: r.paused ? HEX.warning : HEX.success }], 100, [], true), alt: (r.name || 'Workflow') + ' ' + p.done + ' of ' + plural(p.total, 'agent', 'agents') + ' done', height: 6 })] }) : k.text(textMeter(pct, 5), { color: r.paused ? 'warning' : 'suggestion' })
        return k.Box({ flexDirection: 'row', columnGap: 1, alignItems: 'center', flexShrink: 0, children: [meter, k.text((r.name || 'Workflow') + ' ', { dimColor: true }), k.text(p.done + ' of ' + p.total, { tabular: true })] })
      })()
    : null
  const u = d.usage && !d.usage.isEmpty ? d.usage : null
  // two different figures, named apart: this session's own, and today across every session
  const money = u && !flowChip ? 'Today, all chats: ' + cost(d.today) + (k.columns >= 100 ? ' in ' + plural(u.today.projects, 'project', 'projects') : '') : ''
  // a phone-width band keeps the headline and its button; the rest is on the line below and on Home
  const isTiny = k.columns < 56
  const hasTip = isCalm && !chats.length && !mine.length && (fl.suggestions || []).some((x) => x.isFresh)
  const button = fl.approval ? k.button('band-open', 'Review workflow', act.openWorkflows || act.openPane)
    : hasTip ? k.button('band-open', 'See suggested workflow', act.openWorkflows || act.openPane)
    : mine.length && isCalm && !chats.length ? k.button('band-open', 'Follow it', act.openWorkflows || act.openPane)
    : waits ? k.button('band-open', 'See what’s waiting', act.openHome || act.openPane)
    : k.button('band-open', 'Open ToBeBestMe', act.openPane)
  // a span or a range is never broken across two lines
  const whole = k.isTerminal ? (t) => t : (t) => holdSpan(holdRange(t))
  // after the headline and its count, the session's cost: all of it where there is room and none where there is
  // none, so a tail is never left alone on a second line
  const own = 'This session ' + cost(d.usd)
  const room = Math.floor((k.columns * 8.4 - 28 - (d.isPreview || k.isTerminal ? 0 : 150)) / 6)
  const used = title.length + (detail && !isTiny ? detail.length + 2 : 0) + 5
  // (a share of the limit is only a figure with its unit, so it is whole or left off; dollars say what they are)
  const tail = isTiny ? '' : [own + (SHARE ? ' of the weekly limit' : '') + (k.hasSvg && money ? ' · ' + money : ''), ...(SHARE ? [] : [own]), ''].find((t) => !t || k.isTerminal || used + t.length <= room)
  const head = k.Box({
    flexDirection: 'row',
    columnGap: 1,
    alignItems: 'center',
    width: '100%',
    children: [
      ...(glyph[2] ? [k.live(HEX.bar, 'suggestion', 'Running')] : []),
      k.Box({ flexGrow: 1, flexShrink: 1, children: [k.Text({ wrap: 'truncate-end', children: [...(glyph[2] ? [] : [k.text(glyph[0], glyph[1])]), k.text(whole(title), { weight: 'semibold' }), ...(detail && !isTiny ? [k.text(whole('  ' + detail), { dimColor: true })] : []), ...(tail ? [k.text(whole('  ·  ' + tail), { dimColor: true, tabular: true })] : [])] })] }),
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
    [o.handoffBeforeCompact, o.handoffBeforeCompact ? 'A handoff note is written before a compaction, so little is lost.' : 'No handoff note before compaction.'],
    [o.tellClaude, o.tellClaude ? 'Claude is told where the budget stands once things get tight, and keeps its steps small.' : 'Claude isn’t told about the budget.'],
    [o.paceAlert, o.paceAlert ? 'A limit that will run out early or passes ' + o.limitAlertAt + '% is said once each, and so are a reached budget and the context warning.' : 'No warning when a limit will run out early. A limit past ' + o.limitAlertAt + '%, a reached budget and the context warning still alert.'],
    [o.autoCompactAt > 0, o.autoCompactAt > 0 ? 'The chat compacts by itself at ' + o.autoCompactAt + '%, between turns.' : 'Claude Code compacts on its own when the window fills.'],
  ]
  if (o.sessionBudget > 0 || o.dailyBudget > 0) items.push([true, 'Budgets: ' + [o.sessionBudget > 0 ? fmtUsd(o.sessionBudget) + ' a chat' : '', o.dailyBudget > 0 ? fmtUsd(o.dailyBudget) + ' a day' : ''].filter(Boolean).join(', ') + '. ' + (o.atBudget === 'hold' ? 'New prompts wait once one is reached.' : o.atBudget === 'cheaper' ? 'Work moves to ' + cheap + ' once one is reached.' : 'You’re warned once one is reached.')])
  return items
}

// Opens on the one thing to know about the setup: how much ToBeBestMe does by itself, and whether
// everything it reads could be read. What it does is the list; the settings that change it follow.
function settingsLead(k, d, act) {
  const items = autopilotItems(d)
  const on = items.filter(([isOn]) => isOn).length
  const bad = SOURCE_WORDS.filter(([key]) => (d.sources || {})[key] && d.sources[key].ok === false)
  const read = SOURCE_WORDS.filter(([key]) => (d.sources || {})[key] && d.sources[key].ok === true).length
  const headline = bad.length ? (bad.length === 1 ? 'One thing couldn’t be read' : bad.length + ' things couldn’t be read') : on === items.length ? 'Everything is on autopilot' : on + ' of ' + items.length + ' things are on autopilot'
  const level = bad.length ? 'warning' : 'success'
  // sentence case: the first letter drops except in a name (Claude Code)
  const names = bad.map(([, label]) => (/^Claude/.test(label) ? label : label.replace(/^./, (c) => c.toLowerCase())))
  const facts = bad.length
    ? 'Couldn’t read: ' + names.join(', ').replace(/, ([^,]*)$/, ' and $1') + '. An update to Claude Code may have changed ' + (bad.length === 1 ? 'it' : 'them') + '; the sections that use ' + (bad.length === 1 ? 'it say' : 'them say') + ' less until ' + (bad.length === 1 ? 'it can' : 'they can') + ' be read.'
    : [d.version ? 'Claude Code ' + d.version + '.' : '', read ? '' : 'Nothing has been read yet.'].filter(Boolean).join(' ')
  return lead(k, {
    glyph: k.text(level === 'success' ? '✓ ' : '● ', { color: level }),
    headline,
    facts,
    visual: [
      k.Box({
        flexDirection: 'column',
        rowGap: 'xs',
        children: [
          // the headline is about what couldn't be read, so say what the list below is
          ...(bad.length ? [k.text('On autopilot: ' + on + ' of ' + items.length, { weight: 'semibold' })] : []),
          ...items.map(([isOn, words]) => k.hang(k.text(isOn ? '✓' : '○', isOn ? { color: 'success' } : { dimColor: true }), k.text(words, { wrap: 'wrap', dimColor: isOn ? undefined : true }))),
        ],
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
        ...(m.rec.action ? [k.Box({ marginTop: 'xs', children: [k.buttons([k.button('model-advice', m.rec.action.label, () => act.run(m.rec.action.key)), ...(m.rec.back ? [k.button('model-back', m.rec.back.label, () => act.run(m.rec.back.key), { plain: true, dimColor: true })] : [])])] })] : []),
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
  // the placeholder is short enough to show whole at a phone's width; the example sits under the field in words that wrap
  if (k.Input) body.push(k.Input({ key: 'run-goal', label: 'Goal', placeholder: 'What should the run get done?', value: goal, rows: 2, submitLabel: 'Plan run', onSubmit: (value) => act.setRunGoal(value) }), ...(goal ? [] : [k.footnote('For example: move the API to v2 and update every caller, with tests.')]))
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
      k.Box({ flexDirection: 'column', rowGap: 'xs', children: [k.text('Room in your limits', { size: 'footnote', weight: 'semibold', dimColor: true }), ...(fit.lines.length ? fit.lines.map((l) => k.footnote(l)) : [k.footnote('No usage limits reported; Usage keeps the cost in view.')]), k.text('Best start: ' + fit.start + '.', { weight: 'medium', wrap: 'wrap' })] }),
      k.buttons([k.button('run-start', 'Save /long-run and start here', () => act.startLongRun(goal), { variant: 'primary' }), k.button('run-save', 'Save the playbook as /long-run', act.saveLongRun, { dimColor: true })]),
      k.footnote('Starting saves the playbook as a skill in ~/.claude/skills/long-run (if it isn’t there yet), so any chat can follow it, then puts the run in the prompt box for you to send.'),
    )
  } else {
    body.push(k.footnote('Describe the goal and press Return to see the plan and how far your limits stretch.'))
  }
  return k.card('Plan a long run', 'For work that takes hours: each stage on the right model, a check and a checkpoint after each, and a clean stop before a limit runs out.', body, { gap: 'md' })
}
