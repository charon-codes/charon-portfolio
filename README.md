# Charon — Portfolio · پورتفولیو

**EN** · Hand-coded, bilingual (English / Persian) portfolio. Plain HTML, CSS and JavaScript in the browser; a tiny zero-dependency Node script generates the two pages from JSON.
**FA** · پورتفولیوی دوزبانه (انگلیسی / فارسی). در مرورگر فقط HTML، CSS و جاوااسکریپت خالص است؛ یک اسکریپت کوچک Node (بدون وابستگی) دو صفحه را از فایل‌های JSON می‌سازد.

Live: https://charon-codes.github.io/charon-portfolio/ · `/fa/`

## Edit content · ویرایش محتوا

You only touch JSON. · فقط JSON را ویرایش می‌کنی.

| File | What it holds · چه چیزی |
|---|---|
| `src/content/shared.json` | email, links, CV paths, projects' links / screenshots / tags / year · ایمیل، لینک‌ها، رزومه، پروژه‌ها |
| `src/content/en.json` | all English copy · همهٔ متن انگلیسی |
| `src/content/fa.json` | all Persian copy · همهٔ متن فارسی |

```bash
npm run build     # regenerate index.html, fa/index.html, locales.js, sitemap.xml
npm run check     # validate + list what content is still missing (TODOs)
npm test          # build + check + unit tests
npm run serve     # http://localhost:8080
npm run fonts     # one-off: self-host the fonts (needs internet), then build again
```

Commit the generated files (`index.html`, `fa/index.html`, `assets/js/locales.js`, `sitemap.xml`) — GitHub Pages serves them as-is, no CI build needed. The CI workflow fails if you forget to commit them.

Adding a project: add an entry to `projects` in `shared.json` (id, links, tags, optional `image` like `assets/img/work/store.webp`), then add the same id with `title` / `desc` / `imageAlt` in both `en.json` and `fa.json`.
افزودن پروژه: یک آیتم در `shared.json` و همان `id` را با `title/desc/imageAlt` در `en.json` و `fa.json` اضافه کن.

## Structure · ساختار

```
projects/                   five tested demo projects (see projects/README.md)
tests/                     unit tests for the projects' logic (node --test)
src/
  template.html            page skeleton (shared by both languages)
  content/                 shared.json · en.json · fa.json
scripts/                   build.mjs · check.mjs · fonts.mjs
index.html                 English  →  /          (generated)
fa/index.html              Persian  →  /fa/       (generated)
assets/
  css/                     base · layout · components · rtl
  js/                      theme · locales(generated) · nav · ui · hero · terminal · lang
  img/                     favicon.svg · apple-touch-icon.png · og-cover.png
  cv/  fonts/              your CV PDFs · self-hosted fonts (after npm run fonts)
.github/workflows/ci.yml   build + validate on every push
404.html  robots.txt  sitemap.xml  .nojekyll
```

## Bilingual notes · نکات دوزبانگی

- Each language has its own URL with `lang`/`dir`, `canonical`, `hreflang` and `og:locale`, so both are indexed. · هر زبان آدرس جدا و تگ‌های سئوی خودش را دارد.
- CSS uses logical properties (`margin-inline-start`, `inset-inline-end`, …); `rtl.css` only handles Persian typography (no letter-spacing, Vazirmatn, taller line-height). · RTL تقریباً خودکار است.
- The language switcher remembers the choice and offers a dismissible hint; it never redirects automatically. · ریدایرکت اجباری ندارد.

## UX / quality built in

Mobile menu, scroll-spy nav, skip link, visible focus, reduced-motion support, AA-contrast colours in both themes, hero animation paused off-screen and in background tabs (capped particle count and pixel ratio), lazy-loaded project images, `noscript` fallback, JSON-LD, sitemap with `hreflang`.

## Deploy · انتشار

Push to `main` → GitHub → Settings → Pages → Deploy from branch → `main` / root.
If you add a custom domain, change `baseUrl` in `shared.json` and run `npm run build`.

MIT License
