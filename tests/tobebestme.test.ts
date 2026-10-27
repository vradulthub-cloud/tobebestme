import { expect, test } from 'claude-code/testing'

const NOW = Date.parse('2026-10-23T12:00:00Z')
const SURFACES = ['terminal', 'desktop'] as const
const USAGE = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const MESSAGES = [
  { role: 'user', text: 'fix the flaky test', toolUses: [] },
  { role: 'assistant', text: 'fixed', toolUses: [] },
] as const

const LOW = () => ({ startedAt: 0, context: { tokens: 20_000, window: 200_000, percent: 10 }, rateLimits: [] as any[], cost: { usd: 0.4 } })
const HIGH = () => ({
  startedAt: NOW - 3_600_000,
  context: { tokens: 170_000, window: 200_000, percent: 85 },
  rateLimits: [{ kind: 'five_hour', percentUsed: 40, resetsAt: '2026-10-23T15:00:00Z' }] as any[],
  cost: { usd: 12.5 },
})

// /context's estimate, as $.session.usage({ breakdown: 'summary' }) answers it.
const BREAKDOWN = {
  categories: [
    { name: 'System prompt', tokens: 3_000, color: 'promptBorder', isDeferred: false, kind: 'used' },
    { name: 'MCP tools', tokens: 16_000, color: 'inactive', isDeferred: false, kind: 'used' },
    { name: 'Messages', tokens: 150_000, color: 'permission', isDeferred: false, kind: 'used' },
    { name: 'Free space', tokens: 2_000, color: 'subtle', isDeferred: false, kind: 'free' },
    { name: 'Autocompact buffer', tokens: 29_000, color: 'subtle', isDeferred: false, kind: 'buffer' },
  ],
  totalTokens: 169_000,
  maxTokens: 200_000,
  rawMaxTokens: 200_000,
  percentage: 85,
  gridRows: [],
  model: 'claude-opus-5-5',
  memoryFiles: [{ path: '/Users/me/.claude/CLAUDE.md', type: 'User', tokens: 2_100 }],
  mcpTools: [
    { name: 'mcp__context7__query', serverName: 'context7', tokens: 12_000, isLoaded: true },
    { name: 'mcp__figma__get', serverName: 'figma', tokens: 4_000, isLoaded: true },
  ],
  agents: [],
  // the listing's room on a 200k window is about 2k tokens: review-pr went in by name alone
  skills: {
    totalSkills: 4,
    includedSkills: 4,
    tokens: 1_906,
    skillFrontmatter: [
      { name: 'pdf', source: 'plugin', pluginName: 'anthropic-skills', tokens: 900 },
      { name: 'seo-audit', source: 'plugin', pluginName: 'searchfit-seo', tokens: 600 },
      { name: 'deploy', source: 'projectSettings', tokens: 400 },
      { name: 'review-pr', source: 'userSettings', tokens: 6 },
    ],
  },
  autoCompactThreshold: 180_000,
  isAutoCompactEnabled: true,
  apiUsage: null,
}

// The /tobebestme pane as a surface would mount it.
const PANE = {
  plugin: 'tobebestme',
  component: 'Pane',
  requestId: 'tobebestme',
  props: { title: 'ToBeBestMe', isFocused: true, bodyColumns: 110, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

// A test runs with no session, so every call the mod makes on $ needs an answer here
// ($.state excepted: the kit holds it). `usage` is read on every call, so a test may
// change it between calls; `sets` records each setting the mod saves through /config.
function stubs(on: any, usage: any = LOW(), messages: any[] = []) {
  const store: Record<string, unknown> = {}
  const toasts: string[] = []
  const statuses: (string | undefined)[] = []
  const sets: { key: string; value: unknown }[] = []
  const clock = { now: NOW }
  on('store.get', (_$: unknown, e: any) => ({ value: store[e.key] }))
  on('store.set', (_$: unknown, e: any) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(store) }))
  on('store.delete', (_$: unknown, e: any) => {
    delete store[e.key]
    return { value: undefined }
  })
  on('session.usage', () => ({ value: usage }))
  on('session.messages', () => ({ value: messages }))
  on('clock.now', () => ({ value: clock.now }))
  on('env.get', (_$: unknown, e: any) => ({ value: e.name === 'HOME' ? '/Users/me' : undefined }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('ui.status', (_$: unknown, e: any) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.notify', () => ({ value: { isSent: true, channel: 'terminal_bell' } }))
  on('ui.toast', (_$: unknown, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const opened: string[] = []
  const opens: any[] = [] // each open as asked for
  const pane = { isWide: true } // a window too narrow leaves a pane opened unasked waiting
  on('ui.open', (_$: unknown, e: any) => {
    opened.push(e.id)
    opens.push(e)
    return { value: pane.isWide ? { isPlaced: true } : { isPlaced: false, reason: 'narrow' } }
  })
  on('config.list', () => ({ value: [] }))
  on('config.set', (_$: unknown, e: any) => {
    sets.push({ key: e.key, value: e.value })
    return { value: e.value }
  })
  return { toasts, clock, store, sets, usage, opened, opens, pane, statuses }
}

// Records the model that reaches the bottom of the agent.spawn chain.
function spawnRecorder(on: any) {
  const seen: { model?: string } = {}
  on('agent.spawn', (_$: unknown, e: any) => {
    seen.model = e.model
    return { model: e.model ?? 'inherit' }
  })
  return seen
}

// Every Text the drawing shows, joined: what a reader of the pane sees.
async function shown(ui: any) {
  return (await ui.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')
}

// Ends a main turn the way the engine reports one.
function completeTurn($: any, usage: any, durationMs = 30_000) {
  return $.turn.complete({ answer: 'done', durationMs, isAborted: false, turnId: 't', reason: 'answer', usage })
}

// ---- commands and routing ---------------------------------------------------------------

test('/tobebestme-mode rejects a bad value and says what is in force', async ($, on) => {
  stubs(on)
  const answer = await $.command.run({ command: 'tobebestme-mode', args: 'turbo' })
  expect(answer.text).toContain('Usage: /tobebestme-mode')
  expect(answer.text).toContain('Automatic')
})

test('/tobebestme-mode haiku saves the mode through Claude Code settings', async ($, on) => {
  const { sets } = stubs(on)
  const answer = await $.command.run({ command: 'tobebestme-mode', args: 'haiku' })
  expect(sets).toEqual([{ key: 'tobebestme.mode', value: 'always' }])
  expect(answer.text).toContain('Cheaper model: Always')
})

test('with the mode set to always, a helper runs on the cheaper model', { options: { mode: 'always' } }, async ($, on) => {
  stubs(on)
  const seen = spawnRecorder(on)
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'list the files', model: 'opus' })
  expect(seen.model).toBe('haiku')
})

test('when the account has no cheaper model, the request goes again on the usual model, nothing is sent there again, and Sonnet is offered', { options: { mode: 'always' } }, async ($, on) => {
  const { toasts, store } = stubs(on)
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'api-error', status: 404, error: 'model_not_found', usage: USAGE } }))
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    if (e.model === 'haiku') return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: null, usage: null }
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', messageCount: 3 })) {
    // no chunks
  }
  expect(sent).toEqual(['haiku', 'claude-opus-5-5'])
  expect(toasts.some((t) => t.includes("Haiku isn't available on your account"))).toBe(true)
  expect(store['cheap:missing']).toEqual({ model: 'haiku', at: NOW })
  for await (const _ of $.turn.step({ turnId: 't', index: 1, model: 'claude-opus-5-5', messageCount: 4 })) {
    // no chunks
  }
  expect(sent[sent.length - 1]).toBe('claude-opus-5-5')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  expect(await shown(ui)).toContain("Haiku isn't available on your account")
  expect((await ui.find({ type: 'Button', key: 'hero-action' }))?.props.label).toBe('Use Sonnet as the cheaper model')
  await ui.unmount()
})

test('a model you switch to with /model wins over Always, and over a choice made on the dashboard: the session stays on it, says so, and the way back is on the dashboard', { options: { mode: 'always', cheapModel: 'sonnet' } }, async ($, on) => {
  const { toasts } = stubs(on)
  const seen = spawnRecorder(on)
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  let index = 0
  const step = async (model: string) => {
    for await (const _ of $.turn.step({ turnId: 't', index: index++, model, messageCount: 3 })) {
      // no chunks
    }
  }
  on('classic.PostModelSwitch', () => ({}))
  const switched = (to: string, source: string) => $.classic.PostModelSwitch({ from_model: 'claude-opus-5-5', to_model: to, requested_model: to, source, context_tokens: 0, prompt_cache_warm: true, cache_ttl: '5m' } as any)
  await step('claude-opus-5-5') // Always: every request goes to Sonnet
  await step('claude-opus-5-5')
  expect(sent).toEqual(['sonnet', 'sonnet'])
  // a switch the person didn't make (an automatic fallback) doesn't win over Always
  await switched('claude-haiku-5', 'auto')
  await step('claude-haiku-5')
  expect(sent[sent.length - 1]).toBe('sonnet')
  sent.length = 2
  // the person switches to Fable: from the next request on, it goes there
  await switched('claude-fable-5-1', 'command')
  await step('claude-fable-5-1')
  await step('claude-fable-5-1')
  expect(sent.slice(2)).toEqual(['claude-fable-5-1', 'claude-fable-5-1'])
  expect(toasts).toContain("You switched to Fable 5.1, so ToBeBestMe stops sending this session's requests to Sonnet. Helpers still follow your settings.")
  // and switches again in the picker: the newest choice wins over the one before it
  await switched('claude-opus-5-5', 'picker')
  await step('claude-opus-5-5')
  expect(sent[sent.length - 1]).toBe('claude-opus-5-5')
  // helpers still follow the setting, and the line under each answer says what is true
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'list the files', model: 'opus' })
  expect(seen.model).toBe('sonnet')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  expect(await shown(ui)).toContain('Opus is on for this session')
  expect((await ui.find({ type: 'Button', key: 'model-advice' }))?.props.label).toBe('Go back to the usual model')
  await ui.unmount()
})

test('while Always sends this conversation to the cheaper model, the dashboard says so and offers one press to turn it off', { options: { mode: 'always', cheapModel: 'sonnet' } }, async ($, on) => {
  const { sets } = stubs(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  const text = await shown(ui)
  expect(text).toContain('Every request is going to Sonnet')
  expect(text).toContain('Switch models with /model and this session stays on your choice')
  const off = await ui.find({ type: 'Button', key: 'model-advice' })
  expect(off?.props.label).toBe('Turn Always off')
  await ui.press({ key: 'model-advice' })
  expect(sets).toContainEqual({ key: 'tobebestme.mode', value: 'automatic' })
  await ui.unmount()
})

test('in automatic mode with room to spare, a helper keeps its model', async ($, on) => {
  stubs(on)
  const seen = spawnRecorder(on)
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'list the files', model: 'opus' })
  expect(seen.model).toBe('opus')
})

test('helpers always on the cheaper model, whatever the context', { options: { helpersAlwaysCheap: true, cheapModel: 'sonnet' } }, async ($, on) => {
  stubs(on)
  const seen = spawnRecorder(on)
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'list the files', model: 'opus' })
  expect(seen.model).toBe('sonnet')
})

test('past the threshold a helper goes to the cheaper model, one someone put on a model keeps it, and the prompt tells Claude where things stand', async ($, on) => {
  stubs(on, HIGH())
  const seen = spawnRecorder(on)
  const context: { lines?: string[] } = {}
  on('prompt.submit', (_$: unknown, e: any) => {
    context.lines = e.context
    return { drop: 'test' }
  })
  await $.command.run({ command: 'tobebestme', args: '' }) // refreshes the usage snapshot
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'run the tests' })
  expect(seen.model).toBe('haiku')
  await $.agent.spawn({ subagentType: 'general-purpose', prompt: 'review the plan', model: 'opus' })
  expect(seen.model).toBe('opus')

  await $.prompt.submit({ text: 'keep going' }).catch(() => undefined)
  const joined = (context.lines ?? []).join('\n')
  expect(joined).toContain('context 85%')
  expect(joined).toContain('$12.50 this session')
  expect(joined).toContain('handoff note')
})

test('at a session budget set to hold, new prompts wait and slash commands still run', { options: { sessionBudget: 10, atBudget: 'hold' } }, async ($, on) => {
  stubs(on, HIGH())
  let reached = 0
  on('prompt.submit', () => {
    reached += 1
    return { drop: 'bottom' }
  })
  await $.command.run({ command: 'tobebestme', args: '' })
  await $.prompt.submit({ text: 'one more thing' }).catch(() => undefined)
  expect(reached).toBe(0)
  await $.prompt.submit({ text: '/tobebestme', command: { name: 'tobebestme', args: '' } } as any).catch(() => undefined)
  expect(reached).toBe(1)
})

// ---- compaction, the handoff note and wins ----------------------------------------------------

test('a compaction writes the handoff note first (a precompute none), keeps the plan, and counts the win', async ($, on) => {
  stubs(on)
  const order: string[] = []
  const written: { path?: string; text?: string } = {}
  let instructions = ''
  on('model.fork', () => ({ value: { isAnswered: true, text: '## Goal\nship it', usage: USAGE } }))
  on('fs.write', (_$: unknown, e: any) => {
    order.push('write')
    written.path = e.path
    written.text = e.text
    return { value: undefined }
  })
  on('session.compact', (_$: unknown, e: any) => {
    order.push('compact ' + e.trigger)
    instructions = e.instructions ?? ''
    return { messages: [{ role: 'user', text: 'summary', toolUses: [] }], tokensBefore: 170_000, tokensAfter: 20_000 }
  })
  const context: { lines?: string[] } = {}
  on('prompt.submit', (_$: unknown, e: any) => {
    context.lines = e.context
    return { drop: 'test' }
  })

  // a note written while the whole conversation is still here is not pointed out to Claude
  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await pane.press({ key: 'tab-overview' })
  await pane.press({ key: 'handoff' })
  await pane.unmount()
  expect(order).toEqual(['write'])
  await $.prompt.submit({ text: 'and then' }).catch(() => undefined)
  expect((context.lines ?? []).join('\n')).not.toContain('handoff note from before')
  order.length = 0

  await $.session.compact({ trigger: 'precompute', messages: MESSAGES })
  expect(order).toEqual(['compact precompute'])

  await $.session.compact({ trigger: 'auto', messages: MESSAGES })
  expect(order).toEqual(['compact precompute', 'write', 'compact auto'])
  expect(written.path).toContain('/.claude/tobebestme/handoff.md') // resolved against the session's folder
  expect(written.text).toContain('ship it')
  expect(instructions).toContain('ship it')

  await $.prompt.submit({ text: 'keep going' }).catch(() => undefined)
  expect((context.lines ?? []).join('\n')).toContain('handoff note from before the last compaction')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  const text = await shown(ui)
  expect(text).toContain('Wins this session')
  expect(text).toContain('1 compaction freed 150k tokens from every later turn')
  expect(text).toContain('2 handoff notes saved')
  // clearing the activity list doesn't take the wins with it
  await ui.press({ key: 'activity-clear' })
  expect(await shown(ui)).toContain('2 handoff notes saved')
  await ui.unmount()
})

// ---- the dashboard ----------------------------------------------------------------------

