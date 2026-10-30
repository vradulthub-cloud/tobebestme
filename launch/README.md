# Launch

Everything for launch day. It belongs on the `site` branch, not `main`, so installers don't download it.

- `STRATEGY.md`: the launch plan. `python3 strategy-page.py <out.html>` renders it as a page.
- `copy.md`: paste-ready posts and alt text. `python3 kit-page.py press-kit.html` builds the press kit from it.
- `build.mjs`: the social card, launch image, carousel (seven slides) and demo frames, laid out with the landing page's components. `video/`: the eight explainers.
- `make-demo.sh`: the demo video and GIF from the demo frames.

## Before you post

Four things only you can do:

- [ ] **Make the repository public.** Until then the install line and every link fail for anyone but you.
- [ ] **Turn on Pages.** Commit `site/` and `launch/` to a `site` branch and turn on Pages (Settings › Pages › GitHub Actions). Then swap the landing page link into the posts.
- [ ] **Upload the social preview.** Use `launch/out/social-card.png` under Settings › General › Social preview. GitHub has no API for this.
- [ ] **Post each piece yourself,** in the order and at the times in `STRATEGY.md`. Never ask anyone to upvote.

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
cp launch/out/social-card.png site/img/
# the videos (long: about 20 minutes for all eight); add names to render some
export PLAYWRIGHT_CORE="file://$M/e2e/node_modules/playwright-core/index.mjs"
node launch/video/render.mjs --web      # writes launch/out/video: .mp4, -web.mp4, .srt, .vtt, -poster.png
cp launch/out/video/overview.vtt site/img/overview.vtt
cp launch/out/video/overview-web.mp4 site/img/overview.mp4; cp launch/out/video/overview-poster.png site/img/overview-poster.png
cd launch && python3 kit-page.py press-kit.html
```

The landing page shows the rendering-test count once, in `site/index.html`, as `<span data-count="rendering-tests">`. Set it to the e2e suite's final figure; `copy.md` and `SECURITY.md` carry their own counts.

Every image uses the test suite's sample data. Never use `e2e/.out/shots/terminal-*.png` or `e2e/.out/live-pane.txt`: they come from a live session.
