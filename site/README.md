# Landing page

`index.html` is the whole page: inline CSS and JS, no build step, no external requests. `404.html`, `robots.txt`, `sitemap.xml` and `favicon.ico` sit beside it, and `img/` holds the pictures: WebP files in the page (each also as `-800` and `-1600` wide copies, picked by `srcset`), PNG masters that are not deployed, `social-card-v6.png` for link previews, the icon files, and `overview-v7.mp4` with `overview-v7.vtt` for the tour.

## Placeholder domain

Every absolute URL uses the placeholder **`https://tobebestme.vercel.app`**: the canonical link, Open Graph and Twitter tags and the JSON-LD in `index.html`, plus `robots.txt` and `sitemap.xml`. To set the real one:

```bash
grep -rl "tobebestme.vercel.app" site | xargs sed -i '' 's#https://tobebestme.vercel.app#https://YOUR-DOMAIN#g'   # macOS; drop the '' on Linux
node site/tools/hash-csp.mjs   # only needed after editing the inline script
```

## Deploy (Vercel)

Set the project's root directory to `site/`. `vercel.json` gives clean URLs, a short cache for pages, a one-year cache only for image names that carry a version (`-v6`, as in `week-v6.webp`), a one-day cache for the rest of `img/`, a redirect from `/404` to the home page, and security headers including a Content-Security-Policy that allows only this page's own files. `.vercelignore` keeps the tools, this file and the PNG masters out of the deployment.

The CSP pins the inline script by hash. After any change to that script run `node site/tools/hash-csp.mjs`, or the script is blocked. `node site/tools/hash-csp.mjs --check` exits 1 when the hash is out of date: run it before every deploy.

A changed picture gets a new file name (`week-v6.webp`), because versioned names are cached for a year. Make the smaller copies from the PNG master:

```bash
cwebp -q 86 -m 6 week-v6.png -o week-v6.webp
cwebp -q 86 -m 6 -resize 800 0 week-v6.png -o week-v6-800.webp
cwebp -q 86 -m 6 -resize 1600 0 week-v6.png -o week-v6-1600.webp
```

`tools/shots.mjs` makes the product images from the e2e pages, on the test suite's sample data (see `launch/README.md` for the full rebuild).

## Behavior worth knowing

- Motion is switched off for visitors who prefer reduced motion, and in automated browsers (`navigator.webdriver`); add `?still` to see that version.
- With JavaScript off the page still reads: the interactive drawings are replaced by their text, and a `<noscript>` block says so.
- Below 981 px the section links move into a Menu button; each picture opens full size from its Enlarge button.
