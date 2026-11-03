# Landing page

`index.html` is the whole page: inline CSS and JS, no build step, no external requests. `404.html`, `robots.txt` and `sitemap.xml` sit beside it, and `img/` holds the pictures (WebP in the page, `social-card.png` for link previews, `overview.mp4` + `.vtt` for the tour).

## Placeholder domain

Every absolute URL uses the placeholder **`https://tobebestme.vercel.app`**: the canonical link, Open Graph and Twitter tags and the JSON-LD in `index.html`, plus `robots.txt` and `sitemap.xml`. To set the real one:

```bash
grep -rl "tobebestme.vercel.app" site | xargs sed -i '' 's#https://tobebestme.vercel.app#https://YOUR-DOMAIN#g'   # macOS; drop the '' on Linux
node site/tools/hash-csp.mjs   # only needed after editing the inline script
```

## Deploy (Vercel)

Set the project's root directory to `site/`. `vercel.json` gives clean URLs, a short cache for pages, a one-year cache for `img/*`, and security headers including a Content-Security-Policy that allows only this page's own files. The CSP pins the inline script by hash: run `node site/tools/hash-csp.mjs` after any change to it, or the script is blocked. Because `img/*` is cached for a year, give a changed picture a new file name.

GitHub Pages: `.github/workflows/pages.yml` publishes the same files from the `site` branch (the CSP and cache headers are Vercel-only).

`tools/shots.mjs` makes the product images from the e2e pages, on the test suite's sample data. The page's `.webp` files are made from those PNGs with `cwebp -q 86 -m 6`.

Motion is switched off for visitors who prefer reduced motion, and in automated browsers (`navigator.webdriver`); add `?still` to see that version.
