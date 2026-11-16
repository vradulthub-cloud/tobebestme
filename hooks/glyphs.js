// tobebestme: the numerals a big figure is drawn in. Monoline strokes on a 100-unit em, square-ended like
// the runways they sit over, so a figure looks the same on every computer and its width is known
// exactly (a drawing cannot measure a font). Pure functions; nothing here touches $.

const W = 12.5 // stroke, an eighth of the height
// [advance, path data, stroke (when lighter than W)]. Centrelines run from x=10 to x=52 in an advance of 62.
const GLYPHS = {
  0: [62, 'M10 27.25A21 21 0 0 1 52 27.25V72.75A21 21 0 0 1 10 72.75Z'],
  1: [62, 'M14 27L34 8V100'],
  2: [62, 'M11.3 20.1A21 21 0 1 1 48.2 39.3L10 93.75H54'],
  3: [62, 'M13.3 16.5A20.4 20.4 0 1 1 29 47M29 47H31A23.4 23.4 0 1 1 10.2 81'],
  4: [62, 'M41 100V7L8 70H56'],
  5: [62, 'M50 6.25H17L14 46C22 40.5 29 38.6 33 38.6A21 27.575 0 0 1 33 93.75C22 93.75 14 88.5 9 80'],
  6: [62, 'M46 5C24 13 8 42 8 70.75A23 23 0 1 0 54 70.75A23 23 0 1 0 8 70.75'],
  7: [62, 'M8 6.25H52L26 100'],
  8: [62, 'M31 6.25A20.75 20.75 0 1 1 31 47.75A20.75 20.75 0 1 1 31 6.25ZM31 47.75A23 23 0 1 1 31 93.75A23 23 0 1 1 31 47.75Z'],
  9: [62, 'M16 95C38 87 54 58 54 29.25A23 23 0 1 0 8 29.25A23 23 0 1 0 54 29.25'],
  '%': [84, 'M27 24A10 10 0 1 1 7 24A10 10 0 1 1 27 24ZM77 76A10 10 0 1 1 57 76A10 10 0 1 1 77 76ZM62 4L22 96', 9],
  $: [62, 'M47.5 22.5A19 17 0 1 0 31 48A19 19 0 1 1 14.5 76.5M31 0V14M31 86V100'],
  '.': [30, 'M15 87.5V100'],
  ',': [30, 'M16 87.5V99L10 110'],
  '<': [62, 'M48 28L14 56L48 84'],
  '+': [62, 'M31 34V78M9 56H53'],
  '−': [62, 'M9 56H53'],
  '-': [62, 'M9 56H53'],
  '~': [62, 'M9 60C18 44 26 44 31 56S44 68 53 52'],
  ' ': [24, ''],
}

export const GLYPH_ADVANCE = Object.fromEntries(Object.entries(GLYPHS).map(([c, g]) => [c, g[0]]))

// How wide `text` is drawn at `size` (its height in pixels), or null when a character has no glyph.
export function figureWidth(text, size = 48) {
  let units = 0
  for (const c of String(text)) {
    if (!GLYPHS[c]) return null
    units += GLYPHS[c][0]
  }
  return (units * size) / 100
}

// `text` as stroked paths: { markup, width, height }, drawn from x=0 with the baseline at y=height, in
// currentColor (or `stroke`, for a file opened outside the app). Null when a character has no glyph, so the
// caller sets the figure as ordinary text instead. Each glyph is one path of class "gl", for an entrance.
export function figureGlyphs(text, { size = 48, stroke = 'currentColor' } = {}) {
  const str = String(text)
  const width = figureWidth(str, size)
  if (width === null || !str.trim()) return null
  const k = size / 100
  let x = 0
  const paths = []
  for (const c of str) {
    const [advance, d, w] = GLYPHS[c]
    if (d) paths.push('<path class="gl" transform="translate(' + +(x * k).toFixed(2) + ' 0) scale(' + +k.toFixed(4) + ')" d="' + d + '" stroke-width="' + (w || W) + '"/>')
    x += advance
  }
  const markup = '<g fill="none" stroke="' + stroke + '" stroke-linecap="butt" stroke-linejoin="round">' + paths.join('') + '</g>'
  return { markup, width: Math.ceil(width), height: size }
}
