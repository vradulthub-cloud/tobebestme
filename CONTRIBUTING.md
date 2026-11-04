# Contributing to ToBeBestMe

Thanks for helping. You need Node 22 or later and Claude Code 2.1.308 or later, signed in. For a quick look, clone just the main branch (the site branch's history holds rendered videos the mod never ships): `git clone --single-branch --branch main --depth 1 https://github.com/vradulthub-cloud/tobebestme.git`.

A change is ready when the checks CI runs pass:

```bash
claude plugin validate --strict .
claude plugin test .
node --test tests/scan.test.mjs
```

`claude plugin test .` is the test kit, which presses every button on every tab. It is one file, `tests/tobebestme.test.ts`, and takes a minute or two. `tests/scan.test.mjs` runs the shell and awk programs that read Claude Code's records on a small transcript and holds them to the JavaScript reader; CI runs it on Linux and macOS. When you add a test to the kit, wait for what you expect with `until()`, not a fixed sleep. CI (`.github/workflows/ci.yml`) also parses every script and, on `main`, checks the release manifest. To type-check, run `tsc -p .`: it covers `hooks/` and `types/` only. The tests are checked by `claude plugin test` itself, and `tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, a file Claude Code lays down the first time it loads the mod (git ignores it), so `tsc` works once you have loaded the mod in Claude Code.

The end-to-end checks are optional locally, and worth running when you change how something is drawn:

```bash
cd e2e && npm ci && npx playwright install chromium && npm test
```

They also need Python 3 (the terminal tests drive Claude Code through a pseudo-terminal). Those tests start Claude Code in the folder above your checkout, which Claude Code must already trust; if it does not, or the checkout is a git worktree, set `E2E_CWD` to a folder you have already trusted.

`npm test` in `e2e/` draws every view in Chromium and checks it at phone, tablet and desktop widths, then drives real Claude Code sessions in a terminal. Those sessions run with ToBeBestMe's notifications switched off and send no prompts to a model. They load a copy of the mod as it ships, save no transcripts and, having answered nothing, add nothing to your spending. `npm run test:live` also runs a real two-agent workflow, with its agents on Haiku and driven from a Sonnet session, which spends a few cents of usage; it is a real saved session, under a name of its own each time, so it shows in your records like any other.

How ToBeBestMe is written:

- **Design.** It has its own visual language, described in DESIGN.md: sentence case, buttons that say what they do, one primary action per view, nothing under 11px, color only for meaning. The terminal stays plain; the desktop pane is bold, with gradient figures in their status colors, and glows and motion only for what is live. DESIGN.md has the details.
- **Style.** `.editorconfig` and `.prettierrc` describe it: two spaces, no semicolons, single quotes, trailing commas. There is no fixed line width: long string-building lines are normal in `hooks/`, so don't run Prettier over those files (it would rewrap thousands of lines and change every shipped hash). Match the file you are in, and don't reformat lines you aren't changing.
- **Honest numbers.** Estimates are shown as ranges and say what they come from. Don't make a guess look precise.
- **No secrets, ever.** Not in code, tests, fixtures or screenshots. The e2e screenshots can show your own projects; they stay under `e2e/.out/`, which git ignores. Anything private (launch plans, drafts) stays out of git too.
- **Images show fixtures only.** The pictures in `assets/` are screenshots of the e2e fixture pages (`node e2e/lib/export.mjs` writes them to `e2e/.out/pages/`), never of a real session or your own projects.
- **What it reads, writes, runs and sends is listed.** A change that adds a file it reads or writes, a command it runs, a message it sends or a network call must add its row to SECURITY.md in the same change.
- **Security issues** go through SECURITY.md, not public issues.

## Cutting a release

Only commits on `main` are released. A release is built by the Release workflow from a version tag; it refuses a tag whose commit is not on `main`.

1. Bump `version` in `.claude-plugin/plugin.json` and add the release to CHANGELOG.md.
2. Run `node tools/release-manifest.mjs`. It rewrites `.claude-plugin/integrity.json` and `SHA256SUMS`; commit both. Any change to a shipped file after a release needs a new version, so two different builds never share one.
3. Merge to `main`, then tag the commit and push the tag: `git tag v<version>` and `git push origin v<version>`. Tags are signed (`git tag -s`) once a signing key is set up for the repository, which only its owner can do; until then they are not, and what ties a release to its source is its build provenance. The workflow checks the manifest matches the files, then publishes the zip, the zip's own SHA-256, `SHA256SUMS` and signed build provenance for the zip and `SHA256SUMS`. Its actions are pinned to commit SHAs and it keeps no credentials in the checkout.
4. Check the result as a user would: see "Verifying an install and a download" in SECURITY.md.
