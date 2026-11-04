# ToBeBestMe launch copy (v3)

The angle: ToBeBestMe is a mod that runs inside Claude Code itself, not a separate app, service, website, CLI or account. It changes Claude Code's own interface (a pane beside the chat, a line above the prompt, a tool Claude answers from, alerts through Claude Code's own channel), with no server, no sign-up and no API key, so you always know where things stand. Say that first, plainly, in every post. It opens with the pain every heavy user knows (the limit that dies on Saturday, the chat that sat waiting an hour, the workflow that quietly spent a week) and shows each answer instead of describing it. Written in the first person as a draft: keep only what is true of you, and write the Show HN comment in your own words. The figures are a sample week, never real use.

Link everywhere: https://github.com/vradulthub-cloud/tobebestme
Site: https://tobebestme.vercel.app
Install: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`

Figures in every image and every number below come from the one sample fixture (storefront, ledger-api and so on): 82% of the weekly limit, runs out Sat 5:21 AM, about 33 hours without Claude before it resets Sun 2:00 PM. None of it is real usage.

---

## Taglines

Pick one for the repo description, bios and the site header.

1. A mod that runs inside Claude Code itself. Know where things stand without leaving the chat.
2. Not another app. It changes Claude Code itself: a pane, a line above the prompt, a tool Claude answers from.
3. Your week, your waiting chats, your pull requests, your workflows. One place.
4. A weekly limit can run out on a Saturday. Now you'd know on Monday.
5. Know before you run out.
6. A free pane for the questions Claude Code makes you leave to answer.

Short form for a bio line: "Free, open-source mod that runs inside Claude Code: limits, waiting chats, PRs and workflows in one pane. No server, no sign-up."

---

## Images and video, at a glance

From `site/img/` (the same sample data, cropped for the web):
- `week-v6.png`: the week drawing. Bars by project, line of use, dashed run-out, hatched hours without Claude.
- `now-v6.png` and `needs-v6.png`: the lead card and the list of chats waiting.
- `band-v6.png`: the line above the prompt.
- `pane-v6.png`: the whole pane beside a chat.
- `savings.png`, `standout-v6.png`: a saving drawn as before and after.
- `workflows-v6.png`, `workflows-savings-v6.png`: a run, and what it cost against what it could have cost.
- `skills-v6.png`, `fix-v6.png`: the skills check-up, and a fix shown as now and after.
- `overview-v7.mp4` (poster `overview-poster-v7.png`, captions `overview-v7.vtt`): the 88-second tour.
- `social-card-v6.png`: the landing page's link preview (the same picture as `launch/out/social-card.png`, the repository's social preview).

From `launch/out/`:
- `launch-hero.png`: single image for X, Bluesky, LinkedIn.
- `carousel/01.png` to `07.png`: LinkedIn document, or X four-image post (use 1, 2, 3, 7).
- `demo.mp4` and `demo.gif`: the pane in use. GIF for Reddit and the README.
- `video/overview.mp4` (with `-web.mp4`, `-poster.png` and captions): the tour. The one-clip-per-idea explainers are not part of the kit until they are re-rendered for the current pane.
- `demo-frame-0.png` to `2.png`: stills from the demo.

---

## X / Bluesky thread

### Three hooks for post 1 (pick one)

**Hook A, the Saturday**
Picture a Saturday morning where your weekly limit is gone until Sunday 2:00 PM. In this sample week that is about 33 hours without Claude.

ToBeBestMe is a mod that runs inside Claude Code: a pane that shows it on Monday.
[carousel/02.png]

**Hook B, the waiting chat**
A Claude Code chat can ask for permission and sit there for an hour while you work in another project.

ToBeBestMe is a mod that runs inside Claude Code, so everything waiting on you shows up in one place, with a chime the moment it starts.
[site/img/now-v6.png]

**Hook C, the quiet burn**
One workflow. Hundreds of agents. You find out what it cost after the fact.

ToBeBestMe is a mod that runs inside Claude Code. It shows what each run cost, what you'd have saved, and draws the two side by side.
[site/img/workflows-savings-v6.png]

### The thread

**1/** (use the hook you picked)

**2/**
ToBeBestMe is a free, open-source mod that runs inside Claude Code itself. Not a separate app, site or account: it changes Claude Code's own interface, with a pane beside the chat, a line above the prompt, a tool Claude answers from, and a lobby on your phone. No server, no sign-up, no API key. It runs on your computer.

The point: you always know where things stand, without leaving the chat.
[site/img/pane-v6.png]

**3/**
Your weekly limit, drawn as one week. Every day is a bar stacked by project. A dashed line carries your pace forward:

"At this pace it runs out Sat 5:21 AM, about 33 hours before it resets."

The hatched stretch is the stretch of about 33 hours with no Claude. You see it days ahead, while you can still change something.
[site/img/week-v6.png or carousel/02.png]

**4/**
Every chat waiting on you, across every project, most urgent first. A permission prompt, a question, a plan to approve.

The moment one starts waiting you get a chime and a notification. Not the hour after.
[site/img/needs-v6.png]

**5/**
Your pull requests that need you, in the same list: checks failing, changes requested, review requested, ready to merge. It reads them with the GitHub CLI you already have.

No tab to open. No "did CI go red?"
[site/img/needs-v6.png, PR rows]

**6/**
Workflows: what each run cost, and what it would have cost with a cheaper model on the easy stages. Drawn as before and after, so you see the difference instead of reading about it.
[site/img/workflows-savings-v6.png]

**7/**
Skills too. It checks whether Claude can even see yours, and fixes are made in the pane: the old text and the new one side by side, written only when you press Save change.
[site/img/fix-v6.png]

**8/**
You can also just ask. "Where do my limits stand?" Claude answers from a read-only status tool, in the chat you're already in.
[a screenshot of that exchange; capture one from the demo]

**9/**
Free, MIT, and it runs on your computer. It reads Claude Code's own records on your computer. What it sends is listed line by line in SECURITY.md: prompts to Claude through your own account, what Claude asks the read-only status tool for (counts of what waits, and titles and short excerpts of waiting chats only after Claude Code asks you, unless you have allowed the tool yourself), and a notification to a web address only if you set one. Shares of the limit are estimates; the images use sample data.

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://tobebestme.vercel.app
https://github.com/vradulthub-cloud/tobebestme

Posts 2/, 3/ and 9/ run over 300 characters (2/ is about 395, 3/ about 320, 9/ about 880 with links, or about 850 under X's 23-character links), and standard X allows 280. For Bluesky and standard X, use the short versions below; 4/, 5/, 6/, 7/ and 8/ fit as written.

**2/ (short)**
ToBeBestMe is a free, open-source mod that runs inside Claude Code itself, not a separate app or account. It adds a pane beside the chat, a line above the prompt and a tool Claude answers from. No server, no sign-up, no API key.

**3/ (short)**
Your weekly limit, drawn as one week: a bar per day, stacked by project. A dashed line carries your pace forward.

"At this pace it runs out Sat 5:21 AM, about 33 hours before it resets."

You see it days ahead.

**9/ (short, install line)**
Free, MIT, and it runs on your computer.

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://tobebestme.vercel.app

**10/ (short, privacy line)**
The main things it sends, all in SECURITY.md: prompts to Claude through your account, what Claude asks the read-only status tool for, and a notification to a web address only if you set one. Limit shares are estimates; images use sample data.

https://github.com/vradulthub-cloud/tobebestme

---

## LinkedIn

**Published** 2026-11-03 and edited the same day to lead with the mod angle: https://www.linkedin.com/feed/update/urn:li:activity:7523496805129601024/

**Media:** `launch-hero.png` as the lead image (LinkedIn can't swap media on a published post).

**Post:**

I modded Claude Code.

Not a separate app. Not a browser tab. Not a service you sign up for. ToBeBestMe changes Claude Code itself, so everything I used to go looking for is now right where I work:

→ A pane beside the chat: my weekly limit drawn as one week, the exact time it runs out at my pace, and which projects spent it
→ Every chat across all my projects that's waiting on me, with a chime the moment one stops to ask
→ Pull requests that need me, what each workflow cost, and whether Claude can actually see my skills
→ A line above the prompt in every chat
→ And I can just ask Claude "where do my limits stand?", because the mod gives Claude a tool to answer from

No server, no account, no API key. It runs on your computer and reads Claude Code's own records, and reading sends nothing anywhere. What does leave, like prompts through your own account, is listed in SECURITY.md.

What surprised me most: Claude Code's mod API lets you change the interface itself. Draw panes. Add tools Claude can call. Hook into its notifications. So instead of building one more dashboard to check, I built the dashboard into Claude.

Free and open source. Install it from any Claude Code prompt:
/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

tobebestme.vercel.app
github.com/vradulthub-cloud/tobebestme

Screens show sample data. Independent project, not affiliated with Anthropic.

---

## Show HN

**Title:** Show HN: ToBeBestMe – a mod inside Claude Code for limits, waiting chats, costs

**Link:** https://github.com/vradulthub-cloud/tobebestme

**Maker comment (post it straight away):**

ToBeBestMe is a mod that runs inside Claude Code itself, not a separate app, service or account (it needs Claude Code 2.1.308 or later). There is no server, no sign-up and no API key, and it runs on your computer. It changes Claude Code's own interface: it adds a pane beside the chat in the desktop app and the terminal, a line above the prompt in every chat, and a short lobby in the mobile app.

I run Claude Code across several projects at once, and three things cost me time: not seeing which project spent a weekly limit until it was gone, chats blocked on a permission prompt in a window I wasn't looking at, and workflows whose cost I only learned afterwards. Claude Code shows where you are now; the mod adds the week by project, the run-out forecast and what is waiting. What's in the mod:

- The weekly limit as one drawing: each day stacked by project, the line of use so far, and a dashed line to where the pace lands. When that's early, it states the run-out time and the hours without Claude before the reset (in the sample: Sat 5:21 AM, about 33 hours).
- Chats waiting on you in any chat, most urgent first. When one starts waiting it fires one alert for that wait (on by default, and it can be turned off), using Claude Code's own notification channel and a chime.
- Your open pull requests that need you (checks failing, changes requested, review requested, merge conflicts, ready to merge), via `gh pr list`.
- Workflows: per-run cost, and what a cheaper model on some stages would have saved, drawn as the run against the run with the idea applied.
- A skills check-up. Claude's skill listing has limited room, and past it skills are sent as bare names; Claude Code reports that in /doctor and its debug log, not in the conversation. Fixes are made in the pane (it shows the setting now and after) and written only when you press Save.
- `mcp__tobebestme__status`, a read-only tool, so "where do my limits stand?" gets answered in the chat.

How it works, and its limits:

- It reads Claude Code's records in ~/.claude/projects (transcripts, workflow records, per-agent usage), `claude agents --json`, and `git status` in recent chat folders. It never opens .env or key files. Reading sends nothing anywhere.
- What leaves your computer: prompts to Claude through your own account (when you press Suggest more, Improve it or Fix description…, or draft a skill; a five-token check when the cheaper model came back empty, a handoff note before compaction, and lines added to a prompt when a limit is tight) and what Claude asks the status tool for (limits, costs, the busiest project's name and counts of what waits; the titles and short excerpts of the chats and pull requests waiting on you come only from its waiting topic, which Claude Code asks you about first unless you have allowed the tool yourself, and go to Claude like any tool result), and a notification's title and text to an https address you set, if you set one. SECURITY.md lists each read, write and send. The only thing sent to GitHub is `gh`'s own read queries, run on your account.
- Shares of the weekly limit are estimates at list prices, derived from the records. The limit is shared with claude.ai chat, which no local tool can see, so treat the numbers as a forecast, not a bill.
- The mod API is what made this possible without a separate app: it can draw a pane, set the prompt line, hook notifications, offer a tool, and show a toast. It also means the drawing surface is Claude Code's, so some things (like a text field on mobile) aren't there yet. The phone lobby is suggested-reply buttons only.
- The test kit in Claude Code's own mod tooling, including a test that presses every button on every tab. Releases ship SHA256SUMS and signed build provenance, and the mod checks its own files against the manifest that ships with them once a day (the checksums and provenance are what prove a download).

MIT. Not affiliated with Anthropic. Screenshots use a sample fixture, not real usage. I'd most like to hear where the run-out forecast is wrong for your usage pattern.

---

## r/ClaudeAI

**Title:** A free mod that runs inside Claude Code (not a separate app) and shows your weekly limit running out before it does

**Body:**

I made a mod: it runs inside Claude Code itself (not a separate app, site or account, and with no server, sign-up or API key) and adds a pane beside the chat, in the desktop app and the terminal. Across a few projects, three things are easy to miss:

1. The weekly limit can run out on a Saturday with no sign of which project ate it.
2. A chat can hit a permission prompt in another window and sit there for an hour.
3. A workflow can run long and you only see what it cost afterwards.

The pane answers all of it without leaving the chat:

- **Your week, drawn.** Each day stacked by project, a dashed line to where your pace lands, and if it runs out early, the exact time and how many hours you'd be without Claude before the reset. Press a day or a project to pick it out.
- **Everything waiting on you**, across all projects, most urgent first, with a chime and notification the moment one starts waiting. Open PRs that need you (failing checks, changes requested, ready to merge) show up in the same list if you have `gh` installed.
- **Workflow costs**, with what you'd have saved, shown as before and after.
- **Skills check-up.** It tells you if Claude can actually see your skills (the listing has limited room) and fixes show as now and after; nothing is written until you press Save change.
- A line above the prompt in every chat, and you can just ask Claude "where do my limits stand" and it answers from a status tool.

Free, MIT, and it all runs on your computer. It reads Claude Code's own records; SECURITY.md lists the few things it sends (prompts through your own account, what Claude asks the read-only status tool for, meaning counts of what waits and, after Claude Code asks you (unless you have allowed the tool yourself), titles and short excerpts of chats waiting on you, and a notification to an address you set, if you set one). Shares of the limit are estimates, and the GIF is sample data, not my projects.

Install, at a Claude Code prompt:

`/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`

Then `/tobebestme`. Repo: https://github.com/vradulthub-cloud/tobebestme

What do you still go looking for outside the chat? That's what I want to add next.

---

## Awesome lists

### Awesome Claude Code (hesreallyhim/awesome-claude-code, the main list)

Submit through the list's own issue form: https://github.com/hesreallyhim/awesome-claude-code/issues/new?template=recommend-resource.yml

- **Display Name:** ToBeBestMe
- **Category:** Mods. That section has two entries; Usage & Cost is crowded with usage dashboards and status lines.
- **Link:** https://github.com/vradulthub-cloud/tobebestme
- **Author Name:** vradulthub-cloud (or your name)
- **Author Link:** https://github.com/vradulthub-cloud
- **Description** (476 of 500 characters):

  Mod that runs inside Claude Code itself (no server, account or API key): adds a pane in the desktop app and terminal, and a line above the prompt in every chat. It forecasts when the weekly limit will run out at the current pace and splits the week by project, lists chats across all projects that are waiting on a permission prompt, question or plan, and shows pull requests that need attention, what each workflow run cost, and whether every skill fits in the skill listing.


### Awesome Claude Code Mods (karanb192/awesome-claude-code-mods)

**The catalog:** nothing to submit. Its scanner lists public repositories whose `hooks/hooks.json` has a `modules` key, and every three hours it checks repositories tagged `claude-code-plugin` (ToBeBestMe has that topic) that were pushed since its last search. The repository already has the topic `claude-code-mod`, so a mod usually gets listed within a few hours of its next push.

**Featured nomination** (Karan's hand-picked selection, shown at the top of its README; self-nominations are welcome): https://github.com/karanb192/awesome-claude-code-mods/issues/new?template=featured-nomination.yml

- **Mod URL:** https://github.com/vradulthub-cloud/tobebestme
- **What task does it help with?**

  A mod that runs inside Claude Code itself, not a separate app or service, for people who run Claude Code across several projects at once. Without leaving the chat it answers: when will the weekly limit run out at this pace, and which projects spent it; which chats are waiting on a permission prompt, a question or a plan; and what each workflow run cost and what a cheaper model would have saved. It also lists open pull requests that need attention and checks whether every skill fits in Claude's skill listing. It changes Claude Code's own interface: a pane in the desktop app and the terminal, a line above the prompt in every chat, and a read-only status tool Claude can call. No server, no account, no API key.

- **Evidence that it works:**

  Recording: the GIF at the top of the README (https://github.com/vradulthub-cloud/tobebestme#readme) and the 88-second tour on https://tobebestme.vercel.app. Both use a sample fixture, not real usage.
  Install: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`, then `/tobebestme`. Needs Claude Code 2.1.308 or later.
  Checked on Claude Code 2.1.310 on macOS, in the desktop app and the terminal; the test kit passes in `claude plugin test`.
  Limitations: covers this computer only (not cloud chats or claude.ai chat); the split of the weekly limit by project is an estimate; replying to a waiting chat uses the desktop app's own session tools, which are not part of the documented mod interface and may change; the phone lobby offers suggested replies only.

