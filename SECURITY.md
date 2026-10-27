# Security

## Reporting a problem

Please report a vulnerability privately: on the repository's **Security** tab, choose **Report a vulnerability**. Don't open a public issue. You'll get an answer within a week, and a fix or a plan within 30 days.

## What ToBeBestMe reads, writes and sends

ToBeBestMe runs inside Claude Code, on your computer, with the permissions Claude Code gives a mod. Settings › What ToBeBestMe reads shows each source and whether it could be read.

| | What | Why |
| --- | --- | --- |
| Reads | Claude Code's records in `~/.claude/projects` (transcripts, workflow records, per-agent usage) | Usage, costs, chats waiting for you, workflow history |
| Reads | `claude agents --json`, and the Claude app's session list where available | Which sessions are working or waiting |
| Reads | `git status` in the folders of recent sessions | Work left uncommitted or unpushed |
| Reads | Your skill and command files | The skills check-up |
| Reads | Claude Code's settings files: `~/.claude/settings.json`, and the project's `.claude/settings.json` and `.claude/settings.local.json` | The skills check-up takes `skillOverrides` and `skillListingBudgetFraction` from them, and nothing else |
| Reads | A workflow's script file, when Claude names one for a run | The explanation and estimate before the run starts |
| Reads | budget-pilot's file in `~/.claude/plugins/store`, once, the first time it starts | What the older version kept, carried over |
| Reads | The environment variables `HOME`, `USERPROFILE`, `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_EXECPATH` and `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Where Claude Code keeps things, and how much room the skill listing has |
| Reads | Its own files | The daily integrity check below |
| Writes | `.claude/tobebestme/handoff.md` in the project, with a `.gitignore` of `*` beside it | The handoff note before compaction |
| Writes | `~/.claude/tobebestme/reports/` | Reports you save |
| Writes | Claude Code's store for mods (at most 4 MiB, capped) | Usage totals, workflow digests, settings it remembers |
| Sends | Prompts to Claude, through your own Claude Code account: to your cheaper model when you press a button that says so ("Suggest more", "Ask Claude to improve it"); a five-token check ("Reply with the word ok.") when a request sent to the cheaper model came back empty, at most once in ten minutes; and the handoff note before a compaction, written by Claude from this conversation (Settings › Handoff note before compacting turns it off) | Skill ideas, skill drafts, whether the cheaper model is there, handoff notes. Requests it puts in the prompt box (fixes, rules) go only when you send them |
| Sends | A notification's title and text to the web address you set (only `https://`) | Notifications on your phone, if you set one up |
| Runs | `osascript` (macOS) or `notify-send` (Linux), with the words passed as arguments | System notifications |

It never opens `.env` files or key files. Claude Code's settings files can hold keys (an `env` block, `apiKeyHelper`): ToBeBestMe parses them only for the two skill settings above, and keeps, shows and sends nothing else from them. Apart from the prompts in the table, which go to Claude through your own account, nothing from your transcripts leaves your computer. Text from transcripts and other sessions is treated as data: it is cleaned before it is shown, never run, and framed as data when it goes into a prompt.

## Verifying a download

Every release is built by GitHub Actions from a tagged commit and comes with:

- `SHA256SUMS`: the SHA-256 of every file in the release except `SHA256SUMS` itself and `.claude-plugin/integrity.json`, which holds the same hashes. In the folder you installed, run `shasum -a 256 -c SHA256SUMS`.
- Build provenance, signed by GitHub, for the release zip and `SHA256SUMS`, once the repository is public (GitHub signs provenance for private repositories only on Enterprise Cloud). Check a downloaded release with `gh attestation verify tobebestme-v<version>.zip --repo <owner>/tobebestme` (the zip is named after the tag, for example `tobebestme-v1.4.0.zip`).

ToBeBestMe also checks itself once a day against `.claude-plugin/integrity.json`, the same hashes, and says the result in Settings › What ToBeBestMe reads. That catches a copy that was damaged or changed after install, a module added beside the released ones in `hooks/`, and a manifest that went missing from a copy Claude Code installed or that had one before. It can't catch a copy whose manifest was changed along with its files; the checksums published with the release and the signed provenance are what prove a download is genuine. Like any shipped code, ToBeBestMe can be read and changed: these checks make tampering visible, they don't hide the code.

## Tests

`claude plugin test .` runs 76 tests in Claude Code's own mod test kit. Among them:

- one presses every button on every tab, on both surfaces;
- others try the security guards: names from records that could reach an object's prototype (`__proto__`, `constructor`, `toString`), web addresses that aren't `https://`, notification words passed as arguments where they can't run, and the release self-check (a changed file, an added module, a missing manifest).

The `e2e/` suite (see CONTRIBUTING.md) draws every view in Chromium and checks it, and drives real Claude Code sessions in a terminal.