test('an empty session says you are in good shape, and every tab teaches what will appear, on every surface', async ($, on) => {
  stubs(on)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'tab-overview' })
    let text = await shown(ui)
    expect(text).toContain("You're in good shape")
    expect(text).toContain('20k of 200k tokens')
    expect(text).toContain('20k of 200k tokens')
    expect(text).not.toContain('5-hour limit')

    await ui.press({ key: 'tab-usage' })
    text = await shown(ui)
    expect(text).toContain("Turns appear here after Claude's next answer.")
    expect(text).not.toContain('Helpers and tools')

    expect(text).toContain('No usage limits reported yet.') // the same tab, below the turns
    await ui.press({ key: 'tab-skills' })
    expect(await shown(ui)).toContain('Nothing repeated yet.')
    await ui.press({ key: 'tab-overview' })
    await ui.unmount()
  }
})

test('a busy session leads with its most pressing problem, what fixing it saves, and fills every tab', async ($, on) => {
  stubs(on, { ...HIGH(), context: { ...HIGH().context, breakdown: BREAKDOWN } })
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  on('turn.step', async function* () {
    return { turnId: 't', index: 0, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, input_tokens: 900, cache_read_input_tokens: 9_000, output_tokens: 1_200, model: 'claude-opus-5-5' } }
  })

  await $.command.run({ command: 'tobebestme', args: '' }) // reads the breakdown
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', messageCount: 3 })) {
    // no chunks here
  }
  await completeTurn($, { ...USAGE, output_tokens: 3_100, model: 'claude-opus-5-5' }, 134_000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'tab-overview' })
    let text = await shown(ui)
    expect(text).toContain('Each turn re-reads 170k tokens')
    expect(text).toContain('about 148k fewer tokens (170k → about 22k)')
    expect(text).toContain('MCP tools add 16k tokens to every request')
    expect((await ui.find({ type: 'Button', key: 'hero-action' }))?.props.label).toBe('Start fresh…')
    // the rings, icons and bars are SVG where the surface draws SVG, every one named; meters on the terminal
    const svgs = await ui.findAll({ type: 'Svg' })
    expect(svgs.length > 0).toBe(surface === 'desktop')
    expect(svgs.filter((x: any) => !String(x.props.alt).trim())).toHaveLength(0)

    text = await shown(ui) // what fills the window is on This session too
    expect(text).toContain('What fills it')
    expect(text).toContain('Messages')
    expect(text).toContain('auto-compaction at 180k')
    expect(text).toContain('context7')
    expect(text).toContain('CLAUDE.md (User)')
    expect(text).toContain('4 skills')

    await ui.press({ key: 'tab-usage' })
    text = await shown(ui)
    expect(text).toContain('2m 14s')
    expect(text).toContain('opus-5-5')
    expect(text).toContain('91%') // from cache: 9,000 of 9,900 input tokens

    await ui.press({ key: 'tab-skills' })
    text = await shown(ui)
    expect(text).toContain('Claude sees only the name of one skill')
    expect(text).toContain('The listing takes 1.9k of its 2k-token room on every request')
    expect(text).toContain('Make 3 skills you never run manual-only')
    expect(text).toContain('anthropic-skills (1 skill), searchfit-seo (1 skill)')
    await ui.press({ key: 'tab-overview' })
    await ui.unmount()
  }
})

test('a usage limit on course to run out before it resets heads the dashboard, with a forecast chart', async ($, on) => {
  const { usage } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'five_hour', percentUsed: 60, resetsAt: '2026-10-23T15:30:00Z' }] })
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  expect(await shown(ui)).toContain('5-hour limit runs out 2.5 hours early')
  await ui.press({ key: 'tab-usage' })
  expect(await shown(ui)).toContain('At your pace in this window it runs out around')
  // the runway says it first, as it does on Home; Show details adds the chart of the window so far
  const runways = (await ui.findAll({ type: 'Svg' })).filter((s: any) => String(s.props.alt).startsWith('5-hour limit 60% used'))
  expect(runways).toHaveLength(1)
  await ui.press({ key: 'details' })
  const charts = (await ui.findAll({ type: 'Svg' })).filter((s: any) => String(s.props.alt).startsWith('5-hour limit: 60% used'))
  expect(charts).toHaveLength(1)
  expect(charts[0].props.isInteractive).toBe(true) // each point says what it is on hover
  await ui.unmount()
})

test('a weekly limit running out a day early outranks a 5-hour limit that runs out minutes before its reset', async ($, on) => {
  const { usage } = stubs(on, {
    ...LOW(),
    rateLimits: [
      { kind: 'five_hour', percentUsed: 31, resetsAt: '2026-10-23T15:30:00Z' },
      { kind: 'seven_day', percentUsed: 81, resetsAt: '2026-10-25T21:00:00Z' },
    ],
  })
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  let text = await shown(ui)
  expect(text).toContain('Weekly limit runs out a day early')
  expect(text).not.toContain('5-hour limit runs out')
  expect((await ui.find({ type: 'Button', key: 'hero-action' }))?.props.label).toBe('Use Haiku for everything')
  // a desktop button draws its label alone, so tab names stay plain
  expect((await ui.find({ type: 'Button', key: 'tab-usage' }))?.props.label).toBe('Usage')
  // the weekly widget says when it runs out and that it needs attention
  expect(text).toContain('runs out Sat')
  expect(text).toContain('Needs attention')

  await ui.press({ key: 'tab-usage' })
  text = await shown(ui)
  expect(text).toContain('just before it resets')
  expect(text).toContain('runs out early')
  await ui.unmount()
})

test('each limit is a runway, not a ring: the weekly one says in words and in marks that it runs out early, on the desktop and the terminal', async ($, on) => {
  const { usage } = stubs(on, {
    ...LOW(),
    rateLimits: [
      { kind: 'five_hour', percentUsed: 13, resetsAt: '2026-10-23T15:30:00Z' },
      { kind: 'seven_day', percentUsed: 86, resetsAt: '2026-10-25T21:00:00Z' },
    ],
  })
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })

  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await desktop.press({ key: 'tab-overview' })
  const svgs = await desktop.findAll({ type: 'Svg' })
  const sources = svgs.map((x: any) => String(x.props.source))
  // no concentric arcs anywhere; each limit's runway has its playhead and reset post
  expect(sources.some((src: string) => src.includes('stroke-dasharray'))).toBe(false)
  const weekly = svgs.find((x: any) => String(x.props.alt).startsWith('Weekly limit'))
  expect(weekly?.props.alt).toBe('Weekly limit 86%, runs out before it resets')
  expect(String(weekly?.props.source)).toContain('class="ro"') // the run-out stop
  expect(String(weekly?.props.source)).toContain('class="now"') // the playhead
  expect(String(weekly?.props.source)).toContain('class="post"') // the reset
  const fiveHour = svgs.find((x: any) => String(x.props.alt).startsWith('5-hour limit'))
  expect(String(fiveHour?.props.alt)).toContain('% of the window gone')
  expect(String(fiveHour?.props.source)).not.toContain('class="ro"') // on pace: no stop
  await desktop.unmount()

  // the terminal draws the same thing in block characters: fill, now (┃) and the dry stretch (╌)
  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await terminal.press({ key: 'tab-overview' })
  const text = await shown(terminal)
  expect(text).toContain('┃')
  expect(text).toContain('╌')
  expect(text).toMatch(/runs out \d/)
  await terminal.unmount()
})

test('rows explain themselves on hover, and buttons open the screens a mod cannot draw', async ($, on) => {
  const { toasts } = stubs(on, { ...HIGH(), context: { ...HIGH().context, breakdown: BREAKDOWN } })
  const filled: string[] = []
  on('prompt.fill', (_$: unknown, e: any) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  await $.command.run({ command: 'tobebestme', args: 'context' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('Your prompts, Claude\u2019s answers and every tool result so far.')
  expect(text).toContain('Grows every turn. Compact or start fresh to shrink it.')
  expect(text).toContain('Biggest: context7 12k, figma 4k.')
  // the meter says what each part is on hover too
  const meter = (await ui.findAll({ type: 'Svg' })).find((s: any) => String(s.props.alt).startsWith('Context 85% full'))
  expect(meter?.props.isInteractive).toBe(true)
  expect(String(meter?.props.source)).toContain('<title>Messages: 150k tokens (75%)</title>')

  await ui.press({ key: 'manage-mcp' })
  expect(filled).toEqual(['/mcp'])
  expect(toasts[toasts.length - 1]).toBe('/mcp is in the prompt box. Press Return to open your MCP servers.')
  await ui.unmount()
})

test('budgets are set on the Usage tab, and the skills list filters as you type', async ($, on) => {
  const { sets } = stubs(on, { ...LOW(), context: { ...LOW().context, breakdown: BREAKDOWN } })
  await $.command.run({ command: 'tobebestme', args: 'spending' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'opt-sessionBudget-10' })
  expect(sets).toEqual([{ key: 'tobebestme.sessionBudget', value: 10 }])

  await ui.press({ key: 'tab-skills' })
  await ui.press({ key: 'skill-show-all' })
  await ui.input({ key: 'skill-filter', text: 'dep', kind: 'change' } as any)
  const text = await shown(ui)
  expect(text).toContain('deploy')
  expect((await ui.findAll({ type: 'Box' })).filter((b: any) => /^skill-\d+$/.test(String(b.props.key))).length).toBe(1)

  await ui.press({ key: 'example-1' })
  expect((await ui.find({ type: 'Input', key: 'skill-describe' }))?.props.value).toContain('commit message')
  await ui.unmount()
})

test('after a few turns the outlook says how many turns are left and how long that is', async ($, on) => {
  const { clock, usage } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'five_hour', percentUsed: 10, resetsAt: '2026-10-23T14:00:00Z' }] })
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  for (let i = 0; i < 4; i++) {
    usage.context = { tokens: 20_000 * (i + 1), window: 200_000, percent: 10 * (i + 1) }
    usage.rateLimits = [{ kind: 'five_hour', percentUsed: 10 + 4 * i, resetsAt: '2026-10-23T14:00:00Z' }]
    await completeTurn($, { ...USAGE, output_tokens: 500, model: 'claude-opus-5-5' })
    clock.now += 3 * 60_000
  }

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-overview' })
  const text = await shown(ui)
  expect(text).toContain('lasts until it resets')
  expect(text).toContain('about 6 turns away')
  expect(text).toContain('120k tokens to go, about 18 min')
  await ui.unmount()
})

test('the Settings presets and the budgets on Usage save through Claude Code settings, each control in one place', async ($, on) => {
  const { sets, toasts } = stubs(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  expect(await shown(ui)).not.toContain('Cheaper model') // set in Settings, not repeated here
  await ui.press({ key: 'tab-usage' })
  expect(await shown(ui)).toContain('Session budget')
  await ui.press({ key: 'opt-sessionBudget-25' })

  await ui.press({ key: 'tab-settings' })
  let text = await shown(ui)
  expect(text).not.toContain('Session budget') // budgets are set on Usage
  expect(text).not.toContain('Keep the plan through compaction')
  await ui.press({ key: 'opt-mode-always' })
  await ui.press({ key: 'opt-cheapModel-sonnet' })
  await ui.press({ key: 'advanced' })
  text = await shown(ui)
  expect(text).toContain('Keep the plan through compaction')
  await ui.press({ key: 'opt-notifications-true' })
  await ui.press({ key: 'tab-usage' })
  await ui.press({ key: 'opt-dailyBudget-other' })
  await ui.input({ key: 'opt-dailyBudget', text: '$15' })
  await ui.press({ key: 'opt-dailyBudget-other' })
  await ui.input({ key: 'opt-dailyBudget', text: 'lots' })

  expect(sets).toEqual([
    { key: 'tobebestme.sessionBudget', value: 25 },
    { key: 'tobebestme.mode', value: 'always' },
    { key: 'tobebestme.cheapModel', value: 'sonnet' },
    { key: 'tobebestme.notifications', value: true },
    { key: 'tobebestme.dailyBudget', value: 15 },
  ])
  expect(toasts[toasts.length - 1]).toBe('Daily budget: enter a number from 0 to 100000.')
  await ui.unmount()
})

test('the Settings tab draws on the terminal too', async ($, on) => {
  stubs(on)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, bodyColumns: 70 } })
  await ui.press({ key: 'tab-settings' })
  await ui.press({ key: 'advanced' })
  expect(await shown(ui)).toContain('Think less past the warning')
  await ui.unmount()
})

test('Compact now asks first; confirming compacts and reports a skip, cancelling does nothing', async ($, on) => {
  const { toasts } = stubs(on)
  let compactions = 0
  on('model.fork', () => ({ value: { isAnswered: false, reason: 'nothing-to-fork' } }))
  on('session.compact', () => {
    compactions += 1
    return { skip: 'nothing to compact yet' }
  })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'tab-overview' })
    await ui.press({ key: 'compact' })
    expect(await shown(ui)).toContain('Shrink this conversation to a summary?')
    await ui.press({ key: 'confirm-cancel' })
    expect(await shown(ui)).not.toContain('Shrink this conversation to a summary?')

    await ui.press({ key: 'compact' })
    await ui.press({ key: 'confirm-go' })
    expect(await shown(ui)).not.toContain('Shrink this conversation to a summary?')
    await ui.unmount()
  }
  expect(compactions).toBe(2)
  expect(toasts.filter((t) => t === 'Compaction skipped: nothing to compact yet')).toHaveLength(2)
})

test('a note written from the dashboard can be read in it, and counts as a win', async ($, on) => {
  stubs(on)
  on('model.fork', () => ({ value: { isAnswered: true, text: '## Goal\nship the dashboard', usage: USAGE } }))
  on('fs.write', () => ({ value: undefined }))

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  await ui.press({ key: 'handoff' })
  const text = await shown(ui)
  expect(text).toContain('Handoff note written under a minute ago, from the dashboard.')
  expect(text).toContain('1 handoff note saved')
  await ui.press({ key: 'note' })
  expect((await ui.find({ type: 'Markdown', key: 'note-text' }))?.props.text).toContain('ship the dashboard')
  await ui.unmount()
})

test('tool output is counted, so the Spending tab shows what fills the conversation', async ($, on) => {
  stubs(on)
  on('tool.call', () => ({ result: {}, text: 'x'.repeat(4_000) }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Bash', command: 'ls -la' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-usage' })
  const text = await shown(ui)
  expect(text).toContain('Helpers and tools')
  expect(text).toContain('Bash')
  expect(text).toContain('~2k')
  await ui.unmount()
})

test('today counts every session on this machine', async ($, on) => {
  const { store } = stubs(on)
  const today = new Date(NOW)
  const key = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
  store['ledger:' + key + ':other-session'] = { usd: 5, turns: 3, project: 'site' }
  await $.command.run({ command: 'tobebestme', args: '' }) // loads the ledger

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  expect(await shown(ui)).toContain('Today $5.00')
  await ui.press({ key: 'tab-usage' })
  const text = await shown(ui)
  expect(text).toContain('Today')
  expect(text).toContain('$5.00')
  await ui.unmount()
})

