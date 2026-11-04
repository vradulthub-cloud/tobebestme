// tobebestme's $.state contract: the values hooks/register.js keeps for the session.
// The settings are not here: they are the manifest's userConfig (rows in /config).

export type BudgetSession = { id: string; project: string; cwd: string; lastTurnEndAt: number; desk: string; title: string } // desk: the desktop app's id for this session

export type BudgetModelRow = {
  requests: number
  subagent: number // of those requests, the ones helpers made
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export type BudgetAgentRow = { label: string; type: string; model: string; requests: number; input: number; output: number }

export type BudgetToolRow = { calls: number; errors: number; ms: number; chars: number }

export type BudgetRouting = { rerouted: number; spawnsForced: number; effortLowered: number }

// One main-loop turn: when it ended (ms), its cost, tokens, duration, the pause before it,
// its model, the context size after it, and each usage limit's percentage then.
export type BudgetTurn = {
  at: number
  usd: number
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  ms: number
  idleMs: number
  model: string
  context: number
  limits: Record<string, number>
}

// Where a usage limit's recent pace is measured from; restarts when the window resets.
export type BudgetPace = { since: number; fromPct: number; resetsAt: string | null }

// A usage limit's readings in its current window, for the forecast chart.
export type BudgetLimitHistory = { resetsAt: string | null; samples: { at: number; pct: number }[] }

export type BudgetHandoff = { at: string | null; reason: string | null; text: string | null; isCut?: boolean; isSurfaced: boolean }

// Which alerts have fired, so each fires once per step, window or crossing.
export type BudgetAlerts = {
  costStep: number
  limit: Record<string, string>
  pace: Record<string, string>
  session: boolean
  daily: string
  context: boolean
  routing: boolean
}

export type BudgetActivity = { at: number; level: 'info' | 'success' | 'warning' | 'error'; text: string }

// The session's cost when today began, so "today" counts only today's share.
export type BudgetDay = { date: string; startUsd: number }

export type BudgetWins = { compactions: number; tokensFreed: number; notes?: number; skills?: number }

export type BudgetSkillIdea = { id: string; title: string; detail: string; seed: string; name?: string }

export type BudgetSkill = {
  describe: string
  draft: { name: string; description: string; text: string } | null
  scope: 'project' | 'user'
  ideas: BudgetSkillIdea[]
  saved?: string // the skill saved last from the builder, offered to try
  previous?: { name: string; description: string; text: string } // the draft before Improve it, for Undo
}

// A change the pane makes itself: worked out in the background, shown as now and after, written on Save.
export type BudgetChange = {
  id: string
  tab: string
  title: string
  path: string
  shown: string
  status: '' | 'working' | 'ready' | 'error'
  before: string
  after: string
  note: string
  error: string
  done: string // what the toast says once it is written
  adopt: string // a saving idea counted as adopted once written
  redo: BudgetChangeRedo | null // what the change was made from, for Work it out again (it survives a reload)
}
export type BudgetChangeRedo =
  | { kind: 'skill'; skill: unknown }
  | { kind: 'rule'; finding: unknown; adopt: string }
  | { kind: 'manual'; names: string[] }
  | { kind: 'budget'; fraction: number }

export type BudgetView = {
  tab: string
  confirm: string
  showNote: boolean
  showAllActivity: boolean
  showMore: boolean
  advanced: boolean
  editing: string
  busy: string
  skillFilter: string
  skillShow: 'top' | 'all' | 'unused' | 'plugins' | 'cut'
  runGoal: string
  projectsBy: 'week' | 'today'
  showAllProjects: boolean
  replying: string // the waiting item whose reply field is open
  showAllNeeds: boolean
  showCheckup: boolean
  showAllUsed: boolean
  showAllIdeas?: boolean
  openRun?: string
  showSetAside?: boolean
  showDetails?: boolean
  openNeed?: string
  openPick?: string // the project in Pick up drawn whole, besides the first
  tourStep?: number
  habitsAt?: number
  day?: string // a day of the week picked on Home's calendar ('YYYY-MM-DD'), or '' for the week
  cardHide?: boolean // the weekly report card shows 'Project 1…' instead of project names
  showCard?: boolean // the weekly report card's picture is drawn (it is one row of buttons until then)
  project?: string // a project picked from the calendar's legend, by key, or '' for every project
}

// A workflow run in this session: what it is for, its controls, and each agent by its place.
// `takenAt`: when an agent passed its run's cap check and took a place, until it is working (so agents asking together can't all pass).
export type BudgetFlowAgent = { index: number; label: string; state: string; model: string; phase: string; agentId?: string; requests: number; input: number; output: number; usd: number; queuedAt?: number; startedAt?: number; endedAt?: number; ms?: number; heldFor?: string; error?: string; takenAt?: number }
export type BudgetFlowRun = {
  runId: string
  taskId: string
  name: string
  summary: string
  description: string
  phases: string[]
  estimate: { agents: number; low: number; high: number; basis: number; isFanOut?: boolean } | null
  startedAt: number
  endedAt: number
  status: string
  error: string
  paused: boolean
  pausedFor?: string
  stoppedBy?: string // who stopped the run, when that is known: 'pane' (Stop workflow here) or 'taskstop' (a TaskStop call this session saw); '' when not. A new attempt clears it
  cap: number
  budget?: number
  model: string
  transcriptDir: string
  tokens?: number
  toolCalls?: number
  tips?: string[] // what the go-ahead check noticed about the script (agents with no model named, a fan-out with no cheaper model…)
  attempt?: number // how many times this run id has been launched in this session: 1 the first, more for each resume
  staleRecord?: string // the fingerprint of the record an earlier attempt left, which is not this attempt's end
  agents: Record<string, BudgetFlowAgent>
}
export type BudgetFlows = { runs: Record<string, BudgetFlowRun> }

// A model chosen for this session; '' leaves routing to the settings. Chosen on the dashboard, requests are
// sent there. `picked`: the person switched to it with /model, the picker or an IDE, kept from the moment of
// the switch whatever is routing then; requests are then left as the engine asks (plan mode, a fallback).
export type BudgetOverride = { main: string; helpers: string; picked?: boolean }

// Helpers started on a model that routing leaves be, by agent id: 'person' when the model was chosen here
// (a run's model), 'asked' when Claude or a workflow script named it. A reached budget that switches every
// request moves the asked ones too.
export type BudgetPinned = Record<string, 'person' | 'asked'>

declare module 'claude-code' {
  interface PluginState {
    'tobebestme': {
      session: BudgetSession
      models: Record<string, BudgetModelRow>
      agents: Record<string, BudgetAgentRow>
      tools: Record<string, BudgetToolRow>
      routing: BudgetRouting
      turnCostAt: number
      turns: BudgetTurn[]
      pace: Record<string, BudgetPace>
      limitHistory: Record<string, BudgetLimitHistory>
      handoff: BudgetHandoff
      alerts: BudgetAlerts
      activity: BudgetActivity[]
      day: BudgetDay
      wins: BudgetWins
      skill: BudgetSkill
      skillUse: Record<string, number>
      view: BudgetView
      override: BudgetOverride
      pinned: BudgetPinned
      flows: BudgetFlows
      change: BudgetChange
    }
  }
}
