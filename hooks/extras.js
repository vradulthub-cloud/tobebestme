// tobebestme: the pieces behind the alerts, the status tool, pull requests in Needs you, the weekly
// report card and the phone's lobby. Pure functions: nothing here touches $. DESIGN.md says why each exists.

import {
  FAMILY_HEX,
  MOTION_CSS,
  OTHER_HEX,
  clip,
  cleanText,
  dayKey,
  escapeXml,
  fmtClock,
  fmtShare,
  fmtSpan,
  fmtTokens,
  fmtUsd,
  isEarly,
  kindOfLabel,
  limitLabel,
  limitOutlook,
  modelName,
  paceSentence,
  plural,
  projectHues,
  safeUrl,
} from './lib.js'

// ---- alerts: a sound, and the words ----------------------------------------------------------

let chime = ''

// A short two-note chime (E5 then A5, each fading out) as a 16-bit mono WAV, base64: what $.audio.play
// plays, so the mod ships no sound file and needs no player of its own. Made once, then kept.
export function chimeWav() {
  if (chime) return chime
  const rate = 22_050
  const total = Math.round(rate * 0.8)
  const pcm = new Int16Array(total)
  for (const [freq, start, gain] of [[659.25, 0, 0.34], [880, 0.15, 0.42]]) {
    for (let i = Math.round(start * rate); i < total; i++) {
      const t = i / rate - start
      const env = (1 - Math.exp(-t * 260)) * Math.exp(-t * 6.5)
      const v = (Math.sin(2 * Math.PI * freq * t) + 0.22 * Math.sin(4 * Math.PI * freq * t)) * env * gain
      pcm[i] = Math.max(-32767, Math.min(32767, pcm[i] + Math.round(v * 32767)))
    }
  }
  const bytes = new Uint8Array(44 + total * 2)
  const view = new DataView(bytes.buffer)
  const ascii = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + total * 2, true)
  ascii(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, total * 2, true)
  for (let i = 0; i < total; i++) view.setInt16(44 + i * 2, pcm[i], true)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 4096) bin += String.fromCharCode(...bytes.subarray(i, i + 4096))
  chime = btoa(bin)
  return chime
}

// What a chat that starts waiting on you says, by what it waits for. `kind`: ask (a permission, a
// question or a dialog), idle (it finished and waits for your next message). Words only: never the
// command or the file, so what goes to a phone or a shared screen stays plain.
export function waitAlert(kind, { project = '', tool = '' } = {}) {
  const where = cleanText(project, 40)
  if (kind === 'idle') return { title: (where || 'Claude') + ' is waiting', text: 'Claude finished and is waiting for your next message.', say: (where ? where + ' is' : 'Claude is') + ' waiting for you' }
  const what = tool === 'AskUserQuestion' ? 'has a question for you' : tool ? 'needs your OK to use ' + cleanText(tool, 40).replace(/^mcp__/, '').replace(/__/g, ' ') : 'needs your OK'
  return { title: (where || 'Claude') + ' needs you', text: 'Claude ' + what + '.', say: (where ? where + ' ' : 'Claude ') + (tool === 'AskUserQuestion' ? 'has a question' : 'needs your OK') }
}

// ---- the dim suggestion in the prompt box ----------------------------------------------------

export const SUGGEST_COMPACT = '/compact Keep the goal, the decisions made and the exact next steps'
export const SUGGEST_HANDOFF = '/tobebestme-handoff'

// Whether a suggestion fits now, and which: once a usage limit passes its alert, a handoff note so
// work resumes after the reset; near the point where context should be made smaller, the compaction
// that keeps the plan. `done` holds what was offered already ({ context: true, limit: { kind: window } }),
// so each is offered once per crossing and once per window. Returns { kind, tag, window, text } or null.
export function nextPrompt({ pct = 0, warnAt = 60, limits = [], alertAt = 80, done = { context: false, limit: {} } } = {}) {
  const l = limits.filter((x) => x.pct >= alertAt && done.limit[x.kind] !== (x.resetsAt || 'none')).sort((a, z) => z.pct - a.pct)[0]
  if (l) return { kind: 'limit', tag: l.kind, window: l.resetsAt || 'none', text: SUGGEST_HANDOFF }
  if (warnAt > 0 && pct >= warnAt && !done.context) return { kind: 'context', tag: 'context', window: '', text: SUGGEST_COMPACT }
  return null
}

// ---- the status tool Claude can call ---------------------------------------------------------

export const STATUS_TOOL = 'status'
export const STATUS_TOOL_DESCRIPTION =
  "Where the person's Claude Code limits, costs, context and waiting chats stand right now, from ToBeBestMe's own readings on their computer. Call it when they ask how much of their usage limit is left, when it resets or runs out, what this session or today has cost, how full the context is or when it will compact, which chats or pull requests are waiting for them, or whether a workflow is running. Read-only: it changes nothing and sends nothing. Optional topic narrows the answer."