test("reset asks first, then clears this session's numbers", async ($, on) => {
  stubs(on)
  on('tool.call', () => ({ result: {}, text: 'done' }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-settings' })
  await ui.press({ key: 'reset' })
  expect(await shown(ui)).toContain("Clear this session's numbers?")
  await ui.press({ key: 'confirm-go' })
  await ui.press({ key: 'tab-usage' })
  expect(await shown(ui)).not.toContain('Helpers and tools')
  await ui.unmount()
})

// ---- skills ----------------------------------------------------------------------------

const bash = (command: string) => ({ role: 'assistant', text: '', toolUses: [{ tool_use_id: command, tool: 'Bash', input: { command } }] })

test('repeated commands and prompts become skill ideas', async ($, on) => {
  stubs(on, LOW(), [
    { role: 'user', text: 'review the diff for bugs and missing tests', toolUses: [] },
    bash('npm test'),
    bash('npm test'),
    bash('cd app && npm test'),
    { role: 'user', text: 'Review the diff for bugs and missing tests!', toolUses: [] },
  ])
  await $.command.run({ command: 'tobebestme', args: 'skills' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('You ran npm test 3 times')
  expect(text).toContain('You asked this 2 times')
  await ui.unmount()
})

test('a described skill is drafted, previewed, and saved only when you say so', async ($, on) => {
  const { toasts } = stubs(on)
  const writes: { path: string; text: string }[] = []
  on('model.complete', () => ({ value: { isAnswered: true, text: '---\nname: run-tests\ndescription: Run the tests and summarise failures.\n---\n\n1. Run the suite.\n2. Report failures.', usage: USAGE } }))
  on('fs.exists', () => ({ value: false }))
  on('fs.write', (_$: unknown, e: any) => {
    writes.push({ path: e.path, text: e.text })
    return { value: undefined }
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-skills' })
  await ui.input({ key: 'skill-describe', text: 'Run the tests and summarise the failures' })
  const text = await shown(ui)
  expect(text).toContain('Draft: /run-tests')
  expect(writes).toHaveLength(0)

  await ui.press({ key: 'skill-save' })
  expect(writes).toHaveLength(1)
  expect(writes[0].path).toContain('.claude/skills/run-tests/SKILL.md')
  expect(writes[0].text).toContain('description: Run the tests and summarise failures.')
  expect(toasts[toasts.length - 1]).toContain('Saved /run-tests')
  await ui.unmount()
})

test('a skill named like one of Object’s own members (toString, valueOf) is a skill like any other, never counted as run, and unsafe names from records (__proto__, constructor) are left out', async ($, on) => {
  const odd = { ...BREAKDOWN, skills: { ...BREAKDOWN.skills, totalSkills: 6, includedSkills: 6, skillFrontmatter: [...BREAKDOWN.skills.skillFrontmatter, { name: 'toString', source: 'userSettings', tokens: 300 }, { name: 'valueOf', source: 'userSettings', tokens: 300 }] } }
  stubs(on, { ...LOW(), context: { ...LOW().context, breakdown: odd } })
  const RUNS: Transcript = { path: '-Users-me-Projects-shop/s9.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/shop', answers: [['2026-10-23T11:00:00Z', 'claude-opus-5-5', 0, 1_000, 0, 0]], skills: { deploy: [2, 1, '2026-10-23T11:00:00Z'], pdf: [0, 3, '2026-10-22T09:00:00Z'], ['__proto__']: [5, 0, '2026-10-23T11:00:00Z'], constructor: [5, 0, '2026-10-23T11:00:00Z'] } as any }
  transcripts(on, [RUNS], true, [], {}, { files: SKILL_FILES, prompts: [] })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  await ui.press({ key: 'tab-skills' })
  await new Promise((r) => setTimeout(r, 30))
  await ui.press({ key: 'tab-skills' })
  const text = await shown(ui)
  expect(text).toContain('2 skills ran 6 times in the last 14 days') // toString and valueOf did not run; __proto__ and constructor are not counted
  expect(text).toContain('Make 3 skills you never run manual-only') // seo-audit, toString, valueOf
  expect(text).not.toContain('NaN')
  await ui.unmount()
})

test('with no cheaper model on the account, Suggest more says Sonnet and asks Sonnet', async ($, on) => {
  const { store } = stubs(on)
  store['cheap:missing'] = { model: 'haiku', at: NOW }
  const asked: string[] = []
  on('model.complete', (_$: unknown, e: any) => {
    asked.push(e.model)
    return { value: { isAnswered: true, text: '[]', usage: USAGE } }
  })
  await $.session.start({ cwd: '/Users/me/Projects/shop', source: 'startup' } as any).catch(() => {})
  await $.command.run({ command: 'tobebestme', args: 'skills' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Button', key: 'skill-ideas' }))?.props.label).toBe('Suggest more with Sonnet')
  await ui.press({ key: 'skill-ideas' })
  expect(asked).toEqual(['sonnet'])
  await ui.unmount()
})

// Your own skills as files: one fine, one with no description, two that overlap, one cut short.
const SKILL_FILES: Record<string, string> = {
  '/Users/me/.claude/skills/deploy/SKILL.md': '---\nname: deploy\ndescription: Deploy the app to staging, wait for the health check, then report the URL. Use when the user says deploy, ship it, or push to staging.\n---\nSteps…\n',
  '/Users/me/.claude/skills/notes/SKILL.md': '---\nname: notes\n---\nKeep notes.\n',
  '/Users/me/.claude/skills/seo-audit/SKILL.md': '---\nname: seo-audit\ndescription: Audit a website for search ranking problems, titles, headings, metadata, broken links and page speed. Use when the user asks for an SEO audit of their website pages.\n---\n…\n',
  '/Users/me/.claude/skills/site-seo/SKILL.md': '---\nname: site-seo\ndescription: Check website pages for search ranking problems, titles, headings, metadata, broken links and speed. Use when the user wants an SEO review of their website.\n---\n…\n',
  '/Users/me/.claude/skills/review-pr/SKILL.md': '---\nname: review-pr\ndescription: ' + 'Review a pull request for bugs and style. '.repeat(40) + '\n---\n…\n',
}

test('Skills says what Claude can see, which skills ran in every project, what to fix in yours, and what to make next', async ($, on) => {
  stubs(on, { ...LOW(), context: { ...LOW().context, breakdown: BREAKDOWN } })
  let draft = ''
  on('prompt.read', () => ({ value: { text: draft, cursor: draft.length } }))
  const filled: string[] = []
  on('prompt.fill', (_$: unknown, e: any) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  const RUNS: Transcript = { path: '-Users-me-Projects-shop/s9.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/shop', answers: [['2026-10-23T11:00:00Z', 'claude-opus-5-5', 0, 1_000, 0, 0]], skills: { deploy: [2, 1, '2026-10-23T11:00:00Z'], pdf: [0, 3, '2026-10-22T09:00:00Z'], model: [4, 0, '2026-10-23T10:00:00Z'] } }
  transcripts(on, [RUNS], true, [], {}, { files: SKILL_FILES, prompts: ['P\t4\t2\t0\tmerge and deploy once the checks are green'] })
  await $.command.run({ command: 'tobebestme', args: 'skills' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' }).catch(() => undefined) // Home's refresh isn't on this tab
  await $.command.run({ command: 'tobebestme', args: 'home' })
  await ui.press({ key: 'usage-refresh' })
  await ui.press({ key: 'tab-skills' })
  await new Promise((r) => setTimeout(r, 30)) // the files and the search across projects run in the background
  await ui.press({ key: 'tab-skills' })
  let text = await shown(ui)
  // what Claude can see
  expect(text).toContain('Claude sees only the name of one skill')
  expect(text).toContain('2 yours · 2 from plugins') // seo-audit comes from a plugin here
  // what ran, in every project; /model is a command, not a skill
  expect(text).toContain('Most used')
  expect(text).toContain('/pdf')
  expect(text).toContain('/deploy')
  expect(text).not.toContain('/model')
  expect(text).toContain('2 skills ran 6 times in the last 14 days')
  // making room: never-run skills, idle plugins, more room
  expect(text).toContain('Make 1 skill you never run manual-only') // seo-audit; review-pr is already name only
  expect(text).toContain('searchfit-seo (1 skill)')
  // the check-up of your own
  expect(text).toContain('No description')
  expect(text).toContain('Overlaps with /site-seo')
  expect(text).toContain('Description is cut short')
  expect(text).toContain('Claude sees only its name')
  expect(text).toContain('4 of your 5 skills have something to fix or tidy.') // deploy is fine
  // ideas from prompts repeated across projects
  expect(text).toContain('You asked this 4 times')
  expect(text).toContain('merge and deploy once the checks are green')

  // each fix is a request you read and send
  await ui.press({ key: 'fix-0' })
  expect(filled[filled.length - 1]).toContain('Improve the Claude Code skill at ~/.claude/skills/notes/SKILL.md')
  await ui.press({ key: 'skills-manual' })
  expect(filled[filled.length - 1]).toContain('"skillOverrides" to "user-invocable-only" for these skills')
  expect(filled[filled.length - 1]).toContain('seo-audit')
  await ui.press({ key: 'skills-budget' })
  expect(filled[filled.length - 1]).toContain('"skillListingBudgetFraction" to 0.02')
  await ui.press({ key: 'try-0' })
  expect(filled[filled.length - 1]).toBe('/notes ')
  // with words typed in the box, a command leaves them be and says how to go on
  draft = 'half a thought I was typing'
  const before = filled.length
  await ui.press({ key: 'try-0' })
  expect(filled.length).toBe(before)
  draft = ''
  await ui.press({ key: 'try-0' })
  expect(filled[filled.length - 1]).toBe('/notes ')

  // the listing by source, then every skill, then the ones that go by name alone
  await ui.press({ key: 'skill-show-cut' })
  text = await shown(ui)
  expect(text).toContain('review-pr')
  expect(text).toContain('name only')
  await ui.unmount()
})

test('asking the cheaper model for skill ideas adds them to the list', async ($, on) => {
  stubs(on, LOW(), [{ role: 'user', text: 'open a PR with a summary of the changes', toolUses: [] }])
  on('model.complete', (_$: unknown, e: any) => {
    expect(e.model).toBe('haiku')
    return { value: { isAnswered: true, text: '[{"name": "PR Writer", "description": "Open a pull request with a summary.", "why": "You asked for PRs with summaries."}]', usage: USAGE } }
  })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-skills' })
  await ui.press({ key: 'skill-ideas' })
  const text = await shown(ui)
  expect(text).toContain('pr-writer')
  expect(text).toContain('You asked for PRs with summaries.')
  await ui.unmount()
})

// ---- every session -------------------------------------------------------------------------

// The desktop app's session tools, as $.mcp.call answers them.
function sessionTools(on: any, calls: { tool: string; args: any }[]) {
  const json = (value: unknown) => ({ value: { isError: false, content: [{ type: 'text', text: JSON.stringify(value) }] } })
  on('mcp.call', (_$: unknown, e: any) => {
    calls.push({ tool: e.tool, args: e.args })
    if (e.server !== 'ccd_session_mgmt') return { value: { isError: true, content: [] } }
    if (e.tool === 'get_session') return json({ sessionId: 'local_me', title: 'Budget work' })
    if (e.tool === 'list_sessions')
      return json([
        { sessionId: 'local_a', title: 'Ship the checkout', cwd: '/Users/me/Projects/shop', branch: 'claude/checkout', isRunning: true, lastActivityAt: '2026-10-23T11:59:00Z' },
        { sessionId: 'local_b', title: 'Remaining work audit', cwd: '/Users/me/Projects/net', isRunning: false, prNumber: 874, prState: 'MERGED', lastActivityAt: '2026-10-23T09:00:00Z' },
      ])
    if (e.tool === 'get_usage' && e.args.session_id === 'local_a') return json({ plan: { status: 'ok' }, context: { status: 'ok', tokensUsed: 120_000, contextWindow: 200_000, percentUsed: 60 } })
    if (e.tool === 'get_usage')
      return json({ plan: { status: 'ok', plan: 'Max', windows: [{ label: '5-hour limit', percentUsed: 33, resetsAt: '2026-10-23T15:00:00Z' }, { label: 'Weekly · all models', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }], extraUsage: { enabled: false } }, context: { status: 'ok' } })
    if (e.tool === 'archive_session') return json({ archived: true })
    return { value: { isError: true, content: [] } }
  })
}

// Claude Code's transcripts under ~/.claude/projects, as $.fs.list and the shell search see them.
// Each file: its path under the projects folder, size, age, folder it ran in, and its answers
// ([timestamp, model, input, output, cache read, cache write]).
type Answer = [string, string, number, number, number, number]
// What a session said about itself: its title, branch, last recap, where it ran, whether a schedule
// started it, and what it waits for (a wrap-up's question and replies, a question, a plan, an error).
type Meta = { title?: string; branch?: string; recap?: string; entry?: string; scheduled?: boolean; wait?: { kind: string; text: string; replies?: [string, string][]; at: string; resetsAt?: number } }
// skills: { name: [typed, run by Claude, last run] }
type Transcript = { path: string; size?: number; ageMs: number; cwd: string; answers: Answer[]; meta?: Meta; skills?: Record<string, [number, number, string]> }
const ROOT = '/Users/me/.claude/projects'
const esc = (x: string) => JSON.stringify(x).slice(1, -1)

// The search's F line for a file, as the awk program prints it.
function fLine(i: number, f: Transcript) {
  const m = f.meta || {}
  const w = m.wait
  const replies = (w?.replies || []).map(([label, message]) => esc(label) + '\x1f' + esc(message)).join('\x1e')
  return ['F', i, f.cwd, f.answers[f.answers.length - 1][0], m.branch || '', esc(m.title || ''), '', '', '', '', w?.kind || '', esc(w?.text || ''), replies, w?.at || '', esc(m.recap || ''), m.entry === 'terminal' ? 'cli' : m.entry === 'desktop' ? 'claude-desktop' : '', w?.resetsAt ? Math.round(w.resetsAt / 1000) : '', m.scheduled ? 1 : 0].join('\t')
}

// The same file as Claude Code writes it, for reading without a shell.
function transcriptText(f: Transcript) {
  const m = f.meta || {}
  const lines: string[] = []
  if (m.scheduled) lines.push(JSON.stringify({ parentUuid: null, type: 'user', message: { role: 'user', content: 'run the daily report' }, origin: { kind: 'task-notification', subkind: 'scheduled-trigger' } }))
  if (m.title) lines.push(JSON.stringify({ type: 'custom-title', customTitle: m.title }))
  f.answers.forEach(([timestamp, model, input, output, read, write], i) =>
    lines.push(JSON.stringify({ type: 'assistant', message: { model, id: 'msg_' + i, usage: { input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: write } }, timestamp, cwd: f.cwd, gitBranch: m.branch, entrypoint: m.entry === 'terminal' ? 'cli' : m.entry === 'desktop' ? 'claude-desktop' : undefined })),
  )
  const w = m.wait
  const usage = { input_tokens: 10, output_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  if (m.recap && w?.kind !== 'ask') lines.push(JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5', id: 'msg_recap', content: [{ type: 'tool_use', name: 'mcp__ccd_turn__wrap_up', input: { recap: m.recap } }], usage }, timestamp: f.answers[0][0], cwd: f.cwd }))
  if (w?.kind === 'ask') lines.push(JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5', id: 'msg_wait', content: [{ type: 'tool_use', name: 'mcp__ccd_turn__wrap_up', input: { recap: m.recap, ask: w.text, actions: (w.replies || []).map(([label, message]) => ({ label, message })) } }], usage }, timestamp: w.at, cwd: f.cwd }))
  if (w?.kind === 'question') lines.push(JSON.stringify({ type: 'assistant', message: { model: 'claude-opus-5-5', id: 'msg_wait', content: [{ type: 'tool_use', name: 'AskUserQuestion', input: { questions: [{ question: w.text }] } }], usage }, timestamp: w.at, cwd: f.cwd }))
  if (w?.kind === 'error') lines.push(JSON.stringify({ type: 'assistant', isApiErrorMessage: true, quotaLimits: { resetsAt: w.resetsAt ? Math.round(w.resetsAt / 1000) : undefined }, message: { model: '<synthetic>', id: 'msg_err', content: [{ type: 'text', text: w.text }], usage: { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } }, timestamp: w.at, cwd: f.cwd }))
  return lines.join('\n')
}

// more: other files by absolute path (skill files), and what the repeated-prompt search prints.
function transcripts(on: any, files: Transcript[], shell = true, live: any[] | null = [], git: Record<string, [number, number]> = {}, more: { files?: Record<string, string>; prompts?: string[] } = {}) {
  const runs: string[][] = []
  const reads: string[] = []
  const dirs: Record<string, any[]> = {}
  const add = (dir: string, entry: any) => {
    const list = (dirs[dir] = dirs[dir] || [])
    if (!list.some((x) => x.name === entry.name)) list.push(entry)
  }
  for (const f of files) {
    const parts = f.path.split('/')
    for (let i = 0; i < parts.length - 1; i++) add([ROOT, ...parts.slice(0, i)].join('/'), { name: parts[i], kind: 'dir', size: 0, mtimeMs: 0, isLink: false })
    add([ROOT, ...parts.slice(0, -1)].join('/'), { name: parts[parts.length - 1], kind: 'file', size: f.size ?? 1000, mtimeMs: NOW - f.ageMs, isLink: false })
  }
  for (const path of Object.keys(more.files || {})) {
    const parts = path.split('/')
    for (let i = 2; i < parts.length; i++) add(parts.slice(0, i).join('/'), { name: parts[i], kind: i === parts.length - 1 ? 'file' : 'dir', size: 100, mtimeMs: NOW, isLink: false })
  }
  on('fs.list', (_$: unknown, e: any) => {
    if (!dirs[e.path]) throw new Error('ENOENT')
    return { value: dirs[e.path] }
  })
  const byPath = (path: string) => files.find((f) => ROOT + '/' + f.path === path)
  on('process.run', (_$: unknown, e: any) => {
    if (e.argv[1] === 'agents') {
      // the sessions running now, as `claude agents --json` lists them
      if (!live) throw new Error('claude: not found')
      return { value: { exitCode: 0, stdout: JSON.stringify(live), stderr: '' } }
    }
    if (!shell) throw new Error('sh: not found')
    if (String(e.argv[2]).includes('"origin":{"kind":"human"')) return { value: { exitCode: 0, stdout: (more.prompts || []).join('\n') + '\n', stderr: '' } }
    if (e.argv[3] === 'git-state') {
      // each folder's changed files and unpushed commits, as the git loop prints them
      const out = e.argv.slice(4).filter((d: string) => git[d]).map((d: string) => [d, ...git[d]].join('\t'))
      return { value: { exitCode: 0, stdout: out.join('\n') + '\n', stderr: '' } }
    }
    const paths = e.argv.slice(4)
    runs.push(paths)
    const lines: string[] = []
    paths.forEach((path: string, i: number) => {
      const f = byPath(path)
      if (!f || !f.answers.length) return
      for (const [ts, model, input, output, read, write] of f.answers) lines.push(['S', i, ts.slice(0, 15), model, input, output, read, write, 0, 1].join('\t'))
      for (const [name, [typed, byClaude, at]] of Object.entries(f.skills || {})) lines.push(['K', i, name, typed, byClaude, at].join('\t'))
      lines.push(fLine(i, f))
    })
    return { value: { exitCode: 0, stdout: lines.join('\n') + '\n', stderr: '' } }
  })
  on('fs.read', (_$: unknown, e: any) => {
    reads.push(e.path)
    if (more.files && more.files[e.path] !== undefined) return { value: more.files[e.path] }
    const f = byPath(e.path)
    if (!f) throw new Error('ENOENT')
    return { value: transcriptText(f) }
  })
  return { runs, reads }
}

// A week across three folders: a repository, one of its worktrees, and another project, with a
// helper and a workflow agent in the repository. Today costs $8.30 at list prices, the week $9.30.
const WEEK: Transcript[] = [
  { path: '-Users-me-Projects-storefront/s1.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/storefront', answers: [['2026-10-23T11:35:00Z', 'claude-opus-5-5', 0, 100_000, 1_000_000, 0]] },
  { path: '-Users-me-Projects-storefront/s1/subagents/agent-a.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/storefront', answers: [['2026-10-23T11:36:00Z', 'claude-haiku-5-5', 0, 200_000, 0, 0]] },
  { path: '-Users-me-Projects-storefront/s1/subagents/workflows/wf_1/agent-b.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/storefront', answers: [['2026-10-23T11:37:00Z', 'claude-opus-5-5', 0, 250_000, 0, 0]] },
  { path: '-Users-me-Projects-storefront--claude-worktrees-fix-a1/s2.jsonl', ageMs: 7_200_000, cwd: '/Users/me/Projects/storefront/.claude/worktrees/fix-a1', answers: [['2026-10-23T11:38:00Z', 'claude-sonnet-5-5', 0, 100_000, 0, 0]] },
  { path: '-Users-me-Projects-ledger-api/s3.jsonl', ageMs: 86_400_000, cwd: '/Users/me/Projects/ledger-api', answers: [['2026-10-22T12:00:00Z', 'claude-opus-5-5', 0, 50_000, 0, 0]] },
  { path: '-Users-me-Projects-ledger-api/old.jsonl', ageMs: 30 * 86_400_000, cwd: '/Users/me/Projects/ledger-api', answers: [['2026-09-23T12:00:00Z', 'claude-opus-5-5', 0, 900_000, 0, 0]] },
]

test('on a plan, costs show as a share of the weekly limit everywhere, and Usage switches them to dollars in one press', async ($, on) => {
  const { sets, usage } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'seven_day', percentUsed: 30, resetsAt: '2026-10-25T21:00:00Z' }] })
  // $30 of work this week at list prices has moved the weekly limit to 30%: a dollar is 1% of it
  transcripts(on, [{ path: '-Users-me-Projects-shop/big.jsonl', ageMs: 3_600_000, cwd: '/Users/me/Projects/shop', answers: [['2026-10-23T11:00:00Z', 'claude-opus-5-5', 0, 1_500_000, 0, 0]] }])
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  let text = await shown(ui)
  expect(text).toContain('30% of your weekly limit today across 1 project')
  expect(text).not.toContain('$30.00')
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('of the week here')
  await band.unmount()
  await ui.press({ key: 'tab-usage' })
  text = await shown(ui)
  expect(text).toContain('Show costs as')
  expect(text).toContain('Now about 1% a dollar')
  await ui.press({ key: 'opt-costUnit-usd' })
  expect(sets).toContainEqual({ key: 'tobebestme.costUnit', value: 'usd' })
  await ui.press({ key: 'tab-all' })
  expect(await shown(ui)).toContain('$30.00 of work today across 1 project')
  await ui.unmount()
})

test('All projects adds up every project from Claude Code’s own records, worktrees and helpers included, and says what stands out', async ($, on) => {
  const { sets } = stubs(on)
  const { runs } = transcripts(on, WEEK)
  await $.command.run({ command: 'tobebestme', args: 'projects' })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'usage-refresh' })
    let text = await shown(ui)
    expect(text).toContain('$8.30') // today, every project
    expect(text).toContain('1 project · 2 sessions')
    expect(text).toContain('$9.30') // the past 7 days; the month-old transcript is left out
    expect(text).toContain('storefront')
    expect(text).toContain('1 worktree')
    expect(text).toContain('ledger-api')
    expect(text).toContain('Today is 50× your usual day')
    expect(text).toContain('Workflow agents and helpers did 55% of this week’s work')
    expect(text).toContain('Opus 5.5 did 88% of this week’s work')
    expect(text).toContain('Last 14 days')
    expect(text).toContain('Models this week: Opus 5.5 87%, Sonnet 5.5 12%, Haiku 5.5 1%.') // the busiest project, on hover
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' })).filter((x: any) => !String(x.props.alt).trim())).toHaveLength(0)

    await ui.press({ key: 'proj-today' })
    text = await shown(ui)
    expect(text).not.toContain('ledger-api') // nothing there today
    await ui.press({ key: 'proj-week' })
    await ui.unmount()
  }
  // one search read the five recent transcripts; asking again reads nothing that hasn't changed
  expect(runs).toHaveLength(1)
  expect(runs[0]).toHaveLength(5)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  expect(runs).toHaveLength(1)

  await ui.press({ key: 'insight-1' }) // Use Haiku for helpers
  expect(sets).toContainEqual({ key: 'tobebestme.helpersAlwaysCheap', value: true })
  await ui.unmount()

  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('$8.30 today in 1 project')
  await band.unmount()
})

test('without a shell, transcripts are read one by one, and a long one is noted rather than guessed', async ($, on) => {
  stubs(on)
  const { reads } = transcripts(on, [...WEEK.slice(0, 4), { ...WEEK[4], size: 6_000_000 }], false)
  await $.command.run({ command: 'tobebestme', args: 'projects' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'usage-refresh' })
  const text = await shown(ui)
  expect(text).toContain('$8.30')
  expect(text).toContain('1 long transcript over 4 MB left out')
  expect(reads.some((path) => path.endsWith('s3.jsonl'))).toBe(false)
  await ui.unmount()
})

// Sessions in several projects that stopped for you, as the records show them.
const WAITING: Transcript[] = [
  {
    path: '-Users-me-Projects-storefront/ask.jsonl',
    ageMs: 2 * 3_600_000,
    cwd: '/Users/me/Projects/storefront',
    answers: [['2026-10-23T10:00:00Z', 'claude-opus-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Checkout redesign', branch: 'claude/checkout', entry: 'desktop', recap: 'The new checkout passes its tests.', wait: { kind: 'ask', text: 'Ship the new checkout to staging?', replies: [['Ship it', 'Ship the new checkout to staging and tell me when it is up.'], ['Hold off', 'Hold off on staging for now.']], at: '2026-10-23T10:00:00Z' } },
  },
  {
    path: '-Users-me-Projects-ledger-api/limit.jsonl',
    ageMs: 5 * 3_600_000,
    cwd: '/Users/me/Projects/ledger-api',
    answers: [['2026-10-23T07:00:00Z', 'claude-opus-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Ledger import', entry: 'desktop', wait: { kind: 'error', text: 'You’ve hit your weekly limit · resets 11am', at: '2026-10-23T07:00:00Z', resetsAt: NOW - 3_600_000 } },
  },
  {
    path: '-Users-me-Projects-notes/q.jsonl',
    ageMs: 3_600_000,
    cwd: '/Users/me/Projects/notes',
    answers: [['2026-10-23T11:00:00Z', 'claude-sonnet-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Notes sync', entry: 'terminal', wait: { kind: 'question', text: 'Which database should notes use?', at: '2026-10-23T11:00:00Z' } },
  },
  {
    path: '-Users-me-Projects-docs-site/pick.jsonl',
    ageMs: 4 * 3_600_000,
    cwd: '/Users/me/Projects/docs-site',
    answers: [['2026-10-23T08:00:00Z', 'claude-opus-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Docs search', branch: 'claude/search', entry: 'desktop', recap: 'Search works locally; nothing is committed yet.' },
  },
  {
    path: '-Users-me-Projects-reports/daily.jsonl',
    ageMs: 3 * 3_600_000,
    cwd: '/Users/me/Projects/reports',
    answers: [['2026-10-23T09:00:00Z', 'claude-sonnet-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Daily report', entry: 'desktop', scheduled: true, recap: 'The daily report went out.' },
  },
  {
    path: '-Users-me-Projects-reports/yesterday.jsonl',
    ageMs: 27 * 3_600_000,
    cwd: '/Users/me/Projects/reports',
    answers: [['2026-10-22T09:00:00Z', 'claude-sonnet-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Daily report', entry: 'desktop', scheduled: true, wait: { kind: 'error', text: 'You’ve hit your weekly limit · resets 9pm', at: '2026-10-22T09:00:00Z', resetsAt: NOW - 20 * 3_600_000 } },
  },
  {
    path: '-Users-me-Projects-wiki/old.jsonl',
    ageMs: 3_600_000,
    cwd: '/Users/me/Projects/wiki',
    answers: [['2026-10-23T11:00:00Z', 'claude-sonnet-5-5', 0, 10_000, 0, 0]],
    meta: { title: 'Wiki cleanup', entry: 'desktop', wait: { kind: 'ask', text: 'Delete the stale pages?', replies: [['Delete them', 'Delete the stale pages.']], at: '2026-10-23T11:00:00Z' } },
  },
]

// The desktop app's list for those sessions: the wiki one is archived, so it no longer waits.
function waitingDesk(on: any, calls: { tool: string; args: any }[], extra: any[] = []) {
  const json = (value: unknown) => ({ value: { isError: false, content: [{ type: 'text', text: JSON.stringify(value) }] } })
  on('mcp.call', (_$: unknown, e: any) => {
    calls.push({ tool: e.tool, args: e.args })
    if (e.tool === 'get_session') return json({ sessionId: 'local_me', title: 'Budget work' })
    if (e.tool === 'list_sessions')
      return json([
        { sessionId: 'local_ask', title: 'Checkout redesign', cwd: '/Users/me/Projects/storefront', isRunning: false, isArchived: false, lastActivityAt: '2026-10-23T10:00:30Z' },
        { sessionId: 'local_limit', title: 'Ledger import', cwd: '/Users/me/Projects/ledger-api', isRunning: false, isArchived: false, lastActivityAt: '2026-10-23T07:00:10Z' },
        { sessionId: 'local_docs', title: 'Docs search', cwd: '/Users/me/Projects/docs-site', isRunning: false, isArchived: false, prNumber: 41, prState: 'OPEN', lastActivityAt: '2026-10-23T08:00:20Z' },
        { sessionId: 'local_wiki', title: 'Wiki cleanup', cwd: '/Users/me/Projects/wiki', isRunning: false, isArchived: true, lastActivityAt: '2026-10-23T11:00:05Z' },
        ...extra,
      ])
    if (e.tool === 'get_usage') return json({ plan: { status: 'unavailable' }, context: { status: 'ok' } })
    if (e.tool === 'send_message') return json({ delivered: true })
    return { value: { isError: true, content: [] } }
  })
}

test('Home lists the chats waiting for you across projects, answers one in a press after a check, and says where each project got to', async ($, on) => {
  const { toasts, store } = stubs(on)
  const calls: { tool: string; args: any }[] = []
  // a Claude app session with the same folder and title as the notes chat, which ran in a terminal:
  // a reply must never go to it
  waitingDesk(on, calls, [{ sessionId: 'local_notes_twin', title: 'Notes sync', cwd: '/Users/me/Projects/notes', isRunning: false, isArchived: false, lastActivityAt: '2026-10-23T11:00:10Z' }])
  transcripts(on, WAITING, true, [{ pid: 9, sessionId: 'perm', cwd: '/Users/me/Projects/api', kind: 'interactive', name: 'Release', status: 'waiting', waitingFor: 'permission to run npm publish' }])
  const copied: string[] = []
  on('ui.copy', (_$: unknown, e: any) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  let text = await shown(ui)
  expect(text).toContain('4 chats are waiting for you') // the live one, the answer, the question, and the limit that has reset
  expect(text).toContain('Needs your permission')
  expect(text).toContain('permission to run npm publish')
  expect(text).toContain('Waiting for your answer')
  expect(text).toContain('Ship the new checkout to staging?')
  expect(text).toContain('Ready to carry on')
  expect(text).toContain('Asked you a question')
  expect(text).toContain('Which database should notes use?')
  expect(text).not.toContain('Carry it on in a terminal with the resume command.') // only the most pressing chat is drawn whole
  await ui.press({ key: 'need-1-open' })
  text = await shown(ui)
  expect(text).toContain('Carry it on in a terminal with the resume command.') // the notes session ran in a terminal
  expect(text).toContain('Pull request open')
  await ui.press({ key: 'need-4-open' })
  text = await shown(ui)
  expect(text).toContain('Last: Search works locally; nothing is committed yet.') // the open PR's session, said once
  expect(text).not.toContain('Delete the stale pages?') // archived in the app
  expect(text).not.toContain('Pick up where you left off') // the only project without a waiting chat has its PR above
  expect(text).not.toContain('The daily report went out.') // a schedule's run is not where you left off
  expect(text).not.toContain('resets 9pm') // yesterday's run stopped at a limit, but today's ran since

  // a suggested reply asks first, then goes to that session
  const first = (await ui.findAll({ type: 'Button' })).find((b: any) => b.props.label === 'Ship it')
  expect(first?.props.variant).toBe('primary')
  await ui.press({ key: first.props.key })
  expect(await shown(ui)).toContain('Send this to “Checkout redesign”?')
  expect(calls.some((c) => c.tool === 'send_message')).toBe(false)
  await ui.press({ key: 'reply-go' })
  expect(calls.find((c) => c.tool === 'send_message')?.args).toEqual({ session_id: 'local_ask', message: 'Ship the new checkout to staging and tell me when it is up.' })
  expect(toasts.some((t) => t.includes('Sent to “Checkout redesign”'))).toBe(true)
  text = await shown(ui)
  expect(text).not.toContain('Ship the new checkout to staging?') // answered
  expect(text).toContain('3 chats are waiting for you')

  // the notes question: copy the command that carries it on, then set it aside
  await ui.press({ key: 'need-1-open' })
  const copy = (await ui.findAll({ type: 'Button' })).filter((b: any) => b.props.label === 'Copy resume command')
  expect(copy.length).toBeGreaterThan(0)
  const notesRow = (await ui.findAll({ type: 'Button' })).find((b: any) => b.props.label === 'Set aside' && String(b.props.key).startsWith('need-1'))
  await ui.press({ key: 'need-1-copy' })
  expect(copied[copied.length - 1]).toContain("claude --resume")
  store['needs:dismissed'] = { ...((store['needs:dismissed'] as any) || {}), 'set-aside-elsewhere': NOW } // another session set one aside a moment ago
  await ui.press({ key: notesRow.props.key })
  expect(await shown(ui)).toContain('2 chats are waiting for you')
  expect(Object.keys(store['needs:dismissed'] as any)).toContain('set-aside-elsewhere') // not written over
  expect(Object.keys(store['needs:dismissed'] as any).length).toBe(2)
  await ui.unmount()

  // in the terminal the same list shows, with the resume command in place of replies
  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  text = await shown(term)
  expect(text).toContain('Needs your permission')
  await term.unmount()

  // the line above the prompt says so in every session
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('2 chats are waiting for you')
  await band.unmount()
})

test('Pick up says where each project got to, with work left uncommitted or unpushed', async ($, on) => {
  stubs(on)
  transcripts(on, [WAITING[3], WAITING[4], { ...WAITING[0], meta: { ...WAITING[0].meta, wait: undefined } }], true, [{ pid: 4, sessionId: 'ask', cwd: '/Users/me/Projects/storefront', kind: 'interactive', name: 'Checkout redesign', status: 'busy' }], { '/Users/me/Projects/docs-site': [3, 2] })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  await ui.press({ key: 'tab-all' }) // drawn again once the folders' state is in
  const text = await shown(ui)
  expect(text).toContain('Nothing is waiting for you')
  expect(text).toContain('Pick up where you left off')
  expect(text).toContain('Docs search')
  expect(text).toContain('Search works locally; nothing is committed yet.')
  expect(text).toContain('3 files changed, not committed · 2 commits not pushed')
  expect(text).not.toContain('Daily report')
  expect(text).toContain('working now') // the checkout session is running in another window
  expect(await ui.find({ type: 'Button', key: 'pick-0-copy' })).toBeFalsy() // so it isn't resumed a second time
  expect(await ui.find({ type: 'Button', key: 'pick-1-type' })).toBeFalsy() // outside the app, nothing to send it to
  expect(await ui.find({ type: 'Button', key: 'pick-1-copy' })).toBeTruthy()
  await ui.unmount()
})

test('without a shell, the same waiting chats are read from each transcript', async ($, on) => {
  stubs(on)
  transcripts(on, WAITING, false, null)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'usage-refresh' })
  const text = await shown(ui)
  expect(text).toContain('Ship the new checkout to staging?')
  expect(text).toContain('Which database should notes use?')
  expect(text).toContain('Ready to carry on')
  expect(text).toContain('Delete the stale pages?') // outside the app nothing says it was archived
  expect(text).toContain('Search works locally; nothing is committed yet.')
  expect(text).not.toContain('The daily report went out.')
  await ui.unmount()
})

test('a computer with no records says so and offers to try again; turned off, it offers to turn it on', async ($, on) => {
  const { sets } = stubs(on)
  await $.command.run({ command: 'tobebestme', args: 'projects' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  expect(await shown(ui)).toContain('Couldn’t read Claude Code’s records on this computer.')
  await ui.unmount()
})

test('Home suggests habits that are not yet habits, one press each, and drops them once they are', async ($, on) => {
  const { sets } = stubs(on)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('Get more from Claude')
  expect(text).toContain('Hear when a chat needs you')
  expect(text).toContain('Set a spending guard')
  await ui.press({ key: 'next-notify' })
  expect(sets).toContainEqual({ key: 'tobebestme.notifications', value: true })
  await ui.press({ key: 'next-budget' })
  expect(await shown(ui)).not.toContain('Get more from Claude') // the budget lives on Usage: the press opens it
  await ui.unmount()
})

test('a /clear moves this session to its new id: the old one’s copy record goes, and the new one is this session, not another', async ($, on) => {
  const { store } = stubs(on)
  let sid = 's-before'
  on('session.id', () => ({ value: sid }))
  on('session.end', (_$: unknown, e: any) => ({ sessionId: e.sessionId }))
  await $.session.start({ cwd: '/Users/me/Projects/shop', source: 'startup' } as any).catch(() => {})
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const mine = store['instance:s-before']
  expect(mine).toBeTruthy()
  sid = 's-after'
  await $.session.end({ reason: 'clear', sessionId: 's-before', resume: {} } as any)
  expect(store['instance:s-before']).toBeUndefined()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.drawn()
  expect(store['instance:s-after']).toBe(mine)
  await ui.unmount()
})

test('the pane opens the same way from everywhere: from the line above the prompt too, Esc closes it', async ($, on) => {
  const { opens } = stubs(on)
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  await band.press({ key: 'band-open' })
  await $.command.run({ command: 'tobebestme', args: '' })
  expect(opens.length).toBe(2)
  for (const o of opens) expect(o.closeOnEscape).toBe(true)
  await band.unmount()
})

test('Start fresh asks on This session wherever it is pressed, and the question shows', async ($, on) => {
  stubs(on, { ...HIGH(), context: { ...HIGH().context, breakdown: BREAKDOWN } })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  await ui.press({ key: 'hero-action' }) // Start fresh…, the headline's answer
  expect(await shown(ui)).toContain('Start a fresh conversation?')
  expect(await ui.find({ type: 'Button', key: 'confirm-go' })).toBeTruthy()
  await ui.unmount()
})

test('the first time, Home walks through four steps with the real thing, remembers it is done, and /tobebestme tour brings it back', async ($, on) => {
  const { store } = stubs(on)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  let text = await shown(ui)
  expect(text).toContain('Welcome to ToBeBestMe')
  expect(text).toContain('The line above your prompt')
  expect(text).toContain('Step 1 of 4')
  await ui.press({ key: 'tour-next' })
  expect(await shown(ui)).toContain('Chats that need you')
  await ui.press({ key: 'tour-back' })
  expect(await shown(ui)).toContain('Step 1 of 4')
  for (const key of ['tour-next', 'tour-next', 'tour-next']) await ui.press({ key })
  text = await shown(ui)
  expect(text).toContain('Habits that help most')
  expect(text).toContain('Step 4 of 4')
  expect(await ui.find({ type: 'Button', key: 'tour-skip' })).toBeFalsy() // the last step just says Done
  await ui.press({ key: 'tour-done' })
  expect(await shown(ui)).not.toContain('Welcome to ToBeBestMe')
  expect((store['habits:v1'] as any).isTourDone).toBe(true)
  await $.command.run({ command: 'tobebestme', args: 'tour' })
  expect(await shown(ui)).toContain('Welcome to ToBeBestMe')
  await ui.press({ key: 'tour-skip' })
  expect((store['habits:v1'] as any).isTourDone).toBe(true)
  await ui.unmount()
})

test('the tour waits while a chat needs an answer, and habits are ranked from your own records, put off for a month with Not now', async ($, on) => {
  const { store, clock } = stubs(on, { ...HIGH(), context: { ...HIGH().context, breakdown: BREAKDOWN } })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tour-skip' })
  const text = await shown(ui)
  // what the records show costing you comes before a habit you could start
  expect(text).toContain('MCP servers add 16k tokens to every request')
  expect(text.indexOf('MCP servers add')).toBeLessThan(text.indexOf('Hear when a chat needs you'))
  expect(text).toMatch(/\d of \d habits in place/)
  expect(await ui.find({ type: 'Button', key: 'next-mcp' })).toBeTruthy()
  await ui.press({ key: 'next-mcp-later' })
  expect(await shown(ui)).not.toContain('MCP servers add 16k tokens')
  expect(Object.keys((store['habits:v1'] as any).dismissed)).toContain('mcp')
  clock.now += 31 * 86_400_000 // a month on, it asks again
  await ui.press({ key: 'tab-overview' })
  await ui.press({ key: 'tab-all' })
  expect(await shown(ui)).toContain('MCP servers add 16k tokens to every request')
  await ui.unmount()
})

test('turned off, All projects says so and turns it back on in one press', { options: { scanProjects: false } }, async ($, on) => {
  const { sets } = stubs(on)
  await $.command.run({ command: 'tobebestme', args: 'projects' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await shown(ui)).toContain('Reading every project is off.')
  await ui.press({ key: 'scan-on' })
  expect(sets).toContainEqual({ key: 'tobebestme.scanProjects', value: true })
  await ui.unmount()
})

test('in the desktop app, All projects also lists the open sessions and the plan they share, and archives a finished one after asking', async ($, on) => {
  const { toasts } = stubs(on)
  const calls: { tool: string; args: any }[] = []
  sessionTools(on, calls)
  await $.command.run({ command: 'tobebestme', args: 'all' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  const text = await shown(ui)
  expect(text).toContain('Max plan. Every project draws on the same limits.')
  expect(text).toContain('Weekly · all models')
  expect(text).toContain('Budget work') // this session, by the title the app gave it
  expect(text).toContain('Ship the checkout')
  expect(text).toContain('working now')
  expect(text).toContain('60%') // a working session's context, read through the app
  expect(text).toContain('Remaining work audit')
  expect(text).toContain('Ready to archive')

  await ui.press({ key: 'archive-0' })
  expect(await shown(ui)).toContain('Archive “Remaining work audit”?')
  expect(calls.some((c) => c.tool === 'archive_session')).toBe(false)
  await ui.press({ key: 'archive-go' })
  expect(calls.find((c) => c.tool === 'archive_session')?.args.session_id).toBe('local_b')
  expect(toasts.some((t) => t.startsWith('Archived Remaining work audit.'))).toBe(true)
  await ui.unmount()
})

test('a plan reading one session took shows in another that has none yet, with its age', async ($, on) => {
  const { store, clock } = stubs(on)
  store['plan:last'] = { at: NOW - 20 * 60_000, plan: 'Max', windows: [{ label: 'Weekly · all models', pct: 64, resetsAt: Date.parse('2026-10-25T21:00:00Z') }, { label: '5-hour limit', pct: 90, resetsAt: NOW - 60_000 }] }
  await $.command.run({ command: 'tobebestme', args: 'projects' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = await shown(ui)
  expect(text).toContain('As read 20 min ago by another session.')
  expect(text).toContain('64%')
  expect(text).not.toContain('5-hour limit') // that window has reset since
  await ui.unmount()
})

test('set to open in every session, the dashboard opens at the start, or with the first message when the window was too narrow', { options: { openOnStart: true } }, async ($, on) => {
  const { opened: opens, pane } = stubs(on)
  pane.isWide = false
  on('command.register', () => ({ value: undefined }))
  on('clock.every', () => ({ value: undefined }))
  on('mcp.call', () => ({ value: { isError: true, content: [] } }))
  on('session.start', (_$: unknown, e: any) => ({ cwd: e.cwd }))
  on('prompt.submit', (_$: unknown, e: any) => ({ text: e.text }))
  await $.session.start({ cwd: '/Users/me/Projects/shop', surface: 'desktop', isInteractive: true } as any)
  expect(opens).toEqual(['tobebestme'])
  pane.isWide = true
  await $.prompt.submit({ text: 'fix the flaky test' }).catch(() => undefined)
  expect(opens).toEqual(['tobebestme', 'tobebestme'])
  await $.prompt.submit({ text: 'and the other one' }).catch(() => undefined)
  expect(opens).toHaveLength(2) // once is enough: closed after that, it stays closed
})

test('a line above the prompt says what needs you and opens the dashboard', async ($, on) => {
  const { opened } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'seven_day', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }] })
  await $.command.run({ command: 'tobebestme', args: '' })
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'desktop', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  const text = await shown(band)
  expect(text).toContain('Weekly limit')
  expect(text).toContain('Context')
  expect(text).toContain('10%')
  expect(text).toContain('Weekly')
  expect(text).toContain('82%')
  await band.press({ key: 'band-open' })
  expect(opened[opened.length - 1]).toBe('tobebestme')
  await band.unmount()
})

test('the line under each answer, the status line and the copied summary say where things stand in plain words', async ($, on) => {
  const { statuses } = stubs(on, { ...HIGH(), rateLimits: [{ kind: 'seven_day', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }], context: { ...HIGH().context, breakdown: BREAKDOWN } })
  const calls: { tool: string; args: any }[] = []
  waitingDesk(on, calls)
  transcripts(on, WAITING, true, [])
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  const copied: string[] = []
  on('ui.copy', (_$: unknown, e: any) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  await ui.press({ key: 'tab-all' })

  // the status line: waiting chats first, then each gauge with a small meter, tightest first
  const line = String(statuses[statuses.length - 1])
  expect(line).toContain('● 3 chats waiting')
  expect(line).toMatch(/context ▰+▱* 85%/)
  expect(line).toContain('weekly ▰▰▰▰▰▱ 82%, resets')
  expect(line.indexOf('context')).toBeLessThan(line.indexOf('weekly'))

  // the line under the answer: the turn, the session, and what matters now
  const r = await completeTurn($, { ...USAGE, input_tokens: 2_000, cache_read_input_tokens: 38_000, output_tokens: 1_200, model: 'claude-opus-5-5' }, 134_000)
  expect(r.text).toContain('ToBeBestMe · this turn $')
  expect(r.text).toContain('2m 14s, read 40k (95% from cache), wrote 1.2k')
  expect(r.text).toContain('context 85%, 10k before it compacts')
  expect(r.text).toContain('weekly limit 82%')
  expect(r.text).toContain('3 chats are waiting for you elsewhere')

  // the summary to paste anywhere
  await ui.press({ key: 'home-copy' })
  const text = copied[copied.length - 1]
  expect(text).toContain('Claude Code status · ')
  expect(text).toContain('Waiting for you (4)')
  expect(text).toContain('Checkout redesign (storefront): Ship the new checkout to staging?')
  expect(text).toContain('Limits: Weekly limit 82%')
  expect(text).toContain('This session: $12.50')
  await ui.unmount()
})

test('the first start carries over what budget-pilot kept, once', async ($, on) => {
  const { store } = stubs(on)
  on('fs.list', (_$: unknown, e: any) => ({ value: e.path === '/Users/me/.claude/plugins/store' ? [{ name: 'budget-pilot_inline-2add.json', kind: 'file', size: 10, mtimeMs: NOW, isLink: false }] : [] }))
  on('fs.read', () => ({ value: JSON.stringify({ 'plan:last': { at: NOW, plan: 'Max', windows: [] }, 'needs:dismissed': { 'a:ask': NOW } }) }))
  on('command.register', () => ({ value: undefined }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_$: unknown, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/me/Projects/shop', surface: 'desktop', isInteractive: true } as any)
  expect(store['plan:last']).toEqual({ at: NOW, plan: 'Max', windows: [] })
  expect(store['needs:dismissed']).toEqual({ 'a:ask': NOW })
  expect((store['carried:v1'] as any).from).toBe('budget-pilot_inline-2add.json')
})

test('ToBeBestMe checks its own files against its release and says which differ, in Settings', async ($, on) => {
  const { toasts } = stubs(on)
  const good = 'export const fine = 1\n'
  const hex = async (text: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('')
  const manifest = { name: 'tobebestme', version: '1.4.0', files: { 'hooks/lib.js': await hex(good), 'hooks/draw.js': await hex(good) } }
  // a module dropped in beside the released ones counts too
  on('fs.list', (_$: unknown, e: any) => ({ value: String(e.path).endsWith('/hooks') ? ['lib.js', 'draw.js', 'extra.js', '._lib.js'].map((name) => ({ kind: 'file', name })) : [] }))
  on('fs.read', (_$: unknown, e: any) => {
    const path = String(e.path)
    if (path.endsWith('/.claude-plugin/integrity.json')) return { value: JSON.stringify(manifest) }
    if (path.endsWith('/hooks/lib.js')) return { value: { base64: btoa(good) } }
    if (path.endsWith('/hooks/draw.js')) return { value: { base64: btoa('export const changed = 2\n') } }
    throw new Error('ENOENT')
  })
  on('command.register', () => ({ value: undefined }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_$: unknown, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/me/Projects/shop', surface: 'desktop', isInteractive: true } as any)
  await settle()
  expect(toasts.some((t) => t.includes('2 files differ from release 1.4.0'))).toBe(true)
  await $.command.run({ command: 'tobebestme', args: 'settings' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('This copy of ToBeBestMe')
  expect(text).toContain('hooks/draw.js')
  expect(text).toContain('hooks/extra.js (added)')
  expect(text).not.toContain('hooks/lib.js')
  await ui.unmount()
})

test('a copy that had a release manifest and lost it says so, instead of passing for a development copy', async ($, on) => {
  const { store } = stubs(on)
  store['integrity:checked'] = { at: NOW - 2 * 86_400_000, version: '1.4.0', changed: [] }
  on('fs.list', () => ({ value: [] }))
  on('fs.read', () => {
    throw new Error('ENOENT')
  })
  on('command.register', () => ({ value: undefined }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_$: unknown, e: any) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/Users/me/Projects/shop', surface: 'desktop', isInteractive: true } as any)
  await settle()
  await $.command.run({ command: 'tobebestme', args: 'settings' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('The release manifest is missing (this copy had one for release 1.4.0)')
  expect(text).not.toContain('this is a development copy')
  await ui.unmount()
})

// ---- calm, models and long runs -----------------------------------------------------------------

test('when a limit runs early on Opus, the adviser suggests Sonnet and one press switches this session', async ($, on) => {
  const { usage } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'seven_day', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }] })
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })
  await completeTurn($, { ...USAGE, output_tokens: 500, model: 'claude-opus-5-5' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  let text = await shown(ui)
  expect(text).toContain('Switch this session to Sonnet')
  expect(text).toContain('Weekly limit: About 7% a day lasts until the reset.')
  await ui.press({ key: 'model-advice' })
  text = await shown(ui)
  expect(text).toContain('Sonnet is on for this session')

  for await (const _ of $.turn.step({ turnId: 't2', index: 0, model: 'claude-opus-5-5', messageCount: 3 })) {
    // no chunks
  }
  expect(sent[sent.length - 1]).toBe('sonnet')
  await ui.unmount()
})

test('on Fable the adviser knows the model: tight limits suggest Opus, and one press switches this session', async ($, on) => {
  const { usage } = stubs(on, { ...LOW(), rateLimits: [{ kind: 'seven_day', percentUsed: 82, resetsAt: '2026-10-25T21:00:00Z' }] })
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  on('session.measure', (_$: unknown, e: any) => ({ changed: e.changed }))
  await $.session.measure({ context: usage.context, rateLimits: usage.rateLimits, cost: usage.cost, changed: ['rateLimits'] })
  await completeTurn($, { ...USAGE, output_tokens: 500, model: 'claude-fable-5-1' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'tab-overview' })
  let text = await shown(ui)
  expect(text).toContain('Switch this session to Opus')
  expect(text).not.toContain('A suggestion appears after the first answer')
  await ui.press({ key: 'model-advice' })
  text = await shown(ui)
  expect(text).toContain('Opus is on for this session')
  for await (const _ of $.turn.step({ turnId: 't2', index: 0, model: 'claude-fable-5-1', messageCount: 3 })) {
    // no chunks
  }
  expect(sent[sent.length - 1]).toBe('opus')
  await ui.unmount()
})

test('a long run is planned against the limits, saved as a playbook skill, and started in the prompt box', async ($, on) => {
  stubs(on, { ...LOW(), rateLimits: [{ kind: 'five_hour', percentUsed: 70, resetsAt: '2026-10-23T14:00:00Z' }] })
  const writes: { path: string; text: string }[] = []
  const filled: string[] = []
  on('fs.exists', () => ({ value: false }))
  on('fs.write', (_$: unknown, e: any) => {
    writes.push({ path: e.path, text: e.text })
    return { value: undefined }
  })
  on('prompt.fill', (_$: unknown, e: any) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  await $.command.run({ command: 'tobebestme', args: 'settings' })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  let text = await shown(ui)
  expect(text).toContain('On autopilot')
  expect(text).toContain('Helpers move to Haiku when context, a limit or a budget gets tight.')
  await ui.press({ key: 'tab-overview' })
  await ui.input({ key: 'run-goal', text: 'Move the API to v2 and update every caller' })
  text = await shown(ui)
  expect(text).toContain('Plan on Opus')
  expect(text).toContain('Best start: after the 5-hour reset')

  await ui.press({ key: 'run-start' })
  expect(writes[0].path).toBe('/Users/me/.claude/skills/long-run/SKILL.md')
  expect(writes[0].text).toContain('name: long-run')
  expect(writes[0].text).toContain('model: "sonnet"')
  expect(filled[0]).toContain('~/.claude/skills/long-run/SKILL.md')
  expect(filled[0]).toContain('Move the API to v2')
  await ui.unmount()
})

// ---- workflows ----------------------------------------------------------------------------

const RUN_ID = 'wf_abc12345-678'
const SCRIPT = `export const meta = {
  name: 'review-changes',
  description: 'Review changed files, then verify each finding',
  phases: [{ title: 'Review' }, { title: 'Verify' }],
}
const files = await agent('list the changed files', { label: 'list', phase: 'Review' })
await parallel(files.map((f) => () => agent('verify ' + f, { label: 'verify:' + f, phase: 'Verify' })))`

// The Workflow tool as the engine answers it once a run is under way, and TaskStop. `asks` plays
// the person at the question dialog ($.ui.ask reaches a test as a call of AskUserQuestion): each
// question is kept and answered with the next of `answers`; 'closed' is a dialog closed unanswered.
type Asks = { questions: any[]; answers: string[]; gate?: Promise<void>; launch?: 'error' | 'remote'; name?: string }
function workflowTool(on: any, stopped: string[] = [], asks: Asks = { questions: [], answers: [] }) {
  on('tool.call', async (_$: unknown, e: any) => {
    if (e.tool === 'AskUserQuestion') {
      const q = e.questions[0]
      asks.questions.push(q)
      if (asks.gate) await asks.gate // the person takes their time
      const answer = asks.answers.shift()
      if (answer === undefined || answer === 'closed') return { deny: 'The person closed the question.' }
      return { result: { questions: e.questions, answers: { [q.question]: answer } }, text: 'answered' }
    }
    if (e.tool === 'TaskStop') {
      stopped.push(e.task_id)
      return { result: {}, text: 'stopped' }
    }
    if (e.tool !== 'Workflow') return { result: {}, text: '' }
    if (asks.launch === 'error') return { result: {}, text: 'Error: the script has a syntax error', isError: true }
    if (asks.launch === 'remote') return { result: { status: 'remote_launched' }, text: 'Workflow launched in a cloud session' }
    return {
      result: { status: 'async_launched', taskId: 'task9', taskType: 'workflow', workflowName: asks.name || 'review-changes', runId: RUN_ID, summary: 'Review changed files', transcriptDir: '/Users/me/.claude/projects/-p/s1/subagents/workflows/' + RUN_ID },
      text: 'Workflow launched in background. Task ID: task9\nSummary: Review changed files',
    }
  })
}

// Processes: a held agent waits a moment in `sleep` (a few milliseconds here), and any other command
// (a notifier, say) is recorded and succeeds. `canWait: false` is a computer with no way to wait.
function napStub(on: any, ran: string[][] = [], canWait = true) {
  on('process.run', async (_$: unknown, e: any) => {
    const isNap = e.argv[0] === 'sleep' || e.argv[0] === 'ping'
    if (!isNap) ran.push(e.argv)
    if (isNap && !canWait) return { value: { exitCode: 127, stdout: '', stderr: 'not found', isStdoutTruncated: false, isStderrTruncated: false } }
    if (isNap) await new Promise((go) => setTimeout(go, 4))
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
}

// The bottom of agent.spawn: starts the agent and gives it an id, recording each model asked for.
function workflowSpawns(on: any) {
  const models: Record<number, string | undefined> = {}
  on('agent.spawn', (_$: unknown, e: any) => {
    const i = e.workflow ? e.workflow.agentIndex : 0
    models[i] = e.model
    return { model: e.model ?? 'claude-opus-5-5', agentId: 'ag' + i }
  })
  return models
}

function spawnAgent($: any, index: number, label: string) {
  return $.agent.spawn({ subagentType: 'general-purpose', prompt: 'go', description: label, workflow: { runId: RUN_ID, agentIndex: index } } as any)
}

function agentDone($: any, index: number) {
  return $.turn.complete({ answer: 'ok', durationMs: 60_000, isAborted: false, turnId: 't', reason: 'answer', usage: USAGE, agentId: 'ag' + index } as any)
}

const settle = () => new Promise((go) => setTimeout(go, 20))
// Waits (up to a second) for something that happens in the background, such as a notification going out.
const until = async (done: () => unknown) => {
  for (let i = 0; i < 50 && !done(); i++) await new Promise((go) => setTimeout(go, 20))
}

test('Ask me first asks in the chat and waits for the answer: Run on Sonnet puts its agents on Sonnet, Don’t run, a typed answer and a closed question refuse it', { options: { workflowCheck: 'ask' } }, async ($, on) => {
  const { toasts } = stubs(on)
  const asks: Asks = { questions: [], answers: [] }
  workflowTool(on, [], asks)
  const models = workflowSpawns(on)

  asks.answers.push('Run on Sonnet')
  const r: any = await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  expect(r.deny).toBeUndefined()
  expect(asks.questions[0].header).toBe('Workflow')
  expect(asks.questions[0].question).toContain('Claude wants to run “review-changes”')
  expect(asks.questions[0].question).toContain('2 stages: Review → Verify')
  expect(asks.questions[0].options.map((o: any) => o.label)).toEqual(['Run workflow', 'Run on Sonnet', 'Don’t run'])
  expect(toasts.some((t) => t.includes('review-changes is running'))).toBe(true)
  await spawnAgent($, 1, 'list')
  expect(models[1]).toBe('sonnet')

  // while the question waits, the pane says what is asked and has no buttons to answer with
  let answerNow: () => void = () => {}
  asks.gate = new Promise<void>((go) => (answerNow = go))
  asks.answers.push('Run workflow')
  const waiting = $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await settle()
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('Claude wants to run “review-changes”')
  expect(text).toContain('Answer in the chat: Run workflow, Run on Sonnet or Don’t run.')
  const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props.label)
  expect(labels).not.toContain('Run workflow')
  expect(labels).not.toContain('Don’t run')
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: true, maxRows: 10, bandColumns: 120, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('Claude wants to run a workflow')
  await band.unmount()
  await ui.unmount()
  answerNow()
  expect(((await waiting) as any).deny).toBeUndefined()
  asks.gate = undefined

  asks.answers.push('Don’t run')
  expect(((await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)) as any).deny).toContain('chose not to run this workflow')
  asks.answers.push('Wait until I have read it')
  expect(((await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)) as any).deny).toContain('Wait until I have read it')
  asks.answers.push('closed')
  expect(((await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)) as any).deny).toContain('closed the question')
})

test('a running workflow shows each agent and what it is doing; pause holds new agents, a limit spreads them out, and stop asks first', async ($, on) => {
  const { toasts } = stubs(on)
  const stopped: string[] = []
  workflowTool(on, stopped)
  napStub(on)
  const models = workflowSpawns(on)
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'verify:a.ts')
  await $.tool.call({ tool: 'Edit', file_path: '/Users/me/p/src/c.ts', old_string: 'a', new_string: 'b', agentId: 'ag1' } as any)

  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  let text = await shown(ui)
  expect(text).toContain('One workflow is running')
  expect(text).toContain('review-changes')
  expect(text).toContain('verify:a.ts')
  expect(text).toContain('Editing c.ts')
  expect(text).toContain('0 of 1 agent done')

  // paused: a new agent waits, and says why, until you resume
  await ui.press({ key: 'flow-pause-0' })
  let started = false
  const second = spawnAgent($, 2, 'verify:b.ts').then(() => (started = true))
  await settle()
  expect(started).toBe(false)
  expect(await shown(ui)).toContain('waiting: the run is paused')
  await ui.press({ key: 'flow-pause-0' })
  await second
  expect(started).toBe(true)

  // at most one at a time: a third waits for one to finish
  await ui.press({ key: 'flow-cap-0-1' })
  let third = false
  const t3 = spawnAgent($, 3, 'verify:c.ts').then(() => (third = true))
  await settle()
  expect(third).toBe(false)
  expect(await shown(ui)).toContain('waiting: at the run’s limit')
  await agentDone($, 1)
  await agentDone($, 2)
  await t3
  expect(third).toBe(true)

  // no limit again, and the rest on Sonnet
  await ui.press({ key: 'flow-cap-0-0' })
  await ui.press({ key: 'flow-model-0-sonnet' })
  await spawnAgent($, 4, 'verify:d.ts')
  expect(models[4]).toBe('sonnet')
  expect(models[1]).toBeUndefined()

  // stop asks first, then stops the task
  await ui.press({ key: 'flow-stop-0' })
  text = await shown(ui)
  expect(text).toContain('Stop “review-changes”?')
  expect(stopped).toEqual([])
  await ui.press({ key: 'flow-stop-go' })
  expect(stopped).toEqual(['task9'])
  expect(toasts.some((t) => t.startsWith('Stopping review-changes'))).toBe(true)
  expect(await shown(ui)).toContain('Stopping')

  // the line above the prompt follows it
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: true, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('review-changes is stopping')
  await band.unmount()

  // Home says it is running, with where it got to
  await ui.press({ key: 'tab-all' })
  expect(await shown(ui)).toContain('Running now')
  await ui.unmount()

  // and so does the terminal
  const term = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await term.press({ key: 'tab-workflows' })
  expect(await shown(term)).toContain('review-changes')
  await term.unmount()
})

// Finished runs boiled down, as the store keeps them: a Verify stage fanned out on Opus, one item
// per agent; a long fix agent; and a stage that waited on one slow agent.
function digest(over: any = {}) {
  return {
    runId: 'wf_1', name: 'portfolio-review', status: 'completed', startedAt: NOW - 3 * 86_400_000, durationMs: 3_600_000, model: 'claude-opus-5-5', agents: 60, costed: 60, usd: 120, doneUsd: 120, doneAgents: 60, unnamed: 0, sid: 's1', project: 'portfolio',
    stages: [
      { title: 'Verify', agents: 40, usd: 40, bigUsd: 40, asSonnet: 22, fableUsd: 0, asOpus: 0, minUsd: 0.6, medUsd: 1, medMs: 120_000, maxMs: 30 * 60_000, slowest: 'verify:big.ts' },
      { title: 'Fix', agents: 2, usd: 60, bigUsd: 60, asSonnet: 33, fableUsd: 0, asOpus: 0, minUsd: 20, medUsd: 40, medMs: 900_000, maxMs: 1_200_000, slowest: 'fix:pr' },
    ],
    long: [{ label: 'fix:pr', usd: 40, readUsd: 24, steps: 300 }],
    ...over,
  }
}

test('Workflows says how to spend less, from every project’s finished runs, and turns an idea into a rule after you read it', async ($, on) => {
  const { toasts, store } = stubs(on)
  store['runs:v1'] = { wf_1: digest(), wf_2: digest({ runId: 'wf_2', name: 'docs-check', startedAt: NOW - 86_400_000 }), wf_old: digest({ runId: 'wf_old', startedAt: NOW - 60 * 86_400_000 }) }
  const filled: string[] = []
  on('prompt.fill', (_$: unknown, e: any) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'flow-refresh' })
  await ui.press({ key: 'tab-workflows' }) // a test's ui.invalidate draws nothing; a view change does
  let text = await shown(ui)
  expect(text).toContain('No workflows running')
  expect(text).toContain('$240 on 2 workflow runs in the last 30 days') // the run from 60 days ago is left out
  expect(text).toContain('Costliest runs')
  expect(text).toContain('Ways to spend less')
  expect(text).toContain('Run checking stages on Sonnet')
  expect(text).toContain('Would have saved about $28.80–$36.00') // Verify: $40 on Opus, $22 on Sonnet, twice; Sonnet may take more steps
  expect(text).toContain('Could save')
  expect(text).toContain('Give each agent a few items, not one')
  expect(text).toContain('Split the longest agents into smaller jobs')
  expect(text).toContain('fix:pr in portfolio-review cost $40.00 over 300 steps')
  expect(text).toContain('Split the job a stage waits on')
  expect(text).not.toContain('Fix started 5 or more') // a judgement stage keeps Opus
  expect(text).toContain('How workflows work')
  expect(text).toContain('Check each workflow before it runs')

  await ui.press({ key: 'flow-save-0-rule' })
  expect(filled[0]).toContain('~/.claude/CLAUDE.md')
  expect(filled[0]).toContain("model: 'sonnet'")
  expect(filled[0]).toContain('Show me the exact change before you save it.')
  expect(toasts.some((t) => t.includes('Claude shows the change'))).toBe(true)

  await ui.press({ key: 'flow-save-0-hide' })
  await ui.press({ key: 'tab-workflows' })
  text = await shown(ui)
  expect(text).not.toContain('Run checking stages on Sonnet')
  expect((await ui.findAll({ type: 'Button' })).some((b: any) => b.props.label === 'Show 1 set-aside idea')).toBe(true)
  await ui.press({ key: 'flow-save-shown' })
  await ui.press({ key: 'tab-workflows' })
  expect(await shown(ui)).toContain('Run checking stages on Sonnet')
  await ui.unmount()
})

test('a cheaper model that fails once is not called missing: it answers a check, and only failing again here stops routing in this session, for half an hour', { options: { mode: 'always', cheapModel: 'sonnet' } }, async ($, on) => {
  const { toasts, store, clock } = stubs(on)
  let checks = 0
  on('model.complete', () => {
    checks++
    return { value: { isAnswered: true, text: 'ok', usage: USAGE } }
  })
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    // this session refuses the cheaper model (a mode that keeps one model), though the account has it
    if (e.model === 'sonnet') return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: null, usage: null }
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  const step = async (index: number) => {
    for await (const _ of $.turn.step({ turnId: 't', index, model: 'claude-opus-5-5', messageCount: 3 })) {
      // no chunks
    }
  }
  await step(0)
  expect(sent).toEqual(['sonnet', 'claude-opus-5-5']) // the turn still gets its answer
  expect(checks).toBe(1)
  expect(store['cheap:missing']).toBeUndefined()
  expect(toasts.some((t) => t.includes("isn't available on your account"))).toBe(false)
  await step(1)
  expect(sent.slice(2)).toEqual(['sonnet', 'claude-opus-5-5'])
  expect(checks).toBe(1) // checked once, not on every failure
  await step(2)
  expect(sent.slice(4)).toEqual(['claude-opus-5-5']) // routing stopped in this session only
  expect(store['cheap:missing']).toBeUndefined()
  clock.now += 31 * 60_000 // half an hour on, it is tried again
  await step(3)
  expect(sent.slice(5, 6)).toEqual(['sonnet'])
})

test('when the usual model fails too, the connection is down: the cheaper model is not blamed and routing carries on', { options: { mode: 'always', cheapModel: 'sonnet' } }, async ($, on) => {
  stubs(on)
  let checks = 0
  on('model.complete', () => {
    checks++
    return { value: { isAnswered: true, text: 'ok', usage: USAGE } }
  })
  const sent: string[] = []
  let isDown = true
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    if (isDown) return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: null, usage: null }
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  const step = async (index: number) => {
    for await (const _ of $.turn.step({ turnId: 't', index, model: 'claude-opus-5-5', messageCount: 3 })) {
      // no chunks
    }
  }
  await step(0)
  await step(1)
  await step(2)
  expect(checks).toBe(0) // nothing to check: neither model answered
  isDown = false
  await step(3)
  expect(sent[sent.length - 1]).toBe('sonnet') // still routed
})

test('a model marked missing a day ago is tried again', { options: { mode: 'always' } }, async ($, on) => {
  const { store } = stubs(on)
  store['cheap:missing'] = { model: 'haiku', at: NOW - 2 * 86_400_000 }
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', messageCount: 3 })) {
    // no chunks
  }
  expect(sent).toEqual(['haiku'])
})

test('a request that looks like a workflow job is suggested as one, with a shape that names its models, and starts as a request to read first', async ($, on) => {
  const { toasts } = stubs(on)
  const filled: string[] = []
  on('prompt.fill', (_$: unknown, e: any) => {
    filled.push(e.text)
    return { isFilled: true }
  })
  on('prompt.submit', (_$: unknown, e: any) => ({ text: e.text }))
  await $.prompt.submit({ text: 'Please review all the changes on this branch before I open the pull request tomorrow' } as any)
  expect(toasts.some((t) => t.startsWith('This could be a workflow: review changes'))).toBe(true)

  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).toContain('This could be a workflow: review changes')
  await band.unmount()

  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const text = await shown(ui)
  expect(text).toContain('A workflow could do this')
  expect(text).toContain('Review changes')
  expect(text).toContain('Review')
  expect(text).toContain(' on Sonnet')
  expect(text).toContain(' on Opus')
  await ui.press({ key: 'suggest-0' })
  expect(filled[0]).toContain('Use a workflow for this: Please review all the changes')
  expect(filled[0]).toContain('Name a model on every agent() call')
  expect(filled[0]).toContain('Show me the plan')
  await ui.press({ key: 'suggest-0-skip' })
  await ui.press({ key: 'tab-workflows' })
  expect(await shown(ui)).not.toContain('A workflow could do this')
  await ui.unmount()

  // a small request, or one that already asks for a workflow, gets no suggestion
  toasts.length = 0
  await $.prompt.submit({ text: 'fix the typo in the README' } as any)
  await $.prompt.submit({ text: 'Run a workflow to research the options for speech recognition carefully' } as any)
  expect(toasts.some((t) => t.startsWith('This could be a workflow'))).toBe(false)
})

test('notifications go through every chosen channel, say which worked, and reach a phone through a web address', { options: { notifications: true, notifyUrl: 'https://ntfy.sh/test-topic' } }, async ($, on) => {
  const { toasts } = stubs(on)
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: any) => {
    runs.push(e.argv)
    return { value: { exitCode: e.argv[0] === 'osascript' || e.argv[0] === 'afplay' ? 0 : 1, stdout: '', stderr: '' } }
  })
  const posts: any[] = [] // ui.notify answers with the terminal bell (stubs)
  on('http.fetch', (_$: unknown, e: any) => {
    posts.push(e)
    return { value: { status: 200, ok: true, headers: {}, text: '' } }
  })
  await $.command.run({ command: 'tobebestme', args: 'settings' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  let text = await shown(ui)
  expect(text).toContain('Notifications')
  expect(text).toContain('Claude Code’s own notifications show words only in iTerm2, Kitty and Ghostty')
  await ui.press({ key: 'notify-test' })
  const osa = runs.find((a) => a[0] === 'osascript')!
  expect(osa.slice(-2)).toEqual(['ToBeBestMe', 'A test notification. If you can read this, notifications reach you.']) // words as arguments, never in the script
  expect(runs.some((a) => a[0] === 'afplay')).toBe(true)
  expect(posts[0].url).toBe('https://ntfy.sh/test-topic')
  expect(toasts.some((t) => t.includes('Claude Code: bell') && t.includes('System: sent') && t.includes('Phone: sent'))).toBe(true)
  await ui.press({ key: 'tab-settings' })
  text = await shown(ui)
  expect(text).toContain('Bell only: this terminal shows no words')
  // a web address that isn't https is refused
  await ui.press({ key: 'notify-url-edit' })
  await ui.input({ key: 'notify-url', text: 'http://example.com/hook' })
  expect(toasts.some((t) => t.includes('isn’t an https address'))).toBe(true)
  await ui.unmount()
})

test('a workflow that ends is noticed with the pane closed: the band says so and a notification goes out', { options: { notifications: true, notifyVia: 'system' } }, async ($, on) => {
  const { toasts } = stubs(on)
  effects(on)
  workflowTool(on)
  workflowSpawns(on)
  const runs: string[][] = []
  on('process.run', (_$: unknown, e: any) => {
    runs.push(e.argv)
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  // the run's record appears once it ends; the watcher looks every few seconds
  let isEnded = false
  on('clock.sleep', () => {
    isEnded = true
    return { value: undefined }
  })
  on('fs.list', () => ({ value: [] }))
  on('fs.read', (_$: unknown, e: any) => {
    if (isEnded && String(e.path).endsWith('/workflows/' + RUN_ID + '.json')) return { value: JSON.stringify({ runId: RUN_ID, status: 'completed', summary: 'Review changed files', durationMs: 5000, totalTokens: 1000, workflowProgress: [] }) }
    throw new Error('ENOENT')
  })
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await settle()
  await settle()
  expect(toasts).toContain('Workflow review-changes finished.')
  expect(runs.some((argv) => argv[0] === 'osascript' && argv.join(' ').includes('review-changes finished'))).toBe(true)
  const band = await $.ui.mount({ plugin: 'tobebestme', component: 'AbovePrompt', surface: 'terminal', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} } } as any)
  expect(await shown(band)).not.toContain('review-changes is running')
  await band.unmount()
})

test('a phone notification with words outside ASCII sends them as an encoded header', { options: { notifications: true, notifyVia: 'system', notifySound: false, notifyUrl: 'https://ntfy.sh/test-topic' } }, async ($, on) => {
  const { toasts, store } = stubs(on)
  napStub(on)
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  workflowTool(on, [], { questions: [], answers: [], name: 'Résumé “review”' })
  workflowSpawns(on)
  const posts: any[] = []
  on('http.fetch', (_$: unknown, e: any) => {
    posts.push(e)
    return { value: { status: 200, ok: true, headers: {}, text: '' } }
  })
  on('fs.list', () => ({ value: [] }))
  let isEnded = false
  on('fs.read', (_$: unknown, e: any) => {
    if (isEnded && String(e.path).endsWith('/workflows/' + RUN_ID + '.json')) return { value: JSON.stringify({ runId: RUN_ID, status: 'completed', summary: 'Done', durationMs: 5000, totalTokens: 1000, workflowProgress: [] }) }
    throw new Error('ENOENT')
  })
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  isEnded = true
  await completeTurn($, USAGE)
  await until(() => posts.length)
  expect(toasts).toContain('Workflow Résumé “review” finished.')
  const title: string = posts[0].init.headers.Title
  expect(title).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/)
  const bytes = Uint8Array.from(atob(title.slice(10, -2)), (c) => c.charCodeAt(0))
  expect(new TextDecoder().decode(bytes)).toBe('Workflow Résumé “review” finished.')
  expect(store['notify:sent:ended:' + RUN_ID + ':1']).toBeDefined()
})

test('a notification goes out once on this computer: a limit another session already announced stays a toast here, and the pace warning is sent exactly once', { options: { notifications: true, notifyVia: 'system', notifySound: false } }, async ($, on) => {
  const weekly = { kind: 'seven_day', percentUsed: 85, resetsAt: '2026-10-25T21:00:00Z' }
  const { toasts, store } = stubs(on, { ...LOW(), rateLimits: [weekly] })
  const ran: string[][] = []
  napStub(on, ran)
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  // another session on this computer already sent the weekly-limit notice for this window
  store['notify:sent:limit:seven_day:' + weekly.resetsAt] = { at: NOW - 60_000, by: 'other-session' }
  await $.command.run({ command: 'tobebestme', args: '' })
  await completeTurn($, USAGE)
  await settle()
  const said = (text: string) => ran.filter((a) => a[0] === 'osascript' && a.join(' ').includes(text))
  expect(toasts.some((t) => t.startsWith('Weekly limit is at 85%'))).toBe(true)
  expect(said('Weekly limit is at 85%')).toEqual([])
  // the pace warning for the same window was not sent before: it goes out, once, however many turns follow
  expect(said('At your pace')).toHaveLength(1)
  expect(said('At your pace')[0].slice(-3, -1)).toEqual(['--', 'ToBeBestMe']) // the words follow --, so a title starting with a dash is still a title
  await completeTurn($, USAGE)
  await settle()
  expect(said('At your pace')).toHaveLength(1)
  expect(store['notify:sent:pace:seven_day:' + weekly.resetsAt]).toMatchObject({ by: expect.any(String) })
})

test('with no other session in the way, the same limit notifies once; and at most four notifications go out in any ten minutes, across every session', { options: { notifications: true, notifyVia: 'system', notifySound: false } }, async ($, on) => {
  const limits = [
    { kind: 'five_hour', percentUsed: 92, resetsAt: '2026-10-24T20:00:00Z' },
    { kind: 'seven_day', percentUsed: 85, resetsAt: '2026-10-25T21:00:00Z' },
  ]
  const { store } = stubs(on, { ...LOW(), rateLimits: limits })
  const ran: string[][] = []
  napStub(on, ran)
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  // three notifications went out in the last ten minutes already (other sessions): one more may
  for (const i of [1, 2, 3]) store['notify:sent:x' + i] = { at: NOW - 60_000, by: 'other-session' }
  // older ones are not in the last ten minutes, and a week-old one is cleared as it is met
  for (const i of [4, 5, 6, 7, 8]) store['notify:sent:x' + i] = { at: NOW - 30 * 60_000, by: 'other-session' }
  store['notify:sent:old'] = { at: NOW - 9 * 86_400_000, by: 'other-session' }
  await $.command.run({ command: 'tobebestme', args: '' })
  await completeTurn($, USAGE)
  await settle()
  const sentNow = ran.filter((a) => a[0] === 'osascript')
  expect(sentNow).toHaveLength(1)
  // each notice that did go has a store key of its own, so none overwrote another
  const keys = Object.keys(store).filter((k) => k.startsWith('notify:sent:') && !/^notify:sent:x\d$/.test(k))
  expect(keys).toHaveLength(1)
  expect(store['notify:sent:old']).toBeUndefined()
})

test('a run that reaches its spending limit holds new agents until the limit is raised; a stopped run starts no more', { options: { workflowBudget: 1 } }, async ($, on) => {
  const { toasts } = stubs(on)
  const stopped: string[] = []
  workflowTool(on, stopped)
  napStub(on)
  workflowSpawns(on)
  on('turn.step', async function* (_$: unknown, e: any) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: { input_tokens: 100_000, output_tokens: 20_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, model: 'claude-opus-5-5' } }
  })
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'verify:a.ts')
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'claude-opus-5-5', messageCount: 3, agentId: 'ag1' } as any)) {
    // $0.80 of Opus
  }
  for await (const _ of $.turn.step({ turnId: 't', index: 1, model: 'claude-opus-5-5', messageCount: 3, agentId: 'ag1' } as any)) {
    // past $1
  }
  expect(toasts.some((t) => t.includes('reached its $1.00 limit'))).toBe(true)
  let started = false
  const second = spawnAgent($, 2, 'verify:b.ts').then(() => (started = true))
  await settle()
  expect(started).toBe(false)
  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  let text = await shown(ui)
  expect(text).toContain('Paused at its $1.00 limit')
  expect(text).toContain('waiting: the run reached its spending limit')
  await ui.press({ key: 'flow-raise-0' })
  await second
  expect(started).toBe(true)

  // stopped: an agent asked for afterwards is turned away
  await ui.press({ key: 'flow-stop-0' })
  await ui.press({ key: 'flow-stop-go' })
  const r: any = await spawnAgent($, 3, 'verify:c.ts')
  expect(r.deny).toContain('stopped from ToBeBestMe')
  await ui.unmount()
})

test('where nothing can wait, a paused run refuses its new agents and a run at its cap starts them', async ($, on) => {
  stubs(on)
  workflowTool(on)
  napStub(on, [], false)
  const models = workflowSpawns(on)
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'flow-pause-0' })
  const refused: any = await spawnAgent($, 1, 'verify:a.ts')
  expect(refused.deny).toContain('holding new agents for this workflow (you paused it)')
  expect(1 in models).toBe(false) // never reached the engine
  await ui.press({ key: 'flow-pause-0' })
  // a cap only spreads the agents out: where it can't be kept by waiting, the agents start
  await ui.press({ key: 'flow-cap-0-1' })
  await spawnAgent($, 2, 'verify:b.ts')
  const third: any = await spawnAgent($, 3, 'verify:c.ts')
  expect(third.deny).toBeUndefined()
  expect(third.agentId).toBe('ag3')
  await ui.unmount()
})

test('a run that is stopped and resumed starts clean: not paused, its old record is not its end, and its end is announced once', { options: { notifications: true, notifyVia: 'system', notifySound: false } }, async ($, on) => {
  const { toasts } = stubs(on)
  const ran: string[][] = []
  napStub(on, ran)
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  workflowTool(on)
  const models = workflowSpawns(on)
  const disk: { record: string } = { record: '' }
  on('fs.list', () => ({ value: [] }))
  on('fs.read', (_$: unknown, e: any) => {
    if (disk.record && String(e.path).endsWith('/workflows/' + RUN_ID + '.json')) return { value: disk.record }
    throw new Error('ENOENT')
  })
  const record = (status: string, durationMs: number) => JSON.stringify({ runId: RUN_ID, status, summary: 'Review changed files', startTime: NOW - 600_000, durationMs, totalTokens: 1000, workflowProgress: [] })

  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'list')
  await $.command.run({ command: 'tobebestme', args: 'workflows' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'flow-stop-0' })
  await ui.press({ key: 'flow-stop-go' })
  // it ends stopped; two answers at once to the same end still say it once
  disk.record = record('killed', 60_000)
  await Promise.all([completeTurn($, USAGE), completeTurn($, USAGE)])
  expect(toasts.filter((t) => t === 'Workflow review-changes was stopped.')).toHaveLength(1)
  expect(ran.filter((a) => a[0] === 'osascript' && a.join(' ').includes('review-changes was stopped'))).toHaveLength(1)

  // resumed: the same run id again. The record of the attempt before is still on disk and is not its end
  await $.tool.call({ tool: 'Workflow', script: SCRIPT, resumeFromRunId: RUN_ID } as any)
  await completeTurn($, USAGE)
  expect(toasts.filter((t) => t === 'Workflow review-changes finished.')).toHaveLength(0)
  expect(toasts.filter((t) => t === 'Workflow review-changes failed.')).toHaveLength(0)
  expect(await shown(ui)).toContain('One workflow is running')
  // its agents start at once: nothing carried over the pause the stop left
  let started = false
  const next = spawnAgent($, 2, 'verify:b.ts').then((r: any) => (started = !r.deny))
  await settle()
  expect(started).toBe(true)
  await next
  expect(2 in models).toBe(true)
  // and the end of this attempt is announced, once more
  disk.record = record('completed', 90_000)
  await completeTurn($, USAGE)
  expect(toasts.filter((t) => t === 'Workflow review-changes finished.')).toHaveLength(1)
  expect(ran.filter((a) => a[0] === 'osascript' && a.join(' ').includes('review-changes finished'))).toHaveLength(1)
  await ui.unmount()
})

test('a model chosen for a run’s agents is not routed away, and a Workflow call that failed or ran elsewhere is not a reply that changed', { options: { workflowCheck: 'ask', mode: 'always', cheapModel: 'haiku' } }, async ($, on) => {
  const { toasts } = stubs(on)
  const asks: Asks = { questions: [], answers: ['Run on Sonnet'] }
  workflowTool(on, [], asks)
  workflowSpawns(on)
  napStub(on)
  const sent: string[] = []
  on('turn.step', async function* (_$: unknown, e: any) {
    sent.push(e.model)
    return { turnId: e.turnId, index: e.index, answer: 'done', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'list')
  for await (const _ of $.turn.step({ turnId: 't', index: 0, model: 'sonnet', messageCount: 3, agentId: 'ag1' } as any)) {
    // no chunks
  }
  expect(sent).toEqual(['sonnet']) // Always mode sends helpers to Haiku; the person's Run on Sonnet stands

  // a Workflow call that errored started nothing; one that ran in the cloud has no folder here
  const before = toasts.length
  asks.launch = 'error'
  asks.answers.push('Run workflow')
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  asks.launch = 'remote'
  asks.answers.push('Run workflow')
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  expect(toasts.slice(before).some((t) => t.includes('follow it'))).toBe(false)
})

test('Show details lays every hover card out in place, and Settings says what could be read', async ($, on) => {
  stubs(on)
  transcripts(on, WEEK)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'usage-refresh' })
  await ui.press({ key: 'details' })
  const text = await shown(ui)
  expect(text).toContain('What today’s answers would cost at list prices, helpers and workflow agents included.')
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).not.toContain('"scope":"tip-all-tile-0"') // no hover card when the words are in place
  await ui.press({ key: 'tab-settings' })
  expect(await shown(ui)).toContain('What ToBeBestMe reads')
  expect(await shown(ui)).toContain('Claude Code’s records')
  await ui.unmount()
})

// ---- every button, every tab --------------------------------------------------------------

// Answers for every effect a press can have, so a failure the crawl finds is the mod's own.
function effects(on: any) {
  on('prompt.fill', () => ({ isFilled: true }))
  on('ui.copy', () => ({ value: { isCopied: true } }))
  on('model.complete', () => ({ value: { isAnswered: true, text: '---\nname: run-tests\ndescription: Run the tests.\n---\n\n1. Run them.', usage: USAGE } }))
  on('fs.write', () => ({ value: undefined }))
  on('fs.exists', () => ({ value: false }))
  on('model.fork', () => ({ value: { isAnswered: true, text: '## Goal\nShip it.', usage: USAGE } }))
  on('session.compact', () => ({ value: { isCompacted: true, tokensBefore: 170_000, tokensAfter: 20_000 } }))
  on('turn.complete', (_$: unknown, e: any) => ({ text: e.answer, usage: e.usage }))
  on('http.fetch', () => ({ value: { status: 200, ok: true, headers: {}, text: '' } }))
}

const TAB_KEYS = ['all', 'workflows', 'overview', 'usage', 'skills', 'settings']

// Presses every button on every tab, then types into every field, on both surfaces, and returns
// each press a hook failed on. A press that opens a confirmation is cancelled again.
async function crawl($: any) {
  const problems: string[] = []
  let presses = 0
  const keysOf = async (ui: any) => (await ui.findAll({ type: 'Button' })).map((b: any) => b.props.key).filter(Boolean)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...PANE, surface })
    for (const tab of TAB_KEYS) {
      await ui.press({ key: 'tab-' + tab })
      for (const key of (await keysOf(ui)).filter((k: string) => !k.startsWith('tab-'))) {
        try {
          await ui.press({ key: 'tab-' + tab })
          if (!(await keysOf(ui)).includes(key)) continue // drawn only in another state
          await ui.press({ key })
          presses += 1
          await ui.drawn()
          for (const close of ['confirm-cancel', 'reply-cancel', 'notify-url-cancel']) if ((await keysOf(ui)).includes(close)) await ui.press({ key: close })
        } catch (err) {
          problems.push(surface + ' › ' + tab + ' › ' + key + ': ' + String(err).split('\n')[0].slice(0, 200))
        }
      }
      for (const input of await ui.findAll({ type: 'Input' })) {
        try {
          await ui.input({ key: input.props.key, text: 'test' })
          presses += 1
        } catch (err) {
          problems.push(surface + ' › ' + tab + ' › input ' + input.props.key + ': ' + String(err).split('\n')[0].slice(0, 200))
        }
      }
    }
    await ui.unmount()
  }
  return { problems, presses }
}

test('every button on every tab answers, on both surfaces, in an empty session', { timeoutMs: 120_000 }, async ($, on) => {
  stubs(on)
  effects(on)
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const { problems, presses } = await crawl($)
  expect(problems).toEqual([])
  expect(presses).toBeGreaterThan(40)
})

test('every button on every tab answers in a busy day: chats waiting, a workflow running, a long session', { timeoutMs: 180_000, options: { notifications: true } }, async ($, on) => {
  const { store } = stubs(on, HIGH())
  effects(on)
  const calls: { tool: string; args: any }[] = []
  waitingDesk(on, calls)
  transcripts(on, WAITING, true, [{ pid: 9, sessionId: 'perm', cwd: '/Users/me/Projects/api', kind: 'interactive', name: 'Release', status: 'waiting', waitingFor: 'permission to run npm publish' }])
  store['runs:v1'] = { wf_1: digest(), wf_2: digest({ runId: 'wf_2', name: 'docs-check', startedAt: NOW - 86_400_000, status: 'killed' }) }
  on('tool.call', (_$: unknown, e: any) => {
    if (e.tool === 'TaskStop') return { result: {}, text: 'stopped' }
    if (e.tool !== 'Workflow') return { result: {}, text: '' }
    return { result: { status: 'async_launched', taskId: 'task9', workflowName: 'review-changes', runId: RUN_ID, summary: 'Review', transcriptDir: '/Users/me/.claude/projects/-p/s1/subagents/workflows/' + RUN_ID }, text: '' }
  })
  workflowSpawns(on)
  await $.tool.call({ tool: 'Workflow', script: SCRIPT } as any)
  await spawnAgent($, 1, 'verify:a.ts')
  await spawnAgent($, 2, 'verify:b.ts')
  await $.prompt.submit({ text: 'Please review all the changes on this branch before I open the pull request tomorrow' } as any).catch(() => {})
  await $.command.run({ command: 'tobebestme', args: 'home' })
  const warm = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await warm.press({ key: 'usage-refresh' })
  await warm.unmount()
  const { problems, presses } = await crawl($)
  expect(problems).toEqual([])
  expect(presses).toBeGreaterThan(80)
})
