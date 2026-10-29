# Why ToBeBestMe exists

Claude Code spends three budgets at once, and none of them is in view while you work.

1. **Usage limits.** On a Pro or Max plan, use is shared across a rolling 5-hour window and a weekly limit. Run out and work stops mid-task until the window resets: hours, or days for the weekly one.
2. **Money.** With an API key, Bedrock, Vertex or team billing, every request is billed. A long session or a looping agent can cost tens of dollars before anyone looks.
3. **Context.** Everything in the conversation is re-read on every request. As it fills up, each turn costs more, answers get worse, and auto-compaction eventually summarizes the conversation at a moment nobody chose.

And there's a fourth cost nobody counts: **keeping several projects going at once.** People run a chat per project, or per worktree, and lose track of them. Claude Code's own issue tracker has users asking for a way to see which of their parallel sessions is waiting for input ([#36885](https://github.com/anthropics/claude-code/issues/36885)), and for continuity between sessions ([#11455](https://github.com/anthropics/claude-code/issues/11455)), with community tools written just to hand work from one session to the next. A chat that stopped to ask something hours ago is lost time, and a project picked up cold is re-explained at full price. The limits make it worse: users hit the weekly limit late in the week and find sessions stopped mid-task ([The Decoder](https://the-decoder.com/anthropic-says-claude-codes-usage-drain-comes-down-to-peak-hour-caps-and-ballooning-contexts/)).

They're one problem. **Context drives the other two:** a 370k-token conversation re-sends about 370k tokens on every request, so seven requests send 2.5M input tokens. Prompt caching makes re-sent tokens about ten times cheaper, but only while the cache stays warm, and it expires after a few minutes of inactivity.

## Who needs it

| Person | Their question |
| :- | :- |
| Subscriber in the middle of a feature | Will I hit the 5-hour limit before I finish? Should I switch to a cheaper model now? |
| Subscriber late in the week | I'm at 75% on Thursday. How much can I use a day? |
| API user | What did this task cost? Stop me before I spend more than $20 today. |
| Anyone in a long session | Why does every turn cost more than it used to? What's filling my context? |
| Heavy agent user | Are helpers (subagents) burning the most expensive model on routine searches? |
| Anyone with several projects | Which project is eating my week, and is today unusual? |
| Anyone running chats in parallel | Which chat is waiting for me? Which one stopped at a limit? Where did I leave each project, and did I commit it? |
| Anyone with many skills or plugins | Why didn't my skill run? Which skills earn their place, and what is costing tokens on every request for nothing? |
| Anyone whose Claude runs workflows | What is this workflow about to do, and what might it cost? What is each agent doing right now? How do I slow it down, switch its model or stop it without losing work? What should it do differently next time? |

## What the dashboard answers, in this order

0. **What is waiting for me, and what is running?** Home opens on it, with any workflow running now: chats that asked you something, a permission prompt, a plan to approve, a stop at a usage limit, a pull request to review, each with its own answer buttons; then where each project got to, with loose ends such as uncommitted files.
1. **Am I OK?** One plain sentence naming whichever constraint will bind first.
2. **How long can I keep going?** About how many turns, and how much time, until each limit, budget or auto-compaction, at the recent pace.
3. **Where is it going?** Context by category, cost per turn and its trend, the model mix, helpers, tools whose output fills the context, and turns that missed the cache.
4. **What should I do?** Ranked suggestions in plain words, each with a button wherever the mod can act on it.

## The levers that actually save budget

| Lever | What it saves | How ToBeBestMe helps |
| :- | :- | :- |
| A smaller conversation (compact, or start fresh from a handoff note) | Every later turn | Shows how much each request re-sends; Compact now; Start fresh writes a note, clears, and fills the prompt to continue; optional automatic compaction between turns |
| A cheaper model for routine work | Several times the cost per request | Automatic / Haiku for everything / Off; helpers always on the cheaper model; route the main conversation too |
| Less thinking | Thinking tokens | Lower effort once context passes the warning |
| A warm cache | Most of the re-sent input | Cache reuse rate; flags turns that rebuilt the cache after a pause |
| Fewer always-loaded tools | Tokens on every single request | MCP tool tokens by server, with a nudge to disconnect unused ones |
| Reading through helpers | Main conversation growth | Tools ranked by how much output they added |
| Hard budgets | Runaway spend | Session and daily budgets that warn, switch to the cheaper model, or hold new prompts |
| Skills for repeated work | Re-explaining the same thing, turn after turn | Spots prompts you repeat across projects, drafts a skill and checks it before saving, counts which skills actually run, and shows which ones cost tokens on every request without ever running |
| The right model for each stage of a workflow | About half the cost of routine stages | Ways to spend less finds checking stages (verify, recheck, walkthrough, gather) that fanned out on Opus and says what Sonnet would have cost; Run it on Sonnet and Model for new agents act on a run right away |
| Workflow agents sized to the job | Setup paid per agent, and long jobs re-reading their own conversation | Finds stages of many one-item agents and agents that cost $15 or more mostly re-reading; Make it a rule… asks Claude to write the fix into your CLAUDE.md |
| Resuming instead of restarting | Paying again for finished agents | Resume it… on a stopped run; flags runs that were started over |
| A listing Claude can read | Skills that silently stop triggering | Says which skills go to Claude by name alone because the listing ran out of room, and hands Claude the request that frees it (manual-only for skills nobody runs, plugins to turn off, more room) |

## Skills that run when they should

People report skills that never trigger, or that Claude reads as documentation instead of running ([#9716](https://claudeissues.com/issue/9716-bug-claude-code-assistant-not-aware-of-available-skills-in-claude-skills-directo)). Two mechanics explain much of it, confirmed in Claude Code's own code. The skill listing has room for 1% of the context window; past it, the skills that don't fit go to Claude as a bare name it can't match to a request, with no warning ([one user found five of 84 skills invisible](https://blakecrosley.com/pl/blog/skills-my-agent-could-not-see), [how the budget decides](https://dev.to/rulestack/too-many-claude-code-skills-how-the-listing-budget-decides-which-descriptions-claude-sees-4a6m)). And a description over 1,536 characters is cut ([the cap](https://dev.to/rulestack/your-claude-code-skills-description-is-being-cut-the-1536-char-cap-and-the-shared-listing-budget-4a77)). The fixes exist (`skillOverrides` to make a skill manual-only, `skillListingBudgetFraction` for more room, descriptions that say when to use them first), but nothing showed when you need them. The Skills tab does: what Claude can see, what ran, what to fix in your own skills, and the request that fixes each.

## Running workflows with confidence

A workflow is a script Claude writes to split a big job across many agents. One run can start hundreds of agents and go for hours, and until now all a person saw was a background task, then a bill or a used-up weekly limit. The questions are the same every time: before it starts, what will it do and how big is it; while it runs, what is each agent doing and is it on track; when it isn't, how do I slow it, switch its model or stop it without losing what finished; and afterwards, what did it cost and what should change next time.

A month of heavy real-world use showed the same four leaks again and again:

- **Routine stages on the expensive model.** Verify, recheck and walkthrough stages started five or more agents each on Opus; on Sonnet the same tokens cost about half.
- **Agents that ran too long.** The costliest agents took hundreds of steps, and about half of what they cost was re-reading their own growing conversation at every step.
- **One item per agent.** Stages of hundreds of agents, where even the cheapest agent's cost was mostly loading instructions and re-reading the same files.
- **Stages waiting on one agent.** A stage waited over an hour for its slowest agent while the typical one took two minutes.

So the Workflows tab explains, shows and steers, in that order:

- **Explain by default, ask only when asked.** Every run is explained as it starts; Ask me first is a choice, since a go-ahead for every run would soon be pressed without reading. The card says what to look at: agents that would inherit an expensive session model, a checking stage with no cheaper model named, and the likely cost from what agents cost in the person's own runs.
- **Every agent, in words.** Each agent's row says what it is doing this moment (*Editing checkout.ts*, *Run the cart tests*) and why it waits when it does (*waiting: the run is paused*).
- **Controls that never break work.** Pause, the limit on agents at once and the model all act on agents not yet started; working agents finish their step. Stop asks first and keeps what finished, and a stopped run can be resumed.
- **Savings as evidence, not promises.** Each idea says what it would have saved on the person's own runs, how it was worked out, and that two ideas on one stage overlap. Judgement stages (review, design, building, writing) keep Opus.
- **Fixed once, in the person's words.** Make it a rule… asks Claude to add the rule to the person's CLAUDE.md, showing the change first, so every later workflow follows it.

## Less to worry about

- **One place for everything.** Home reads Claude Code's own records for every project on the computer, sessions that never ran ToBeBestMe included: what waits for you, where each project got to, and the plan they share. Nothing to set up and nothing to open one by one; in the desktop app answers go straight to the session, and the open sessions join it.
- **Answer without switching.** A waiting chat's own suggested replies are buttons; each shows the message and asks before it sends. Your own words go in a field where Return sends. Outside the app, the resume command is one press away.
- **Seen from anywhere.** The line above the prompt in every session says when another chat is waiting.
- **Everywhere by default.** One install line puts ToBeBestMe in every project and session, in the terminal and the desktop app, so the line above the prompt is always there.
- **What you choose wins.** An automatic switch never overrides a model you picked yourself: switch with /model and the session stays on it, even in Always mode or at a budget, and ToBeBestMe says so. When it is sending this conversation to the cheaper model, it says that too, with one press to stop. A control that quietly does nothing is worse than no control.
- **Autopilot first.** Helpers move to the cheaper model when things get tight, a handoff note is written before every compaction, and Claude is told the budget once it matters. Settings opens on how much is on autopilot, as a list, so there is nothing to watch.
- **A pace, not an alarm.** For the weekly limit, a day's share that lasts until the reset, and whether today is within it.
- **The right model, suggested.** Opus for planning and review, Sonnet for code, the cheaper model for reading; one press switches this session when the limits call for it.
- **Told once, not nagged.** A notification goes out once per computer, whichever session notices first. There are at most four in ten minutes, and a sound never holds up the pane. Claude Code's own notifications are unreliable outside three terminals, so ToBeBestMe also uses the notification centre, a sound and, if you like, your phone.
- **The right tool, suggested.** When a request looks like a job for a workflow, it says so once and offers a shape with a model per stage. The request goes into the prompt box for you to read first.
- **Long runs planned up front.** The /long-run playbook breaks big work into checked stages on the right models and stops cleanly before a limit, so a run doesn't die mid-task.

## Making it easy to understand

- **Lead with the answer.** The headline says the most pressing thing in a sentence, with its one best action as a button; the detail sits one tab away.
- **Show pace, not only fullness.** Each thing that can run out has a runway: the fill is what is used, and a strand under it is how much of the window has passed, so being ahead of the clock is a length you can see. When the pace runs a limit out early, the run-out shows as a stop and a dry line to the reset: it changes shape as well as colour, so it never rests on colour alone. It is square-ended and horizontal on purpose: concentric rings read as Apple Watch, whatever their colours. Press a runway's name to open that budget's tab. Usage draws the same runway; its chart of the window so far is under Show details.
- **Count the benefit.** Every suggestion that can be counted says what it saves ("each later turn re-reads about 470k fewer tokens"), and **Wins** says what ToBeBestMe has already saved.
- **Forecast rather than alarm.** Usage limits are judged by their window's own average pace, which counts nights and breaks, and drawn as a forecast: use so far, the projected line, and where it would run out.
- **Early has to mean early.** A limit that runs out minutes before it resets anyway is not an alarm; one that runs out a day early is. The headline goes to whichever bites first among the ones that matter.
- **Explain on hover.** Rows, tiles and charts say more when you point at them, in a card drawn over what is above, so nothing moves under the pointer. The charts' own tooltips fade and rise in over 150 ms, and appear at once with reduced motion set. **Show details** puts every card's words in place for keyboards, screen readers and touch.
- **One primary action per view.** On desktop the tab bar is a segmented control (the open tab filled, the others quiet text), so the one white button is always the thing to do next. Buttons say what they do: "Review workflow", "Refresh runs", "Copy run ID".
- **Every width.** Tables drop the columns that don't fit a narrow pane, and charts draw at the pane's width so their labels stay at 11px. Every box may shrink below its longest line, so a long session title or branch name truncates instead of pushing the next column off the pane. The e2e suite checks every view at 375, 768, 1280 and 1920 pixels, with long titles and branch names in the data, and its renderer sizes boxes as the app does rather than letting them all shrink.
- **Controls beside the figures.** Budgets, the cheaper model and the alert are set on Usage, MCP servers and memory from This session. Each control has one home; Settings holds the rest.
- **A heading for each section, and nothing else.** A section is a heading above a faint grey group, with no icon tiles. The line that explains a section shows under Show details, so the page stays quiet; a line that carries a fact (how old a reading is) stays.
- **Colour names a thing, or says it is in trouble.** Each limit keeps one vivid colour wherever it is drawn: the weekly limit blue, the 5-hour limit purple, a model's own weekly limit pink, context cyan, budgets mint. Each project gets a colour of its own (the six most used, from a hash of the project so it stays put), worn in the week's bars, the projects list, the busiest project and Pick up. Models keep theirs in the model charts. Amber means past your alert or running out early and red means nearly out; either one takes over a limit's own colour, so the colour that says trouble is the same everywhere. Green means all is well. Charts carry the system's light-theme variants of the vivid colours, and the neutrals read on both, so a drawing stays legible whichever way the appearance is reported.
- **Show the real thing.** The welcome tour embeds the live line above the prompt and the person's own limit, so what they learn to read is what they will see tomorrow, not an illustration. It waits while anything needs an answer, and a person can leave it at any step.
- **The week on a calendar.** The tightest limit is drawn large, with the days of its window under it, "Now" over the playhead and the run-out and reset in words over their posts. Under the runway, each day's work is a bar in that day's column, stacked by project in each project's colour, so the week's fill and the work that made it sit on one calendar; a day says what it held on hover, and today's name is bold. The other limits sit under it as runways of their own, so every limit is in the hero and nowhere else on Home. It is the same runway as everywhere else, made big enough to read at a glance; labels are dropped, never overlapped, when the pane is narrow.
- **Show where you are heading, not only where you are.** A runway's fill is the past; a faint ghost ahead of it is where the window's own pace lands by the reset, and the hero says the same in a sentence. A saving suggestion shows its effect on that forecast before it is pressed, so a choice is made with its consequence in view. The hero reads like a summary should: the big figure, one sentence, the chart.
- **Things respond, and live things move.** The calendar is a control as well as a picture: a day or a project pressed is picked out where it is drawn (the rest step back rather than disappear), a line says what it held, and the list beside it follows; one press brings each back. Motion means "working now" and nothing else: a soft pulse on a running workflow or session, still with reduced motion set. The pane redraws once a minute, so Now and every "ago" keep time.
- **Every tab opens on its one answer.** Home's hero set the pattern, and each other tab has its own: a headline with its glyph, a line of facts, one big figure at the far end, and under them the drawing that shows it. **This session** answers whether it will make it: the cost, and the context window drawn as a runway with a post where Claude Code compacts, a ghost for the next turns at the recent pace, and a bar per turn climbing towards a dashed line. **Usage** answers where the limit is heading (its forecast with the readings taken) and where the week went (each day stacked by project, then projects and models as split bars). **Workflows** answers what is running and what it has cost (each run a runway: cost against its limit or expectation, the work done as the strand, a stop where the cost would pass the limit first), or what the month cost and how much of it could have been saved. **Skills** answers whether Claude can see them: the listing as a runway against its room. **Settings** answers how much is on autopilot, and whether everything it reads could be read. A tab has one of these and no tile strip above it.
- **Light and dark are both tested.** Drawings carry light-theme variants of their vivid colours, and of their words (the white of "Now", the grey of labels, amber and red text); words drawn as text that cannot follow the appearance use a colour that reads on both (`midHex`). The e2e suite draws the real states on a light pane and holds text to 4.5:1 and coloured marks to 3:1.
- **The window's first day is the window's.** The records keep each transcript's use by hour as well as by day, so the first bar of the week's calendar counts only what came after the window opened, not that morning.
- **Lists show their first and fold the rest.** Needs you draws its most pressing chat whole and the others a line each; Pick up does the same with its latest project, and Skill ideas shows three.
- **The line above the prompt is a glance.** Each figure takes an equal share of the row, its runway long enough to show pace, its percentage in its status colour; the headline's line carries the session's and the day's figures.
- **Say each thing once.** Home has no strip of figures and no plan card: today's figures are in the headline's line, the week's total beside Projects, the limits in the hero. The left column is what to do (Needs you, Running now, Pick up, what stands out, habits); the right is where things are (Projects, Open sessions). With nothing for the right, the left takes the width.
- **Habits, not tips.** Home suggests up to three things at a time, each one press away and each derived from the person's own settings and records: what the records show costing them first (MCP servers re-sent with every request, skills that never run), then habits they don't have yet (notifications, a skill for a repeated prompt, a memory file, a first workflow, a spending guard). Not now puts one off for a month. The card goes away when there is nothing left to suggest.
- **One name, one format, one number.** A model is written as `modelName` writes it ("Opus 5.5"; a family on its own, "Opus"), never as its id. A span is written as `fmtSpan` writes it ("32 h 38 min") in headlines, alerts and rows alike. A cost past the whole weekly limit is said in weeks ("1.5 weeks’ worth"), not "150%", and a share comes before its dollars. Today, in every session, is never less than this session. A history line (the activity list) says it is as it was at the time.
- **Narrow is designed.** Below about 60 columns a value stacks under its label in words instead of ending in an ellipsis; a table gives up its bars before its numbers; the line above the prompt keeps its headline and button on a phone and drops the rest. A waiting chat's label sits on its own line, and its words start at what is asked.
- **Guidance is body size.** Text a person acts on (what to do, why) is body size in a quiet colour; the small footnote size is for captions and labels. Secondary buttons (copy a command, set aside, copy an id) are quiet text, so the decision buttons are the only ones with a fill, and a card with the same action several times gives it fill once.
- **Failures look like failures.** A record that can't be read is drawn with a status colour and glyph and says what to try next. A source that found nothing gets a neutral dot, not a check.
- **Hide what's empty.** A section with nothing to show stays out of the way instead of drawing an empty box.
- **Settings like System Settings.** Preset choices with Other… for an exact value; the essentials first, Advanced on request.
- **Plain words.** Usage limits, Weekly limit, Spending rate, Helpers (subagents), Reused from cache. Each term Claude Code uses (context, compact, handoff note) gets a one-line explanation where it first appears.
- **Every number has words beside it.** "$0.25 last turn", "resets Sun 9:00 PM", "about 18 turns (1 h 40 min)".
- **Colour carries meaning, never decoration:** status (warning, error), identity (each runway, each model) or a saving, always with words beside it that say the same thing.
- **Suggestions come with a button** wherever the mod can act; otherwise they say exactly what to do.
- **Sensible defaults.** Everything works untouched, and every setting carries one line saying what it does.
- **Empty states teach.** "Shows after a few turns", not a blank space.
- **Nothing destructive without asking.** Compact and Start fresh confirm first; resetting numbers confirms; a reply Claude suggested shows the whole message before it goes to another session.

## Trust

ToBeBestMe reads everything Claude Code records, so it has to earn that trust:
- It says what it reads, writes and sends (Settings › What ToBeBestMe reads, and SECURITY.md).
- It treats text from other sessions as data.
- It never opens `.env` or key files, and takes two skill settings from Claude Code's settings files and nothing else.
- It ships checksums and signed build provenance with each release, and checks its own files against them daily.

It stays open source under MIT, because a tool that reads your transcripts should be one you can read.

## Settings

Every setting is a `userConfig` field, so it appears in Claude Code's own `/config` menu and in the dashboard's Settings tab, with one source of truth. Changing it in either place saves it to Claude Code's settings and reloads the mod.

| Group | Settings |
| :- | :- |
| Spending | Session budget, Daily budget, When a budget is reached (warn / cheaper model / hold prompts), Cost alert every $ |
| Usage limits | Alert at %, Warn when a limit will run out before it resets |
| Context | Warn at %, Use the cheaper model at %, Compact automatically at %, Write a handoff note before compacting, Keep the plan through compaction |
| Cheaper model | Mode, Cheaper model, Helpers always use it, Main conversation too, Lower effort past the warning, Effort to use |
| Display and alerts | Line under each answer, Status line, System notifications, Tell Claude where the budget stands, Open the dashboard when a session starts |

## Honest limits

- **Cost** is what Claude Code's own ledger reports (`/cost`). On a subscription it's the API-price equivalent rather than a bill, but it's still a good measure of how heavy the work is.
- **Usage-limit percentages** come from the API's responses. The pace is the window's own average (use so far over the time the window has run), so it shows from the first reading; readings ToBeBestMe takes add the recent pace and the forecast line.
- **Tool output sizes** are estimated as characters ÷ 4.
- **Cache expiry** is inferred from large cache writes after a pause; it isn't read directly.
- **Daily spend** adds up the sessions on this machine that run ToBeBestMe, from Claude Code's exact costs.
- **Every project's figures** are list-price estimates from the token counts in Claude Code's transcripts, read on this computer only.
- **What waits for you** is read from where each transcript stopped. A permission prompt leaves no trace there, so it shows only for sessions running now (`claude agents --json`).

## The desktop pane's visual language

The pane in the desktop app is deliberately bold, and it is the only surface that is: it does not follow Apple's Human Interface Guidelines, and the terminal does not change at all. Everything below is drawn only where `k.hasSvg` is true, as SVG with CSS inside it.

- **Hero figures.** The tightest limit's percentage on Home and each tab's lead figure are drawn big, in a gradient between the tab's two identity colours (Home blue to violet, Workflows violet to pink, This session cyan to mint, Usage blue to mint, Skills indigo to violet, Settings cyan to grey). Amber and red take the figure over once a limit is past its alert or nearly out: status colour keeps its meaning. The gradient's ends are pulled until the digits hold 4.5:1 on a dark and on a light pane.
- **A glow of its own.** Each hero figure carries a soft bloom of its gradient underneath the digits, inside the figure's own drawing, so the bloom is always under the words and fades out before the drawing's edge (fainter on a light pane).
- **Live states.** A chat waiting on you, a running workflow and the run-out marker pulse; nothing else moves once a tab has settled.
- **Runways that move.** The fill sweeps in from the left when its tab opens and a band of light crosses it once; the projected ghost carries a slow moving sheen; the run-out marker pulses; and the stretch of the window after the run-out is hatched, so "out" is a texture as well as a colour.
- **Week bars.** Each bar springs up from its baseline a beat after the one before it, and a few tokens fall into its top (today's keep falling).
- **Entrances play once.** The app draws the pane afresh on every redraw, and every turn redraws it, so an entrance tied to the drawing would replay each time a figure moved. Instead `settleMotion` runs each entrance from when its tab was opened: a redraw part-way through carries it on, and one after that draws the finished state, whose markup stops changing, so the app keeps the image it has.
- **How the app draws a drawing** (read from its renderer, and followed by `e2e/lib/render.mjs`). A drawing whose words are blank is refused and nothing is drawn. A still drawing is an image and an interactive one a sandboxed frame, cleaned by DOMPurify first; a frame given no width is the browser's 300px, so the kit's `Svg` gives every drawing its size: one stretched to its slot (`preserveAspectRatio="none"`) gets a width wider than any pane, which the app caps at the slot. Boxes have no stacking order: an absolutely placed box paints over the boxes around it, so nothing decorative is ever placed behind words that way. The e2e checks hold every drawing to these rules and put each interactive one through the same scrub.
- **Rules that still hold.** Words are 4.5:1 or better in dark and light and never under 11px; amber and red mean status; every animation is switched off under `prefers-reduced-motion: reduce`, and the decorative marks (the sheen, the halo, the falling tokens) are then not drawn at all; the still drawing is always the finished one.
