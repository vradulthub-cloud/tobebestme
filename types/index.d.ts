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

export type BudgetHandoff = { at: string | null; reason: string | null; text: string | null; isSurfaced: boolean }

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
  base: string // the whole file as it was read, checked again before writing
  next: string // the whole file as it will be written
  done: string // what the toast says once it is written
  adopt: string // a saving idea counted as adopted once written
}

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
  project?: string // a project picked from the calendar's legend, by key, or '' for every project
}

// A workflow run in this session: what it is for, its controls, and each agent by its place.
export type BudgetFlowAgent = { index: number; label: string; state: string; model: string; phase: string; agentId?: string; requests: number; input: number; output: number; usd: number; queuedAt?: number; startedAt?: number; endedAt?: number; ms?: number; heldFor?: string; error?: string }
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
  cap: number
  budget?: number
  model: string
  transcriptDir: string
  tokens?: number
  toolCalls?: number
  agents: Record<string, BudgetFlowAgent>
}
export type BudgetFlows = { runs: Record<string, BudgetFlowRun> }

// A model chosen for this session from the dashboard; '' leaves routing to the settings.
export type BudgetOverride = { main: string; helpers: string }

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
      flows: BudgetFlows
      change: BudgetChange
    }
  }
}
