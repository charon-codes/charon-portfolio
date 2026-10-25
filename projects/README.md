# Projects · پروژه‌ها

Five self-contained projects, each plain HTML + CSS + JavaScript (no frameworks, no build step, no network requests).
پنج پروژهٔ مستقل با HTML و CSS و جاوااسکریپت خالص، بدون فریم‌ورک و بدون درخواست شبکه.

| Project | What it shows | Tests |
|---|---|---|
| [`gold-desk`](gold-desk) | Canvas candlestick chart, XAUUSD position sizing & risk, trade journal + statistics, CSV/JSON export | lot sizing, P/L, stats, aggregation, EMA |
| [`nira-cafe`](nira-cafe) | Bilingual EN/FA site with RTL, ARIA tabs, live opening hours (Tehran time), validated form, `.ics` export | hours, validation, ICS |
| [`circuit-shop`](circuit-shop) | Filtering, sorting, persistent cart, free-shipping logic, `<dialog>` modals, checkout validation | filters, cart, totals, sanitizing |
| [`flow-board`](flow-board) | Kanban: drag & drop **and** keyboard/touch moves, undo, import validation | move invariants, sanitizing |
| [`pars-tools`](pars-tools) | Jalali ↔ Gregorian converter, number → Persian words, age calculator | **73,000 days cross-checked against ICU** |

## Conventions

- **Logic is separated from the DOM.** `logic.js` is a UMD module with pure functions, loaded by the page and by the unit tests (`node --test`).
- **Money is integer cents / rounded to cents** (a floating-point bug in P/L was caught by the tests).
- **Accessible by default:** labels, focus styles, live regions, keyboard alternatives to drag & drop, `prefers-reduced-motion`, light/dark where it fits.
- **Honest data:** prices in Gold Desk are *simulated*; the café, store and their products are *fictional* and labelled as such on the page.
- `projects/package.json` marks this folder as CommonJS so the UMD files load in Node too.

Run any project: open its `index.html` (or `npm run serve` from the repo root and visit `/projects/<name>/`).
