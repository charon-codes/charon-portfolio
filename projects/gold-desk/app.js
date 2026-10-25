/* app.js — Gold Desk UI. Pure maths lives in logic.js (unit-tested). */
(function () {
  "use strict";
  var G = window.GoldLogic, $ = function (id) { return document.getElementById(id); };
  var KEY = "golddesk.v1";
  var TF = { M15: 1, H1: 4, H4: 16, D1: 96 };

  /* ---------- data ---------- */
  var BASE = G.genSeries(2026, 4800, 3200, Date.UTC(2026, 0, 5, 0, 0));
  var S = { tf: "H1", bars: [], ema20: [], ema50: [], count: 120, offset: 0, hover: -1, drag: null, setup: null };

  function setTf(tf) {
    S.tf = tf; S.bars = G.aggregate(BASE, TF[tf]);
    var closes = S.bars.map(function (b) { return b.c; });
    S.ema20 = G.ema(closes, 20); S.ema50 = G.ema(closes, 50);
    S.offset = 0; S.count = Math.min(120, S.bars.length); S.hover = -1;
    document.querySelectorAll("#tf button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tf === tf)); });
    draw();
  }

  /* ---------- chart ---------- */
  var cv = $("chart"), cx = cv.getContext("2d"), W = 0, H = 0;
  var PAD = { r: 84, b: 24, t: 10, l: 8 };
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function size() { var r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); cx.setTransform(d, 0, 0, d, 0, 0); }
  function range() { var end = S.bars.length - S.offset, start = Math.max(0, end - S.count); return { start: start, end: end }; }
  function fmtTime(t, long) { var d = new Date(t), m = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), day = d.getUTCDate(), hh = ("0" + d.getUTCHours()).slice(-2), mm = ("0" + d.getUTCMinutes()).slice(-2); return S.tf === "D1" && !long ? m + " " + day : m + " " + day + (S.tf === "D1" ? "" : " " + hh + ":" + mm); }

  function draw() {
    if (!W) size();
    cx.clearRect(0, 0, W, H);
    var r = range(), vis = S.bars.slice(r.start, r.end);
    if (!vis.length) return;
    var lo = Infinity, hi = -Infinity;
    vis.forEach(function (b) { if (b.l < lo) lo = b.l; if (b.h > hi) hi = b.h; });
    var ln = S.setup;
    if (ln) [ln.entry, ln.stop, ln.target].forEach(function (v) { if (isFinite(v) && v > 0) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    var padv = (hi - lo) * 0.06 || 1; lo -= padv; hi += padv;
    var pw = W - PAD.l - PAD.r, ph = H - PAD.t - PAD.b, bw = pw / S.count;
    var Y = function (p) { return PAD.t + (hi - p) / (hi - lo) * ph; };
    var up = css("--up"), dn = css("--down"), gold = css("--gold"), grid = css("--grid"), muted = css("--muted");
    cx.font = "11px ui-monospace,Menlo,Consolas,monospace"; cx.textBaseline = "middle";
    // grid + price axis
    var steps = 6;
    for (var i = 0; i <= steps; i++) {
      var p = lo + (hi - lo) * i / steps, y = Y(p);
      cx.strokeStyle = grid; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(PAD.l, y); cx.lineTo(W - PAD.r, y); cx.stroke();
      cx.fillStyle = muted; cx.textAlign = "left"; cx.fillText(p.toFixed(2), W - PAD.r + 6, y);
    }
    // time axis
    cx.textAlign = "center"; cx.fillStyle = muted;
    var every = Math.max(1, Math.round(90 / bw));
    for (var k = 0; k < vis.length; k += every) { cx.fillText(fmtTime(vis[k].t), PAD.l + (k + 0.5) * bw, H - 10); }
    // EMAs
    function line(arr, color) {
      cx.strokeStyle = color; cx.lineWidth = 1.4; cx.beginPath(); var on = false;
      for (var j = r.start; j < r.end; j++) { var v = arr[j]; if (v == null) continue; var x = PAD.l + (j - r.start + 0.5) * bw, y = Y(v); on ? cx.lineTo(x, y) : cx.moveTo(x, y); on = true; }
      cx.stroke();
    }
    if ($("ema20").checked) line(S.ema20, "#60a5fa");
    if ($("ema50").checked) line(S.ema50, "#c084fc");
    // candles
    vis.forEach(function (b, j) {
      var x = PAD.l + (j + 0.5) * bw, col = b.c >= b.o ? up : dn, top = Y(Math.max(b.o, b.c)), bot = Y(Math.min(b.o, b.c));
      cx.strokeStyle = col; cx.fillStyle = col; cx.lineWidth = 1;
      cx.beginPath(); cx.moveTo(x, Y(b.h)); cx.lineTo(x, Y(b.l)); cx.stroke();
      cx.fillRect(x - Math.max(1, bw * 0.34), top, Math.max(2, bw * 0.68), Math.max(1, bot - top));
    });
    // trade setup lines
    if (ln) {
      [["entry", gold, "ENTRY"], ["stop", dn, "SL"], ["target", up, "TP"]].forEach(function (d) {
        var v = ln[d[0]]; if (!isFinite(v) || v <= 0) return; var y = Y(v);
        cx.setLineDash([6, 4]); cx.strokeStyle = d[1]; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(PAD.l, y); cx.lineTo(W - PAD.r, y); cx.stroke(); cx.setLineDash([]);
        cx.fillStyle = d[1]; cx.fillRect(W - PAD.r, y - 9, PAD.r, 18); cx.fillStyle = "#0b0e16"; cx.textAlign = "left"; cx.fillText(d[2] + " " + v.toFixed(1), W - PAD.r + 4, y);
      });
    }
    // last price tag (skipped when the entry tag sits on top of it)
    var last = S.bars[r.end - 1], ly = Y(last.c), hideLast = ln && isFinite(ln.entry) && Math.abs(Y(ln.entry) - ly) < 11;
    if (!hideLast) { cx.strokeStyle = last.c >= last.o ? up : dn; cx.setLineDash([2, 3]); cx.beginPath(); cx.moveTo(PAD.l, ly); cx.lineTo(W - PAD.r, ly); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = last.c >= last.o ? up : dn; cx.fillRect(W - PAD.r, ly - 9, PAD.r, 18); cx.fillStyle = "#04110f"; cx.textAlign = "left"; cx.fillText(last.c.toFixed(2), W - PAD.r + 6, ly); }
    // crosshair
    if (S.hover >= 0 && S.hover < vis.length) {
      var hb = vis[S.hover], hx = PAD.l + (S.hover + 0.5) * bw;
      cx.setLineDash([3, 4]); cx.strokeStyle = muted; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(hx, PAD.t); cx.lineTo(hx, H - PAD.b); cx.stroke(); cx.setLineDash([]);
      readout(r.start + S.hover);
    }
  }
  function readout(i) {
    var b = S.bars[i], chg = ((b.c - b.o) / b.o) * 100, e20 = S.ema20[i], e50 = S.ema50[i];
    $("readout").textContent = fmtTime(b.t, true) + "  O " + b.o.toFixed(2) + "  H " + b.h.toFixed(2) + "  L " + b.l.toFixed(2) + "  C " + b.c.toFixed(2) + "  " + (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%" + (e20 != null ? "  EMA20 " + e20.toFixed(2) : "") + (e50 != null ? "  EMA50 " + e50.toFixed(2) : "");
  }
  function hoverFrom(e) { var rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, bw = (W - PAD.l - PAD.r) / S.count, j = Math.floor((x - PAD.l) / bw), n = range().end - range().start; S.hover = j >= 0 && j < n ? j : -1; }
  cv.addEventListener("pointermove", function (e) {
    if (S.drag) {
      var bw = (W - PAD.l - PAD.r) / S.count, d = Math.round((e.clientX - S.drag.x) / bw);
      S.offset = Math.max(0, Math.min(S.bars.length - S.count, S.drag.off + d));
    }
    hoverFrom(e); draw();
  });
  cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); S.drag = { x: e.clientX, off: S.offset }; });
  cv.addEventListener("pointerup", function () { S.drag = null; });
  cv.addEventListener("pointerleave", function () { S.hover = -1; $("readout").textContent = "Hover the chart"; draw(); });
  cv.addEventListener("wheel", function (e) { if (!e.ctrlKey) return; e.preventDefault(); zoom(e.deltaY < 0 ? 0.85 : 1.18); }, { passive: false });
  function zoom(f) { S.count = Math.max(20, Math.min(S.bars.length, Math.round(S.count * f))); S.offset = Math.min(S.offset, S.bars.length - S.count); draw(); }
  $("zin").onclick = function () { zoom(0.8); }; $("zout").onclick = function () { zoom(1.25); }; $("zreset").onclick = function () { S.offset = 0; draw(); };
  document.querySelectorAll("#tf button").forEach(function (b) { b.onclick = function () { setTf(b.dataset.tf); }; });
  ["ema20", "ema50"].forEach(function (id) { $(id).onchange = draw; });
  addEventListener("resize", function () { size(); draw(); drawEquity(); });
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () { draw(); drawEquity(); });

  /* ---------- calculator ---------- */
  var f = function (id) { var v = parseFloat($(id).value); return isFinite(v) ? v : NaN; };
  var money = function (v) { return (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function lastClose() { return S.bars[S.bars.length - 1].c; }
  function calc() {
    var dir = $("dir").value, entry = f("entry"), stop = f("stop"), target = f("target");
    S.setup = { entry: entry, stop: stop, target: target }; draw();
    var msg = $("calc-msg"), out = $("results"); msg.className = "msg"; out.innerHTML = "";
    if (!isFinite(entry) || !isFinite(stop)) { msg.textContent = "Enter an entry and a stop loss."; return; }
    var errs = G.validateSetup(dir, entry, stop, isFinite(target) ? target : null);
    if (errs.length) { msg.textContent = errs[0]; return; }
    var r = G.lotSize({ balance: f("balance"), riskPct: f("riskPct"), entry: entry, stop: stop });
    if (!r.valid) { msg.textContent = r.reason; return; }
    msg.textContent = r.tooSmall ? "Risk is too small for even 0.01 lot at this stop distance. Widen the risk % or tighten the stop." : "";
    var rows = [["big", "Position size", r.lots.toFixed(2) + " lots"], ["", "Risk budget", money(r.riskAmount)], ["", "Actual risk", money(r.actualRisk)], ["", "Stop distance", "$" + r.stopDistance.toFixed(2) + "/oz"], ["", "Size in ounces", r.ounces.toFixed(0) + " oz"], ["", "Margin (1:" + (f("leverage") || 0) + ")", money(G.margin(entry, r.lots, f("leverage")))]];
    if (isFinite(target)) { var rr = G.rewardRisk(entry, stop, target); rows.push(["", "Reward : risk", "1 : " + rr.toFixed(2)], ["", "Potential profit", money(r.lots * Math.abs(target - entry) * G.CONTRACT)]); }
    out.innerHTML = rows.map(function (x) { return '<div class="' + x[0] + '"><dt>' + x[1] + "</dt><dd>" + x[2] + "</dd></div>"; }).join("");
  }
  ["balance", "riskPct", "entry", "stop", "target", "leverage"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("dir").addEventListener("change", function () { var e = f("entry"), s = f("stop"), t = f("target"); if (isFinite(e) && isFinite(s)) { $("stop").value = (2 * e - s).toFixed(2); if (isFinite(t)) $("target").value = (2 * e - t).toFixed(2); } calc(); });
  $("useLast").onclick = function () { var p = lastClose(), d = $("dir").value === "long" ? 1 : -1; $("entry").value = p.toFixed(2); $("stop").value = (p - d * 15).toFixed(2); $("target").value = (p + d * 30).toFixed(2); calc(); };
  $("rr2").onclick = function () { var e = f("entry"), s = f("stop"); if (!isFinite(e) || !isFinite(s)) return; $("target").value = (e + (e - s) * 2).toFixed(2); calc(); };
  $("calc-form").addEventListener("submit", function (e) { e.preventDefault(); });

  /* ---------- journal ---------- */
  var trades = load();
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(trades)); } catch (e) { /* storage unavailable: keep working in memory */ } }
  function nextId() { return trades.reduce(function (m, t) { return Math.max(m, t.id || 0); }, 0) + 1; }
  function renderJournal() {
    var body = document.querySelector("#trades tbody"); body.innerHTML = "";
    var sorted = trades.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id; });
    sorted.forEach(function (t) {
      var p = G.pnl(t), tr = document.createElement("tr");
      [[t.date], [t.dir === "long" ? "Long" : "Short"], [t.lots.toFixed(2), "num"], [t.entry.toFixed(2), "num"], [t.exit.toFixed(2), "num"], [money(p), "num " + (p >= 0 ? "pos" : "neg")], [t.note || "", "note-c"]].forEach(function (c) { var td = document.createElement("td"); td.textContent = c[0]; if (c[1]) td.className = c[1]; tr.appendChild(td); });
      var td = document.createElement("td"), b = document.createElement("button"); b.type = "button"; b.textContent = "×"; b.setAttribute("aria-label", "Delete trade from " + t.date);
      b.onclick = function () { trades = trades.filter(function (x) { return x.id !== t.id; }); save(); renderJournal(); }; td.appendChild(b); tr.appendChild(td); body.appendChild(tr);
    });
    $("empty").style.display = trades.length ? "none" : "block";
    var s = G.stats(trades, f("balance") || 0), st = $("stats");
    var cell = function (l, v, cls) { return "<div><span>" + l + "</span><b class='" + (cls || "") + "'>" + v + "</b></div>"; };
    st.innerHTML = cell("Net P/L", money(s.net), s.net >= 0 ? "pos" : "neg") + cell("Trades", s.count) + cell("Win rate", s.winRate.toFixed(0) + "%") + cell("Profit factor", s.profitFactor === Infinity ? "∞" : s.profitFactor.toFixed(2)) + cell("Expectancy", money(s.expectancy), s.expectancy >= 0 ? "pos" : "neg") + cell("Avg win / loss", money(s.avgWin) + " / " + money(s.avgLoss)) + cell("Max drawdown", money(-s.maxDrawdown) + " (" + s.maxDrawdownPct.toFixed(1) + "%)", "neg");
    drawEquity(s);
  }
  function drawEquity(s) {
    s = s || G.stats(trades, f("balance") || 0);
    var c = $("equity"), g = c.getContext("2d"), r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2), w = r.width, h = r.height;
    c.width = Math.round(w * d); c.height = Math.round(h * d); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    var e = s.equity, muted = css("--muted"), up = css("--up"), dn = css("--down");
    g.font = "11px ui-monospace,Menlo,Consolas,monospace"; g.fillStyle = muted;
    if (e.length < 2) { g.textAlign = "center"; g.fillText("Equity curve appears after your first trade", w / 2, h / 2); return; }
    var lo = Math.min.apply(null, e), hi = Math.max.apply(null, e), pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
    var X = function (i) { return 12 + i * (w - 24) / (e.length - 1); }, Y = function (v) { return 10 + (hi - v) / (hi - lo) * (h - 20); };
    g.strokeStyle = muted; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(0, Y(e[0])); g.lineTo(w, Y(e[0])); g.stroke(); g.setLineDash([]);
    g.strokeStyle = e[e.length - 1] >= e[0] ? up : dn; g.lineWidth = 2; g.beginPath(); e.forEach(function (v, i) { i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)); }); g.stroke();
    g.textAlign = "left"; g.fillText(money(e[e.length - 1]), 14, 16);
  }
  $("trade-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var t = { id: nextId(), date: $("t-date").value, dir: $("t-dir").value, lots: parseFloat($("t-lots").value), entry: parseFloat($("t-entry").value), exit: parseFloat($("t-exit").value), note: $("t-note").value.trim() };
    var m = $("trade-msg"); m.className = "msg";
    if (!t.date || !(t.lots > 0) || !isFinite(t.entry) || !isFinite(t.exit)) { m.textContent = "Fill in the date, lots, entry and exit."; return; }
    trades.push(t); save(); renderJournal(); m.className = "msg ok"; m.textContent = "Trade added: " + money(G.pnl(t)); $("t-note").value = "";
  });
  $("sample").onclick = function () {
    var rnd = G.mulberry32(11), base = new Date(Date.UTC(2026, 0, 12)), i, id = nextId();
    for (i = 0; i < 16; i++) {
      var d = new Date(base.getTime() + i * 86400000 * 1.6), dir = rnd() > 0.45 ? "long" : "short", entry = 3200 + Math.round((rnd() - 0.5) * 120 * 100) / 100, win = rnd() < 0.55, mv = (win ? 1 : -0.55) * (6 + rnd() * 20);
      trades.push({ id: id++, date: d.toISOString().slice(0, 10), dir: dir, lots: [0.05, 0.1, 0.1, 0.2][Math.floor(rnd() * 4)], entry: entry, exit: Math.round((entry + (dir === "long" ? mv : -mv)) * 100) / 100, note: win ? "Followed plan" : "Stopped out" });
    }
    save(); renderJournal();
  };
  $("clearAll").onclick = function () { if (!trades.length || confirm("Delete all journal entries?")) { trades = []; save(); renderJournal(); } };
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); }
  $("exportCsv").onclick = function () { download("gold-desk-journal.csv", G.toCSV(trades), "text/csv"); };
  $("exportJson").onclick = function () { download("gold-desk-journal.json", JSON.stringify(trades, null, 2), "application/json"); };
  $("importJson").onchange = function (e) {
    var file = e.target.files[0]; if (!file) return; var rd = new FileReader(), m = $("trade-msg");
    rd.onload = function () {
      try {
        var v = JSON.parse(rd.result); if (!Array.isArray(v)) throw 0;
        var ok = v.filter(function (t) { return t && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && (t.dir === "long" || t.dir === "short") && isFinite(t.lots) && isFinite(t.entry) && isFinite(t.exit); });
        var id = nextId(); ok.forEach(function (t) { trades.push({ id: id++, date: t.date, dir: t.dir, lots: +t.lots, entry: +t.entry, exit: +t.exit, note: String(t.note || "").slice(0, 120) }); });
        save(); renderJournal(); m.className = "msg ok"; m.textContent = "Imported " + ok.length + " of " + v.length + " entries.";
      } catch (err) { m.className = "msg"; m.textContent = "That file is not a valid journal export."; }
    };
    rd.readAsText(file); e.target.value = "";
  };
  $("balance").addEventListener("input", function () { renderJournal(); });

  /* ---------- init ---------- */
  $("t-date").value = new Date().toISOString().slice(0, 10);
  setTf("H1"); $("useLast").click(); renderJournal();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { size(); draw(); });
})();