- **Access details:**

  Reads Claude Code's records in `~/.claude/projects`, `claude agents --json`, `git status` in recent chat folders, skill and command files, and two skill settings from Claude Code's settings files; it never opens `.env` or key files. Writes a handoff note before compaction (`.claude/tobebestme/handoff.md`), reports the user saves (`~/.claude/tobebestme/reports/`) and the mod store; skill descriptions, skill settings and CLAUDE.md rules are written only when the user presses Save change; a new skill is saved only when the user presses Save skill or Save /long-run; its own options are written to Claude Code's settings when the user changes one. Runs `gh auth status` and `gh pr list` when `gh` is installed and signed in, `git status` with optional locks and fsmonitor off, and `osascript` or `notify-send` for notifications. Sends a reply to another chat, or archives one, only when the user presses a button and confirms. Sends prompts to Claude through the user's own account (Suggest more, Improve it, Fix description… and skill drafts; the handoff note; a five-token check) and a notification to an `https://` address only if one is set (the alert when a chat waits is on by default and also shows on the computer). Offers a read-only tool, `mcp__tobebestme__status`, which returns limits, context, costs, the busiest project's name, counts of what waits and, only from its waiting topic (Claude Code asks first, unless the user has allowed the tool), titles, project names and a short excerpt. Full table: https://github.com/vradulthub-cloud/tobebestme/blob/main/SECURITY.md

