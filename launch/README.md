# Launch

Everything for launch day. It belongs on the `site` branch, not `main`, so installers don't download it.

- `STRATEGY.md`: the launch plan. `python3 strategy-page.py <out.html>` renders it as a page.
- `copy.md`: paste-ready posts and alt text. `python3 kit-page.py press-kit.html` builds the press kit from it.
- `build.mjs`: the social card, launch image, carousel and demo frames, laid out with the landing page's components.
- `make-demo.sh`: the demo video and GIF from the demo frames.

## Before you post

Four things only you can do:

- [ ] **Make the repository public.** Until then the install line and every link fail for anyone but you.
- [ ] **Turn on Pages.** Commit `site/` and `launch/` to a `site` branch and turn on Pages (Settings › Pages › GitHub Actions). Then swap the landing page link into the posts.
- [ ] **Upload the social preview.** Use `launch/out/social-card.png` under Settings › General › Social preview. GitHub has no API for this.
- [ ] **Post each piece yourself,** in the order and at the times in `STRATEGY.md`. Never ask anyone to upvote.

## Rebuild

Rebuild after a UI change, from the repository root:

```bash
cd e2e && node lib/export.mjs && cd ..
node site/tools/shots.mjs
node launch/shots.mjs
node launch/build.mjs && sh launch/make-demo.sh
cp launch/out/social-card.png site/img/
# captions for the landing page's tour video: the .srt as WebVTT
(echo WEBVTT; echo; sed 's/\([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\),\([0-9][0-9][0-9]\)/\1.\2/g' launch/out/video/overview.srt) > site/img/overview.vtt
cd launch && python3 kit-page.py press-kit.html
```

The landing page shows the rendering-test count once, in `site/index.html`, as `<span data-count="rendering-tests">`. Set it to the e2e suite's final figure; `copy.md` and `SECURITY.md` carry their own counts.

Every image uses the test suite's sample data. Never use `e2e/.out/shots/terminal-*.png` or `e2e/.out/live-pane.txt`: they come from a live session.
