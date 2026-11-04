// The shell and awk programs behind every cost, week and "waiting" figure, run for real. The test kit cannot
// start a process, so it replays what the programs are believed to print; this file runs them on a small
// transcript and holds their output to the JavaScript reader that stands in for them where no shell runs.
// Run it with `node --test tests/scan.test.mjs` (CI runs it on Linux and macOS, whose awks differ).

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { PROMPTS_AWK, PROMPTS_SH, SCAN_AWK, SCAN_SH, parsePromptIdeas, parseScan, parseTranscript } from '../hooks/lib.js'

const line = (x) => JSON.stringify(x)
const usage = (input, output, read, write) => ({ input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: write })
// An answer as Claude Code writes it: the message (and its usage) before the time, folder and branch.
const answer = (id, at, model, u, extra = {}, content = []) =>
  line({ type: 'assistant', message: { model, id, content, usage: u }, timestamp: at, cwd: '/Users/me/app', gitBranch: 'main', entrypoint: 'cli', ...extra })
const human = (text, at) => line({ parentUuid: null, type: 'user', message: { role: 'user', content: text }, origin: { kind: 'human' }, timestamp: at })

const TRANSCRIPT = [
  human('<command-name>/deploy</command-name> to staging', '2026-10-23T09:59:00.000Z'),
  answer('msg_1', '2026-10-23T10:01:00.000Z', 'claude-opus-5-5', usage(1000, 200, 30000, 4000)),
  // one answer written as two lines (a block each) counts once, by its message id
  answer('msg_2', '2026-10-23T10:04:00.000Z', 'claude-opus-5-5', usage(500, 100, 20000, 0)),
  answer('msg_2', '2026-10-23T10:04:01.000Z', 'claude-opus-5-5', usage(500, 100, 20000, 0)),
  answer('msg_3', '2026-10-23T10:12:00.000Z', 'claude-sonnet-5-5', usage(300, 50, 9000, 0), {}, [{ type: 'tool_use', id: 'tu1', name: 'Skill', input: { skill: 'pdf' } }]),
  line({ type: 'custom-title', customTitle: 'Ship the pricing page' }),
  line({ type: 'last-prompt', lastPrompt: 'make the pricing page match the new brand' }),
  line({ type: 'pr-link', prNumber: 42, prUrl: 'https://github.com/me/app/pull/42' }),
  answer('msg_4', '2026-10-23T10:15:00.000Z', 'claude-opus-5-5', usage(10, 20, 30, 40), {}, [{ type: 'tool_use', id: 'tu2', name: 'AskUserQuestion', input: { questions: [{ question: 'Which plan does it show?' }] } }]),
].join('\n')

function run(program, awk, files) {
  return execFileSync('sh', ['-c', program, awk, ...files], { encoding: 'utf8', maxBuffer: 1 << 24 })
}

