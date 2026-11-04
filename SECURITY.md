# Security

## Reporting a problem

Please report a vulnerability privately: on the repository's **Security** tab, choose **Report a vulnerability**. Don't open a public issue. You'll get an answer within a week, and a fix or a plan within 30 days.

## What ToBeBestMe is, and what that means for trust

ToBeBestMe is a mod that runs inside Claude Code itself. It is not a separate app, service, website, command-line tool or account: it changes Claude Code's own interface (a pane beside the chat, a line above the prompt, a tool Claude answers from, alerts through Claude Code's own channel) and runs on your computer with the permissions Claude Code gives a mod. There is no ToBeBestMe server, no sign-up and no API key, and it has no telemetry. The only network call the mod itself makes is the notification address you set yourself. The GitHub CLI, when you have it, talks to GitHub for the read queries listed under Runs, and prompts go to Claude through your own Claude Code account; everything the mod sends is listed below.

## What ToBeBestMe reads, writes, runs and sends

Settings › What ToBeBestMe reads shows each source it reads and whether it could be read. Every use of the mod interface is in `hooks/register.js`, `hooks/lib.js` and `hooks/extras.js`; this table lists all of it.

### Reads

| What | Why |
| --- | --- |
| Claude Code's records in `~/.claude/projects` (transcripts, workflow records, per-agent usage), through `sh`, `grep` and `awk` with fixed scripts, and by reading the files | Usage, costs, chats waiting for you, workflow history |
| `claude agents --json`, and the Claude app's session tools `get_session`, `list_sessions` and `get_usage` (through `$.mcp.call`) where the app provides them. These tools are the desktop app's own: they are not part of the documented mod interface, may change without notice and are not supported by Anthropic | Which chats are working or waiting, and the plan's usage limits (the plan card) |
| Your skill and command files (`~/.claude/skills`, `~/.claude/commands` and the project's `.claude/skills` and `.claude/commands`), including what each declares | The skills check-up |
| Claude Code's settings files: `~/.claude/settings.json`, and the project's `.claude/settings.json` and `.claude/settings.local.json` | The skills check-up takes `skillOverrides` and `skillListingBudgetFraction`. When you press a skill-setting fix, the whole of `~/.claude/settings.json` is read so it can be written back with only that setting changed |
| `~/.claude/CLAUDE.md` | When you press *Make it a rule…*, so the rule can be added and the rest kept |
| A workflow's script file, when Claude names one for a run | The explanation and estimate before the run starts |
| budget-pilot's file in `~/.claude/plugins/store`, once, the first time it starts | What the older version kept, carried over |
| The environment variables `HOME`, `USERPROFILE`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_EXECPATH` and `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Where Claude Code keeps things, and how much room the skill listing has |
| This chat's own messages (`$.session.messages()`), held in memory | Finding the prompts you repeat, for skill ideas. Nothing is sent from them until you press *Suggest more* |
| The text in your prompt box (`$.prompt.read`), held in memory only to check for a draft before putting words in it. Nothing is sent or kept | Making sure a button or a held prompt never writes over what you are typing |
| Claude Code's list of helper agents (`$.agent.list`) | Labeling helpers by their description in workflows and chats |
| Claude Code's own usage snapshot (`$.session.usage()`) | The usage limits and the chat's cost |
| Its own files and its install folder's top-level entries | The daily self-check below |

It never opens `.env` or key files. Claude Code's settings files can hold keys (an `env` block, `apiKeyHelper`): the mod takes the two skill settings from them for its checks, shows nothing else from them, and sends nothing from them anywhere. The one exception is the settings fix above: while it waits for **Save change** or **Cancel**, the whole file's text is held in memory so it can be written back unchanged, and it is dropped afterwards. The same goes for the text of `CLAUDE.md` or a `SKILL.md` while a fix to it is waiting.

### Runs

Each runs on your computer with fixed arguments (paths are passed as arguments, never put into a shell command).

| What | When | Why |
| --- | --- | --- |
| `sh` with `grep` and `awk` over transcripts | Reading Claude Code's records, and finding your repeated prompts for *Suggest more* | Usage, waiting chats, skill ideas |
| `claude agents --json` | In the background | Which chats are running |
| `git rev-parse`, `git status --porcelain` and `git rev-list` (with `wc` and `tr` to count and tidy their output) in the folders of recent chats, with optional locks and `core.fsmonitor` turned off so a repository you never trusted can't make git run a program or rewrite its index | Every two minutes at most | Work left uncommitted or unpushed |
| `gh auth status`, `gh auth token` (its output is thrown away; it only says whether a sign-in is stored), `gh pr list` and `git remote get-url origin`, in up to 8 folders with a GitHub remote | At most every five minutes on the whole computer, only when `gh` is installed and signed in and *Pull requests and CI in Needs you* is on | Your open pull requests that need you. These are read queries on your own account; nothing is created, commented on or merged, and nothing else is sent to GitHub |
| Claude Code's own commands `/clear` (after the handoff note is written), `/mcp`, `/memory`, `/plugin` and `/skills`, through the mod interface's `command.run`. When it can't run one, it puts the command in the prompt box for you | When you press *Start fresh*, or a button that opens one of those screens (Skills, Context, Home) | Starting a clean chat, and opening Claude Code's own screens |
| `sleep` (or `ping` on Windows) for five seconds at a time | While a workflow's new agents are held | A pause that keeps an agent from starting. It is a plain process wait that Claude Code does not meter |
| `rsvg-convert`, `magick`, `inkscape` or `qlmanage`, then `mv -f`, with the paths of the file just saved | When you press *Save report card* | Making the card's PNG |
| `osascript` (macOS) or `notify-send` (Linux), with the words passed as arguments | When Claude Code's own channel shows no words | System notifications |
| `afplay` or `paplay` | Only if the engine's own player can't play the chime | The alert sound |
| The engine's speech (`$.audio.speak`) | Only when *Say alerts aloud* is on, as an alert goes out | A few spoken words: who is waiting and what kind of wait, never the command or the file. Nothing is sent anywhere for it; the engine speaks them on your computer |
| Claude Code's `TaskStop` tool | When you press *Stop workflow…* | Stopping a running workflow |
| Claude Code's own compaction (`$.session.compact`) | When you confirm *Compact now…*, or when *Compact automatically at* is set and context passes it | Freeing context |

### Writes

| What | When | Why |
| --- | --- | --- |
| `.claude/tobebestme/handoff.md` in the project, with a `.gitignore` of `*` beside it (the folder's own `.gitignore` is kept only if it already ignores everything; otherwise it is rewritten) | Before a compaction (Settings › Handoff note before compacting turns it off), or when you press *Start fresh* or run `/tobebestme-handoff`. It is skipped when the chat is nearly full, and for a compaction you did not ask for when the chat has been idle | The handoff note. A reply that does not open with a Goal heading is not saved. It is never written through a symbolic link |
| `~/.claude/tobebestme/reports/` | When you press *Save chat report* or *Save report card* | Reports and report cards (SVG, and PNG when a converter is installed) |
| A skill's own `SKILL.md` or a command's file | Only when you press **Save change** on *Fix description…*. It shows the file as it is now and as it will be, and refuses if the file changed meanwhile | A better description. A skill or command of the project that is a symbolic link, or sits behind one, is refused and never rewritten |
| `~/.claude/settings.json` | Only when you press **Save change** on *Make skills manual-only…* or *Give skills more room…*, with the same check; every other setting is kept as it was | Making room in the skill listing |
| `~/.claude/CLAUDE.md` | Only when you press **Save change** on *Make it a rule…*, with the same check | A workflow rule under ToBeBestMe's heading |
| A new skill under `.claude/skills/<name>/` or `~/.claude/skills/<name>/` | When you press *Save skill*; it refuses to overwrite one that is there | A skill you drafted in the pane, saved with only its name, description and the other plain keys |
| `~/.claude/skills/long-run/SKILL.md` | When you press *Save /long-run and start here* or *Save the playbook as /long-run*; it does nothing if the skill is already there. A copy saved by an earlier version keeps its old text until you press Save again | The long-run playbook as a skill |
| ToBeBestMe's own options, through Claude Code's `$.config.set` into Claude Code's settings | When you change a ToBeBestMe setting in the pane (the same as /config does) | Remembering your settings |
| Claude Code's store for mods: a JSON file of the mod's own under your Claude Code configuration folder (`~/.claude`, or `CLAUDE_CONFIG_DIR`), at most 4 MiB | In the background | Per-chat and per-day costs, usage by project, day and model, workflow digests, and a short record of each chat's last prompt (240 characters), recap (400), question it waits on (300) and reply (400), kept so Home can show what waits across your projects. It also keeps the list of running chats as `claude agents --json` last returned it (`agents:shared`, shared between chats on this computer, up to 200 KB), the prompts you repeat across projects that skill ideas are made from (`ideas:v1`), the pull requests last read (`gh:shared`: a small copy of your open pull requests with their titles, links, branches and check totals, shared between chats on this computer), the plan's limits as last read, the items you set aside or hid, which chat runs which copy of the mod, which alerts were sent in the past week, whether the cheaper model could be used, the last self-check verdict and the habits you've set up. *Read every project* turned off deletes the excerpts, the list of running chats, the repeated prompts and the pull requests, and what was made from them. **Settings › Forget stored data…** deletes every key in the store, spending ledgers included, so the daily budget then counts again from this chat's own figures; your settings and Claude Code's files stay |
| The system clipboard (`$.ui.copy`) | Only when you press a Copy button (*Copy resume command*, *Copy link*, *Copy summary*, *Copy chat summary*, *Copy text summary*, and the like) | The text shown on the button, so you can paste it elsewhere |

### Sends

| What | Where | Why |
| --- | --- | --- |
| Prompts to Claude, through your own Claude Code account. **Fix description…**, **Improve it** and skill drafts go to Sonnet (or your cheaper model if Sonnet refuses). **Suggest more** goes to your cheaper model (Sonnet when you have none) and sends your recent prompts, found across projects, framed as data. A five-token check ("Reply with the word ok.") goes out when a request sent to the cheaper model came back empty, at most once in ten minutes. The handoff note is written by Claude from this conversation before a compaction; its prompt tells Claude to leave out secrets, keys, tokens, passwords and the contents of `.env` or credential files. If Sonnet gives an empty reply, refuses or returns a provider error, the request goes to your cheaper model instead | Claude | Skill ideas, skill drafts, whether the cheaper model is there, handoff notes |
| Lines added to a prompt you send: with *Tell Claude where the budget stands* on (the default), once context passes its warning, a budget is reached, or *Use the cheaper model* is set to Always, the chat's context, cost and limit percentages and what to do about them; and, at the first prompt after a compaction, where the handoff note is | Claude | Keeping Claude's steps small when a limit is close |
| A message to another chat: a suggested reply or *Reply…*, with the exact words shown and a confirm step first; and *Ask it to stop* for a workflow in another chat. Through Claude Code's `SendMessage` tool, or the Claude app's `send_message` where that is not there. Like the app's other session tools, these are not part of the documented mod interface, may change without notice and are not supported by Anthropic | The chat you chose | Answering a waiting chat from Home or your phone |
| *Archive chat…*, after you confirm: the Claude app's `archive_session` | The chat you chose | Tidying idle chats whose pull request is done |
| A notification's title and text, to the web address you set (only `https://`) | That address | Notifications on your phone, if you set one up |
| The status tool's answer, below | The conversation, so Claude | "How much of my week is left?" |

Nothing else leaves your computer. Reading the records sends nothing anywhere.

**Notifications carry words from your chats.** A notification about a waiting chat holds that chat's title and a short excerpt (up to 300 characters) of what it asked or said. It goes to the system notification, to Claude Code's channel and, if you set one, to your web address. **A topic on a public service such as ntfy.sh is not private:** anyone who knows or guesses the topic name can read what is sent to it. Use a long, random topic name, or a service that needs a sign-in or token, and never a name like `your-topic` or your own name. The address setting is marked sensitive in the manifest, and the pane never shows the address again, only its host.

**The status tool.** `mcp__tobebestme__status` is a read-only tool that Claude loads only when it looks for it. Its overview returns your limits, context, costs and running workflows, the name of the busiest project of the past seven days (quoted, as other names are), and only counts of the chats and pull requests waiting on you; Claude can call that without asking you. Its *waiting* topic returns those chats' and pull requests' titles, project names, a short excerpt (up to 160 characters) of what each asked or said, and pull request links, so Claude Code asks you first. An explicit allow rule of your own, or bypass mode, lets it through without a prompt, because you have consented by rule. These go to the conversation, which goes to Claude as any tool result does. Text from other chats and from pull requests is returned as quoted data with a note that it is never instructions, and is cleaned of control and invisible characters first.

**Offers.** A dim suggestion in the prompt box (`/compact …`, `/tobebestme-handoff`) is shown only, never typed or sent for you. *Start fresh* puts one fixed request in the box, and only when it is empty: read the handoff note (as notes, not instructions), say the goal and next steps, and wait for your go-ahead.

### How text from your records is handled

Text from transcripts, other chats, skill files and pull requests is treated as data: cleaned of control, invisible and direction-changing characters, never run, and framed as quoted data (with closing markers that can't be forged) wherever it goes into a prompt or a tool answer. Buttons act in the pane. The only buttons that put words in your prompt box are the ones that hand Claude a job (starting or resuming a workflow, a long run, *Try /name*, the suggested workflow request, *Start fresh*); they never write over a draft you are typing. The one other time words go in the box is the *hold* choice of *When a budget is reached*: once a budget is reached, the prompt that was held is put back (after any draft, never over it) so you can send it once you choose to.

## Verifying an install and a download

Installing from the marketplace (`claude plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`) copies the repository's `main` branch at that moment. It is not pinned to a release, and a copy of `main` is only as trustworthy as the repository and your connection to it. To know exactly what you run, install from a release you have verified.

**A release.** Every release is built by GitHub Actions from a tagged commit that is on `main`, and ships:

- `tobebestme-v<version>.zip`, the plugin, and `tobebestme-v<version>.zip.sha256`, the zip's own SHA-256;
- `SHA256SUMS`, the SHA-256 of every file inside the zip except `SHA256SUMS` itself and `.claude-plugin/integrity.json`, which holds the same hashes;
- build provenance, signed by GitHub, for the zip and `SHA256SUMS`: it names the repository, the workflow, the tag and the exact commit.

To check a download:

```bash
gh attestation verify tobebestme-v<version>.zip --repo vradulthub-cloud/tobebestme
shasum -a 256 -c tobebestme-v<version>.zip.sha256
unzip tobebestme-v<version>.zip -d tobebestme && cd tobebestme
shasum -a 256 -c SHA256SUMS
```

The first line proves GitHub built the zip from this repository's workflow; the second that you have the same bytes; the third that the files inside are the ones listed. Then run it with `claude --plugin-dir ./tobebestme`, or put the folder where Claude Code loads plugins from.

**An installed copy.** In the installed folder (under `~/.claude/plugins/cache/tobebestme/`, or `$CLAUDE_CONFIG_DIR/plugins/cache/...`), `shasum -a 256 -c SHA256SUMS` proves the files match the manifest that came with them. It does not prove they match a release, because a changed copy can carry a changed manifest. To compare against a release, download that release's `SHA256SUMS`, check it with `gh attestation verify SHA256SUMS --repo vradulthub-cloud/tobebestme`, and run `shasum -a 256 -c` with it in the installed folder.

**Releases to avoid.** v1.5.0 has no build provenance (its first run published without it and a second run built a different zip). It is superseded by v1.5.1 and later; don't use it.

**Tags and commits.** Tags and commits are not signed yet. Signing needs a key that only the repository's owner can set up; once it is, release tags will be signed and this page will say so. Until then, what ties a release to its source is the provenance above, which names the commit it was built from.

**The self-check.** ToBeBestMe checks itself once a day against `.claude-plugin/integrity.json` and says the result in Settings › What ToBeBestMe reads ("Matches its own manifest"). That catches a copy that was damaged or changed after install, a module added beside the released ones in `hooks/`, files added where Claude Code would load them (`.mcp.json`, `skills/`, `commands/`, `agents/`) and a manifest that went missing from a copy Claude Code installed. It can't catch a copy whose manifest was changed along with its files; the release's checksums and provenance are what prove a download is genuine. Like any shipped code, ToBeBestMe can be read and changed: these checks make tampering visible, they don't hide the code.

## Tests

`claude plugin test .` runs the mod's behavior tests in Claude Code's own test kit, with no sign-in and no network; `node --test tests/scan.test.mjs` runs the shell and awk readers on a small transcript and holds them to the JavaScript reader. Among the kit's tests:

- one presses every button on every tab, on both surfaces;
- others try the security guards: names from records that could reach an object's prototype (`__proto__`, `constructor`, `toString`, `valueOf`), web addresses that aren't `https://`, notification words passed as arguments where they can't run, text that tries to close its own data frame, links where a skill file is read or written, and the release self-check (a changed file, an added module, a missing manifest).

The `e2e/` suite (see CONTRIBUTING.md) draws every view in Chromium and checks it, and drives real Claude Code sessions in a terminal.
