<img src="assets/icon.png" width="88" alt="">

# ToBeBestMe

**Keep several Claude Code projects going without losing track of what's waiting for you, what it costs, or how long your limits will last.**

![The week by project on ToBeBestMe's Home pane: a day is pressed, then a project is picked out across the week. Sample data.](assets/demo.gif)

[Landing page](https://vradulthub-cloud.github.io/tobebestme/) · [What it reads and sends](SECURITY.md) · Install: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`

A Claude Code **mod** for keeping several projects going at once. It answers the day's first questions, which chat is waiting for me and where did each project get to, lets you follow and steer every workflow Claude runs, and manages the three budgets every session spends:

- **Usage limits:** the 5-hour and weekly limits on Claude plans.
- **Money:** what each request costs on an API key or team billing.
- **Context:** the conversation Claude re-reads on every turn. As it grows, each turn costs more.

It was called budget-pilot before 1.2; the first time ToBeBestMe starts, it carries over everything budget-pilot kept.

[DESIGN.md](DESIGN.md) explains who needs this, the questions it answers, and the levers that actually save budget.

## Install it in every project

It installs for your user, so ToBeBestMe runs in every project and every session, in the terminal and the desktop app. You need Claude Code 2.1.308 or later; `claude --version` says which you have, and `claude update` brings an older one up to date (an older one answers `unknown option '--marketplace'`).

In a terminal, go to the folder ToBeBestMe is in:

```bash
cd /path/to/tobebestme
```

Then install it from there:

```bash
claude plugin install tobebestme --marketplace "$PWD"
```

Once the mod is in a GitHub repository, the same line takes `<owner>/<repo>` in place of `"$PWD"`, or at a session's prompt:

```
/plugin install tobebestme --marketplace <owner>/<repo>
```

Sessions that were already open load it when they next start: quit and reopen the Claude app, or start a new terminal session. Then type `/tobebestme`. The first time, it reads the last 14 days of Claude Code's records in every project, once; that takes under a minute even for a busy fortnight, and after it only what changed is read. To have the dashboard open by itself in every session, turn on **Open the dashboard in every session** in Settings.

## The dashboard

Type `/tobebestme` to open it beside the chat, or press **Open Orchestrator** on the line above the prompt. Tabs 1–7 switch views. On the terminal each button also has a letter key; the desktop app leaves the key chips off.

Every section is a card with an icon in its own colour, the way System Settings does it, and tables carry a slim bar per row so the biggest item stands out before you read a number. Point at a row, a tile, a chart or a ring and it says more: what a context category is and how to shrink it, which tools an MCP server brings, what a turn cost and whether it missed the cache, where a skill comes from and how to turn it off. **Show details** (`d` in the terminal) lays every hover card's words out in place instead, for a keyboard, a screen reader or a touch screen. The usage forecast shows its tooltips with a short fade; with reduced motion set, they appear at once.

### Home (1)

The tab it opens on. It reads Claude Code's own records for every project on this computer (each session, its helpers and its workflow agents), so it covers sessions that never ran ToBeBestMe and works the same in the terminal and the desktop app.

- **Running now.** Workflows running in this session or another, with their agents done so far and what they have cost; **Open Workflows** goes to the controls. A workflow waiting for your go-ahead shows here too.
- **The day's answer.** The date, how many chats are waiting for you (or *Nothing is waiting for you*), and today's work across projects and sessions.
- **Where you stand, in one figure.** The tightest limit's percentage, large, beside the headline, and under its name a sentence of forecast: *On pace to end the week at about 45%*, or *At this pace it runs out Sat 5:21 AM, 32 h 38 min before it resets*. Every runway, here and on every tab, shows a faint ghost ahead of its fill: where the window's own pace lands by the reset.
- **Your week on one calendar.** The tightest limit drawn across its window, with Now, where it runs out and when it resets. Under it, a bar for each day stacked by project, each project in its own colour, so you can see which work filled the week; point at a day for its share and its busiest projects. Press a day under the calendar to pick it out: the other days step back, a line says what it held, project by project, and Projects shows that day. Press a project in the legend and it sits on the baseline in its colour every day while the rest go grey. **Show the whole week** and **Show every project** bring it back. The other limits sit under it as runways with their percentage and reset. Each limit keeps one colour, and amber or red take over when it runs low. Anything working right now (a workflow, a session) has a softly pulsing dot, still with reduced motion set.
- **Needs you.** Every chat that stopped for you in the last week, the most pressing first:
  - *Needs your permission*: a session running right now that is stopped on a permission prompt.
  - *Waiting for your answer*: a session that finished by asking you something, with the reply buttons it offered.
  - *Asked you a question* and *Plan to approve*: a question with options, or a plan, still open.
  - *Stopped at a usage limit*, or *Ready to carry on* once that limit has reset.
  - *Pull request open*: a desktop session whose pull request waits for review or merge, with its last recap.

  In the desktop app a suggested reply shows the whole message and asks before it sends; **Reply…** opens a field where Return sends your own words. Either way the answer goes straight to that session. Everywhere, **Copy resume command** copies `cd '<folder>' && claude --resume <id>` to carry it on in a terminal, and **Set aside** hides it until that session asks again. A chat archived in the app, run again under the same title since (daily runs), or answered here drops off by itself.
- **Pick up where you left off.** The latest session in each project you worked on this week (not a schedule's run): its title, the last thing it told you (or what you asked), its branch and pull request, where it ran, and loose ends in its folder, such as *3 files changed, not committed · 2 commits not pushed*. A session working right now says so. In the app, **Tell it what's next…** sends it your next step.
- **What stands out.** Up to three plain observations, each with a button where one helps: a day well above your usual, helpers and workflow agents doing a large share (with **Use Haiku for helpers**), one model doing nearly all the work, or one project taking most of the week. A saving says what it would do to the week before you press it (*If helpers ran on Haiku: on pace to end the week at about 61%*), from list prices; point at it for the runway the week would have.
- **Projects.** Most used first, for the past 7 days or today, each in its own colour, with the period's total beside the heading and worktrees counted in their repository. Point at one for its folder, sessions, models, helper share and cache reuse.
- **Last 14 days**, where Home has no week to draw (a 5-hour window, or no plan): a bar per day, stacked by project, with the average.
- **Open sessions** and **Ready to archive**, in the desktop app. Each open session with its folder, branch and pull request, whether it's working, and its context; idle sessions whose pull request merged or closed, each with **Archive session…**, which asks first.
- **Refresh.** One button for the whole tab. Only transcripts that changed are read again, and every session shares one reading, so it stays quick.

### Workflows (2)

A workflow is a script Claude writes to split a big job across many agents, usually in stages: one agent per file to review, then one per finding to check, then one to write it up. They can run for hours and start hundreds of agents, so this tab explains each run before it starts, shows every agent while it works, puts the controls beside them, and says afterwards what would have cost less.

- **Before it starts.** As a run starts, a toast says what it is: its stages and how many agents it starts at least. With **Check each workflow before it runs** set to **Ask me first**, Claude waits instead, in the chat's own question dialog, which stays until you answer; the pane shows a read-only card with the run's purpose, its stages, how many agents it starts (and whether one stage starts one per item), the likely cost range from what agents cost in your finished runs, and anything worth changing first, such as *2 agent calls name no model, so they run on Fable 5.1, this session's model* or a checking stage that fans out with no cheaper model named. **Run workflow**, **Run on Sonnet** (every agent on Sonnet, whatever the script names) or **Don't run**, or type your own answer. Closing the question declines the run. In a session nobody is at (`claude -p`) there is no one to ask, so the run goes ahead; a spending limit still applies.
- **While it runs.** A card per run in this session: running, paused or stopping; agents done, working, waiting and failed; cost so far and time; the stages in order with how far each got (✓ Review 10/10 → ● Verify 4/30 → ○ Report); and a row per agent with what it is doing this moment (*Editing checkout.ts*, *Run the cart tests*, *Searching for TODO*), its model, how long it has run and what it has cost. An agent that waits says why. Point at an agent for its stage, steps and tokens. If a run goes past the cost expected before it started, the card says so.
- **The controls.**
  - **Pause new agents**: agents already working finish their step; new ones wait, each marked *waiting: the run is paused*, until **Resume**.
  - **Agents at once**: No limit, 1, 2, 4 or 8. The rest wait their turn and start by themselves, which spreads the work out so a plan's limits last longer.
  - **Model for new agents**: As written, Sonnet or Opus, for every agent the run starts from now on.
  - **Stop workflow…** asks first, then stops the run; finished work is kept.
  - **Copy run ID**, and on a stopped or failed run **Resume workflow…**, which puts the request to resume it (finished agents come back without running again) in the prompt box.
- **Running in other sessions.** Runs in your other sessions, read from their folders as their agents write: stages so far, agents working now, cost. In the desktop app **Ask that session to stop…** sends that session a message after asking you.
- **Finished.** This session's runs with their summary, cost and time, each with what to change next time; and the last day's runs in your other sessions.
- **Costliest runs.** The five that cost most in the last 30 days, in every project. Point at one (or read the line under it in the terminal) for where its money went, stage by stage, and which model did the work.
- **Ways to spend less.** Worked out from every run in the last 30 days, each with what it would have saved on those runs:
  - *Run checking stages on Sonnet*: verifying, rechecking, walkthroughs, reading and gathering that started five or more agents on Opus. Review, design, building and writing keep Opus.
  - *Give each agent a few items, not one*: stages of 20 or more small agents, where every agent first loads its instructions and re-reads the shared files.
  - *Split the longest agents into smaller jobs*: agents that cost $15 or more, mostly re-reading their own growing conversation at every step.
  - *Resume a stopped run instead of starting again*: a run stopped and started over in the same session, paying again for agents that had finished.
  - *Name a model for every agent*: agent calls that named none and so ran on Fable, the session's model.
  - *Split the job a stage waits on*: a stage that waited on one slow agent long after the rest finished (minutes, not dollars).

  **Make it a rule…** shows the rule and adds it to your user CLAUDE.md under its own heading when you press Save change, so every workflow Claude writes follows it. **Set aside** hides an idea for 30 days.
- **How workflows work.** The same explanation in a few lines, and the **Check each workflow before it runs** switch.

### This session (3)

- **The headline.** *All clear*, *Heads up* or *Act now*, then the most pressing thing in a sentence, with its one best action as the page's one primary button, and what that action saves wherever it can be counted. For example: *Each later turn re-reads about 470k fewer tokens (504k → about 34k).* Actions that need a yes ask right there.
- **Runways.** One tile per thing that can run out (context, the 5-hour limit and the weekly limit, or your budgets when there are no limits), plus this session's spending. Each tile has the figure, a *runway* in the item's own colour, what the figure means, and *Needs attention* when it does. The fill is how much is used. For a limit, a thin strand under it is how much of its window has passed, with a white playhead at "now": fill past the playhead is ahead of the clock, and shows in orange. When that pace would run the limit out early, the strand stops at the run-out with an upright stop and a thin line to the reset. Context has no clock, so neutral ticks mark where it warns and where Claude Code compacts. On the terminal the same runway is block characters: `█` used, `░` room, `┃` now, `╌` the dry stretch. Press a name to open its tab; point at a tile for more.
- **Today's share.** For the weekly limit: the pace a day can take to last until the reset, and how today stands against it.
- **More ways to save.** Ranked suggestions, each with a button and its savings.
- **Right model for the job.** From the limits and what the session has mostly been doing (searching and reading, or writing code): stay on Opus, switch this session to Sonnet, or put helpers on the cheaper model, with one press. The choice holds for this session only, and the guide shows which model suits planning, coding and reading.
- **Plan a long run.** Describe the goal; it lays out the stages (plan on Opus, build on Sonnet, read on the cheaper model, check and checkpoint each stage, stop cleanly before a limit), how far your limits stretch at your recent pace, and the best time to start. **Save /long-run and start here** saves the playbook as the `/long-run` skill in `~/.claude/skills` and puts the run in the prompt box.
- **How long you can keep going.** Each usage limit from its own pace (whether it lasts until it resets, or when it runs out), turns and tokens left before auto-compaction, and money left in each budget. Useful from the first minute; the first thing to run out is in bold.
- **Wins this session.** What ToBeBestMe has actually saved: tokens freed by compaction, helpers that ran on the cheaper model, cache reuse, and notes and skills saved.
- **Cheaper model.** Switch between Automatic, Always and Off right here.
- **Make the conversation smaller.** Write handoff note, Start fresh…, and Compact now…. Start fresh and Compact ask before they act.

### Skills (6)

Claude picks a skill from a listing of names and descriptions sent with every request. That listing has room for 1% of the context window; past it, skills go to Claude as a bare name it can't match to a request, and nothing says so. Descriptions over 1,536 characters are cut. The tab answers four questions, in this order:

- **Can Claude see my skills?** The headline says how many skills go by name alone, or that the listing is full, or that all is well. The tiles show how many skills there are (yours, from plugins, built in), how much of the listing's room they take on every request, how many ran in the last 14 days, and how many never did.
- **Make room in the listing.** When it's full, three ways to fix it: make the skills you never run manual-only (they leave the listing and `/name` still works), turn off plugins none of whose skills ran, or give the listing more room. Each change is made in the pane: it shows the setting as it is and as it will be, and writes your settings.json only when you press Save change, every other setting kept. Nothing goes through the conversation.
- **Most used.** Every skill that ran in the last 14 days in any project, from Claude Code's own records: typed as `/name` or picked by Claude, when it last ran, and in which projects.
- **Check-up.** Your own skills and commands, read from `~/.claude/skills`, `~/.claude/commands` and this project's `.claude`, checked against what makes a skill run when it should: no description, a description cut short or too thin to match, one that doesn't say when to use it, two skills that overlap and compete, a skill Claude sees only by name, a file that loads hundreds of lines, and skills nobody ran in 14 days. **Fix description…** has the helper model write a new description from the skill and what the check-up found, shows it beside the old one, and saves it to the skill's front matter when you press Save change, its instructions untouched; it never goes through the conversation. **Try /name** and **Copy path** are beside it. Skills switched off in `skillOverrides` are left out.
- **Where the listing goes.** By source (each plugin, yours, built in) or skill by skill, never ran, or name only, filtered as you type, with **Manage skills** (Claude Code's `/skills` screen) and **Manage plugins**.
- **Skill ideas.** Prompts you typed more than once in the last two weeks, in any project (forked sessions' copies don't count), plus commands this session runs again and again; **Suggest more** asks the cheaper model. **Draft this skill** starts the builder.
- **Build a skill.** Describe it, see the draft checked against the same rules (says when to use it, fits in 1,536 characters, short enough to load quickly), save it for this project or all of yours, then **Try /name**.

### The other tabs

| Tab | What's on it |
| :- | :- |
| **Context** (4) | How full it is, by category, with your thresholds and auto-compaction marked (point at a part of the bar or a row for what it is and how to shrink it); how much each request re-sends and how much came from the cache; context size over recent turns; what's always loaded, with **Manage MCP servers** and **Edit memory**; ways to make it smaller |
| **Usage** (5) | The two questions asked together, how long can I keep going and what did that cost. First each limit window's use and a forecast chart: use so far, the projected line at the window's own pace, the alert and 100% lines, and a dot where it would run out (every point says what it is on hover), then when it resets, the recent pace and what a day or an hour can take to last until the reset. **Making limits last** holds the controls that help. Then this session: four tiles that never repeat a figure, **Turns** with a bar per turn in its model's colour, **Budgets** set right here, by model, helpers and tools, days across sessions, and Copy summary and Save report |
| **Settings** (7) | **On autopilot** first: what ToBeBestMe does by itself, so there is nothing to watch. Then every option as a row of preset choices, with **Other…** for an exact value. The essentials show first; **Show advanced settings** reveals the rest. **Reset** restores defaults or clears this session's numbers, each after asking |

Charts are SVG in the desktop app and block characters in the terminal. Colour marks status (warning, error), identity (each section, runway and model) or a saving, always with words beside it. Esc closes the dashboard.

## What it does while you work

- **Uses a cheaper model when things get tight.** In Automatic mode, helpers switch to it once context, a usage limit or a budget gets tight; a helper someone started on a particular model keeps it. Always sends everything there; Off never switches. You can also keep helpers on it all the time, include the main conversation, or lower the thinking effort past the warning. **A model you choose yourself always wins.** Switch with `/model` (or the model picker) and that session stays on your choice, even in Always mode or at a budget; ToBeBestMe says so in a toast and Recent activity, and helpers still follow the setting. While Always is sending this conversation to the cheaper model, This session says so in its model card, with **Turn Always off**, and the line under each answer says *everything on Sonnet*. If your account can't use the cheaper model (an alias like `haiku` can name one your plan doesn't offer), the request goes again on the usual model at once, nothing is sent there again, and the dashboard offers Sonnet instead.
- **Enforces budgets.** When a session or daily budget is reached, it warns you, switches every request to the cheaper model, or holds new prompts until you raise the budget. Slash commands still run.
- **Notifies once, wherever you are.** Each alert fires once per computer, whichever session sees it first: per budget, per usage-limit window, per workflow waiting or ending, per chat that starts waiting. There are at most four in any ten minutes. Alerts show as toasts and in Recent activity. With **Notifications** on they also go out through Claude Code, your computer's notification centre (`osascript` on a Mac, `notify-send` on Linux), a sound, and, if you add an `https://` address such as an [ntfy](https://ntfy.sh) topic, your phone. Claude Code's own notifications show words only in iTerm2, Kitty and Ghostty, which is why there are other channels. **Send a test notification** in Settings says which channels worked. Notifications go out in the background, so a sound never holds up the pane.
- **Suggests workflows.** When a request looks like a job for a workflow (an audit, a review of many changed files, fixing failing tests, a migration, research), a toast says so once. The Workflows tab offers **Start this workflow…** with its stages and the model for each; the request goes into the prompt box for you to read before sending. Turn it off with **Suggest workflows**.
- **Tells Claude where things stand.** Past the warning, each prompt carries a line Claude reads, so it keeps its steps small and saves a note.
- **Writes a handoff note before every compaction.** The note goes to `.claude/tobebestme/handoff.md`, the summary is asked to keep its plan, and the next prompt points Claude at the note. It can also compact for you between turns, at a percentage you choose.
- **Explains every workflow** as it starts, tracks each agent while it runs, and holds new agents while a run is paused or at its limit. With **Ask me first** on, a workflow waits for your go-ahead.
- **Counts skill use** and spots work worth turning into a skill.
- **Shows a line above the prompt** in every session. Its first row says what needs you: a workflow waiting for your go-ahead (**Review workflow**), a chat waiting in another session (with its question), something here that needs acting on, a workflow running here and how far it got (**Follow it**), or that all is fine, with **See what's waiting** or **Open Orchestrator**. The second shows a small meter for context and each usage limit (a small runway in the desktop app, text meters in the terminal), coloured only past your warning, then the cost here and today across projects.
- **Shows a status line**: chats waiting, a workflow running here (*review-changes running, 3 of 7 agents done*), then context and each limit with a small meter, tightest first (with the reset time once one is high), then cost here and today.
- **Adds a line under each answer**: what the turn cost and took, how much it read and how much came from the cache, what it wrote, then the session's cost, context (and how far from compaction), the tightest limit, and anything worth knowing now: a cache rebuilt after a pause, helpers on the cheaper model, a workflow running here, chats waiting elsewhere.
- **Copies a status update.** **Copy summary** (on Home and Usage) copies a plain-text update to paste into a standup or a chat: what's waiting for you, today's work and the busiest project, the limits, this session, skills, and where each project got to. **Save report** writes the same as Markdown with tables for every project and the last 14 days.

## Settings

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
| Open the dashboard in every session | Off | On, Off |
| *Advanced:* cost alert every, warn when a limit will run out early, helpers always use the cheaper model, main conversation too, think less past the warning, effort to use, cheaper model at context %, compact automatically at %, handoff note before compacting, keep the plan through compaction, play a sound, a web address for your phone, tell Claude where the budget stands | | |

Commands: `/tobebestme [home|workflows|session|context|usage|skills|settings]`, `/tobebestme-mode <auto|always|off>`, `/tobebestme-handoff`. The old names (`projects`, `spending`, `limits`) still work.

## Work on it

To run your working copy without installing it, start a terminal session with it:

```bash
claude --plugin-dir "./tobebestme"
```

For the desktop app too, name the folder in `CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`. Edits to `hooks/*.js` hot-reload. Use one way or the other: installed and named there, it would load twice.

## Check it without a session

```bash
claude plugin validate ./tobebestme   # static analysis: events hooked, API calls made, state used
claude plugin test ./tobebestme       # 86 tests on the terminal and desktop surfaces, no sign-in or network needed
```

The end-to-end suite in `e2e/` uses Playwright. It draws every view in an empty session, a busy day (with long session titles and branch names) and with a workflow waiting for an answer, at 375, 768, 1280 and 1920 pixels wide. Boxes are sized as the app sizes them, so a long line that would push a column off the pane fails the check. Each view is checked in Chromium for:
- no sideways scrolling, and nothing past the pane's edges;
- no type under 11px;
- no text drawn over other text;
- every hover card fully in view and on top;
- every control named;
- one primary button;
- readable contrast.

It also drives real Claude Code sessions in a terminal. Those sessions run with notifications off and send no prompts. `npm run test:live` adds one real two-agent workflow on Haiku (a few cents) and checks that ToBeBestMe follows it from start to finish.

```bash
cd tobebestme/e2e && npm install && npm test
```

On a drive that isn't APFS or HFS+ (exFAT, FAT32, a network share), macOS writes `._*` sidecar files beside each file, and `claude plugin test` fails to load `tests/._tobebestme.test.ts`. Run `dot_clean ./tobebestme` first, or ignore that one failure.

## If something's off

- **`unknown option '--marketplace'`.** The `claude` in your terminal is older than 2.1.308. Run `claude update`.
- **`hooks modules are turned off in this process`** (from `claude plugin test`), or the mod loads but shows nothing. An old Claude Code saved mods as off in `~/.claude.json`, usually while updating itself. Start the new one once (`claude -p "hi"` will do), and it saves the current switch.
- **It isn't in a session.** That session started before ToBeBestMe was installed. Start it again.
- **A chat that's finished still shows under Needs you.** Press **Set aside**; it comes back only if that session asks again. Outside the desktop app nothing says a session was archived, so archived ones can show there until set aside.
- **"Haiku isn't available on your account".** Your plan doesn't offer the model the cheaper-model setting names. Press **Use Sonnet as the cheaper model**, or choose another in Settings.
- **The dashboard didn't open by itself.** Claude Code opens a pane unasked only in a window at least 144 columns wide; with **Open the dashboard in every session** on, a narrower window gets it with your first message. `/tobebestme` and **Open Orchestrator** above the prompt open it at any width.

## How it's built

| File | What it holds |
| :- | :- |
| `hooks/register.js` | The hooks, this session's workflow runs (kept in the module, with a copy in `$.state`) and the controls that hold their agents, the session's numbers in `$.state`, spending across sessions and every project's use in `$.store`, the background read of Claude Code's transcripts, running sessions (`claude agents --json`) and folders' git state, alerts, and the actions behind every button, replies to other sessions included |
| `hooks/lib.js` | Settings and presets, list prices, the transcript search and the summary of every project, what each session waits for and where each project got to, words and numbers, usage-limit pace and when running out early matters, the outlook, suggestions and their savings, what each context category is, skills, the report, the SVG charts (meter, bars, runway, forecast) and the section icons |
| `hooks/draw.js` | The six tabs, the line above the prompt and their hover cards, drawn from plain data for whichever surface they're on |
| `types/index.d.ts` | The `$.state` contract |
| `.claude-plugin/plugin.json` | The manifest, with every setting under `userConfig` |
| `.claude-plugin/marketplace.json` | Makes the folder (or its repository) a marketplace, so one line installs the mod |
| `.claude-plugin/integrity.json`, `SHA256SUMS` | The SHA-256 of every shipped file, written by `tools/release-manifest.mjs` for each release |
| `tests/` | The kit tests (`claude plugin test`) |
| `e2e/` | The end-to-end suite: every view in Chromium, real terminal sessions, one live workflow |

| Hook | Why |
| :- | :- |
| `session.start` | Registers the commands, loads spending and the last plan reading, and reads every project in the background |
| `turn.step` | Switches a request's model or effort before it's sent; records each request's tokens by model, by helper and by workflow agent |
| `agent.spawn` | Starts a helper on the cheaper model; holds a workflow's agent while its run is paused or at its limit, and gives it the run's model |
| `tool.call` | Counts calls, time, failures and output size per tool; records what each workflow agent is doing |
| `tool.call { tool: 'Workflow' }` | Reads the script before a run starts (stages, agent calls, models named), estimates it, waits for your go-ahead when you asked for that, and records the run |
| `skill.prompt` | Counts which skills run |
| `prompt.submit` | Holds prompts past a budget; adds the budget line and the handoff pointer for Claude |
| `turn.start` / `turn.complete` | Marks a workflow agent done or failed and lets a waiting one start; records each turn (cost, tokens, time, pause, context size, limits), updates today's spending, fires alerts, refreshes skill ideas, compacts automatically, and adds the line under the answer |
| `session.compact` | Writes the handoff note, keeps its plan in the summary, and counts the tokens freed; skips `precompute` runs and helpers' own compactions |
| `session.measure` | Refreshes the figures, records usage-limit readings for the forecast, fires alerts, and updates the status line and the pane |
| `ui.render { component: 'Pane' }` | Draws the dashboard |

## Trust and security

ToBeBestMe reads Claude Code's records on your computer, and SECURITY.md lists everything it reads, writes and sends. In short:
- It never opens `.env` files or key files. It parses Claude Code's settings files for two skill settings only.
- Prompts go to Claude, through your own account, only when you press a button that says so, to write the handoff note before a compaction (Settings can turn that off), and as a five-token check when the cheaper model doesn't answer.
- A notification's text goes to the `https://` address you set, if you set one.

Each release comes with `SHA256SUMS` and build provenance signed by GitHub. ToBeBestMe also checks its own files against its release once a day, and the result is in Settings › What ToBeBestMe reads. Report a vulnerability privately on the repository's Security tab.

## Honest limits

- Cost is Claude Code's own ledger (`/cost`). On a subscription it's the API-price equivalent rather than a bill.
- A usage limit's pace is its window's own average: use so far over the time the window has run. Readings ToBeBestMe takes add the recent pace and the line on the forecast chart. Running out counts as early when it's at least 8% of the window before the reset (24 minutes of a 5-hour window, about 13 hours of a week); closer than that, it says so quietly.
- A mod can't connect or disconnect MCP servers, edit memory or turn plugins off itself, so those buttons open Claude Code's own `/mcp`, `/memory` or `/plugin` screen (or, where a command can't run from the pane, put it in the prompt box).
- Home reads the transcripts Claude Code keeps in `~/.claude/projects` (or under `CLAUDE_CONFIG_DIR`) on this computer, and sends nothing anywhere. Its figures are list-price estimates from token counts, so they can differ a little from `/cost` (fast mode and long-prompt rates aren't counted). Sessions on other computers or in the cloud aren't included. Where no shell runs (Windows without Git Bash), transcripts over 4 MB are left out, and the tab says how many.
- Needs you reads where each session's transcript stopped: the last wrap-up question (and its reply buttons), a question or plan left open, or an API error such as a usage limit. A new prompt, or Claude going on, clears it. A session that stopped without asking anything isn't listed; Pick up shows it instead. A permission prompt leaves nothing in the transcript, so only sessions running right now show one, from `claude agents --json`.
- Replies go through the desktop app's `send_message`, so they need the app: in a terminal session, and for sessions started in a terminal, Needs you offers the resume command instead. A transcript is matched to its desktop session by folder, title and time.
- Open sessions reads the desktop app's session tools (`ccd_session_mgmt`). Context shows only for sessions that are working, since the app reads it from their process; a session's spending shows when it runs ToBeBestMe.
- The desktop app's home screen isn't a place a mod can draw. Installed for your user, ToBeBestMe is in every session instead: the line above the prompt, the status line, and `/tobebestme`.
- Hover cards need a pointer: the desktop app, or a terminal in fullscreen with mouse support. Everything they say is a detail; the figures themselves are always on screen.
- Savings are counted in tokens; overhead after a fresh start is estimated from /context's categories.
- Tool output sizes are estimated as characters ÷ 4.
- Cache expiry is inferred from large cache writes after a pause.
- "Today" on This session and Usage, and the daily budget, add up Claude Code's exact costs for the sessions on this machine that run ToBeBestMe; Home estimates every session.
- Skill ideas from the cheaper model, and skill drafts (Sonnet, or the cheaper model if Sonnet is refused), each send one small request. A draft is saved only when you press Save skill.
- Which skills go to Claude by name alone is read from the context breakdown: an entry no longer than its name. The listing's room is worked out the way Claude Code does it (1% of the context window, or `skillListingBudgetFraction`, or `SLASH_COMMAND_TOOL_CHAR_BUDGET`), so it's an estimate. A mod can't change `skillOverrides` or the listing's budget itself, so those buttons put a request in the prompt box for Claude to make, which you read before sending.
- Skill runs count `/name` typed in a prompt and Skill tool calls; skills loaded by Claude Code itself (such as workflow-authoring before a workflow) aren't counted. The search for repeated prompts runs at most every six hours, needs a shell, and reads prompts on this computer only.
- Model switches can be refused by an organization's `availableModels` policy; Claude Code then keeps the original model and logs a warning.
- A model set from the dashboard applies to workflow agents that start after you set it, not to ones already working; agent-team teammates keep theirs, and a session that forces one model on every subagent outranks it.
- Pause, Agents at once and Model for new agents act on runs started in this session, since the mod sees their agents start. Runs in other sessions are read from their folders and can only be asked to stop; one whose agents wrote nothing for ten minutes counts as no longer running.
- Pausing holds new agents; one already working finishes its current step. Stop uses Claude Code's TaskStop. Resuming a run works in the session that started it.
- Workflow costs are list-price estimates from each agent's tokens. A run's stages come from its agents' own records, written as each starts. The savings are what each change would have saved on your last 30 days of runs: Sonnet's figure is exact for the same tokens; batching assumes half of a stage's cheapest agent is setup; splitting assumes half the re-reading goes. Two ideas that fit the same stage overlap, so they don't add up.
- Each notification goes out once per computer through a record every session shares. A session that was already open when you updated keeps its older copy until it restarts. On a Mac, system notifications may show as coming from Script Editor, since they go through `osascript`.
- The self-check catches a copy changed after install. A copy whose manifest was changed along with its files passes it; the release's checksums and signed provenance are what prove a download.
- Hover cards appear without animation, as Claude Code draws them; only the charts' own tooltips can fade in.

## License

MIT, © 2026 ToBeBestMe contributors. The name and icon aren't covered by the license; see TRADEMARKS.md.
