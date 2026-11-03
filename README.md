<img src="assets/icon.png" width="88" alt="">

# ToBeBestMe

**See what's waiting for you, what your week has left, and what every workflow is doing, across all your Claude Code projects.**

A mod for Claude Code: a pane beside the chat in the desktop app and the terminal, and a line above the prompt in every session. It is for people who keep several projects going at once, on a Pro or Max plan or an API key, and want to stop losing track of which chat asked a question, when a limit will run out, and what a workflow is about to cost.

![Home in the ToBeBestMe pane. The week's use is drawn by project, a day is picked out, then a project. Sample data.](assets/demo.gif)

```
/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme
```

[Landing page](https://tobebestme.vercel.app) · [What it reads and sends](SECURITY.md) · [Why it exists](DESIGN.md) · [Changelog](CHANGELOG.md)

It tracks the three budgets every session spends, and none of them is in view while you work:

- **Usage limits:** the weekly limit on Claude plans, and a model's own weekly limit where there is one.
- **Money:** what each request costs on an API key or team billing.
- **Context:** the conversation Claude re-reads on every turn. As it grows, each turn costs more.

## What you get

Type `/tobebestme` to open the pane. It has six tabs; keys 1 to 6 switch between them in the terminal. Screenshots show sample data.

### Home: the week, and what needs you

![The week on Home: 82% of the weekly limit, each day's work stacked by project, the line of use, the dashed projection to the run-out, and the hours without Claude before the reset.](assets/home-week.png)

Home reads Claude Code's own records for every project on the computer, including sessions that never ran ToBeBestMe.

- **One drawing of the week.** The weekly figure and a forecast sentence, each day's work by project, the line of use so far, the dashed line to where the limit runs out, and the hours you would be without Claude before it resets. Press a day or a project to pick it out; the rest step back and a line says what it held.
- **Needs you.** Every chat that stopped for you in the last week, most pressing first: a permission prompt, a question, a plan to approve, a usage limit, a pull request waiting. The most urgent is a card of its own. In the desktop app a suggested reply shows the whole message and asks before it sends; **Reply…** takes your own words. Elsewhere, **Copy resume command** carries the chat on in a terminal.
- **Pick up where you left off.** The latest session in each project, with its last message, branch, pull request and loose ends such as *3 files changed, not committed*.
- **What stands out.** Up to three plain observations. A saving is drawn before you act on it: the week as run, against the week with the idea applied.
- **Pull requests, from GitHub.** When the GitHub CLI (`gh`) is installed and signed in, your open pull requests that need you join Needs you: review requested, changes requested, checks failing, merge conflicts, and ready to merge, each with a button to open it and one to copy its link. They are read in the background at most every five minutes. With no `gh`, or not signed in, nothing is shown and Settings › What ToBeBestMe reads says why.
- **Projects, open sessions and running workflows.**

![Needs you on Home: a permission prompt as a card, then waiting chats with their reply buttons.](assets/home-needs-you.png)

![What stands out on Home: the week as run against the week with half the work on Sonnet.](assets/home-saves.png)

### The weekly report card

On Usage, the week as one image to post: the weekly figure, each day by project, days used and your streak, top projects, models, workflows and savings. **Save report card** writes an SVG to `~/.claude/tobebestme/reports/` (and a PNG when `rsvg-convert`, ImageMagick, Inkscape or macOS Quick Look is there) and copies a few lines of text to paste with it. **Hide project names** swaps them for Project 1, 2, 3 first. Nothing is uploaded.

### On your phone

Attach a phone and the mod draws a short lobby in the mobile app: what is waiting for you (with the replies the chat itself suggested, each confirmed before it is sent), the limit that binds first and when it runs out, and what is running. The app has no text field yet, so replies are the suggested buttons.

### Workflows

A workflow is a script Claude writes to split a big job across many agents. One run can start hundreds of agents and go for hours.

![Workflows: a running review with its stages, each agent, and the controls beside them.](assets/workflows.png)

- **Before it starts:** what the run is, its stages, how many agents it starts, a likely cost range from your own finished runs, and anything worth changing. With **Check each workflow before it runs** set to **Ask me first**, Claude waits for your go-ahead.
- **While it runs:** every agent and what it is doing this moment, its model and cost. **Pause new agents**, **Agents at once**, **Model for new agents** and **Stop workflow…** act on agents that have not started; finished work is kept.
- **Afterwards:** the costliest runs, and ways to spend less, each with what it would have saved on your last 30 days of runs.

![Ways to spend less on Workflows: as run against with the ideas applied.](assets/workflows-savings.png)

**Make it a rule…** shows the line it would add to your user CLAUDE.md, as it is now and as it will be, and writes it when you press **Save change**.

### This session

Whether this conversation will make it: its cost, and the context window as a runway with a post where Claude Code compacts, a ghost for the next turns at the recent pace, and a bar per turn. Under it, ways to save, the right model for the job, a planner for long runs, what fills the context, and what is always loaded (MCP servers, memory files, skills).

![This session: context at 85% of the window, compaction about one turn away, and the weekly limits.](assets/session.png)

### Usage

Where each limit is heading and where the week went: the forecast with the readings taken, each day by project, projects and models as split bars, then each limit's window, this session's turns, budgets, and **Copy summary** or **Save report** for a standup or a chat.

![Usage: the weekly forecast, each day by project, and the split by project and model.](assets/usage.png)

### Skills

Claude picks a skill from a listing of names and descriptions sent with every request. The listing has room for about 1% of the context window; past that, skills go to Claude as a bare name it cannot match to a request, and nothing says so. The tab shows whether Claude can see your skills, what ran in the last 14 days, and a check-up of your own skills.

![Skills: the listing at 95% of its room, with three ways to make room.](assets/skills.png)

Fixes are made in the pane, never through the conversation. **Fix description…** has the helper model write a new description, shows it beside the old one, and saves it to the skill's front matter when you press **Save change**. **Make skills manual-only…**, **Give skills more room…** and **Make it a rule…** work the same way: the setting as it is, as it will be, then Save. A file edited meanwhile is never written over.

### Settings

What ToBeBestMe does on its own, then every option as a row of preset choices with **Other…** for an exact value. The essentials show first; **Show advanced settings** reveals the rest.

## Install

You need Claude Code 2.1.308 or later (`claude --version`; `claude update` brings an older one up to date). Install it for your user and it runs in every project and session, in the terminal and the desktop app:

```bash
claude plugin install tobebestme --marketplace vradulthub-cloud/tobebestme
```

Or at a session's prompt: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`. To install from a local copy, run the same command from its folder with `--marketplace "$PWD"`.

Sessions already open load it when they next start: quit and reopen the Claude app, or start a new terminal session. Then type `/tobebestme`. The first time, it reads the last 14 days of Claude Code's records in every project, once; that takes under a minute, and afterwards only what changed is read. To have the pane open by itself in every session, turn on **Open the dashboard in every session** in Settings.

It was called budget-pilot before 1.2; the first time ToBeBestMe starts, it carries over what budget-pilot kept.

## What it does while you work

- **Shows a line above the prompt** in every session. The first row says what needs you (a workflow waiting for your go-ahead, a chat waiting in another session, a workflow running here) or that all is fine. The second shows a small meter for context and each usage limit, then the cost here and today.
- **Uses a cheaper model when things get tight.** In Automatic mode helpers switch to it once context, a usage limit or a budget gets tight. **A model you choose yourself always wins:** switch with `/model` and the session stays on it.
- **Enforces budgets.** At a session or daily budget it warns you, switches requests to the cheaper model, or holds new prompts. Slash commands still run.
- **Writes a handoff note before every compaction**, to `.claude/tobebestme/handoff.md`, and points the next prompt at it.
- **Tells Claude where things stand.** Past the warning, each prompt carries a line so Claude keeps its steps small and saves a note.
- **Explains every workflow** as it starts, tracks each agent, and holds new agents while a run is paused or at its limit.
- **Alerts you when this chat waits for you.** On by default and separate from *Notifications*: when Claude asks permission, asks a question or finishes and waits, you get one alert for that wait, through Claude Code's own notification channel (the computer's notification centre where that shows no words), with a short chime Claude Code plays itself. *Say alerts aloud* adds a few spoken words. Turn it off with *Alert when this chat waits for you*. Alerts say who is waiting, never the command or file.
- **Suggests the next prompt, dimly.** Near compaction the prompt box's dim suggestion offers `/compact` with the plan kept; after a limit warning it offers `/tobebestme-handoff`. Tab takes it. Nothing is ever typed for you, and each is offered once per crossing or window. *Suggest the next prompt* turns it off.
- **Answers when you ask Claude.** A read-only tool, `mcp__tobebestme__status`, tells Claude where your limits, context, costs, waiting chats and workflows stand, so "how much of my week is left?" just works.
- **Notifies once per computer.** Each alert fires once, whichever session sees it first, at most four in ten minutes. Alerts go to toasts and Recent activity, and with **Notifications** on, to your computer's notification centre, a sound and, if you set an `https://` address such as an [ntfy](https://ntfy.sh) topic, your phone.
- **Adds a line under each answer** (what the turn cost, how much came from the cache, the session's context and tightest limit) and **a status line**.
- **Suggests workflows** when a request looks like one, once, with its stages and a model for each. The request goes into the prompt box for you to read before sending.

## Privacy

ToBeBestMe runs on your computer. It reads Claude Code's records in `~/.claude/projects`, `claude agents --json`, `git status` in your recent session folders, your skill and command files, and two skill settings from Claude Code's settings files. It never opens `.env` or key files.

What leaves your computer:

- **Prompts to Claude, through your own account:** when you press a button that says so (for example **Suggest more**, **Improve it**, **Fix description…**), to write the handoff note before a compaction (Settings can turn that off), and as a five-token check when the cheaper model comes back empty.
- **A notification's text** to the `https://` address you set, if you set one.
- **Nothing to GitHub** beyond the GitHub CLI's own read queries (`gh pr list`, `gh auth status`) that you run on your own account, and only when `gh` is installed and signed in.
- **Lines added to your prompts** about the budget and the handoff note, as listed in [SECURITY.md](SECURITY.md).

Reading the records sends nothing anywhere. SECURITY.md lists everything it reads, writes and sends, and how to verify a download. Each release comes with `SHA256SUMS` and build provenance signed by GitHub, and ToBeBestMe checks its own files against its release once a day; the result is in Settings under *What ToBeBestMe reads*. Report a vulnerability privately on the repository's Security tab.

## Reference

### Commands

`/tobebestme [home|workflows|session|context|usage|skills|settings]`, `/tobebestme-mode <auto|always|off>`, `/tobebestme-handoff`. The old names (`projects`, `spending`, `limits`) still work. `/tobebestme tour` replays the welcome tour.

### Settings

Every setting is a `userConfig` field, so it appears in Claude Code's **/config** menu (as *ToBeBestMe: …*) and on the Settings tab. A change in either place saves to Claude Code's settings and reloads the mod.

| Setting | Default | Presets |
| :- | :- | :- |
| Session budget | None | None, $5, $10, $25, $50, $100, Other… |
| Daily budget | None | None, $10, $25, $50, $100, $200, Other… |
| When a budget is reached | Cheaper model | Warn me, Cheaper model, Hold prompts |
| Usage limit alert at | 80% | 50, 70, 80, 90%, Other… |
| Use the cheaper model | Automatic | Automatic, Always, Off |
| Cheaper model | Haiku | Haiku, Sonnet, Other… (any model id) |
| Context warning at | 60% | 40–80%, Other… |
| Summary above the prompt | On | On, Off |
| Line under each answer | On | On, Off |
| Status line | On | On, Off |
| Read every project | On | On, Off |
| Check each workflow before it runs | Explain it | Explain it, Ask me first, Off |
| Pause a workflow past | No limit | None, $5, $10, $25, $50, Other… |
| Suggest workflows | On | On, Off |
| Notifications | Off | On, Off |
| Notify through | Both | Both, System, Claude Code |
| Alert when this chat waits for you | On | On, Off |
| Suggest the next prompt | On | On, Off |
| Pull requests and CI in Needs you | On | On, Off |
| Open the dashboard in every session | Off | On, Off |

Advanced: cost alert every, warn when a limit will run out early, helpers always use the cheaper model, main conversation too, think less past the warning, effort to use, cheaper model at context %, compact automatically at %, handoff note before compacting, keep the plan through compaction, play a sound, say alerts aloud, a web address for your phone, tell Claude where the budget stands.

### Honest limits

- **Cost** is Claude Code's own ledger (`/cost`). On a subscription it is the API-price equivalent, not a bill. Home and Workflows figures are list-price estimates from token counts, so they can differ a little from `/cost`.
- **A limit's pace** is its window's own average: use so far over the time the window has run. Running out counts as early when it is at least 8% of the window before the reset (about 13 hours of a week).
- **Home covers this computer only.** Sessions on other computers or in the cloud are not included. Where no shell runs (Windows without Git Bash), transcripts over 4 MB are left out, and the tab says how many.
- **Needs you** reads where each session's transcript stopped. A permission prompt leaves nothing there, so only sessions running right now show one.
- **Replies need the desktop app** (they go through its `send_message`). In a terminal, Needs you offers the resume command instead.
- **A mod can't connect MCP servers, edit memory or turn plugins off itself,** so those buttons open Claude Code's own `/mcp`, `/memory` or `/plugin` screen. Starting a workflow, resuming one, a long run and **Try /name** hand Claude a job, so they go to the conversation.
- **The desktop app's home screen isn't a place a mod can draw.** ToBeBestMe is in every session instead: the line above the prompt, the status line and `/tobebestme`.
- **Workflow savings** are what each change would have saved on your last 30 days of runs. Sonnet's figure is exact for the same tokens; batching assumes half of a stage's cheapest agent is setup; splitting assumes half the re-reading goes. Two ideas for one stage overlap, so they don't add up.
- **Pause, Agents at once and Model for new agents** act on runs started in this session, and on agents that have not started. Runs in other sessions are read from their folders and can only be asked to stop.
- **Skill listing room** is worked out the way Claude Code does it (1% of the context window, or `skillListingBudgetFraction`, or `SLASH_COMMAND_TOOL_CHAR_BUDGET`), so it is an estimate. Skill runs count `/name` typed in a prompt and Skill tool calls.
- **Tool output sizes** are estimated as characters ÷ 4; cache expiry is inferred from large cache writes after a pause; model switches can be refused by an organization's `availableModels` policy.
- **The self-check** catches a copy changed after install. A copy whose manifest was changed along with its files passes it; the release's checksums and signed provenance are what prove a download.
- On a Mac, system notifications may show as coming from Script Editor, since they go through `osascript`.

### If something's off

- **`unknown option '--marketplace'`.** Your `claude` is older than 2.1.308. Run `claude update`.
- **`hooks modules are turned off in this process`**, or the mod loads but shows nothing. An old Claude Code saved mods as off in `~/.claude.json`. Start the new one once (`claude -p "hi"` will do) and it saves the current switch.
- **It isn't in a session.** That session started before ToBeBestMe was installed. Start it again.
- **A finished chat still shows under Needs you.** Press **Set aside**; it comes back only if that session asks again.
- **"Haiku isn't available on your account".** Press **Use Sonnet as the cheaper model**, or choose another in Settings.
- **The pane didn't open by itself.** Claude Code opens a pane unasked only in a window at least 144 columns wide. `/tobebestme` and **Open ToBeBestMe** above the prompt open it at any width.

## Develop

Run your working copy without installing it:

```bash
claude --plugin-dir "./tobebestme"
```

For the desktop app, name the folder in `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`. Edits to `hooks/*.js` hot-reload. Use one way or the other: installed and named there, it would load twice.

### Check it without a session

```bash
claude plugin validate ./tobebestme   # static analysis: events hooked, API calls made, state used
claude plugin test ./tobebestme       # 107 tests on the terminal and desktop surfaces, no sign-in or network
cd tobebestme/e2e && npm install && npm test   # 155 end-to-end tests
```

The end-to-end suite uses Playwright. It draws every view in an empty session, a busy day with long titles and branch names, and a workflow waiting for an answer, at 375, 768, 1280 and 1920 pixels, on a dark and a light pane, with boxes sized the way the app sizes them. Each view is checked for sideways scrolling, type under 11px, text drawn over text, hover cards out of view, unnamed controls, more than one primary button, and unreadable contrast. It also drives real Claude Code sessions in a terminal, with notifications off and no prompts sent. `npm run test:live` adds one real two-agent workflow on Haiku (a few cents).

The images in this README come from the same fixtures: `node e2e/lib/export.mjs` writes each view to `e2e/.out/pages/`, and the images are screenshots of those pages.

On a drive that isn't APFS or HFS+ (exFAT, FAT32, a network share), macOS writes `._*` sidecar files, and `claude plugin test` fails to load `tests/._tobebestme.test.ts`. Run `dot_clean ./tobebestme` first.

See [CONTRIBUTING.md](CONTRIBUTING.md) for what a change needs.

### How it's built

| File | What it holds |
| :- | :- |
| `hooks/register.js` | The hooks, workflow runs and the controls that hold their agents, the session's numbers, spending across sessions, the background read of Claude Code's transcripts, running sessions, alerts, and the actions behind every button |
| `hooks/lib.js` | Settings and presets, list prices, the transcript search and per-project summary, what each session waits for, usage-limit pace, the outlook, suggestions and their savings, skills, the report, and the SVG charts |
| `hooks/draw.js` | The six tabs, the line above the prompt and their hover cards, drawn from plain data for whichever surface they're on |
| `types/index.d.ts` | The `$.state` contract |
| `.claude-plugin/plugin.json` | The manifest, with every setting under `userConfig` |
| `.claude-plugin/marketplace.json` | Makes the folder (or its repository) a marketplace, so one line installs the mod |
| `.claude-plugin/integrity.json`, `SHA256SUMS` | The SHA-256 of every shipped file, written by `tools/release-manifest.mjs` for each release |
| `tests/` | The kit tests (`claude plugin test`) |
| `e2e/` | The end-to-end suite: every view in Chromium, real terminal sessions, one live workflow |

| Hook | Why |
| :- | :- |
| `session.start` | Registers the commands, loads spending, and reads every project in the background |
| `turn.step` | Switches a request's model or effort before it's sent; records tokens by model, helper and workflow agent |
| `agent.spawn` | Starts a helper on the cheaper model; holds a workflow's agent while its run is paused or at its limit |
| `tool.call` | Counts calls, time, failures and output size per tool; records what each workflow agent is doing |
| `tool.call { tool: 'Workflow' }` | Reads the script before a run starts, estimates it, waits for your go-ahead when you asked for that, and records the run |
| `skill.prompt` | Counts which skills run |
| `prompt.submit` | Holds prompts past a budget; adds the budget line and the handoff pointer |
| `turn.start` / `turn.complete` | Marks a workflow agent done or failed; records each turn, updates today's spending, fires alerts, compacts automatically, and adds the line under the answer |
| `session.compact` | Writes the handoff note, keeps its plan in the summary, and counts the tokens freed |
| `session.measure` | Refreshes the figures, records usage-limit readings for the forecast, and updates the status line and the pane |
| `ui.render { component: 'Pane' }` | Draws the pane |

## License

MIT, © 2026 ToBeBestMe contributors. The name and icon aren't covered by the license; see [TRADEMARKS.md](TRADEMARKS.md).
