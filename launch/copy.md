# ToBeBestMe launch copy (v2)

The angle: ToBeBestMe is the whole dashboard for Claude Code, so you never leave Claude to know where things stand. It opens with the pain every heavy user knows (the limit that dies on Saturday, the chat that sat waiting an hour, the workflow that quietly spent a week) and shows each answer instead of describing it. Written in the first person; change anything that isn't how you'd say it.

Link everywhere: https://github.com/vradulthub-cloud/tobebestme
Site: https://tobebestme.vercel.app
Install: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`

Figures in every image and every number below come from the one sample fixture (storefront, ledger-api and so on): 82% of the weekly limit, runs out Sat 5:21 AM, 32 h 38 min without Claude before it resets Sun 2:00 PM. None of it is real usage.

---

## Taglines

Pick one for the repo description, bios and the site header.

1. Never leave Claude to know where things stand.
2. The whole Claude Code dashboard, inside Claude Code.
3. Your week, your waiting chats, your pull requests, your workflows. One place.
4. It always runs out on a Saturday. Now you'll know on Monday.
5. Know before you run out.
6. A free pane for the questions Claude Code makes you leave to answer.

Short form for a bio line: "Free, open-source Claude Code mod: limits, waiting chats, PRs and workflows in one pane."

---

## Images and video, at a glance

From `site/img/` (the same sample data, cropped for the web):
- `week-v2.png`: the week drawing. Bars by project, line of use, dashed run-out, hatched hours without Claude.
- `now.png` and `needs.png`: the Now card and the list of chats waiting.
- `band-v2.png`: the line above the prompt.
- `pane-v2.png`: the whole pane beside a chat.
- `savings.png`, `standout.png`: a saving drawn as before and after.
- `workflows.png`, `workflows-savings.png`: a run, and what it cost against what it could have cost.
- `skills.png`, `fix.png`: the skills check-up, and a fix shown as now and after.
- `overview-v2.mp4` (poster `overview-poster-v2.png`, captions `overview-v2.vtt`): the 88-second tour.
- `social-card.png`: the repository's social preview.

From `launch/out/`:
- `launch-hero.png`: single image for X, Bluesky, LinkedIn.
- `carousel/01.png` to `07.png`: LinkedIn document, or X four-image post (use 1, 2, 3, 7).
- `demo.mp4` and `demo.gif`: the pane in use. GIF for Reddit and the README.
- `video/overview.mp4`, `band.mp4`, `runway.mp4`, `savings.mp4`, `privacy.mp4`, `install.mp4` (each with a `-web.mp4`, a `-poster.png` and captions): one clip per idea, for replies and for the thread.
- `demo-frame-0.png` to `2.png`: stills from the demo.

---

## X / Bluesky thread

### Three hooks for post 1 (pick one)

**Hook A, the Saturday**
It's Saturday morning. "Weekly limit reached. Resets Sunday at 2:00 PM."

32 h 38 min without Claude, and you didn't see it coming.

I built a pane inside Claude Code that shows you on Monday.
[launch/out/video/runway.mp4, or carousel/02.png]

**Hook B, the waiting chat**
A Claude Code chat asked me for permission an hour ago.

I was in another project. Nothing told me.

So I built the place where everything waiting on you shows up, with a chime the moment it starts.
[site/img/now.png]

**Hook C, the quiet burn**
One workflow. Hundreds of agents. I found out what it cost after the fact.

ToBeBestMe shows what each run cost, what you'd have saved, and draws the two weeks side by side.
[site/img/workflows-savings.png]

(My pick: A. It is the pain everyone has felt, and it hands the reader the image.)

### The thread

**1/** (use the hook you picked)

**2/**
ToBeBestMe is a free, open-source mod for Claude Code. It's the dashboard you keep leaving Claude to build in your head: a pane beside the chat, a line above the prompt, and a lobby on your phone.

The point: you never leave Claude to know where things stand.
[site/img/pane-v2.png]

**3/**
Your weekly limit, drawn as one week. Every day is a bar stacked by project. A dashed line carries your pace forward:

"At this pace it runs out Sat 5:21 AM, 32 h 38 min before it resets."

The hatched stretch is those 32 h 38 min with no Claude. You see it days ahead, while you can still change something.
[site/img/week-v2.png or carousel/02.png]

**4/**
Every chat waiting on you, across every project, most urgent first. A permission prompt, a question, a plan to approve.

The moment one starts waiting you get a chime and a notification. Not the hour after.
[site/img/needs.png]

**5/**
Your pull requests that need you, in the same list: checks failing, changes requested, review requested, ready to merge. It reads them with the GitHub CLI you already have.

No tab to open. No "did CI go red?"
[site/img/needs.png, PR rows]

**6/**
Workflows: what each run cost, and what it would have cost with a cheaper model on the easy stages. Drawn as before and after, so you see the difference instead of reading about it.
[site/img/workflows-savings.png]

**7/**
Skills too. It checks whether Claude can even see yours, and fixes are made in the pane: the old text and the new one side by side, written only when you press Save change.
[site/img/fix.png]

**8/**
You can also just ask. "Where do my limits stand?" Claude answers from a read-only status tool, in the chat you're already in.
[a screenshot of that exchange; capture one from the demo]

**9/**
Free, MIT, local. It reads Claude Code's own records on your computer. What it sends is listed line by line in SECURITY.md: prompts to Claude through your own account, and a notification to a web address only if you set one. Shares of the limit are estimates; the images use sample data.

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://tobebestme.vercel.app
https://github.com/vradulthub-cloud/tobebestme

For Bluesky, the same posts work; trim 3/ and 5/ if a post runs over 300 characters.

---

## LinkedIn

**Suggested media:** `launch-hero.png` as the lead image, or `carousel/01.png` to `07.png` as a document post. Video alternative: `launch/out/video/overview.mp4`.

**Post:**

My weekly Claude Code limit ran out on a Saturday morning. Resets Sunday at 2:00 PM. That's 32 h 38 min without Claude, in the middle of a build.

The part that stung wasn't the limit. It was that nothing had told me, and I couldn't say which of my six projects had spent it.

That week I also had a chat sitting on a permission prompt for an hour in a window I wasn't looking at, and a workflow that cost far more than I'd guessed. Three different problems with one cause: the information existed, but I had to leave Claude to go and find it.

So I built ToBeBestMe, a free, open-source mod for Claude Code. It's the complete dashboard, inside Claude:

- Your weekly limit drawn as one week: each day's work stacked by project, where your pace lands, the exact time it runs out, and the hours you'd be without Claude before the reset.
- Every chat waiting on you across all your projects, most urgent first, with a chime and a notification the moment one starts waiting.
- Your pull requests that need you: checks failing, changes requested, review requested, ready to merge.
- Workflows: what each run cost and what you would have saved, drawn as before and after.
- A skills check-up, with fixes made in the pane and written only when you press Save change.
- A weekly report card you can save and post.

It's a pane beside the chat in the desktop app and the terminal, a line above the prompt in every session, and a lobby on your phone. You can also just ask Claude "where do my limits stand?" and it answers from a status tool.

Some choices I made on purpose. It reads Claude Code's own records on your own computer, and reading sends nothing anywhere. What does leave (prompts to Claude through your own account, a notification if you give it an address) is listed line by line in SECURITY.md. Shares of the limit are estimates, and every image here uses sample data, not my projects.

What surprised me while building it: Claude Code's mod API is good enough that this didn't need a separate app or a browser tab. The whole thing lives where the work already is, which turned out to be the entire idea.

Install it at a Claude Code prompt:
/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://tobebestme.vercel.app
https://github.com/vradulthub-cloud/tobebestme

If you run Claude Code across several projects, I'd like to know what you still leave the chat to check.

ToBeBestMe is an independent project, not affiliated with Anthropic.

---

## Show HN

**Title:** Show HN: ToBeBestMe – a Claude Code pane for limits, waiting chats and costs

(HN cuts titles at 80 characters; this is 76.)

**Link:** https://github.com/vradulthub-cloud/tobebestme

**Suggested media:** none inline (HN has none). Put `demo.gif` at the top of the README and `social-card.png` as the social preview. Have `site/img/week-v2.png` ready if someone asks what it looks like.

**Maker comment (post it straight away):**

I run Claude Code across several projects at once, and three things kept costing me: a weekly limit that ran out on a Saturday with no warning and no idea which project spent it, chats blocked on a permission prompt in a window I wasn't looking at, and workflows whose cost I only learned afterwards. /usage tells you where you are now. It doesn't attribute the week to projects, project where your pace lands, or tell you what's waiting.

ToBeBestMe is a mod for Claude Code (it needs 2.1.308 or later). It adds a pane beside the chat in the desktop app and the terminal, a line above the prompt in every session, and a short lobby in the mobile app. What's in it:

- The weekly limit as one drawing: each day stacked by project, the line of use so far, and a dashed line to where the pace lands. When that's early, it states the run-out time and the hours without Claude before the reset (in the sample: Sat 5:21 AM, 32 h 38 min).
- Chats waiting on you in any session, most urgent first. When one starts waiting it fires one alert for that wait, using Claude Code's own notification channel and a chime.
- Your open pull requests that need you (checks failing, changes requested, review requested, merge conflicts, ready to merge), via `gh pr list`.
- Workflows: per-run cost, and what a cheaper model on some stages would have saved, drawn as the run against the run with the idea applied.
- A skills check-up. Claude's skill listing has limited room, and past it skills are sent as bare names without a warning. Fixes are made in the pane (it shows the setting now and after) and written only when you press Save.
- `mcp__tobebestme__status`, a read-only tool, so "where do my limits stand?" gets answered in the chat.

How it works, and its limits:

- It reads Claude Code's records in ~/.claude/projects (transcripts, workflow records, per-agent usage), `claude agents --json`, and `git status` in recent session folders. It never opens .env or key files. Reading sends nothing anywhere.
- What leaves your computer: prompts to Claude through your own account (only for buttons that say so, a five-token check when the cheaper model came back empty, a handoff note before compaction, and lines added to a prompt when a limit is tight) and a notification's title and text to an https address you set, if you set one. SECURITY.md lists each read, write and send. The only thing sent to GitHub is `gh`'s own read queries, run on your account.
- Shares of the weekly limit are estimates at list prices, derived from the records. The limit is shared with claude.ai chat, which no local tool can see, so treat the numbers as a forecast, not a bill.
- The mod API is what made this possible without a separate app: it can draw a pane, set the prompt line, hook notifications, offer a tool, and show a toast. It also means the drawing surface is Claude Code's, so some things (like a text field on mobile) aren't there yet. The phone lobby is suggested-reply buttons only.
- 107 tests in Claude Code's mod test kit, including one that presses every button on every tab. Releases ship SHA256SUMS and signed build provenance, and the mod checks its own files against its release once a day.

MIT. Not affiliated with Anthropic. Screenshots use a sample fixture, not real usage. I'd most like to hear where the run-out forecast is wrong for your usage pattern.

---

## r/ClaudeAI

**Flair suggestion:** Built with Claude / Productivity (whichever the sub offers).

**Suggested media:** `demo.gif` inline, plus `site/img/week-v2.png` and `site/img/needs.png` in a gallery if the post allows.

**Title:** I got tired of finding out my weekly limit was gone on Saturday, so I made a free Claude Code mod that shows it coming

**Body:**

Three things kept happening to me with Claude Code across a few projects:

1. The weekly limit ran out on a Saturday and I had no idea which project ate it.
2. A chat hit a permission prompt in another window and sat there for an hour.
3. A workflow ran long and I only saw what it cost afterwards.

So I made a pane that sits beside the chat (desktop app and terminal) and answers all of it without leaving Claude:

- **Your week, drawn.** Each day stacked by project, a dashed line to where your pace lands, and if it runs out early, the exact time and how many hours you'd be without Claude before the reset. Press a day or a project to pick it out.
- **Everything waiting on you**, across all projects, most urgent first, with a chime and notification the moment one starts waiting. Open PRs that need you (failing checks, changes requested, ready to merge) show up in the same list if you have `gh` installed.
- **Workflow costs**, with what you'd have saved, shown as before and after.
- **Skills check-up.** It tells you if Claude can actually see your skills (the listing has limited room) and fixes show as now and after; nothing is written until you press Save change.
- A line above the prompt in every session, and you can just ask Claude "where do my limits stand" and it answers from a status tool.

Free, MIT, and it all runs on your computer. It reads Claude Code's own records; SECURITY.md lists the few things it sends (prompts through your own account, and a notification to an address you set, if you set one). Shares of the limit are estimates, and the GIF is sample data, not my projects.

Install, at a Claude Code prompt:

`/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`

Then `/tobebestme`. Repo: https://github.com/vradulthub-cloud/tobebestme

What do you still leave Claude to check? That's what I want to add next.

---

## Awesome lists

### Awesome Claude Code (hesreallyhim/awesome-claude-code, the main list)

**When:** on or after **Sunday 9 November 2026**. The list only takes a project 14 days after its first commit (26 October), with commits since, or once it has 100 stars. Earlier submissions are closed automatically.

**How:** you fill in the issue form yourself, in the browser: https://github.com/hesreallyhim/awesome-claude-code/issues/new?template=recommend-resource.yml. The list doesn't accept pull requests, the `gh` CLI, or recommendations made by an agent, and breaking that can get you restricted from the repository. One recommendation at a time.

- **Display Name:** ToBeBestMe
- **Category:** Mods. That section has two entries; Usage & Cost is crowded with usage dashboards and status lines.
- **Link:** https://github.com/vradulthub-cloud/tobebestme
- **Author Name:** vradulthub-cloud (or your name)
- **Author Link:** https://github.com/vradulthub-cloud
- **Description** (437 of 500 characters):

  Claude Code mod that adds a dashboard pane in the desktop app and terminal, and a line above the prompt in every session. It forecasts when the weekly limit will run out at the current pace and splits the week by project, lists chats across all projects that are waiting on a permission prompt, question or plan, and shows pull requests that need attention, what each workflow run cost, and whether every skill fits in the skill listing.

- **Checklist:** tick the first five only once each is true: read the list and check nothing on it is too similar, and open every link. Leave the last box unchecked. It's a trap for people who tick everything without reading.

### Awesome Claude Code Mods (karanb192/awesome-claude-code-mods)

**The catalogue:** nothing to submit. Its scanner lists public repositories whose `hooks/hooks.json` has a `modules` key, and every three hours it checks repositories tagged `claude-code-plugin` (ToBeBestMe has that topic) that were pushed since its last search. Adding the topic `claude-code-mod` usually gets a mod listed within a few hours of its next push.

**Featured nomination** (Karan's hand-picked selection, shown at the top of its README; self-nominations are welcome): https://github.com/karanb192/awesome-claude-code-mods/issues/new?template=featured-nomination.yml

- **Mod URL:** https://github.com/vradulthub-cloud/tobebestme
- **What task does it help with?**

  For people who run Claude Code across several projects at once. Without leaving the session it answers: when will the weekly limit run out at this pace, and which projects spent it; which chats are waiting on a permission prompt, a question or a plan; and what each workflow run cost and what a cheaper model would have saved. It also lists open pull requests that need attention and checks whether every skill fits in Claude's skill listing. It's a pane in the desktop app and the terminal, a line above the prompt in every session, and a read-only status tool Claude can call.

- **Evidence that it works:**

  Recording: the GIF at the top of the README (https://github.com/vradulthub-cloud/tobebestme#readme) and the 88-second tour on https://tobebestme.vercel.app. Both use a sample fixture, not real usage.
  Install: `/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme`, then `/tobebestme`. Needs Claude Code 2.1.308 or later.
  Checked on Claude Code 2.1.310 on macOS, in the desktop app and the terminal; 107 tests pass in `claude plugin test`.
  Limitations: covers this computer only (not cloud sessions or claude.ai chat); the split of the weekly limit by project is an estimate; replying to a waiting chat needs the desktop app; the phone lobby offers suggested replies only.

- **Access details:**

  Reads Claude Code's records in `~/.claude/projects`, `claude agents --json`, `git status` in recent session folders, skill and command files, and two skill settings from Claude Code's settings files; it never opens `.env` or key files. Writes a handoff note before compaction (`.claude/tobebestme/handoff.md`), reports the user saves (`~/.claude/tobebestme/reports/`) and the mod store; skill descriptions, skill settings and CLAUDE.md rules are written only when the user presses Save change. Runs `gh auth status` and `gh pr list` when `gh` is installed and signed in, and `osascript` or `notify-send` for notifications. Sends prompts to Claude through the user's own account (buttons that say so, the handoff note, a five-token check) and a notification to an `https://` address only if one is set. Offers a read-only tool, `mcp__tobebestme__status`. Full table: https://github.com/vradulthub-cloud/tobebestme/blob/main/SECURITY.md