export const STATUS_TOPICS = ['all', 'limits', 'context', 'cost', 'waiting', 'workflows']
export const STATUS_SCHEMA = {
  type: 'object',
  properties: { topic: { type: 'string', enum: STATUS_TOPICS, description: 'Which part to answer: limits, context, cost, waiting (chats and pull requests), workflows, or all (the default).' } },
  additionalProperties: false,
}

function kindWords(kind) {
  return { permission: 'needs permission', ask: 'waiting for an answer', question: 'asked a question', plan: 'has a plan to approve', error: 'stopped', pr: 'pull request open' }[kind] || 'waiting'
}

// A compact, accurate answer to "where do I stand", from the mod's own data `d` (see gather). `data`
// holds the same figures for a caller that wants numbers rather than words.
export function statusReport(d, topic = 'all') {
  const t = STATUS_TOPICS.includes(topic) ? topic : 'all'
  const want = (x) => t === 'all' || t === x
  const lines = ['ToBeBestMe status, ' + fmtClock(d.now, d.now) + ':']
  const data = {}
  if (want('limits')) {
    const windows = (d.plan && d.plan.windows) || []
    const rows = d.limits.length
      ? d.limits.map((l) => ({ label: limitLabel(l.r.kind), pct: Math.round(l.r.percentUsed), resetsAt: l.o.resetAt, runsOutAt: l.o.fullAt, note: paceSentence(l, d.now) }))
      : windows.map((w) => ({ label: w.label, pct: Math.round(w.pct), resetsAt: w.resetsAt || null, runsOutAt: null, note: '' }))
    rows.sort((a, z) => Number(kindOfLabel(a.label) === 'five_hour') - Number(kindOfLabel(z.label) === 'five_hour') || z.pct - a.pct) // weekly limits first
    data.limits = rows
    if (rows.length) {
      lines.push('Usage limits:')
      for (const r of rows) lines.push('- ' + r.label + ': ' + r.pct + '% used' + (r.resetsAt ? ', resets ' + fmtClock(r.resetsAt, d.now) : '') + '. ' + (/^It resets /.test(r.note) ? '' : r.note))
    } else lines.push('Usage limits: none reported yet (an API key has none; a plan shows them after the first answer).')
  }
  if (want('context')) {
    const b = d.breakdown
    const at = b && b.isAutoCompactEnabled && typeof b.autoCompactThreshold === 'number' ? b.autoCompactThreshold : 0
    data.context = { percent: d.pct, tokens: d.tokens, window: d.window, compactsAt: at || null }
    lines.push('Context: ' + d.pct + '% full (' + fmtTokens(d.tokens) + ' of ' + fmtTokens(d.window) + ' tokens)' + (at ? '; Claude Code compacts at ' + fmtTokens(at) + ', ' + fmtTokens(Math.max(0, at - d.tokens)) + ' away' : '') + '.')
  }
  if (want('cost')) {
    const sh = d.share
    const w = (usd) => fmtUsd(usd) + (sh ? ' (about ' + fmtShare(usd * sh.pctPerUsd) + ' of the weekly limit)' : '')
    data.cost = { sessionUsd: d.usd, todayUsd: d.today, turns: d.turns.length }
    lines.push('Cost (list-price equivalent): this session ' + w(d.usd) + ' over ' + plural(d.turns.length, 'turn', 'turns') + '; today across sessions ' + w(d.today) + '.')
    if (d.opts.sessionBudget > 0 || d.opts.dailyBudget > 0) lines.push('Budgets: ' + [d.opts.sessionBudget > 0 ? 'session ' + fmtUsd(d.usd) + ' of ' + fmtUsd(d.opts.sessionBudget) : '', d.opts.dailyBudget > 0 ? 'daily ' + fmtUsd(d.today) + ' of ' + fmtUsd(d.opts.dailyBudget) : ''].filter(Boolean).join('; ') + '.')
    const u = d.usage
    if (u && !u.isEmpty) lines.push('Past 7 days, every project: ' + fmtUsd(u.week.usd) + ' across ' + plural(u.week.projects, 'project', 'projects') + (u.projects[0] ? '; busiest ' + u.projects[0].name : '') + '.')
  }
  if (want('waiting')) {
    const needs = (d.waiting && d.waiting.needs) || []
    data.waiting = needs.slice(0, 10).map((x) => ({ title: x.title, project: x.project, kind: x.kind, text: clip(x.text || '', 160), url: x.prUrl || '' }))
    const chats = needs.filter((x) => x.kind !== 'pr')
    const prs = needs.filter((x) => x.kind === 'pr')
    if (!needs.length) lines.push('Waiting for the person: nothing.')
    else {
      lines.push('Waiting for the person: ' + [chats.length ? plural(chats.length, 'chat', 'chats') : '', prs.length ? plural(prs.length, 'pull request', 'pull requests') : ''].filter(Boolean).join(' and ') + '.')
      for (const x of needs.slice(0, 6)) lines.push('- ' + (x.project ? x.project + ': ' : '') + clip(x.title, 70) + ', ' + (x.pr ? x.pr.label.toLowerCase() : kindWords(x.kind)) + (x.pr && x.prNumber ? ' (#' + x.prNumber + ')' : '') + '.')
      if (needs.length > 6) lines.push('- and ' + (needs.length - 6) + ' more.')
    }
  }
  if (want('workflows')) {
    const runs = ((d.flows && d.flows.runs) || []).filter((r) => r.status === 'running' || r.status === 'stopping')
    data.workflows = runs.map((r) => ({ name: r.name, status: r.status, agentsDone: r.progress.done, agents: r.progress.total, paused: !!r.paused }))
    lines.push(runs.length ? 'Workflows running: ' + runs.map((r) => r.name + ' (' + r.progress.done + ' of ' + plural(r.progress.total, 'agent', 'agents') + ' done' + (r.paused ? ', paused' : '') + ')').join('; ') + '.' : 'Workflows running: none in this session.')
  }
  if (t === 'all' && d.health && d.health.level !== 'success') lines.push('Advice: ' + d.health.title + '. ' + d.health.detail)
  return { text: lines.join('\n'), data }
}

