# Launch

Everything for launch day. It belongs on the `site` branch, not `main`, so installers don't download it.

- `STRATEGY.md`: the launch plan. It stays on this computer and is never committed (see `.gitignore`). `python3 strategy-page.py <out.html>` renders it as a page, with its dates and links read from the equally private `STRATEGY.glance.json`.
- `copy.md`: paste-ready posts and alt text. `python3 kit-page.py press-kit.html` builds the press kit from it.
- `build.mjs`: the social card, launch image, carousel (seven slides) and demo frames, laid out with the landing page's components. `video/`: the explainers. Only the overview is in the kit and on the site. The seven per-idea clips were taken out of `launch/out/video` and the press kit until they are re-rendered for the current pane (about 20 minutes: `node launch/video/render.mjs --web <names>`, the names are in `explainers.js`), and nothing on the site refers to them. So today the launch goes without them: re-render them if you want to post them, otherwise leave them out of the plan.
- `make-demo.sh`: the demo video and GIF from the demo frames.
- `readme-shots.mjs`: the pictures and the demo GIF in the README on `main`, cropped from the same rendered pages.

## Before you post

Five things only you can do:

- [ ] **Deploy the landing page.** `site/` goes to https://tobebestme.vercel.app (see `site/README.md`); run `node site/tools/hash-csp.mjs --check` first.
- [ ] **Upload the social preview.** Use `launch/out/social-card.png` (the same picture as `site/img/social-card-v6.png`) under Settings › General › Social preview. GitHub has no API for this.
- [ ] **Update the repository description.** `gh repo edit --description "A mod that runs inside Claude Code itself, not a separate app: what waits for you, your week's limits and what workflows cost. Independent; not made by Anthropic."` (the wording of the plugin.json description).
- [ ] **Retitle the v1.5.0 release** next to its release-notes edit: use a title that leads with "a mod that runs inside Claude Code" and does not say "Never leave Claude".
- [ ] **Post each piece yourself,** in the order of your own plan. Never ask anyone to upvote.

## Rebuild

Rebuild after a UI change. The mod lives on `main`; point `TBBM_MAIN` at that checkout (Playwright comes from its `e2e/node_modules`). Copy `e2e/.out/pages` somewhere first if another export may run meanwhile: an export clears that folder.

```bash
M=<main checkout>
(cd "$M/e2e" && node lib/export.mjs)
export TBBM_MAIN="$M" TBBM_PAGES="$M/e2e/.out/pages"
node site/tools/export-fix.mjs          # the one state main's export leaves out: a fix made in the pane
node site/tools/shots.mjs               # site/img: pane, week, now, needs, savings, standout, fix, band
node launch/shots.mjs                   # launch/shots: hero, frames, needs, now, standout, band, fix
node launch/build.mjs && sh launch/make-demo.sh
node launch/readme-shots.mjs "$M/assets"   # the README's pictures and its demo GIF, written straight into main's assets folder
cp launch/out/social-card.png site/img/social-card-v6.png   # if the card changed, save it under the next version (social-card-v7.png) and update index.html
# the videos (long: about 20 minutes for all eight); add names to render some
export PLAYWRIGHT_CORE="file://$M/e2e/node_modules/playwright-core/index.mjs"
node launch/video/render.mjs --web      # writes launch/out/video: .mp4, -web.mp4, .srt, .vtt, -poster.png
cp launch/out/video/overview.vtt site/img/overview-v7.vtt   # if the video changed, use the next version (-v8) and update the page's links; the cached copies last a year
cp launch/out/video/overview-web.mp4 site/img/overview-v7.mp4; cp launch/out/video/overview-poster.png site/img/overview-poster-v7.png
(cd launch && TBBM_MAIN="$M" python3 kit-page.py press-kit.html)
```

No test counts are written down anywhere (the strip under the hero on `site/index.html`, slide 7 in `launch/build.mjs`, `launch/copy.md`, and `README.md` and `SECURITY.md` on `main` all describe the tests without a number), so none has to be kept in step. `ONLY=carousel/07.png node launch/build.mjs` re-renders a single asset.

Every image uses the test suite's sample data. Never use `e2e/.out/shots/terminal-*.png` or `e2e/.out/live-pane.txt`: they come from a live session.
