# ToBeBestMe launch copy

Ready to paste. Written in the first person; change anything that isn't how you'd say it.
Link everywhere: https://github.com/vradulthub-cloud/tobebestme (make the repository public first).

Images, in `launch/out/`:
- `launch-hero.png` for a single-image post (X, LinkedIn, Bluesky)
- `carousel/01.png` to `07.png` for a LinkedIn document post or an X four-image post (use 1, 2, 3, 7)
- the landing page, once it's live: https://vradulthub-cloud.github.io/tobebestme/
- `demo.mp4` for X and LinkedIn video, `demo.gif` for the README and Reddit
- `social-card.png` as the repository's social preview (Settings › General › Social preview)

---

## X / Bluesky thread

**1/**
Where did my Claude Code week go?

I kept hitting my weekly limit on Saturday with no idea which project had spent it. So I built a pane inside Claude Code that draws the week as one picture: each day by project, and whether you'll make it to the reset.
[carousel/01.png]

**2/**
Every day is a bar stacked by project, each in a colour that stays put everywhere. An orange line climbs through the week as you use it.

Press a day to see what it used. Pick a project to follow it through the week.
[demo.mp4]

**3/**
Then the forecast. A dashed line carries your pace to where it lands, and when it would run out if that's early:

"At this pace it runs out Sat 5:21 AM, 32 h 38 min before it resets."

The hatched stretch after it is the 32 h 38 min you'd spend without Claude. You find out days ahead, while there's still time to change course.
[carousel/02.png]

**4/**
The chat that needs you most is a card of its own, "Now"; the rest of the waiting chats follow, with the buttons the chat offered.

And savings are drawn: the week as you ran it against the week with half the Opus work on Sonnet, about 10 points back. The run-out moves from Sat 5:21 AM to Sat 1:15 PM. Fixes are made in the pane, with now and after shown, and nothing is written until you press Save change.
[carousel/03.png]

**5/**
Free and open source (MIT). It reads Claude Code's own records on your computer. What it sends is listed in SECURITY.md: prompts to Claude through your own account, and notifications to a web address you set. Shares of the limit are estimates; the screenshots use sample data.

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://vradulthub-cloud.github.io/tobebestme/

---

## LinkedIn

I kept hitting my weekly Claude limit on a Saturday morning, with no idea which of my projects had spent it. So I built something to answer that, and I'm sharing it today.

ToBeBestMe is a free mod for Claude Code. It opens a pane beside the chat that answers the first questions of the day:

• Where did my week go? One drawing: each day is a bar stacked by project, with the line of use so far. Press a day or a project to pick it out.
• Whether you'll make it to the reset. A dashed line shows where your pace lands, and the hours you'd be without Claude if it runs out early.
• What's waiting for me? The chat that needs you most is a card of its own; the rest of the chats that stopped for a permission, a question or a plan follow, with buttons to answer from one place.
• What would a change save? Savings are drawn as the week as run against the week with the idea applied, with the points it gives back. And fixes are made in the pane, shown as now and after, and written only when you press Save change.

It runs in the terminal and the Claude desktop app, and it's checked by 103 behaviour tests and 155 rendering tests at four pane widths. It reads Claude Code's own records on your computer; SECURITY.md lists the little it sends. Shares of the limit are estimates, and the images use sample data.

Install it at a Claude Code prompt:
/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://vradulthub-cloud.github.io/tobebestme/

I'd love to hear what you'd want it to show next.

ToBeBestMe is an independent project, not affiliated with Anthropic.

[carousel/01.png to 07.png as a document, or demo.mp4]

---

## Show HN

**Title:** Show HN: ToBeBestMe, see where your Claude Code week went, by project

**Link:** https://github.com/vradulthub-cloud/tobebestme

**Maker comment (post it straight away):**
I run Claude Code across several projects at once, and I kept hitting my weekly limit with no idea which project had spent it. /usage tells you where you are, and attributes plan usage to skills, subagents, plugins and MCP servers, but not to projects, and not where your pace is heading.

ToBeBestMe is a Claude Code mod that draws a pane beside the chat and a line above the prompt:

- the weekly window drawn as one picture: each day stacked by project, from Claude Code's own records in ~/.claude/projects, the line of use so far, and a dashed line to where the pace lands
- each limit's forecast: the run-out time when that's early, and the hours you'd be without Claude before the reset
- chats waiting on you in other sessions, the most urgent as a card of its own, with their reply buttons
- what a change would save (helpers on Haiku, some Opus on Sonnet), drawn as the week as run against the week with the idea applied
- fixes (a skill's description, skill settings, a CLAUDE.md rule) made in the pane: it shows now and after, and writes only on Save change

It reads everything locally. What it sends is prompts to Claude through your own account (buttons that say so, a five-token check when the cheaper model came back empty, a handoff note before compaction, and lines added to a prompt when limits run tight) and a notification's title and text to a web address you set. It also shows system notifications through osascript or notify-send. SECURITY.md lists each one. Shares of the weekly limit are estimates at list prices, and the limit is shared with claude.ai chat, which no local tool sees. Screenshots use sample data.

Tests: 103 in Claude Code's mod test kit, plus 155 Playwright tests that render every view at four widths and check overflow, contrast and type size. MIT. Not affiliated with Anthropic.

---

## r/ClaudeAI

**Title:** I built a Claude Code mod that shows where your weekly limit went, by project, and when it'll run out

**Body:**
I kept hitting my weekly limit on Saturday mornings without knowing which project spent it, so I built this. It's a pane inside Claude Code, in the terminal and the desktop app:

- the week as one drawing, each day stacked by project: press a day or a project to pick it out
- a dashed line shows where your pace lands by the reset, and the stretch you'd be without Claude if it runs out early
- every chat waiting for you across sessions, the most urgent first, answerable from one place
- suggestions are drawn as the week as run against the week with the idea applied; fixes are shown as now and after, and written only when you press Save change

It reads Claude Code's own records on your computer. Shares of the limit are estimates, and the GIF uses sample data. MIT. Install at a Claude Code prompt:

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

then /tobebestme. I'd love feedback on what's missing.

[demo.gif]

---

## Alt text

- **launch-hero.png:** "See where your week went." Below it, the ToBeBestMe Home pane: 4 chats waiting, the weekly limit at 82% drawn as a week with a bar for each day stacked by project, a line of use and a dashed line to a run-out on Saturday at 5:21 AM, then a hatched stretch to the reset.
- **social-card.png:** "See where your week went." beside the week drawing: a bar for each day stacked by six projects, an orange line of use, a dashed line to the run-out and a hatched stretch reading 32 h 38 min without Claude.
- **carousel/01.png:** See where your week went. One drawing: a bar for each day, stacked by six projects, the line of use, and a dashed line to where your pace runs out.
- **carousel/02.png:** Know before you run out. A weekly limit at 82% with two days to go, forecast to run out Saturday at 5:21 AM, with a hatched stretch for the 32 h 38 min without Claude.
- **carousel/03.png:** The chat that needs you most, first. The Needs you list leads with a Now card for Release, which needs permission to run npm publish, then lists four more waiting, including Checkout redesign with Ship it, Hold off and Reply buttons.
- **carousel/04.png:** One line, always in view. The line above the prompt: context 85% in red, the weekly limit at 82% in amber and the weekly Opus limit at 38%.
- **carousel/05.png:** Know what a change would save. Two bars, the week as run (about 124%) and with half the Opus work on Sonnet (about 114%), with about 10 points back; the run-out moves from Saturday 5:21 AM to Saturday 1:15 PM.
- **carousel/06.png:** Fix it in the pane, not the chat. A new description for the notes skill, shown as now (none) and after, with Save change and Cancel buttons.
- **carousel/07.png:** Free, open source, one line to install, with the install command and four facts: every project at once, keyboard first, tested where it draws, MIT licensed.
- **demo:** Three views of the real pane: the week drawing, Wednesday pressed, then the storefront project picked out across the week.

## Notes

- The images use the test suite's sample data (storefront, ledger-api and so on), drawn from the mod's real output. None of your own projects appear.
- Timing and order are in STRATEGY.md: Show HN at 7:00 AM PST, r/ClaudeAI at 8:00, X and Bluesky at 8:30, LinkedIn at 9:30. Never ask anyone to upvote.
- Swap in https://vradulthub-cloud.github.io/tobebestme/ only once the page is deployed; until then use the GitHub link.
