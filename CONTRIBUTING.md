# Contributing to ToBeBestMe

Thanks for helping. A change is ready when all of this passes:

```bash
claude plugin validate .
claude plugin test .
cd e2e && npm install && npm test
```

`npm test` in `e2e/` draws every view in Chromium and checks it at phone, tablet and desktop widths, then drives real Claude Code sessions in a terminal. Those sessions run with ToBeBestMe's notifications switched off and send no prompts to a model. They load a copy of the mod as it ships, save no transcripts and, having answered nothing, add nothing to your spending. `npm run test:live` also runs a real two-agent workflow on Haiku, which spends a few cents of usage; it is a real saved session, under a name of its own each time, so it shows in your records like any other.

How ToBeBestMe is written:

- **Design.** It follows Apple's Human Interface Guidelines: sentence case, buttons that say what they do, one primary action per view, nothing under 11px, colour only for meaning. DESIGN.md has the details.
- **Honest numbers.** Estimates are shown as ranges and say what they come from. Don't make a guess look precise.
- **No secrets, ever.** Not in code, tests, fixtures or screenshots. The e2e screenshots can show your own projects; they stay under `e2e/.out/`, which git ignores.
- **Security issues** go through SECURITY.md, not public issues.

## Cutting a release

1. Bump `version` in `.claude-plugin/plugin.json` and add the release to CHANGELOG.md.
2. Run `node tools/release-manifest.mjs`. It rewrites `.claude-plugin/integrity.json` and `SHA256SUMS`; commit both.
3. Tag with a signed tag, `git tag -s v<version> -m "ToBeBestMe <version>"`, and push it. The Release workflow checks the manifest matches the files, then publishes the release with `SHA256SUMS` and signed build provenance.