// ---- pull requests in Needs you (read with gh) ----------------------------------------------

// One shell script, run once per refresh: whether gh is installed and signed in, then for each folder
// (one per git remote) the open pull requests its owner wrote and the ones that asked for their review.
// Only `gh pr list` and `gh auth status` run: read queries, nothing is created, commented on or merged.
export const GH_SH = String.raw`PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin"
command -v gh >/dev/null 2>&1 || { echo '@@MISSING'; exit 0; }
gh auth status >/dev/null 2>&1 || { echo '@@SIGNEDOUT'; exit 0; }
echo '@@OK'
seen=''
for d in "$@"; do
  u=$(git -C "$d" remote get-url origin 2>/dev/null) || continue
  case "$seen" in *"|$u|"*) continue;; esac
  seen="$seen|$u|"
  cd "$d" 2>/dev/null || continue
  printf '@@R\t%s\n' "$d"
  printf '@@M\t'; gh pr list --author '@me' --state open --limit 15 --json number,title,url,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup,headRefName,updatedAt 2>/dev/null | tr -d '\n'; echo
  printf '@@A\t'; gh pr list --search 'review-requested:@me' --state open --limit 15 --json number,title,url,isDraft,author,headRefName,updatedAt 2>/dev/null | tr -d '\n'; echo
done`