- **Your relationship to the mod:** Author.

---

## Alt text

- **launch-hero.png:** "Never leave Claude to know where things stand." beside the ToBeBestMe pane: the weekly limit at 82% drawn as a week, with a bar for each day stacked by project, a line of use, a dashed line to a run-out on Saturday at 5:21 AM, then a hatched stretch to the Sunday reset.
- **social-card.png:** The ToBeBestMe name beside the week drawing: a bar for each day stacked by six projects, an orange line of use, a dashed line to the run-out and a hatched stretch reading 32 h 38 min without Claude.
- **carousel/01.png:** See where your week went. A bar for each day, stacked by six projects, the line of use, and a dashed line to where your pace runs out.
- **carousel/02.png:** Know before you run out. A weekly limit at 82% with two days to go, forecast to run out Saturday at 5:21 AM, with a hatched stretch for the 32 h 38 min without Claude.
- **carousel/03.png:** The chat that needs you most, first. A Now card for Release, which needs permission to run npm publish, then four more waiting chats, including Checkout redesign with Ship it, Hold off and Reply buttons.
- **carousel/04.png:** One line, always in view. The line above the prompt: context 85% in red, the weekly limit at 82% in amber and the weekly Opus limit at 38%.
- **carousel/05.png:** Know what a change would save. Two bars, the week as run (about 124%) and with half the Opus work on Sonnet (about 114%), with about 10 points back; the run-out moves from Saturday 5:21 AM to Saturday 1:15 PM.
- **carousel/06.png:** Fix it in the pane, not the chat. A new description for the notes skill, shown as now (none) and after, with Save change and Cancel buttons.
- **carousel/07.png:** Free, open source, one line to install, with the install command and four facts: every project at once, keyboard first, tested where it draws, MIT licensed.
- **site/img/week-v2.png:** The weekly limit at 82% drawn as one week: a stacked bar per day, an orange line of use, a dashed projection to a run-out on Saturday at 5:21 AM, and a hatched stretch for 32 h 38 min without Claude before the Sunday 2:00 PM reset.
- **site/img/now.png:** A Now card for the chat that needs you most, with the permission it is waiting on and the buttons to answer it.
- **site/img/needs.png:** The Needs you list: waiting chats from several projects, most urgent first, each with its reply buttons, and pull requests that need review or have failing checks.
- **site/img/band-v2.png:** The line above the prompt: a headline of what needs you, then small meters for context and each weekly limit.
- **site/img/pane-v2.png:** The ToBeBestMe pane open beside a Claude Code chat.
- **site/img/savings.png and standout.png:** Two bars, the week as run and the week with half the Opus work on Sonnet, with the points given back.
- **site/img/workflows.png:** A running workflow with its stages, each agent, its model and cost, and the controls beside them.
- **site/img/workflows-savings.png:** Workflow cost as run against with the ideas applied, with what each idea would have saved.
- **site/img/skills.png:** The Skills tab: the skill listing at 95% of its room, with three ways to make room.
- **site/img/fix.png:** A skill's description shown as now and after, with Save change and Cancel.
- **demo.mp4 and demo.gif:** Three views of the real pane: the week drawing, Wednesday pressed, then the storefront project picked out across the week.
- **overview-v2.mp4:** An 88-second tour of the pane on sample data: the Saturday limit message, the week by project, the run-out forecast, the Now card, the line above the prompt, then the install command. Captions are in `overview-v2.vtt`.

## Notes

- The images use the test suite's sample data (storefront, ledger-api and so on), drawn from the mod's real output. None of your own projects appear. Say "sample data" in the post whenever a figure appears.
- Check the carousel and `launch-hero.png` against the current build before posting: the `site/img` set (the `-v2` files) is the newer one, and the hero should show the 1.5.0 pane. Re-render if they differ.
- Never mention 5-hour limits; they no longer exist and 1.5.0 removed them.
- Timing and order are in STRATEGY.md: Show HN at 7:00 AM PST, r/ClaudeAI at 8:00, X and Bluesky at 8:30, LinkedIn at 9:30. Never ask anyone to upvote or star.
- The repository must be public first (the install command and attestation both need it).
- Use https://tobebestme.vercel.app as the site link everywhere. Do not describe anything as used or loved by anyone yet; there are no users to quote.
- On Show HN, answer questions plainly and early, and lead with limits (estimates, claude.ai chat is invisible to it) before anyone has to ask.
- Keep emoji to none; a single one on LinkedIn is the most any of this wants.
