# ToBeBestMe launch copy

Ready to paste. Written in the first person; change anything that isn't how you'd say it.
Link everywhere: https://github.com/vradulthub-cloud/tobebestme (make the repository public first).

Images, in `launch/out/`:
- `launch-hero.png` for a single-image post (X, LinkedIn, Bluesky)
- `carousel/01.png` to `06.png` for a LinkedIn document post or an X four-image post (use 1, 2, 3, 6)
- the landing page, once it's live: https://vradulthub-cloud.github.io/tobebestme/
- `demo.mp4` for X and LinkedIn video, `demo.gif` for the README and Reddit
- `social-card.png` as the repository's social preview (Settings › General › Social preview)

---

## X / Bluesky thread

**1/**
Where did my Claude Code week go?

I kept hitting my weekly limit on Saturday with no idea which project had spent it. So I built a pane inside Claude Code that shows the week by project, and whether you'll make it to the reset.
[carousel/01.png]

**2/**
Every day is a bar stacked by project, each in a colour that stays put everywhere.

Press a day to see what it used. Pick a project to follow it through the week.
[demo.mp4]

**3/**
Then the forecast. Every limit shows where your pace lands by the reset, and when it would run out if that's early:

"At this pace it runs out Sat 5:21 AM, 32 h 38 min before it resets."

You find out days ahead, while there's still time to change course.
[carousel/02.png]

**4/**
It also lists every chat waiting on you across sessions, with the buttons the chat offered.

And it shows what a change would buy back: half the Opus work on Sonnet moves the run-out from Sat 5:21 AM to Sat 1:15 PM.
[carousel/03.png]

**5/**
Free and open source (MIT). It reads Claude Code's own records on your computer. What it sends is listed in SECURITY.md: prompts to Claude through your own account, and notifications to a web address you set. Shares of the limit are estimates; the screenshots use sample data.

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://vradulthub-cloud.github.io/tobebestme/

---

## LinkedIn

I kept hitting my weekly Claude limit on a Saturday morning, with no idea which of my projects had spent it. So I built something to answer that, and I'm sharing it today.

ToBeBestMe is a free mod for Claude Code. It opens a pane beside the chat that answers the first questions of the day:

• Where did my week go? Each day is a bar stacked by project. Press a day or a project to pick it out.
• Whether you'll make it to the reset. Every limit shows where your pace lands, and when it would run out if that's early.
• What's waiting for me? Chats in other sessions that stopped for a permission, a question or a plan, with buttons to answer from one place.
• What would a change save? A suggestion shows its effect on your week before you act on it.

It runs in the terminal and the Claude desktop app, and it's checked by 86 behaviour tests and 150 rendering tests at four pane widths. It reads Claude Code's own records on your computer; SECURITY.md lists the little it sends. Shares of the limit are estimates, and the images use sample data.

Install it at a Claude Code prompt:
/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

https://vradulthub-cloud.github.io/tobebestme/

I'd love to hear what you'd want it to show next.

ToBeBestMe is an independent project, not affiliated with Anthropic.

[carousel/01.png to 06.png as a document, or demo.mp4]

---

## Show HN

**Title:** Show HN: ToBeBestMe, see where your Claude Code week went, by project

**Link:** https://github.com/vradulthub-cloud/tobebestme

**Maker comment (post it straight away):**
I run Claude Code across several projects at once, and I kept hitting my weekly limit with no idea which project had spent it. /usage tells you where you are, and attributes plan usage to skills, subagents, plugins and MCP servers, but not to projects, and not where your pace is heading.

ToBeBestMe is a Claude Code mod that draws a pane beside the chat and a line above the prompt:

- the weekly window on a calendar, each day stacked by project, from Claude Code's own records in ~/.claude/projects
- each limit's forecast: where the pace lands by the reset, and the run-out time when that's early
- chats waiting on you in other sessions, with their reply buttons
- what a change would save (helpers on Haiku, some Opus on Sonnet), shown as its effect on the week

It reads everything locally. What it sends is prompts to Claude through your own account (buttons that say so, a five-token check when the cheaper model came back empty, a handoff note before compaction, and lines added to a prompt when limits run tight) and a notification's title and text to a web address you set. It also shows system notifications through osascript or notify-send. SECURITY.md lists each one. Shares of the weekly limit are estimates at list prices, and the limit is shared with claude.ai chat, which no local tool sees. Screenshots use sample data.

Tests: 86 in Claude Code's mod test kit, plus 150 Playwright tests that render every view at four widths and check overflow, contrast and type size. MIT. Not affiliated with Anthropic.

---

## r/ClaudeAI

**Title:** I built a Claude Code mod that shows where your weekly limit went, by project, and when it'll run out

**Body:**
I kept hitting my weekly limit on Saturday mornings without knowing which project spent it, so I built this. It's a pane inside Claude Code, in the terminal and the desktop app:

- the week on a calendar, each day stacked by project: press a day or a project to pick it out
- each limit shows where your pace lands by the reset, and when it would run out if that's early
- every chat waiting for you across sessions, answerable from one place
- suggestions show what they'd do to your week before you act on them

It reads Claude Code's own records on your computer. Shares of the limit are estimates, and the GIF uses sample data. MIT. Install at a Claude Code prompt:

/plugin install tobebestme --marketplace vradulthub-cloud/tobebestme

then /tobebestme. I'd love feedback on what's missing.

[demo.gif]

---

## Alt text

- **launch-hero.png:** "See where your week went." Below it, the ToBeBestMe Home pane: 4 chats waiting, the weekly limit at 82% and forecast to run out Saturday at 5:21 AM, and a bar for each day stacked by project.
- **social-card.png:** "See where your week went." beside a bar for each day of the week, stacked by six projects; storefront did more than half of the 82% used so far.
- **carousel/01.png:** See where your week went. A bar for each day, stacked by six projects; storefront did more than half of the week's 82%.
- **carousel/02.png:** Know before you run out. A weekly limit at 82% with two days to go, forecast to run out Saturday at 5:21 AM.
- **carousel/03.png:** Answer every waiting chat from one place. The Needs you list shows five chats, three of them waiting on your answer; Checkout redesign asks "Ship the new checkout to staging?" with Ship it, Hold off and Reply buttons.
- **carousel/04.png:** One line, always in view. The line above the prompt: context 85% in red, the 5-hour limit at 40%, the weekly limit at 82% in amber.
- **carousel/05.png:** Know what a change would save. Running half the Opus work on Sonnet moves the run-out from Saturday 5:21 AM to Saturday 1:15 PM.
- **carousel/06.png:** Free, open source, one line to install, with the install command and four facts: every project at once, keyboard first, tested where it draws, MIT licensed.
- **demo:** Three views of the real pane: the week by project, Wednesday pressed, then the storefront project picked out across the week.

## Notes

- The images use the test suite's sample data (storefront, ledger-api and so on), drawn from the mod's real output. None of your own projects appear.
- Timing and order are in STRATEGY.md: Show HN at 7:00 AM PST, r/ClaudeAI at 8:00, X and Bluesky at 8:30, LinkedIn at 9:30. Never ask anyone to upvote.
- Swap in https://vradulthub-cloud.github.io/tobebestme/ only once the page is deployed; until then use the GitHub link.