// The script's output: { state: 'ok' | 'missing' | 'signedout' | 'error', repos: [{ path, mine, asked }] }.
export function parseGh(stdout) {
  const text = String(stdout || '')
  if (text.includes('@@MISSING')) return { state: 'missing', repos: [] }
  if (text.includes('@@SIGNEDOUT')) return { state: 'signedout', repos: [] }
  if (!text.includes('@@OK')) return { state: 'error', repos: [] }
  const repos = []
  const json = (s) => {
    try {
      const v = JSON.parse(s)
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }
  for (const line of text.split('\n')) {
    const tag = line.slice(0, 3)
    const rest = line.slice(4)
    if (tag === '@@R') repos.push({ path: rest, mine: [], asked: [] })
    else if (tag === '@@M' && repos.length) repos[repos.length - 1].mine = json(rest)
    else if (tag === '@@A' && repos.length) repos[repos.length - 1].asked = json(rest)
  }
  return { state: 'ok', repos }
}

// How a pull request's checks stand, from gh's statusCheckRollup (check runs and commit statuses).
export function checkSummary(rollup) {
  const out = { failed: [], pending: 0, passed: 0, total: 0 }
  for (const c of Array.isArray(rollup) ? rollup : []) {
    const s = String((c && (c.conclusion || c.state || c.status)) || '').toUpperCase()
    out.total++
    if (['FAILURE', 'ERROR', 'TIMED_OUT', 'STARTUP_FAILURE', 'ACTION_REQUIRED'].includes(s)) out.failed.push(cleanText((c && (c.name || c.context)) || 'a check', 60))
    else if (['SUCCESS', 'NEUTRAL', 'SKIPPED', 'CANCELLED', 'STALE'].includes(s)) out.passed++
    else out.pending++
  }
  return out
}

const PR_RANK = { failing: 0, changes: 1, conflicts: 2, review: 3, ready: 4 }

// Pull requests that need the person, as Needs you items: their own with checks failing, changes
// requested, merge conflicts or ready to merge, and the ones that asked for their review. A pull
// request nothing is asked about is left out. `dismissed` holds { key: at } set aside until it changes.
export function prNeeds(parsed, { dismissed = {} } = {}) {
  const items = []
  const seen = new Set()
  const add = (p, repoPath, role) => {
    const url = safeUrl(p && p.url)
    if (!url || seen.has(url + role)) return
    const number = Number(p.number) || 0
    const project = (/github\.com\/[^/]+\/([^/]+)\//.exec(url) || [])[1] || String(repoPath).split('/').filter(Boolean).pop() || ''
    let verdict = null
    if (role === 'mine') {
      const checks = checkSummary(p.statusCheckRollup)
      const decision = String(p.reviewDecision || '').toUpperCase()
      const merge = String(p.mergeStateStatus || '').toUpperCase()
      if (checks.failed.length) verdict = { key: 'failing', label: 'Checks failing', level: 'error', text: plural(checks.failed.length, 'check', 'checks') + ' failing' + (checks.total > checks.failed.length ? ' of ' + checks.total : '') + ': ' + checks.failed.slice(0, 3).join(', ') + (checks.failed.length > 3 ? '…' : '') + '.' }
      else if (decision === 'CHANGES_REQUESTED') verdict = { key: 'changes', label: 'Changes requested', level: 'warning', text: 'A reviewer asked for changes before it can merge.' }
      else if (merge === 'DIRTY') verdict = { key: 'conflicts', label: 'Merge conflicts', level: 'warning', text: 'It conflicts with its base branch and cannot merge until that is fixed.' }
      else if (!p.isDraft && decision === 'APPROVED' && !checks.pending && ['CLEAN', 'HAS_HOOKS', 'UNSTABLE'].includes(merge)) verdict = { key: 'ready', label: 'Ready to merge', level: 'success', text: 'Approved' + (checks.total ? ', and its ' + plural(checks.total, 'check passes', 'checks pass') : '') + '. Nothing stands in the way.' }
    } else if (!p.isDraft) {
      const by = cleanText((p.author && (p.author.login || p.author.name)) || '', 40)
      verdict = { key: 'review', label: 'Review requested', level: 'warning', text: (by ? by + ' asked' : 'You were asked') + ' for your review.' }
    }
    if (!verdict) return
    seen.add(url + role)
    const key = 'gh:' + url
    const at = Date.parse(p.updatedAt) || 0
    if (dismissed[key] && dismissed[key] >= at) return
    items.push({
      key,
      kind: 'pr',
      title: cleanText(p.title || 'Untitled pull request', 200),
      project: cleanText(project, 80),
      text: verdict.text,
      recap: '',
      replies: [],
      at,
      sid: '',
      cwd: repoPath,
      deskId: '',
      entry: '',
      branch: cleanText(p.headRefName || '', 100),
      prUrl: url,
      prNumber: number,
      pr: { key: verdict.key, label: verdict.label, level: verdict.level, role, rank: PR_RANK[verdict.key] },
    })
  }
  for (const r of (parsed && parsed.repos) || []) {
    for (const p of r.mine || []) add(p, r.path, 'mine')
    for (const p of r.asked || []) add(p, r.path, 'review')
  }
  return items.sort((a, z) => a.pr.rank - z.pr.rank || z.at - a.at)
}

// What Settings says about the GitHub reading: whether it worked and, when it did not, why.
export function ghSource(state, items, repos) {
  if (state === 'ok') return { ok: true, detail: plural(items, 'pull request needs', 'pull requests need') + ' you, in ' + plural(repos, 'repository', 'repositories') + ' with a GitHub remote' }
  if (state === 'missing') return { ok: null, detail: 'The GitHub CLI (gh) isn’t installed, so pull requests aren’t shown. Install it from cli.github.com to see them' }
  if (state === 'signedout') return { ok: null, detail: 'gh isn’t signed in, so pull requests aren’t shown. Run “gh auth login” in a terminal' }
  if (state === 'off') return { ok: null, detail: 'Turned off in Settings' }
  return { ok: false, detail: 'gh answered in a way that couldn’t be read; pull requests aren’t shown until it does' }
}

// ---- the weekly report card ------------------------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayOf(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Everything the card says, from the dashboard's data: the past seven days of every project this
// computer ran, by day, project and model, the weekly limit, workflows and the days used.
export function reportData(d, { hideNames = false } = {}) {
  const u = d.usage
  if (!u || u.isEmpty) return null
  const n = u.keys.length
  const from = n - 7
  const keys = u.keys.slice(from)
  const hues = projectHues(u.projects.map((p) => ({ key: p.key, total: p.total })))
  const ranked = u.projects.filter((p) => p.week > 0)
  const top = ranked.slice(0, 4)
  const name = (p, i) => (hideNames ? 'Project ' + (i + 1) : p.name)
  const topKeys = new Set(top.map((p) => p.key))
  const days = keys.map((key, i) => {
    const at = from + i
    const parts = top.map((p, j) => ({ key: p.key, name: name(p, j), hex: hues[p.key] || OTHER_HEX, value: p.days[at] || 0 })).filter((x) => x.value > 0)
    const rest = ranked.filter((p) => !topKeys.has(p.key)).reduce((s, p) => s + (p.days[at] || 0), 0)
    if (rest > 0) parts.push({ key: '', name: 'Other', hex: OTHER_HEX, value: rest })
    return { key, short: DAY_NAMES[dayOf(key).getDay()], total: u.days[at] || 0, parts, isToday: key === dayKey(d.now) }
  })
  const weekTotal = days.reduce((s, x) => s + x.total, 0)
  const used = u.days.map((x) => x > 0)
  let streak = 0
  for (let i = n - 1; i >= 0; i--) {
    if (used[i]) streak++
    else if (i === n - 1) continue // today not started yet: the streak counts to yesterday
    else break
  }
  const activeDays = days.filter((x) => x.total > 0).length
  const families = {}
  for (const [model, usd] of u.models) {
    const f = modelName(model).split(' ')[0]
    if (f) families[f] = (families[f] || 0) + usd
  }
  const modelTotal = Object.values(families).reduce((s, x) => s + x, 0)
  const models = Object.entries(families)
    .sort((a, z) => z[1] - a[1])
    .slice(0, 4)
    .map(([family, usd]) => ({ family, share: modelTotal ? usd / modelTotal : 0, hex: FAMILY_HEX[family] || OTHER_HEX }))
  const pctOf = (x) => (x > 0 && x < 0.01 ? '<1%' : Math.round(x * 100) + '%')
  const weekly = ((d.plan && d.plan.windows) || []).find((w) => /week/i.test(w.label || '') && !/opus|sonnet|fable/i.test(w.label)) || null
  const sh = d.share
  const best = days.reduce((a, x) => (x.total > a.total ? x : a), days[0])
  const end = dayOf(keys[keys.length - 1])
  const start = dayOf(keys[0])
  const month = (x) => x.toLocaleDateString([], { month: 'short' })
  const range = start.getMonth() === end.getMonth() ? month(start) + ' ' + start.getDate() + '–' + end.getDate() + ', ' + end.getFullYear() : month(start) + ' ' + start.getDate() + ' – ' + month(end) + ' ' + end.getDate() + ', ' + end.getFullYear()
  const wf = d.weekFlows || { runs: 0, agents: 0, usd: 0 }
  const ideas = (d.flows && d.flows.savings && d.flows.savings.findings ? d.flows.savings.findings : []).filter((f) => !f.isHidden)
  const ideaUsd = ideas.reduce((s, f) => s + (f.high || 0), 0)
  const extras = []
  if (wf.runs) extras.push({ label: 'Workflows', value: plural(wf.runs, 'run', 'runs'), sub: plural(wf.agents, 'agent', 'agents') })
  if (u.helpersCheap > 0 && u.kinds.helpers > 0) extras.push({ label: 'Helpers on the cheaper model', value: Math.round((u.helpersCheap / u.kinds.helpers) * 100) + '%', sub: 'of helper work' })
  if (ideaUsd >= 5) extras.push({ label: 'Workflow savings found', value: 'up to ' + fmtUsd(ideaUsd), sub: plural(ideas.length, 'idea', 'ideas') })
  if (d.wins && d.wins.compactions) extras.push({ label: 'Compactions', value: String(d.wins.compactions), sub: d.wins.tokensFreed ? fmtTokens(d.wins.tokensFreed) + ' tokens freed' : 'kept chats lean' })
  const money = (usd) => (sh ? 'work worth ' + fmtShare(usd * sh.pctPerUsd) + ' of the limit' : fmtUsd(usd) + ' of work')
  // under the figure: where the weekly limit is headed, not the figure again
  let outlook = ''
  if (weekly) {
    const l = (d.limits || []).find((x) => x.r.kind === 'seven_day')
    const r = l ? l.r : { kind: 'seven_day', percentUsed: weekly.pct, resetsAt: weekly.resetsAt ? new Date(weekly.resetsAt).toISOString() : undefined }
    const o = l ? l.o : limitOutlook(r, null, d.now)
    if (isEarly(r, o)) outlook = 'Runs out ' + fmtClock(o.fullAt, d.now) + ', ' + fmtSpan(o.resetAt - o.fullAt) + ' before it resets'
    else if (o.atReset !== null) outlook = 'On pace for about ' + Math.min(100, Math.round(o.atReset)) + '% by the reset'
    else if (o.resetAt !== null) outlook = 'Resets ' + fmtClock(o.resetAt, d.now)
  }
  const figure = weekly
    ? { text: Math.round(weekly.pct) + '%', label: 'of my weekly limit', isLimit: true, level: weekly.pct >= (d.opts.limitAlertAt || 80) ? 'warning' : 'ok' }
    : sh
      ? { text: fmtShare(sh.pctPerUsd * weekTotal), label: 'of the weekly limit in use', isLimit: false, level: 'ok' }
      : { text: fmtUsd(weekTotal), label: 'of work at list prices', isLimit: false, level: 'ok' }
  return {
    range,
    days,
    weekTotal,
    money,
    outlook,
    pctOf,
    figure,
    projects: top.map((p, i) => ({ name: name(p, i), hex: hues[p.key] || OTHER_HEX, value: p.week, share: weekTotal ? p.week / weekTotal : 0 })),
    projectCount: ranked.length,
    sessions: u.week.sessions,
    models,
    activeDays,
    streak,
    best: best && best.total > 0 ? { short: best.short, total: best.total } : null,
    extras: extras.slice(0, 3),
  }
}

// The few lines that go to the clipboard with the card, short enough for a post.
export function reportSummary(r) {
  const lines = ['My Claude Code week, ' + r.range + ':']
  lines.push('• ' + r.figure.text + ' ' + r.figure.label)
  lines.push('• ' + (r.figure.isLimit ? (r.outlook ? r.outlook + ', across' : 'Work across') : r.money(r.weekTotal) + ' across') + ' ' + plural(r.projectCount, 'project', 'projects') + ' and ' + plural(r.sessions, 'session', 'sessions'))
  lines.push('• Used on ' + r.activeDays + ' of 7 days' + (r.streak >= 2 ? ', a ' + r.streak + '-day streak' : ''))
  if (r.projects.length) lines.push('• Most time in ' + r.projects.slice(0, 3).map((p) => p.name + ' (' + Math.round(p.share * 100) + '%)').join(', '))
  if (r.models.length) lines.push('• ' + r.models.map((m) => m.family + ' ' + r.pctOf(m.share)).join(', '))
  for (const x of r.extras.slice(0, 2)) lines.push('• ' + x.label + ': ' + x.value)
  lines.push('Made with ToBeBestMe')
  return lines.join('\n')
}

// A sentence for the card's alt text.
export function reportAlt(r) {
  return 'Weekly report card for ' + r.range + ': ' + r.figure.text + ' ' + r.figure.label + '; ' + (r.figure.isLimit && r.outlook ? r.outlook : r.money(r.weekTotal)) + ' across ' + plural(r.projectCount, 'project', 'projects') + '; used on ' + r.activeDays + ' of 7 days' + (r.streak >= 2 ? ', a ' + r.streak + '-day streak' : '') + (r.projects[0] ? '; most in ' + r.projects[0].name : '') + '.'
}

export const CARD = { bg: '#0C0C14', panel: '#171722', line: '#2B2B3A', text: '#F5F5F7', sub: '#B8B8C6', mute: '#9C9CAD' }
const SANS = ' font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"'

// The weekly report card: one self-contained image, 240 to 720 px wide (taller as it narrows). The
// figure leads, then the week by day and project, the days used, the top projects and models, and
// what workflows and routing did. It is drawn on its own dark ground, so it reads the same wherever
// it is posted; every word is 4.5:1 on that ground and 11px or larger at the size it is drawn.
// `isAnimated` adds the pane's entrance (settled by settleMotion); the saved file is still.
export function svgReportCard(r, { width = 720, isAnimated = false } = {}) {
  const W = Math.max(240, Math.min(720, Math.round(width)))
  const pad = W >= 560 ? 36 : 22
  const inner = W - pad * 2
  const wide = W >= 560
  const parts = []
  const t = (x, y, size, str, o = {}) =>
    '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + size + '" fill="' + (o.fill || CARD.text) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.num ? ' style="font-variant-numeric:tabular-nums"' : '') + SANS + '>' + escapeXml(str) + '</text>'
  let y = pad
  parts.push('<circle cx="' + (pad + 7) + '" cy="' + (y + 9) + '" r="7" fill="url(#rcg)"/>')
  parts.push(t(pad + 22, y + 14, 14, 'ToBeBestMe', { weight: 600, fill: CARD.sub }))
  parts.push(t(W - pad, y + 14, 13, r.range, { anchor: 'end', fill: CARD.mute, num: true }))
  y += 44
  parts.push(t(pad, y + 8, wide ? 26 : 22, 'My Claude Code week', { weight: 700 }))
  y += wide ? 24 : 18
  const size = wide ? 112 : 84
  const hot = r.figure.level === 'warning'
  const fig = r.figure.text
  const figW = [...fig].reduce((n, c) => n + (/[0-9]/.test(c) ? 0.6 : c === '%' ? 0.92 : c === '$' ? 0.6 : 0.34) * size, 0)
  parts.push('<g' + (isAnimated ? ' class="mrise"' : '') + '>')
  parts.push('<text x="' + pad + '" y="' + (y + size * 0.86).toFixed(1) + '" font-size="' + size + '" font-weight="800" fill="url(#' + (hot ? 'rch' : 'rcf') + ')" style="font-variant-numeric:tabular-nums;letter-spacing:-0.03em"' + SANS + '>' + escapeXml(fig) + '</text>')
  parts.push('</g>')
  const sideX = pad + figW + 18
  if (W - pad - sideX >= 150) {
    parts.push(t(sideX, y + size * 0.52, 16, r.figure.label, { fill: CARD.text, weight: 600 }))
    parts.push(t(sideX, y + size * 0.52 + 22, 13, r.figure.isLimit && r.outlook ? r.outlook : r.money(r.weekTotal), { fill: CARD.sub, num: true }))
    parts.push(t(sideX, y + size * 0.52 + 42, 13, plural(r.projectCount, 'project', 'projects') + ' · ' + plural(r.sessions, 'session', 'sessions'), { fill: CARD.sub }))
    y += size + 14
  } else {
    y += size + 8
    parts.push(t(pad, y + 12, 16, r.figure.label, { fill: CARD.text, weight: 600 }))
    y += 34
    parts.push(t(pad, y, 13, clip((r.figure.isLimit && r.outlook ? r.outlook : r.money(r.weekTotal)) + ' · ' + plural(r.projectCount, 'project', 'projects') + ' · ' + plural(r.sessions, 'session', 'sessions'), Math.floor(inner / 6.6)), { fill: CARD.sub, num: true }))
    y += 18
  }
  y += 14
  const chartH = wide ? 150 : 120
  const labelH = 22
  const slot = inner / 7
  const barW = Math.min(52, slot * 0.62)
  const maxDay = Math.max(1e-9, ...r.days.map((x) => x.total))
  parts.push('<rect x="' + pad + '" y="' + y + '" width="' + inner + '" height="' + (chartH + labelH + 16) + '" rx="16" fill="' + CARD.panel + '"/>')
  const baseline = y + 12 + chartH
  r.days.forEach((day, i) => {
    const cx = pad + slot * i + slot / 2
    const x = cx - barW / 2
    let top = baseline
    const fullH = Math.max(day.total > 0 ? 4 : 0, (day.total / maxDay) * (chartH - 20))
    const scale = day.total > 0 ? fullH / day.total : 0
    day.parts.forEach((p, j) => {
      const h = Math.max(1.5, p.value * scale)
      top -= h
      parts.push('<rect' + (isAnimated ? ' class="mbar" style="animation-delay:' + i * 70 + 'ms"' : '') + ' x="' + x.toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + barW.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (j === day.parts.length - 1 ? 5 : 1) + '" fill="' + p.hex + '"/>')
    })
    if (day.total <= 0) parts.push('<rect x="' + x.toFixed(1) + '" y="' + (baseline - 3) + '" width="' + barW.toFixed(1) + '" height="3" rx="1.5" fill="' + CARD.line + '"/>')
    parts.push(t(cx, baseline + 17, 12, day.isToday && slot >= 56 ? 'Today' : day.short, { anchor: 'middle', fill: day.isToday ? CARD.text : CARD.mute, weight: day.isToday ? 600 : 400 }))
  })
  y += chartH + labelH + 16 + 14
  const tiles = [
    { big: r.activeDays + ' of 7', small: 'days used' },
    { big: r.streak >= 1 ? r.streak + (r.streak === 1 ? ' day' : ' days') : '–', small: 'streak' },
    ...(r.best ? [{ big: r.best.short, small: 'busiest day' }] : []),
    ...r.extras.slice(0, 1).map((x) => ({ big: x.value, small: x.label })),
  ]
  const cols = wide ? Math.min(4, tiles.length) : 2
  const gap = 10
  const tileW = (inner - gap * (cols - 1)) / cols
  const tileH = 58
  tiles.forEach((tile, i) => {
    const cx = pad + (i % cols) * (tileW + gap)
    const cy = y + Math.floor(i / cols) * (tileH + gap)
    parts.push('<rect x="' + cx.toFixed(1) + '" y="' + cy + '" width="' + tileW.toFixed(1) + '" height="' + tileH + '" rx="14" fill="' + CARD.panel + '"/>')
    parts.push(t(cx + 14, cy + 28, wide ? 22 : 20, clip(tile.big, wide ? 14 : 12), { weight: 700, num: true }))
    parts.push(t(cx + 14, cy + 47, 12, clip(tile.small, Math.floor((tileW - 24) / 6.4)), { fill: CARD.sub }))
  })
  y += Math.ceil(tiles.length / cols) * (tileH + gap) + 6
  if (r.projects.length) {
    parts.push(t(pad, y + 14, 14, 'Where the week went', { weight: 600, fill: CARD.sub }))
    y += 26
    const nameW = wide ? 170 : 110
    const barX = pad + nameW
    const barRoom = inner - nameW - 44 - 10
    r.projects.forEach((p, i) => {
      const ry = y + i * 30
      parts.push('<circle cx="' + (pad + 5) + '" cy="' + (ry + 9) + '" r="5" fill="' + p.hex + '"/>')
      parts.push(t(pad + 16, ry + 14, 14, clip(p.name, Math.floor((nameW - 22) / 7.4)), { fill: CARD.text }))
      parts.push('<rect x="' + barX + '" y="' + (ry + 4) + '" width="' + barRoom.toFixed(1) + '" height="10" rx="5" fill="' + CARD.line + '"/>')
      parts.push('<rect' + (isAnimated ? ' class="msw"' : '') + ' x="' + barX + '" y="' + (ry + 4) + '" width="' + Math.max(8, barRoom * p.share).toFixed(1) + '" height="10" rx="5" fill="' + p.hex + '"/>')
      parts.push(t(W - pad, ry + 14, 13, r.pctOf(p.share), { anchor: 'end', fill: CARD.sub, num: true }))
    })
    y += r.projects.length * 30 + 10
  }
  if (r.models.length) {
    parts.push(t(pad, y + 14, 14, 'Models', { weight: 600, fill: CARD.sub }))
    y += 24
    // one continuous rounded bar: every part keeps a visible minimum, the rest share what is left
    const minW = 8
    const gap = 2
    const room = inner - gap * (r.models.length - 1)
    const small = r.models.filter((m) => m.share * room < minW).length
    const bigShare = r.models.reduce((n, m) => n + (m.share * room < minW ? 0 : m.share), 0) || 1
    const widths = r.models.map((m) => (m.share * room < minW ? minW : ((room - small * minW) * m.share) / bigShare))
    parts.push('<clipPath id="rcm"><rect x="' + pad + '" y="' + y + '" width="' + inner.toFixed(1) + '" height="14" rx="7"/></clipPath><g clip-path="url(#rcm)">')
    let x = pad
    r.models.forEach((m, i) => {
      parts.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + widths[i].toFixed(1) + '" height="14" fill="' + m.hex + '"/>')
      x += widths[i] + gap
    })
    parts.push('</g>')
    y += 34
    let lx = pad
    let ly = y
    for (const m of r.models) {
      const label = m.family + ' ' + r.pctOf(m.share)
      const w = 22 + label.length * 7.2
      if (lx + w > W - pad && lx > pad) {
        lx = pad
        ly += 20
      }
      parts.push('<circle cx="' + (lx + 5) + '" cy="' + (ly - 4) + '" r="5" fill="' + m.hex + '"/>')
      parts.push(t(lx + 16, ly, 13, label, { fill: CARD.sub, num: true }))
      lx += w + 8
    }
    y = ly + 22
  }
  for (const x of r.extras.slice(1)) {
    parts.push(t(pad, y + 12, 13, clip(x.label + ': ' + x.value + (x.sub ? ' (' + x.sub + ')' : ''), Math.floor(inner / 6.6)), { fill: CARD.sub }))
    y += 20
  }
  parts.push('<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (y + 8) + '" y2="' + (y + 8) + '" stroke="' + CARD.line + '"/>')
  parts.push(t(pad, y + 30, 12, wide ? 'Made with ToBeBestMe, a dashboard for Claude Code' : 'Made with ToBeBestMe', { fill: CARD.mute }))
  const H = Math.round(y + 30 + pad)
  const defs =
    '<defs><linearGradient id="rcf" x1="0" x2="1"><stop offset="0" stop-color="#6CB8FF"/><stop offset="1" stop-color="#C58BFF"/></linearGradient>' +
    '<linearGradient id="rch" x1="0" x2="1"><stop offset="0" stop-color="#FFB340"/><stop offset="1" stop-color="#FF7A6B"/></linearGradient>' +
    '<linearGradient id="rcg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#6CB8FF"/><stop offset="1" stop-color="#C58BFF"/></linearGradient>' +
    '<radialGradient id="rcb" cx="0.25" cy="0.12" r="0.7"><stop offset="0" stop-color="#6CB8FF" stop-opacity="0.16"/><stop offset="1" stop-color="#6CB8FF" stop-opacity="0"/></radialGradient></defs>'
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" data-poster="' + CARD.bg + '">' +
    (isAnimated ? MOTION_CSS : '') +
    defs +
    '<rect width="' + W + '" height="' + H + '" rx="26" fill="' + CARD.bg + '"/><rect width="' + W + '" height="' + H + '" rx="26" fill="url(#rcb)"/>' +
    parts.join('') +
    '</svg>'
  )
}

// A report card's file name, without its extension: report-card-YYYY-MM-DD-HHMM.
export function cardName(stamp) {
  return 'report-card-' + stamp.slice(0, 10) + '-' + stamp.slice(11).replace(':', '')
}

// Ways to turn the saved SVG into a PNG with what a computer may already have, in order: each is
// [argv, the file it writes]. None is installed by this mod; the first that works wins.
export function pngTries(svgPath, pngPath, dir) {
  return [
    [['rsvg-convert', '-w', '1440', '-o', pngPath, svgPath], pngPath],
    [['magick', '-background', 'none', '-density', '192', svgPath, pngPath], pngPath],
    [['inkscape', svgPath, '--export-type=png', '--export-width=1440', '--export-filename=' + pngPath], pngPath],
    [['qlmanage', '-t', '-s', '1440', '-o', dir, svgPath], svgPath + '.png'],
  ]
}

// ---- the phone's lobby -----------------------------------------------------------------------

// What the lobby holds, from the dashboard's data: what waits, the tightest limit with its run-out,
// and what runs. A short list for a small screen.
export function lobbyData(d) {
  const all = (d.waiting && d.waiting.needs) || []
  const chats = all.filter((x) => x.kind !== 'pr').length
  const windows = ((d.plan && d.plan.windows) || []).filter((w) => Number.isFinite(w.pct))
  const lim = d.limits.map((l) => ({ label: limitLabel(l.r.kind), pct: l.r.percentUsed, kind: l.r.kind, resetsAt: l.o.resetAt, fullAt: l.o.fullAt, early: l.o.fullAt !== null && l.o.resetAt !== null && l.o.fullAt < l.o.resetAt }))
  const from = lim.length ? lim : windows.map((w) => ({ label: w.label, pct: w.pct, kind: kindOfLabel(w.label), resetsAt: w.resetsAt || null, fullAt: null, early: false }))
  // the weekly limits lead; any other kind a session still reports comes after them
  const weeklyFirst = (x) => (x.kind === 'five_hour' ? 1 : 0)
  const tight = [...from].sort((a, z) => weeklyFirst(a) - weeklyFirst(z) || z.pct - a.pct)[0] || null
  const runs = ((d.flows && d.flows.runs) || []).filter((r) => r.status === 'running' || r.status === 'stopping').slice(0, 3)
  return { needs: all.slice(0, 4), more: Math.max(0, all.length - 4), chats, prs: all.length - chats, tight, runs }
}