function withTranscripts(texts, check) {
  const dir = mkdtempSync(join(tmpdir(), 'tobebestme-scan-'))
  try {
    const files = texts.map((text, i) => {
      const path = join(dir, 'chat' + i + '.jsonl')
      writeFileSync(path, text + '\n')
      return path
    })
    return check(files)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('the search prints, per ten-minute slot and model, the sums the JavaScript reader would', () => {
  withTranscripts([TRANSCRIPT], (files) => {
    const out = run(SCAN_SH, SCAN_AWK, files)
    const s = out.split('\n').filter((l) => l.startsWith('S\t'))
    // slot 2026-10-23T10:0 holds msg_1 and msg_2 once; 10:1 holds the Sonnet answer and the question
    assert.ok(s.includes('S\t0\t2026-10-23T10:0\tclaude-opus-5-5\t1500\t300\t50000\t4000\t0\t2'), s.join('\n'))
    assert.ok(s.includes('S\t0\t2026-10-23T10:1\tclaude-sonnet-5-5\t300\t50\t9000\t0\t0\t1'), s.join('\n'))
    assert.ok(s.includes('S\t0\t2026-10-23T10:1\tclaude-opus-5-5\t10\t20\t30\t40\t0\t1'), s.join('\n'))
    assert.equal(s.length, 3)

    const found = parseScan(out)[0]
    const read = parseTranscript(TRANSCRIPT)
    assert.deepEqual(found.days, read.days)
    assert.deepEqual(found.hours, read.hours)
    assert.equal(found.cwd, '/Users/me/app')
    assert.equal(found.last, read.last)
    assert.deepEqual(found.skills, read.skills)
    assert.deepEqual(found.meta, read.meta)
    // what the chat was about and what it waits for
    assert.equal(found.meta.t, 'Ship the pricing page')
    assert.equal(found.meta.n, 42)
    assert.equal(found.meta.w.k, 'question')
    assert.equal(found.meta.w.t, 'Which plan does it show?')
    // /deploy typed once; pdf run by Claude once
    assert.deepEqual(Object.keys(found.skills).sort(), ['deploy', 'pdf'])
    assert.deepEqual(found.skills.deploy.slice(0, 2), [1, 0])
    assert.deepEqual(found.skills.pdf.slice(0, 2), [0, 1])
  })
})

test('several files are told apart by their place in the list, and a missing file is skipped', () => {
  withTranscripts([TRANSCRIPT, answer('msg_9', '2026-10-24T08:00:00.000Z', 'claude-haiku-4-5', usage(7, 8, 9, 10))], (files) => {
    const found = parseScan(run(SCAN_SH, SCAN_AWK, [files[0], files[1].replace('chat1', 'gone'), files[1]]))
    assert.deepEqual(Object.keys(found[0].days).length, 1)
    assert.equal(found[1], undefined)
    assert.deepEqual(Object.values(found[2].days)[0]['claude-haiku-4-5'], [7, 8, 9, 10, 0, 1])
  })
})

test('a line quoted inside a message is not an answer, and a tool result is not counted', () => {
  const quoted = answer('msg_q', '2026-10-23T11:00:00.000Z', 'claude-opus-5-5', usage(1, 2, 3, 4), {}, [{ type: 'text', text: 'the log said {"usage":{"input_tokens":999999}}' }])
  const result = answer('msg_r', '2026-10-23T11:05:00.000Z', 'claude-opus-5-5', usage(5000, 5000, 5000, 5000), { toolUseResult: { ok: true } })
  withTranscripts([[quoted, result].join('\n')], (files) => {
    const day = Object.values(parseScan(run(SCAN_SH, SCAN_AWK, files))[0].days)[0]
    assert.deepEqual(day['claude-opus-5-5'].slice(0, 4), [1, 2, 3, 4])
  })
})

test('a limit error stops the chat on "error" until a real answer follows', () => {
  const error = line({ type: 'assistant', isApiErrorMessage: true, quotaLimits: { resetsAt: 1792000000 }, message: { model: '<synthetic>', id: 'msg_e', content: [{ type: 'text', text: 'Weekly limit reached' }], usage: usage(0, 0, 0, 0) }, timestamp: '2026-10-23T12:00:00.000Z', cwd: '/Users/me/app' })
  withTranscripts([[answer('msg_1', '2026-10-23T11:59:00.000Z', 'claude-opus-5-5', usage(1, 1, 1, 1)), error].join('\n'), [answer('msg_1', '2026-10-23T11:59:00.000Z', 'claude-opus-5-5', usage(1, 1, 1, 1)), error, answer('msg_2', '2026-10-23T12:30:00.000Z', 'claude-opus-5-5', usage(2, 2, 2, 2))].join('\n')], (files) => {
    const found = parseScan(run(SCAN_SH, SCAN_AWK, files))
    assert.equal(found[0].meta.w.k, 'error')
    assert.equal(found[0].meta.w.rs, 1792000000 * 1000)
    assert.equal(found[1].meta.w, undefined)
    assert.deepEqual(found[0].meta, parseTranscript(readFileSync(files[0], 'utf8')).meta)
  })
})

test('a prompt typed twice, in two chats, comes back as one idea with both projects', () => {
  const ask = (text, at) => human(text, at)
  const text = 'review the diff for secrets and summarise the risk'
  withTranscripts([[ask(text, '2026-10-20T09:00:00.000Z'), ask('short', '2026-10-20T09:01:00.000Z')].join('\n'), ask(text, '2026-10-21T09:00:00.000Z')], (files) => {
    const ideas = parsePromptIdeas(run(PROMPTS_SH, PROMPTS_AWK, files), [{ project: 'app' }, { project: 'site' }])
    assert.equal(ideas.length, 1)
    assert.equal(ideas[0].times, 2)
    assert.equal(ideas[0].sessions, 2)
    assert.deepEqual(ideas[0].projects.sort(), ['app', 'site'])
    assert.equal(ideas[0].text, text)
  })
})
