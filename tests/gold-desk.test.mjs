import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const G = createRequire(import.meta.url)("../projects/gold-desk/logic.js");

test("lotSize: 1% of $10,000 with a $15 stop = 0.06 lots (rounded down)", () => {
  const r = G.lotSize({ balance: 10000, riskPct: 1, entry: 3200, stop: 3185 });
  assert.equal(r.valid, true);
  assert.equal(r.riskAmount, 100);
  assert.equal(r.stopDistance, 15);
  assert.equal(r.lots, 0.06);
  assert.equal(r.actualRisk, 90);
  assert.ok(r.actualRisk <= r.riskAmount);
});
test("lotSize: works for shorts and never exceeds the risk budget", () => {
  for (const [bal, risk, entry, stop] of [[5000, 2, 3300, 3312.4], [250, 0.5, 3100, 3090], [100000, 0.25, 3250.5, 3244.1]]) {
    const r = G.lotSize({ balance: bal, riskPct: risk, entry, stop });
    assert.ok(r.actualRisk <= r.riskAmount + 1e-9, `risk ${r.actualRisk} > ${r.riskAmount}`);
  }
});
test("lotSize: flags a risk too small for 0.01 lot and invalid input", () => {
  assert.equal(G.lotSize({ balance: 100, riskPct: 0.5, entry: 3200, stop: 3150 }).tooSmall, true);
  assert.equal(G.lotSize({ balance: 100, riskPct: 1, entry: 3200, stop: 3200 }).valid, false);
  assert.equal(G.lotSize({ balance: 0, riskPct: 1, entry: 3200, stop: 3190 }).valid, false);
});
test("validateSetup checks stop/target sides for both directions", () => {
  assert.deepEqual(G.validateSetup("long", 3200, 3190, 3230), []);
  assert.deepEqual(G.validateSetup("short", 3200, 3210, 3170), []);
  assert.equal(G.validateSetup("long", 3200, 3210, 3230).length, 1);
  assert.equal(G.validateSetup("short", 3200, 3190, 3230).length, 2);
});
test("rewardRisk and margin", () => {
  assert.equal(G.rewardRisk(3200, 3190, 3230), 3);
  assert.equal(G.margin(3200, 0.1, 100), 320);
});
test("pnl uses a $100 per $1 move per lot contract", () => {
  assert.equal(G.pnl({ dir: "long", entry: 3200, exit: 3215, lots: 0.06 }), 90);
  assert.equal(G.pnl({ dir: "short", entry: 3200, exit: 3215, lots: 0.1 }), -150);
});
test("stats: win rate, profit factor, expectancy and drawdown", () => {
  const trades = [
    { id: 1, date: "2026-01-01", dir: "long", lots: 0.1, entry: 3000, exit: 3010 },  // +100
    { id: 2, date: "2026-01-02", dir: "long", lots: 0.1, entry: 3010, exit: 3000 },  // -100
    { id: 3, date: "2026-01-03", dir: "short", lots: 0.1, entry: 3000, exit: 3020 }, // -200
    { id: 4, date: "2026-01-04", dir: "short", lots: 0.2, entry: 3000, exit: 2985 }, // +300
  ];
  const s = G.stats(trades, 1000);
  assert.equal(s.count, 4); assert.equal(s.wins, 2); assert.equal(s.losses, 2);
  assert.equal(s.winRate, 50); assert.equal(s.net, 100); assert.equal(s.expectancy, 25);
  assert.equal(s.profitFactor, 400 / 300);
  assert.equal(s.maxDrawdown, 300);
  assert.deepEqual(s.equity, [1000, 1100, 1000, 800, 1100]);
  assert.equal(G.stats([], 1000).count, 0);
});
test("aggregate keeps OHLC semantics", () => {
  const bars = [{ t: 0, o: 1, h: 5, l: 0, c: 2 }, { t: 1, o: 2, h: 4, l: 1, c: 3 }, { t: 2, o: 3, h: 9, l: 2, c: 8 }, { t: 3, o: 8, h: 8, l: -1, c: 7 }];
  const a = G.aggregate(bars, 2);
  assert.deepEqual(a, [{ t: 0, o: 1, h: 5, l: 0, c: 3 }, { t: 2, o: 3, h: 9, l: -1, c: 7 }]);
});
test("genSeries is deterministic and produces valid candles", () => {
  const a = G.genSeries(7, 500, 3200, 0), b = G.genSeries(7, 500, 3200, 0);
  assert.deepEqual(a, b);
  for (const k of a) { assert.ok(k.h >= Math.max(k.o, k.c) && k.l <= Math.min(k.o, k.c)); }
});
test("ema warms up then tracks", () => {
  const e = G.ema([1, 2, 3, 4, 5], 3);
  assert.deepEqual(e.slice(0, 2), [null, null]);
  assert.equal(e[2], 2); assert.equal(e[3], 3); assert.equal(e[4], 4);
});
test("toCSV escapes quotes", () => {
  const csv = G.toCSV([{ date: "2026-01-01", dir: "long", lots: 0.1, entry: 1, exit: 2, note: 'say "hi"' }]);
  assert.ok(csv.includes('"say ""hi"""'));
});
