/* logic.js — pure functions (no DOM). Works in the browser (window.GoldLogic) and in Node tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GoldLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var CONTRACT = 100; // XAUUSD: 1 standard lot = 100 troy oz, so a $1 move = $100 per lot

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /** Deterministic M15 random walk with volatility clustering. Simulated — NOT market data. */
  function genSeries(seed, count, start, startTime) {
    var rnd = mulberry32(seed), bars = [], price = start, vol = 1.1;
    for (var i = 0; i < count; i++) {
      vol = Math.max(0.5, Math.min(3.2, vol * 0.96 + Math.abs(gauss(rnd)) * 0.05 + 0.04));
      var o = price, drift = (start - price) * 0.0004;
      var c = o + drift + gauss(rnd) * vol;
      var h = Math.max(o, c) + Math.abs(gauss(rnd)) * vol * 0.45;
      var l = Math.min(o, c) - Math.abs(gauss(rnd)) * vol * 0.45;
      bars.push({ t: startTime + i * 900000, o: r2(o), h: r2(h), l: r2(l), c: r2(c) });
      price = c;
    }
    return bars;
  }
  function r2(x) { return Math.round(x * 100) / 100; }

  function aggregate(bars, n) {
    if (n <= 1) return bars.slice();
    var out = [];
    for (var i = 0; i + n <= bars.length; i += n) {
      var g = bars.slice(i, i + n), h = -Infinity, l = Infinity;
      for (var k = 0; k < g.length; k++) { if (g[k].h > h) h = g[k].h; if (g[k].l < l) l = g[k].l; }
      out.push({ t: g[0].t, o: g[0].o, h: h, l: l, c: g[g.length - 1].c });
    }
    return out;
  }

  function ema(values, period) {
    var k = 2 / (period + 1), out = [], prev = null;
    for (var i = 0; i < values.length; i++) {
      if (i < period - 1) { out.push(null); continue; }
      if (prev === null) { var s = 0; for (var j = i - period + 1; j <= i; j++) s += values[j]; prev = s / period; }
      else prev = values[i] * k + prev * (1 - k);
      out.push(prev);
    }
    return out;
  }

  /** Position sizing. Lots are rounded DOWN to the lot step so risk never exceeds the target. */
  function lotSize(p) {
    var contract = p.contract || CONTRACT, step = p.lotStep || 0.01, minLot = p.minLot || 0.01;
    var riskAmount = p.balance * (p.riskPct / 100);
    var stopDistance = Math.abs(p.entry - p.stop);
    if (!(p.balance > 0) || !(p.riskPct > 0) || !(stopDistance > 0)) return { valid: false, reason: "Enter a balance, a risk % and a stop that differs from the entry." };
    var raw = riskAmount / (stopDistance * contract);
    var lots = Math.floor(raw / step + 1e-9) * step;
    lots = Math.round(lots * 100) / 100;
    var tooSmall = lots < minLot;
    if (tooSmall) lots = 0;
    return { valid: true, riskAmount: riskAmount, stopDistance: stopDistance, rawLots: raw, lots: lots, ounces: r2(lots * contract), actualRisk: r2(lots * stopDistance * contract), tooSmall: tooSmall };
  }

  function validateSetup(dir, entry, stop, target) {
    var errs = [];
    if (dir === "long") { if (!(stop < entry)) errs.push("For a long, the stop must be below the entry."); if (target != null && !(target > entry)) errs.push("For a long, the target must be above the entry."); }
    else { if (!(stop > entry)) errs.push("For a short, the stop must be above the entry."); if (target != null && !(target < entry)) errs.push("For a short, the target must be below the entry."); }
    return errs;
  }
  function rewardRisk(entry, stop, target) { var risk = Math.abs(entry - stop); return risk > 0 ? Math.abs(target - entry) / risk : 0; }
  function margin(price, lots, leverage, contract) { return leverage > 0 ? (price * lots * (contract || CONTRACT)) / leverage : 0; }
  function pnl(t, contract) { return r2((t.exit - t.entry) * (t.dir === "long" ? 1 : -1) * t.lots * (contract || CONTRACT)); }

  function stats(trades, startBalance) {
    var sorted = trades.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id || 0) - (b.id || 0); });
    var equity = [startBalance], peak = startBalance, maxDD = 0, maxDDPct = 0, gw = 0, gl = 0, wins = 0, losses = 0, net = 0, best = null, worst = null;
    sorted.forEach(function (t) {
      var p = pnl(t); net += p;
      if (p > 0) { wins++; gw += p; } else if (p < 0) { losses++; gl += -p; }
      best = best === null ? p : Math.max(best, p); worst = worst === null ? p : Math.min(worst, p);
      var e = equity[equity.length - 1] + p; equity.push(e);
      if (e > peak) peak = e;
      var dd = peak - e; if (dd > maxDD) { maxDD = dd; maxDDPct = peak > 0 ? (dd / peak) * 100 : 0; }
    });
    var n = sorted.length;
    return { count: n, wins: wins, losses: losses, net: net, winRate: n ? (wins / n) * 100 : 0, avgWin: wins ? gw / wins : 0, avgLoss: losses ? gl / losses : 0,
      profitFactor: gl > 0 ? gw / gl : (gw > 0 ? Infinity : 0), expectancy: n ? net / n : 0, maxDrawdown: maxDD, maxDrawdownPct: maxDDPct, best: best, worst: worst, equity: equity, sorted: sorted };
  }

  function toCSV(trades) {
    var rows = [["date", "direction", "lots", "entry", "exit", "pnl", "note"]];
    trades.forEach(function (t) { rows.push([t.date, t.dir, t.lots, t.entry, t.exit, pnl(t).toFixed(2), '"' + String(t.note || "").replace(/"/g, '""') + '"']); });
    return rows.map(function (r) { return r.join(","); }).join("\n");
  }

  return { CONTRACT: CONTRACT, genSeries: genSeries, aggregate: aggregate, ema: ema, lotSize: lotSize, validateSetup: validateSetup, rewardRisk: rewardRisk, margin: margin, pnl: pnl, stats: stats, toCSV: toCSV, mulberry32: mulberry32 };
});
