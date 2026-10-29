# Landing page

`index.html` is the whole page: no build step, no external requests. `.github/workflows/pages.yml` publishes it with `img/` to GitHub Pages from the `site` branch. `tools/shots.mjs` makes the product images from the e2e pages, on the test suite's sample data.
