# Gold Desk — XAUUSD chart, risk calculator and trade journal

A trading desk for gold: a canvas candlestick chart (M15–D1, EMA 20/50) that draws your entry, stop and target; a position-size calculator ($100 per $1 move per lot); and a journal with win rate, profit factor, expectancy, drawdown and an equity curve.

## Highlights

- Seeded, **simulated** price series (not market data)
- Lots are rounded *down* so risk never exceeds the budget
- Journal in `localStorage`, export CSV/JSON, import with validation
- Keyboard-reachable controls, live-region messages

## Run it

Open `index.html` in a browser. Unit tests: `node --test` from the repository root.

Part of [Charon's portfolio](../../).