- **Your relationship to the mod:** Author.

---

## Alt text

- **launch-hero.png:** "A mod inside Claude Code. Know where things stand." above the ToBeBestMe pane: the weekly limit at 82% drawn as a week, with a bar for each day stacked by project, a line of use, a dashed line to a run-out on Saturday at 5:21 AM, then a hatched stretch to the Sunday reset.
- **social-card.png and social-card-v6.png:** "A mod inside Claude Code. Know where things stand." with the line "Not a separate app, service or account. No server, no sign-up, no API key." beside the week drawing: a bar for each day stacked by six projects, an orange line of use, a dashed line to the run-out and a hatched stretch reading about 33 hours without Claude. Marked as sample data.
- **carousel/01.png:** See where your week went. A bar for each day, stacked by six projects, the line of use, and a dashed line to where your pace runs out.
- **carousel/02.png:** Know before you run out. A weekly limit at 82% with two days to go, forecast to run out Saturday at 5:21 AM, with a hatched stretch for the roughly 33 hours without Claude.
- **carousel/03.png:** The chat that needs you most, first. A lead card for Release, which needs permission to run npm publish, then four more waiting chats, including Checkout redesign with Ship it, Hold off and Reply buttons.
- **carousel/04.png:** One line, always in view. The line above the prompt: context 85% in red, the weekly limit at 82% in amber and the weekly Opus limit at 38%.
- **carousel/05.png:** Know what a change would save. Two bars, the week as run (about 124%) and with half the Opus work on Sonnet (about 114%), with about 10 points back; the run-out moves from Saturday 5:21 AM to Saturday 1:15 PM.
- **carousel/06.png:** Fix it in the pane, not the chat. A new description for the notes skill, shown as now (none) and after, with Save change and Cancel buttons.
- **carousel/07.png:** Free, open source, one line to install, with the install command and four facts: every project at once, keyboard first, tested where it draws (every button pressed, every view checked), MIT licensed (free to use and change).
- **site/img/week-v6.png:** The weekly limit at 82% drawn as one week: a stacked bar per day, an orange line of use, a dashed projection to a run-out on Saturday at 5:21 AM, and a hatched stretch for about 33 hours without Claude before the Sunday 2:00 PM reset.
- **site/img/now-v6.png:** The lead card for the chat that needs you most, with the permission it is waiting on and the buttons to answer it.
- **site/img/needs-v6.png:** The Needs you list: waiting chats from several projects, most urgent first, each with its reply buttons, and pull requests that need review or have failing checks.
- **site/img/band-v6.png:** The line above the prompt: a headline of what needs you, then small meters for context and each weekly limit.
- **site/img/pane-v6.png:** The ToBeBestMe pane open beside a Claude Code chat.
- **site/img/savings.png and standout-v6.png:** Two bars, the week as run and the week with half the Opus work on Sonnet, with the points given back.
- **site/img/workflows-v6.png:** A running workflow with its stages, each agent, its model and cost, and the controls beside them.
- **site/img/workflows-savings-v6.png:** Workflow cost as run against with the ideas applied, with what each idea would have saved.
- **site/img/skills-v6.png:** The Skills tab: the skill listing at 95% of its room, with three ways to make room.
- **site/img/fix-v6.png:** A skill's description shown as now and after, with Save change and Cancel.
- **demo.mp4 and demo.gif:** Three views of the real pane: the week drawing, Wednesday pressed, then the storefront project picked out across the week.
- **overview-v7.mp4:** An 88-second tour of the pane on sample data: the Saturday limit message, a caption saying ToBeBestMe is a mod that runs inside Claude Code itself, the week by project, the run-out forecast, the lead card, the line above the prompt, then the install command. Captions are in `overview-v7.vtt`.
