// A real Claude Code session in a pseudo-terminal, read through a headless xterm: what a person
// sees in their terminal, as lines of text, and as HTML for a screenshot.

import { spawn } from 'node:child_process'
import { cpSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import xterm from '@xterm/headless'
import serialize from '@xterm/addon-serialize'

const { Terminal } = xterm
const { SerializeAddon } = serialize
const PTY = `
import fcntl, os, pty, select, struct, sys, termios
cols, rows, argv = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3:]
pid, fd = pty.fork()
if pid == 0:
    fcntl.ioctl(0, termios.TIOCSWINSZ, struct.pack('HHHH', rows, cols, 0, 0))
    os.execvp(argv[0], argv)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', rows, cols, 0, 0))
ins = [fd, 0]
while True:
    r = select.select(ins, [], [])[0]
    if fd in r:
        try:
            data = os.read(fd, 65536)
        except OSError:
            break
        if not data:
            break
        os.write(1, data)
    if 0 in r:
        data = os.read(0, 65536)
        if data:
            os.write(fd, data)
        else:
            ins = [fd]
_, status = os.waitpid(pid, 0)
sys.exit(os.waitstatus_to_exitcode(status))
`

// The mod as it ships (no e2e or test folders), copied once per run under the system's temp folder,
// for the sessions to load. Its store is still ToBeBestMe's own, shared with the person's copy: a mod's
// store goes by its name. What a terminal test leaves there is little: Claude Code saves no
// transcript for these sessions (they inherit its child-session marker), a session that answered
// nothing writes no spending, and its record of which copy ran it goes when it ends.
const SKIP = new Set(['e2e', 'tests', 'node_modules', '.git', '.out', 'test-results'])
let copied = ''
export function modCopy() {
  if (copied) return copied
  const from = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const to = join(realpathSync(tmpdir()), 'tobebestme-e2e', 'tobebestme')
  rmSync(to, { recursive: true, force: true }) // the copy this function made on an earlier run
  cpSync(from, to, { recursive: true, filter: (src) => !SKIP.has(basename(src)) && !basename(src).startsWith('._') })
  copied = to
  return to
}

export class Session {
  constructor({ args = [], cwd, env = {}, unset = [], cols = 160, rows = 50, claude = process.env.CLAUDE_BIN || 'claude' }) {
    this.term = new Terminal({ cols, rows, scrollback: 5000, allowProposedApi: true })
    this.serializer = new SerializeAddon()
    this.term.loadAddon(this.serializer)
    this.rows = rows
    this.raw = ''
    // Python's pty module gives the program a real terminal of this size (macOS `script` needs one
    // of its own on stdin, which a test runner doesn't have)
    // a test session never sends the person's real notifications
    // and loads the mod from where the test says, over a folder named in the person's own settings
    const pluginDirs = env.CLAUDE_CODE_PLUGIN_DIRS ? { env: { CLAUDE_CODE_PLUGIN_DIRS: env.CLAUDE_CODE_PLUGIN_DIRS } } : {}
    const quiet = ['--settings', JSON.stringify({ ...pluginDirs, pluginConfigs: { 'tobebestme@inline': { options: { notifications: false } } } })]
    this.proc = spawn('python3', ['-I', '-c', PTY, String(cols), String(rows), claude, ...quiet, ...args], { cwd, env: Object.fromEntries(Object.entries({ ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', ...env }).filter(([k]) => !unset.includes(k))) })
    this.proc.stdout.on('data', (d) => {
      this.raw += d.toString('utf8')
      this.term.write(d)
    })
    this.proc.stderr.on('data', (d) => this.term.write(d))
    // the terminal's answers to the program's questions (cursor position, device attributes)
    this.term.onData((d) => this.proc.stdin.writable && this.proc.stdin.write(d))
    this.exited = new Promise((go) => this.proc.on('exit', (code) => go(code)))
  }
  // the lines on screen now
  screen() {
    const b = this.term.buffer.active
    const out = []
    for (let i = b.viewportY; i < b.viewportY + this.rows; i++) out.push(b.getLine(i)?.translateToString(true) ?? '')
    return out.join('\n')
  }
  async waitFor(match, { timeout = 30_000, what = String(match) } = {}) {
    const test = typeof match === 'string' ? (s) => s.includes(match) : (s) => match.test(s)
    const until = Date.now() + timeout
    while (Date.now() < until) {
      await new Promise((go) => setTimeout(go, 150))
      const s = this.screen()
      if (test(s)) return s
    }
    throw new Error('Waited ' + timeout / 1000 + ' s for ' + what + '. The screen:\n' + this.screen())
  }
  // waits until the screen has stopped changing for `quiet` ms
  async settle(quiet = 600, timeout = 10_000) {
    let last = this.screen()
    let since = Date.now()
    const until = Date.now() + timeout
    while (Date.now() < until) {
      await new Promise((go) => setTimeout(go, 100))
      const now = this.screen()
      if (now !== last) {
        last = now
        since = Date.now()
      } else if (Date.now() - since >= quiet) return now
    }
    return last
  }
  send(keys) {
    this.proc.stdin.write(keys)
  }
  // text as a terminal pastes it (bracketed), so a long prompt lands whole and Return sends it
  paste(text) {
    this.proc.stdin.write('\x1b[200~' + text + '\x1b[201~')
  }
  html() {
    return this.serializer.serializeAsHTML({ onlySelection: false, includeGlobalBackground: true })
  }
  async close() {
    if (this.proc.exitCode !== null) return
    this.send('\x03')
    await new Promise((go) => setTimeout(go, 300))
    this.send('\x03')
    const timer = setTimeout(() => this.proc.kill('SIGKILL'), 5000)
    await this.exited
    clearTimeout(timer)
  }
}

// Which of `labels` is drawn unlike the rest: a tab bar draws the open tab in its own colour
// (or inverse, or on a fill) and every other tab alike.
Session.prototype.highlighted = function (labels) {
  const b = this.term.buffer.active
  const cell = b.getNullCell()
  const looks = new Map()
  for (let y = b.viewportY; y < b.viewportY + this.rows; y++) {
    const line = b.getLine(y)
    if (!line) continue
    const text = line.translateToString(false)
    for (const label of labels) {
      const x = text.indexOf(label)
      if (x < 0 || looks.has(label)) continue
      line.getCell(x + Math.floor(label.length / 2), cell)
      looks.set(label, [cell.isInverse(), cell.getFgColorMode(), cell.getFgColor(), cell.getBgColorMode(), cell.getBgColor()].join(','))
    }
  }
  const count = {}
  for (const look of looks.values()) count[look] = (count[look] || 0) + 1
  return [...looks].filter(([, look]) => count[look] === 1 && looks.size > 2).map(([label]) => label)
}
